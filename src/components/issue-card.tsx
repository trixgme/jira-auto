'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Sparkles, Loader2, MessageSquare } from 'lucide-react';
import { DifficultyBadge } from '@/components/difficulty-badge';
import { DifficultyDialog } from '@/components/difficulty-dialog';
import { CommentAnalysisDialog } from '@/components/comment-analysis-dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { JiraIssue, IssueDifficulty, CommentAnalysis } from '@/lib/types';
import { DifficultyCache } from '@/lib/difficulty-cache';
import { useLanguage } from '@/contexts/language-context';

interface IssueCardProps {
  issue: JiraIssue;
  onDifficultyAnalyzed?: (issueKey: string, difficulty: IssueDifficulty) => void;
}

export function IssueCard({ issue, onDifficultyAnalyzed }: IssueCardProps) {
  const { t, language } = useLanguage();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [difficulty, setDifficulty] = useState<IssueDifficulty | undefined>(() => {
    return issue.difficulty || DifficultyCache.get(issue.key) || undefined;
  });
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);
  const [isAnalyzingComments, setIsAnalyzingComments] = useState(false);
  const [commentAnalysis, setCommentAnalysis] = useState<CommentAnalysis | null>(null);
  const [showCommentAnalysisDialog, setShowCommentAnalysisDialog] = useState(false);

  const getStatusColor = (statusCategory: string) => {
    switch (statusCategory.toLowerCase()) {
      case 'done':
        return 'bg-green-500';
      case 'in progress':
        return 'bg-blue-500';
      case 'todo':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'highest':
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
      case 'lowest':
        return 'bg-green-500';
      default:
        return 'bg-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isCompleted = () => {
    return issue.fields.status.statusCategory?.key === 'done' || 
           ['Done', 'Resolved', 'Closed', 'Complete', 'Fixed'].includes(issue.fields.status.name);
  };

  const getCompletionInfo = () => {
    if (!isCompleted() || !issue.fields.resolutiondate) return null;
    
    const createdDate = new Date(issue.fields.created);
    const completedDate = new Date(issue.fields.resolutiondate);
    const diffTime = completedDate.getTime() - createdDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // 소요시간을 더 사용자 친화적으로 표시
    const getDurationText = (days: number) => {
      if (days === 0) return t('same_day');
      if (days === 1) return t('one_day');
      if (days < 7) return t('n_days', days);
      if (days < 30) {
        const weeks = Math.floor(days / 7);
        const remainingDays = days % 7;
        if (remainingDays === 0) return t('n_weeks', weeks);
        return t('n_weeks_n_days', weeks, remainingDays);
      }
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      if (remainingDays === 0) return t('n_months', months);
      return t('n_months_n_days', months, remainingDays);
    };
    
    return {
      completedDate: completedDate.toLocaleDateString('ko-KR'),
      daysTaken: diffDays,
      durationText: getDurationText(diffDays)
    };
  };

  const handleCardClick = () => {
    const jiraUrl = 'https://gmeremit-team.atlassian.net';
    const issueUrl = `${jiraUrl}/browse/${issue.key}`;
    window.open(issueUrl, '_blank');
  };

  const analyzeDifficulty = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/ai/analyze-difficulty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: issue.fields.summary,
          description: issue.fields.description,
          issueType: issue.fields.issuetype?.name,
          labels: issue.fields.labels,
          issueKey: issue.key,
          priority: issue.fields.priority?.name,
          components: issue.fields.components?.map(c => c.name),
          fixVersions: issue.fields.fixVersions?.map(v => v.name),
          commentCount: issue.fields.comment?.total,
          storyPoints: issue.fields.customfield_10016,
          timeEstimate: issue.fields.timetracking?.originalEstimate,
          status: issue.fields.status.name,
          language: language,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const newDifficulty = { ...result, analyzedAt: new Date() };
        setDifficulty(newDifficulty);
        onDifficultyAnalyzed?.(issue.key, newDifficulty);
        setShowDifficultyDialog(true);
      } else {
        const error = await response.json();
        console.error('AI analysis failed:', error);
        alert(t('ai_analysis_failed', error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to analyze difficulty:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeComments = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnalyzingComments(true);
    
    try {
      const response = await fetch('/api/ai/analyze-comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issueKey: issue.key,
          issueTitle: issue.fields.summary,
          issueDescription: issue.fields.description,
          language: language,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const analysis = { ...result, analyzedAt: new Date() };
        setCommentAnalysis(analysis);
        setShowCommentAnalysisDialog(true);
      } else {
        const error = await response.json();
        console.error('Comment analysis failed:', error);
        alert(t('comment_analysis_failed', error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to analyze comments:', error);
      alert(t('comment_analysis_error'));
    } finally {
      setIsAnalyzingComments(false);
    }
  };

  return (
    <>
      <Card 
        className="hover:shadow-lg transition-shadow duration-200 cursor-pointer hover:bg-accent/50" 
        onClick={handleCardClick}
      >
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
          <div className="flex items-start gap-2 flex-1">
            <h3 className="text-xs sm:text-sm font-semibold line-clamp-2 flex-1">
              {issue.fields.summary}
            </h3>
            {issue.fields.comment && issue.fields.comment.total > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                <MessageCircle className="h-3 w-3" />
                <span className="text-xs">{issue.fields.comment.total}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0">
              {issue.key}
            </Badge>
            <div className="flex items-center gap-1">
              {difficulty ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDifficultyDialog(true);
                  }}
                  className="h-6 p-0"
                >
                  <DifficultyBadge difficulty={difficulty.difficulty} size="sm" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={analyzeDifficulty}
                  disabled={isAnalyzing}
                  className="h-6 px-1 sm:px-2"
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                </Button>
              )}
              
              {/* 댓글 분석 버튼 - 댓글이 2개 이상일 때만 표시 */}
              {issue.fields.comment && issue.fields.comment.total >= 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={analyzeComments}
                  disabled={isAnalyzingComments}
                  className="h-6 px-1 sm:px-2"
                  title={t('comment_analysis')}
                >
                  {isAnalyzingComments ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <MessageSquare className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-2">
          <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
            {issue.fields.project.name}
          </span>
          <div className="flex gap-1 flex-wrap">
            {issue.fields.issuetype && (
              <Badge variant="outline" className="text-[10px] sm:text-xs px-1 sm:px-2 py-0">
                {issue.fields.issuetype.name}
              </Badge>
            )}
            <Badge className={`${getStatusColor(issue.fields.status.statusCategory.key)} text-white text-[10px] sm:text-xs px-1 sm:px-2 py-0`}>
              {issue.fields.status.name}
            </Badge>
            {issue.fields.priority && (
              <Badge className={`${getPriorityColor(issue.fields.priority.name)} text-white text-[10px] sm:text-xs px-1 sm:px-2 py-0`}>
                {issue.fields.priority.name}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex flex-col text-[10px] sm:text-xs text-muted-foreground gap-1">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span>{t('created')}: {new Date(issue.fields.created).toLocaleDateString('ko-KR')}</span>
            <div className="flex items-center gap-1 sm:gap-2">
              {difficulty && (
                <span className="text-[10px] sm:text-xs">{t('estimated_hours', difficulty.estimatedHours)}</span>
              )}
              {issue.fields.assignee && (
                <span className="truncate">{issue.fields.assignee.displayName}</span>
              )}
            </div>
          </div>
          
          {(() => {
            const completionInfo = getCompletionInfo();
            if (completionInfo) {
              return (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-green-600 font-medium">
                    {t('completed')}: {completionInfo.completedDate}
                  </span>
                  <span className="text-blue-600 font-medium">
                    {t('duration')}: {completionInfo.durationText}
                  </span>
                </div>
              );
            }
            return null;
          })()}
        </div>
      </CardContent>
    </Card>
    
    <DifficultyDialog
      open={showDifficultyDialog}
      onOpenChange={setShowDifficultyDialog}
      issueKey={issue.key}
      issueTitle={issue.fields.summary}
      difficulty={difficulty || null}
    />
    
    <CommentAnalysisDialog
      open={showCommentAnalysisDialog}
      onOpenChange={setShowCommentAnalysisDialog}
      issueKey={issue.key}
      issueTitle={issue.fields.summary}
      analysis={commentAnalysis}
    />
    </>
  );
}