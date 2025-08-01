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
  private baseHeaders: HeadersInit;

  constructor() {
    const cloudUrl = process.env.JIRA_CLOUD_URL;
    const userEmail = process.env.JIRA_USER_EMAIL;
    const apiToken = process.env.JIRA_API_TOKEN;

    if (!cloudUrl || !userEmail || !apiToken) {
      throw new Error('Missing Jira configuration in environment variables');
    }

    this.config = { cloudUrl, userEmail, apiToken };
    
    const auth = Buffer.from(`${userEmail}:${apiToken}`).toString('base64');
    this.baseHeaders = {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  // 언어별 헤더 생성
  private getHeaders(language?: string): HeadersInit {
    const headers = { ...this.baseHeaders };
    
    // 현재 선택된 언어에 맞는 로케일 설정
    const langMap: Record<string, string> = {
      'ko': 'ko-KR', // 한국어 요청 시 한국어로 반환
      'en': 'en-US'  // 영어 요청 시 영어로 반환
    };
    
    const locale = langMap[language || 'en'] || 'en-US';
    (headers as any)['Accept-Language'] = locale;
    (headers as any)['X-Force-Accept-Language'] = locale;
    
    console.log(`🌐 Jira API 언어 설정: ${language} → ${locale}`);
    
    return headers;
  }

  async searchIssues(jql: string, startAt = 0, maxResults = 1000, language?: string): Promise<JiraSearchResponse> {
    const url = `${this.config.cloudUrl}/rest/api/3/search`;
    const params = new URLSearchParams({
      jql,
      startAt: startAt.toString(),
      maxResults: maxResults.toString(),
      fields: 'summary,status,project,created,updated,resolutiondate,assignee,priority,comment,reporter,description,issuetype,labels,components,fixVersions,timetracking,customfield_10016',
    });

    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: this.getHeaders(language),
    });

    if (!response.ok) {
      throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getAllIssues(jql: string, language?: string): Promise<JiraIssue[]> {
    const allIssues: JiraIssue[] = [];
    let startAt = 0;
    const maxResults = 100; // 한 번에 100개씩 가져오기
    
    while (true) {
      const response = await this.searchIssues(jql, startAt, maxResults, language);
      allIssues.push(...response.issues);
      
      // 더 이상 가져올 이슈가 없으면 중단
      if (response.issues.length < maxResults || startAt + maxResults >= response.total) {
        break;
      }
      
      startAt += maxResults;
    }
    
    return allIssues;
  }

  async getRecentlyCreatedIssues(daysBack = 7, projectKey?: string, language?: string): Promise<JiraIssue[]> {
    let jql: string;
    
    if (daysBack === 1) {
      // "오늘"을 선택한 경우 - 정확히 오늘 날짜만 (한국 시간대 기준)
      const now = new Date();
      const kstOffset = 9 * 60; // UTC+9 (분 단위)
      const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
      const today = kstTime.toISOString().split('T')[0];
      jql = `created >= "${today}" AND created <= "${today} 23:59"`;
      console.log(`"오늘" 선택 - JQL 쿼리: ${jql}`);
    } else {
      // 여러 날짜를 선택한 경우 - 기존 방식 유지
      jql = `created >= -${daysBack}d`;
    }
    
    if (projectKey && projectKey !== 'all') {
      jql = `project = ${projectKey} AND ${jql}`;
    }
    jql += ` ORDER BY created DESC`;
    return await this.getAllIssues(jql, language);
  }

  async getRecentlyCompletedIssues(daysBack = 7, projectKey?: string, language?: string): Promise<JiraIssue[]> {
    let jql: string;
    
    if (daysBack === 1) {
      // "오늘"을 선택한 경우 - 정확히 오늘 날짜만 (한국 시간대 기준)
      const now = new Date();
      const kstOffset = 9 * 60; // UTC+9 (분 단위)
      const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
      const today = kstTime.toISOString().split('T')[0];
      jql = `status in (Done, Resolved, Closed) AND resolutiondate >= "${today}" AND resolutiondate <= "${today} 23:59"`;
      console.log(`"오늘" 완료된 이슈 선택 - JQL 쿼리: ${jql}`);
    } else {
      // 여러 날짜를 선택한 경우 - 기존 방식 유지 (단, resolutiondate 사용)
      jql = `status in (Done, Resolved, Closed) AND resolutiondate >= -${daysBack}d`;
    }
    
    if (projectKey && projectKey !== 'all') {
      jql = `project = ${projectKey} AND ${jql}`;
    }
    jql += ` ORDER BY resolutiondate DESC`;
    return await this.getAllIssues(jql, language);
  }

  async getRecentlyCreatedIssuesByDateRange(startDate: string, endDate: string, projectKey?: string, language?: string): Promise<JiraIssue[]> {
    let jql = `created >= "${startDate}" AND created <= "${endDate} 23:59"`;
    console.log(`새로운 이슈 날짜 범위 JQL: ${jql}`);
    if (projectKey && projectKey !== 'all') {
      jql = `project = ${projectKey} AND ${jql}`;
    }
    jql += ` ORDER BY created DESC`;
    return await this.getAllIssues(jql, language);
  }

  async getRecentlyCompletedIssuesByDateRange(startDate: string, endDate: string, projectKey?: string, language?: string): Promise<JiraIssue[]> {
    let jql = `status in (Done, Resolved, Closed) AND resolutiondate >= "${startDate}" AND resolutiondate <= "${endDate} 23:59"`;
    console.log(`완료된 이슈 날짜 범위 JQL: ${jql}`);
    if (projectKey && projectKey !== 'all') {
      jql = `project = ${projectKey} AND ${jql}`;
    }
    jql += ` ORDER BY resolutiondate DESC`;
    return await this.getAllIssues(jql, language);
  }

  async getAllProjects(language?: string) {
    const url = `${this.config.cloudUrl}/rest/api/3/project`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(language),
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
        ...this.baseHeaders,
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
      headers: this.baseHeaders,
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