# Context Findings

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React hooks (useState, useEffect, useCallback, useMemo)
- **Deployment**: Static export for GitHub Pages

### Project Structure
```
src/
├── app/                     # Next.js App Router pages
│   ├── calculators/
│   │   ├── basic/          # 사냥 기댓값 계산기
│   │   ├── breakeven/      # 손익분기 계산기
│   │   └── page.tsx        # 계산기 목록 페이지
├── components/
│   ├── calculators/        # 계산기 컴포넌트
│   │   ├── BasicCalculator.tsx
│   │   └── BreakevenCalculator.tsx
│   ├── ui/                 # 재사용 UI 컴포넌트
│   │   ├── AutoSlotManager.tsx  # 슬롯 시스템 관리
│   │   ├── NumberInput.tsx
│   │   ├── ExportModal.tsx
│   │   └── ...
│   └── CalculatorGrid.tsx  # 계산기 목록 그리드
├── utils/
│   ├── defaults/           # 기본값 관리
│   ├── *Calculations.ts    # 계산 로직
│   └── exportUtils.ts      # 내보내기 유틸리티
└── contexts/
    └── NotificationContext.tsx
```

## Existing Patterns and Conventions

### 1. Calculator Pattern
각 계산기는 독립적인 페이지와 컴포넌트로 구성:
- **Page**: `/app/calculators/[name]/page.tsx`
- **Component**: `/components/calculators/[Name]Calculator.tsx`
- **Defaults**: `/utils/defaults/[name]Defaults.ts`
- **Calculations**: `/utils/[name]Calculations.ts`

### 2. AutoSlotManager Integration
모든 계산기가 공통으로 사용하는 슬롯 시스템:
- 5개 슬롯 기본 제공
- localStorage 기반 저장
- 키 형식: `{calculatorId}_slot_{slotNumber}`
- 함수 참조 사용 필수 (인라인 함수 금지)
- getCurrentData, loadData, onReset 인터페이스

### 3. Export System
계산기 결과 내보내기:
- Base64 인코딩된 JSON 형식
- 버전 관리: `CALC_SETTINGS_V1:` 프리픽스
- 계산기 타입별 호환성 체크
- 이미지/텍스트 형식 지원

### 4. UI Components
재사용 가능한 UI 컴포넌트:
- `NumberInput`: 숫자 입력 (포맷팅 지원)
- `RadioGroup`: 라디오 버튼 그룹
- `Toggle`: 토글 스위치
- `ExportModal`: 내보내기 모달
- `DropItemInput`: 드롭 아이템 입력

## Files to Create/Modify

### New Files to Create
1. `/app/calculators/boss-chase/page.tsx` - 보스 물욕템 계산기 페이지
2. `/components/calculators/BossChaseCalculator.tsx` - 메인 컴포넌트
3. `/utils/bossChaseCalculations.ts` - 계산 로직
4. `/utils/defaults/bossChaseDefaults.ts` - 기본값 정의
5. `/data/bossData.ts` - 보스 및 아이템 정의

### Files to Modify
1. `/components/CalculatorGrid.tsx` - 계산기 목록에 추가
2. `/utils/defaults/index.ts` - 기본값 export 추가
3. `/utils/exportUtils.ts` - 내보내기 인터페이스 추가

## Similar Features Analysis

### BasicCalculator (사냥 기댓값 계산기)
- 드롭 아이템 리스트 관리
- 드롭률/메소 계산 로직
- AutoSlotManager 통합
- 내보내기 기능

### BreakevenCalculator (손익분기 계산기)
- 다른 계산기 데이터 참조 (BasicCalculator)
- 아이템 리스트 관리 (추가/삭제)
- 복잡한 계산 로직
- localStorage에서 다른 계산기 데이터 읽기

## Technical Considerations

### 1. Data Structure for Boss/Items
```typescript
interface Boss {
  id: string
  name: string
  difficulties: BossDifficulty[]
}

interface BossDifficulty {
  id: string
  name: string // "하드", "익스트림", etc
  drops: ChaseItem[]
}

interface ChaseItem {
  id: string
  name: string
  defaultDropRate: number
  defaultPrice: number
  isDropAffected: 'normal' | 'log' | 'none'
}

interface CharacterBossEntry {
  characterName: string
  bossList: {
    bossId: string
    difficulty: string
    partySize: number // 1 = 솔로, N = N인 격파
  }[]
}
```

### 2. Integration Points
- AutoSlotManager: 캐릭터별 보스 리스트 저장
- 손익분기 계산기: localStorage에서 물욕템 데이터 읽기
- 내보내기: 설정 공유 기능

### 3. Preset System
- 캐릭터 프리셋 (예: "검밑솔")
- 보스 리스트 자동 설정
- 드롭률/가격 기본값 제공

## UI/UX Patterns

### 1. 캐릭터 리스트 관리
- 추가/삭제 버튼
- 드래그 앤 드롭 정렬 (선택사항)
- 캐릭터명 입력

### 2. 보스 선택
- 드롭다운 메뉴
- 난이도 선택
- 파티 설정 (솔로/파티)

### 3. 결과 표시
- 주간 기댓값 표시
- 캐릭터별 상세 내역
- 총 합계

## Performance Considerations
- 보스 데이터는 정적 파일로 관리
- 계산은 클라이언트 사이드에서 실행
- localStorage 접근 최소화

## Security Considerations
- 사용자 입력 검증
- XSS 방지 (React 기본 제공)
- localStorage 크기 제한 확인