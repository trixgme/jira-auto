import { NextResponse } from 'next/server';
import { JiraClient } from '@/lib/jira';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysBack = parseInt(searchParams.get('days') || '7');
    const projectKey = searchParams.get('project') || undefined;
    
    const jiraClient = new JiraClient();
    const issues = await jiraClient.getRecentlyCreatedIssues(daysBack, projectKey);
    
    return NextResponse.json({
      issues,
      count: issues.length,
      daysBack,
    });
  } catch (error) {
    console.error('Error fetching new issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch new issues' },
      { status: 500 }
    );
  }
}