# 컨텍스트 분석 결과

## 문제 원인 분석

### 현재 코드 동작 (BasicCalculator.tsx:340-378)
1. **초기 로드 시 (useEffect)**:
   - `setTempSlotName(newSlotNames[1] || '슬롯 1')` - 슬롯 1의 저장된 이름 또는 기본값 설정
   - `setTimeout(() => loadSettings(1), 0)` - 슬롯 1 설정 로드

2. **슬롯 이름 표시 로직 (752라인, 756라인)**:
   ```tsx
   {slot === currentSlot && tempSlotName ? tempSlotName : slotNames[slot]}
   ```

### 문제점 식별
1. **초기 로드 시**: `tempSlotName`이 슬롯 1의 올바른 이름으로 설정됨
2. **하지만**: 사용자가 다른 슬롯으로 전환 후 슬롯 1로 돌아올 때는 `tempSlotName`이 업데이트되지 않음
3. **결과**: 슬롯 1에 저장된 커스텀 이름이 있어도 기본 "슬롯 1"이 표시됨

## 관련 파일들

### 주요 파일
- `/src/components/calculators/BasicCalculator.tsx` - 메인 컴포넌트 (슬롯 UI 및 로직)
- `/src/utils/cookies.ts` - 쿠키 저장/로드 함수들

### 핵심 함수들
- `loadSettings(slotNumber)` - 슬롯 설정 로드 (216라인)
- `saveCalculatorSettings()` - 쿠키에 설정 저장 (cookies.ts:152)
- `loadCalculatorSettings()` - 쿠키에서 설정 로드 (cookies.ts:178)

## 기술적 제약사항
- React 상태 관리를 통한 슬롯 이름 관리
- 쿠키 기반 데이터 저장 (기능성 쿠키 동의 필요)
- `tempSlotName`과 `slotNames` 두 개의 상태로 슬롯 이름 관리

## 추가 요구사항
- 슬롯 이름 변경 시 저장되지 않았다는 경고 표시 기능 추가