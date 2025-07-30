# Detail Requirements Questions

코드베이스를 분석한 결과를 바탕으로 한 구체적인 구현 관련 질문들입니다.

## Q6: BasicCalculator의 슬롯 데이터를 불러올 때 드랍률과 메소획득량만 가져와야 합니까?
**Default if unknown:** No (시간당 수익 계산에 필요한 모든 데이터를 가져와서 정확한 손익분기 계산)

## Q7: 아이템 구매 비용 입력 시 메소 단위는 BasicCalculator처럼 만 메소 단위로 통일해야 합니까?
**Default if unknown:** No (드랍/메획 아이템은 고가이므로 억 메소 단위 입력이 더 편리)

## Q8: 손익분기점 계산 결과를 시간 단위로만 표시하면 충분합니까?
**Default if unknown:** No (일/주/월 단위로도 변환하여 표시하면 사용자가 이해하기 쉬움)

## Q9: 비교 테이블에서 각 아이템의 증가량은 BasicCalculator의 상세 입력 모드처럼 복잡한 설정이 필요합니까?
**Default if unknown:** No (단순히 드랍률/메소획득량 증가 %만 입력받아 계산)

## Q10: 계산 결과를 /calculators/breakeven 경로에 새로운 페이지로 추가해야 합니까?
**Default if unknown:** Yes (CalculatorGrid의 패턴을 따라 독립적인 계산기 페이지로 구현)