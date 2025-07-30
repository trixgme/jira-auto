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
      fields: 'summary,status,project,created,updated,resolutiondate,assignee,priority,comment,reporter,description,issuetype,labels,components,fixVersions,timetracking,customfield_10016',
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

  async addComment(issueKey: string, comment: string) {
    const url = `${this.config.cloudUrl}/rest/api/3/issue/${issueKey}/comment`;
    
    const body = {
      body: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: comment
              }
            ]
          }
        ]
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to add comment: ${response.status} ${error}`);
    }

    return response.json();
  }

  async getIssueComments(issueKey: string) {
    const url = `${this.config.cloudUrl}/rest/api/3/issue/${issueKey}/comment`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get comments: ${response.status} ${error}`);
    }

    const data = await response.json();
    
    // 댓글을 간단한 형태로 변환
    return data.comments?.map((comment: any) => ({
      id: comment.id,
      author: comment.author?.displayName || 'Unknown',
      body: this.extractTextFromContent(comment.body),
      created: comment.created,
      updated: comment.updated
    })) || [];
  }

  private extractTextFromContent(content: any): string {
    if (!content) return '';
    
    if (typeof content === 'string') return content;
    
    if (content.content && Array.isArray(content.content)) {
      return content.content.map((item: any) => {
        if (item.type === 'paragraph' && item.content) {
          return item.content.map((textItem: any) => textItem.text || '').join('');
        }
        return '';
      }).join('\n');
    }
    
    return JSON.stringify(content);
  }
}