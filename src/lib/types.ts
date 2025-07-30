export interface JiraProject {
  id: string;
  key: string;
  name: string;
  avatarUrls?: {
    '48x48': string;
    '32x32': string;
    '24x24': string;
    '16x16': string;
  };
  projectTypeKey?: string;
}

export interface IssueDifficulty {
  difficulty: number;
  reasoning: string;
  reasoningKo: string;
  estimatedHours: number;
  analyzedAt?: Date;
  commentAdded?: boolean;
}

export interface CommentAnalysis {
  score: number;
  analysisKo: string;
  analysisEn: string;
  isHardToDetermine: boolean;
  keyIssues: string[];
  recommendations: string[];
  scoreDescriptionKo: string;
  scoreDescriptionEn: string;
  analyzedAt?: Date;
}

export interface JiraIssue {
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
    reporter?: {
      displayName: string;
      emailAddress: string;
    };
    description?: string;
    issuetype?: {
      name: string;
      iconUrl: string;
    };
    labels?: string[];
    components?: Array<{
      name: string;
    }>;
    fixVersions?: Array<{
      name: string;
    }>;
    timetracking?: {
      originalEstimate?: string;
      remainingEstimate?: string;
      timeSpent?: string;
    };
    customfield_10016?: number; // Story points
  };
  difficulty?: IssueDifficulty;
}