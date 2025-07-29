interface JiraConfig {
  cloudUrl: string;
  userEmail: string;
  apiToken: string;
}

interface JiraIssue {
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

interface JiraSearchResponse {
  issues: JiraIssue[];
  total: number;
  startAt: number;
  maxResults: number;
}

export class JiraClient {
  private config: JiraConfig;
  private headers: HeadersInit;

  constructor() {
    const cloudUrl = process.env.JIRA_CLOUD_URL;
    const userEmail = process.env.JIRA_USER_EMAIL;
    const apiToken = process.env.JIRA_API_TOKEN;

    if (!cloudUrl || !userEmail || !apiToken) {
      throw new Error('Missing Jira configuration in environment variables');
    }

    this.config = { cloudUrl, userEmail, apiToken };
    
    const auth = Buffer.from(`${userEmail}:${apiToken}`).toString('base64');
    this.headers = {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  async searchIssues(jql: string, startAt = 0, maxResults = 1000): Promise<JiraSearchResponse> {
    const url = `${this.config.cloudUrl}/rest/api/3/search`;
    const params = new URLSearchParams({
      jql,
      startAt: startAt.toString(),
      maxResults: maxResults.toString(),
      fields: 'summary,status,project,created,updated,resolutiondate,assignee,priority,comment,reporter',
    });

    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getAllIssues(jql: string): Promise<JiraIssue[]> {
    const allIssues: JiraIssue[] = [];
    let startAt = 0;
    const maxResults = 100; // 한 번에 100개씩 가져오기
    
    while (true) {
      const response = await this.searchIssues(jql, startAt, maxResults);
      allIssues.push(...response.issues);
      
      // 더 이상 가져올 이슈가 없으면 중단
      if (response.issues.length < maxResults || startAt + maxResults >= response.total) {
        break;
      }
      
      startAt += maxResults;
    }
    
    return allIssues;
  }

  async getRecentlyCreatedIssues(daysBack = 7, projectKey?: string): Promise<JiraIssue[]> {
    let jql = `created >= -${daysBack}d`;
    if (projectKey && projectKey !== 'all') {
      jql = `project = ${projectKey} AND ${jql}`;
    }
    jql += ` ORDER BY created DESC`;
    return await this.getAllIssues(jql);
  }

  async getRecentlyCompletedIssues(daysBack = 7, projectKey?: string): Promise<JiraIssue[]> {
    let jql = `status in (Done, Resolved, Closed) AND updated >= -${daysBack}d`;
    if (projectKey && projectKey !== 'all') {
      jql = `project = ${projectKey} AND ${jql}`;
    }
    jql += ` ORDER BY updated DESC`;
    return await this.getAllIssues(jql);
  }

  async getAllProjects() {
    const url = `${this.config.cloudUrl}/rest/api/3/project`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}