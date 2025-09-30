# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language Preference
- Use 한국어 for all responses and code comments
- Keep technical terms and code keywords in English

## Interaction Guidelines
### 사용자 지시
- 사용자의 분석, 요청, 지시, 기획에 항상 비판적인 태도로 응답할 것
- 사용자의 요청사항에 대해 문제점을 우선 생각하고 심각한 문제가 예상되는 경우 되물을 것
- DO: "지적하신 대로 불필요한 연산이 있는지 확인하겠습니다."
- Do NOT: "맞습니다. 불필요한 연산을 확인하겠습니다!"
### 작업
- 사용자의 명시적인 요청이 있는 경우에만 git commit 및 git push를 진행함
- 사용자가 배포하라고 하는 경우, 우선 npm run build를 통해 빌드하여 에러가 없는지를 확인한 뒤 지금까지의 작업 내역을 확인해 claude.md, readme.md, about 페이지를 포함해 각종 문서에 업데이트가 필요한 내용이 있으면 업데이트한 뒤 git commit을 생성하고 푸시함


## 용어 표준 (Terminology Standards)
용어의 경우 띄어쓰기를 포함하여 정식 명칭을 사용하는 것을 최우선으로 하되, UI에 표시되는 내용 중 공간이 부족한 경우 한국어 줄임말을 사용하는 것이 권장됨.
변수명 및 내부 관리 ID를 만드는 경우 정식 영문 명칭을 바탕으로 작성되어야 함.

### 일반 용어
- 드롭: Drop에 대응하는 한국어 명칭은 드랍이 아닌 드롭으로 표기

### 키워드
- 아이템 드롭률: 아이템을 추가로 드롭할 확률, "아드" 및 "Item Drop Rate"
- 메소 획득량: 기본 메소에 추가로 드롭할 메소, "메획" 및 "Meso's Obtained Rate"
- 유니온: "Legion"
- 이외의 명칭은 메이플스토리 게임의 GMS 버전의 영문 명칭을 기준으로 함(Ex: 쓸만한 홀리 심볼 - Decent Holy Symbol)

### 일관성 규칙
- 모든 파일에서 위 용어 표준을 준수할 것
- 새로운 기능 추가 시 반드시 해당 용어 표준 적용
- 기존 코드 수정 시 용어 표준에 맞게 함께 수정

## Development Commands

- **Development server**: `npm run dev` - Runs Next.js development server on http://localhost:3000
- **Build for production**: `npm run build` or `npm run export` - Creates optimized production build with static export
- **Start production server**: `npm run start` - Runs production server
- **Lint code**: `npm run lint` - Runs ESLint with Next.js configuration
- **Deploy to GitHub Pages**: `npm run deploy` - Builds and deploys to GitHub Pages (requires gh-pages setup)

## Development Best Practices

- `npm run dev`는 실행하지 말고, 커밋하고 푸시하기 이전에 빌드하여 테스트할 것.

### JSX 구조 관리 규칙

복잡한 JSX 구조에서 div의 여는 부분과 닫는 부분을 명확히 하기 위해 다음 주석 규칙을 따를 것:

- **여는 div 주석**: `{/* [섹션명] 시작 */}`
- **닫는 div 주석**: `{/* [섹션명] 끝 */}`
- **적용 기준**: 내부 코드가 5줄을 초과하는 복잡한 구조에만 적용 (텍스트만 있는 짧은 부분 제외)

#### Fragment 사용 규칙
JSX 주석이 div 태그 외부에 위치할 경우 Fragment(`<>`, `</>`)로 감싸야 하며, 이를 위해 대부분의 경우 Fragment로 감싸서 return하는 것이 권장됨.

더불어 jsx 컴포넌트 중 커스텀 컴포넌트가 아닌 기본 컴포넌트를 바로 사용하는 경우, 섹션의 시작과 끝에 주석을 기재함.

