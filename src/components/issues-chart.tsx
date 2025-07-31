'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { JiraIssue } from '@/lib/types';

interface IssuesChartProps {
  newIssues: JiraIssue[];
  completedIssues: JiraIssue[];
  daysBack: number;
  dateRange?: {
    startDate: Date | null;
    endDate: Date | null;
  };
}

export function IssuesChart({ newIssues, completedIssues, daysBack, dateRange }: IssuesChartProps) {
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

  const getDateRangeFromSelection = (startDate: Date, endDate: Date) => {
    const dates = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  const formatDate = (date: Date, totalDays: number) => {
    if (totalDays === 1) {
      return date.toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit'
      });
    } else if (totalDays <= 7) {
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

  const countIssuesByDate = (issues: JiraIssue[], dateField: 'created' | 'updated' | 'resolutiondate') => {
    const counts: Record<string, number> = {};
    
    issues.forEach(issue => {
      let dateValue;
      if (dateField === 'resolutiondate') {
        dateValue = issue.fields.resolutiondate;
      } else {
        dateValue = issue.fields[dateField];
      }
      
      if (dateValue) {
        const date = new Date(dateValue);
        const dateKey = date.toDateString();
        counts[dateKey] = (counts[dateKey] || 0) + 1;
      }
    });
    
    return counts;
  };

  // 날짜 범위 결정
  const dateList = dateRange && dateRange.startDate && dateRange.endDate
    ? getDateRangeFromSelection(dateRange.startDate, dateRange.endDate)
    : getDateRange(daysBack);
  
  const totalDays = dateList.length;
  const newIssueCounts = countIssuesByDate(newIssues, 'created');
  const completedIssueCounts = countIssuesByDate(completedIssues, 'resolutiondate');

  const chartData = dateList.map(date => {
    const dateKey = date.toDateString();
    return {
      date: formatDate(date, totalDays),
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
          {dateRange && dateRange.startDate && dateRange.endDate
            ? `${dateRange.startDate.toLocaleDateString('ko-KR')} ~ ${dateRange.endDate.toLocaleDateString('ko-KR')} 이슈 생성 및 완료 현황`
            : `최근 ${daysBack === 1 ? '오늘' : `${daysBack}일간`} 이슈 생성 및 완료 현황`
          }
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