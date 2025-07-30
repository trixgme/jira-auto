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
  if (!difficulty) return null;

  const getDifficultyDescription = (level: number) => {
    switch (level) {
      case 1:
        return "매우 간단한 작업으로, 경험이 적은 개발자도 쉽게 처리할 수 있습니다.";
      case 2:
        return "비교적 간단한 작업으로, 기본적인 이해만 있으면 처리 가능합니다.";
      case 3:
        return "중간 정도의 복잡도로, 어느 정도의 경험과 설계가 필요합니다.";
      case 4:
        return "복잡한 작업으로, 숙련된 개발자와 신중한 계획이 필요합니다.";
      case 5:
        return "매우 복잡한 작업으로, 아키텍처 변경이나 광범위한 영향을 미칠 수 있습니다.";
      default:
        return "";
    }
  };

  const getRecommendations = (level: number) => {
    switch (level) {
      case 1:
      case 2:
        return [
          "주니어 개발자에게 할당 가능",
          "코드 리뷰는 기본적인 수준으로 충분",
          "테스트 케이스 작성 권장",
        ];
      case 3:
        return [
          "중급 이상 개발자 권장",
          "설계 문서 작성 필요",
          "철저한 코드 리뷰 필요",
          "단위 테스트 및 통합 테스트 필수",
        ];
      case 4:
      case 5:
        return [
          "시니어 개발자 필수",
          "상세한 기술 설계 문서 필요",
          "여러 번의 코드 리뷰 세션 권장",
          "포괄적인 테스트 전략 수립",
          "관련 팀과의 협의 필요",
        ];
      default:
        return [];
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI 난이도 분석 결과
          </DialogTitle>
          <DialogDescription>
            {issueKey} - {issueTitle}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center py-4">
            <DifficultyBadge difficulty={difficulty.difficulty} size="lg" />
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold mb-2">난이도 설명</h4>
              <p className="text-sm text-muted-foreground">
                {getDifficultyDescription(difficulty.difficulty)}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                AI 분석 근거 (English)
              </h4>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {difficulty.reasoning}
              </p>
            </div>

            {difficulty.reasoningKo && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  AI 분석 근거 (한국어)
                </h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {difficulty.reasoningKo}
                </p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                예상 소요 시간
              </h4>
              <Badge variant="secondary" className="text-sm">
                약 {difficulty.estimatedHours}시간
              </Badge>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">권장 사항</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {getRecommendations(difficulty.difficulty).map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {difficulty.commentAdded !== undefined && (
              <div className={`flex items-center gap-2 p-3 rounded-md ${
                difficulty.commentAdded ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'
              }`}>
                {difficulty.commentAdded ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-400">
                      Jira 이슈에 분석 결과가 댓글로 추가되었습니다
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-700 dark:text-yellow-400">
                      Jira 댓글 추가 실패 (수동으로 복사해서 사용하세요)
                    </span>
                  </>
                )}
              </div>
            )}

            {difficulty.analyzedAt && (
              <div className="text-xs text-muted-foreground text-right">
                분석 일시: {new Date(difficulty.analyzedAt).toLocaleString("ko-KR")}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}