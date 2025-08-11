# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language Preference
- Use Korean for all responses and code comments
- Keep technical terms and code keywords in English
- 한국어로 답변 및 코드 주석 작성 (기술 용어는 영어 유지)

## Interaction Guidelines
- 사용자의 쿼리를 긍정하면서 시작하지 말 것 ("맞습니다." 등으로 시작 금지)
- 분석 결과가 맞다면 논거를 대면서 타당성을 제시할 것

## 용어 표준 (Terminology Standards)

### 한국어 용어
- **아이템 드롭률**: 전체 명칭, 줄임말은 "아드" (Item Drop Rate)
- **메소 획득량**: 전체 명칭, 줄임말은 "메획" (Meso's Obtained Rate)
- **유니온**: 한국어 명칭 유지 (영문: Legion)
- **드롭**: "드랍" 대신 "드롭" 사용 (일관성 유지)

### 영문 용어
- **Item Drop Rate**: 아이템 드롭률 영문 표기
- **Meso's Obtained Rate**: 메소 획득량 영문 표기
- **Legion**: 유니온 시스템의 영문 표기 (Union ❌)
- **Decent Holy Symbol**: 쓸만한 홀리 심볼 영문 표기

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
JSX 주석이 div 태그 외부에 위치할 경우 Fragment(`<>`, `</>`)로 감싸야 함:

- **잘못된 예시**:
```jsx
return (
  {/* 주석이 div 밖에 있음 */}
  <div>내용</div>
  {/* 이것도 div 밖에 있음 */}
)
```

- **올바른 예시**:
```jsx
return (
  <>
    {/* 주석이 Fragment 안에 있음 */}
    <div>내용</div>
    {/* 이것도 Fragment 안에 있음 */}
  </>
)
```

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
- **basePath 호환성**: GitHub Pages는 `/calculator-utility` basePath를 사용하므로 Next.js Link가 필수
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
- 아드/메획 손익분기 계산기 (`src/utils/breakevenCalculations.ts`)
- 사냥 기댓값 계산기 (드롭률과 메소 획득량을 고려한 계산)
- Responsive design optimized for both mobile and desktop
- All calculations performed client-side for privacy

### Important Configuration
- **next.config.js**: Configured for static export with dynamic base path for GitHub Pages deployment
- **No Testing Framework**: The project doesn't include tests currently
- **ESLint**: Configured with Next.js and TypeScript rules

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
- **기본 계산기**: `basic_calculator_slot_1`, `basic_calculator_slot_2`, etc.
- **손익분기 계산기**: `breakeven_calculator_slot_1`, `breakeven_calculator_slot_2`, etc.

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