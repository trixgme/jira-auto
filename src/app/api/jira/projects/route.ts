import { NextResponse } from 'next/server';
import { JiraClient } from '@/lib/jira';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || undefined;
    
    const jiraClient = new JiraClient();
    const projects = await jiraClient.getAllProjects(language);
    
    return NextResponse.json({
      projects,
      count: projects.length,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}