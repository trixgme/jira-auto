# Jira Dashboard

Jira Cloud API를 사용하여 전체 프로젝트의 새로 추가된 이슈와 완료된 이슈를 보여주는 대시보드입니다.

## 기능

- 전체 프로젝트의 새로 추가된 이슈 조회
- 전체 프로젝트의 완료된 이슈 조회
- 기간 선택 기능 (7일, 14일, 30일)
- 이슈 상태, 우선순위 시각화
- 실시간 데이터 업데이트

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. Jira API 설정

`.env.local` 파일을 편집하여 Jira Cloud 정보를 입력하세요:

```env
JIRA_CLOUD_URL=https://your-domain.atlassian.net
JIRA_USER_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token
```

#### Jira API 토큰 생성 방법:
1. [Atlassian API Token 페이지](https://id.atlassian.com/manage-profile/security/api-tokens)로 이동
2. "Create API token" 클릭
3. 토큰에 이름 지정 (예: "Jira Dashboard")
4. 생성된 토큰을 복사하여 `.env.local` 파일에 붙여넣기

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 대시보드를 확인하세요.

## 기술 스택

- **Next.js 15** - React 프레임워크
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 스타일링
- **shadcn/ui** - UI 컴포넌트
- **Jira Cloud API** - 이슈 데이터 조회

## 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   └── jira/
│   │       ├── new-issues/
│   │       ├── completed-issues/
│   │       └── projects/
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── dashboard.tsx
│   ├── issue-card.tsx
│   └── ui/
└── lib/
    ├── jira.ts
    └── utils.ts
```

## 주의사항

- Jira API 토큰은 절대 공개 저장소에 커밋하지 마세요
- `.env.local` 파일은 `.gitignore`에 포함되어 있어야 합니다
- API 요청 한도에 주의하세요

## 문제 해결

### API 연결 오류
- Jira Cloud URL이 올바른지 확인
- API 토큰이 유효한지 확인
- 이메일 주소가 Jira 계정과 일치하는지 확인

### 이슈가 표시되지 않음
- Jira 프로젝트에 대한 접근 권한 확인
- 선택한 기간 내에 이슈가 있는지 확인