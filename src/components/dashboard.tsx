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
import { Search, X, FileText } from 'lucide-react';
import { LoadingProgress } from '@/components/loading-progress';
import { ReportDialog } from '@/components/report-dialog';
import { DateRangePicker } from '@/components/date-range-picker';
import type { JiraIssue, JiraProject, IssueDifficulty } from '@/lib/types';
import { DifficultyCache } from '@/lib/difficulty-cache';

interface DashboardData {
  newIssues: JiraIssue[];
  completedIssues: JiraIssue[];
  projects: JiraProject[];
  loading: boolean;
  error: string | null;
}

export function Dashboard() {
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

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (data.projects.length > 0) {
      fetchDashboardData();
    }
  }, [daysBack, selectedProject, data.projects.length, dateRange]);


  const fetchProjects = async () => {
    try {
      setLoadingStep(0);
      const response = await fetch('/api/jira/projects');
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

  const fetchDashboardData = async () => {
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
      const newIssuesRes = await fetch(`/api/jira/new-issues?${dateParam.slice(1)}${projectParam}`);
      
      if (!newIssuesRes.ok) {
        throw new Error('Failed to fetch new issues');
      }
      
      const newIssuesData = await newIssuesRes.json();
      
      setLoadingStep(2); // 완료된 이슈 조회 중
      const completedIssuesRes = await fetch(`/api/jira/completed-issues?${dateParam.slice(1)}${projectParam}`);
      
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

      setData(prev => ({
        ...prev,
        newIssues: filteredNewIssues,
        completedIssues: filteredCompletedIssues,
        loading: false,
        error: null,
      }));
      
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
    '프로젝트 정보 조회 중...',
    '새로운 이슈 조회 중...',
    '완료된 이슈 조회 중...',
    '데이터 처리 중...'
  ];

  const reportGenerationSteps = [
    '보고서 생성 준비 중...',
    '데이터 분석 준비 중...',
    'AI 분석 요청 중...',
    '분석 결과 처리 중...',
    '보고서 구성 중...'
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
      alert('분석할 완료된 이슈가 없습니다.');
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
          } : null
        }),
      });

      setReportGenerationStep(3); // 응답 처리 중

      if (!response.ok) {
        throw new Error('보고서 생성에 실패했습니다.');
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
      alert('보고서 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingReport(false);
      setReportGenerationStep(0);
    }
  };

  const DaysSelector = () => (
    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
      <div className="flex gap-2 items-center">
        <span className="text-sm text-muted-foreground">빠른 선택:</span>
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
            {days === 1 ? '오늘' : `${days}일`}
          </Badge>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">또는</span>
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
        placeholder="이슈 제목, 키, 프로젝트, 담당자로 검색... (Enter로 검색)"
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
  ), [searchQuery, handleSearchChange, handleSearchKeyDown, handleSearchClear]);

  if (data.error) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{data.error}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              .env.local 파일에 Jira 설정이 올바르게 되어있는지 확인해주세요.
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
            <h1 className="text-2xl sm:text-3xl font-bold">Jira Dashboard</h1>
            <div className="sm:block">
              <Navigation />
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
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
                    검색: {activeSearchQuery}
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
              검색 결과: 새로운 이슈 {filteredNewIssues.length}개, 완료된 이슈 {filteredCompletedIssues.length}개
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
              새로 추가된 이슈
              <Badge>{filteredNewIssues.length}</Badge>
            </CardTitle>
            <CardDescription>
              {dateRange.startDate && dateRange.endDate 
                ? `${dateRange.startDate.toLocaleDateString('ko-KR')} ~ ${dateRange.endDate.toLocaleDateString('ko-KR')} 생성된 이슈`
                : `최근 ${daysBack === 1 ? '오늘' : `${daysBack}일간`} 생성된 이슈`
              }
              {activeSearchQuery && ` (검색: "${activeSearchQuery}")`}
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
                  {activeSearchQuery ? '검색 결과가 없습니다.' : '새로 추가된 이슈가 없습니다.'}
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
              완료된 이슈
              <div className="flex items-center gap-2">
                <Button
                  onClick={generateReport}
                  disabled={isGeneratingReport || filteredCompletedIssues.length === 0}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  {isGeneratingReport ? '분석중...' : 'AI 보고서'}
                </Button>
                <Badge>{filteredCompletedIssues.length}</Badge>
              </div>
            </CardTitle>
            <CardDescription>
              {dateRange.startDate && dateRange.endDate 
                ? `${dateRange.startDate.toLocaleDateString('ko-KR')} ~ ${dateRange.endDate.toLocaleDateString('ko-KR')} 완료된 이슈`
                : `최근 ${daysBack === 1 ? '오늘' : `${daysBack}일간`} 완료된 이슈`
              }
              {activeSearchQuery && ` (검색: "${activeSearchQuery}")`}
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
                  {activeSearchQuery ? '검색 결과가 없습니다.' : '완료된 이슈가 없습니다.'}
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
        title="완료된 이슈 AI 분석 보고서"
      />
    </div>
  );
}