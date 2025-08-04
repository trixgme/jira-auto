// KPI 점수 계산 로직
import type { JiraIssue, IssueDifficulty } from '@/lib/types';

export interface KpiScoreBreakdown {
  totalScore: number; // 0-100점
  completionRate: number; // 완료율 점수 (0-40점)
  productivity: number; // 생산성 점수 (0-30점)
  quality: number; // 품질 점수 (0-20점)
  consistency: number; // 일관성 점수 (0-10점)
  
  // 상세 메트릭
  metrics: {
    completionRatePercent: number; // 완료율 퍼센트
    avgResolutionDays: number; // 평균 해결 일수
    avgDifficultyHandled: number; // 처리한 평균 난이도
    workFrequencyScore: number; // 작업 빈도 점수
    issueComplexityBonus: number; // 복잡한 이슈 처리 보너스
    timeConsistencyScore: number; // 해결 시간 일관성
  };
  
  // 등급
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  gradeColor: string;
}

/**
 * 사용자의 KPI 점수를 계산합니다
 */
export function calculateKpiScore(
  assignedIssues: JiraIssue[],
  resolvedIssues: JiraIssue[],
  unresolvedIssues: JiraIssue[],
  avgResolutionTime: number,
  issuesDifficulty: Record<string, IssueDifficulty> = {}
): KpiScoreBreakdown {
  const totalAssigned = assignedIssues.length;
  const totalResolved = resolvedIssues.length;
  
  // 기본값 (이슈가 없는 경우)
  if (totalAssigned === 0) {
    return {
      totalScore: 0,
      completionRate: 0,
      productivity: 0,
      quality: 0,
      consistency: 0,
      metrics: {
        completionRatePercent: 0,
        avgResolutionDays: 0,
        avgDifficultyHandled: 0,
        workFrequencyScore: 0,
        issueComplexityBonus: 0,
        timeConsistencyScore: 0,
      },
      grade: 'D',
      gradeColor: '#ef4444'
    };
  }

  // 1. 완료율 점수 (0-40점)
  const completionRatePercent = (totalResolved / totalAssigned) * 100;
  const completionRate = Math.min(40, (completionRatePercent / 100) * 40);

  // 2. 생산성 점수 (0-30점) - 평균 해결 시간 기반
  const productivity = calculateProductivityScore(avgResolutionTime, resolvedIssues);

  // 3. 품질 점수 (0-20점) - AI 난이도 분석 기반
  const quality = calculateQualityScore(resolvedIssues, issuesDifficulty);

  // 4. 일관성 점수 (0-10점) - 작업 패턴 일관성
  const consistency = calculateConsistencyScore(assignedIssues, resolvedIssues);

  // 상세 메트릭 계산
  const metrics = {
    completionRatePercent: Math.round(completionRatePercent),
    avgResolutionDays: avgResolutionTime,
    avgDifficultyHandled: calculateAvgDifficulty(resolvedIssues, issuesDifficulty),
    workFrequencyScore: calculateWorkFrequency(assignedIssues),
    issueComplexityBonus: calculateComplexityBonus(resolvedIssues, issuesDifficulty),
    timeConsistencyScore: calculateTimeConsistency(resolvedIssues),
  };

  // 총점 계산
  const totalScore = Math.min(100, Math.round(completionRate + productivity + quality + consistency));

  // 등급 계산
  const { grade, gradeColor } = calculateGrade(totalScore);

  return {
    totalScore,
    completionRate: Math.round(completionRate),
    productivity: Math.round(productivity),
    quality: Math.round(quality),
    consistency: Math.round(consistency),
    metrics,
    grade,
    gradeColor
  };
}

/**
 * 생산성 점수 계산 (0-30점)
 * 평균 해결 시간을 기반으로 점수를 계산합니다
 */
function calculateProductivityScore(avgResolutionTime: number, resolvedIssues: JiraIssue[]): number {
  if (resolvedIssues.length === 0 || avgResolutionTime === 0) {
    return 0;
  }

  // 이상적인 해결 시간: 1-7일 (30점), 8-14일 (20점), 15-30일 (10점), 30일+ (5점)
  let baseScore = 0;
  if (avgResolutionTime <= 7) {
    baseScore = 30;
  } else if (avgResolutionTime <= 14) {
    baseScore = 25;
  } else if (avgResolutionTime <= 21) {
    baseScore = 20;
  } else if (avgResolutionTime <= 30) {
    baseScore = 15;
  } else if (avgResolutionTime <= 45) {
    baseScore = 10;
  } else {
    baseScore = 5;
  }

  // 해결한 이슈 수에 따른 보너스 (많이 해결할수록 추가 점수)
  const volumeBonus = Math.min(5, Math.floor(resolvedIssues.length / 5));
  
  return Math.min(30, baseScore + volumeBonus);
}