#### 실제 사용 예시
```jsx
{/* 메소 획득량 섹션 시작 */}
<div>
  {/* 상세 옵션 영역 시작 */}
  <div className="bg-gray-50">
    {/* 복잡한 내용이 5줄 이상인 경우에만 주석 */}
    <div>내용1</div>
    <div>내용2</div>
    <div>내용3</div>
    <div>내용4</div>
    <div>내용5</div>
    <div>내용6</div>
  </div>
  {/* 상세 옵션 영역 끝 */}
  
  <div>간단한 텍스트</div> {/* 짧은 부분은 주석 불필요 */}
</div>
{/* 메소 획득량 섹션 끝 */}
```

이 규칙은 특히 복잡한 중첩 구조에서 괄호 완결성을 확인할 때 유용함.

### GitHub Pages 배포 관련 주의사항

- **Internal Links**: 절대 경로(`href="/about"`) 대신 **반드시 Next.js `Link` 컴포넌트**를 사용해야 함
  - ❌ 잘못된 예: `<a href="/about">링크</a>`
  - ✅ 올바른 예: `<Link href="/about">링크</Link>`
- **커스텀 도메인**: www.maplecalc.com 커스텀 도메인 사용으로 basePath 불필요
- **기존 하드코딩된 링크 발견 시**: `<a>` 태그를 `Link` 컴포넌트로 즉시 교체할 것

## Architecture Overview

This is a Next.js 14 application using App Router for building calculator utilities. Key architectural patterns:

### Project Structure
- **App Router**: All pages are in `src/app/` using the Next.js App Router pattern
- **Component Organization**: 
  - `src/components/layout/` - Layout components like Navbar
  - `src/components/calculators/` - Calculator-specific components
  - `src/components/ui/` - Reusable UI components
- **Utilities**: `src/utils/` contains calculation logic separated from components
- **Static Export**: Configured for static hosting on GitHub Pages with `output: 'export'`

### Key Technical Details
- **TypeScript**: Strict mode enabled with path aliases (`@/*` maps to `./src/*`)
- **Styling**: Tailwind CSS for all styling
- **Icons**: Lucide React for icon components
- **Deployment**: Static export optimized for GitHub Pages with dynamic base path support via `BASE_PATH` environment variable
- **Korean Language**: The app is primarily in Korean (calculator utilities for Korean gaming community)

### Current Features
- 사냥 기댓값 계산기 (드롭률과 메소 획득량을 고려한 계산) - 기본 슬롯 5개
- 아드/메획 손익분기 계산기 (`src/utils/breakevenCalculations.ts`) - 기본 슬롯 5개
- 보스 물욕템 계산기 (보스별 물욕템 드롭률과 가격을 고려한 기댓값 계산) - 기본 슬롯 5개 (개발 중)
- **아지트 듀오 휴게실 경험치 최적화 계산기** (`src/utils/loungeCalculations.ts`) - 기본 슬롯 5개
  - Dynamic Programming 기반 9주간 최적 스킬 투자 전략 계산
  - 장기 휴식 최대 레벨 제한 기능 (시간 제약이 있는 유저를 위한 옵션)
  - 제한 설정 시 손실 비교 및 잠수 시간 정보 제공
  - 성능 최적화: 문자열 키에서 비트 연산 키로 변경, 캐싱 최적화
  - 2레벨 이상 업그레이드 및 선업글 장기 휴식 시각적 강조
  - ActionItem 기반 구조화된 텍스트 생성 시스템
- **한글날 훈장 행사 계산기** (`/calculators/hangeul-medal`) - 기본 슬롯 2개 (개발 중)
  - 상태 전이 확률 기반 동적 프로그래밍 알고리즘 적용
  - 한국어 퍼지 검색 및 초성 검색 지원 (kled-js 라이브러리 활용)
  - 겹자음 분해 검색 지원 (예: "ㅂㅅ" → "ㅄ" 매칭)
  - 키보드 네비게이션 완전 지원 (Enter, 화살표, Tab, Escape)
  - 확률 분포 백분위 계산 (50%, 90%, 99%)
  - 평균/중앙값 재설정 횟수 및 비용 계산
