export type Language = 'ko' | 'en';

export interface TranslationKeys {
  // Authentication
  login_title: string;
  login_id_label: string;
  login_password_label: string;
  login_button: string;
  login_error_required: string;
  login_error_invalid: string;
  logout: string;
  login_to_access: string;
  username: string;
  password: string;
  login_ing: string;
  login: string;
  default_account_info: string;
  invalid_credentials: string;
  login_error: string;
  
  // Dashboard
  jira_dashboard: string;
  kpi_dashboard: string;
  newly_added_issues: string;
  completed_issues: string;
  issues_created_recent: string;
  issues_created_date_range: string;
  issues_completed_recent: string;
  issues_completed_date_range: string;
  with_search: string;
  n_days: string;
  today: string;
  quick_select: string;
  or: string;
  search_placeholder: string;
  search: string;
  search_results: string;
  no_search_results: string;
  no_new_issues: string;
  no_completed_issues: string;
  generate_ai_report: string;
  generating: string;
  
  // Projects
  all_projects: string;
  
  // Difficulty
  difficulty_unknown: string;
  difficulty_very_easy: string;
  difficulty_easy: string;
  difficulty_medium: string;
  difficulty_hard: string;
  difficulty_very_hard: string;
  difficulty_description: string;
  estimated_time: string;
  estimated_hours: string;
  about_n_hours: string;
  recommendations: string;
  ai_difficulty_analysis: string;
  ai_analysis: string;
  basic_analysis: string;
  ai_analysis_reasoning_ko: string;
  ai_analysis_reasoning_en: string;
  analyze_difficulty: string;
  analyzing_difficulty: string;
  analysis_result: string;
  
  // Comments
  view_comments: string;
  add_comment: string;
  analyze_comments: string;
  analyzing_comments: string;
  comment_analysis_result: string;
  n_comments: string;
  comment_score_very_good: string;
  comment_score_good: string;
  comment_score_normal: string;
  comment_score_needs_improvement: string;
  analysis_result_ko: string;
  analysis_result_en: string;
  key_issues: string;
  
  // Issue Card
  assignee: string;
  unassigned: string;
  created: string;
  updated: string;
  priority: string;
  view_in_jira: string;
  analyzed: string;
  analysis_time: string;
  
  // Report
  ai_analysis_report: string;
  completed_issues_ai_report: string;
  report_gen_preparing: string;
  report_gen_data_analysis: string;
  report_gen_ai_request: string;
  report_gen_processing: string;
  report_gen_finalizing: string;
  no_completed_issues_to_analyze: string;
  report_generation_failed: string;
  report_generation_error: string;
  
  // Recommendations
  rec_junior_assignable: string;
  rec_basic_review: string;
  rec_test_recommended: string;
  rec_intermediate_dev: string;
  rec_design_doc_needed: string;
  rec_thorough_review: string;
  rec_tests_required: string;
  rec_senior_required: string;
  rec_detailed_design: string;
  rec_multiple_reviews: string;
  rec_comprehensive_testing: string;
  rec_team_discussion: string;
  
  // Status
  comment_added_to_jira: string;
  comment_add_failed: string;
  analysis_difficulty_warning: string;
  
  // Loading
  loading: string;
  loading_project_info: string;
  loading_new_issues: string;
  loading_completed_issues: string;
  loading_data_processing: string;
  
  // Error
  error: string;
  check_env_config: string;
  
  // KPI Dashboard
  total_issues: string;
  new_issues: string;
  in_progress_issues: string;
  reopened_issues: string;
  daily_created_vs_completed: string;
  issue_trends: string;
  average_completion_time: string;
  issues_by_assignee: string;
  issues_by_priority: string;
  high_priority: string;
  medium_priority: string;
  low_priority: string;
  no_priority: string;
  select_chart_type: string;
  select_assignee: string;
  all_assignees: string;
  kpi_updated_at: string;
  kpi_description: string;
  kpi_fetch_error: string;
  
  // Date Range
  start_date: string;
  end_date: string;
  date_range: string;
  custom_range: string;
  date_label: string;
  
  // Stats
  avg_days: string;
  duration: string;
  completed_issue_count: string;
  
  // Language
  language: string;
  
