// 사냥 기댓값 계산 유틸리티 함수들
import { calculateLevelPenalty } from './levelPenalty'

// 솔 에르다 조각 고정 ID (특별 처리용)
export const SOL_ERDA_FRAGMENT_ID = '__sol_erda_fragment__'

/**
 * 메소 드롭률 계산
 * @param dropRate 아이템 드롭률 (%)
 * @returns 메소 드롭률 (0-1 사이의 값)
 */
export function calculateMesoDropRate(dropRate: number): number {
  return Math.min(1, (3/5) * (1 + dropRate / 100))
}


/**
 * 메소 드롭량 계산 (1마리당)
 * @param monsterLevel 몬스터 레벨
 * @param mesoBonus 메획 (%)
 * @param levelPenalty 레벨 차이에 따른 패널티 (0-1)
 * @returns 1마리당 메소 드롭량
 */
export function calculateMesoPerDrop(monsterLevel: number, mesoBonus: number, levelPenalty: number = 1): number {
  return monsterLevel * 7.5 * (1 + mesoBonus / 100) * levelPenalty
}

/**
 * 메소 계산의 상세 정보 반환
 * @param monsterLevel 몬스터 레벨
 * @param mesoBonus 메획 (%)
 * @param wealthAcquisitionPotion Wealth Acquisition Potion 사용 여부
 * @param levelPenalty 레벨 차이에 따른 패널티 (0-1)
 * @returns 메소 계산 상세 정보
 */
export function getMesoCalculationDetails(monsterLevel: number, mesoBonus: number, wealthAcquisitionPotion: boolean, levelPenalty: number = 1) {
  const baseMeso = monsterLevel * 7.5 // 몬스터 드롭 기본 메소
  const mesoMultiplier = 1 + mesoBonus / 100 // 일반 메획 배수
  const wealthPotionMultiplier = wealthAcquisitionPotion ? 1.2 : 1 // 재획비 배수
  
  return {
    baseMeso,
    mesoMultiplier,
    wealthPotionMultiplier,
    levelPenalty,
    totalMeso: baseMeso * mesoMultiplier * wealthPotionMultiplier * levelPenalty
  }
}


/**
 * 드롭 아이템들의 기댓값 계산
 * @param totalMonsters 총 몬스터 수
 * @param dropRate 아이템 드롭률 보너스 (%)
 * @param feeRate 수수료율 (%)
 * @param normalDropItems 일반 드롭률 아이템들
 * @param logDropItems 로그 드롭률 아이템들
 * @returns 드롭 아이템 계산 결과
 */
export function calculateDropItems(
  totalMonsters: number,
  dropRate: number,
  feeRate: number,
  normalDropItems: DropItem[] = [],
  logDropItems: DropItem[] = []
): { dropItems: DropItemResult[], totalValue: number } {
  const dropItems: DropItemResult[] = []
  let totalValue = 0

  // 일반 드롭 아이템들 계산
  for (const item of normalDropItems) {
    // 일반 드롭률: 드롭률 증가 효과를 그대로 받음
    const dropMultiplier = 1 + dropRate / 100
    const actualDropRate = (item.dropRate || 0) * dropMultiplier / 100
    const expectedCount = totalMonsters * actualDropRate
    const actualFeeRate = item.directUse ? 0 : feeRate
    const expectedValue = expectedCount * item.price * 10000 * (1 - actualFeeRate / 100)
    
    dropItems.push({
      item: { ...item, type: 'normal' },
      expectedCount,
      expectedValue,
      actualDropRate: actualDropRate * 100, // %로 변환
      dropMultiplier
    })
    
    totalValue += expectedValue
  }

  // 로그 드롭 아이템들 계산
  for (const item of logDropItems) {
    // 로그 드롭률: 솔 에르다 조각과 동일한 방식
    const dropMultiplier = 1 + Math.log(1 + dropRate / 100)
    const actualDropRate = ((item.dropRate || 0) / 100) * dropMultiplier
    const expectedCount = totalMonsters * actualDropRate
    const actualFeeRate = item.directUse ? 0 : feeRate
    const expectedValue = expectedCount * item.price * 10000 * (1 - actualFeeRate / 100)
    
    dropItems.push({
      item: { ...item, type: 'log' },
      expectedCount,
      expectedValue,
      actualDropRate: actualDropRate * 100, // %로 변환
      dropMultiplier
    })
    
    totalValue += expectedValue
  }

  return { dropItems, totalValue }
}

/**
 * 드롭 아이템 인터페이스
 */
export interface DropItem {
  id: string
  name: string
  price: number // 만 메소 단위
  dropRate?: number // 드롭률 (%)
  directUse?: boolean // 직접 사용 여부
  type?: 'normal' | 'log' // 드롭률 타입 (기존 호환성을 위해 선택적)
}

/**
 * 드롭 아이템 결과 인터페이스
 */
export interface DropItemResult {
  item: DropItem
  expectedCount: number
  expectedValue: number
  actualDropRate: number // 실제 드롭률 (드롭률 증가 효과 적용)
  dropMultiplier: number // 드롭률 배수 (일반: 1 + dropRate/100, 로그: 1 + log(1 + dropRate/100))
}

/**
 * 사냥 기댓값 계산 매개변수
 * @param params 계산에 필요한 매개변수
 * @returns 사냥 기댓값 계산 결과
 */
export interface HuntingExpectationParams {
  monsterLevel: number
  totalMonsters: number
  mesoBonus: number
  dropRate: number
  feeRate: number // %
  spottingSmallChangeBonus?: number // Spotting Small Change 추가 메소 (기본 0)
  characterLevel?: number // 캐릭터 레벨 (레벨 패널티 계산용)
  normalDropItems?: DropItem[] // 일반 드롭률 아이템 리스트
  logDropItems?: DropItem[] // 로그 드롭률 아이템 리스트
}

export interface HuntingExpectationResult {
  // 메소 관련
  mesoDropRate: number // %
  mesoPerDrop: number
  totalMeso: number
  
  // 드롭 아이템 관련
  dropItems: DropItemResult[]
  totalDropItemValue: number
  
  // 총합
  totalIncome: number
}

export function calculateHuntingExpectation(params: HuntingExpectationParams): HuntingExpectationResult {
  const {
    monsterLevel,
    totalMonsters,
    mesoBonus,
    dropRate,
    feeRate,
    spottingSmallChangeBonus = 0,
    characterLevel,
    normalDropItems = [],
    logDropItems = []
  } = params

  // 레벨 패널티 계산
  const levelPenalty = characterLevel ? calculateLevelPenalty(characterLevel, monsterLevel) : 1

  // 메소 계산
  const mesoDropRate = calculateMesoDropRate(dropRate)
  const baseMesoPerDrop = calculateMesoPerDrop(monsterLevel, mesoBonus, levelPenalty)
  // Spotting Small Change: 메획 적용 후 돈주머니당 추가 메소
  const mesoPerDrop = baseMesoPerDrop + spottingSmallChangeBonus
  const totalMeso = Math.floor(totalMonsters * mesoDropRate * mesoPerDrop)

  // 드롭 아이템 계산
  const { dropItems, totalValue: totalDropItemValue } = calculateDropItems(
    totalMonsters,
    dropRate,
    feeRate,
    normalDropItems,
    logDropItems
  )

  // 총 수익
  const totalIncome = totalMeso + totalDropItemValue

  return {
    mesoDropRate: mesoDropRate * 100, // %로 변환
    mesoPerDrop,
    totalMeso,
    dropItems,
    totalDropItemValue,
    totalIncome
  }
} 