/**
 * 품질 점수 계산 (0-20점)
 * 이슈 유형, 우선순위, 복잡도 등을 종합적으로 평가합니다
 */
function calculateQualityScore(
  resolvedIssues: JiraIssue[],
  issuesDifficulty: Record<string, IssueDifficulty>
): number {
  if (resolvedIssues.length === 0) {
    return 0;
  }

  let totalScore = 0;
  
  // 1. 이슈 유형별 점수 (8점) - 복잡한 이슈 유형일수록 높은 점수
  const issueTypeScore = calculateIssueTypeScore(resolvedIssues);
  totalScore += issueTypeScore;
  
  // 2. 우선순위별 점수 (6점) - 높은 우선순위 이슈 해결 시 더 높은 점수
  const priorityScore = calculatePriorityScore(resolvedIssues);
  totalScore += priorityScore;
  
  // 3. AI 난이도 보너스 (4점) - AI 분석이 있을 때만 추가 점수
  const aiDifficultyBonus = calculateAiDifficultyBonus(resolvedIssues, issuesDifficulty);
  totalScore += aiDifficultyBonus;
  
  // 4. 이슈 다양성 보너스 (2점) - 다양한 종류의 이슈를 해결했을 때
  const diversityBonus = calculateIssueDiversityBonus(resolvedIssues);
  totalScore += diversityBonus;

  return Math.min(20, Math.round(totalScore));
}

/**
 * 일관성 점수 계산 (0-10점)
 * 작업 빈도와 패턴의 일관성을 평가합니다
 */
function calculateConsistencyScore(assignedIssues: JiraIssue[], resolvedIssues: JiraIssue[]): number {
  if (assignedIssues.length === 0) {
    return 0;
  }

  // 시간 일관성 점수 (해결 시간의 일관성)
  const timeConsistency = calculateTimeConsistency(resolvedIssues);
  
  // 작업 빈도 점수 (꾸준한 작업 패턴)
  const workFrequency = calculateWorkFrequency(assignedIssues);
  
  return Math.min(10, Math.round((timeConsistency + workFrequency) / 2));
}

/**
 * 시간 일관성 점수 계산
 */
function calculateTimeConsistency(resolvedIssues: JiraIssue[]): number {
  if (resolvedIssues.length < 2) {
    return 5; // 기본 점수
  }

  const resolutionTimes = resolvedIssues
    .filter(issue => issue.fields.resolutiondate)
    .map(issue => {
      const created = new Date(issue.fields.created).getTime();
      const resolved = new Date(issue.fields.resolutiondate!).getTime();
      return Math.ceil((resolved - created) / (1000 * 60 * 60 * 24));
    });

  if (resolutionTimes.length < 2) {
    return 5;
  }

  // 표준편차를 이용한 일관성 측정
  const mean = resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length;
  const variance = resolutionTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / resolutionTimes.length;
  const standardDeviation = Math.sqrt(variance);
  
  // 표준편차가 낮을수록 일관성이 높음
  if (standardDeviation <= 3) {
    return 10; // 매우 일관성 있음
  } else if (standardDeviation <= 7) {
    return 8;  // 일관성 있음
  } else if (standardDeviation <= 14) {
    return 6;  // 보통
  } else {
    return 3;  // 일관성 낮음
  }
}

/**
 * 작업 빈도 점수 계산
 */
function calculateWorkFrequency(assignedIssues: JiraIssue[]): number {
  if (assignedIssues.length === 0) {
    return 0;
  }

  // 이슈가 생성된 날짜들을 분석하여 작업 패턴 파악
  const dates = assignedIssues.map(issue => {
    const date = new Date(issue.fields.created);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });

  const uniqueDates = new Set(dates);
  const totalDays = assignedIssues.length;
  const activeDays = uniqueDates.size;
  
  // 활동 일수 대비 이슈 수로 빈도 계산
  const frequency = totalDays / Math.max(1, activeDays);
  
  if (frequency >= 2) {
    return 10; // 매일 여러 이슈 처리
  } else if (frequency >= 1.5) {
    return 8;  // 활발한 작업
  } else if (frequency >= 1) {
    return 6;  // 꾸준한 작업
  } else {
    return 4;  // 가끔 작업
  }
}

