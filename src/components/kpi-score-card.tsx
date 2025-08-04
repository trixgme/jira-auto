'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GradientProgress } from '@/components/ui/gradient-progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Award, TrendingUp, Clock, Target, Zap, BarChart3, Info, Brain, Loader2 } from 'lucide-react';
import type { KpiScoreBreakdown } from '@/lib/kpi-score';
import { useLanguage } from '@/contexts/language-context';

interface KpiScoreCardProps {
  scoreBreakdown: KpiScoreBreakdown;
  userName: string;
  assignedCount: number;
  resolvedCount: number;
}

interface AiAnalysis {
  analysis: string;
  userName: string;
  totalScore: number;
  grade: string;
  timestamp: string;
}

export function KpiScoreCard({ scoreBreakdown, userName, assignedCount, resolvedCount }: KpiScoreCardProps) {
  const { t, language } = useLanguage();
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/ai/analyze-kpi-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scoreBreakdown,
          userName,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze KPI score');
      }

      const result: AiAnalysis = await response.json();
      setAiAnalysis(result);
    } catch (error) {
      console.error('Error analyzing KPI score:', error);
      setAnalysisError(t('ai_analysis_failed_retry'));
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const {
    totalScore,
    completionRate,
    productivity,
    quality,
    consistency,
    metrics,
    grade,
    gradeColor
  } = scoreBreakdown;

  return (
    <div className="space-y-4">
      {/* 메인 점수 카드 */}
      <Card className="border-2" style={{ borderColor: gradeColor }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="flex items-center justify-center w-12 h-12 rounded-full text-white font-bold text-lg"
                style={{ backgroundColor: gradeColor }}
              >
                {grade}
              </div>
              <div>
                <CardTitle className="text-lg">{t('kpi_score_title', userName)}</CardTitle>
                <CardDescription>
                  {t('assigned_issues')}: {assignedCount} | {t('resolved_issues')}: {resolvedCount}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold" style={{ color: gradeColor }}>
                {totalScore}
              </div>
              <div className="text-sm text-muted-foreground">/ 100{t('points')}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 전체 진행률 바 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t('overall_performance')}</span>
              <span className="text-sm text-muted-foreground">{totalScore}/100</span>
            </div>
            <GradientProgress value={totalScore} height="lg" showText={true} />
          </div>

          {/* 완료율 정보 */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {metrics.completionRatePercent}%
              </div>
              <div className="text-xs text-muted-foreground">{t('completion_rate')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {metrics.avgResolutionDays}
              </div>
              <div className="text-xs text-muted-foreground">{t('avg_days')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 상세 점수 분석 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-4 h-4" />
            {t('detailed_score_analysis')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 완료율 (40점) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">{t('completion_rate_score')}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent 
                      side="right" 
                      align="start" 
                      sideOffset={5}
                      avoidCollisions={true}
                      collisionPadding={10}
                    >
                      <p>{t('completion_rate_tooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-sm font-semibold">{completionRate}/40</span>
            </div>
            <GradientProgress 
              value={(completionRate / 40) * 100} 
              height="md" 
              gradientType="success"
              showText={false}
            />
            <div className="text-xs text-muted-foreground">
              {t('completed_ratio', resolvedCount, assignedCount)} ({metrics.completionRatePercent}%)
            </div>
          </div>

          {/* 생산성 (30점) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">{t('productivity_score')}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent 
                      side="right" 
                      align="start" 
                      sideOffset={5}
                      avoidCollisions={true}
                      collisionPadding={10}
                    >
                      <p>{t('productivity_tooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-sm font-semibold">{productivity}/30</span>
            </div>
            <GradientProgress 
              value={(productivity / 30) * 100} 
              height="md" 
              gradientType="blue"
              showText={false}
            />
            <div className="text-xs text-muted-foreground">
              {t('avg_resolution_time')}: {metrics.avgResolutionDays}{t('days')}
            </div>
          </div>

          {/* 품질 (20점) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">{t('quality_score')}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent 
                      side="right" 
                      align="start" 
                      sideOffset={5}
                      avoidCollisions={true}
                      collisionPadding={10}
                    >
                      <p>{t('quality_tooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-sm font-semibold">{quality}/20</span>
            </div>
            <GradientProgress 
              value={(quality / 20) * 100} 
              height="md" 
              gradientType="purple"
              showText={false}
            />
            <div className="text-xs text-muted-foreground">
              {metrics.avgDifficultyHandled > 0 
                ? t('avg_difficulty_handled', metrics.avgDifficultyHandled)
                : t('no_ai_analysis_available')
              }
            </div>
          </div>

          {/* 일관성 (10점) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium">{t('consistency_score')}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent 
                      side="right" 
                      align="start" 
                      sideOffset={5}
                      avoidCollisions={true}
                      collisionPadding={10}
                    >
                      <p>{t('consistency_tooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-sm font-semibold">{consistency}/10</span>
            </div>
            <GradientProgress 
              value={(consistency / 10) * 100} 
              height="md" 
              gradientType="warning"
              showText={false}
            />
            <div className="text-xs text-muted-foreground">
              {t('work_pattern_consistency')}: {metrics.timeConsistencyScore}/10
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 추가 메트릭 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4" />
            {t('additional_metrics')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-muted-foreground">{t('work_frequency')}</div>
              <div className="font-semibold">{metrics.workFrequencyScore}/10</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">{t('complexity_bonus')}</div>
              <div className="font-semibold">+{metrics.issueComplexityBonus}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">{t('time_consistency')}</div>
              <div className="font-semibold">{metrics.timeConsistencyScore}/10</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">{t('grade_level')}</div>
              <div className="font-semibold">
                <Badge style={{ backgroundColor: gradeColor, color: 'white' }}>
                  {grade} {t('grade')}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 개선 권장사항 / 축하 메시지 카드 */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-blue-800 dark:text-blue-200">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            {scoreBreakdown.totalScore >= 90 
              ? (language === 'ko' ? '축하합니다!' : 'Congratulations!') 
              : t('improvement_recommendations')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
            {getImprovementSuggestions(scoreBreakdown, language).map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500 dark:text-blue-400 mt-1">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* AI 종합 분석 카드 */}
      <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <CardTitle className="text-base text-purple-800 dark:text-purple-200">
                {t('ai_comprehensive_analysis')}
              </CardTitle>
            </div>
            {!aiAnalysis && (
              <Button
                onClick={handleAiAnalysis}
                disabled={isAnalyzing}
                variant="outline"
                size="sm"
                className="border-purple-300 text-purple-700 hover:bg-purple-100 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('ai_analyzing')}
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    AI 분석 시작
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!aiAnalysis && !isAnalyzing && !analysisError && (
            <div className="text-center py-8 text-purple-600 dark:text-purple-400">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {language === 'ko' 
                  ? 'AI가 전체적인 성과를 종합 분석해드립니다. 분석 버튼을 클릭해주세요.' 
                  : 'AI will provide comprehensive performance analysis. Click the analysis button.'}
              </p>
            </div>
          )}

          {isAnalyzing && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-purple-600 dark:text-purple-400" />
              <p className="text-sm text-purple-600 dark:text-purple-400">{t('ai_analyzing')}</p>
            </div>
          )}

          {analysisError && (
            <div className="text-center py-6">
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">{analysisError}</p>
              <Button
                onClick={handleAiAnalysis}
                variant="outline"
                size="sm"
                className="border-purple-300 text-purple-700 hover:bg-purple-100 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900"
              >
                {language === 'ko' ? '다시 시도' : 'Retry'}
              </Button>
            </div>
          )}

          {aiAnalysis && (
            <div className="space-y-4">
              <div className="prose prose-sm max-w-none text-purple-800 dark:text-purple-200">
                <div className="whitespace-pre-wrap leading-relaxed">
                  {aiAnalysis.analysis}
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-purple-200 dark:border-purple-700">
                <div className="text-xs text-purple-600 dark:text-purple-400">
                  {language === 'ko' 
                    ? `분석 완료: ${new Date(aiAnalysis.timestamp).toLocaleString('ko-KR')}` 
                    : `Analysis completed: ${new Date(aiAnalysis.timestamp).toLocaleString('en-US')}`}
                </div>
                <Button
                  onClick={handleAiAnalysis}
                  variant="ghost"
                  size="sm"
                  className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  {language === 'ko' ? '새로 분석' : 'Reanalyze'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 개선 권장사항 생성
 */
function getImprovementSuggestions(scoreBreakdown: KpiScoreBreakdown, language: 'ko' | 'en'): string[] {
  const { completionRate, productivity, quality, consistency, totalScore } = scoreBreakdown;
  const suggestions: string[] = [];

  if (totalScore >= 90) {
    // High score congratulatory messages
    if (language === 'en') {
      suggestions.push('Outstanding performance! You are exceeding expectations in all areas.');
      suggestions.push('Your consistent high-quality work is setting a great example for the team.');
      suggestions.push('Keep up the excellent work and continue to be a role model.');
    } else {
      suggestions.push('탁월한 성과입니다! 모든 영역에서 기대치를 뛰어넘고 있습니다.');
      suggestions.push('일관된 고품질 작업으로 팀에 좋은 모범을 보여주고 있습니다.');
      suggestions.push('지속적인 우수한 성과를 유지하며 롤모델이 되어주세요.');
    }
  } else {
    // Improvement suggestions for scores below 90
    if (language === 'en') {
      if (completionRate < 30) {
        suggestions.push('Focus on completing more assigned issues to improve your completion rate.');
      }
      if (productivity < 20) {
        suggestions.push('Try to resolve issues more quickly to boost your productivity score.');
      }
      if (quality < 15) {
        suggestions.push('Take on more complex issues to improve your quality score.');
      }
      if (consistency < 7) {
        suggestions.push('Maintain more consistent work patterns and resolution times.');
      }
      if (totalScore >= 80) {
        suggestions.push('Great work! Focus on maintaining your current performance level.');
      }
      if (suggestions.length === 0) {
        suggestions.push('Overall balanced performance. Keep up the good work.');
      }
    } else {
      if (completionRate < 30) {
        suggestions.push('할당받은 이슈를 더 많이 완료하여 완료율을 개선해보세요.');
      }
      if (productivity < 20) {
        suggestions.push('이슈 해결 속도를 높여 생산성 점수를 향상시켜보세요.');
      }
      if (quality < 15) {
        suggestions.push('더 복잡하고 도전적인 이슈에 참여하여 품질 점수를 높여보세요.');
      }
      if (consistency < 7) {
        suggestions.push('더 일관된 작업 패턴과 해결 시간을 유지해보세요.');
      }
      if (totalScore >= 80) {
        suggestions.push('훌륭한 성과입니다! 현재 수준을 유지하는 데 집중해보세요.');
      }
      if (suggestions.length === 0) {
        suggestions.push('전반적으로 균형 잡힌 성과를 보이고 있습니다.');
      }
    }
  }

  return suggestions;
}