  // Copy
  copy_report: string;
  copy_success: string;
  copy_failed: string;
  copied: string;
  copy: string;
  
  // Download
  download_txt: string;
  download_md: string;
  download: string;
  
  // Additional
  close: string;
  overview: string;
  charts: string;
  trends: string;
  detailed_report: string;
  analysis_period: string;
  total_completed_issues: string;
  avg_completion_time: string;
  most_active_project: string;
  most_active_assignee: string;
  completion_by_project: string;
  distribution_by_type: string;
  completion_by_assignee: string;
  distribution_by_priority: string;
  daily_completion_trend: string;
  
  // Missing keys from old implementation
  dashboard: string;
  kpi: string;
  issue_status_chart: string;
  new_short: string;
  completed_short: string;
  net_change: string;
  issue_creation_completion_status: string;
  same_day: string;
  one_day: string;
  n_weeks: string;
  n_weeks_n_days: string;
  n_months: string;
  n_months_n_days: string;
  loading_step_initializing: string;
  loading_step_projects: string;
  loading_step_issues: string;
  loading_step_kpi_calculation: string;
  loading_step_completed: string;
  month: string;
  kpi_date_range_description: string;
  kpi_month_description: string;
  no_completed_issues_in_list: string;
  project: string;
  days: string;
  view_issue_list: string;
  user_issue_list: string;
  loading_jira_data: string;
  loading_step_progress: string;
  
  // KPI Dashboard specific
  kpi_fetch_fail_check_config: string;
  resolution_rate: string;
  user: string;
  all: string;
  todo: string;
  completed: string;
  favorite_add: string;
  favorite_remove: string;
  user_assigned_issues: string;
  month_assigned_issues_list: string;
  no_assigned_issues: string;
  no_todo_issues: string;
  ai_analysis_failed: string;
  comment_analysis_failed: string;
  comment_analysis_error: string;
  favorite_users_display: string;
  created_in_month: string;
  created_date_range: string;
  resolved_issues: string;
  unresolved_issues: string;
  percent_completed: string;
  active_users: string;
  user_kpi: string;
  assigned_issues: string;
  resolution_rate_chart: string;
  avg_resolution_time: string;
  no_kpi_data: string;
  resolution_rate_progress: string;
  comment_analysis: string;

  // Weekdays
  sun: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  
  // Date picker
  yesterday: string;
  last_n_days: string;
  this_month: string;
  selected_range: string;
  reset_filter: string;
  apply: string;
  
  // KPI Dashboard missing keys
  assigned: string;
  avgResolutionTime: string;
  resolutionRate: string;
  resolved: string;
  unresolved: string;

  // UI 공통 요소
  refresh_data: string;
  refresh: string;

  // Jira 이슈 타입 번역
  issue_type_task: string;
  issue_type_story: string;
  issue_type_bug: string;
  issue_type_epic: string;
  issue_type_subtask: string;
  issue_type_improvement: string;
  issue_type_new_feature: string;

  // Jira 상태 번역
  status_to_do: string;
  status_in_progress: string;
  status_done: string;
  status_open: string;
  status_resolved: string;
  status_closed: string;
  status_reopened: string;
  status_review: string;
  status_testing: string;

  // KPI 점수 관련
  kpi_score_title: string;
  points: string;
  overall_performance: string;
  completion_rate: string;
  detailed_score_analysis: string;
  completion_rate_score: string;
  completion_rate_tooltip: string;
  productivity_score: string;
  productivity_tooltip: string;
  quality_score: string;
  quality_tooltip: string;
  consistency_score: string;
  consistency_tooltip: string;
  completed_ratio: string;
  avg_difficulty_handled: string;
  no_ai_analysis_available: string;
  work_pattern_consistency: string;
  additional_metrics: string;
  work_frequency: string;
  complexity_bonus: string;
  time_consistency: string;
  grade_level: string;
  grade: string;
  improvement_recommendations: string;
  score: string;
  ai_comprehensive_analysis: string;
  ai_analyzing: string;
  ai_analysis_failed_retry: string;
  
  // Month names
  january: string;
  february: string;
  march: string;
  april: string;
  may: string;
  june: string;
  july: string;
  august: string;
  september: string;
  october: string;
  november: string;
  december: string;
}