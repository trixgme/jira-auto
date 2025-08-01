# Jira Automation Dashboard

A modern, feature-rich Next.js dashboard application for managing and analyzing Jira issues with AI-powered insights, difficulty analysis, and comprehensive reporting capabilities.

## 🚀 Features

### Core Functionality
- **Real-time Jira Integration**: Seamlessly connects with Jira Cloud API to fetch and display project issues
- **Dual Issue Views**: Monitor both newly created and recently completed issues in separate sections
- **Advanced Filtering**: Filter by project, date range, or custom time periods
- **Smart Search**: Real-time search across issue summaries with instant results
- **Data Visualization**: Interactive charts showing issue trends over time using Recharts

### AI-Powered Analytics
- **Difficulty Analysis**: AI-powered assessment of issue complexity with estimated hours
- **Comment Analysis**: Intelligent analysis of issue comments to identify problems and provide recommendations
- **Comprehensive Reports**: Generate AI-driven reports for completed issues with insights and patterns
- **Smart Caching**: Local storage of difficulty assessments to reduce API calls and improve performance

### User Experience
- **Dark/Light Theme**: Toggle between themes with system preference support
- **Responsive Design**: Fully responsive interface that works on desktop and mobile devices
- **Korean Language Support**: UI optimized for Korean language with proper localization
- **Loading States**: Progressive loading indicators for better user feedback
- **Authentication**: Secure login system with cookie-based sessions

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router and Turbopack
- **Language**: [TypeScript](https://www.typescriptlang.org/) for type safety
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) primitives
- **Charts**: [Recharts](https://recharts.org/) for data visualization
- **Icons**: [Lucide React](https://lucide.dev/)
- **AI Integration**: OpenAI GPT-4 for intelligent analysis
- **Markdown**: [react-markdown](https://github.com/remarkjs/react-markdown) with GitHub Flavored Markdown

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Jira Cloud account with API access
- OpenAI API key (for AI features)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/jira-auto.git
   cd jira-auto
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
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

4. **Generate Jira API Token**
   - Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
   - Click "Create API token"
   - Copy the token and add it to `.env.local`

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open the application**
   
   Navigate to [http://localhost:3000](http://localhost:3000) and login with:
   - Username: `admin` Password: `admin` (or your configured ADMIN_PASSWORD)
   - Username: `user` Password: `user` (or your configured USER_PASSWORD)

## 📁 Project Structure

```
jira-auto/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API Routes
│   │   │   ├── ai/              # AI analysis endpoints
│   │   │   │   ├── analyze-comments/
│   │   │   │   ├── analyze-completed-issues/
│   │   │   │   └── analyze-difficulty/
│   │   │   ├── auth/            # Authentication endpoints
│   │   │   │   ├── login/
│   │   │   │   └── logout/
│   │   │   └── jira/            # Jira API endpoints
│   │   │       ├── add-comment/
│   │   │       ├── all-issues/
│   │   │       ├── completed-issues/
│   │   │       ├── config/
│   │   │       ├── new-issues/
│   │   │       └── projects/
│   │   ├── kpi/                 # KPI dashboard page
│   │   ├── login/               # Login page
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Main dashboard
│   ├── components/              # React components
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── dashboard.tsx        # Main dashboard component
│   │   ├── issue-card.tsx       # Issue display card
│   │   ├── project-selector.tsx # Project filter
│   │   ├── date-range-picker.tsx # Date selection
│   │   ├── difficulty-dialog.tsx # Difficulty analysis modal
│   │   ├── report-dialog.tsx    # AI report display
│   │   └── ...                  # Other components
│   ├── lib/                     # Utilities and types
│   │   ├── jira.ts             # Jira API client
│   │   ├── types.ts            # TypeScript types
│   │   ├── difficulty-cache.ts  # Local storage cache
│   │   └── utils.ts            # Helper functions
│   └── middleware.ts            # Auth middleware
├── public/                      # Static assets
├── .env.local                   # Environment variables (create this)
├── package.json                 # Dependencies
└── README.md                    # This file
```

## 🔌 API Documentation

### Authentication Endpoints

#### POST `/api/auth/login`
Authenticate user and create session
```json
{
  "username": "admin",
  "password": "admin"
}
```

#### POST `/api/auth/logout`
Clear session and logout user

### Jira Integration Endpoints

#### GET `/api/jira/projects`
Fetch all accessible Jira projects

#### GET `/api/jira/new-issues`
Get recently created issues
- Query params: `daysBack`, `projectKey`, `startDate`, `endDate`

#### GET `/api/jira/completed-issues`
Get recently completed issues
- Query params: `daysBack`, `projectKey`, `startDate`, `endDate`

#### POST `/api/jira/add-comment`
Add a comment to an issue
```json
{
  "issueKey": "PROJ-123",
  "comment": "Comment text"
}
```

### AI Analysis Endpoints

#### POST `/api/ai/analyze-difficulty`
Analyze issue difficulty and estimate hours
```json
{
  "issue": {
    "key": "PROJ-123",
    "fields": { ... }
  }
}
```

#### POST `/api/ai/analyze-comments`
Analyze issue comments for insights
```json
{
  "issueKey": "PROJ-123"
}
```

#### POST `/api/ai/analyze-completed-issues`
Generate comprehensive report for completed issues
```json
{
  "issues": [ ... ],
  "dateRange": { "startDate": "2024-01-01", "endDate": "2024-01-31" }
}
```

## 🎯 Key Features Explained

### Difficulty Analysis
The AI analyzes each issue based on:
- Summary and description complexity
- Technical requirements
- Dependencies and blockers
- Historical patterns

Output includes:
- Difficulty score (1-10)
- Reasoning in Korean and English
- Estimated hours
- Automatic comment posting option

### Comment Analysis
Intelligent analysis of issue comments to:
- Identify communication problems
- Detect blockers and risks
- Provide actionable recommendations
- Score comment quality (1-10)

### Report Generation
Comprehensive AI-powered reports that include:
- Issue completion statistics
- Pattern identification
- Team performance insights
- Recommendations for improvement
- Visual charts and metrics

## 🔒 Security Considerations

- **API Keys**: Never commit API keys to version control
- **Authentication**: Uses httpOnly cookies for session management
- **CORS**: API routes handle Jira API calls server-side to avoid CORS issues
- **Input Validation**: All user inputs are validated before processing
- **Environment Variables**: Sensitive data stored in environment variables

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms
The app can be deployed to any platform supporting Next.js:
- AWS Amplify
- Netlify
- Railway
- Self-hosted with Node.js

## 🔧 Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing framework
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Atlassian](https://www.atlassian.com/) for Jira API
- [OpenAI](https://openai.com/) for AI capabilities
