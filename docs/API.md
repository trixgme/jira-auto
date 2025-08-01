# API Documentation

Complete API reference for the Jira Automation Dashboard application.

## Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

## Authentication

The application uses cookie-based authentication. All API endpoints except `/api/auth/login` require a valid authentication cookie.

### Authentication Flow

1. User submits credentials to `/api/auth/login`
2. Server validates credentials and sets `auth` cookie
3. All subsequent requests include the cookie automatically
4. Cookie expires after 24 hours
5. Use `/api/auth/logout` to clear the session

## API Endpoints

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin"
}
```

**Response (Success)**
```json
{
  "success": true,
  "message": "로그인 성공"
}
```

**Response (Error)**
```json
{
  "success": false,
  "message": "아이디 또는 비밀번호가 올바르지 않습니다"
}
```

#### Logout
```http
POST /api/auth/logout
```

**Response**
```json
{
  "success": true,
  "message": "로그아웃 성공"
}
```

### Jira Integration

#### Get All Projects
```http
GET /api/jira/projects
```

**Response**
```json
{
  "projects": [
    {
      "id": "10000",
      "key": "PROJ",
      "name": "Project Name",
      "avatarUrls": {
        "48x48": "https://...",
        "32x32": "https://...",
        "24x24": "https://...",
        "16x16": "https://..."
      },
      "projectTypeKey": "software"
    }
  ],
  "count": 5
}
```

#### Get New Issues
```http
GET /api/jira/new-issues?daysBack=7&projectKey=PROJ
GET /api/jira/new-issues?startDate=2024-01-01&endDate=2024-01-31&projectKey=PROJ
```

**Query Parameters**
- `daysBack` (number): Number of days to look back (1-365)
- `projectKey` (string): Project key to filter by, or "all" for all projects
- `startDate` (string): Start date in YYYY-MM-DD format
- `endDate` (string): End date in YYYY-MM-DD format

**Response**
```json
{
  "issues": [
    {
      "id": "10001",
      "key": "PROJ-123",
      "fields": {
        "summary": "Issue summary",
        "status": {
          "name": "In Progress",
          "statusCategory": {
            "key": "indeterminate",
            "name": "In Progress"
          }
        },
        "project": {
          "key": "PROJ",
          "name": "Project Name"
        },
        "created": "2024-01-15T10:30:00.000+0900",
        "updated": "2024-01-15T14:20:00.000+0900",
        "assignee": {
          "displayName": "John Doe",
          "emailAddress": "john@example.com"
        },
        "priority": {
          "name": "High"
        },
        "comment": {
          "comments": [],
          "total": 0
        },
        "reporter": {
          "displayName": "Jane Smith",
          "emailAddress": "jane@example.com"
        },
        "description": "Issue description...",
        "issuetype": {
          "name": "Bug",
          "iconUrl": "https://..."
        },
        "labels": ["backend", "api"],
        "components": [
          {
            "name": "API"
          }
        ],
        "fixVersions": [
          {
            "name": "1.0.0"
          }
        ],
        "timetracking": {
          "originalEstimate": "2d",
          "remainingEstimate": "1d",
          "timeSpent": "1d"
        },
        "customfield_10016": 5
      }
    }
  ],
  "total": 42
}
```

#### Get Completed Issues
```http
GET /api/jira/completed-issues?daysBack=7&projectKey=PROJ
GET /api/jira/completed-issues?startDate=2024-01-01&endDate=2024-01-31&projectKey=PROJ
```

**Query Parameters**
- Same as `/api/jira/new-issues`

**Response**
- Same structure as `/api/jira/new-issues` but only includes issues with status Done, Resolved, or Closed

#### Get All Issues for Project
```http
GET /api/jira/all-issues?projectKey=PROJ
```

**Query Parameters**
- `projectKey` (string, required): Project key to fetch all issues for

**Response**
- Same structure as `/api/jira/new-issues` but includes all issues regardless of status or date

#### Add Comment to Issue
```http
POST /api/jira/add-comment
Content-Type: application/json

{
  "issueKey": "PROJ-123",
  "comment": "This is a comment text"
}
```

**Response (Success)**
```json
{
  "id": "10500",
  "self": "https://your-domain.atlassian.net/rest/api/3/issue/10001/comment/10500",
  "author": {
    "displayName": "John Doe"
  },
  "body": {
    "type": "doc",
    "version": 1,
    "content": [...]
  },
  "created": "2024-01-15T15:30:00.000+0900"
}
```

#### Get Jira Configuration Status
```http
GET /api/jira/config
```

**Response**
```json
{
  "configured": true,
  "cloudUrl": "https://your-domain.atlassian.net",
  "userEmail": "user@example.com"
}
```

### AI Analysis

#### Analyze Issue Difficulty
```http
POST /api/ai/analyze-difficulty
Content-Type: application/json

