'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/theme-toggle';
import { Navigation } from '@/components/navigation';
import { LoadingProgress } from '@/components/loading-progress';
import { LogoutButton } from '@/components/logout-button';
import { DateRangePicker } from '@/components/date-range-picker';
import { Users, Bug, CheckCircle, Clock, TrendingUp, ChevronUp, ChevronDown, ChevronsUpDown, ExternalLink, Star, Sparkles, Loader2, MessageSquare, RefreshCw } from 'lucide-react';
import type { JiraIssue, JiraProject, IssueDifficulty, CommentAnalysis } from '@/lib/types';
import { DifficultyBadge } from '@/components/difficulty-badge';
import { DifficultyDialog } from '@/components/difficulty-dialog';
import { CommentAnalysisDialog } from '@/components/comment-analysis-dialog';
import { Button } from '@/components/ui/button';
import { DifficultyCache } from '@/lib/difficulty-cache';
import { useLanguage } from '@/contexts/language-context';
import { LanguageSelector } from '@/components/language-selector';
import { KpiScoreCard } from '@/components/kpi-score-card';
import { calculateKpiScore, type KpiScoreBreakdown } from '@/lib/kpi-score';
import { GradientProgress } from '@/components/ui/gradient-progress';

interface UserKpi {
  user: string;
  assigned: number;
  resolved: number;
  unresolved: number;
  avgResolutionTime: number; // days
}

interface KpiData {
  userKpis: UserKpi[];
  totalIssues: number;
  totalResolved: number;
  totalUnresolved: number;
  loading: boolean;
  error: string | null;
  cachedAt?: number; // 캐시 시간 (타임스탬프)
}

interface UserIssues {
  [user: string]: JiraIssue[];
}

