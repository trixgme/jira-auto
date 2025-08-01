# Component Documentation

Detailed documentation for all React components in the Jira Automation Dashboard.

## Core Components

### Dashboard (`src/components/dashboard.tsx`)

The main dashboard component that orchestrates the entire application.

**Features:**
- Fetches and displays Jira issues (new and completed)
- Manages application state and data flow
- Handles filtering by project and date range
- Implements real-time search functionality
- Coordinates AI analysis features

**Props:** None (root component)

**State Management:**
```typescript
interface DashboardData {
  newIssues: JiraIssue[];
  completedIssues: JiraIssue[];
  projects: JiraProject[];
  loading: boolean;
  error: string | null;
}
```

**Key Functions:**
- `fetchProjects()` - Loads all Jira projects
- `fetchDashboardData()` - Fetches issues based on current filters
- `handleSearch()` - Filters issues based on search query
- `generateReport()` - Creates AI-powered completion reports

### IssueCard (`src/components/issue-card.tsx`)

Displays individual Jira issue information in a card format.

**Props:**
```typescript
interface IssueCardProps {
  issue: JiraIssue;
  onDifficultyAnalyze?: (issue: JiraIssue) => void;
  onCommentAnalyze?: (issue: JiraIssue) => void;
  difficulty?: IssueDifficulty;
}
```

**Features:**
- Shows issue summary, status, assignee, and metadata
- Displays difficulty badge if analyzed
- Provides actions for AI analysis
- Responsive design with hover effects
- Links to Jira issue

### DifficultyDialog (`src/components/difficulty-dialog.tsx`)

Modal dialog for AI-powered issue difficulty analysis.

**Props:**
```typescript
interface DifficultyDialogProps {
  issue: JiraIssue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAnalysisComplete?: (difficulty: IssueDifficulty) => void;
}
```

**Features:**
- Analyzes issue complexity using AI
- Shows difficulty score (1-10) with visual indicator
- Provides reasoning in Korean and English
- Estimates required hours
- Option to post analysis as Jira comment
- Caches results locally

### CommentAnalysisDialog (`src/components/comment-analysis-dialog.tsx`)

Analyzes issue comments to identify problems and provide recommendations.

**Props:**
```typescript
interface CommentAnalysisDialogProps {
  issueKey: string;
  isOpen: boolean;
  onClose: () => void;
}
```

**Features:**
- Fetches and analyzes all issue comments
- Provides communication quality score
- Identifies key issues in discussions
- Offers actionable recommendations
- Bilingual analysis (Korean/English)

### ReportDialog (`src/components/report-dialog.tsx`)

Displays AI-generated reports for completed issues.

**Props:**
```typescript
interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: {
    report: string;
    reportType: 'ai' | 'basic';
    chartData: any;
    dateRange?: { startDate: string; endDate: string } | null;
    period?: number;
  } | null;
  isGenerating: boolean;
  generationStep: number;
}
```

**Features:**
- Renders markdown reports using react-markdown
- Shows generation progress
- Displays charts and visualizations
- Supports copying report content
- Responsive modal design

## UI Components

### ProjectSelector (`src/components/project-selector.tsx`)

Multi-select dropdown for filtering by Jira projects.

**Props:**
```typescript
interface ProjectSelectorProps {
  projects: JiraProject[];
  selectedProject: string;
  onProjectChange: (project: string) => void;
}
```

**Features:**
- Shows project avatars and names
- "All Projects" option
- Keyboard navigation support
- Search within dropdown

### DateRangePicker (`src/components/date-range-picker.tsx`)

Custom date range selection component.

**Props:**
```typescript
interface DateRangePickerProps {
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
  onReset: () => void;
}
```

**Features:**
- Native date inputs
- Start and end date validation
- Reset to default functionality
- Korean date format support

### IssuesChart (`src/components/issues-chart.tsx`)

Data visualization component using Recharts.

**Props:**
```typescript
interface IssuesChartProps {
  newIssues: JiraIssue[];
  completedIssues: JiraIssue[];
  daysBack: number;
  dateRange?: { startDate: Date | null; endDate: Date | null };
}
```

**Features:**
- Line chart showing issue trends
- Responsive design
- Custom tooltips
- Dark mode support
- Date-based grouping

### LoadingProgress (`src/components/loading-progress.tsx`)

Progressive loading indicator for better UX.

**Props:**
```typescript
interface LoadingProgressProps {
  step: number;
  message?: string;
}
```

**Features:**
- Multi-step progress indication
- Custom loading messages
- Smooth animations
- Skeleton UI integration

### DifficultyBadge (`src/components/difficulty-badge.tsx`)

Visual indicator for issue difficulty levels.

**Props:**
```typescript
interface DifficultyBadgeProps {
  difficulty: number;
  showHours?: boolean;
  estimatedHours?: number;
}
```

**Features:**
- Color-coded difficulty levels
- Optional hour display
- Accessible design
- Consistent styling

## Layout Components

### Navigation (`src/components/navigation.tsx`)

Top navigation bar with page links.

**Props:** None

**Features:**
- Dashboard and KPI page links
- Active page highlighting
- Responsive mobile menu
- Smooth transitions

### ThemeProvider (`src/components/theme-provider.tsx`)

Provides dark/light theme support throughout the app.

**Props:**
```typescript
interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
}
```

**Features:**
- System theme detection
- Theme persistence
- Smooth theme transitions
- CSS variable management

### ThemeToggle (`src/components/theme-toggle.tsx`)

Toggle button for switching between themes.

**Props:** None

**Features:**
- Sun/moon icons
- Smooth icon transitions
- Accessible button
- Tooltip support

### LogoutButton (`src/components/logout-button.tsx`)

Handles user logout functionality.

**Props:** None

**Features:**
- Logout API call
- Session cleanup
- Redirect to login
- Loading state

## Utility Components

### KPIDashboard (`src/components/kpi-dashboard.tsx`)

Displays key performance indicators and metrics.

**Features:**
- Issue statistics
- Team performance metrics
- Trend analysis
- Export functionality

## Component Best Practices

1. **Type Safety**: All components use TypeScript interfaces for props
2. **Error Handling**: Components handle loading and error states gracefully
3. **Accessibility**: ARIA labels and keyboard navigation support
4. **Performance**: Memoization and lazy loading where appropriate
5. **Styling**: Consistent use of Tailwind CSS classes
6. **State Management**: Local state with lifting when necessary
7. **API Integration**: Clean separation of data fetching logic

## Styling Guidelines

- Use Tailwind CSS utility classes
- Follow shadcn/ui component patterns
- Maintain consistent spacing (4px grid)
- Support dark mode in all components
- Use semantic color variables
- Implement responsive breakpoints

## Testing Considerations

When testing components:
1. Test user interactions (clicks, form submissions)
2. Verify error states are handled
3. Check accessibility attributes
4. Test responsive behavior
5. Validate prop types
6. Mock API calls appropriately