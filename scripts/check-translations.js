#!/usr/bin/env node

/**
 * 번역 키 누락 검사 스크립트
 * 모든 번역 파일에서 누락된 키를 찾아서 보고합니다.
 */

const fs = require('fs');
const path = require('path');

const TRANSLATIONS_DIR = path.join(__dirname, '../src/lib/translations');
const REFERENCE_FILE = 'ko.ts'; // 한국어를 기준으로 함
const IGNORE_FILES = ['index.ts', 'types.ts'];

// 색상 출력을 위한 ANSI 코드
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

/**
 * 번역 파일에서 키 추출
 */
function extractKeysFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const keys = [];
    
    // 키: 값 패턴을 찾아서 키만 추출
    const keyPattern = /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/gm;
    let match;
    
    while ((match = keyPattern.exec(content)) !== null) {
      keys.push(match[1]);
    }
    
    return keys;
  } catch (error) {
    console.error(`${colors.red}파일 읽기 실패: ${filePath}${colors.reset}`);
    console.error(error.message);
    return [];
  }
}

/**
 * 메인 검사 함수
 */
function checkTranslations() {
  console.log(`${colors.cyan}🔍 번역 키 누락 검사 시작...${colors.reset}\n`);
  
  // 모든 번역 파일 찾기
  const files = fs.readdirSync(TRANSLATIONS_DIR)
    .filter(file => file.endsWith('.ts') && !IGNORE_FILES.includes(file))
    .sort();
  
  if (files.length === 0) {
    console.error(`${colors.red}번역 파일을 찾을 수 없습니다: ${TRANSLATIONS_DIR}${colors.reset}`);
    process.exit(1);
  }
  
  // 기준 파일(한국어)에서 키 추출
  const referencePath = path.join(TRANSLATIONS_DIR, REFERENCE_FILE);
  if (!fs.existsSync(referencePath)) {
    console.error(`${colors.red}기준 파일을 찾을 수 없습니다: ${REFERENCE_FILE}${colors.reset}`);
    process.exit(1);
  }
  
  const referenceKeys = extractKeysFromFile(referencePath);
  console.log(`${colors.blue}📋 기준 파일 (${REFERENCE_FILE}): ${referenceKeys.length}개 키${colors.reset}`);
  
  let hasErrors = false;
  const report = [];
  
  // 각 번역 파일 검사
  for (const file of files) {
    if (file === REFERENCE_FILE) continue;
    
    const filePath = path.join(TRANSLATIONS_DIR, file);
    const fileKeys = extractKeysFromFile(filePath);
    const missingKeys = referenceKeys.filter(key => !fileKeys.includes(key));
    const extraKeys = fileKeys.filter(key => !referenceKeys.includes(key));
    
    const language = file.replace('.ts', '');
    const status = missingKeys.length === 0 && extraKeys.length === 0 ? 'OK' : 'ISSUES';
    
    report.push({
      file,
      language,
      total: fileKeys.length,
      missing: missingKeys.length,
      extra: extraKeys.length,
      missingKeys,
      extraKeys,
      status
    });
    
    if (missingKeys.length > 0 || extraKeys.length > 0) {
      hasErrors = true;
    }
  }
  
  // 결과 출력
  console.log(`\n${colors.magenta}📊 검사 결과:${colors.reset}`);
  console.log('┌─────────────┬─────────┬─────────┬─────────┬──────────┐');
  console.log('│ 언어        │ 총 키   │ 누락    │ 추가    │ 상태     │');
  console.log('├─────────────┼─────────┼─────────┼─────────┼──────────┤');
  
  for (const item of report) {
    const statusColor = item.status === 'OK' ? colors.green : colors.red;
    const lang = item.language.padEnd(11);
    const total = item.total.toString().padStart(7);
    const missing = item.missing.toString().padStart(7);
    const extra = item.extra.toString().padStart(7);
    const status = item.status.padEnd(8);
    
    console.log(`│ ${lang} │${total} │${statusColor}${missing}${colors.reset} │${statusColor}${extra}${colors.reset} │ ${statusColor}${status}${colors.reset} │`);
  }
  
  console.log('└─────────────┴─────────┴─────────┴─────────┴──────────┘');
  
  // 상세 오류 정보
  if (hasErrors) {
    console.log(`\n${colors.red}❌ 발견된 문제들:${colors.reset}`);
    
    for (const item of report.filter(r => r.status === 'ISSUES')) {
      console.log(`\n${colors.yellow}📁 ${item.file} (${item.language}):${colors.reset}`);
      
      if (item.missingKeys.length > 0) {
        console.log(`  ${colors.red}누락된 키 (${item.missingKeys.length}개):${colors.reset}`);
        item.missingKeys.forEach(key => {
          console.log(`    - ${colors.red}${key}${colors.reset}`);
        });
      }
      
      if (item.extraKeys.length > 0) {
        console.log(`  ${colors.yellow}추가된 키 (${item.extraKeys.length}개):${colors.reset}`);
        item.extraKeys.forEach(key => {
          console.log(`    + ${colors.yellow}${key}${colors.reset}`);
        });
      }
    }
    
    console.log(`\n${colors.red}🚨 번역 파일에 문제가 있습니다!${colors.reset}`);
    console.log(`${colors.cyan}💡 TRANSLATION_GUIDELINES.md를 참고하여 수정해주세요.${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}✅ 모든 번역 파일이 완벽합니다!${colors.reset}`);
    process.exit(0);
  }
}

// 스크립트 실행
if (require.main === module) {
  checkTranslations();
}

module.exports = { checkTranslations, extractKeysFromFile };