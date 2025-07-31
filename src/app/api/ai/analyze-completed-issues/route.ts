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
  // 모든 이슈 포함하되 필드별 토큰 최적화
  const getIssueSummary = () => {
    const issuesSummary = issues.map(issue => ({
      key: issue.key,
      summary: issue.fields.summary?.substring(0, 80) || '', // 80자로 단축
      description: typeof issue.fields.description === 'string' 
        ? issue.fields.description.substring(0, 150) // 150자로 더 단축
        : '', 
      type: issue.fields.issuetype?.name || 'Unknown',
      priority: issue.fields.priority?.name || 'None',
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      project: issue.fields.project.name,
      status: issue.fields.status.name,
      created: issue.fields.created,
      resolved: issue.fields.resolutiondate,
      labels: (issue.fields.labels || []).slice(0, 2), // 라벨 2개로 제한
      components: (issue.fields.components?.map(c => c.name) || []).slice(0, 1) // 컴포넌트 1개로 제한
    }));

    // 상세 통계
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
      }, {} as Record<string, number>)),
      byPriority: Object.entries(issues.reduce((acc, issue) => {
        const priority = issue.fields.priority?.name || 'None';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)),
      byStatus: Object.entries(issues.reduce((acc, issue) => {
        const status = issue.fields.status.name;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>))
    };

    return { issuesSummary, stats, isLimited: false };
  };

  const { issuesSummary, stats, isLimited } = getIssueSummary();

  const periodText = dateRange 
    ? `${dateRange.startDate} ~ ${dateRange.endDate}`
    : `최근 ${period}일`;

  // 우선순위별 이모지 반환 함수
  const getPriorityEmoji = (priority: string): string => {
    switch (priority?.toLowerCase()) {
      case 'highest': case 'critical': return '🔴';
      case 'high': return '🟡';  
      case 'medium': return '🟢';
      case 'low': return '🔵';
      case 'lowest': return '⚪';
      default: return '⚫';
    }
  };

  const prompt = `${periodText} 기간에 완료된 Jira 이슈에 대한 아름답고 전문적인 마크다운 보고서를 작성해주세요.

## 📋 기본 정보
| 항목 | 세부사항 |
|------|----------|
| 🎯 **프로젝트** | ${project === 'all' ? '전체 프로젝트' : project} |
| 📅 **분석 기간** | ${periodText} |
| ✅ **완료된 이슈** | ${issues.length}개 |

## 📊 통계 요약
**프로젝트별:** ${stats.byProject.map(([name, count]) => `${name}(${count})`).join(', ')}
**유형별:** ${stats.byType.map(([name, count]) => `${name}(${count})`).join(', ')}
**우선순위별:** ${stats.byPriority.map(([name, count]) => `${name}(${count})`).join(', ')}
**담당자별:** ${stats.byAssignee.slice(0, 5).map(([name, count]) => `${name}(${count})`).join(', ')}

## 📋 완료된 이슈 목록 (${issuesSummary.length}개)

${issuesSummary.map((issue, index) => {
  const resolvedDate = issue.resolved ? new Date(issue.resolved).toLocaleDateString('ko-KR') : 'N/A';
  const duration = issue.resolved ? Math.ceil((new Date(issue.resolved).getTime() - new Date(issue.created).getTime()) / (1000 * 60 * 60 * 24)) : 'N/A';
  
  return `**${index + 1}. [${issue.key}]** ${issue.summary}
- ${issue.type} | ${issue.priority} | ${issue.assignee} | ${issue.project}
- 완료: ${resolvedDate} (${duration}일)${issue.description ? ` | ${issue.description}` : ''}${issue.labels.length > 0 ? ` | 라벨: ${issue.labels.join(', ')}` : ''}`;
}).join('\n')}

**다음 구조로 마크다운 보고서를 작성해주세요:**

# 🚀 Jira 이슈 완료 분석 보고서
> 📊 ${periodText} 기간 성과 분석

## 🎯 Executive Summary
핵심 요약 및 주요 지표

## 📊 완료 현황 분석
- 📈 전체 통계 및 프로젝트별 현황
- 🏷️ 이슈 유형별 분포와 특징
- 🚨 우선순위별 처리 현황

## 🏆 주요 성과
- ⭐ 중요 완료 이슈 TOP 5
- 💪 복잡한 이슈들의 해결 과정
- ⚡ 효율적으로 처리된 이슈들

## 📈 생산성 분석
- 👥 팀원별 기여도 및 성과
- ⏱️ 평균 처리 시간 분석
- 🏢 프로젝트별 생산성 비교

## 🔍 패턴 및 트렌드
- 📈 처리 패턴의 변화
- 🔄 반복되는 이슈 유형
- 🎯 개선 기회 발견

## 💡 개선 제안
- 🎯 핵심 발견사항
- 🚀 생산성 향상 방안
- 🤝 팀 협업 개선점

## 📋 Action Items
- [ ] 즉시 실행 항목
- [ ] 단기 개선 과제 (1-2주)
- [ ] 중기 전략 과제 (1-3개월)

## 🎯 결론
기간별 성과 평가 및 향후 계획

---
*📅 ${new Date().toLocaleString('ko-KR')} | 🤖 GPT-4.1 분석*

마크다운 형식(테이블, 이모지, 인용문, 체크박스 등)을 활용하여 상세하고 실용적인 보고서를 작성해주세요.`;


  // 모든 이슈 포함 - 필드별 토큰 최적화 적용
  console.log(`AI 보고서 생성 - 전체 이슈 ${issues.length}개 모두 분석`);

  try {
    // OpenAI API 호출 - GPT-4.1 모델로 최적화된 토큰 사용
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1', // 최신 GPT-4.1 모델 (향상된 코딩, 지시사항 이행, 긴 컨텍스트 이해)
        messages: [
          {
            role: 'system',
            content: '프로젝트 관리 및 데이터 분석 전문가로서 Jira 이슈 데이터를 분석하여 실용적이고 통찰력 있는 마크다운 보고서를 작성합니다. 패턴과 트렌드를 발견하고 실행 가능한 개선안을 제공합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 16384, // GPT-4o 최대 출력 토큰 수
        temperature: 0.3 // 더 정확하고 일관된 분석을 위해 낮은 temperature
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
    console.warn('OpenAI API 실패, 기본 보고서 생성:', error instanceof Error ? error.message : error);
    
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