# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern Next.js 15 dashboard application that integrates with Jira Cloud API to display and analyze project issues. The app features AI-powered analysis, comprehensive reporting, and multi-language support across 27 languages. It includes dual dashboards (main and KPI), intelligent caching systems, and advanced filtering capabilities.

## Development Commands

- `npm run dev` - Start development server (uses --turbopack for faster builds)
- `npm run build` - Build for production (includes translation validation)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run check-translations` - Validate all translation files for consistency

## Environment Configuration

The application requires multiple API credentials in `.env.local`:
```env
# Jira Configuration (Required)
JIRA_CLOUD_URL=https://your-domain.atlassian.net
JIRA_USER_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token

# OpenAI Configuration (Required for AI features)
OPENAI_API_KEY=your-openai-api-key

# Authentication (Optional - defaults shown)
ADMIN_PASSWORD=admin
USER_PASSWORD=user
```

## Architecture Overview

### Multi-Language Architecture
The application supports 27 languages with a sophisticated translation system:
- **Translation Files**: Located in `src/lib/translations/` with one file per language
- **Type Safety**: All translations typed via `TranslationKeys` interface
- **Usage Pattern**: Use `t('key_name')` for all user-facing text
- **Validation**: Automated checks ensure all languages have consistent keys
- **Caching**: Language-aware caching with locale-specific cache keys

### Intelligent Caching System
Both dashboards implement sophisticated caching with localStorage persistence:
- **Dashboard Cache**: 5-minute TTL with language/project/date scope isolation
- **KPI Cache**: Similar caching with month/date-range specific keys
- **Difficulty Cache**: 7-day TTL for AI analysis results (`DifficultyCache` class)
- **Capacity Management**: Automatic cleanup with 5-item limits and quota handling
- **Cache Invalidation**: Manual refresh buttons bypass cache with user feedback

### Jira API Integration with Localization
The `JiraClient` class handles multi-language API responses:
- **Language Headers**: Sends `Accept-Language` and `X-Force-Accept-Language`
- **Default Language**: Forces English responses for consistent status names
- **Translation Layer**: Client-side translation of Jira statuses/priorities
- **Authentication**: Basic auth with email + API token
- **Pagination**: Intelligent batching for large datasets
- **JQL Construction**: Dynamic query building with date/project filters

### AI-Powered Analysis System
Multiple AI endpoints provide intelligent insights:
- `/api/ai/analyze-difficulty` - Issue complexity assessment with hour estimation
- `/api/ai/analyze-comments` - Comment quality analysis and recommendations
- `/api/ai/analyze-completed-issues` - Comprehensive project reports
- **Caching**: AI results cached locally to reduce API costs
- **Multilingual**: AI responses adapt to user's selected language

## Core Components Architecture

### Dashboard Components
- `Dashboard` - Main dashboard with intelligent caching and refresh capabilities
- `KpiDashboard` - KPI-focused view with advanced metrics and user filtering
- `IssueCard` - Individual issue display with AI analysis integration
- `IssuesChart` - Data visualization using Recharts with trend analysis

### Multi-Language Components
- `LanguageSelector` - 27-language dropdown with flag icons
- All components use `useLanguage()` hook and `t()` function for translations
- Status/priority badges automatically translate Jira values

### Caching & Performance Components
- `LoadingProgress` - Multi-step loading indicators with detailed progress
- Cache management built into dashboard components with localStorage persistence
- Refresh buttons with loading states and cache invalidation

## API Architecture

### Jira Integration Endpoints
All endpoints support `language` query parameter for localized responses:
- `/api/jira/projects` - Project list with language-specific names
- `/api/jira/new-issues` - Recently created issues with date/project filtering
- `/api/jira/completed-issues` - Recently completed issues with resolution dates
- `/api/jira/all-issues` - Full issue queries for KPI dashboard

### Authentication System
- Cookie-based authentication with 24-hour sessions
- Middleware protection on all routes except `/login`
- Default credentials: admin/admin, user/user (configurable via env)

### AI Analysis Integration
- OpenAI GPT-4 integration for intelligent analysis
- Structured prompts for consistent, actionable insights
- Cost optimization through intelligent caching

## Development Patterns

### Translation Management
**Critical Rule**: All user-facing text must use the translation system
```tsx
// ✅ Correct
<Button>{t('save')}</Button>
<span title={t('refresh_data')}></span>

// ❌ Wrong - will break multi-language support
<Button>Save</Button>
<span title="새로고침"></span>
```

**Adding New Translations**:
1. Add key to `src/lib/translations/ko.ts` (reference language)
2. Update `src/lib/translations/types.ts` interface
3. Add translations to all 27 language files
4. Run `npm run check-translations` to verify

### Caching Patterns
The application uses a sophisticated caching strategy:
- **Cache Keys**: Include language, project, date range for proper isolation
- **TTL Management**: 5-minute cache for dashboard data, 7-day for AI analysis
- **Storage Limits**: Automatic cleanup with LRU-style management
- **Error Handling**: Graceful degradation when localStorage quota exceeded

### State Management
- React hooks for component state with intelligent caching
- No external state management - leverages server state through API routes
- Context providers for language selection and theme management

## Important Development Notes

### Translation System Requirements
- The build process (`prebuild`) automatically validates translations
- All 27 languages must have identical keys (enforced by automated checks)
- Use `TRANSLATION_GUIDELINES.md` for detailed translation procedures

### Jira API Considerations
- API responses are language-aware but default to English for consistency
- Client-side translation layer handles status/priority localization
- Pagination automatically handles large issue datasets
- JQL queries constructed dynamically based on filters

### Performance Optimizations
- Intelligent caching reduces API calls by ~70%
- localStorage persistence maintains cache across browser sessions
- Parallel API calls where possible (projects + issues)
- Turbopack for fast development builds

### Security Considerations
- All sensitive data in environment variables
- Server-side API proxy prevents CORS issues and token exposure
- Cookie-based authentication with httpOnly flags
- Input validation on all user inputs