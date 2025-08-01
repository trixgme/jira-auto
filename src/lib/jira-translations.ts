import { useLanguage } from '@/contexts/language-context';
import { translations } from '@/lib/translations';

// 이슈 타입 번역 매핑
const ISSUE_TYPE_MAPPING: Record<string, string> = {
  'Task': 'issue_type_task',
  'Story': 'issue_type_story',
  'Bug': 'issue_type_bug',
  'Epic': 'issue_type_epic',
  'Sub-task': 'issue_type_subtask',
  'Subtask': 'issue_type_subtask',
  'Improvement': 'issue_type_improvement',
  'New Feature': 'issue_type_new_feature',
  // 한국어로 올 가능성도 있는 케이스들
  '할일': 'issue_type_task',
  '작업': 'issue_type_task',
  '스토리': 'issue_type_story',
  '버그': 'issue_type_bug',
  '에픽': 'issue_type_epic',
  '하위 작업': 'issue_type_subtask',
  '개선': 'issue_type_improvement',
  '새 기능': 'issue_type_new_feature',
};

// 상태 번역 매핑
const STATUS_MAPPING: Record<string, string> = {
  'To Do': 'status_to_do',
  'In Progress': 'status_in_progress',
  'Done': 'status_done',
  'Open': 'status_open',
  'Resolved': 'status_resolved',
  'Closed': 'status_closed',
  'Reopened': 'status_reopened',
  'Review': 'status_review',
  'Testing': 'status_testing',
  // 한국어로 올 가능성도 있는 케이스들
  '할 일': 'status_to_do',
  '진행 중': 'status_in_progress',
  '완료': 'status_done',
  '열림': 'status_open',
  '해결됨': 'status_resolved',
  '종료': 'status_closed',
  '다시 열림': 'status_reopened',
  '검토': 'status_review',
  '테스트': 'status_testing',
};

// 이슈 타입 번역 함수
export function translateIssueType(issueType: string, t: (key: string) => string): string {
  const translationKey = ISSUE_TYPE_MAPPING[issueType];
  if (translationKey) {
    return t(translationKey);
  }
  // 번역이 없으면 원본 반환
  return issueType;
}

// 상태 번역 함수
export function translateStatus(status: string, t: (key: string) => string): string {
  const translationKey = STATUS_MAPPING[status];
  if (translationKey) {
    return t(translationKey);
  }
  // 번역이 없으면 원본 반환
  return status;
}

// 서버 측에서도 사용할 수 있는 번역 함수
export function getTranslatedIssueType(issueType: string, language: string = 'ko'): string {
  const t = (key: string) => {
    const lang = language as 'ko' | 'en';
    const translation = translations[lang];
    if (translation && key in translation) {
      return (translation as any)[key] as string;
    }
    return key;
  };
  return translateIssueType(issueType, t);
}

export function getTranslatedStatus(status: string, language: string = 'ko'): string {
  const t = (key: string) => {
    const lang = language as 'ko' | 'en';
    const translation = translations[lang];
    if (translation && key in translation) {
      return (translation as any)[key] as string;
    }
    return key;
  };
  return translateStatus(status, t);
}

// Hook을 사용하는 버전
export function useJiraTranslations() {
  const { t } = useLanguage();
  
  const tWrapper = (key: string) => t(key as any);
  
  return {
    translateIssueType: (issueType: string) => translateIssueType(issueType, tWrapper),
    translateStatus: (status: string) => translateStatus(status, tWrapper),
  };
}