'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ko' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.ko) => string;
}

const translations = {
  ko: {
    // Header
    'jira_dashboard': 'Jira Dashboard',
    'dashboard': '대시보드',
    'kpi': 'KPI',
    'logout': '로그아웃',
    'logout_ing': '로그아웃 중...',
    
    // Language selector
    'language': '언어',
    'korean': '한국어',
    'english': 'English',
    
    // Dashboard
    'new_issues': '새로운 이슈',
    'completed_issues': '완료된 이슈',
    'newly_added_issues': '새로 추가된 이슈',
    'all_projects': '모든 프로젝트',
    'search_placeholder': '이슈 제목, 키, 프로젝트, 담당자로 검색... (Enter로 검색)',
    'clear_search': '검색 지우기',
    'today': '오늘',
    '7_days': '7일',
    '30_days': '30일',
    'n_days': '{}일',
    'custom_range': '기간 설정',
    'reset_filter': '필터 초기화',
    'quick_select': '빠른 선택:',
    'or': '또는',
    'search': '검색',
    'search_results': '검색 결과: 새로운 이슈 {}개, 완료된 이슈 {}개',
    'issues_created_in': '{} 생성된 이슈',
    'issues_completed_in': '{} 완료된 이슈',
    'issues_created_date_range': '{} ~ {} 생성된 이슈',
    'issues_completed_date_range': '{} ~ {} 완료된 이슈',
    'issues_created_recent': '최근 {} 생성된 이슈',
    'issues_completed_recent': '최근 {} 완료된 이슈',
    'with_search': ' (검색: "{}")',
    'generating': '생성중...',
    
    // Issue card
    'analyze': '분석',
    'comment_analysis': '댓글 분석',
    'difficulty': '난이도',
    'hours': '시간',
    'estimated_hours': '예상 {}시간',
    'created': '생성',
    'updated': '업데이트됨',
    'completed': '완료',
    'duration': '소요시간',
    'assignee': '담당자',
    'reporter': '보고자',
    'priority': '우선순위',
    'type': '유형',
    'status': '상태',
    'ai_analysis_failed': 'AI 분석 실패: {}',
    'comment_analysis_failed': '댓글 분석 실패: {}',
    'comment_analysis_error': '댓글 분석 중 오류가 발생했습니다.',
    
    // KPI Page
    'kpi_description': '개발팀의 업무 진행 상황을 정량적으로 추적합니다.',
    'month': '월',
    'all': '전체',
    'todo': '해야할일',
    'completed': '완료',
    'favorite_users_display': '즐겨찾기한 사용자 {}명이 상단에 표시됩니다.',
    'total_issues': '전체 이슈',
    'resolved_issues': '해결된 이슈',
    'unresolved_issues': '미해결 이슈',
    'active_users': '활성 사용자',
    'percent_completed': '{}% 완료',
    'created_in_month': '{}월 생성',
    'created_date_range': '{} ~ {} 생성',
    'user_kpi': '사용자별 KPI',
    'no_kpi_data': 'KPI 데이터가 없습니다.',
    'user': '사용자',
    'assigned_issues': '할당된 이슈',
    'resolution_rate': '해결률',
    'resolution_rate_chart': '해결률 차트',
    'resolution_rate_progress': '해결률 진행도',
    'avg_resolution_time': '평균 해결시간',
    'favorite_add': '즐겨찾기 추가',
    'favorite_remove': '즐겨찾기 해제',
    'user_assigned_issues': '{}님의 할당된 이슈',
    'month_assigned_issues_list': '{}월에 할당된 총 {}개의 이슈 목록',
    'date_assigned_issues_list': '선택 기간에 할당된 총 {}개의 이슈 목록',
    'no_assigned_issues': '할당된 이슈가 없습니다.',
    'no_todo_issues': '해야할 이슈가 없습니다.',
    'no_completed_issues_in_list': '완료된 이슈가 없습니다.',
    'project': '프로젝트',
    'view_issue_list': '이슈 목록 보기 ({}개)',
    'user_issue_list': '{}의 이슈 목록',
    'loading_step_initializing': '초기화 중...',
    'loading_step_projects': '프로젝트 정보 조회 중...',
    'loading_step_issues': '이슈 데이터 조회 중...',
    'loading_step_kpi_calculation': 'KPI 데이터 계산 중...',
    'loading_step_completed': '완료',
    'kpi_month_description': '{}월에 생성된 이슈 기준으로 각 사용자의 할당, 해결, 미해결 현황 및 평균 해결 시간',
    'kpi_date_range_description': '{} ~ {} 기간에 생성된 이슈 기준으로 각 사용자의 할당, 해결, 미해결 현황 및 평균 해결 시간',
    
    // Time duration
    'same_day': '당일',
    'one_day': '1일',
    'n_weeks': '{}주',
    'n_weeks_n_days': '{}주 {}일',
    'n_months': '{}개월',
    'n_months_n_days': '{}개월 {}일',
    
    // Report
    'generate_ai_report': 'AI 보고서',
    'report_generating': '보고서 생성 중...',
    'ai_analysis_report': '완료된 이슈 AI 분석 보고서',
    'ai_analysis': 'AI 분석',
    'basic_analysis': '기본 분석',
    'copy': '복사',
    'copied': '복사됨!',
    'download': '다운로드',
    'report_gen_preparing': '보고서 생성 준비 중...',
    'report_gen_data_analysis': '데이터 분석 준비 중...',
    'report_gen_ai_request': 'AI 분석 요청 중...',
    'report_gen_processing': '분석 결과 처리 중...',
    'report_gen_finalizing': '보고서 구성 중...',
    'no_completed_issues_to_analyze': '분석할 완료된 이슈가 없습니다.',
    'report_generation_failed': '보고서 생성에 실패했습니다.',
    'report_generation_error': '보고서 생성 중 오류가 발생했습니다.',
    
    // Report tabs
    'overview': '전체 요약',
    'charts': '차트 분석',
    'trends': '트렌드',
    'detailed_report': '상세 보고서',
    
    // Chart and stats
    'issue_status_chart': '이슈 현황 차트',
    'new_short': '신규',
    'completed_short': '완료',
    'net_change': '순증감',
    'issue_creation_completion_status': '이슈 생성 및 완료 현황',
    'analysis_period': '분석 기간',
    'total_completed_issues': '총 완료 이슈',
    'avg_completion_time': '평균 완료 시간',
    'most_active_project': '최다 완료 프로젝트',
    'most_active_assignee': '최다 완료 담당자',
    'completion_by_project': '프로젝트별 완료 현황',
    'distribution_by_type': '이슈 유형별 분포',
    'completion_by_assignee': '담당자별 완료 현황 (Top 10)',
    'distribution_by_priority': '우선순위별 완료 분포',
    'daily_completion_trend': '일별 완료 트렌드',
    'days': '일',
    'last_n_days': '최근 {} 일간',
    'date_range_format': '{} ~ {} ({}일간)',
    'completed_issue_count': '완료 이슈 수',
    'date_label': '날짜',
    
    // Loading and errors
    'loading': '로딩 중...',
    'loading_jira_data': 'Jira 데이터를 가져오는 중...',
    'loading_step_progress': '{} / {} 단계 진행 중',
    'loading_project_info': '프로젝트 정보 조회 중...',
    'loading_new_issues': '새로운 이슈 조회 중...',
    'loading_completed_issues': '완료된 이슈 조회 중...',
    'loading_data_processing': '데이터 처리 중...',
    'error': '오류',
    'no_issues_found': '이슈를 찾을 수 없습니다',
    'no_new_issues': '새로 추가된 이슈가 없습니다.',
    'no_completed_issues': '완료된 이슈가 없습니다.',
    'no_search_results': '검색 결과가 없습니다.',
    'failed_to_load': '데이터를 불러오는데 실패했습니다',
    'check_env_config': '.env.local 파일에 Jira 설정이 올바르게 되어있는지 확인해주세요.',
    
    // Filters
    'filter_by_project': '프로젝트별 필터',
    'filter_by_date': '날짜별 필터',
    'showing_issues': '총 {}개 이슈',
    
    // Login page
    'login': '로그인',
    'login_ing': '로그인 중...',
    'login_to_access': '대시보드에 접근하려면 로그인하세요',
    'username': '아이디',
    'password': '비밀번호',
    'invalid_credentials': '잘못된 아이디 또는 비밀번호입니다',
    'login_error': '로그인 중 오류가 발생했습니다',
    'default_account_info': '기본 계정: admin/admin 또는 user/user',
    
    // Difficulty dialog
    'ai_difficulty_analysis': 'AI 난이도 분석 결과',
    'difficulty_description': '난이도 설명',
    'ai_analysis_reasoning_en': 'AI 분석 근거 (English)',
    'ai_analysis_reasoning_ko': 'AI 분석 근거 (한국어)',
    'estimated_time': '예상 소요 시간',
    'about_n_hours': '약 {}시간',
    'recommendations': '권장 사항',
    'analysis_time': '분석 일시: {}',
    'comment_added_to_jira': 'Jira 이슈에 분석 결과가 댓글로 추가되었습니다',
    'comment_add_failed': 'Jira 댓글 추가 실패 (수동으로 복사해서 사용하세요)',
    
    // Difficulty levels
    'difficulty_very_easy': '매우 간단한 작업으로, 경험이 적은 개발자도 쉽게 처리할 수 있습니다.',
    'difficulty_easy': '비교적 간단한 작업으로, 기본적인 이해만 있으면 처리 가능합니다.',
    'difficulty_medium': '중간 정도의 복잡도로, 어느 정도의 경험과 설계가 필요합니다.',
    'difficulty_hard': '복잡한 작업으로, 숙련된 개발자와 신중한 계획이 필요합니다.',
    'difficulty_very_hard': '매우 복잡한 작업으로, 아키텍처 변경이나 광범위한 영향을 미칠 수 있습니다.',
    
    // Difficulty recommendations
    'rec_junior_assignable': '주니어 개발자에게 할당 가능',
    'rec_basic_review': '코드 리뷰는 기본적인 수준으로 충분',
    'rec_test_recommended': '테스트 케이스 작성 권장',
    'rec_intermediate_dev': '중급 이상 개발자 권장',
    'rec_design_doc_needed': '설계 문서 작성 필요',
    'rec_thorough_review': '철저한 코드 리뷰 필요',
    'rec_tests_required': '단위 테스트 및 통합 테스트 필수',
    'rec_senior_required': '시니어 개발자 필수',
    'rec_detailed_design': '상세한 기술 설계 문서 필요',
    'rec_multiple_reviews': '여러 번의 코드 리뷰 세션 권장',
    'rec_comprehensive_testing': '포괄적인 테스트 전략 수립',
    'rec_team_discussion': '관련 팀과의 협의 필요',
    
    // Comment analysis dialog
    'comment_analysis_result': '댓글 분석 결과',
    'comment_score_very_good': '매우 좋음',
    'comment_score_good': '좋음',
    'comment_score_normal': '보통',
    'comment_score_needs_improvement': '개선 필요',
    'analysis_difficulty_warning': '⚠️ 언어적 장벽, 기술적 전문 용어, 또는 충분하지 않은 맥락으로 인해 정확한 분석이 어려울 수 있습니다.',
    'analysis_result_ko': '🇰🇷 분석 결과 (한국어)',
    'analysis_result_en': '🇬🇧 Analysis Result (English)',
    'key_issues': '주요 이슈',
    'improvement_recommendations': '개선 권장사항',
    
    // Date range picker
    'yesterday': '어제',
    'this_month': '이번 달',
    'selected_range': '선택된 범위',
    'apply': '적용',
    
    // Weekdays
    'sun': '일',
    'mon': '월',
    'tue': '화',
    'wed': '수',
    'thu': '목',
    'fri': '금',
    'sat': '토',
  },
  en: {
    // Header
    'jira_dashboard': 'Jira Dashboard',
    'dashboard': 'Dashboard',
    'kpi': 'KPI',
    'logout': 'Logout',
    'logout_ing': 'Logging out...',
    
    // Language selector
    'language': 'Language',
    'korean': '한국어',
    'english': 'English',
    
    // Dashboard
    'new_issues': 'New Issues',
    'completed_issues': 'Completed Issues',
    'newly_added_issues': 'Newly Added Issues',
    'all_projects': 'All Projects',
    'search_placeholder': 'Search by issue title, key, project, assignee... (Press Enter to search)',
    'clear_search': 'Clear search',
    'today': 'Today',
    '7_days': '7 days',
    '30_days': '30 days',
    'n_days': '{} days',
    'custom_range': 'Custom range',
    'reset_filter': 'Reset filters',
    'quick_select': 'Quick select:',
    'or': 'or',
    'search': 'Search',
    'search_results': 'Search results: {} new issues, {} completed issues',
    'issues_created_in': 'Issues created in {}',
    'issues_completed_in': 'Issues completed in {}',
    'issues_created_date_range': 'Issues created {} ~ {}',
    'issues_completed_date_range': 'Issues completed {} ~ {}',
    'issues_created_recent': 'Issues created in last {}',
    'issues_completed_recent': 'Issues completed in last {}',
    'with_search': ' (Search: "{}")',
    'generating': 'Generating...',
    
    // Issue card
    'analyze': 'Analyze',
    'comment_analysis': 'Comment Analysis',
    'difficulty': 'Difficulty',
    'hours': 'hours',
    'estimated_hours': 'Est. {} hours',
    'created': 'Created',
    'updated': 'Updated',
    'completed': 'Completed',
    'duration': 'Duration',
    'assignee': 'Assignee',
    'reporter': 'Reporter',
    'priority': 'Priority',
    'type': 'Type',
    'status': 'Status',
    'ai_analysis_failed': 'AI analysis failed: {}',
    'comment_analysis_failed': 'Comment analysis failed: {}',
    'comment_analysis_error': 'Error occurred during comment analysis.',
    
    // Time duration
    'same_day': 'Same day',
    'one_day': '1 day',
    'n_weeks': '{} weeks',
    'n_weeks_n_days': '{} weeks {} days',
    'n_months': '{} months',
    'n_months_n_days': '{} months {} days',
    
    // Report
    'generate_ai_report': 'AI Report',
    'report_generating': 'Generating report...',
    'ai_analysis_report': 'Completed Issues AI Analysis Report',
    'ai_analysis': 'AI Analysis',
    'basic_analysis': 'Basic Analysis',
    'copy': 'Copy',
    'copied': 'Copied!',
    'download': 'Download',
    'report_gen_preparing': 'Preparing report generation...',
    'report_gen_data_analysis': 'Preparing data analysis...',
    'report_gen_ai_request': 'Requesting AI analysis...',
    'report_gen_processing': 'Processing analysis results...',
    'report_gen_finalizing': 'Finalizing report...',
    'no_completed_issues_to_analyze': 'No completed issues to analyze.',
    'report_generation_failed': 'Failed to generate report.',
    'report_generation_error': 'Error occurred during report generation.',
    
    // Report tabs
    'overview': 'Overview',
    'charts': 'Charts',
    'trends': 'Trends',
    'detailed_report': 'Detailed Report',
    
    // Chart and stats
    'issue_status_chart': 'Issue Status Chart',
    'new_short': 'New',
    'completed_short': 'Completed',
    'net_change': 'Net Change',
    'issue_creation_completion_status': 'Issue Creation & Completion Status',
    'analysis_period': 'Analysis Period',
    'total_completed_issues': 'Total Completed Issues',
    'avg_completion_time': 'Avg Completion Time',
    'most_active_project': 'Most Active Project',
    'most_active_assignee': 'Most Active Assignee',
    'completion_by_project': 'Completion by Project',
    'distribution_by_type': 'Distribution by Issue Type',
    'completion_by_assignee': 'Completion by Assignee (Top 10)',
    'distribution_by_priority': 'Distribution by Priority',
    'daily_completion_trend': 'Daily Completion Trend',
    'days': 'days',
    'last_n_days': 'Last {} days',
    'date_range_format': '{} ~ {} ({} days)',
    'completed_issue_count': 'Completed Issues',
    'date_label': 'Date',
    
    // Loading and errors
    'loading': 'Loading...',
    'loading_project_info': 'Loading project information...',
    'loading_new_issues': 'Loading new issues...',
    'loading_completed_issues': 'Loading completed issues...',
    'loading_data_processing': 'Processing data...',
    'error': 'Error',
    'no_issues_found': 'No issues found',
    'no_new_issues': 'No newly added issues.',
    'no_completed_issues': 'No completed issues.',
    'no_search_results': 'No search results.',
    'failed_to_load': 'Failed to load data',
    'check_env_config': 'Please check if Jira settings are correctly configured in .env.local file.',
    
    // Filters
    'filter_by_project': 'Filter by project',
    'filter_by_date': 'Filter by date',
    'showing_issues': 'Showing {} issues',
    
    // Login page
    'login': 'Login',
    'login_ing': 'Logging in...',
    'login_to_access': 'Login to access dashboard',
    'username': 'Username',
    'password': 'Password',
    'invalid_credentials': 'Invalid username or password',
    'login_error': 'Error occurred during login',
    'default_account_info': 'Default accounts: admin/admin or user/user',
    
    // Difficulty dialog
    'ai_difficulty_analysis': 'AI Difficulty Analysis Result',
    'difficulty_description': 'Difficulty Description',
    'ai_analysis_reasoning_en': 'AI Analysis Reasoning (English)',
    'ai_analysis_reasoning_ko': 'AI Analysis Reasoning (Korean)',
    'estimated_time': 'Estimated Time',
    'about_n_hours': 'About {} hours',
    'recommendations': 'Recommendations',
    'analysis_time': 'Analysis time: {}',
    'comment_added_to_jira': 'Analysis result added to Jira issue as comment',
    'comment_add_failed': 'Failed to add Jira comment (please copy and use manually)',
    
    // Difficulty levels
    'difficulty_very_easy': 'Very simple task that even junior developers can easily handle.',
    'difficulty_easy': 'Relatively simple task that can be handled with basic understanding.',
    'difficulty_medium': 'Medium complexity requiring some experience and design.',
    'difficulty_hard': 'Complex task requiring skilled developers and careful planning.',
    'difficulty_very_hard': 'Very complex task that may involve architecture changes or wide-ranging impact.',
    
    // Difficulty recommendations
    'rec_junior_assignable': 'Can be assigned to junior developers',
    'rec_basic_review': 'Basic level code review is sufficient',
    'rec_test_recommended': 'Test case creation recommended',
    'rec_intermediate_dev': 'Intermediate or higher developer recommended',
    'rec_design_doc_needed': 'Design document required',
    'rec_thorough_review': 'Thorough code review required',
    'rec_tests_required': 'Unit and integration tests required',
    'rec_senior_required': 'Senior developer required',
    'rec_detailed_design': 'Detailed technical design document required',
    'rec_multiple_reviews': 'Multiple code review sessions recommended',
    'rec_comprehensive_testing': 'Comprehensive testing strategy required',
    'rec_team_discussion': 'Discussion with related teams required',
    
    // Comment analysis dialog
    'comment_analysis_result': 'Comment Analysis Result',
    'comment_score_very_good': 'Very Good',
    'comment_score_good': 'Good',
    'comment_score_normal': 'Normal',
    'comment_score_needs_improvement': 'Needs Improvement',
    'analysis_difficulty_warning': '⚠️ Accurate analysis may be difficult due to language barriers, technical jargon, or insufficient context.',
    'analysis_result_ko': '🇰🇷 Analysis Result (Korean)',
    'analysis_result_en': '🇬🇧 Analysis Result (English)',
    'key_issues': 'Key Issues',
    'improvement_recommendations': 'Improvement Recommendations',
    
    // Date range picker
    'yesterday': 'Yesterday',
    'this_month': 'This month',
    'selected_range': 'Selected range',
    'apply': 'Apply',
    
    // Weekdays
    'sun': 'Sun',
    'mon': 'Mon',
    'tue': 'Tue',
    'wed': 'Wed',
    'thu': 'Thu',
    'fri': 'Fri',
    'sat': 'Sat',
    
    // KPI Page
    'kpi_description': 'Track quantitative progress of development team activities.',
    'month': 'Month',
    'all': 'All',
    'todo': 'To Do',
    'completed': 'Completed',
    'favorite_users_display': '{} favorite users are displayed at the top.',
    'total_issues': 'Total Issues',
    'resolved_issues': 'Resolved Issues',
    'unresolved_issues': 'Unresolved Issues',
    'active_users': 'Active Users',
    'percent_completed': '{}% Completed',
    'created_in_month': 'Created in {}',
    'created_date_range': 'Created {} ~ {}',
    'user_kpi': 'User KPI',
    'no_kpi_data': 'No KPI data available.',
    'user': 'User',
    'assigned_issues': 'Assigned Issues',
    'resolution_rate': 'Resolution Rate',
    'resolution_rate_chart': 'Resolution Rate Chart',
    'resolution_rate_progress': 'Resolution Rate Progress',
    'avg_resolution_time': 'Avg Resolution Time',
    'favorite_add': 'Add to Favorites',
    'favorite_remove': 'Remove from Favorites',
    'user_assigned_issues': '{} Assigned Issues',
    'month_assigned_issues_list': 'Total {} issues assigned in {}',
    'date_assigned_issues_list': 'Total {} issues assigned in selected period',
    'no_assigned_issues': 'No assigned issues.',
    'no_todo_issues': 'No to-do issues.',
    'no_completed_issues_in_list': 'No completed issues.',
    'project': 'Project',
    'view_issue_list': 'View Issue List ({} items)',
    'user_issue_list': '{} Issue List',
    'loading_step_initializing': 'Initializing...',
    'loading_step_projects': 'Loading project information...',
    'loading_step_issues': 'Loading issue data...',
    'loading_step_kpi_calculation': 'Calculating KPI data...',
    'loading_step_completed': 'Completed',
    'kpi_month_description': 'Assigned, resolved, unresolved status and average resolution time by user based on issues created in {}',
    'kpi_date_range_description': 'Assigned, resolved, unresolved status and average resolution time by user based on issues created from {} to {}',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('ko');

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'ko' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    
    // Update document language
    document.documentElement.lang = lang;
  };

  const t = (key: keyof typeof translations.ko, ...args: any[]): string => {
    let text = translations[language][key] || key;
    
    // Replace {} placeholders with arguments
    args.forEach(arg => {
      text = text.replace('{}', String(arg));
    });
    
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}