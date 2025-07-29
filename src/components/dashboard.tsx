'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IssueCard } from '@/components/issue-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ProjectSelector } from '@/components/project-selector';
import { ThemeToggle } from '@/components/theme-toggle';
import { IssuesChart } from '@/components/issues-chart';
import { Navigation } from '@/components/navigation';
import { Search, X } from 'lucide-react';
import { LoadingProgress } from '@/components/loading-progress';
import type { JiraIssue, JiraProject } from '@/lib/types';

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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (data.projects.length > 0) {
      fetchDashboardData();
    }
  }, [daysBack, selectedProject, data.projects.length]);


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
      
      console.log('모든 이슈를 가져오는 중... (시간이 조금 걸릴 수 있습니다)');
      
      setLoadingStep(1); // 새로운 이슈 조회 중
      const newIssuesRes = await fetch(`/api/jira/new-issues?days=${daysBack}${projectParam}`);
      
      if (!newIssuesRes.ok) {
        throw new Error('Failed to fetch new issues');
      }
      
      const newIssuesData = await newIssuesRes.json();
      
      setLoadingStep(2); // 완료된 이슈 조회 중
      const completedIssuesRes = await fetch(`/api/jira/completed-issues?days=${daysBack}${projectParam}`);
      
      if (!completedIssuesRes.ok) {
        throw new Error('Failed to fetch completed issues');  
      }
      
      const completedIssuesData = await completedIssuesRes.json();

      setLoadingStep(3); // 데이터 처리 중

      console.log(`새로운 이슈: ${newIssuesData.issues.length}개, 완료된 이슈: ${completedIssuesData.issues.length}개`);

      setData(prev => ({
        ...prev,
        newIssues: newIssuesData.issues,
        completedIssues: completedIssuesData.issues,
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

  const loadingSteps = [
    '프로젝트 정보 조회 중...',
    '새로운 이슈 조회 중...',
    '완료된 이슈 조회 중...',
    '데이터 처리 중...'
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

  const DaysSelector = () => (
    <div className="flex gap-2 items-center">
      <span className="text-sm text-muted-foreground">기간:</span>
      {[1, 7, 14, 30].map((days) => (
        <Badge
          key={days}
          variant={daysBack === days ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setDaysBack(days)}
        >
          {days === 1 ? '오늘' : `${days}일`}
        </Badge>
      ))}
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
            <h1 className="text-3xl font-bold">Jira Dashboard</h1>
            <Navigation />
          </div>
          <ThemeToggle />
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
            <div className="lg:w-80">
              {SearchBar}
            </div>
          </div>
          {activeSearchQuery && (
            <div className="text-sm text-muted-foreground">
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

      {/* 차트 섹션 */}
      <div className="mb-6">
        {data.loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <IssuesChart 
            newIssues={data.newIssues}
            completedIssues={data.completedIssues}
            daysBack={daysBack}
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              새로 추가된 이슈
              <Badge>{filteredNewIssues.length}</Badge>
            </CardTitle>
            <CardDescription>
              최근 {daysBack === 1 ? '오늘' : `${daysBack}일간`} 생성된 이슈
              {activeSearchQuery && ` (검색: "${activeSearchQuery}")`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                  <IssueCard key={issue.id} issue={issue} />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              완료된 이슈
              <Badge>{filteredCompletedIssues.length}</Badge>
            </CardTitle>
            <CardDescription>
              최근 {daysBack === 1 ? '오늘' : `${daysBack}일간`} 완료된 이슈
              {activeSearchQuery && ` (검색: "${activeSearchQuery}")`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                  <IssueCard key={issue.id} issue={issue} />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}