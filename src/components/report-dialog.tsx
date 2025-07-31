'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Copy, BarChart3, PieChartIcon, TrendingUp, FileText } from 'lucide-react';
import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

interface ChartData {
  projectDistribution: Array<{ name: string; value: number }>;
  assigneeDistribution: Array<{ name: string; value: number }>;
  issueTypeDistribution: Array<{ name: string; value: number }>;
  priorityDistribution: Array<{ name: string; value: number }>;
  completionTrend: Array<{ date: string; count: number }>;
  totalStats: {
    totalIssues: number;
    avgCompletionTime: number;
    mostActiveProject: string;
    mostActiveAssignee: string;
  };
}

interface ReportData {
  report: string;
  reportType: 'ai' | 'basic';
  chartData: ChartData;
  dateRange?: {
    startDate: string;
    endDate: string;
  } | null;
  period?: number;
}

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportData: ReportData | null;
  title?: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

export function ReportDialog({ open, onOpenChange, reportData, title = "완료된 이슈 AI 분석 보고서" }: ReportDialogProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const handleCopy = async () => {
    if (!reportData?.report) return;
    
    try {
      await navigator.clipboard.writeText(reportData.report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
    }
  };

  const handleDownload = () => {
    if (!reportData?.report) return;
    
    const blob = new Blob([reportData.report], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jira-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatMarkdown = (text: string) => {
    return text
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2 text-foreground">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-6 mb-3 text-foreground">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-4 text-foreground">$1</h1>')
      .replace(/^\*\*(.*?)\*\*/gm, '<strong class="font-semibold text-foreground">$1</strong>')
      .replace(/^\*(.*?)\*/gm, '<em class="italic">$1</em>')
      .replace(/^- (.*$)/gm, '<li class="ml-4 mb-1 text-muted-foreground">• $1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 mb-1 text-muted-foreground">$1</li>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  if (!reportData) return null;

  const { chartData } = reportData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[95vh] p-0 w-full">
        <DialogHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 pr-12 sm:pr-16 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <DialogTitle className="text-lg sm:text-xl font-bold line-clamp-2 sm:line-clamp-1">{title}</DialogTitle>
              <Badge variant={reportData.reportType === 'ai' ? 'default' : 'secondary'} className="self-start sm:self-auto">
                {reportData.reportType === 'ai' ? 'AI 분석' : '기본 분석'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleCopy}
                size="sm"
                variant="outline"
                className="text-xs px-2 sm:px-3"
              >
                <Copy className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">{copied ? '복사됨!' : '복사'}</span>
              </Button>
              <Button
                onClick={handleDownload}
                size="sm"
                variant="outline"
                className="text-xs px-2 sm:px-3"
              >
                <Download className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">다운로드</span>
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="px-3 sm:px-6 py-3 sm:py-4 overflow-y-auto max-h-[calc(95vh-80px)] sm:max-h-[calc(90vh-120px)]">
          <div className="w-full">
            <div className="flex flex-wrap gap-1 sm:gap-2 border-b mb-3 sm:mb-4 pb-2 overflow-x-auto">
              <Button
                variant={activeTab === 'overview' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('overview')}
                className="text-xs whitespace-nowrap flex-shrink-0"
              >
                <BarChart3 className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">전체 요약</span>
                <span className="sm:hidden">요약</span>
              </Button>
              <Button
                variant={activeTab === 'charts' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('charts')}
                className="text-xs whitespace-nowrap flex-shrink-0"
              >
                <PieChartIcon className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">차트 분석</span>
                <span className="sm:hidden">차트</span>
              </Button>
              <Button
                variant={activeTab === 'trends' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('trends')}
                className="text-xs whitespace-nowrap flex-shrink-0"
              >
                <TrendingUp className="h-3 w-3 sm:mr-1" />
                <span className="sm:hidden">트렌드</span>
                <span className="hidden sm:inline">트렌드</span>
              </Button>
              <Button
                variant={activeTab === 'report' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('report')}
                className="text-xs whitespace-nowrap flex-shrink-0"
              >
                <FileText className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">상세 보고서</span>
                <span className="sm:hidden">보고서</span>
              </Button>
            </div>

            {activeTab === 'overview' && (
              <div className="mt-4 space-y-4">
                {/* 분석 기간 표시 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">📅 분석 기간</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {reportData.dateRange 
                        ? `${new Date(reportData.dateRange.startDate).toLocaleDateString('ko-KR')} ~ ${new Date(reportData.dateRange.endDate).toLocaleDateString('ko-KR')} (${Math.floor((new Date(reportData.dateRange.endDate).getTime() - new Date(reportData.dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}일간)`
                        : `최근 ${reportData.period}일간`
                      }
                    </p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">총 완료 이슈</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl sm:text-2xl font-bold">{chartData.totalStats.totalIssues}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">평균 완료 시간</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl sm:text-2xl font-bold">{chartData.totalStats.avgCompletionTime}일</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">최다 완료 프로젝트</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium truncate">{chartData.totalStats.mostActiveProject}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">최다 완료 담당자</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium truncate">{chartData.totalStats.mostActiveAssignee}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">프로젝트별 완료 현황</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={180} className="sm:h-[200px]">
                        <BarChart data={chartData.projectDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} fontSize={9} className="sm:text-[10px]" />
                          <YAxis fontSize={9} className="sm:text-[10px]" />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">이슈 유형별 분포</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={180} className="sm:h-[200px]">
                        <PieChart>
                          <Pie
                            data={chartData.issueTypeDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            style={{ fontSize: '9px' }}
                            className="sm:text-[10px]"
                            outerRadius={70}
                            className="sm:outerRadius-[80px]"
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {chartData.issueTypeDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'charts' && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">담당자별 완료 현황 (Top 10)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                        <BarChart data={chartData.assigneeDistribution} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" fontSize={9} />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={70}
                            fontSize={10}
                            interval={0}
                          />
                          <Tooltip 
                            formatter={(value, name, props) => [
                              value, 
                              props.payload?.fullName || props.payload?.name || name
                            ]}
                          />
                          <Bar dataKey="value" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">우선순위별 완료 분포</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                        <PieChart>
                          <Pie
                            data={chartData.priorityDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            style={{ fontSize: '9px' }}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {chartData.priorityDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'trends' && (
              <div className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">일별 완료 트렌드</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300} className="sm:h-[400px]">
                      <LineChart data={chartData.completionTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                          angle={-45}
                          textAnchor="end"
                          height={50}
                          className="sm:h-[60px]"
                          fontSize={9}
                          className="sm:text-[10px]"
                        />
                        <YAxis fontSize={9} className="sm:text-[10px]" />
                        <Tooltip 
                          labelFormatter={(value) => `날짜: ${new Date(value).toLocaleDateString('ko-KR')}`}
                          contentStyle={{ fontSize: '12px' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#8884d8" 
                          strokeWidth={2}
                          dot={{ fill: '#8884d8', r: 3 }}
                          className="sm:strokeWidth-[2] sm:dot-r-[4]"
                          name="완료 이슈 수"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'report' && (
              <div className="mt-4">
                <Card>
                  <CardContent className="pt-4 sm:pt-6">
                    <div 
                      className="prose prose-xs sm:prose-sm max-w-none dark:prose-invert overflow-x-auto"
                      style={{
                        fontSize: '14px',
                        lineHeight: '1.5'
                      }}
                      dangerouslySetInnerHTML={{ 
                        __html: formatMarkdown(reportData.report)
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}