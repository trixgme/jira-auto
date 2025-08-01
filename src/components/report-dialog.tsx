'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Copy, BarChart3, PieChartIcon, TrendingUp, FileText } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
import { useLanguage } from '@/contexts/language-context';

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
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // 언어별 로케일 매핑
  const getLocale = () => {
    const localeMap: { [key: string]: string } = {
      'ko': 'ko-KR',
      'en': 'en-US',
      'ja': 'ja-JP',
      'zh': 'zh-CN',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'pt': 'pt-BR',
      'ru': 'ru-RU',
      'ar': 'ar-SA',
      'hi': 'hi-IN',
      'vi': 'vi-VN',
      'it': 'it-IT',
      'tr': 'tr-TR',
      'pl': 'pl-PL',
      'nl': 'nl-NL',
      'sv': 'sv-SE',
      'da': 'da-DK',
      'no': 'no-NO',
      'fi': 'fi-FI',
      'th': 'th-TH',
      'id': 'id-ID',
      'cs': 'cs-CZ',
      'hu': 'hu-HU',
      'ro': 'ro-RO',
      'bg': 'bg-BG',
      'he': 'he-IL'
    };
    return localeMap[language] || 'en-US';
  };

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
                {reportData.reportType === 'ai' ? t('ai_analysis') : t('basic_analysis')}
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
                <span className="hidden sm:inline">{copied ? t('copied') : t('copy')}</span>
              </Button>
              <Button
                onClick={handleDownload}
                size="sm"
                variant="outline"
                className="text-xs px-2 sm:px-3"
              >
                <Download className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">{t('download')}</span>
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
                <span className="hidden sm:inline">{t('overview')}</span>
                <span className="sm:hidden">{t('overview')}</span>
              </Button>
              <Button
                variant={activeTab === 'charts' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('charts')}
                className="text-xs whitespace-nowrap flex-shrink-0"
              >
                <PieChartIcon className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">{t('charts')}</span>
                <span className="sm:hidden">{t('charts')}</span>
              </Button>
              <Button
                variant={activeTab === 'trends' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('trends')}
                className="text-xs whitespace-nowrap flex-shrink-0"
              >
                <TrendingUp className="h-3 w-3 sm:mr-1" />
                <span className="sm:hidden">{t('trends')}</span>
                <span className="hidden sm:inline">{t('trends')}</span>
              </Button>
              <Button
                variant={activeTab === 'report' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('report')}
                className="text-xs whitespace-nowrap flex-shrink-0"
              >
                <FileText className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">{t('detailed_report')}</span>
                <span className="sm:hidden">{t('detailed_report')}</span>
              </Button>
            </div>

            {activeTab === 'overview' && (
              <div className="mt-4 space-y-4">
                {/* 분석 기간 표시 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">📅 {t('analysis_period')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {reportData.dateRange 
                        ? `${new Date(reportData.dateRange.startDate).toLocaleDateString(getLocale())} ~ ${new Date(reportData.dateRange.endDate).toLocaleDateString(getLocale())} (${Math.floor((new Date(reportData.dateRange.endDate).getTime() - new Date(reportData.dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}${t('days')})`
                        : t('last_n_days', reportData.period)
                      }
                    </p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{t('total_completed_issues')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl sm:text-2xl font-bold">{chartData.totalStats.totalIssues}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{t('avg_completion_time')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl sm:text-2xl font-bold">{chartData.totalStats.avgCompletionTime}{t('days')}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{t('most_active_project')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium truncate">{chartData.totalStats.mostActiveProject}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{t('most_active_assignee')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium truncate">{chartData.totalStats.mostActiveAssignee}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">{t('completion_by_project')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={180} className="sm:h-[200px]">
                        <BarChart data={chartData.projectDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} fontSize={9} />
                          <YAxis fontSize={9} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">{t('distribution_by_type')}</CardTitle>
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
                            outerRadius={70}
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
                      <CardTitle className="text-sm">{t('completion_by_assignee')}</CardTitle>
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
                      <CardTitle className="text-sm">{t('distribution_by_priority')}</CardTitle>
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
                    <CardTitle className="text-sm">{t('daily_completion_trend')}</CardTitle>
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
                          fontSize={9}
                        />
                        <YAxis fontSize={9} />
                        <Tooltip 
                          labelFormatter={(value) => `${t('date_label')}: ${new Date(value).toLocaleDateString('ko-KR')}`}
                          contentStyle={{ fontSize: '12px' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#8884d8" 
                          strokeWidth={2}
                          dot={{ fill: '#8884d8', r: 3 }}
                          name={t('completed_issue_count')}
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
                    <div className="prose prose-xs sm:prose-sm max-w-none dark:prose-invert overflow-x-auto">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // 테이블 스타일링
                          table: ({ children, ...props }) => (
                            <div className="overflow-x-auto my-4">
                              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg" {...props}>
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children, ...props }) => (
                            <thead className="bg-gray-50 dark:bg-gray-800" {...props}>
                              {children}
                            </thead>
                          ),
                          tbody: ({ children, ...props }) => (
                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700" {...props}>
                              {children}
                            </tbody>
                          ),
                          th: ({ children, ...props }) => (
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 last:border-r-0" {...props}>
                              {children}
                            </th>
                          ),
                          td: ({ children, ...props }) => (
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 last:border-r-0" {...props}>
                              {children}
                            </td>
                          ),
                          // 제목 스타일링
                          h1: ({ children, ...props }) => (
                            <h1 className="text-2xl font-bold mt-8 mb-4 text-foreground border-b pb-2" {...props}>
                              {children}
                            </h1>
                          ),
                          h2: ({ children, ...props }) => (
                            <h2 className="text-xl font-bold mt-6 mb-3 text-foreground" {...props}>
                              {children}
                            </h2>
                          ),
                          h3: ({ children, ...props }) => (
                            <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground" {...props}>
                              {children}
                            </h3>
                          ),
                          // 인용문 스타일링
                          blockquote: ({ children, ...props }) => (
                            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 italic" {...props}>
                              {children}
                            </blockquote>
                          ),
                          // 코드 블록 스타일링
                          code: ({ children, className, ...props }) => {
                            const isInline = !className;
                            if (isInline) {
                              return (
                                <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                                  {children}
                                </code>
                              );
                            }
                            return (
                              <code className="block bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto" {...props}>
                                {children}
                              </code>
                            );
                          },
                          // 체크박스 스타일링
                          input: ({ type, checked, ...props }) => {
                            if (type === 'checkbox') {
                              return (
                                <input 
                                  type="checkbox" 
                                  checked={checked}
                                  readOnly
                                  className="mr-2 accent-blue-500"
                                  {...props}
                                />
                              );
                            }
                            return <input type={type} {...props} />;
                          },
                          // 리스트 스타일링
                          ul: ({ children, ...props }) => (
                            <ul className="list-disc list-inside my-2 space-y-1" {...props}>
                              {children}
                            </ul>
                          ),
                          ol: ({ children, ...props }) => (
                            <ol className="list-decimal list-inside my-2 space-y-1" {...props}>
                              {children}
                            </ol>
                          ),
                          li: ({ children, ...props }) => (
                            <li className="ml-2 text-muted-foreground" {...props}>
                              {children}
                            </li>
                          ),
                          // 구분선 스타일링
                          hr: ({ ...props }) => (
                            <hr className="my-6 border-t border-gray-300 dark:border-gray-600" {...props} />
                          ),
                          // 강조 스타일링
                          strong: ({ children, ...props }) => (
                            <strong className="font-semibold text-foreground" {...props}>
                              {children}
                            </strong>
                          ),
                          em: ({ children, ...props }) => (
                            <em className="italic" {...props}>
                              {children}
                            </em>
                          ),
                        }}
                      >
                        {reportData.report}
                      </ReactMarkdown>
                    </div>
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