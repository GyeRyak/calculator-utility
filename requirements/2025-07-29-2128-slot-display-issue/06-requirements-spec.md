# 요구사항 명세서

## 문제 정의
최초 페이지 로드 시 사용자가 슬롯 1의 이름을 변경했음에도 불구하고 기본값인 "슬롯 1"이 표시되는 문제

## 해결 방안 개요
1. **슬롯 전환 시 tempSlotName 업데이트**: 다른 슬롯에서 슬롯 1로 돌아올 때 저장된 실제 이름 표시
2. **미저장 상태 경고 시스템**: 슬롯 이름이나 값 변경 후 저장하지 않고 다른 슬롯으로 이동 시 경고

## 기능 요구사항

### 1. 슬롯 이름 표시 수정
- **위치**: `src/components/calculators/BasicCalculator.tsx:216` (loadSettings 함수)
- **동작**: 슬롯 로드 시 해당 슬롯의 저장된 이름을 tempSlotName에 설정
- **구현**: `setTempSlotName(slotNames[slotNumber])` 추가

### 2. 미저장 상태 감지 시스템
- **새로운 상태**: `hasUnsavedChanges` (boolean)
- **감지 대상**: 
  - 슬롯 이름 변경 (`tempSlotName` vs `slotNames[currentSlot]` 비교)
  - 계산기 값 변경 (현재 입력값 vs 마지막 저장된 값 비교)

### 3. 경고 표시 시스템
- **트리거**: 미저장 변경사항이 있는 상태에서 다른 슬롯 버튼 클릭
- **UI**: 경고 모달 또는 알림
- **옵션**: "저장 후 이동", "저장하지 않고 이동", "취소"

## 기술 요구사항

### 수정할 파일
- `src/components/calculators/BasicCalculator.tsx`

### 구현 세부사항

#### 1. loadSettings 함수 수정 (216라인)
```typescript
const loadSettings = (slotNumber: number = currentSlot) => {
  // 기존 로직...
  
  // 슬롯 이름 복원 추가
  setTempSlotName(slotNames[slotNumber])
  
  // 기존 로직...
}
```

#### 2. 미저장 상태 감지 로직
```typescript
const hasUnsavedChanges = useMemo(() => {
  // 슬롯 이름 변경 확인
  const nameChanged = tempSlotName !== slotNames[currentSlot]
  
  // 계산기 값 변경 확인 (저장된 설정과 현재 입력값 비교)
  const valuesChanged = /* 현재 입력값과 저장된 값 비교 로직 */
  
  return nameChanged || valuesChanged
}, [tempSlotName, slotNames, currentSlot, /* 기타 입력값들 */])
```

#### 3. 슬롯 전환 시 경고 시스템
- 슬롯 버튼 클릭 시 `hasUnsavedChanges` 확인
- 변경사항이 있으면 경고 표시 후 사용자 선택에 따라 동작

## 수용 기준
1. ✅ 슬롯 1에 저장된 커스텀 이름이 페이지 로드 시 올바르게 표시
2. ✅ 다른 슬롯에서 슬롯 1로 돌아올 때 저장된 이름 표시
3. ✅ 슬롯 이름 변경 후 미저장 상태에서 다른 슬롯 이동 시 경고
4. ✅ 계산기 값 변경 후 미저장 상태에서 다른 슬롯 이동 시 경고
5. ✅ 모바일과 데스크톱에서 모두 정상 동작

## 가정사항
- 쿠키 기반 저장 시스템 유지
- 기존 UI/UX 패턴 준수
- 성능에 큰 영향 없이 구현