import { NextResponse } from 'next/server';
import { JiraClient } from '@/lib/jira';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const jiraClient = new JiraClient();
    
    let jql: string;
    
    if (startDate && endDate) {
      // 날짜 범위로 조회
      jql = `created >= "${startDate}" AND created <= "${endDate} 23:59" ORDER BY created DESC`;
      console.log(`날짜 범위 이슈를 가져오는 중... (${startDate} ~ ${endDate})`);
    } else if (month) {
      // 특정 월의 이슈를 가져오는 JQL
      const currentYear = new Date().getFullYear();
      const monthNum = parseInt(month);
      const monthStartDate = `${currentYear}-${monthNum.toString().padStart(2, '0')}-01`;
      
      // 다음 달의 첫날 계산
      const nextMonth = monthNum === 12 ? 1 : monthNum + 1;
      const nextYear = monthNum === 12 ? currentYear + 1 : currentYear;
      const monthEndDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
      
      jql = `created >= "${monthStartDate}" AND created < "${monthEndDate}" ORDER BY created DESC`;
      console.log(`${monthNum}월 이슈를 가져오는 중... (${monthStartDate} ~ ${monthEndDate})`);
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
      month: month ? parseInt(month) : null,
      dateRange: startDate && endDate ? { startDate, endDate } : null
    });
  } catch (error) {
    console.error('Error fetching all issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues from Jira' },
      { status: 500 }
    );
  }
}