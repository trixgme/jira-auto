'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { Clock, Brain, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import type { IssueDifficulty } from "@/lib/types";
import { useLanguage } from '@/contexts/language-context';

interface DifficultyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issueKey: string;
  issueTitle: string;
  difficulty: IssueDifficulty | null;
}

export function DifficultyDialog({
  open,
  onOpenChange,
  issueKey,
  issueTitle,
  difficulty,
}: DifficultyDialogProps) {
  const { t } = useLanguage();
  if (!difficulty) return null;

  const getDifficultyDescription = (level: number) => {
    switch (level) {
      case 1:
        return t('difficulty_very_easy');
      case 2:
        return t('difficulty_easy');
      case 3:
        return t('difficulty_medium');
      case 4:
        return t('difficulty_hard');
      case 5:
        return t('difficulty_very_hard');
      default:
        return "";
    }
  };

  const getRecommendations = (level: number) => {
    switch (level) {
      case 1:
      case 2:
        return [
          t('rec_junior_assignable'),
          t('rec_basic_review'),
          t('rec_test_recommended'),
        ];
      case 3:
        return [
          t('rec_intermediate_dev'),
          t('rec_design_doc_needed'),
          t('rec_thorough_review'),
          t('rec_tests_required'),
        ];
      case 4:
      case 5:
        return [
          t('rec_senior_required'),
          t('rec_detailed_design'),
          t('rec_multiple_reviews'),
          t('rec_comprehensive_testing'),
          t('rec_team_discussion'),
        ];
      default:
        return [];
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            {t('ai_difficulty_analysis')}
          </DialogTitle>
          <DialogDescription className="break-words">
            <span className="font-mono text-xs">{issueKey}</span>
            <span className="mx-2">-</span>
            <span className="break-words">{issueTitle}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 max-w-full">
          <div className="flex items-center justify-center py-4">
            <DifficultyBadge difficulty={difficulty.difficulty} size="lg" />
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">{t('difficulty_description')}</h4>
              <p className="text-sm text-muted-foreground break-words">
                {getDifficultyDescription(difficulty.difficulty)}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {t('ai_analysis_reasoning_en')}
              </h4>
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md max-w-full overflow-hidden">
                <p className="break-words whitespace-pre-wrap">{difficulty.reasoning}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t('estimated_time')}
              </h4>
              <Badge variant="secondary" className="text-sm">
                {t('about_n_hours', difficulty.estimatedHours)}
              </Badge>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">{t('recommendations')}</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                {getRecommendations(difficulty.difficulty).map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1 flex-shrink-0">•</span>
                    <span className="break-words">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {difficulty.commentAdded !== undefined && (
              <div className={`flex items-start gap-2 p-3 rounded-md ${
                difficulty.commentAdded ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'
              }`}>
                {difficulty.commentAdded ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-green-700 dark:text-green-400 break-words">
                      {t('comment_added_to_jira')}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-yellow-700 dark:text-yellow-400 break-words">
                      {t('comment_add_failed')}
                    </span>
                  </>
                )}
              </div>
            )}

            {difficulty.analyzedAt && (
              <div className="text-xs text-muted-foreground text-right">
                {t('analysis_time', new Date(difficulty.analyzedAt).toLocaleString("ko-KR"))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}