export function KpiDashboard() {
  const { t, language } = useLanguage();
  const [data, setData] = useState<KpiData>({
    userKpis: [],
    totalIssues: 0,
    totalResolved: 0,
    totalUnresolved: 0,
    loading: true,
    error: null,
  });

  // 데이터 캐시를 위한 상태 (로컬스토리지에서 복원)
  const [dataCache, setDataCache] = useState<Record<string, KpiData>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('kpi-data-cache');
        if (saved) {
          const parsed = JSON.parse(saved);
          console.log('💾 로컬스토리지에서 KPI 캐시 복원:', Object.keys(parsed));
          return parsed;
        }
      } catch (error) {
        console.error('KPI 캐시 복원 실패:', error);
      }
    }
    return {};
  });

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 현재 월로 초기화
  const [dateRange, setDateRange] = useState<{startDate: Date | null; endDate: Date | null}>({
    startDate: null,
    endDate: null
  });
  const [loadingStep, setLoadingStep] = useState(0);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof UserKpi | 'resolutionRate';
    direction: 'asc' | 'desc';
  } | null>({ key: 'assigned', direction: 'desc' }); // 기본값: 할당된 이슈 수 내림차순
  const [userIssues, setUserIssues] = useState<UserIssues>({}); // 사용자별 이슈 저장
  const [jiraCloudUrl, setJiraCloudUrl] = useState<string>('');
  const [favoriteUsers, setFavoriteUsers] = useState<Set<string>>(new Set());
  const [selectedUserFilter, setSelectedUserFilter] = useState<'all' | 'todo' | 'completed'>('all');
  const [analyzingIssues, setAnalyzingIssues] = useState<Set<string>>(new Set());
  const [issuesDifficulty, setIssuesDifficulty] = useState<Record<string, IssueDifficulty>>(() => {
    if (typeof window !== 'undefined') {
      return DifficultyCache.getAll();
    }
    return {};
  });
  const [showDifficultyDialog, setShowDifficultyDialog] = useState<string | null>(null);
  const [analyzingComments, setAnalyzingComments] = useState<Set<string>>(new Set());
  const [commentsAnalysis, setCommentsAnalysis] = useState<Record<string, CommentAnalysis>>({});
  const [showCommentAnalysisDialog, setShowCommentAnalysisDialog] = useState<string | null>(null);
  const [selectedUserKpiScore, setSelectedUserKpiScore] = useState<{user: string; score: KpiScoreBreakdown} | null>(null);
  const [showKpiScoreDialog, setShowKpiScoreDialog] = useState(false);

  useEffect(() => {
    loadFavoriteUsers();
    fetchJiraConfig();
  }, []);

  // selectedMonth나 dateRange가 변경될 때만 데이터 새로고침
  useEffect(() => {
    fetchKpiDataWithCache();
  }, [language, selectedMonth, dateRange.startDate, dateRange.endDate]);

  // 캐시 키 생성 함수
  const getCacheKey = () => {
    if (dateRange.startDate && dateRange.endDate) {
      const startStr = dateRange.startDate.toISOString().split('T')[0];
      const endStr = dateRange.endDate.toISOString().split('T')[0];
      return `${language}_range_${startStr}_${endStr}`;
    }
    return `${language}_month_${selectedMonth}`;
  };

  // 캐시된 데이터 확인 후 필요시에만 새로 가져오기
  const fetchKpiDataWithCache = async () => {
    const cacheKey = getCacheKey();
    const CACHE_DURATION = 5 * 60 * 1000; // 5분 캐시 유지
    
    // 캐시된 데이터가 있는지 확인
    const cachedData = dataCache[cacheKey];
    if (cachedData && !cachedData.loading && !cachedData.error) {
      // 캐시 만료 시간 확인
      const now = Date.now();
      const cacheAge = now - (cachedData.cachedAt || 0);
      
      if (cacheAge < CACHE_DURATION) {
        console.log(`✅ KPI 데이터 캐시 사용: ${cacheKey} (나이: ${Math.round(cacheAge/1000)}s)`);
        setData(cachedData);
        return;
      } else {
        console.log(`⏰ KPI 캐시 만료됨: ${cacheKey} (나이: ${Math.round(cacheAge/1000)}s)`);
      }
    }
    
    console.log(`🔄 KPI 데이터 새로 가져오기: ${cacheKey}`);
    console.log('현재 캐시 상태:', Object.keys(dataCache));
    await fetchKpiData(cacheKey);
  };

  // 강제 새로고침 (캐시 무시)
  const refreshData = async () => {
    const cacheKey = getCacheKey();
    console.log(`🔄 KPI 데이터 강제 새로고침: ${cacheKey}`);
    
    // 캐시에서 제거
    setDataCache(prev => {
      const newCache = { ...prev };
      delete newCache[cacheKey];
      
      // 로컬스토리지도 업데이트
      try {
        localStorage.setItem('kpi-data-cache', JSON.stringify(newCache));
      } catch (error) {
        console.error('KPI 캐시 로컬스토리지 업데이트 실패:', error);
      }
      
      return newCache;
    });
    
    await fetchKpiData(cacheKey);
  };

  const loadFavoriteUsers = () => {
    try {
      const saved = localStorage.getItem('jira-favorite-users');
      if (saved) {
        setFavoriteUsers(new Set(JSON.parse(saved)));
      }
    } catch (error) {
      console.error('Failed to load favorite users:', error);
    }
  };

  const saveFavoriteUsers = (favorites: Set<string>) => {
    try {
      localStorage.setItem('jira-favorite-users', JSON.stringify(Array.from(favorites)));
    } catch (error) {
      console.error('Failed to save favorite users:', error);
    }
  };

  const toggleFavoriteUser = (username: string) => {
    const newFavorites = new Set(favoriteUsers);
    if (newFavorites.has(username)) {
      newFavorites.delete(username);
    } else {
      newFavorites.add(username);
    }
    setFavoriteUsers(newFavorites);
    saveFavoriteUsers(newFavorites);
  };

  const fetchJiraConfig = async () => {
    try {
      const response = await fetch('/api/jira/config');
      if (response.ok) {
        const config = await response.json();
        setJiraCloudUrl(config.jiraCloudUrl);
      }
    } catch (error) {
      console.error('Failed to fetch Jira config:', error);
    }
  };

  const fetchKpiData = async (cacheKey: string) => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      setLoadingStep(0);

      setLoadingStep(1); // 프로젝트 정보 조회 중
      const projectsRes = await fetch(`/api/jira/projects?language=${language}`);
      
      if (!projectsRes.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const projectsData = await projectsRes.json();

      setLoadingStep(2); // 이슈 데이터 조회 중
      
      // 날짜 범위 파라미터 생성 (KST 기준)
      let queryParams = '';
      if (dateRange.startDate && dateRange.endDate) {
        const getKSTDateString = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        
        const startDateStr = getKSTDateString(dateRange.startDate);
        const endDateStr = getKSTDateString(dateRange.endDate);
        console.log(`KPI 날짜 범위 API 호출: ${startDateStr} ~ ${endDateStr}`);
        queryParams = `startDate=${startDateStr}&endDate=${endDateStr}`;
      } else {
        queryParams = `month=${selectedMonth}`;
      }
      
      const allIssuesRes = await fetch(`/api/jira/all-issues?${queryParams}&language=${language}`);
      
      if (!allIssuesRes.ok) {
        throw new Error('Failed to fetch issues');
      }
      
      const allIssuesData = await allIssuesRes.json();
      let issues: JiraIssue[] = allIssuesData.issues || [];

      // 날짜 범위 선택 시 클라이언트 측 추가 필터링 (시간대 보정)
      if (dateRange.startDate && dateRange.endDate) {
        const getKSTDateString = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        
        const startDateStr = getKSTDateString(dateRange.startDate);
        const endDateStr = getKSTDateString(dateRange.endDate);
        console.log(`KPI 날짜 범위 클라이언트 필터링: ${startDateStr} ~ ${endDateStr}`);
        
        // 생성일 기준으로 필터링
        issues = issues.filter((issue: JiraIssue) => {
          const createdDate = new Date(issue.fields.created);
          const createdDateStr = getKSTDateString(createdDate);
          const isInRange = createdDateStr >= startDateStr && createdDateStr <= endDateStr;
          if (!isInRange) {
            console.log(`KPI 이슈 ${issue.key} 제외: 생성일 ${createdDateStr}이 범위 ${startDateStr}~${endDateStr} 밖`);
          }
          return isInRange;
        });
        
        console.log(`KPI 날짜 범위 클라이언트 필터링 후: ${issues.length}개`);
      }

      setLoadingStep(3); // KPI 데이터 계산 중
      
      console.log('처리할 이슈 개수:', issues.length);
      console.log('첫 번째 이슈 예시:', issues[0] ? {
        key: issues[0].key,
        status: issues[0].fields.status.name,
        assignee: issues[0].fields.assignee?.displayName
      } : 'no issues');

      // 담당자별 KPI 계산
      const userStats = new Map<string, {
        assigned: JiraIssue[];
        resolved: JiraIssue[];
        unresolved: JiraIssue[];
      }>();
      
      const userIssuesMap: UserIssues = {}; // 사용자별 이슈 목록 저장

      issues.forEach(issue => {
        // 담당자가 있는 이슈만 처리
        const assignee = issue.fields.assignee?.displayName;
        if (!assignee) {
          return; // 담당자가 없는 이슈는 건너뛰기
        }
        
        // 담당자별 통계 초기화
        if (!userStats.has(assignee)) {
          userStats.set(assignee, { assigned: [], resolved: [], unresolved: [] });
          userIssuesMap[assignee] = []; // 사용자별 이슈 목록 초기화
        }

        const stats = userStats.get(assignee)!;
        stats.assigned.push(issue);
        userIssuesMap[assignee].push(issue); // 사용자별 이슈 목록에 추가

        // 해결/미해결 분류 (상태 카테고리로 확인)
        const isResolved = issue.fields.status.statusCategory?.key === 'done' || 
                          ['Done', 'Resolved', 'Closed', 'Complete', 'Fixed'].includes(issue.fields.status.name);
        
        console.log(`이슈 ${issue.key}: 담당자=${assignee}, 상태=${issue.fields.status.name}, 카테고리=${issue.fields.status.statusCategory?.key}, 해결됨=${isResolved}`);
        
        if (isResolved) {
          stats.resolved.push(issue);
        } else {
          stats.unresolved.push(issue);
        }
      });
      
      // 사용자별 이슈 목록 저장
      setUserIssues(userIssuesMap);

      // UserKpi 배열 생성
      const userKpis: UserKpi[] = Array.from(userStats.entries()).map(([user, stats]) => {
        // 평균 해결 시간 계산 (생성일에서 완료일까지)
        let avgResolutionTime = 0;
        const resolvedWithDates = stats.resolved.filter(issue => issue.fields.resolutiondate);
        
        if (resolvedWithDates.length > 0) {
          const totalDays = resolvedWithDates.reduce((sum, issue) => {
            const created = new Date(issue.fields.created).getTime();
            const resolved = new Date(issue.fields.resolutiondate!).getTime();
            return sum + Math.ceil((resolved - created) / (1000 * 60 * 60 * 24));
          }, 0);
          avgResolutionTime = Math.round(totalDays / resolvedWithDates.length);
        }

        return {
          user,
          assigned: stats.assigned.length,
          resolved: stats.resolved.length,
          unresolved: stats.unresolved.length,
          avgResolutionTime,
        };
      });

      const totalIssues = issues.length;
      const totalResolved = issues.filter(issue => {
        const isResolved = issue.fields.status.statusCategory?.key === 'done' || 
                          ['Done', 'Resolved', 'Closed', 'Complete', 'Fixed'].includes(issue.fields.status.name);
        return isResolved;
      }).length;
      const totalUnresolved = totalIssues - totalResolved;

      console.log(`전체 통계: 총 ${totalIssues}개, 해결 ${totalResolved}개, 미해결 ${totalUnresolved}개`);

      setLoadingStep(4); // 완료

      const newData = {
        userKpis,
        totalIssues,
        totalResolved,
        totalUnresolved,
        loading: false,
        error: null,
        cachedAt: Date.now(), // 캐시 시간 추가
      };
      
      setData(newData);
      
      // 캐시에 저장
      setDataCache(prev => {
        const newCache = {
          ...prev,
          [cacheKey]: newData
        };
        console.log(`💾 KPI 데이터 캐시 저장: ${cacheKey}`, newCache);
        
        // 로컬스토리지에도 저장
        try {
          localStorage.setItem('kpi-data-cache', JSON.stringify(newCache));
        } catch (error) {
          console.error('KPI 캐시 로컬스토리지 저장 실패:', error);
        }
        
        return newCache;
      });
      
      setLoadingStep(0); // 리셋

    } catch (error) {
      console.error('Error fetching KPI data:', error);
      const errorData = {
        userKpis: [],
        totalIssues: 0,
        totalResolved: 0,
        totalUnresolved: 0,
        loading: false,
        error: t('kpi_fetch_fail_check_config'),
      };
      
      setData(errorData);
      
      // 에러도 캐시에 저장하지 않음 (재시도 가능하도록)
      setLoadingStep(0);
    }
  };

  const getJiraIssueUrl = (issueKey: string) => {
    if (!jiraCloudUrl) {
      return '#'; // Jira URL이 없을 때는 링크 비활성화
    }
    return `${jiraCloudUrl}/browse/${issueKey}`;
  };

  const handleSort = (key: keyof UserKpi | 'resolutionRate') => {
    let direction: 'asc' | 'desc' = 'desc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    
    setSortConfig({ key, direction });
  };

  const getSortedUserKpis = () => {
    if (!sortConfig) return data.userKpis;

    return [...data.userKpis].sort((a, b) => {
      // 즐겨찾기 사용자를 우선 정렬
      const aIsFavorite = favoriteUsers.has(a.user);
      const bIsFavorite = favoriteUsers.has(b.user);
      
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;

      let aValue: number;
      let bValue: number;

      if (sortConfig.key === 'resolutionRate') {
        aValue = a.assigned > 0 ? Math.round((a.resolved / a.assigned) * 100) : 0;
        bValue = b.assigned > 0 ? Math.round((b.resolved / b.assigned) * 100) : 0;
      } else if (sortConfig.key === 'user') {
        return sortConfig.direction === 'asc' 
          ? a.user.localeCompare(b.user)
          : b.user.localeCompare(a.user);
      } else {
        aValue = a[sortConfig.key] as number;
        bValue = b[sortConfig.key] as number;
      }

      if (sortConfig.direction === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  };

  const getSortIcon = (columnKey: keyof UserKpi | 'resolutionRate') => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-primary" />
      : <ChevronDown className="w-4 h-4 text-primary" />;
  };

  const filterUserIssues = (issues: JiraIssue[], filter: 'all' | 'todo' | 'completed') => {
    if (filter === 'all') return issues;
    
    return issues.filter(issue => {
      const isResolved = issue.fields.status.statusCategory?.key === 'done' || 
        ['Done', 'Resolved', 'Closed', 'Complete', 'Fixed'].includes(issue.fields.status.name);
      
      if (filter === 'completed') return isResolved;
      if (filter === 'todo') return !isResolved;
      
      return true;
    });
  };

  const getFilteredIssuesCount = (issues: JiraIssue[], filter: 'all' | 'todo' | 'completed') => {
    return filterUserIssues(issues, filter).length;
  };

  const analyzeDifficulty = async (issue: JiraIssue) => {
    const issueKey = issue.key;
    setAnalyzingIssues(prev => new Set(prev).add(issueKey));
    
    try {
      const response = await fetch('/api/ai/analyze-difficulty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: issue.fields.summary,
          description: issue.fields.description,
          issueType: issue.fields.issuetype?.name,
          labels: issue.fields.labels,
          issueKey: issue.key,
          priority: issue.fields.priority?.name,
          components: issue.fields.components?.map(c => c.name),
          fixVersions: issue.fields.fixVersions?.map(v => v.name),
          commentCount: issue.fields.comment?.total,
          storyPoints: issue.fields.customfield_10016,
          timeEstimate: issue.fields.timetracking?.originalEstimate,
          status: issue.fields.status.name,
          language: language,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const newDifficulty = { ...result, analyzedAt: new Date() };
        setIssuesDifficulty(prev => ({
          ...prev,
          [issueKey]: newDifficulty
        }));
        DifficultyCache.set(issueKey, newDifficulty);
        setShowDifficultyDialog(issueKey);
      } else {
        const error = await response.json();
        console.error('AI analysis failed:', error);
        alert(`${t('ai_analysis_failed', error.error || 'Unknown error')}`);
      }
    } catch (error) {
      console.error('Failed to analyze difficulty:', error);
    } finally {
      setAnalyzingIssues(prev => {
        const newSet = new Set(prev);
        newSet.delete(issueKey);
        return newSet;
      });
    }
  };

  const analyzeComments = async (issue: JiraIssue) => {
    const issueKey = issue.key;
    setAnalyzingComments(prev => new Set(prev).add(issueKey));
    
    try {
      const response = await fetch('/api/ai/analyze-comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issueKey: issue.key,
          issueTitle: issue.fields.summary,
          issueDescription: issue.fields.description,
          language: language,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const analysis = { ...result, analyzedAt: new Date() };
        setCommentsAnalysis(prev => ({
          ...prev,
          [issueKey]: analysis
        }));
        setShowCommentAnalysisDialog(issueKey);
      } else {
        const error = await response.json();
        console.error('Comment analysis failed:', error);
        alert(`${t('comment_analysis_failed', error.error || 'Unknown error')}`);
      }
    } catch (error) {
      console.error('Failed to analyze comments:', error);
      alert(t('comment_analysis_error'));
    } finally {
      setAnalyzingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(issueKey);
        return newSet;
      });
    }
  };

  const calculateUserKpiScore = (userKpi: UserKpi) => {
    const assignedIssues = userIssues[userKpi.user] || [];
    const resolvedIssues = assignedIssues.filter(issue => {
      const isResolved = issue.fields.status.statusCategory?.key === 'done' || 
        ['Done', 'Resolved', 'Closed', 'Complete', 'Fixed'].includes(issue.fields.status.name);
      return isResolved;
    });
    const unresolvedIssues = assignedIssues.filter(issue => {
      const isResolved = issue.fields.status.statusCategory?.key === 'done' || 
        ['Done', 'Resolved', 'Closed', 'Complete', 'Fixed'].includes(issue.fields.status.name);
      return !isResolved;
    });

    const kpiScore = calculateKpiScore(
      assignedIssues,
      resolvedIssues,
      unresolvedIssues,
      userKpi.avgResolutionTime,
      issuesDifficulty
    );

    setSelectedUserKpiScore({ user: userKpi.user, score: kpiScore });
    setShowKpiScoreDialog(true);
  };

  if (data.error) {
    return (
      <div className="container mx-auto p-6">
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

  const loadingSteps = [
    t('loading_step_initializing'),
    t('loading_step_projects'),
    t('loading_step_issues'),
    t('loading_step_kpi_calculation'),
    t('loading_step_completed')
  ];

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <h1 className="text-2xl sm:text-3xl font-bold">{t('kpi')}</h1>
            <div className="sm:block">
              <Navigation />
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={data.loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${data.loading ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </Button>
            <LanguageSelector />
            <LogoutButton />
            <ThemeToggle />
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          <p className="text-muted-foreground">
            {t('kpi_description')}
          </p>
          
          {/* 날짜 선택 */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground flex items-center mr-2">{t('quick_select')}</span>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <Badge
                  key={month}
                  variant={selectedMonth === month && !dateRange.startDate && !dateRange.endDate ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedMonth(month);
                    setDateRange({ startDate: null, endDate: null });
                  }}
                >
                  {month}{t('month')}
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
                    setSelectedMonth(0); // 사용자 정의 범위일 때는 월 선택 비활성화
                  }
                }}
                className="w-64"
              />
            </div>
          </div>

          {/* 즐겨찾기 안내 */}
          {favoriteUsers.size > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{t('favorite_users_display', favoriteUsers.size)}</span>
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

      {/* 전체 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('total_issues')}</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.loading ? <Skeleton className="h-8 w-16" /> : data.totalIssues}
            </div>
            <p className="text-xs text-muted-foreground">
              {dateRange.startDate && dateRange.endDate 
                ? t('created_date_range', dateRange.startDate.toLocaleDateString('ko-KR'), dateRange.endDate.toLocaleDateString('ko-KR'))
                : t('created_in_month', selectedMonth)
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('resolved_issues')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.loading ? <Skeleton className="h-8 w-16" /> : data.totalResolved}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.totalIssues > 0 && !data.loading ? 
                t('percent_completed', Math.round((data.totalResolved / data.totalIssues) * 100)) : 
                ''
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('unresolved_issues')}</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {data.loading ? <Skeleton className="h-8 w-16" /> : data.totalUnresolved}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('active_users')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.loading ? <Skeleton className="h-8 w-16" /> : data.userKpis.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 사용자별 KPI 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('user_kpi')} ({dateRange.startDate && dateRange.endDate 
              ? `${dateRange.startDate.toLocaleDateString('ko-KR')} ~ ${dateRange.endDate.toLocaleDateString('ko-KR')}`
              : t('created_in_month', selectedMonth)
            })
          </CardTitle>
          <CardDescription>
            {dateRange.startDate && dateRange.endDate 
              ? t('kpi_date_range_description', dateRange.startDate.toLocaleDateString('ko-KR'), dateRange.endDate.toLocaleDateString('ko-KR'))
              : t('kpi_month_description', selectedMonth)
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : data.userKpis.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('no_kpi_data')}
            </p>
          ) : (
            <>
              {/* 데스크톱 테이블 뷰 */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b">
                    <th 
                      className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-muted select-none w-1/4"
                      onClick={() => handleSort('user')}
                    >
                      <div className="flex items-center gap-2">
                        {t('user')}
                        {getSortIcon('user')}
                      </div>
                    </th>
                    <th 
                      className="text-center py-3 px-4 font-medium cursor-pointer hover:bg-muted select-none w-20"
                      onClick={() => handleSort('assigned')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {t('assigned_issues')}
                        {getSortIcon('assigned')}
                      </div>
                    </th>
                    <th 
                      className="text-center py-3 px-4 font-medium cursor-pointer hover:bg-muted select-none w-20"
                      onClick={() => handleSort('resolved')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {t('resolved_issues')}
                        {getSortIcon('resolved')}
                      </div>
                    </th>
                    <th 
                      className="text-center py-3 px-4 font-medium cursor-pointer hover:bg-muted select-none w-20"
                      onClick={() => handleSort('unresolved')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {t('unresolved_issues')}
                        {getSortIcon('unresolved')}
                      </div>
                    </th>
                    <th 
                      className="text-center py-3 px-4 font-medium cursor-pointer hover:bg-muted select-none w-16"
                      onClick={() => handleSort('resolutionRate')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {t('resolution_rate')}
                        {getSortIcon('resolutionRate')}
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 font-medium w-24">{t('resolution_rate_chart')}</th>
                    <th 
                      className="text-center py-3 px-4 font-medium cursor-pointer hover:bg-muted select-none w-24"
                      onClick={() => handleSort('avgResolutionTime')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {t('avg_resolution_time')}
                        {getSortIcon('avgResolutionTime')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedUserKpis().map((userKpi) => {
                    const resolutionRate = userKpi.assigned > 0 ? 
                      Math.round((userKpi.resolved / userKpi.assigned) * 100) : 0;
                    
                    return (
                      <tr key={userKpi.user} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">
                          <div className="flex items-start gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavoriteUser(userKpi.user);
                              }}
                              className="hover:scale-110 transition-transform flex-shrink-0"
                              title={favoriteUsers.has(userKpi.user) ? t('favorite_remove') : t('favorite_add')}
                            >
                              <Star 
                                className={`w-4 h-4 ${
                                  favoriteUsers.has(userKpi.user) 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'text-muted-foreground hover:text-yellow-400'
                                }`}
                              />
                            </button>
                            <Dialog onOpenChange={(open) => {
                              if (open) {
                                setSelectedUserFilter('all'); // 팝업 열릴 때 필터 초기화
                              }
                            }}>
                              <DialogTrigger asChild>
                                <button 
                                  className="text-left hover:text-primary hover:underline transition-colors break-words leading-tight"
                                  style={{
                                    wordBreak: 'break-word',
                                    hyphens: 'auto'
                                  }}
                                >
                                  {userKpi.user}
                                </button>
                              </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center justify-between gap-4">
                                  <span className="flex-1 min-w-0">{t('user_assigned_issues', userKpi.user)}</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => calculateUserKpiScore(userKpi)}
                                    className="flex-shrink-0 whitespace-nowrap"
                                  >
                                    📊 KPI {t('score')}
                                  </Button>
                                </DialogTitle>
                                <DialogDescription>
                                  {userKpi.assigned} {t('assigned_issues')} | {userKpi.resolved} {t('resolved_issues')} | {t('resolution_rate')}: {userKpi.assigned > 0 ? Math.round((userKpi.resolved / userKpi.assigned) * 100) : 0}%
                                </DialogDescription>
                              </DialogHeader>
                              
                              {/* 상태 필터 */}
                              <div className="flex gap-2 mb-4">
                                <Badge
                                  variant={selectedUserFilter === 'all' ? 'default' : 'outline'}
                                  className="cursor-pointer"
                                  onClick={() => setSelectedUserFilter('all')}
                                >
                                  {t('all')} ({userIssues[userKpi.user]?.length || 0})
                                </Badge>
                                <Badge
                                  variant={selectedUserFilter === 'todo' ? 'default' : 'outline'}
                                  className="cursor-pointer"
                                  onClick={() => setSelectedUserFilter('todo')}
                                >
                                  {t('todo')} ({getFilteredIssuesCount(userIssues[userKpi.user] || [], 'todo')})
                                </Badge>
                                <Badge
                                  variant={selectedUserFilter === 'completed' ? 'default' : 'outline'}
                                  className="cursor-pointer"
                                  onClick={() => setSelectedUserFilter('completed')}
                                >
                                  {t('completed')} ({getFilteredIssuesCount(userIssues[userKpi.user] || [], 'completed')})
                                </Badge>
                              </div>

                              <div className="space-y-3">
                                {(() => {
                                  const filteredIssues = filterUserIssues(userIssues[userKpi.user] || [], selectedUserFilter);
                                  
                                  if (filteredIssues.length === 0) {
                                    return (
                                      <div className="text-center text-muted-foreground py-8">
                                        {selectedUserFilter === 'all' && t('no_assigned_issues')}
                                        {selectedUserFilter === 'todo' && t('no_todo_issues')}
                                        {selectedUserFilter === 'completed' && t('no_completed_issues_in_list')}
                                      </div>
                                    );
                                  }
                                  
                                  return filteredIssues.map((issue) => {
                                    const isResolved = issue.fields.status.statusCategory?.key === 'done' || 
                                      ['Done', 'Resolved', 'Closed', 'Complete', 'Fixed'].includes(issue.fields.status.name);
                                    const difficulty = issuesDifficulty[issue.key];
                                    const isAnalyzing = analyzingIssues.has(issue.key);
                                    
                                    return (
                                    <div key={issue.id} className="border rounded-lg p-4 hover:bg-muted/50 hover:border-primary/50 transition-all group">
                                      <div className="flex items-start justify-between gap-3">
                                        <a
                                          href={getJiraIssueUrl(issue.key)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`flex-1 min-w-0 ${
                                            jiraCloudUrl ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                                          }`}
                                          onClick={(e) => {
                                            if (!jiraCloudUrl) {
                                              e.preventDefault();
                                            }
                                          }}
                                        >
                                          <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="outline" className="text-xs group-hover:border-primary/50">
                                              {issue.key}
                                            </Badge>
                                            <Badge 
                                              className={`text-xs ${
                                                isResolved 
                                                  ? 'bg-green-500 hover:bg-green-600' 
                                                  : 'bg-orange-500 hover:bg-orange-600'
                                              }`}
                                            >
                                              {issue.fields.status.name}
                                            </Badge>
                                            {issue.fields.priority && (
                                              <Badge variant="secondary" className="text-xs">
                                                {issue.fields.priority.name}
                                              </Badge>
                                            )}
                                            {difficulty && (
                                              <DifficultyBadge difficulty={difficulty.difficulty} size="sm" />
                                            )}
                                          </div>
                                          <h4 
                                            className="font-medium text-sm mb-1 break-words group-hover:text-primary leading-relaxed"
                                            style={{
                                              display: '-webkit-box',
                                              WebkitLineClamp: 2,
                                              WebkitBoxOrient: 'vertical',
                                              overflow: 'hidden',
                                              wordBreak: 'break-word'
                                            }}
                                          >
                                            {issue.fields.summary}
                                          </h4>
                                          <div className="text-xs text-muted-foreground">
                                            {t('project')}: {issue.fields.project.name}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {t('created')}: {new Date(issue.fields.created).toLocaleDateString('ko-KR')}
                                          </div>
                                          {issue.fields.resolutiondate && (
                                            <div className="text-xs text-muted-foreground">
                                              {t('completed')}: {new Date(issue.fields.resolutiondate).toLocaleDateString('ko-KR')}
                                            </div>
                                          )}
                                          {difficulty && (
                                            <div className="text-xs text-muted-foreground">
                                              {t('estimated_hours', difficulty.estimatedHours)}
                                            </div>
                                          )}
                                        </a>
                                        
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          <a
                                            href={getJiraIssueUrl(issue.key)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={jiraCloudUrl ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                                            onClick={(e) => {
                                              if (!jiraCloudUrl) {
                                                e.preventDefault();
                                              }
                                            }}
                                          >
                                            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                          </a>
                                          
                                          <div className="flex items-center gap-1">
                                            {difficulty ? (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setShowDifficultyDialog(issue.key);
                                                }}
                                                className="h-6 p-0"
                                              >
                                                <DifficultyBadge difficulty={difficulty.difficulty} size="sm" />
                                              </Button>
                                            ) : (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  analyzeDifficulty(issue);
                                                }}
                                                disabled={isAnalyzing}
                                                className="h-6 px-2"
                                              >
                                                {isAnalyzing ? (
                                                  <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                  <Sparkles className="h-3 w-3" />
                                                )}
                                              </Button>
                                            )}
                                            
                                            {/* 댓글 분석 버튼 - 댓글이 2개 이상일 때만 표시 */}
                                            {issue.fields.comment && issue.fields.comment.total >= 2 && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  analyzeComments(issue);
                                                }}
                                                disabled={analyzingComments.has(issue.key)}
                                                className="h-6 px-2"
                                                title={t('comment_analysis')}
                                              >
                                                {analyzingComments.has(issue.key) ? (
                                                  <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                  <MessageSquare className="h-3 w-3" />
                                                )}
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    );
                                  });
                                })()}
                              </div>
                            </DialogContent>
                          </Dialog>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline">{userKpi.assigned}</Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-green-500 hover:bg-green-600">
                            {userKpi.resolved}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-orange-500 hover:bg-orange-600">
                            {userKpi.unresolved}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge 
                            variant={resolutionRate >= 70 ? "default" : "secondary"}
                            className={resolutionRate >= 70 ? "bg-blue-500 hover:bg-blue-600" : ""}
                          >
                            {resolutionRate}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center">
                            <div className="w-24">
                              <GradientProgress 
                                value={resolutionRate} 
                                height="sm" 
                                showText={false}
                                gradientType={
                                  resolutionRate >= 80 ? 'success' : 
                                  resolutionRate >= 60 ? 'warning' : 
                                  'danger'
                                }
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-muted-foreground">
                          {userKpi.avgResolutionTime > 0 ? `${userKpi.avgResolutionTime}${t('days')}` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
              
              {/* 모바일 카드 뷰 */}
              <div className="lg:hidden space-y-4">
                {getSortedUserKpis().map((userKpi) => {
                  const resolutionRate = userKpi.assigned > 0 ? 
                    Math.round((userKpi.resolved / userKpi.assigned) * 100) : 0;
                  
                  return (
                    <Card key={userKpi.user} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{userKpi.user}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFavoriteUser(userKpi.user)}
                            className="p-1 h-auto"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                favoriteUsers.has(userKpi.user)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-muted-foreground hover:text-yellow-400'
                              }`}
                            />
                          </Button>
                        </div>
                        <Badge 
                          variant={resolutionRate >= 70 ? "default" : "secondary"}
                          className={resolutionRate >= 70 ? "bg-blue-500 hover:bg-blue-600" : ""}
                        >
                          {t('resolution_rate')} {resolutionRate}%
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{userKpi.assigned}</div>
                          <div className="text-xs text-muted-foreground">{t('assigned_issues')}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{userKpi.resolved}</div>
                          <div className="text-xs text-muted-foreground">{t('resolved_issues')}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{userKpi.unresolved}</div>
                          <div className="text-xs text-muted-foreground">{t('unresolved_issues')}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {userKpi.avgResolutionTime > 0 ? `${userKpi.avgResolutionTime}${t('days')}` : '-'}
                          </div>
                          <div className="text-xs text-muted-foreground">{t('avg_resolution_time')}</div>
                        </div>
                      </div>
                      
                      {/* 해결률 차트 */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">{t('resolution_rate_progress')}</span>
                          <span className="text-sm font-medium">{resolutionRate}%</span>
                        </div>
                        <GradientProgress 
                          value={resolutionRate} 
                          height="md" 
                          showText={false}
                          gradientType={
                            resolutionRate >= 80 ? 'success' : 
                            resolutionRate >= 60 ? 'warning' : 
                            'danger'
                          }
                        />
                      </div>
                      
                      {/* 이슈 목록 버튼 */}
                      {userIssues[userKpi.user] && userIssues[userKpi.user].length > 0 && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                              {t('view_issue_list', userIssues[userKpi.user].length)}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center justify-between gap-4">
                                <span className="flex-1 min-w-0">{t('user_issue_list', userKpi.user)}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => calculateUserKpiScore(userKpi)}
                                  className="flex-shrink-0 whitespace-nowrap"
                                >
                                  📊 KPI {t('score')}
                                </Button>
                              </DialogTitle>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  variant={selectedUserFilter === 'all' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setSelectedUserFilter('all')}
                                >
                                  {t('all')} ({getFilteredIssuesCount(userIssues[userKpi.user], 'all')})
                                </Button>
                                <Button
                                  variant={selectedUserFilter === 'todo' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setSelectedUserFilter('todo')}
                                >
                                  {t('todo')} ({getFilteredIssuesCount(userIssues[userKpi.user], 'todo')})
                                </Button>
                                <Button
                                  variant={selectedUserFilter === 'completed' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setSelectedUserFilter('completed')}
                                >
                                  {t('completed')} ({getFilteredIssuesCount(userIssues[userKpi.user], 'completed')})
                                </Button>
                              </div>
                            </DialogHeader>
                            <div className="space-y-3">
                              {(() => {
                                const filteredIssues = filterUserIssues(userIssues[userKpi.user] || [], selectedUserFilter);
                                
                                if (filteredIssues.length === 0) {
                                  return (
                                    <div className="text-center text-muted-foreground py-8">
                                      {selectedUserFilter === 'all' && t('no_assigned_issues')}
                                      {selectedUserFilter === 'todo' && t('no_todo_issues')}
                                      {selectedUserFilter === 'completed' && t('no_completed_issues_in_list')}
                                    </div>
                                  );
                                }
                                
                                return filteredIssues.map((issue) => {
                                  const isResolved = issue.fields.status.statusCategory?.key === 'done' || 
                                    ['Done', 'Resolved', 'Closed', 'Complete', 'Fixed'].includes(issue.fields.status.name);
                                  const difficulty = issuesDifficulty[issue.key];
                                  const isAnalyzing = analyzingIssues.has(issue.key);
                                  
                                  return (
                                    <div key={issue.id} className="border rounded-lg p-4 hover:bg-muted/50 hover:border-primary/50 transition-all group">
                                      <div className="flex items-start justify-between gap-3">
                                        <a
                                          href={getJiraIssueUrl(issue.key)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`flex-1 min-w-0 ${
                                            jiraCloudUrl ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                                          }`}
                                          onClick={(e) => {
                                            if (!jiraCloudUrl) {
                                              e.preventDefault();
                                            }
                                          }}
                                        >
                                          <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <Badge variant="outline" className="text-xs group-hover:border-primary/50">
                                              {issue.key}
                                            </Badge>
                                            <Badge 
                                              className={`text-xs ${
                                                isResolved 
                                                  ? 'bg-green-500 hover:bg-green-600' 
                                                  : 'bg-orange-500 hover:bg-orange-600'
                                              }`}
                                            >
                                              {issue.fields.status.name}
                                            </Badge>
                                            {issue.fields.priority && (
                                              <Badge variant="secondary" className="text-xs">
                                                {issue.fields.priority.name}
                                              </Badge>
                                            )}
                                            {difficulty && (
                                              <DifficultyBadge difficulty={difficulty.difficulty} size="sm" />
                                            )}
                                          </div>
                                          <h4 
                                            className="font-medium text-sm mb-2 break-words group-hover:text-primary leading-relaxed"
                                            style={{
                                              display: '-webkit-box',
                                              WebkitLineClamp: 2,
                                              WebkitBoxOrient: 'vertical',
                                              overflow: 'hidden',
                                              wordBreak: 'break-word'
                                            }}
                                          >
                                            {issue.fields.summary}
                                          </h4>
                                          <div className="text-xs text-muted-foreground">
                                            {t('project')}: {issue.fields.project.name}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {t('created')}: {new Date(issue.fields.created).toLocaleDateString('ko-KR')}
                                          </div>
                                          {issue.fields.resolutiondate && (
                                            <div className="text-xs text-muted-foreground">
                                              {t('completed')}: {new Date(issue.fields.resolutiondate).toLocaleDateString('ko-KR')}
                                            </div>
                                          )}
                                          {difficulty && (
                                            <div className="text-xs text-muted-foreground">
                                              {t('estimated_hours', difficulty.estimatedHours)}
                                            </div>
                                          )}
                                        </a>
                                        
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          <a
                                            href={getJiraIssueUrl(issue.key)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={jiraCloudUrl ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                                            onClick={(e) => {
                                              if (!jiraCloudUrl) {
                                                e.preventDefault();
                                              }
                                            }}
                                          >
                                            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                          </a>
                                          
                                          <div className="flex items-center gap-1">
                                            {difficulty ? (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setShowDifficultyDialog(issue.key);
                                                }}
                                                className="h-6 p-0"
                                              >
                                                <DifficultyBadge difficulty={difficulty.difficulty} size="sm" />
                                              </Button>
                                            ) : (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  analyzeDifficulty(issue);
                                                }}
                                                disabled={isAnalyzing}
                                                className="h-6 px-2"
                                              >
                                                {isAnalyzing ? (
                                                  <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                  <Sparkles className="h-3 w-3" />
                                                )}
                                              </Button>
                                            )}
                                            
                                            {/* 댓글 분석 버튼 - 댓글이 2개 이상일 때만 표시 */}
                                            {issue.fields.comment && issue.fields.comment.total >= 2 && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  analyzeComments(issue);
                                                }}
                                                disabled={analyzingComments.has(issue.key)}
                                                className="h-6 px-2"
                                                title={t('comment_analysis')}
                                              >
                                                {analyzingComments.has(issue.key) ? (
                                                  <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                  <MessageSquare className="h-3 w-3" />
                                                )}
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* AI 난이도 분석 다이얼로그 */}
      {showDifficultyDialog && issuesDifficulty[showDifficultyDialog] && (
        <DifficultyDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setShowDifficultyDialog(null);
          }}
          issueKey={showDifficultyDialog}
          issueTitle={
            Object.values(userIssues)
              .flat()
              .find(issue => issue.key === showDifficultyDialog)?.fields.summary || ''
          }
          difficulty={issuesDifficulty[showDifficultyDialog]}
        />
      )}
      
      {/* 댓글 분석 다이얼로그 */}
      {showCommentAnalysisDialog && commentsAnalysis[showCommentAnalysisDialog] && (
        <CommentAnalysisDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setShowCommentAnalysisDialog(null);
          }}
          issueKey={showCommentAnalysisDialog}
          issueTitle={
            Object.values(userIssues)
              .flat()
              .find(issue => issue.key === showCommentAnalysisDialog)?.fields.summary || ''
          }
          analysis={commentsAnalysis[showCommentAnalysisDialog]}
        />
      )}
      
      {/* KPI 점수 다이얼로그 */}
      {selectedUserKpiScore && (
        <Dialog open={showKpiScoreDialog} onOpenChange={setShowKpiScoreDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                📊 {selectedUserKpiScore.user} - KPI 상세 분석
              </DialogTitle>
              <DialogDescription>
                종합 성과 분석 및 개선 권장사항
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <KpiScoreCard
                scoreBreakdown={selectedUserKpiScore.score}
                userName={selectedUserKpiScore.user}
                assignedCount={data.userKpis.find(u => u.user === selectedUserKpiScore.user)?.assigned || 0}
                resolvedCount={data.userKpis.find(u => u.user === selectedUserKpiScore.user)?.resolved || 0}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}