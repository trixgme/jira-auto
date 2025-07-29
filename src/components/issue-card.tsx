'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';

interface Issue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
      statusCategory: {
        key: string;
        name: string;
      };
    };
    project: {
      key: string;
      name: string;
    };
    created: string;
    updated: string;
    resolutiondate?: string;
    assignee?: {
      displayName: string;
      emailAddress: string;
    };
    priority?: {
      name: string;
    };
    comment?: {
      comments: any[];
      total: number;
    };
  };
}

interface IssueCardProps {
  issue: Issue;
}

export function IssueCard({ issue }: IssueCardProps) {
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

  return (
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
          <Badge variant="outline" className="text-xs shrink-0">
            {issue.key}
          </Badge>
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
          {issue.fields.assignee && (
            <span className="truncate ml-2">{issue.fields.assignee.displayName}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}