{
  "issue": {
    "key": "PROJ-123",
    "fields": {
      "summary": "Implement user authentication",
      "description": "Add JWT-based authentication to the API",
      "issuetype": {
        "name": "Story"
      },
      "priority": {
        "name": "High"
      },
      "labels": ["backend", "security"],
      "components": [
        {
          "name": "API"
        }
      ]
    }
  }
}
```

**Response**
```json
{
  "difficulty": 7,
  "reasoning": "이 이슈는 보안과 관련된 중요한 기능 구현으로, JWT 토큰 관리, 사용자 인증 로직, 보안 고려사항 등이 포함되어 있어 높은 난이도로 평가됩니다.",
  "reasoningKo": "이 이슈는 보안과 관련된 중요한 기능 구현으로...",
  "estimatedHours": 16
}
```

#### Analyze Issue Comments
```http
POST /api/ai/analyze-comments
Content-Type: application/json

{
  "issueKey": "PROJ-123"
}
```

**Response**
```json
{
  "score": 7,
  "analysisKo": "댓글 분석 결과, 전반적으로 건설적인 소통이 이루어지고 있으나...",
  "analysisEn": "Comment analysis shows generally constructive communication...",
  "isHardToDetermine": false,
  "keyIssues": [
    "요구사항 변경에 대한 혼란",
    "일정 관련 우려사항"
  ],
  "recommendations": [
    "요구사항을 명확히 문서화하기",
    "정기적인 진행상황 공유"
  ],
  "scoreDescriptionKo": "양호 - 전반적으로 건설적인 소통",
  "scoreDescriptionEn": "Good - Generally constructive communication"
}
```

#### Generate Completed Issues Report
```http
POST /api/ai/analyze-completed-issues
Content-Type: application/json

{
  "issues": [...], // Array of completed issues
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "daysBack": 30 // Alternative to dateRange
}
```

**Response**
```json
{
  "report": "# 완료 이슈 분석 보고서\n\n## 요약\n- 총 완료 이슈: 25개\n- 평균 완료 시간: 3.5일\n\n## 주요 성과\n1. API 성능 개선 (PROJ-123)\n2. 사용자 인증 구현 (PROJ-124)\n\n## 개선 제안\n- 코드 리뷰 프로세스 강화\n- 테스트 자동화 확대",
  "reportType": "ai",
  "chartData": {
    "dailyCompletions": [
      { "date": "2024-01-01", "count": 3 },
      { "date": "2024-01-02", "count": 5 }
    ],
    "projectDistribution": [
      { "project": "PROJ", "count": 15 },
      { "project": "OTHER", "count": 10 }
    ]
  }
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing or invalid authentication)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

- AI endpoints are rate-limited to prevent excessive API usage
- Jira API calls are subject to Atlassian's rate limits
- Consider implementing caching for frequently accessed data

## Best Practices

1. **Authentication**: Always check authentication status before making API calls
2. **Error Handling**: Implement proper error handling for all API responses
3. **Caching**: Use the built-in difficulty cache to reduce API calls
4. **Pagination**: The Jira client handles pagination automatically for large result sets
5. **Date Formats**: Always use YYYY-MM-DD format for dates
6. **Project Keys**: Use "all" as projectKey to fetch data for all projects

## Examples

### Fetch Issues for Last Week
```javascript
const response = await fetch('/api/jira/new-issues?daysBack=7&projectKey=all');
const data = await response.json();
console.log(`Found ${data.total} new issues`);
```

### Analyze Issue Difficulty
```javascript
const response = await fetch('/api/ai/analyze-difficulty', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ issue: issueData }),
});
const analysis = await response.json();
console.log(`Difficulty: ${analysis.difficulty}/10`);
```

### Add Comment with Analysis
```javascript
// First analyze the issue
const analysisResponse = await fetch('/api/ai/analyze-difficulty', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ issue }),
});
const analysis = await analysisResponse.json();

// Then add comment
const commentResponse = await fetch('/api/jira/add-comment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    issueKey: issue.key,
    comment: `난이도: ${analysis.difficulty}/10\n예상 시간: ${analysis.estimatedHours}시간\n분석: ${analysis.reasoningKo}`,
  }),
});
```