'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { Navigation } from '@/components/navigation';
import { Users, Bug, CheckCircle, Clock, TrendingUp } from 'lucide-react';
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

  useEffect(() => {
    fetchKpiData();
  }, [selectedMonth]);

  const fetchKpiData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // 선택된 월의 이슈를 가져와서 KPI 계산
      const [allIssuesRes, projectsRes] = await Promise.all([
        fetch(`/api/jira/all-issues?month=${selectedMonth}`),
        fetch('/api/jira/projects'),
      ]);

      if (!allIssuesRes.ok || !projectsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [allIssuesData, projectsData] = await Promise.all([
        allIssuesRes.json(),
        projectsRes.json(),
      ]);

      const issues: JiraIssue[] = allIssuesData.issues || [];
      
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

      issues.forEach(issue => {
        // 담당자가 있는 이슈만 처리
        const assignee = issue.fields.assignee?.displayName;
        if (!assignee) {
          return; // 담당자가 없는 이슈는 건너뛰기
        }
        
        // 담당자별 통계 초기화
        if (!userStats.has(assignee)) {
          userStats.set(assignee, { assigned: [], resolved: [], unresolved: [] });
        }

        const stats = userStats.get(assignee)!;
        stats.assigned.push(issue);

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
      }).sort((a, b) => b.assigned - a.assigned); // 할당된 이슈 수로 정렬

      const totalIssues = issues.length;
      const totalResolved = issues.filter(issue => {
        const isResolved = issue.fields.status.statusCategory?.key === 'done' || 
                          ['Done', 'Resolved', 'Closed', 'Complete', 'Fixed'].includes(issue.fields.status.name);
        return isResolved;
      }).length;
      const totalUnresolved = totalIssues - totalResolved;

      console.log(`전체 통계: 총 ${totalIssues}개, 해결 ${totalResolved}개, 미해결 ${totalUnresolved}개`);

      setData({
        userKpis,
        totalIssues,
        totalResolved,
        totalUnresolved,
        loading: false,
        error: null,
      });

    } catch (error) {
      console.error('Error fetching KPI data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load KPI data. Please check your Jira configuration.',
      }));
    }
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
        </div>
      </div>

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
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">사용자</th>
                    <th className="text-center py-3 px-4 font-medium">할당된 이슈</th>
                    <th className="text-center py-3 px-4 font-medium">해결된 이슈</th>
                    <th className="text-center py-3 px-4 font-medium">미해결 이슈</th>
                    <th className="text-center py-3 px-4 font-medium">해결률</th>
                    <th className="text-center py-3 px-4 font-medium">평균 해결시간</th>
                  </tr>
                </thead>
                <tbody>
                  {data.userKpis.map((userKpi) => {
                    const resolutionRate = userKpi.assigned > 0 ? 
                      Math.round((userKpi.resolved / userKpi.assigned) * 100) : 0;
                    
                    return (
                      <tr key={userKpi.user} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{userKpi.user}</td>
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