- **블로그 댓글 및 피드백 시스템**
  - GitHub Issues 기반 공개 댓글 시스템 (투명하고 안전한 소통)
  - Supabase 기반 좋아요 기능 (IP 중복 방지)
  - 비공개 의견 전달 시스템 (관리자에게만 전달, 작성자도 조회 불가)
  - 실시간 댓글 로딩 및 새로고침
  - 자동 Issue 생성 및 연결 관리
- AutoSlotManager 통합 슬롯 시스템 (저장/불러오기/내보내기/초기화)
- DismissibleBanner 공통 컴포넌트 (해제 가능한 배너/안내문)
- 설정 텍스트 내보내기/불러오기 기능 (Base64 인코딩된 텍스트로 설정 공유)
- 계산 결과 공유하기 기능 (이미지, 텍스트 형식 지원)
- Responsive design optimized for both mobile and desktop
- All calculations performed client-side for privacy
- OpenGraph 메타데이터 지원으로 소셜 미디어 공유 최적화
- 메이플스토리 폰트 동적 로딩 (JavaScript FontFace API 사용)
- 자동 사이트맵 생성 시스템

### Important Configuration
- **next.config.js**: Configured for static export with dynamic base path for GitHub Pages deployment
- **No Testing Framework**: The project doesn't include tests currently
- **ESLint**: Configured with Next.js and TypeScript rules

### SEO 및 Analytics 설정
- **Google AdSense**: 계정 메타 태그 추가됨 (광고 시스템 연동)
- **Google Search Console**: 검증 메타 태그 추가됨 (검색 엔진 최적화)
- **Google Analytics**: head 영역으로 이동하여 추적 코드 최적화
- **사이트맵**: 자동 생성 시스템으로 검색 엔진 크롤링 지원
- **OpenGraph**: 소셜 미디어 공유 시 미리보기 이미지 및 설명 제공

### 폰트 및 UI 개선사항
- **메이플스토리 폰트**: JavaScript FontFace API를 통한 동적 로딩으로 GitHub Pages 호환성 개선
- **폰트 로딩 최적화**: 폰트 파일 경로 문제 해결 및 안정적인 폰트 적용

### 블로그 댓글/피드백 시스템 관련 패키지
- `@supabase/supabase-js` - Supabase 클라이언트 (좋아요, 비공개 의견)
- `react-hot-toast` - 토스트 알림 시스템

### 블로그 댓글/피드백 시스템 구조
```
src/
├── lib/
│   ├── supabase.ts              # Supabase 클라이언트 및 타입 정의
│   └── github.ts                # GitHub Issues API 연동 헬퍼
├── hooks/
│   ├── useLikes.ts              # 좋아요 기능 로직
│   └── useGitHubComments.ts     # GitHub 댓글 로직
├── components/blog/
│   ├── LikeButton.tsx           # 좋아요 버튼 컴포넌트
│   ├── GitHubComments.tsx       # GitHub 댓글 표시 및 관리
│   ├── PrivateFeedback.tsx      # 비공개 의견/공개 댓글 작성 폼
│   └── CommentSection.tsx       # 통합 댓글 섹션 (탭 UI)
```

## 새 필드 추가/삭제 체크리스트 (AutoSlotManager 기준)

계산기에 새로운 state 필드를 추가하거나 기존 필드를 삭제할 때 반드시 확인해야 할 항목들:

### 새 필드 추가 시

#### 1. 타입 정의 (필요한 경우)
- [ ] 관련 인터페이스에 새 필드 추가 (선택적 필드는 `?` 사용)

#### 2. 컴포넌트 상태 관리
- [ ] `useState` 선언 및 초기값 설정
- [ ] 기본값 상수에 새 필드 추가 (예: `DEFAULT_VALUES`)

#### 3. AutoSlotManager 통합 (필수)
- [ ] **getCurrentData** 함수에 새 필드 포함
- [ ] **loadData** 함수에서 새 필드 상태 설정 (null 체크 포함)
- [ ] **resetAllData** 함수에 새 필드 초기화 추가

#### 4. 계산 함수 연동 (해당하는 경우)
- [ ] `calculate` 함수의 dependency 배열에 새 필드 추가
- [ ] 계산 함수 호출 시 새 필드를 파라미터로 전달

