import { NextResponse } from 'next/server';
import { JiraClient } from '@/lib/jira';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    
    const jiraClient = new JiraClient();
    
    let jql: string;
    
    if (month) {
      // 특정 월의 이슈를 가져오는 JQL
      const currentYear = new Date().getFullYear();
      const monthNum = parseInt(month);
      const startDate = `${currentYear}-${monthNum.toString().padStart(2, '0')}-01`;
      
      // 다음 달의 첫날 계산
      const nextMonth = monthNum === 12 ? 1 : monthNum + 1;
      const nextYear = monthNum === 12 ? currentYear + 1 : currentYear;
      const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
      
      jql = `created >= "${startDate}" AND created < "${endDate}" ORDER BY created DESC`;
      console.log(`${monthNum}월 이슈를 가져오는 중... (${startDate} ~ ${endDate})`);
    } else {
      // 모든 이슈를 가져오는 JQL (최근 1년간)
      jql = `created >= -365d ORDER BY created DESC`;
      console.log('모든 이슈를 가져오는 중...');
    }
    
    const issues = await jiraClient.getAllIssues(jql);
    
    console.log(`총 ${issues.length}개의 이슈를 가져왔습니다.`);
    
    return NextResponse.json({ 
      issues,
      total: issues.length,
      month: month ? parseInt(month) : null
    });
  } catch (error) {
    console.error('Error fetching all issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues from Jira' },
      { status: 500 }
    );
  }
}