// 드랍 관련 계산 유틸리티 함수들

/**
 * 메소 드랍률 계산
 * @param itemDropRate 아이템 드랍률 (%)
 * @returns 메소 드랍률 (0-1 사이의 값)
 */
export function calculateMesoDropRate(itemDropRate: number): number {
  return Math.min(1, (3/5) * (1 + itemDropRate / 100))
}

/**
 * 솔 에르다 조각 드랍률 계산
 * @param itemDropRate 아이템 드랍률 (%)
 * @returns 솔 에르다 조각 드랍률 (0-1 사이의 값)
 */
export function calculateSolErdaDropRate(itemDropRate: number): number {
  const baseSolErdaRate = 0.000425 // 0.0425%
  return baseSolErdaRate * (1 + Math.log(1 + itemDropRate / 100))
}

/**
 * 메소 드랍량 계산 (1마리당)
 * @param mobLevel 몹 레벨
 * @param mesoAcquisitionRate 메소 획득량 (%)
 * @returns 1마리당 메소 드랍량
 */
export function calculateMesoPerDrop(mobLevel: number, mesoAcquisitionRate: number): number {
  return mobLevel * 7.5 * (1 + mesoAcquisitionRate / 100)
}

/**
 * 메소 계산의 상세 정보 반환
 * @param mobLevel 몹 레벨
 * @param mesoAcquisitionRate 메소 획득량 (%)
 * @param wealthPotion 재물 획득의 비약 사용 여부
 * @returns 메소 계산 상세 정보
 */
export function getMesoCalculationDetails(mobLevel: number, mesoAcquisitionRate: number, wealthPotion: boolean) {
  const baseMeso = mobLevel * 7.5 // 몬스터 드랍 기본 메소
  const mesoMultiplier = 1 + mesoAcquisitionRate / 100 // 일반 메소 획득량 배수
  const wealthPotionMultiplier = wealthPotion ? 1.2 : 1 // 재획비 배수
  
  return {
    baseMeso,
    mesoMultiplier,
    wealthPotionMultiplier,
    totalMeso: baseMeso * mesoMultiplier * wealthPotionMultiplier
  }
}

/**
 * 솔 에르다 조각 드랍률 계산의 상세 정보 반환
 * @param itemDropRate 아이템 드랍률 (%)
 * @returns 솔 에르다 조각 드랍률 상세 정보
 */
export function getSolErdaCalculationDetails(itemDropRate: number) {
  const baseSolErdaRate = 0.000425 // 0.0425%
  const dropRateMultiplier = 1 + Math.log(1 + itemDropRate / 100)
  const finalRate = baseSolErdaRate * dropRateMultiplier
  
  return {
    baseSolErdaRate: baseSolErdaRate * 100, // %로 변환
    dropRateMultiplier,
    finalRate: finalRate * 100 // %로 변환
  }
}

/**
 * 드랍 데이터 계산
 * @param params 계산에 필요한 매개변수
 * @returns 드랍 관련 계산 결과
 */
export interface DropCalculationParams {
  mobLevel: number
  totalMobs: number
  mesoAcquisitionRate: number
  itemDropRate: number
  solErdaPrice: number // 만 메소 단위
  feeRate: number // %
  changeDetectionBonus?: number // 잔돈이 눈에 띄네 추가 메소 (기본 0)
}

export interface DropCalculationResult {
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

export function calculateDropData(params: DropCalculationParams): DropCalculationResult {
  const {
    mobLevel,
    totalMobs,
    mesoAcquisitionRate,
    itemDropRate,
    solErdaPrice,
    feeRate,
    changeDetectionBonus = 0
  } = params

  // 메소 계산
  const mesoDropRate = calculateMesoDropRate(itemDropRate)
  const baseMesoPerDrop = calculateMesoPerDrop(mobLevel, mesoAcquisitionRate)
  // 잔돈이 눈에 띄네: 메소 획득량 적용 후 돈주머니당 추가 메소
  const mesoPerDrop = baseMesoPerDrop + changeDetectionBonus
  const totalMeso = Math.floor(totalMobs * mesoDropRate * mesoPerDrop)

  // 솔 에르다 조각 계산
  const solErdaDropRate = calculateSolErdaDropRate(itemDropRate)
  const solErdaCount = totalMobs * solErdaDropRate
  const solErdaProfit = Math.floor(solErdaCount * solErdaPrice * 10000 * (1 - feeRate / 100))

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