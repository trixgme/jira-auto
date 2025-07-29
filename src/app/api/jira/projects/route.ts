import { NextResponse } from 'next/server';
import { JiraClient } from '@/lib/jira';

export async function GET() {
  try {
    const jiraClient = new JiraClient();
    const projects = await jiraClient.getAllProjects();
    
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