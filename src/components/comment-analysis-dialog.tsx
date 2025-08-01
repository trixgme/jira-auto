'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { CommentAnalysis } from "@/lib/types";
import { useLanguage } from '@/contexts/language-context';

interface CommentAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issueKey: string;
  issueTitle: string;
  analysis: CommentAnalysis | null;
}

export function CommentAnalysisDialog({
  open,
  onOpenChange,
  issueKey,
  issueTitle,
  analysis,
}: CommentAnalysisDialogProps) {
  const { t } = useLanguage();
  if (!analysis) return null;

  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-green-500 hover:bg-green-600";
    if (score >= 6) return "bg-blue-500 hover:bg-blue-600";
    if (score >= 4) return "bg-yellow-500 hover:bg-yellow-600";
    return "bg-red-500 hover:bg-red-600";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 7) return <TrendingUp className="h-5 w-5" />;
    if (score >= 4) return <AlertTriangle className="h-5 w-5" />;
    return <TrendingDown className="h-5 w-5" />;
  };

  const getScoreText = (score: number) => {
    if (score >= 8) return t('comment_score_very_good');
    if (score >= 6) return t('comment_score_good');
    if (score >= 4) return t('comment_score_normal');
    return t('comment_score_needs_improvement');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t('comment_analysis_result')}
          </DialogTitle>
          <DialogDescription className="break-words">
            <span className="font-mono text-xs">{issueKey}</span>
            <span className="mx-2">-</span>
            <span className="break-words">{issueTitle}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 max-w-full">
          {/* 점수 표시 */}
          <div className="flex items-center justify-center py-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                {getScoreIcon(analysis.score)}
                <Badge className={`${getScoreColor(analysis.score)} text-white text-lg px-4 py-2`}>
                  {analysis.score}/10
                </Badge>
              </div>
              <p className="text-sm font-medium">{getScoreText(analysis.score)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {analysis.scoreDescription}
              </p>
            </div>
          </div>

          {/* 판단 어려움 표시 */}
          {analysis.isHardToDetermine && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-yellow-700 dark:text-yellow-400 break-words">
                {t('analysis_difficulty_warning')}
              </span>
            </div>
          )}

          <div className="space-y-4">
            {/* 분석 결과 */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                {t('analysis_result_ko')}
              </h4>
              <div className="text-sm text-muted-foreground bg-muted p-4 rounded-md max-w-full overflow-hidden">
                <p className="break-words whitespace-pre-wrap leading-relaxed">
                  {analysis.analysis}
                </p>
              </div>
            </div>

            {/* 주요 이슈 */}
            {analysis.keyIssues && analysis.keyIssues.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  {t('key_issues')}
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {analysis.keyIssues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-red-500 mt-1 flex-shrink-0">•</span>
                      <span className="break-words">{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 개선 권장사항 */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {t('improvement_recommendations')}
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1 flex-shrink-0">•</span>
                      <span className="break-words">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 분석 일시 */}
            {analysis.analyzedAt && (
              <div className="text-xs text-muted-foreground text-right pt-2 border-t">
                {t('analysis_time', new Date(analysis.analyzedAt).toLocaleString("ko-KR"))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}