#### 5. UI 연동
- [ ] 필드 값을 표시하는 UI 컴포넌트 추가
- [ ] 필드 값을 변경하는 입력 컴포넌트의 `onChange` 핸들러 연결

### 기존 필드 삭제 시

#### 1. AutoSlotManager에서 제거
- [ ] **getCurrentData** 함수에서 해당 필드 제거
- [ ] **loadData** 함수에서 해당 필드 로드 로직 제거
- [ ] **resetAllData** 함수에서 해당 필드 초기화 제거

#### 2. 컴포넌트에서 제거
- [ ] `useState` 선언 제거
- [ ] 관련 기본값 상수에서 제거
- [ ] 계산 함수 dependency에서 제거
- [ ] UI 컴포넌트에서 제거

#### 3. 데이터 마이그레이션 고려
- [ ] 기존 localStorage 데이터에서 해당 필드가 제거되어도 문제없는지 확인
- [ ] 필요시 데이터 정리 로직 추가

### 예시 체크리스트 (새 필드: `newField` 추가)

**추가:**
```tsx
// 1. useState 추가
const [newField, setNewField] = useState(defaultValue)

// 2. 기본값에 추가
const DEFAULT_VALUES = {
  // ...기존 필드들
  newField: defaultValue
}

// 3. getCurrentData에 추가
const getCurrentData = () => ({
  // ...기존 필드들
  newField
})

// 4. loadData에 추가
const loadData = (data: any, onComplete?: () => void) => {
  // ...기존 로드 로직
  if (data.newField !== undefined) setNewField(data.newField)
  // ...
}

// 5. resetAllData에 추가
const resetAllData = () => {
  // ...기존 초기화
  setNewField(DEFAULT_VALUES.newField)
}
```

**삭제:**
```tsx
// getCurrentData, loadData, resetAllData에서 해당 필드 모두 제거
// useState 선언 제거
// UI 컴포넌트에서 관련 코드 제거
```

### 중요 주의사항
- **AutoSlotManager의 세 함수 모두 동기화 필수**: getCurrentData, loadData, resetAllData
- **localStorage 호환성**: 기존 저장된 데이터와 호환되도록 null 체크 필수
- **함수 참조 유지**: 필드 추가/삭제 후에도 인라인 함수가 아닌 함수 참조 사용 확인

## AutoSlotManager 통합 및 슬롯 시스템 주의사항

### AutoSlotManager 사용 시 필수 규칙

#### 1. 함수 참조 사용 필수
**❌ 잘못된 예시 (인라인 함수):**
```tsx
<AutoSlotManager
  getCurrentData={() => ({ field1, field2, field3 })}
  loadData={(data, onComplete) => { /* 로드 로직 */ }}
  onReset={() => { /* 초기화 로직 */ }}
/>
```

**✅ 올바른 예시 (함수 참조):**
```tsx
// 별도 함수로 정의
const getCurrentData = () => ({ field1, field2, field3 })
const loadData = (data: any, onComplete?: () => void) => { /* 로드 로직 */ }
const resetAllData = () => { /* 초기화 로직 */ }

<AutoSlotManager
  getCurrentData={getCurrentData}
  loadData={loadData}
  onReset={resetAllData}
/>
```

**이유**: 인라인 함수는 매 렌더링마다 새로운 객체가 생성되어 AutoSlotManager의 useEffect 의존성 체크가 정상 작동하지 않음.

#### 2. 데이터 소유권과 책임 분리
- **각 계산기는 자신의 데이터만 관리**: 다른 계산기의 데이터를 상태로 저장하지 말 것
- **실시간 데이터 읽기**: 다른 계산기 정보가 필요하면 실시간으로 localStorage에서 읽기
- **예시**: 손익분기 계산기가 기본 계산기 슬롯 이름을 자체 상태로 관리하면 안됨

