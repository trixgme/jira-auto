import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const jiraCloudUrl = process.env.JIRA_CLOUD_URL;
    
    if (!jiraCloudUrl) {
      return NextResponse.json(
        { error: 'Jira configuration not found' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      jiraCloudUrl: jiraCloudUrl,
    });
  } catch (error) {
    console.error('Error fetching Jira config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Jira configuration' },
      { status: 500 }
    );
  }
}