/**
 * 평균 난이도 계산
 */
function calculateAvgDifficulty(
  resolvedIssues: JiraIssue[],
  issuesDifficulty: Record<string, IssueDifficulty>
): number {
  const analyzedIssues = resolvedIssues.filter(issue => issuesDifficulty[issue.key]);
  
  if (analyzedIssues.length === 0) {
    return 0;
  }

  const totalDifficulty = analyzedIssues.reduce((sum, issue) => {
    return sum + (issuesDifficulty[issue.key]?.difficulty || 5);
  }, 0);

  return Math.round((totalDifficulty / analyzedIssues.length) * 10) / 10;
}

/**
 * 이슈 유형별 점수 계산 (0-8점)
 * 복잡한 이슈 유형일수록 높은 점수
 */
function calculateIssueTypeScore(resolvedIssues: JiraIssue[]): number {
  if (resolvedIssues.length === 0) return 0;

  const typeScores: Record<string, number> = {
    // 높은 복잡도 (3점)
    'Epic': 3,
    'Story': 2.5,
    'New Feature': 2.5,
    'Improvement': 2,
    
    // 중간 복잡도 (2점)
    'Task': 2,
    'Bug': 2,
    
    // 낮은 복잡도 (1점)
    'Sub-task': 1,
    'Documentation': 1,
  };

  const totalTypeScore = resolvedIssues.reduce((sum, issue) => {
    const issueType = issue.fields.issuetype?.name || 'Task';
    return sum + (typeScores[issueType] || 1.5); // 기본값 1.5점
  }, 0);

  const avgTypeScore = totalTypeScore / resolvedIssues.length;
  return Math.min(8, Math.round(avgTypeScore * 4)); // 최대 8점으로 스케일링
}

/**
 * 우선순위별 점수 계산 (0-6점)
 * 높은 우선순위 이슈 해결 시 더 높은 점수
 */
function calculatePriorityScore(resolvedIssues: JiraIssue[]): number {
  if (resolvedIssues.length === 0) return 0;

  const priorityScores: Record<string, number> = {
    'Highest': 4,
    'High': 3,
    'Medium': 2,
    'Low': 1,
    'Lowest': 0.5,
  };

  const totalPriorityScore = resolvedIssues.reduce((sum, issue) => {
    const priority = issue.fields.priority?.name || 'Medium';
    return sum + (priorityScores[priority] || 2); // 기본값 2점
  }, 0);

  const avgPriorityScore = totalPriorityScore / resolvedIssues.length;
  return Math.min(6, Math.round(avgPriorityScore * 2)); // 최대 6점으로 스케일링
}

/**
 * AI 난이도 보너스 계산 (0-4점)
 * AI 분석이 있을 때만 추가 점수
 */
function calculateAiDifficultyBonus(
  resolvedIssues: JiraIssue[],
  issuesDifficulty: Record<string, IssueDifficulty>
): number {
  const analyzedIssues = resolvedIssues.filter(issue => issuesDifficulty[issue.key]);
  
  if (analyzedIssues.length === 0) {
    return 0; // AI 분석이 없으면 보너스 없음
  }

  // 평균 난이도 계산
  const avgDifficulty = analyzedIssues.reduce((sum, issue) => {
    return sum + (issuesDifficulty[issue.key]?.difficulty || 5);
  }, 0) / analyzedIssues.length;

  // 난이도별 보너스 점수
  if (avgDifficulty >= 8) {
    return 4; // 매우 어려운 이슈들
  } else if (avgDifficulty >= 6) {
    return 3; // 어려운 이슈들
  } else if (avgDifficulty >= 4) {
    return 2; // 보통 이슈들
  } else {
    return 1; // 쉬운 이슈들
  }
}

/**
 * 이슈 다양성 보너스 계산 (0-2점)
 * 다양한 종류의 이슈를 해결했을 때
 */
function calculateIssueDiversityBonus(resolvedIssues: JiraIssue[]): number {
  if (resolvedIssues.length === 0) return 0;

  const uniqueTypes = new Set(resolvedIssues.map(issue => issue.fields.issuetype?.name || 'Task'));
  const uniquePriorities = new Set(resolvedIssues.map(issue => issue.fields.priority?.name || 'Medium'));
  
  let diversityScore = 0;
  
  // 이슈 유형 다양성
  if (uniqueTypes.size >= 4) {
    diversityScore += 1;
  } else if (uniqueTypes.size >= 2) {
    diversityScore += 0.5;
  }
  
  // 우선순위 다양성
  if (uniquePriorities.size >= 3) {
    diversityScore += 1;
  } else if (uniquePriorities.size >= 2) {
    diversityScore += 0.5;
  }

  return Math.min(2, diversityScore);
}

