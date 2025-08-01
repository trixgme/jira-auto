'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IssueCard } from '@/components/issue-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ProjectSelector } from '@/components/project-selector';
import { ThemeToggle } from '@/components/theme-toggle';
import { IssuesChart } from '@/components/issues-chart';
import { Navigation } from '@/components/navigation';
import { LogoutButton } from '@/components/logout-button';
import { LanguageSelector } from '@/components/language-selector';
import { Search, X, FileText, RefreshCw } from 'lucide-react';
import { LoadingProgress } from '@/components/loading-progress';
import { ReportDialog } from '@/components/report-dialog';
import { DateRangePicker } from '@/components/date-range-picker';
import type { JiraIssue, JiraProject, IssueDifficulty } from '@/lib/types';
import { DifficultyCache } from '@/lib/difficulty-cache';
import { useLanguage } from '@/contexts/language-context';

interface DashboardData {
  newIssues: JiraIssue[];
  completedIssues: JiraIssue[];
  projects: JiraProject[];
  loading: boolean;
  error: string | null;
  cachedAt?: number;
}

export function Dashboard() {
  const { t, language } = useLanguage();
  
  // 데이터 캐시 상태 (로컬스토리지에서 복원)
  const [dataCache, setDataCache] = useState<Record<string, DashboardData>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dashboard-data-cache');
        if (saved) {
          const parsed = JSON.parse(saved);
          console.log('💾 로컬스토리지에서 대시보드 캐시 복원:', Object.keys(parsed));
          return parsed;
        }
      } catch (error) {
        console.error('대시보드 캐시 복원 실패:', error);
      }
    }
    return {};
  });

  const [data, setData] = useState<DashboardData>({
    newIssues: [],
    completedIssues: [],
    projects: [],
    loading: true,
    error: null,
  });

  const [daysBack, setDaysBack] = useState(7);
  const [selectedProject, setSelectedProject] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{startDate: Date | null; endDate: Date | null}>({
    startDate: null,
    endDate: null
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [issuesDifficulty, setIssuesDifficulty] = useState<Record<string, IssueDifficulty>>(() => {
    if (typeof window !== 'undefined') {
      return DifficultyCache.getAll();
    }
    return {};
  });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportGenerationStep, setReportGenerationStep] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<{
    report: string;
    reportType: 'ai' | 'basic';
    chartData: any;
    dateRange?: {
      startDate: string;
      endDate: string;
    } | null;
    period?: number;
  } | null>(null);

  // 캐시 키 생성 함수
  const getCacheKey = useCallback(() => {
    if (dateRange.startDate && dateRange.endDate) {
      const startStr = dateRange.startDate.toISOString().split('T')[0];
      const endStr = dateRange.endDate.toISOString().split('T')[0];
      return `${language}-${selectedProject}-${startStr}-${endStr}`;
    }
    return `${language}-${selectedProject}-${daysBack}days`;
  }, [language, selectedProject, daysBack, dateRange.startDate, dateRange.endDate]);

  // 로컬스토리지에 캐시 저장 (용량 제한 관리)
  const saveCacheToStorage = useCallback((newCache: Record<string, DashboardData>) => {
    if (typeof window !== 'undefined') {
      try {
        // 캐시 항목 수 제한 (최대 5개)
        const cacheEntries = Object.entries(newCache);
        if (cacheEntries.length > 5) {
          // 가장 오래된 캐시 삭제
          cacheEntries.sort((a, b) => (b[1].cachedAt || 0) - (a[1].cachedAt || 0));
          const limitedCache = Object.fromEntries(cacheEntries.slice(0, 5));
          localStorage.setItem('dashboard-data-cache', JSON.stringify(limitedCache));
          console.log('💾 대시보드 캐시 용량 제한으로 5개 항목만 유지');
        } else {
          localStorage.setItem('dashboard-data-cache', JSON.stringify(newCache));
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.warn('⚠️ 로컬스토리지 용량 초과 - 캐시 초기화');
          // 용량 초과 시 모든 캐시 삭제
          localStorage.removeItem('dashboard-data-cache');
          // 현재 데이터만 저장
          const currentKey = getCacheKey();
          const currentData = newCache[currentKey];
          if (currentData) {
            try {
              localStorage.setItem('dashboard-data-cache', JSON.stringify({ [currentKey]: currentData }));
            } catch (e) {
              console.error('현재 캐시 저장도 실패:', e);
            }
          }
        } else {
          console.error('대시보드 캐시 저장 실패:', error);
        }
      }
    }
  }, [getCacheKey]);

  useEffect(() => {
    fetchProjects();
  }, [language]);

  useEffect(() => {
    if (data.projects.length > 0) {
      fetchDashboardDataWithCache();
    }
  }, [language, daysBack, selectedProject, data.projects.length, dateRange.startDate, dateRange.endDate]);


  const fetchProjects = async () => {
    try {
      setLoadingStep(0);
      const response = await fetch(`/api/jira/projects?language=${language}`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const projectsData = await response.json();
      setData(prev => ({ ...prev, projects: projectsData.projects }));
    } catch (error) {
      console.error('Error fetching projects:', error);
      setData(prev => ({
        ...prev,
        error: 'Failed to load projects. Please check your Jira configuration.',
      }));
    }
  };

  // 캐시를 확인하고 필요시 새 데이터를 가져오는 함수
  const fetchDashboardDataWithCache = async () => {
    const cacheKey = getCacheKey();
    const CACHE_DURATION = 5 * 60 * 1000; // 5분 캐시 유지
    
    console.log(`🔍 대시보드 데이터 요청: ${cacheKey}`);
    
    // 캐시된 데이터 확인
    const cachedData = dataCache[cacheKey];
    if (cachedData && !cachedData.loading && !cachedData.error) {
      const now = Date.now();
      const cacheAge = now - (cachedData.cachedAt || 0);
      
      if (cacheAge < CACHE_DURATION) {
        console.log(`✅ 대시보드 데이터 캐시 사용: ${cacheKey} (나이: ${Math.round(cacheAge/1000)}s)`);
        setData(cachedData);
        return;
      } else {
        console.log(`⏰ 대시보드 캐시 만료: ${cacheKey} (나이: ${Math.round(cacheAge/1000)}s)`);
      }
    } else {
      console.log(`❌ 대시보드 캐시 없음: ${cacheKey}`);
    }
    
    // 새 데이터 가져오기
    await fetchDashboardData(cacheKey);
  };

  const fetchDashboardData = async (cacheKey: string) => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      setLoadingStep(0);

      const projectParam = selectedProject !== 'all' ? `&project=${selectedProject}` : '';
      
      // 날짜 범위 파라미터 생성 (KST 기준)
      let dateParam = '';
      if (dateRange.startDate && dateRange.endDate) {
        const getKSTDateString = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        
        const startDateStr = getKSTDateString(dateRange.startDate);
        const endDateStr = getKSTDateString(dateRange.endDate);
        console.log(`날짜 범위 API 호출: ${startDateStr} ~ ${endDateStr}`);
        dateParam = `&startDate=${startDateStr}&endDate=${endDateStr}`;
      } else {
        dateParam = `&days=${daysBack}`;
      }
      
      console.log('모든 이슈를 가져오는 중... (시간이 조금 걸릴 수 있습니다)');
      
      setLoadingStep(1); // 새로운 이슈 조회 중
      const newIssuesRes = await fetch(`/api/jira/new-issues?${dateParam.slice(1)}${projectParam}&language=${language}`);
      
      if (!newIssuesRes.ok) {
        throw new Error('Failed to fetch new issues');
      }
      
      const newIssuesData = await newIssuesRes.json();
      
      setLoadingStep(2); // 완료된 이슈 조회 중
      const completedIssuesRes = await fetch(`/api/jira/completed-issues?${dateParam.slice(1)}${projectParam}&language=${language}`);
      
      if (!completedIssuesRes.ok) {
        throw new Error('Failed to fetch completed issues');  
      }
      
      const completedIssuesData = await completedIssuesRes.json();

      setLoadingStep(3); // 데이터 처리 중

      console.log(`새로운 이슈: ${newIssuesData.issues.length}개, 완료된 이슈: ${completedIssuesData.issues.length}개`);

      // 클라이언트 측 추가 필터링 (시간대 보정)
      let filteredNewIssues = newIssuesData.issues;
      let filteredCompletedIssues = completedIssuesData.issues;
      
      if (daysBack === 1 && !dateRange.startDate && !dateRange.endDate) {
        // "오늘" 선택 시 필터링
        const getTodayKST = () => {
          const now = new Date();
          const kstOffset = 9 * 60; // UTC+9 (분 단위)
          const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
          return kstTime.toISOString().split('T')[0];
        };
        
        const today = getTodayKST();
        console.log(`"오늘" 선택 - 클라이언트 측 필터링 기준 날짜: ${today}`);
        
        const getKSTDate = (dateString: string) => {
          const date = new Date(dateString);
          const kstOffset = 9 * 60; // UTC+9 (분 단위)
          const kstTime = new Date(date.getTime() + kstOffset * 60 * 1000);
          return kstTime.toISOString().split('T')[0];
        };
        
        // 새로운 이슈 필터링 (생성일 기준, KST)
        filteredNewIssues = newIssuesData.issues.filter((issue: JiraIssue) => {
          const createdDateKST = getKSTDate(issue.fields.created);
          const isToday = createdDateKST === today;
          if (!isToday) {
            console.log(`이슈 ${issue.key} 제외: 생성일 ${createdDateKST} ≠ 오늘 ${today}`);
          }
          return isToday;
        });
        
        // 완료된 이슈 필터링 (완료일 기준, KST)
        filteredCompletedIssues = completedIssuesData.issues.filter((issue: JiraIssue) => {
          if (!issue.fields.resolutiondate) {
            console.log(`이슈 ${issue.key} 제외: 완료일 없음`);
            return false;
          }
          const resolvedDateKST = getKSTDate(issue.fields.resolutiondate);
          const isToday = resolvedDateKST === today;
          if (!isToday) {
            console.log(`이슈 ${issue.key} 제외: 완료일 ${resolvedDateKST} ≠ 오늘 ${today}`);
          }
          return isToday;
        });
        
        console.log(`클라이언트 필터링 후 - 새로운 이슈: ${filteredNewIssues.length}개, 완료된 이슈: ${filteredCompletedIssues.length}개`);
      } else if (dateRange.startDate && dateRange.endDate) {
        // 날짜 범위 선택 시 필터링
        const getKSTDateString = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        
        const startDateStr = getKSTDateString(dateRange.startDate);
        const endDateStr = getKSTDateString(dateRange.endDate);
        console.log(`날짜 범위 클라이언트 필터링: ${startDateStr} ~ ${endDateStr}`);
        
        // 새로운 이슈 필터링 (생성일 기준)
        filteredNewIssues = newIssuesData.issues.filter((issue: JiraIssue) => {
          const createdDate = new Date(issue.fields.created);
          const createdDateStr = getKSTDateString(createdDate);
          const isInRange = createdDateStr >= startDateStr && createdDateStr <= endDateStr;
          if (!isInRange) {
            console.log(`이슈 ${issue.key} 제외: 생성일 ${createdDateStr}이 범위 ${startDateStr}~${endDateStr} 밖`);
          }
          return isInRange;
        });
        
        // 완료된 이슈 필터링 (완료일 기준)
        filteredCompletedIssues = completedIssuesData.issues.filter((issue: JiraIssue) => {
          if (!issue.fields.resolutiondate) {
            console.log(`이슈 ${issue.key} 제외: 완료일 없음`);
            return false;
          }
          const resolvedDate = new Date(issue.fields.resolutiondate);
          const resolvedDateStr = getKSTDateString(resolvedDate);
          const isInRange = resolvedDateStr >= startDateStr && resolvedDateStr <= endDateStr;
          if (!isInRange) {
            console.log(`이슈 ${issue.key} 제외: 완료일 ${resolvedDateStr}이 범위 ${startDateStr}~${endDateStr} 밖`);
          }
          return isInRange;
        });
        
        console.log(`날짜 범위 클라이언트 필터링 후 - 새로운 이슈: ${filteredNewIssues.length}개, 완료된 이슈: ${filteredCompletedIssues.length}개`);
      }

      const dashboardData: DashboardData = {
        newIssues: filteredNewIssues,
        completedIssues: filteredCompletedIssues,
        projects: data.projects, // 프로젝트 정보 유지
        loading: false,
        error: null,
        cachedAt: Date.now()
      };

      setData(dashboardData);
      
        // 캐시에 저장
        const newCache = {
          ...dataCache,
          [cacheKey]: dashboardData
        };
        setDataCache(newCache);
        saveCacheToStorage(newCache);
      
      console.log(`💾 대시보드 데이터 캐시 저장: ${cacheKey}`);
      setLoadingStep(0); // 완료
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load dashboard data. Please check your Jira configuration.',
      }));
      setLoadingStep(0);
    }
  };

  const filterIssues = (issues: JiraIssue[]) => {
    if (!activeSearchQuery.trim()) return issues;
    
    const query = activeSearchQuery.toLowerCase();
    return issues.filter(issue => 
      issue.fields.summary.toLowerCase().includes(query) ||
      issue.key.toLowerCase().includes(query) ||
      issue.fields.project.name.toLowerCase().includes(query) ||
      (issue.fields.assignee?.displayName || '').toLowerCase().includes(query)
    );
  };

  const filteredNewIssues = filterIssues(data.newIssues);
  const filteredCompletedIssues = filterIssues(data.completedIssues);

  const handleDifficultyAnalyzed = useCallback((issueKey: string, difficulty: IssueDifficulty) => {
    setIssuesDifficulty(prev => ({
      ...prev,
      [issueKey]: difficulty
    }));
    DifficultyCache.set(issueKey, difficulty);
  }, []);

  const enhanceIssueWithDifficulty = useCallback((issue: JiraIssue): JiraIssue => {
    return {
      ...issue,
      difficulty: issuesDifficulty[issue.key]
    };
  }, [issuesDifficulty]);

  const loadingSteps = [
    t('loading_project_info'),
    t('loading_new_issues'),
    t('loading_completed_issues'),
    t('loading_data_processing')
  ];

  const reportGenerationSteps = [
    t('report_gen_preparing'),
    t('report_gen_data_analysis'),
    t('report_gen_ai_request'),
    t('report_gen_processing'),
    t('report_gen_finalizing')
  ];

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // 텍스트가 완전히 지워지면 검색 초기화
    if (!value.trim()) {
      setActiveSearchQuery('');
    }
  }, []);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setActiveSearchQuery(searchQuery);
    }
  }, [searchQuery]);

  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
    setActiveSearchQuery('');
    // 포커스 유지
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  }, []);

  const generateReport = async () => {
    if (filteredCompletedIssues.length === 0) {
      alert(t('no_completed_issues_to_analyze'));
      return;
    }

    setIsGeneratingReport(true);
    setReportGenerationStep(0);
    
    try {
      setReportGenerationStep(1); // 데이터 준비 중
      
      await new Promise(resolve => setTimeout(resolve, 500)); // 사용자가 단계를 볼 수 있도록 잠시 대기
      
      setReportGenerationStep(2); // AI 분석 요청 중
      
      const response = await fetch('/api/ai/analyze-completed-issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issues: filteredCompletedIssues,
          period: daysBack,
          project: selectedProject,
          dateRange: dateRange.startDate && dateRange.endDate ? {
            startDate: dateRange.startDate.toISOString().split('T')[0],
            endDate: dateRange.endDate.toISOString().split('T')[0]
          } : null,
          language: language
        }),
      });

      setReportGenerationStep(3); // 응답 처리 중

      if (!response.ok) {
        throw new Error(t('report_generation_failed'));
      }

      const data = await response.json();
      
      setReportGenerationStep(4); // 보고서 준비 중
      
      setReportData({
        ...data,
        dateRange: dateRange.startDate && dateRange.endDate ? {
          startDate: dateRange.startDate.toISOString().split('T')[0],
          endDate: dateRange.endDate.toISOString().split('T')[0]
        } : null,
        period: daysBack
      });
      setShowReport(true);
    } catch (error) {
      console.error('Error generating report:', error);
      alert(t('report_generation_error'));
    } finally {
      setIsGeneratingReport(false);
      setReportGenerationStep(0);
    }
  };

  // 캐시 무시하고 새로고침
  const refreshData = async () => {
    const cacheKey = getCacheKey();
    console.log(`🔄 대시보드 데이터 새로고침: ${cacheKey}`);
    
    // 해당 캐시 삭제
    const newCache = { ...dataCache };
    delete newCache[cacheKey];
    setDataCache(newCache);
    saveCacheToStorage(newCache);
    
    // 새 데이터 가져오기
    await fetchDashboardData(cacheKey);
  };

  const DaysSelector = () => (
    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
      <div className="flex gap-2 items-center">
        <span className="text-sm text-muted-foreground">{t('quick_select')}</span>
        {[1, 7, 14, 30].map((days) => (
          <Badge
            key={days}
            variant={daysBack === days && !dateRange.startDate && !dateRange.endDate ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => {
              setDaysBack(days);
              setDateRange({ startDate: null, endDate: null });
            }}
          >
            {days === 1 ? t('today') : t('n_days', days)}
          </Badge>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t('or')}</span>
        <DateRangePicker
          value={dateRange}
          onChange={(range) => {
            setDateRange(range);
            if (range.startDate && range.endDate) {
              setDaysBack(0); // 사용자 정의 범위일 때는 daysBack 비활성화
            }
          }}
          className="w-64"
        />
      </div>
    </div>
  );

  const SearchBar = useMemo(() => (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={searchInputRef}
        placeholder={t('search_placeholder')}
        value={searchQuery}
        onChange={handleSearchChange}
        onKeyDown={handleSearchKeyDown}
        className="pl-10 pr-10"
      />
      {searchQuery && (
        <button
          onClick={handleSearchClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  ), [searchQuery, handleSearchChange, handleSearchKeyDown, handleSearchClear, t]);

  if (data.error) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">{t('error')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{data.error}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('check_env_config')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <h1 className="text-2xl sm:text-3xl font-bold">{t('jira_dashboard')}</h1>
            <div className="sm:block">
              <Navigation />
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              onClick={refreshData}
              disabled={data.loading}
              size="sm"
              variant="outline"
              title={t('refresh_data')}
            >
              <RefreshCw className={`h-4 w-4 ${data.loading ? 'animate-spin' : ''}`} />
            </Button>
            <LanguageSelector />
            <LogoutButton />
            <ThemeToggle />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <ProjectSelector
                projects={data.projects}
                selectedProject={selectedProject}
                onProjectChange={setSelectedProject}
              />
              <DaysSelector />
              {activeSearchQuery && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {t('search')}: {activeSearchQuery}
                  </Badge>
                </div>
              )}
            </div>
            <div className="w-full lg:w-80">
              {SearchBar}
            </div>
          </div>
          {activeSearchQuery && (
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t('search_results', filteredNewIssues.length, filteredCompletedIssues.length)}
            </div>
          )}
        </div>
      </div>

      {/* 로딩 프로그레스 바 */}
      {data.loading && (
        <div className="mb-6">
          <LoadingProgress
            isLoading={data.loading}
            steps={loadingSteps}
            currentStep={loadingStep}
          />
        </div>
      )}

      {/* AI 보고서 생성 프로그레스 바 */}
      {isGeneratingReport && (
        <div className="mb-6">
          <LoadingProgress
            isLoading={isGeneratingReport}
            steps={reportGenerationSteps}
            currentStep={reportGenerationStep}
          />
        </div>
      )}

      {/* 차트 섹션 */}
      <div className="mb-6">
        {data.loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <IssuesChart 
            newIssues={data.newIssues}
            completedIssues={data.completedIssues}
            daysBack={daysBack}
            dateRange={dateRange}
          />
        )}
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{t('newly_added_issues')}</span>
                <Badge>{filteredNewIssues.length}</Badge>
              </div>
            </CardTitle>
            <CardDescription>
              {dateRange.startDate && dateRange.endDate 
                ? t('issues_created_date_range', dateRange.startDate.toLocaleDateString('ko-KR'), dateRange.endDate.toLocaleDateString('ko-KR'))
                : t('issues_created_recent', daysBack === 1 ? t('today') : t('n_days', daysBack))
              }
              {activeSearchQuery && t('with_search', activeSearchQuery)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {data.loading ? (
                <>
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </>
              ) : filteredNewIssues.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {activeSearchQuery ? t('no_search_results') : t('no_new_issues')}
                </p>
              ) : (
                filteredNewIssues.map((issue) => (
                  <IssueCard 
                    key={issue.id} 
                    issue={enhanceIssueWithDifficulty(issue)}
                    onDifficultyAnalyzed={handleDifficultyAnalyzed}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{t('completed_issues')}</span>
                <Badge>{filteredCompletedIssues.length}</Badge>
              </div>
              <Button
                onClick={generateReport}
                disabled={isGeneratingReport || filteredCompletedIssues.length === 0}
                size="sm"
                variant="outline"
                className="text-xs font-medium border-purple-500 bg-purple-500 text-white hover:bg-purple-600 hover:border-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="h-3 w-3 mr-1 text-white" />
                {isGeneratingReport ? t('generating') : t('generate_ai_report')}
              </Button>
            </CardTitle>
            <CardDescription>
              {dateRange.startDate && dateRange.endDate 
                ? t('issues_completed_date_range', dateRange.startDate.toLocaleDateString('ko-KR'), dateRange.endDate.toLocaleDateString('ko-KR'))
                : t('issues_completed_recent', daysBack === 1 ? t('today') : t('n_days', daysBack))
              }
              {activeSearchQuery && t('with_search', activeSearchQuery)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {data.loading ? (
                <>
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </>
              ) : filteredCompletedIssues.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {activeSearchQuery ? t('no_search_results') : t('no_completed_issues')}
                </p>
              ) : (
                filteredCompletedIssues.map((issue) => (
                  <IssueCard 
                    key={issue.id} 
                    issue={enhanceIssueWithDifficulty(issue)}
                    onDifficultyAnalyzed={handleDifficultyAnalyzed}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <ReportDialog
        open={showReport}
        onOpenChange={setShowReport}
        reportData={reportData}
        title={t('ai_analysis_report')}
      />
    </div>
  );
}