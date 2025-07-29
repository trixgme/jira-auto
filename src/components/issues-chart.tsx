'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { JiraIssue } from '@/lib/types';

interface IssuesChartProps {
  newIssues: JiraIssue[];
  completedIssues: JiraIssue[];
  daysBack: number;
}

export function IssuesChart({ newIssues, completedIssues, daysBack }: IssuesChartProps) {
  const getDateRange = (days: number) => {
    const dates = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date);
    }
    
    return dates;
  };

  const formatDate = (date: Date) => {
    if (daysBack === 1) {
      return date.toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit'
      });
    } else if (daysBack <= 7) {
      return date.toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric' 
      });
    } else {
      return date.toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const countIssuesByDate = (issues: JiraIssue[], dateField: 'created' | 'updated') => {
    const counts: Record<string, number> = {};
    
    issues.forEach(issue => {
      const date = new Date(issue.fields[dateField]);
      const dateKey = date.toDateString();
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    });
    
    return counts;
  };

  const dateRange = getDateRange(daysBack);
  const newIssueCounts = countIssuesByDate(newIssues, 'created');
  const completedIssueCounts = countIssuesByDate(completedIssues, 'updated');

  const chartData = dateRange.map(date => {
    const dateKey = date.toDateString();
    return {
      date: formatDate(date),
      fullDate: date.toLocaleDateString('ko-KR'),
      새로운_이슈: newIssueCounts[dateKey] || 0,
      완료된_이슈: completedIssueCounts[dateKey] || 0,
    };
  });

  const totalNew = newIssues.length;
  const totalCompleted = completedIssues.length;
  const netChange = totalNew - totalCompleted;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          이슈 현황 차트
          <div className="flex gap-4 text-sm">
            <span className="text-blue-600">신규: {totalNew}</span>
            <span className="text-green-600">완료: {totalCompleted}</span>
            <span className={`${netChange > 0 ? 'text-red-600' : netChange < 0 ? 'text-green-600' : 'text-gray-600'}`}>
              순증감: {netChange > 0 ? '+' : ''}{netChange}
            </span>
          </div>
        </CardTitle>
        <CardDescription>
          최근 {daysBack === 1 ? '오늘' : `${daysBack}일간`} 이슈 생성 및 완료 현황
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              fontSize={12}
              angle={daysBack > 7 ? -45 : 0}
              textAnchor={daysBack > 7 ? 'end' : 'middle'}
              height={daysBack > 7 ? 80 : 60}
            />
            <YAxis fontSize={12} />
            <Tooltip 
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  const data = payload[0].payload;
                  return `${data.fullDate}`;
                }
                return label;
              }}
              formatter={(value, name) => [
                value, 
                name === '새로운_이슈' ? '새로운 이슈' : '완료된 이슈'
              ]}
            />
            <Legend 
              formatter={(value) => 
                value === '새로운_이슈' ? '새로운 이슈' : '완료된 이슈'
              }
            />
            <Bar 
              dataKey="새로운_이슈" 
              fill="#3b82f6" 
              name="새로운_이슈"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="완료된_이슈" 
              fill="#10b981" 
              name="완료된_이슈"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}