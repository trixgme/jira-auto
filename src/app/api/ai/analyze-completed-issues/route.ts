import { NextRequest, NextResponse } from 'next/server';
import type { JiraIssue } from '@/lib/types';

interface ChartData {
  projectDistribution: Array<{ name: string; value: number }>;
  assigneeDistribution: Array<{ name: string; value: number }>;
  issueTypeDistribution: Array<{ name: string; value: number }>;
  priorityDistribution: Array<{ name: string; value: number }>;
  completionTrend: Array<{ date: string; count: number }>;
  totalStats: {
    totalIssues: number;
    avgCompletionTime: number;
    mostActiveProject: string;
    mostActiveAssignee: string;
  };
}

interface ReportResult {
  report: string;
  reportType: 'ai' | 'basic';
  chartData: ChartData;
}

export async function POST(request: NextRequest) {
  try {
    const { issues, period, project, dateRange } = await request.json();

    if (!issues || !Array.isArray(issues) || issues.length === 0) {
      return NextResponse.json(
        { error: '분석할 이슈가 없습니다.' },
        { status: 400 }
      );
    }

    const result = await generateCompletedIssuesReport(issues, period, project, dateRange);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error analyzing completed issues:', error);
    return NextResponse.json(
      { error: '보고서 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

function generateChartData(issues: JiraIssue[]): ChartData {
  // 프로젝트별 분포
  const projectCounts = issues.reduce((acc, issue) => {
    const projectName = issue.fields.project.name;
    acc[projectName] = (acc[projectName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const projectDistribution = Object.entries(projectCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 담당자별 분포
  const assigneeCounts = issues.reduce((acc, issue) => {
    const assignee = issue.fields.assignee?.displayName || '미할당';
    acc[assignee] = (acc[assignee] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const assigneeDistribution = Object.entries(assigneeCounts)
    .map(([name, value]) => ({ 
      name: name.length > 8 ? name.substring(0, 8) + '...' : name, 
      fullName: name,
      value 
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10

  // 이슈 유형별 분포
  const typeCounts = issues.reduce((acc, issue) => {
    const type = issue.fields.issuetype?.name || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const issueTypeDistribution = Object.entries(typeCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 우선순위별 분포
  const priorityCounts = issues.reduce((acc, issue) => {
    const priority = issue.fields.priority?.name || 'None';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityDistribution = Object.entries(priorityCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 완료 트렌드 (날짜별)
  const completionByDate = issues.reduce((acc, issue) => {
    if (issue.fields.resolutiondate) {
      const date = new Date(issue.fields.resolutiondate).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const completionTrend = Object.entries(completionByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 평균 완료 시간 계산
  const completionTimes = issues
    .filter(issue => issue.fields.created && issue.fields.resolutiondate)
    .map(issue => {
      const created = new Date(issue.fields.created).getTime();
      const resolved = new Date(issue.fields.resolutiondate!).getTime();
      return (resolved - created) / (1000 * 60 * 60 * 24); // 일 단위
    });

  const avgCompletionTime = completionTimes.length > 0
    ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
    : 0;

  return {
    projectDistribution,
    assigneeDistribution,
    issueTypeDistribution,
    priorityDistribution,
    completionTrend,
    totalStats: {
      totalIssues: issues.length,
      avgCompletionTime,
      mostActiveProject: projectDistribution[0]?.name || 'N/A',
      mostActiveAssignee: assigneeDistribution[0]?.name || 'N/A'
    }
  };
}

async function generateCompletedIssuesReport(
  issues: JiraIssue[],
  period: number,
  project: string,
  dateRange?: { startDate: string; endDate: string } | null
): Promise<ReportResult> {
  // 토큰 제한을 위한 이슈 데이터 요약
  const getIssueSummary = () => {
    // 이슈 수가 많을 때는 대표적인 이슈들만 선택
    const maxIssues = 30; // 최대 30개 이슈만 상세 분석
    const selectedIssues = issues.length > maxIssues 
      ? [...issues.slice(0, 15), ...issues.slice(-15)] // 처음 15개 + 마지막 15개
      : issues;

    const issuesSummary = selectedIssues.map(issue => ({
      key: issue.key,
      summary: issue.fields.summary.length > 100 
        ? issue.fields.summary.substring(0, 100) + '...' 
        : issue.fields.summary, // 제목 길이 제한
      type: issue.fields.issuetype?.name || 'Unknown',
      priority: issue.fields.priority?.name || 'None',
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      project: issue.fields.project.name
    }));

    // 통계 요약
    const stats = {
      total: issues.length,
      byProject: Object.entries(issues.reduce((acc, issue) => {
        const project = issue.fields.project.name;
        acc[project] = (acc[project] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)),
      byType: Object.entries(issues.reduce((acc, issue) => {
        const type = issue.fields.issuetype?.name || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)),
      byAssignee: Object.entries(issues.reduce((acc, issue) => {
        const assignee = issue.fields.assignee?.displayName || 'Unassigned';
        acc[assignee] = (acc[assignee] || 0) + 1;
        return acc;
      }, {} as Record<string, number>))
    };

    return { issuesSummary, stats, isLimited: issues.length > maxIssues };
  };

  const { issuesSummary, stats, isLimited } = getIssueSummary();

  const periodText = dateRange 
    ? `${dateRange.startDate} ~ ${dateRange.endDate}`
    : `최근 ${period}일`;

  const prompt = `${periodText} 기간에 완료된 Jira 이슈 분석 보고서를 작성해주세요.

## 기본 정보
- 프로젝트: ${project === 'all' ? '전체 프로젝트' : project}
- 분석 기간: ${periodText}
- 완료된 이슈 수: ${issues.length}개
${isLimited ? `- 주요 이슈 ${issuesSummary.length}개를 중심으로 분석` : ''}

## 통계 요약
프로젝트별: ${stats.byProject.map(([name, count]) => `${name}(${count})`).join(', ')}
유형별: ${stats.byType.map(([name, count]) => `${name}(${count})`).join(', ')}
담당자별: ${stats.byAssignee.slice(0, 5).map(([name, count]) => `${name}(${count})`).join(', ')}

## 주요 이슈들
${issuesSummary.map(issue => 
  `- [${issue.key}] ${issue.summary} (${issue.type}, ${issue.assignee})`
).join('\n')}

다음 구조로 보고서를 작성해주세요:

## 📊 완료 현황 요약
- 전체 통계와 프로젝트별 현황

## 🎯 주요 성과
- 중요한 완료 이슈들과 성과

## 📈 생산성 분석
- 담당자별 기여도와 효율성

## 💡 인사이트 및 제안
- 발견된 패턴과 개선 제안

마크다운 형식으로 간결하고 실용적인 보고서를 작성해주세요.`;

  // 토큰 사용량 추정 (대략적인 계산)
  const estimatedTokens = Math.ceil(prompt.length / 3); // 대략 3글자당 1토큰
  console.log(`AI 보고서 생성 - 예상 입력 토큰: ${estimatedTokens}, 이슈 수: ${issues.length}, 샘플 수: ${issuesSummary.length}`);
  
  if (estimatedTokens > 8000) {
    console.warn(`토큰 수가 많습니다 (${estimatedTokens}). 기본 보고서로 대체합니다.`);
    // 토큰이 너무 많으면 기본 보고서로 대체
    const report = generateFallbackReport(issues, period, project, dateRange);
    const chartData = generateChartData(issues);
    return { 
      report, 
      reportType: 'basic',
      chartData 
    };
  }

  try {
    // OpenAI API 호출
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '당신은 프로젝트 관리 전문가입니다. Jira 이슈 데이터를 분석하여 유용하고 실용적인 보고서를 작성합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error details:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const chartData = generateChartData(issues);
      return { 
        report: data.choices[0].message.content, 
        reportType: 'ai',
        chartData 
      };
    } else {
      throw new Error('Invalid response from OpenAI API');
    }
  } catch (error) {
    console.warn('OpenAI API 호출 실패, 기본 보고서를 생성합니다:', error instanceof Error ? error.message : error);
    
    // OpenAI API 호출이 실패한 경우 기본 보고서 생성
    const report = generateFallbackReport(issues, period, project, dateRange);
    const chartData = generateChartData(issues);
    return { 
      report, 
      reportType: 'basic',
      chartData 
    };
  }
}

function generateFallbackReport(
  issues: JiraIssue[],
  period: number,
  project: string,
  dateRange?: { startDate: string; endDate: string } | null
): string {
  const projectCounts = issues.reduce((acc, issue) => {
    const projectName = issue.fields.project.name;
    acc[projectName] = (acc[projectName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeCounts = issues.reduce((acc, issue) => {
    const type = issue.fields.issuetype?.name || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const assigneeCounts = issues.reduce((acc, issue) => {
    const assignee = issue.fields.assignee?.displayName || '미할당';
    acc[assignee] = (acc[assignee] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityCounts = issues.reduce((acc, issue) => {
    const priority = issue.fields.priority?.name || 'None';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const periodText = dateRange 
    ? `${dateRange.startDate} ~ ${dateRange.endDate}`
    : `최근 ${period}일`;

  return `# 📋 완료된 이슈 분석 보고서

## 📊 완료 현황 요약
- **전체 완료 이슈**: ${issues.length}개
- **분석 기간**: ${periodText}
- **대상 프로젝트**: ${project === 'all' ? '전체 프로젝트' : project}

### 프로젝트별 완료 현황
${Object.entries(projectCounts)
  .map(([proj, count]) => `- **${proj}**: ${count}개`)
  .join('\n')}

### 이슈 유형별 분포
${Object.entries(typeCounts)
  .map(([type, count]) => `- **${type}**: ${count}개`)
  .join('\n')}

## 🎯 주요 성과

### 우선순위별 완료 현황
${Object.entries(priorityCounts)
  .map(([priority, count]) => `- **${priority}**: ${count}개`)
  .join('\n')}

### 상위 완료 이슈들
${issues.slice(0, 5).map(issue => 
  `- **[${issue.key}]** ${issue.fields.summary} (${issue.fields.issuetype?.name || 'Unknown'})`
).join('\n')}

## 📈 생산성 분석

### 담당자별 완료 현황
${Object.entries(assigneeCounts)
  .sort(([,a], [,b]) => b - a)
  .map(([assignee, count]) => `- **${assignee}**: ${count}개`)
  .join('\n')}

## 💡 인사이트 및 제안

- 총 ${issues.length}개의 이슈가 성공적으로 완료되었습니다.
- 가장 활발한 프로젝트는 **${Object.entries(projectCounts).sort(([,a], [,b]) => b - a)[0][0]}**입니다.
- 주요 작업 유형은 **${Object.entries(typeCounts).sort(([,a], [,b]) => b - a)[0][0]}**입니다.
- 팀의 지속적인 성과 향상을 위해 정기적인 리뷰를 권장합니다.

---
*보고서 생성 시간: ${new Date().toLocaleString('ko-KR')}*`;
}