/**
 * 복잡도 보너스 계산 (이전 함수 유지 - 메트릭 표시용)
 */
function calculateComplexityBonus(
  resolvedIssues: JiraIssue[],
  issuesDifficulty: Record<string, IssueDifficulty>
): number {
  const highDifficultyIssues = resolvedIssues.filter(issue => {
    const difficulty = issuesDifficulty[issue.key];
    return difficulty && difficulty.difficulty >= 7;
  });

  return Math.min(10, highDifficultyIssues.length * 2);
}

/**
 * 등급 계산 (S, A, B, C, D)
 */
function calculateGrade(totalScore: number): { grade: 'S' | 'A' | 'B' | 'C' | 'D'; gradeColor: string } {
  if (totalScore >= 90) {
    return { grade: 'S', gradeColor: '#9333ea' }; // 보라색
  } else if (totalScore >= 80) {
    return { grade: 'A', gradeColor: '#22c55e' }; // 초록색
  } else if (totalScore >= 70) {
    return { grade: 'B', gradeColor: '#3b82f6' }; // 파란색
  } else if (totalScore >= 60) {
    return { grade: 'C', gradeColor: '#f59e0b' }; // 주황색
  } else {
    return { grade: 'D', gradeColor: '#ef4444' }; // 빨간색
  }
}

/**
 * KPI 점수에 대한 설명 텍스트 생성
 */
export function getKpiScoreDescription(score: KpiScoreBreakdown, language: 'ko' | 'en' = 'ko'): {
  title: string;
  description: string;
  recommendations: string[];
} {
  const { totalScore, grade, metrics } = score;
  
  if (language === 'en') {
    return {
      title: `KPI Score: ${totalScore}/100 (Grade ${grade})`,
      description: `This score is calculated based on completion rate, productivity, quality, and consistency. Completion rate: ${metrics.completionRatePercent}%, Average resolution time: ${metrics.avgResolutionDays} days, Average difficulty handled: ${metrics.avgDifficultyHandled}.`,
      recommendations: getRecommendations(score, 'en')
    };
  }

  return {
    title: `KPI 점수: ${totalScore}/100점 (${grade}등급)`,
    description: `이 점수는 완료율, 생산성, 품질, 일관성을 종합하여 계산됩니다. 완료율: ${metrics.completionRatePercent}%, 평균 해결 시간: ${metrics.avgResolutionDays}일, 처리한 평균 난이도: ${metrics.avgDifficultyHandled}점.`,
    recommendations: getRecommendations(score, 'ko')
  };
}

/**
 * 개선 권장사항 생성
 */
function getRecommendations(score: KpiScoreBreakdown, language: 'ko' | 'en'): string[] {
  const recommendations: string[] = [];
  const { completionRate, productivity, quality, consistency, metrics } = score;

  if (language === 'en') {
    if (completionRate < 30) {
      recommendations.push('Focus on completing assigned issues to improve completion rate.');
    }
    if (productivity < 20) {
      recommendations.push('Try to resolve issues more quickly to increase productivity score.');
    }
    if (quality < 15) {
      recommendations.push('Challenge yourself with more complex issues to improve quality score.');
    }
    if (consistency < 7) {
      recommendations.push('Maintain consistent work patterns for better consistency score.');
    }
    if (score.totalScore >= 90) {
      recommendations.push('Excellent performance! Keep up the great work.');
    }
  } else {
    if (completionRate < 30) {
      recommendations.push('할당받은 이슈의 완료율을 높이는 데 집중해보세요.');
    }
    if (productivity < 20) {
      recommendations.push('이슈 해결 속도를 개선하여 생산성 점수를 높여보세요.');
    }
    if (quality < 15) {
      recommendations.push('더 복잡한 이슈에 도전하여 품질 점수를 향상시켜보세요.');
    }
    if (consistency < 7) {
      recommendations.push('일관된 작업 패턴을 유지하여 일관성 점수를 개선해보세요.');
    }
    if (score.totalScore >= 90) {
      recommendations.push('훌륭한 성과입니다! 계속 좋은 작업을 이어가세요.');
    }
    if (recommendations.length === 0) {
      recommendations.push('전반적으로 좋은 성과를 보이고 있습니다.');
    }
  }

  return recommendations;
}