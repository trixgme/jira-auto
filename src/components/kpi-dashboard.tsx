'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/theme-toggle';
import { Navigation } from '@/components/navigation';
import { LoadingProgress } from '@/components/loading-progress';
import { Users, Bug, CheckCircle, Clock, TrendingUp, ChevronUp, ChevronDown, ChevronsUpDown, ExternalLink, Star } from 'lucide-react';
import type { JiraIssue, JiraProject } from '@/lib/types';

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
}

interface UserIssues {
  [user: string]: JiraIssue[];
}

export function KpiDashboard() {
  const [data, setData] = useState<KpiData>({
    userKpis: [],
    totalIssues: 0,
    totalResolved: 0,
    totalUnresolved: 0,
    loading: true,
    error: null,
  });

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 현재 월로 초기화
  const [loadingStep, setLoadingStep] = useState(0);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof UserKpi | 'resolutionRate';
    direction: 'asc' | 'desc';
  } | null>({ key: 'assigned', direction: 'desc' }); // 기본값: 할당된 이슈 수 내림차순
  const [userIssues, setUserIssues] = useState<UserIssues>({}); // 사용자별 이슈 저장
  const [jiraCloudUrl, setJiraCloudUrl] = useState<string>('');
  const [favoriteUsers, setFavoriteUsers] = useState<Set<string>>(new Set());
  const [selectedUserFilter, setSelectedUserFilter] = useState<'all' | 'todo' | 'completed'>('all');

  useEffect(() => {
    loadFavoriteUsers();
    fetchJiraConfig();
    fetchKpiData();
  }, [selectedMonth]);

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

  const fetchKpiData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      setLoadingStep(0);

      setLoadingStep(1); // 프로젝트 정보 조회 중
      const projectsRes = await fetch('/api/jira/projects');
      
      if (!projectsRes.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const projectsData = await projectsRes.json();

      setLoadingStep(2); // 이슈 데이터 조회 중
      const allIssuesRes = await fetch(`/api/jira/all-issues?month=${selectedMonth}`);
      
      if (!allIssuesRes.ok) {
        throw new Error('Failed to fetch issues');
      }
      
      const allIssuesData = await allIssuesRes.json();
      const issues: JiraIssue[] = allIssuesData.issues || [];

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

      setData({
        userKpis,
        totalIssues,
        totalResolved,
        totalUnresolved,
        loading: false,
        error: null,
      });
      
      setLoadingStep(0); // 리셋

    } catch (error) {
      console.error('Error fetching KPI data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load KPI data. Please check your Jira configuration.',
      }));
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

  if (data.error) {
    return (
      <div className="container mx-auto p-6">
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

  const loadingSteps = [
    '초기화 중...',
    '프로젝트 정보 조회 중...',
    '이슈 데이터 조회 중...',
    'KPI 데이터 계산 중...',
    '완료'
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-8">
            <h1 className="text-3xl font-bold">KPI Dashboard</h1>
            <Navigation />
          </div>
          <ThemeToggle />
        </div>
        
        <div className="flex flex-col gap-4">
          <p className="text-muted-foreground">
            개발팀의 업무 진행 상황을 정량적으로 추적합니다.
          </p>
          
          {/* 월 선택 버튼 */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground flex items-center mr-2">월 선택:</span>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <Badge
                key={month}
                variant={selectedMonth === month ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedMonth(month)}
              >
                {month}월
              </Badge>
            ))}
          </div>

          {/* 즐겨찾기 안내 */}
          {favoriteUsers.size > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>즐겨찾기한 사용자 {favoriteUsers.size}명이 상단에 표시됩니다.</span>
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
            <CardTitle className="text-sm font-medium">전체 이슈</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.loading ? <Skeleton className="h-8 w-16" /> : data.totalIssues}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedMonth}월 생성
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">해결된 이슈</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.loading ? <Skeleton className="h-8 w-16" /> : data.totalResolved}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.totalIssues > 0 && !data.loading ? 
                `${Math.round((data.totalResolved / data.totalIssues) * 100)}% 완료` : 
                ''
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">미해결 이슈</CardTitle>
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
            <CardTitle className="text-sm font-medium">활성 사용자</CardTitle>
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
            사용자별 KPI ({selectedMonth}월)
          </CardTitle>
          <CardDescription>
            {selectedMonth}월에 생성된 이슈 기준으로 각 사용자의 할당, 해결, 미해결 현황 및 평균 해결 시간
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
              KPI 데이터가 없습니다.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b">
                    <th 
                      className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-muted select-none w-1/4"
                      onClick={() => handleSort('user')}
                    >
                      <div className="flex items-center gap-2">
                        사용자
                        {getSortIcon('user')}
                      </div>
                    </th>
                    <th 
                      className="text-center py-3 px-4 font-medium cursor-pointer hover:bg-muted select-none w-20"
                      onClick={() => handleSort('assigned')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        할당된 이슈
                        {getSortIcon('assigned')}
                      </div>
                    </th>
                    <th 
                      className="text-center py-3 px-4 font-medium cursor-pointer hover:bg-muted select-none w-20"
                      onClick={() => handleSort('resolved')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        해결된 이슈
                        {getSortIcon('resolved')}
                      </div>
                    </th>
                    <th 
                      className="text-center py-3 px-4 font-medium cursor-pointer hover:bg-muted select-none w-20"
                      onClick={() => handleSort('unresolved')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        미해결 이슈
                        {getSortIcon('unresolved')}
                      </div>
                    </th>
                    <th 
                      className="text-center py-3 px-4 font-medium cursor-pointer hover:bg-muted select-none w-16"
                      onClick={() => handleSort('resolutionRate')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        해결률
                        {getSortIcon('resolutionRate')}
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 font-medium w-24">해결률 차트</th>
                    <th 
                      className="text-center py-3 px-4 font-medium cursor-pointer hover:bg-muted select-none w-24"
                      onClick={() => handleSort('avgResolutionTime')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        평균 해결시간
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
                              title={favoriteUsers.has(userKpi.user) ? '즐겨찾기 해제' : '즐겨찾기 추가'}
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
                                <DialogTitle>{userKpi.user}님의 할당된 이슈</DialogTitle>
                                <DialogDescription>
                                  {selectedMonth}월에 할당된 총 {userKpi.assigned}개의 이슈 목록
                                </DialogDescription>
                              </DialogHeader>
                              
                              {/* 상태 필터 */}
                              <div className="flex gap-2 mb-4">
                                <Badge
                                  variant={selectedUserFilter === 'all' ? 'default' : 'outline'}
                                  className="cursor-pointer"
                                  onClick={() => setSelectedUserFilter('all')}
                                >
                                  전체 ({userIssues[userKpi.user]?.length || 0})
                                </Badge>
                                <Badge
                                  variant={selectedUserFilter === 'todo' ? 'default' : 'outline'}
                                  className="cursor-pointer"
                                  onClick={() => setSelectedUserFilter('todo')}
                                >
                                  해야할일 ({getFilteredIssuesCount(userIssues[userKpi.user] || [], 'todo')})
                                </Badge>
                                <Badge
                                  variant={selectedUserFilter === 'completed' ? 'default' : 'outline'}
                                  className="cursor-pointer"
                                  onClick={() => setSelectedUserFilter('completed')}
                                >
                                  완료 ({getFilteredIssuesCount(userIssues[userKpi.user] || [], 'completed')})
                                </Badge>
                              </div>

                              <div className="space-y-3">
                                {(() => {
                                  const filteredIssues = filterUserIssues(userIssues[userKpi.user] || [], selectedUserFilter);
                                  
                                  if (filteredIssues.length === 0) {
                                    return (
                                      <div className="text-center text-muted-foreground py-8">
                                        {selectedUserFilter === 'all' && '할당된 이슈가 없습니다.'}
                                        {selectedUserFilter === 'todo' && '해야할 이슈가 없습니다.'}
                                        {selectedUserFilter === 'completed' && '완료된 이슈가 없습니다.'}
                                      </div>
                                    );
                                  }
                                  
                                  return filteredIssues.map((issue) => {
                                    const isResolved = issue.fields.status.statusCategory?.key === 'done' || 
                                      ['Done', 'Resolved', 'Closed', 'Complete', 'Fixed'].includes(issue.fields.status.name);
                                    
                                    return (
                                    <a
                                      key={issue.id}
                                      href={getJiraIssueUrl(issue.key)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`block border rounded-lg p-4 hover:bg-muted/50 hover:border-primary/50 transition-all group ${
                                        jiraCloudUrl ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                                      }`}
                                      onClick={(e) => {
                                        if (!jiraCloudUrl) {
                                          e.preventDefault();
                                        }
                                      }}
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
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
                                            프로젝트: {issue.fields.project.name}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            생성일: {new Date(issue.fields.created).toLocaleDateString('ko-KR')}
                                          </div>
                                          {issue.fields.resolutiondate && (
                                            <div className="text-xs text-muted-foreground">
                                              완료일: {new Date(issue.fields.resolutiondate).toLocaleDateString('ko-KR')}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-shrink-0">
                                          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                      </div>
                                    </a>
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
                            <div className="w-24 h-4 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ease-out ${
                                  resolutionRate >= 80 ? 'bg-green-500' : 
                                  resolutionRate >= 60 ? 'bg-yellow-500' : 
                                  'bg-red-500'
                                }`}
                                style={{ width: `${resolutionRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-muted-foreground">
                          {userKpi.avgResolutionTime > 0 ? `${userKpi.avgResolutionTime}일` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}