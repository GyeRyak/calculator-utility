# Context Findings

## 코드베이스 분석 결과

### 1. 기존 계산기 구조
- **BasicCalculator**: 사냥 기댓값 계산기 (/src/components/calculators/BasicCalculator.tsx)
  - 복잡한 입력 시스템 (드랍률, 메소획득량 상세 설정)
  - 3개의 슬롯 시스템 구현
  - 쿠키를 통한 설정 저장/불러오기
  - 실시간 계산 없음 (계산 버튼 클릭 방식)

### 2. 슬롯 시스템
- 파일: /src/utils/cookies.ts
- 슬롯별 쿠키 키: `cookie_settings_slot_1`, `cookie_settings_slot_2`, `cookie_settings_slot_3`
- 각 슬롯에 다음 정보 저장:
  - 몬스터 레벨, 메소 보너스, 드랍률
  - 사냥 시간, 몬스터 수
  - 솔 에르다 조각 가격, 수수료율
  - 다양한 버프/아이템 설정

### 3. 계산 로직
- 파일: /src/utils/huntingExpectationCalculations.ts
- 핵심 함수:
  - `calculateMesoDropRate()`: 메소 드랍률 계산
  - `calculateSolErdaFragmentDropRate()`: 솔 에르다 조각 드랍률 계산
  - `calculateHuntingExpectation()`: 전체 기댓값 계산

### 4. UI 컴포넌트
- 재사용 가능한 컴포넌트: /src/components/ui/
  - NumberInput: 숫자 입력
  - RadioGroup/RadioGroupWithInput: 라디오 선택
  - Toggle/ToggleButton: 토글 버튼

### 5. 라우팅 구조
- 메인 계산기 그리드: /src/components/CalculatorGrid.tsx
- 새 계산기 추가 위치: calculatorCategories 배열에 추가
- 라우팅 패턴: `/calculators/[calculator-name]`

### 6. 시장 가격 정보 (웹 검색 결과)
- 드랍 2줄 장비: 최소 120억 메소
- 드랍+메획 장비: 약 70억 메소
- 반지(Half Earring) 드랍 1줄: 4.05억~5.5억 메소
- 드랍률 목표: 67% (메소 주머니 100% 드랍)
- 메소획득량 한계: 잠재능력으로 100%

### 7. 패턴 분석
- 계산기는 독립적인 컴포넌트로 구현
- 기본 계산기와 데이터 공유 필요
- 토글 방식의 실시간 업데이트는 현재 미구현 (추가 구현 필요)

## 구현 시 고려사항

1. **데이터 공유**
   - BasicCalculator의 슬롯 데이터 읽기
   - 드랍률, 메소획득량 정보 가져오기

2. **비교 기능**
   - 최대 3개 아이템 동시 비교
   - 드랍 1줄, 메획 1줄, 드/메, 쌍메, 쌍드

3. **손익분기 계산**
   - 아이템 구매 비용 입력
   - 시간당 수익 기반 회수 기간 계산
   - 다양한 시간 단위 표시 (시간, 일, 주, 월)

4. **UI/UX**
   - 기존 UI 컴포넌트 재사용
   - 실시간 업데이트 토글 기능
   - 결과 저장/불러오기