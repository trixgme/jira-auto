# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 dashboard application that integrates with Jira Cloud API to display project issues. The app shows recently created and completed issues with filtering, search, and visualization capabilities.

## Development Commands

- `npm run dev` - Start development server (uses --turbopack for faster builds)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Configuration

The application requires Jira Cloud API credentials in `.env.local`:
```env
JIRA_CLOUD_URL=https://your-domain.atlassian.net
JIRA_USER_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token

# Authentication (optional - defaults to admin/admin, user/user)
ADMIN_PASSWORD=your-admin-password
USER_PASSWORD=your-user-password
```

## Architecture

### Core Structure
- **Next.js App Router** - Uses the new app directory structure (`src/app/`)
- **API Routes** - Server-side Jira API integration in `src/app/api/jira/`
- **Client Components** - React components with state management in `src/components/`
- **Type Definitions** - Shared TypeScript interfaces in `src/lib/types.ts`
- **Jira Client** - Core API client class in `src/lib/jira.ts`

### Key Components
- `Dashboard` (`src/components/dashboard.tsx`) - Main dashboard with issue display, search, and filtering
- `IssueCard` - Individual issue display component
- `ProjectSelector` - Multi-project filtering dropdown
- `IssuesChart` - Data visualization using Recharts
- `ThemeProvider` - Dark/light mode support

### API Endpoints
- `/api/jira/projects` - Fetch all Jira projects
- `/api/jira/new-issues` - Get recently created issues with date/project filtering
- `/api/jira/completed-issues` - Get recently completed issues with date/project filtering
- `/api/jira/all-issues` - Get all issues for a project

### Jira Integration
The `JiraClient` class (`src/lib/jira.ts`) handles:
- Basic authentication using email + API token
- JQL query construction and execution
- Pagination for large result sets
- Issue filtering by date ranges and project keys

## Tech Stack

- **Next.js 15** with App Router and Turbopack
- **TypeScript** for type safety
- **Tailwind CSS** + **shadcn/ui** for styling and components
- **Recharts** for data visualization
- **Radix UI** primitives for accessible components
- **Lucide React** for icons

## Development Patterns

### State Management
- Uses React hooks (useState, useEffect) for local component state
- No external state management library - data flows through props and API calls

### Data Fetching
- API routes handle server-side Jira API calls to avoid CORS issues
- Client-side fetching using native fetch API
- Pagination handled by `getAllIssues()` method in JiraClient

### Styling
- Tailwind CSS with design system via shadcn/ui
- CSS-in-JS not used - pure Tailwind classes
- Dark/light theme support via next-themes

### Error Handling
- API errors display user-friendly messages
- Environment variable validation in JiraClient constructor
- Graceful fallbacks for missing data

## Authentication System

The application uses cookie-based authentication to protect all routes:

### Login System
- **Login Page**: `/login` - ID/password authentication form
- **Protected Routes**: All pages except `/login` require authentication
- **Middleware**: `src/middleware.ts` - Intercepts requests and checks auth cookie
- **Session**: 24-hour cookie-based sessions

### API Routes
- `POST /api/auth/login` - Authenticate user and set auth cookie
- `POST /api/auth/logout` - Clear auth cookie and logout

### Default Credentials
- `admin` / `admin` (or env: ADMIN_PASSWORD)
- `user` / `user` (or env: USER_PASSWORD)

### Components
- `LogoutButton` - Logout functionality in dashboard headers
- Login page with theme toggle and error handling

## Important Notes

- Jira API tokens should never be committed to the repository
- The app fetches all issues using pagination to handle large datasets
- JQL queries are constructed dynamically based on filters
- Korean language is used in the UI (configurable in layout.tsx)
- Authentication is required for all pages except login