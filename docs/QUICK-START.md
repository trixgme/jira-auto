# Quick Start Guide

Get your Jira Automation Dashboard up and running in 5 minutes!

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Jira Cloud account with admin access
- [ ] OpenAI API key (for AI features)
- [ ] Git installed (for cloning repository)

## Step 1: Clone and Install (1 minute)

```bash
# Clone the repository
git clone https://github.com/yourusername/jira-auto.git
cd jira-auto

# Install dependencies
npm install
```

## Step 2: Get Your API Keys (2 minutes)

### Jira API Token
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click **Create API token**
3. Name it "Jira Dashboard" and click **Create**
4. Copy the token (you won't see it again!)

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Click **Create new secret key**
3. Copy the key

## Step 3: Configure Environment (1 minute)

Create `.env.local` in the project root:

```bash
# Create the file
touch .env.local
```

Add your credentials:

```env
# Jira Configuration
JIRA_CLOUD_URL=https://your-domain.atlassian.net
JIRA_USER_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token-from-step-2

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-from-step-2

# Optional: Custom passwords (defaults to admin/admin, user/user)
ADMIN_PASSWORD=admin
USER_PASSWORD=user
```

## Step 4: Start the Application (1 minute)

```bash
# Start development server
npm run dev
```

## Step 5: Login and Explore

1. Open http://localhost:3000 in your browser
2. Login with:
   - Username: `admin`
   - Password: `admin`
3. You should see your Jira projects and issues!

## What's Next?

### Try These Features

1. **Filter Issues**
   - Use the project dropdown to filter by project
   - Change the date range to see different time periods

2. **Analyze Issue Difficulty**
   - Click the "분석" (Analyze) button on any issue
   - AI will assess complexity and estimate hours

3. **Search Issues**
   - Use the search box to find specific issues
   - Search works in real-time as you type

4. **Generate Reports**
   - Click "AI 보고서 생성" to create comprehensive reports
   - Reports include insights and recommendations

5. **Toggle Theme**
   - Click the sun/moon icon for dark/light mode

### Common First Steps

1. **View All Your Issues**
   ```
   - Select "모든 프로젝트" (All Projects)
   - Set date range to "30일" (30 days)
   ```

2. **Analyze Your Most Complex Issues**
   ```
   - Find issues without difficulty badges
   - Click "분석" to analyze them
   - Results are cached for 7 days
   ```

3. **Generate Your First Report**
   ```
   - Go to completed issues tab
   - Click "AI 보고서 생성"
   - Wait for AI analysis (takes ~30 seconds)
   ```

## Troubleshooting

### Can't See Any Issues?
- Check your Jira API token has proper permissions
- Verify JIRA_CLOUD_URL matches your Atlassian domain exactly
- Try selecting "모든 프로젝트" and "30일"

### "Failed to fetch projects" Error?
```bash
# Check your environment variables
cat .env.local

# Verify Jira URL format (should be https://xxx.atlassian.net)
# Make sure there's no trailing slash
```

### AI Analysis Not Working?
- Verify your OpenAI API key is valid
- Check you have credits in your OpenAI account
- Look for error messages in the browser console

### Login Issues?
- Default credentials are admin/admin
- Clear cookies if you're having issues
- Check ADMIN_PASSWORD in .env.local if you changed it

## Production Deployment

### Quick Deploy to Vercel

1. Push to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Add environment variables:
   ```
   JIRA_CLOUD_URL
   JIRA_USER_EMAIL
   JIRA_API_TOKEN
   OPENAI_API_KEY
   ADMIN_PASSWORD
   USER_PASSWORD
   ```
5. Click Deploy!

## Need Help?

- Check the [full documentation](./README.md)
- Review [API documentation](./API.md)
- See [component documentation](./COMPONENTS.md)

## Security Reminders

1. **Never commit `.env.local` to git**
2. **Use strong passwords in production**
3. **Keep your API keys secret**
4. **Enable HTTPS in production**

---

🎉 **Congratulations!** You now have a working Jira Automation Dashboard with AI-powered insights!