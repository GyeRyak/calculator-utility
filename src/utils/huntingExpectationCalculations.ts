// 사냥 기댓값 계산 유틸리티 함수들

/**
 * 메소 드랍률 계산
 * @param dropRate 아이템 드랍률 (%)
 * @returns 메소 드랍률 (0-1 사이의 값)
 */
export function calculateMesoDropRate(dropRate: number): number {
  return Math.min(1, (3/5) * (1 + dropRate / 100))
}

/**
 * 솔 에르다 조각 드랍률 계산
 * @param dropRate 아이템 드랍률 (%)
 * @returns 솔 에르다 조각 드랍률 (0-1 사이의 값)
 */
export function calculateSolErdaFragmentDropRate(dropRate: number): number {
  const baseSolErdaRate = 0.000425 // 0.0425%
  return baseSolErdaRate * (1 + Math.log(1 + dropRate / 100))
}

/**
 * 메소 드랍량 계산 (1마리당)
 * @param monsterLevel 몬스터 레벨
 * @param mesoBonus 메소 획득량 (%)
 * @returns 1마리당 메소 드랍량
 */
export function calculateMesoPerDrop(monsterLevel: number, mesoBonus: number): number {
  return monsterLevel * 7.5 * (1 + mesoBonus / 100)
}

/**
 * 메소 계산의 상세 정보 반환
 * @param monsterLevel 몬스터 레벨
 * @param mesoBonus 메소 획득량 (%)
 * @param wealthAcquisitionPotion Wealth Acquisition Potion 사용 여부
 * @returns 메소 계산 상세 정보
 */
export function getMesoCalculationDetails(monsterLevel: number, mesoBonus: number, wealthAcquisitionPotion: boolean) {
  const baseMeso = monsterLevel * 7.5 // 몬스터 드랍 기본 메소
  const mesoMultiplier = 1 + mesoBonus / 100 // 일반 메소 획득량 배수
  const wealthPotionMultiplier = wealthAcquisitionPotion ? 1.2 : 1 // 재획비 배수
  
  return {
    baseMeso,
    mesoMultiplier,
    wealthPotionMultiplier,
    totalMeso: baseMeso * mesoMultiplier * wealthPotionMultiplier
  }
}

/**
 * 솔 에르다 조각 드랍률 계산의 상세 정보 반환
 * @param dropRate 아이템 드랍률 (%)
 * @returns 솔 에르다 조각 드랍률 상세 정보
 */
export function getSolErdaFragmentCalculationDetails(dropRate: number) {
  const baseSolErdaRate = 0.000425 // 0.0425%
  const dropRateMultiplier = 1 + Math.log(1 + dropRate / 100)
  const finalRate = baseSolErdaRate * dropRateMultiplier
  
  return {
    baseSolErdaRate: baseSolErdaRate * 100, // %로 변환
    dropRateMultiplier,
    finalRate: finalRate * 100 // %로 변환
  }
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
  solErdaFragmentPrice: number // 만 메소 단위
  feeRate: number // %
  spottingSmallChangeBonus?: number // Spotting Small Change 추가 메소 (기본 0)
}

export interface HuntingExpectationResult {
  // 메소 관련
  mesoDropRate: number // %
  mesoPerDrop: number
  totalMeso: number
  
  // 솔 에르다 조각 관련
  solErdaDropRate: number // %
  solErdaCount: number
  solErdaProfit: number
  
  // 총합
  totalIncome: number
}

export function calculateHuntingExpectation(params: HuntingExpectationParams): HuntingExpectationResult {
  const {
    monsterLevel,
    totalMonsters,
    mesoBonus,
    dropRate,
    solErdaFragmentPrice,
    feeRate,
    spottingSmallChangeBonus = 0
  } = params

  // 메소 계산
  const mesoDropRate = calculateMesoDropRate(dropRate)
  const baseMesoPerDrop = calculateMesoPerDrop(monsterLevel, mesoBonus)
  // Spotting Small Change: 메소 획득량 적용 후 돈주머니당 추가 메소
  const mesoPerDrop = baseMesoPerDrop + spottingSmallChangeBonus
  const totalMeso = Math.floor(totalMonsters * mesoDropRate * mesoPerDrop)

  // 솔 에르다 조각 계산
  const solErdaDropRate = calculateSolErdaFragmentDropRate(dropRate)
  const solErdaCount = totalMonsters * solErdaDropRate
  const solErdaProfit = Math.floor(solErdaCount * solErdaFragmentPrice * 10000 * (1 - feeRate / 100))

  // 총 수익
  const totalIncome = totalMeso + solErdaProfit

  return {
    mesoDropRate: mesoDropRate * 100, // %로 변환
    mesoPerDrop,
    totalMeso,
    solErdaDropRate: solErdaDropRate * 100, // %로 변환
    solErdaCount,
    solErdaProfit,
    totalIncome
  }
} 