#### 3. 데이터 마이그레이션
기존 데이터 형식 변경 시:
```tsx
const migrateOldSlotData = () => {
  for (let i = 1; i <= maxSlots; i++) {
    const oldKey = `old_format_slot_${i}`
    const newKey = `new_format_slot_${i}`
    
    // 새 키에 이미 데이터가 있으면 건너뛰기
    if (localStorage.getItem(newKey) !== null) continue
    
    const oldData = localStorage.getItem(oldKey)
    if (oldData) {
      localStorage.setItem(newKey, oldData)
      localStorage.removeItem(oldKey)
    }
  }
}
```

#### 4. 초기화 후 상태 처리
AutoSlotManager는 초기화 후 자동으로 변경사항 감지를 무시하도록 `justLoaded` 플래그를 설정함:
```tsx
const handleReset = () => {
  // ... 초기화 로직
  setJustLoaded(true) // 중요: 이 플래그가 설정되어야 함
}
```

### localStorage 키 명명 규칙
- **계산기별 접두사 사용**: `{calculatorId}_slot_{slotNumber}`
- **사냥 기댓값 계산기**: `basic_calculator_slot_1`, `basic_calculator_slot_2`, ..., `basic_calculator_slot_5`
- **손익분기 계산기**: `breakeven_calculator_slot_1`, `breakeven_calculator_slot_2`, ..., `breakeven_calculator_slot_5`

### 트러블슈팅 가이드

#### 문제: 초기화 후에도 "저장 필요" 표시가 나타남
**원인**: AutoSlotManager에 인라인 함수를 전달했거나, `justLoaded` 플래그가 제대로 설정되지 않음
**해결책**: 함수 참조 사용 및 초기화 시 `setJustLoaded(true)` 호출

#### 문제: 슬롯 이름이 잘못 표시되거나 사라짐  
**원인**: 다른 계산기의 데이터를 자체 상태로 관리하고 AutoSlotManager가 이를 덮어씀
**해결책**: 
1. 다른 계산기 데이터를 자체 상태에서 제거
2. 실시간으로 해당 계산기의 localStorage에서 직접 읽기

#### 문제: useEffect가 여러 번 호출됨
**원인**: React 의존성 배열에 매번 새로 생성되는 객체/함수가 포함됨
**해결책**: 
1. 인라인 함수 대신 함수 참조 사용
2. useCallback, useMemo 적절히 활용
3. 불필요한 의존성 제거

### 슬롯 시스템 아키텍처 원칙
1. **단일 책임 원칙**: 각 계산기는 자신의 데이터만 관리
2. **느슨한 결합**: 계산기 간 데이터 공유는 localStorage를 통해서만
3. **일관된 인터페이스**: 모든 계산기는 동일한 AutoSlotManager 인터페이스 사용
4. **상태 격리**: 한 계산기의 상태 변경이 다른 계산기에 영향주지 않음

## 설정 내보내기/불러오기 시스템

### 텍스트 기반 설정 공유
- **형식**: `CALC_SETTINGS_V1:` + Base64 인코딩된 JSON 데이터
- **포함 내용**: 계산기 타입, 슬롯 이름, 설정 데이터, 버전 정보, 내보낸 시간
- **계산기 간 호환성**: 각 계산기는 자신의 타입만 불러올 수 있음
- **사용 시나리오**: 커뮤니티 공유, 백업, 다른 브라우저/기기로 이동

### AutoSlotManager 통합 기능
- **저장**: 현재 슬롯에 설정 저장 (변경사항 감지로 버튼 상태 업데이트)
- **불러오기**: 탭 형태 모달 (다른 슬롯에서 / 텍스트에서)
- **내보내기**: 현재 설정을 Base64 텍스트로 변환, 클립보드 복사 지원
- **초기화**: 현재 슬롯을 기본값으로 초기화

### 슬롯 복사 시 안전장치
- **경고 모달**: 기존 데이터 덮어쓰기 확인
- **슬롯 이름 보존**: 복사 시 대상 슬롯의 이름은 유지
- **실시간 가용성 체크**: 데이터가 있는 슬롯만 복사 가능

## 기본값 연동 시스템

