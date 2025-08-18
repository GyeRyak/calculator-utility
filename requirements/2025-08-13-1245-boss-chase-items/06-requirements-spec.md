# Requirements Specification: Boss Chase Items Calculator

## 1. Problem Statement

사용자들은 보스 몬스터에서 드롭되는 물욕템(chase items)의 주간 기댓값을 계산하고자 한다. 각 보스는 다양한 난이도와 드롭 아이템을 가지며, 사용자는 여러 캐릭터로 주간 보스를 격파한다. 이 계산기는 캐릭터별 보스 격파 리스트를 기반으로 물욕템 드롭의 주간 기댓값을 계산하고, 추후 손익분기 계산에 활용할 수 있도록 한다.

## 2. Solution Overview

독립적인 "보스 물욕템 계산기"를 개발하여:
- 사전 정의된 보스/아이템 데이터 기반 계산
- 캐릭터별 주간 보스 격파 리스트 관리
- 드롭률과 아이템 가치를 고려한 주간 기댓값 계산
- AutoSlotManager를 통한 설정 저장/불러오기
- 손익분기 계산기와의 데이터 연동 준비

## 3. Functional Requirements

### 3.1 보스 데이터 관리
- **FR-1**: 시스템은 사전 정의된 보스 목록을 제공해야 한다
  - 보스: 스우, 데미안, 가디언 엔젤 슬라임 등
  - 난이도: 하드/익스트림, 노말/카오스 등
  
- **FR-2**: 각 보스/난이도별 드롭 아이템 세트는 고정되어야 한다
  - 예: 하드 스우 - 홍옥의 보스 반지 상자, 루즈 컨트롤 머신 마크
  - 예: 익스트림 스우 - 백옥의 보스 반지 상자, 루즈 컨트롤 머신 마크, 컴플리트 언더 컨트롤

### 3.2 캐릭터 관리
- **FR-3**: 사용자는 캐릭터를 추가/삭제할 수 있어야 한다
- **FR-4**: 각 캐릭터별로 주간 격파 보스 리스트를 설정할 수 있어야 한다
  - 보스 선택 (드롭다운)
  - 난이도 선택
  - 격파 인원수 설정 (1인 = 솔로, N인 = 파티)
  
- **FR-5**: 캐릭터 프리셋을 제공해야 한다
  - 예: "검밑솔" 선택 시 특정 보스 세팅 자동 적용
  - 프리셋 선택 시 기존 캐릭터 리스트 완전 교체

### 3.3 드롭률 및 가치 설정
- **FR-6**: 각 아이템의 드롭률을 사용자가 수정할 수 있어야 한다
  - 기본값 제공 (예: 반지 상자 2%)
  - 백분율(%) 입력, 내부 소수점 변환
  
- **FR-7**: 각 아이템의 가치(메소)를 사용자가 설정할 수 있어야 한다
  - 기본값 제공
  - 숫자 포맷팅 지원

### 3.4 계산 기능
- **FR-8**: 시스템은 주간 기댓값을 계산해야 한다
  - 캐릭터별 기댓값
  - 전체 합계
  - 파티 격파 시 N분배 반영
  
- **FR-9**: 드롭률 증가 효과 적용 옵션
  - 1차 구현: normal 타입 아이템만 (드롭률 증가 적용)
  - isDropAffected 속성 준비 (normal/log/none)

### 3.5 데이터 저장/불러오기
- **FR-10**: AutoSlotManager를 통한 슬롯 시스템 지원
  - 5개 슬롯 기본 제공
  - 저장/불러오기/초기화
  - 키 형식: `boss_chase_calculator_slot_{number}`
  
- **FR-11**: 설정 내보내기/불러오기
  - Base64 인코딩된 텍스트 형식
  - 클립보드 복사 지원

### 3.6 UI/UX 요구사항
- **FR-12**: 반응형 디자인 (모바일/데스크톱)
- **FR-13**: 계산기 그리드에 추가
- **FR-14**: 주간 기댓값 표시
  - 캐릭터별 상세 내역
  - 아이템별 기댓값
  - 총 합계

## 4. Technical Requirements

### 4.1 파일 구조
```
src/
├── app/calculators/boss-chase/
│   └── page.tsx                    # 페이지 컴포넌트
├── components/calculators/
│   └── BossChaseCalculator.tsx     # 메인 계산기 컴포넌트
├── data/
│   ├── bossData.ts                 # 보스 정의
│   ├── chaseItems.ts              # 아이템 정의
│   └── dropTables.ts              # 드롭 테이블
├── utils/
│   ├── bossChaseCalculations.ts   # 계산 로직
│   └── defaults/
│       └── bossChaseDefaults.ts   # 기본값
```

