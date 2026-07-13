// 사냥 기댓값 계산 유틸리티 함수들
import { calculateLevelPenalty } from './levelPenalty'
import { getAverageMesoDropByLevel } from './mesoDropCalculation'

// 솔 에르다 조각 고정 ID (특별 처리용)
export const SOL_ERDA_FRAGMENT_ID = '__sol_erda_fragment__'
export const BASE_DROP_RATE_BONUS = 24
export const NORMAL_DROP_RATE_CONSTANT = 100
export const DEFAULT_SPECIAL_DROP_RATE_CONSTANT = 50

export function normalizeDropRateConstant(
  dropRateConstant: number,
  fallback: number = DEFAULT_SPECIAL_DROP_RATE_CONSTANT
): number {
  if (!Number.isFinite(dropRateConstant)) return fallback
  return Math.min(100, Math.max(0, dropRateConstant))
}

export function calculateEffectiveDropRateBonus(
  displayedDropRate: number,
  dropRateConstant: number = NORMAL_DROP_RATE_CONSTANT
): number {
  const normalizedConstant = normalizeDropRateConstant(dropRateConstant)
  return displayedDropRate * (normalizedConstant / 100) + BASE_DROP_RATE_BONUS
}

export function calculateDropMultiplier(
  displayedDropRate: number,
  dropRateConstant: number = NORMAL_DROP_RATE_CONSTANT
): number {
  return 1 + calculateEffectiveDropRateBonus(displayedDropRate, dropRateConstant) / 100
}

/**
 * 메소 드롭률 계산
 * @param dropRate 아이템 드롭률 (%)
 * @returns 메소 드롭률 (0-1 사이의 값)
 */
export function calculateMesoDropRate(dropRate: number): number {
  return Math.min(1, (3/5) * calculateDropMultiplier(dropRate, NORMAL_DROP_RATE_CONSTANT))
}


/**
 * 메소 드롭량 계산 (1마리당)
 * @param monsterLevel 몬스터 레벨
 * @param mesoBonus 메획 (%)
 * @param levelPenalty 레벨 차이에 따른 패널티 (0-1)
 * @returns 1마리당 메소 드롭량
 */
export function calculateMesoPerDrop(monsterLevel: number, mesoBonus: number, levelPenalty: number = 1): number {
  return getAverageMesoDropByLevel(monsterLevel) * (1 + mesoBonus / 100) * levelPenalty
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
  const baseMeso = getAverageMesoDropByLevel(monsterLevel) // 몬스터 드롭 기본 메소
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
 * @param logDropItems 특수 드롭률 아이템들 (기존 저장 키 호환을 위해 이름 유지)
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
    const dropMultiplier = calculateDropMultiplier(dropRate, NORMAL_DROP_RATE_CONSTANT)
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

  // 아이템별 드롭 상수를 사용하는 특수 드롭 아이템 계산
  for (const item of logDropItems) {
    const dropMultiplier = calculateDropMultiplier(
      dropRate,
      item.dropRateConstant ?? DEFAULT_SPECIAL_DROP_RATE_CONSTANT
    )
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
  dropRateConstant?: number // 특수 아이템에 적용되는 아이템별 드롭 상수
}

/**
 * 드롭 아이템 결과 인터페이스
 */
export interface DropItemResult {
  item: DropItem
  expectedCount: number
  expectedValue: number
  actualDropRate: number // 실제 드롭률 (드롭률 증가 효과 적용)
  dropMultiplier: number // 1 + (표기 드롭률 × 드롭 상수/100 + 24) / 100
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
  logDropItems?: DropItem[] // 특수 드롭률 아이템 리스트 (기존 저장 키 호환)
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

/**
 * 일반 드롭 아이템의 드롭률 배수 계산
 * @param dropRate 아이템 드롭률 증가 (%)
 * @returns 드롭률 배수
 */
export function calculateNormalDropMultiplier(dropRate: number): number {
  return calculateDropMultiplier(dropRate, NORMAL_DROP_RATE_CONSTANT)
}

/**
 * 기존 로그 드롭 API 호환용 특수 드롭률 배수 계산
 * @param dropRate 아이템 드롭률 증가 (%)
 * @returns 기본 특수 드롭 상수(50%)가 적용된 드롭률 배수
 */
export function calculateLogDropMultiplier(dropRate: number): number {
  return calculateDropMultiplier(dropRate, DEFAULT_SPECIAL_DROP_RATE_CONSTANT)
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
  const mesoPerDrop = baseMesoPerDrop + (baseMesoPerDrop > 0 ? spottingSmallChangeBonus : 0) // 메소가 드랍되어야 잔돈이 눈에 띄네 보너스 적용
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
