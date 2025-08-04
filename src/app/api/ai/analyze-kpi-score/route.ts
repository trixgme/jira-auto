import { NextRequest, NextResponse } from 'next/server';
import type { KpiScoreBreakdown } from '@/lib/kpi-score';

export async function POST(request: NextRequest) {
  try {
    const { scoreBreakdown, userName, language } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    if (!scoreBreakdown || !userName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const breakdown: KpiScoreBreakdown = scoreBreakdown;
    const isKorean = language === 'ko';

    const prompt = isKorean 
      ? `
당신은 숙련된 프로젝트 매니저이자 성과 분석 전문가입니다. 
다음 개발자의 KPI 성과를 종합적으로 분석하고 상세한 피드백을 제공해주세요.

**개발자**: ${userName}
**총점**: ${breakdown.totalScore}/100점 (등급: ${breakdown.grade})

**세부 점수**:
- 완료율: ${breakdown.completionRate}/40점 (완료율: ${breakdown.metrics.completionRatePercent}%)
- 생산성: ${breakdown.productivity}/30점 (평균 해결일: ${breakdown.metrics.avgResolutionDays}일)
- 품질: ${breakdown.quality}/20점 (평균 난이도: ${breakdown.metrics.avgDifficultyHandled}점)
- 일관성: ${breakdown.consistency}/10점 (시간 일관성: ${breakdown.metrics.timeConsistencyScore}/10)

**추가 지표**:
- 작업 빈도: ${breakdown.metrics.workFrequencyScore}/10
- 복잡도 보너스: +${breakdown.metrics.issueComplexityBonus}점
- 시간 일관성: ${breakdown.metrics.timeConsistencyScore}/10

다음 관점에서 종합 분석을 제공해주세요:

1. **강점 분석**: 가장 뛰어난 성과 영역과 그 이유
2. **개선 영역**: 주의 깊게 봐야 할 부분과 구체적 개선 방안
3. **성장 잠재력**: 현재 성과 패턴을 바탕으로 한 미래 성장 가능성
4. **팀 기여도**: 팀 전체 성과에 미치는 영향과 역할
5. **구체적 액션 아이템**: 실행 가능한 3-5개의 구체적 개선 방안

**분석 조건**:
- 건설적이고 격려적인 톤으로 작성
- 구체적인 수치와 데이터를 활용한 객관적 분석
- 실무에서 바로 적용 가능한 실용적 조언
- 개발자의 동기부여를 높이는 긍정적 피드백 포함
- 명확하고 읽기 쉬운 한국어로 작성

400-500자 정도의 상세한 분석을 제공해주세요.
      `
      : `
You are an experienced project manager and performance analysis expert.
Please provide a comprehensive analysis and detailed feedback on the following developer's KPI performance.

**Developer**: ${userName}
**Total Score**: ${breakdown.totalScore}/100 points (Grade: ${breakdown.grade})

**Detailed Scores**:
- Completion Rate: ${breakdown.completionRate}/40 points (Rate: ${breakdown.metrics.completionRatePercent}%)
- Productivity: ${breakdown.productivity}/30 points (Avg Resolution: ${breakdown.metrics.avgResolutionDays} days)
- Quality: ${breakdown.quality}/20 points (Avg Difficulty: ${breakdown.metrics.avgDifficultyHandled} points)
- Consistency: ${breakdown.consistency}/10 points (Time Consistency: ${breakdown.metrics.timeConsistencyScore}/10)

**Additional Metrics**:
- Work Frequency: ${breakdown.metrics.workFrequencyScore}/10
- Complexity Bonus: +${breakdown.metrics.issueComplexityBonus} points
- Time Consistency: ${breakdown.metrics.timeConsistencyScore}/10

Please provide comprehensive analysis from the following perspectives:

1. **Strengths Analysis**: Outstanding performance areas and reasons
2. **Improvement Areas**: Areas requiring attention with specific improvement strategies
3. **Growth Potential**: Future growth possibilities based on current performance patterns
4. **Team Contribution**: Impact on overall team performance and role
5. **Actionable Items**: 3-5 specific and executable improvement recommendations

**Analysis Requirements**:
- Constructive and encouraging tone
- Objective analysis using specific numbers and data
- Practical advice applicable in real work situations
- Positive feedback that motivates the developer
- Clear and readable English

Please provide a detailed analysis of about 300-400 words.
      `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const completion = await response.json();
    const analysis = completion.choices[0]?.message?.content;

    if (!analysis) {
      return NextResponse.json(
        { error: 'Failed to generate analysis' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      analysis,
      userName,
      totalScore: breakdown.totalScore,
      grade: breakdown.grade,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error analyzing KPI score:', error);
    return NextResponse.json(
      { error: 'Failed to analyze KPI score' },
      { status: 500 }
    );
  }
}