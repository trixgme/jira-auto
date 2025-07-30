'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Sparkles, Loader2 } from 'lucide-react';
import { DifficultyBadge } from '@/components/difficulty-badge';
import { DifficultyDialog } from '@/components/difficulty-dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { JiraIssue, IssueDifficulty } from '@/lib/types';
import { DifficultyCache } from '@/lib/difficulty-cache';

interface IssueCardProps {
  issue: JiraIssue;
  onDifficultyAnalyzed?: (issueKey: string, difficulty: IssueDifficulty) => void;
}

export function IssueCard({ issue, onDifficultyAnalyzed }: IssueCardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [difficulty, setDifficulty] = useState<IssueDifficulty | undefined>(() => {
    return issue.difficulty || DifficultyCache.get(issue.key) || undefined;
  });
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);
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
        alert(`AI 분석 실패: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to analyze difficulty:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <Card 
        className="hover:shadow-lg transition-shadow duration-200 cursor-pointer hover:bg-accent/50" 
        onClick={handleCardClick}
      >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-start gap-2 flex-1 mr-2">
            <h3 className="text-sm font-semibold line-clamp-2 flex-1">
              {issue.fields.summary}
            </h3>
            {issue.fields.comment && issue.fields.comment.total > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                <MessageCircle className="h-3 w-3" />
                <span className="text-xs">{issue.fields.comment.total}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs shrink-0">
              {issue.key}
            </Badge>
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
                className="h-6 px-2"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground truncate">
            {issue.fields.project.name}
          </span>
          <div className="flex gap-1">
            <Badge className={`${getStatusColor(issue.fields.status.statusCategory.key)} text-white text-xs px-2 py-0`}>
              {issue.fields.status.name}
            </Badge>
            {issue.fields.priority && (
              <Badge className={`${getPriorityColor(issue.fields.priority.name)} text-white text-xs px-2 py-0`}>
                {issue.fields.priority.name}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>생성: {new Date(issue.fields.created).toLocaleDateString('ko-KR')}</span>
          <div className="flex items-center gap-2">
            {difficulty && (
              <span className="text-xs">예상 {difficulty.estimatedHours}시간</span>
            )}
            {issue.fields.assignee && (
              <span className="truncate">{issue.fields.assignee.displayName}</span>
            )}
          </div>
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
    </>
  );
}