### 손익분기 계산기 기본값 자동 계산
- **잠재 제외 드롭률/메획**: 사냥 기댓값 계산기의 기본 설정에서 잠재능력(0줄) + 재획비(false)로 계산
- **동기화**: 사냥 기댓값 계산기의 기본값 변경 시 손익분기 계산기도 자동 동기화
- **계산 포함 요소**: 유니온, 어빌리티, 아티팩트, 홀리심볼, 탈라하트 심볼 등
- **계산 제외 요소**: 잠재능력, 재물 획득의 비약

### 예시 아이템 기본 제공
- **드랍하프**: 드롭 1줄, 메획 0줄, 구매가=판매가 20억 (구매가와 동일 체크)
- **드메얼장**: 드롭 1줄, 메획 1줄, 구매가 60억, 판매가 58억 (구매가와 동일 해제)

## 코딩 주의사항

### JavaScript/TypeScript null/undefined/0 체크 주의사항

**⚠️ 중요: falsy 값 체크 시 주의 필요**

JavaScript/TypeScript에서 `!value` 또는 `!obj.property` 체크는 다음 값들을 모두 `true`로 판단함:
- `false`
- `0` (숫자 0)
- `""` (빈 문자열)
- `null`
- `undefined`
- `NaN`

**문제 상황:**
```typescript
// ❌ 잘못된 예시 - 0일 때도 true가 됨
if (!currentInfo.pastState) break  // pastState가 0이면 잘못 break

// ❌ 잘못된 예시 - 0일 때도 true가 됨
if (!obj.index) return  // index가 0이면 잘못 return
```

**올바른 해결책:**
```typescript
// ✅ 올바른 예시 - undefined/null만 체크
if (currentInfo.pastState === undefined) break

// ✅ 또는 명시적으로 null/undefined 체크
if (currentInfo.pastState == null) break  // null과 undefined 모두 체크

// ✅ 숫자 0이 유효한 값인 경우
if (typeof obj.index !== 'number') return
```

**특히 주의해야 할 상황:**
1. **배열 인덱스**: `array[0]`은 유효한 값이지만 `!array[0]`은 `true`
2. **ID나 키 값**: `encodeState(0,0,0) = 0`처럼 0이 유효한 키값인 경우
3. **카운터나 레벨**: 0레벨, 0개 등이 유효한 값인 경우
4. **좌표나 위치**: x=0, y=0이 유효한 좌표인 경우

**권장사항:**
- 명시적 체크 사용: `=== undefined`, `=== null`, `== null`
- 타입 체크 활용: `typeof value === 'number'`
- 값의 범위 체크: `value >= 0`, `value > -1`
- eslint 규칙 활용으로 실수 방지

### Git 변경사항 롤백 주의사항

**⚠️ 중요: 커밋되지 않은 변경사항을 되돌릴 때 주의사항**

사용자가 "롤백하라"고 할 때는 **특정 변경사항만 되돌리라**는 의미이므로, 전체 커밋을 되돌리지 말 것.

**❌ 잘못된 방식:**
```bash
git checkout -- filename.ts  # 전체 파일을 되돌림 (사용자의 다른 변경사항도 사라짐)
git reset HEAD filename.ts   # unstage (요청하지 않은 작업)
```

**✅ 올바른 방식:**
```bash
# 1. 사용자가 수정한 내용을 파악
# 2. Edit 도구를 사용해서 특정 변경사항만 되돌리기
# 3. 사용자의 다른 변경사항은 그대로 유지
```

**권장 접근법:**
1. **변경사항 범위 확인**: 사용자가 어떤 부분의 롤백을 원하는지 정확히 파악
2. **선택적 되돌리기**: Edit 도구로 해당 부분만 수정
3. **다른 변경사항 보존**: 사용자가 수정한 다른 부분은 건드리지 않음
4. **확인 요청**: 불확실한 경우 사용자에게 구체적으로 어떤 부분을 되돌릴지 확인

**예시 상황:**
- 사용자: "야 롤백해"
- 의미: "내가 방금 한 특정 수정사항만 되돌려라"
- 실행: Edit 도구로 해당 변경사항만 원래대로 수정
- 주의: git 명령어로 전체 파일을 되돌리지 말 것