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
  };
}