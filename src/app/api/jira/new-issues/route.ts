import { NextResponse } from 'next/server';
import { JiraClient } from '@/lib/jira';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysBack = parseInt(searchParams.get('days') || '7');
    const projectKey = searchParams.get('project') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    
    const jiraClient = new JiraClient();
    
    let issues;
    if (startDate && endDate) {
      // 날짜 범위로 조회
      issues = await jiraClient.getRecentlyCreatedIssuesByDateRange(startDate, endDate, projectKey);
    } else {
      // 기존 방식 (days 기준)
      issues = await jiraClient.getRecentlyCreatedIssues(daysBack, projectKey);
    }
    
    return NextResponse.json({
      issues,
      count: issues.length,
      daysBack: startDate && endDate ? undefined : daysBack,
      dateRange: startDate && endDate ? { startDate, endDate } : undefined,
    });
  } catch (error) {
    console.error('Error fetching new issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch new issues' },
      { status: 500 }
    );
  }
}