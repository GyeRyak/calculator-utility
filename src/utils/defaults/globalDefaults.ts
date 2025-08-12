// 전역에서 사용하는 공통 기본값들
import { calculateDropItems } from '../huntingExpectationCalculations'

export const GLOBAL_DEFAULTS = {
  // 레벨 관련
  characterLevel: 275,
  monsterLevel: 275,
  
  // 경제 관련
  feeRate: 3, // 경매장 수수료 (%)
  breakevenFeeRate: 3 as 3 | 5, // 손익분기 계산기 기본 경매장 수수료
  
  // 시간 관련
  huntTime: 0.125, // 기본 사냥 시간 (분)
  monsterCount: 39, // 기본 몬스터 수
  
  // 계산된 값들
  get monstersPerMinute() {
    return this.monsterCount / this.huntTime // 312 마리/분
  },
  get monstersPerHour() {
    return Math.round(this.monstersPerMinute * 60) // 18720 마리/시간
  },
  get monstersPerSixMinutes() {
    return Math.round(this.monstersPerMinute * 6) // 1872 마리/6분
  },
  
  // 공통 설정값들
  wealthAcquisitionPotion: true, // 재물 획득의 비약 기본 사용
  realTimeCalculation: true, // 실시간 계산 기본 활성화
  materialsPerDay: 4, // 하루 사냥 소재 수 기본값
  mesoLimitEnabled: false, // 메소 제한 기본 비활성화
  mesoLimitHours: 2, // 메소 제한 시간 기본값
  
  // 잠재능력 기본값
  currentDropFromPotential: 0, // 현재 잠재능력 아이템 드롭률
  currentMesoFromPotential: 0, // 현재 잠재능력 메소획득량
  
  // 기댓값 계산 (드롭 아이템 기본값을 바탕으로 계산)
  get normalDropExpectation() {
    // 순환 참조를 피하기 위해 여기서 직접 드롭 아이템들을 정의
    const normalDropItems = [
      { id: 'reindeer-milk', name: '순록의 우유', price: 0.275, dropRate: 0.565, directUse: true, type: 'normal' as const },
      { id: 'twilight-dew', name: '황혼의 이슬', price: 0.51, dropRate: 0.565, directUse: true, type: 'normal' as const },
      { id: 'spell-trace', name: '주문의 흔적', price: 0.2, dropRate: 1.2, directUse: false, type: 'normal' as const }
    ]
    
    const { dropItems } = calculateDropItems(
      100, // 100마리 기준
      0,   // 드롭률 0%
      this.feeRate,
      normalDropItems,
      []
    )
    
    return Math.floor(dropItems.reduce((sum, result) => sum + result.expectedValue, 0))
  },
  
  get logDropExpectation() {
    // 순환 참조를 피하기 위해 여기서 직접 드롭 아이템들을 정의
    const logDropItems = [
      { id: '__sol_erda_fragment__', name: '솔 에르다 조각', price: 600, dropRate: 0.0425, directUse: false, type: 'log' as const },
      { id: 'core-gemstone', name: '코어 젬스톤', price: 12, dropRate: 0.028, directUse: false, type: 'log' as const },
      { id: 'symbol', name: '심볼', price: 60, dropRate: 0.00092, directUse: false, type: 'log' as const }
    ]
    
    const { dropItems } = calculateDropItems(
      100, // 100마리 기준
      0,   // 드롭률 0%
      this.feeRate,
      [],
      logDropItems
    )
    
    return Math.floor(dropItems.reduce((sum, result) => sum + result.expectedValue, 0))
  }
}