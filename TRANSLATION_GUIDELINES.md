# 번역 가이드라인 (Translation Guidelines)

## 개요

Jira Auto 대시보드는 27개 언어를 지원하는 다국어 애플리케이션입니다. 모든 UI 텍스트는 반드시 번역 시스템을 통해 표시되어야 합니다.

## 🚨 중요 규칙

### ✅ 항상 해야 할 것
1. **모든 사용자에게 보이는 텍스트는 `t()` 함수 사용**
   ```tsx
   // ✅ 올바른 방법
   <Button>{t('save')}</Button>
   <span>{t('loading')}</span>
   <title>{t('page_title')}</title>
   ```

2. **개발자용 로그는 예외적으로 영어/한국어 허용**
   ```tsx
   // ✅ 개발자 로그는 번역 불필요
   console.log('🔄 KPI 데이터 새로고침');
   console.error('API 호출 실패:', error);
   ```

### ❌ 절대 하지 말 것
1. **하드코딩된 텍스트 사용 금지**
   ```tsx
   // ❌ 잘못된 방법
   <Button>새로고침</Button>
   <span>Loading...</span>
   <div>데이터를 불러오는 중...</div>
   ```

## 번역 키 추가 프로세스

### 1단계: 번역 키 정의
새로운 UI 텍스트가 필요한 경우:

1. **한국어 파일에 키 추가** (`src/lib/translations/ko.ts`)
   ```typescript
   export const ko: TranslationKeys = {
     // 기존 키들...
     new_feature_title: '새로운 기능',
     new_feature_description: '이것은 새로운 기능입니다'
   };
   ```

2. **TypeScript 타입 정의** (`src/lib/translations/types.ts`)
   ```typescript
   export interface TranslationKeys {
     // 기존 키들...
     new_feature_title: string;
     new_feature_description: string;
   }
   ```

### 2단계: 모든 언어에 번역 추가
모든 27개 언어 파일에 번역을 추가해야 합니다:

```bash
# 다음 파일들을 모두 업데이트
src/lib/translations/en.ts    # 영어
src/lib/translations/de.ts    # 독일어
src/lib/translations/es.ts    # 스페인어
src/lib/translations/fr.ts    # 프랑스어
src/lib/translations/it.ts    # 이탈리아어
src/lib/translations/pt.ts    # 포르투갈어
src/lib/translations/ru.ts    # 러시아어
src/lib/translations/ja.ts    # 일본어
src/lib/translations/zh.ts    # 중국어
src/lib/translations/ar.ts    # 아랍어
src/lib/translations/hi.ts    # 힌디어
src/lib/translations/th.ts    # 태국어
src/lib/translations/vi.ts    # 베트남어
src/lib/translations/id.ts    # 인도네시아어
src/lib/translations/nl.ts    # 네덜란드어
src/lib/translations/sv.ts    # 스웨덴어
src/lib/translations/da.ts    # 덴마크어
src/lib/translations/no.ts    # 노르웨이어
src/lib/translations/fi.ts    # 핀란드어
src/lib/translations/pl.ts    # 폴란드어
src/lib/translations/cs.ts    # 체코어
src/lib/translations/hu.ts    # 헝가리어
src/lib/translations/ro.ts    # 루마니아어
src/lib/translations/bg.ts    # 불가리아어
src/lib/translations/tr.ts    # 터키어
src/lib/translations/he.ts    # 히브리어
```

### 3단계: 컴포넌트에서 사용
```tsx
import { useLanguage } from '@/contexts/language-context';

export function MyComponent() {
  const { t } = useLanguage();
  
  return (
    <div>
      <h1>{t('new_feature_title')}</h1>
      <p>{t('new_feature_description')}</p>
    </div>
  );
}
```

## 번역 키 네이밍 규칙

### 카테고리별 접두사
```typescript
// 인증 관련
login_title: '로그인'
login_button: '로그인'
logout: '로그아웃'

// 대시보드 관련
dashboard_title: '대시보드'
dashboard_loading: '대시보드 로딩 중'

// KPI 관련
kpi_title: 'KPI 대시보드'
kpi_loading: 'KPI 로딩 중'

// 일반 UI 요소
refresh: '새로고침'
save: '저장'
cancel: '취소'
confirm: '확인'
loading: '로딩 중'
error: '오류'
```

### 동적 텍스트 (매개변수 포함)
```typescript
// 숫자 매개변수
n_days: '{}일'
n_items: '{}개 항목'

// 문자열 매개변수
welcome_user: '{}님, 환영합니다'
last_updated: '마지막 업데이트: {}'
```

## 자동화 스크립트

### 번역 누락 검사
```bash
# 모든 번역 파일에서 누락된 키 검사
npm run check-translations
```

### 대량 번역 추가
```bash
# Claude AI를 통한 대량 번역 (개발 시)
npm run add-translations
```

## 품질 보증

### 번역 품질 체크리스트
- [ ] 모든 27개 언어에 번역 추가
- [ ] TypeScript 타입 정의 업데이트
- [ ] 동적 매개변수 올바른 사용
- [ ] 문화적으로 적절한 번역
- [ ] 일관된 용어 사용

### 테스트 절차
1. 각 언어로 전환하여 UI 확인
2. 누락된 번역 키 없는지 콘솔 확인
3. 동적 텍스트 올바른 표시 확인
4. 긴 텍스트의 UI 레이아웃 확인

## 문제 해결

### 번역이 표시되지 않는 경우
1. `t('key_name')` 함수 사용했는지 확인
2. 해당 키가 모든 번역 파일에 있는지 확인
3. TypeScript 타입 정의에 포함되어 있는지 확인
4. 브라우저 콘솔에서 오류 메시지 확인

### 긴 번역으로 인한 레이아웃 문제
```css
/* CSS로 긴 텍스트 처리 */
.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-wrap {
  word-wrap: break-word;
  overflow-wrap: break-word;
}
```

## 지원 언어 목록

| 언어 | 코드 | 파일명 | 우선순위 |
|------|------|--------|----------|
| 한국어 | ko | ko.ts | 🔴 높음 |
| 영어 | en | en.ts | 🔴 높음 |
| 독일어 | de | de.ts | 🟡 중간 |
| 일본어 | ja | ja.ts | 🟡 중간 |
| 중국어 | zh | zh.ts | 🟡 중간 |
| 스페인어 | es | es.ts | 🟡 중간 |
| 프랑스어 | fr | fr.ts | 🟡 중간 |
| 이탈리아어 | it | it.ts | 🟢 낮음 |
| 포르투갈어 | pt | pt.ts | 🟢 낮음 |
| 러시아어 | ru | ru.ts | 🟢 낮음 |
| 기타 21개 언어 | - | - | 🟢 낮음 |

## 연락처

번역 관련 문제나 질문이 있으면:
- 이슈 생성: GitHub Issues
- 코드 리뷰 시 번역 확인 필수

---

**⚠️ 중요**: 새로운 UI 요소를 추가할 때는 반드시 이 가이드라인을 따라 모든 언어에 번역을 추가해주세요!