### 4.2 데이터 구조
```typescript
// 보스 정의
interface Boss {
  id: string
  name: string
  difficulties: BossDifficulty[]
}

interface BossDifficulty {
  id: string
  name: string // "하드", "익스트림", etc
  dropTable: string[] // 아이템 ID 배열
}

// 아이템 정의
interface ChaseItem {
  id: string
  name: string
  defaultDropRate: number // 0.02 = 2%
  defaultPrice: number
  isDropAffected: 'normal' | 'log' | 'none'
}

// 캐릭터 설정
interface CharacterConfig {
  id: string
  name: string
  bossList: BossEntry[]
}

interface BossEntry {
  bossId: string
  difficulty: string
  partySize: number // 1 = 솔로, N = N인 파티
}

// 계산 결과
interface CalculationResult {
  characterResults: CharacterResult[]
  weeklyTotal: number
}

interface CharacterResult {
  characterName: string
  itemExpectations: ItemExpectation[]
  total: number
}
```

### 4.3 컴포넌트 구조
- `BossChaseCalculator`: 메인 컴포넌트
- `CharacterList`: 캐릭터 관리 UI
- `BossSelector`: 보스 선택 드롭다운
- `DropRateSettings`: 드롭률 설정 UI
- `ResultDisplay`: 결과 표시 UI

### 4.4 AutoSlotManager 통합
```typescript
const getCurrentData = () => ({
  characters,
  dropRates,
  itemPrices,
  // ... 기타 설정
})

const loadData = (data: any, onComplete?: () => void) => {
  if (data.characters) setCharacters(data.characters)
  if (data.dropRates) setDropRates(data.dropRates)
  if (data.itemPrices) setItemPrices(data.itemPrices)
  // ...
  onComplete?.()
}

const resetAllData = () => {
  setCharacters(DEFAULT_VALUES.characters)
  setDropRates(DEFAULT_VALUES.dropRates)
  setItemPrices(DEFAULT_VALUES.itemPrices)
  // ...
}
```

## 5. Implementation Hints

### 5.1 기존 패턴 활용
- `BasicCalculator.tsx` 참고: AutoSlotManager 통합
- `BreakevenCalculator.tsx` 참고: 아이템 리스트 관리
- `NumberInput` 컴포넌트: 숫자 입력 및 포맷팅
- `ExportModal`: 내보내기 기능

### 5.2 계산기 그리드 추가
```typescript
// CalculatorGrid.tsx 수정
{
  id: 'boss-chase',
  title: '보스 물욕템 계산기',
  description: '보스 몬스터 물욕템 드롭의 주간 기댓값 계산',
  icon: Trophy, // or appropriate icon
  href: '/calculators/boss-chase',
  color: 'bg-purple-500',
  available: true
}
```

### 5.3 손익분기 계산기 연동 준비
- localStorage 키: `boss_chase_calculator_slot_{number}`
- 데이터 구조를 손익분기 계산기에서 읽기 쉽게 설계
- 주간 기댓값을 시간당으로 변환 가능하도록 준비

## 6. Acceptance Criteria

### AC-1: 보스 데이터
- [ ] 최소 3개 보스 정의 (스우, 데미안, 가디언 엔젤 슬라임)
- [ ] 각 보스별 난이도 및 드롭 테이블 구현
- [ ] 기본 드롭률 및 가격 설정

### AC-2: 캐릭터 관리
- [ ] 캐릭터 추가/삭제 기능
- [ ] 보스 리스트 설정 (드롭다운)
- [ ] 파티 인원수 설정
- [ ] 최소 1개 프리셋 제공

### AC-3: 계산 기능
- [ ] 주간 기댓값 정확한 계산
- [ ] 파티 분배 반영
- [ ] 드롭률 증가 효과 적용 (normal 타입)

### AC-4: 데이터 관리
- [ ] AutoSlotManager 통합
- [ ] 5개 슬롯 저장/불러오기
- [ ] 텍스트 내보내기/불러오기

### AC-5: UI/UX
- [ ] 계산기 그리드에 표시
- [ ] 반응형 디자인
- [ ] 결과 명확한 표시

## 7. Assumptions

- 드롭률 증가 효과를 받지 않는 아이템은 1차 구현에서 제외
- 보스 격파는 주 1회로 고정
- 모든 계산은 클라이언트 사이드에서 수행
- 보스/아이템 데이터는 하드코딩 (사용자 수정 불가)

## 8. Future Enhancements

- 드롭률 증가 효과를 받지 않는 아이템 지원
- 월간/연간 기댓값 표시
- 보스별 격파 횟수 커스터마이징
- 손익분기 계산기와 실시간 연동
- 드래그 앤 드롭으로 캐릭터 순서 변경