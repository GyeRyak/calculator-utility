import { calculateHuntingExpectation, type HuntingExpectationParams } from './huntingExpectationCalculations'

/**
 * 드롭/메획 아이템 정보
 */
export interface BreakevenItem {
  id: string
  name: string
  dropLines: number      // 0-3, 1줄 = 20%
  mesoLines: number      // 0-3, 1줄 = 20%
  purchasePrice: number  // 억 메소
  sellPrice: number      // 억 메소
}

/**
 * 손익분기 계산 결과
 */
export interface BreakevenResult {
  itemId: string
  netCost: number              // 순 투자 비용 (억 메소)
  increasePerHour: number      // 시간당 증가 수익 (메소)
  breakEvenHours: number       // 손익분기 시간
  breakEvenMaterials: number   // 손익분기 소재 수
  daysToBreakeven: number      // 일 수
  formattedPeriod: string      // "X개월 Y주 Z일"
}

/**
 * 손익분기 계산 매개변수
 */
export interface BreakevenCalculationParams extends HuntingExpectationParams {
  items: BreakevenItem[]
  materialsPerDay: number  // 하루 소재 수
  wealthAcquisitionPotion?: boolean  // 재물 획득의 비약 사용 여부
  currentDropFromPotential?: number  // 현재 잠재능력 드랍률
  currentMesoFromPotential?: number  // 현재 잠재능력 메소획득량
  globalFeeRate: 3 | 5  // 전역 경매장 수수료
}

/**
 * 순 투자 비용 계산
 * @param item 아이템 정보
 * @param feeRate 경매장 수수료
 * @returns 순 투자 비용 (억 메소)
 */
export function calculateNetCost(item: BreakevenItem, feeRate: 3 | 5): number {
  const sellAfterFee = item.sellPrice * (1 - feeRate / 100)
  return item.purchasePrice - sellAfterFee
}

/**
 * 아이템으로 인한 아이템 드롭률/메획 증가분 계산
 * @param item 아이템 정보
 * @returns 드롭률 증가%, 메획 증가%
 */
export function calculateItemBonus(item: BreakevenItem): { dropBonus: number; mesoBonus: number } {
  return {
    dropBonus: item.dropLines * 20,  // 1줄 = 20%
    mesoBonus: item.mesoLines * 20   // 1줄 = 20%
  }
}

/**
 * 기간 포맷팅 (일 수를 월/주/일로 변환)
 * @param days 일 수
 * @returns 포맷된 기간 문자열
 */
export function formatPeriod(days: number): string {
  const months = Math.floor(days / 30)
  const remainingDaysAfterMonths = days % 30
  const weeks = Math.floor(remainingDaysAfterMonths / 7)
  const remainingDays = remainingDaysAfterMonths % 7
  
  const parts: string[] = []
  if (months > 0) parts.push(`${months}개월`)
  if (weeks > 0) parts.push(`${weeks}주`)
  if (remainingDays > 0 || parts.length === 0) parts.push(`${Math.ceil(remainingDays)}일`)
  
  return parts.join(' ')
}

/**
 * 제한사항 검증
 * @param potentialDropBonus 잠재능력으로 인한 드롭률 증가
 * @param potentialMesoBonus 잠재능력으로 인한 메획 증가
 * @param currentDropFromPotential 현재 잠재능력 드롭률
 * @param currentMesoFromPotential 현재 잠재능력 메획
 * @returns 경고 메시지 배열
 */
export function validateLimits(
  potentialDropBonus: number, 
  potentialMesoBonus: number,
  currentDropFromPotential: number = 0,
  currentMesoFromPotential: number = 0
): string[] {
  const warnings: string[] = []
  
  const totalPotentialDrop = currentDropFromPotential + potentialDropBonus
  const totalPotentialMeso = currentMesoFromPotential + potentialMesoBonus
  
  if (totalPotentialDrop > 200) {
    warnings.push(`드롭률이 잠재능력 최대치(200%)를 초과했습니다. 현재 ${currentDropFromPotential}% + 추가 ${potentialDropBonus}% = ${totalPotentialDrop}%`)
  }
  
  if (totalPotentialMeso > 100) {
    warnings.push(`메획이 잠재능력 최대치(100%)를 초과했습니다. 현재 ${currentMesoFromPotential}% + 추가 ${potentialMesoBonus}% = ${totalPotentialMeso}%`)
  }
  
  return warnings
}

/**
 * 개별 아이템 손익분기 계산
 * @param params 계산 매개변수
 * @param item 아이템 정보
 * @returns 손익분기 결과
 */
export function calculateItemBreakeven(
  params: HuntingExpectationParams,
  item: BreakevenItem,
  materialsPerDay: number,
  globalFeeRate: 3 | 5
): BreakevenResult {
  // 기본 수익 계산
  const baseResult = calculateHuntingExpectation(params)
  
  // 아이템 보너스 적용
  const { dropBonus, mesoBonus } = calculateItemBonus(item)
  
  // 제한사항 적용 (잠재능력 최대치)
  // 드랍률은 잠재능력으로 최대 200%까지
  const effectiveDropBonus = dropBonus
  // 메획은 잠재능력으로 최대 100%까지 (재획비 효과와 별개)
  const effectiveMesoBonus = mesoBonus
  
  // 아이템 적용 후 수익 계산
  const itemParams: HuntingExpectationParams = {
    ...params,
    dropRate: params.dropRate + effectiveDropBonus,
    mesoBonus: params.mesoBonus + effectiveMesoBonus
  }
  const itemResult = calculateHuntingExpectation(itemParams)
  
  // 시간당 증가 수익
  const increasePerHour = itemResult.totalIncome - baseResult.totalIncome
  
  // 순 투자 비용
  const netCost = calculateNetCost(item, globalFeeRate)
  const netCostInMeso = netCost * 100000000 // 억 메소 -> 메소
  
  // 손익분기 계산
  const breakEvenHours = increasePerHour > 0 ? netCostInMeso / increasePerHour : Infinity
  const breakEvenMaterials = breakEvenHours * 2 // 1소재 = 30분
  const daysToBreakeven = materialsPerDay > 0 ? breakEvenMaterials / materialsPerDay : Infinity
  
  return {
    itemId: item.id,
    netCost,
    increasePerHour,
    breakEvenHours,
    breakEvenMaterials,
    daysToBreakeven,
    formattedPeriod: formatPeriod(daysToBreakeven)
  }
}

/**
 * 전체 아이템 손익분기 계산
 * @param params 계산 매개변수
 * @returns 개별 및 전체 손익분기 결과
 */
export function calculateBreakeven(params: BreakevenCalculationParams): {
  itemResults: BreakevenResult[]
  totalResult: BreakevenResult | null
  warnings: string[]
} {
  const { items, materialsPerDay, wealthAcquisitionPotion, currentDropFromPotential, currentMesoFromPotential, globalFeeRate, ...huntingParams } = params
  
  // 재물 획득의 비약 효과 적용
  let adjustedHuntingParams = { ...huntingParams }
  if (wealthAcquisitionPotion) {
    // 메획에 곱연산 1.2배
    adjustedHuntingParams.mesoBonus = (100 + huntingParams.mesoBonus) * 1.2 - 100
    // 드롭률에 합연산 +20%
    adjustedHuntingParams.dropRate = huntingParams.dropRate + 20
  }
  
  // 개별 아이템 계산
  const itemResults = items.map(item => 
    calculateItemBreakeven(adjustedHuntingParams, item, materialsPerDay, globalFeeRate)
  )
  
  // 전체 보너스 계산 (잠재능력으로 인한 증가분만)
  const totalPotentialDropBonus = items.reduce((sum, item) => sum + item.dropLines * 20, 0)
  const totalPotentialMesoBonus = items.reduce((sum, item) => sum + item.mesoLines * 20, 0)
  
  // 경고 메시지
  const warnings = validateLimits(
    totalPotentialDropBonus,
    totalPotentialMesoBonus,
    currentDropFromPotential || 0,
    currentMesoFromPotential || 0
  )
  
  // 전체 손익분기 계산
  let totalResult: BreakevenResult | null = null
  
  if (items.length > 0) {
    // 기본 수익 (재물 획득의 비약 효과 포함)
    const baseResult = calculateHuntingExpectation(adjustedHuntingParams)
    
    // 제한사항 적용된 전체 보너스
    const effectiveTotalDropBonus = totalPotentialDropBonus
    const effectiveTotalMesoBonus = totalPotentialMesoBonus
    
    // 전체 아이템 적용 후 수익
    const totalParams: HuntingExpectationParams = {
      ...adjustedHuntingParams,
      dropRate: adjustedHuntingParams.dropRate + effectiveTotalDropBonus,
      mesoBonus: adjustedHuntingParams.mesoBonus + effectiveTotalMesoBonus
    }
    const totalItemResult = calculateHuntingExpectation(totalParams)
    
    // 전체 순 투자 비용
    const totalNetCost = items.reduce((sum, item) => sum + calculateNetCost(item, globalFeeRate), 0)
    const totalNetCostInMeso = totalNetCost * 100000000
    
    // 시간당 총 증가 수익
    const totalIncreasePerHour = totalItemResult.totalIncome - baseResult.totalIncome
    
    // 전체 손익분기
    const totalBreakEvenHours = totalIncreasePerHour > 0 ? totalNetCostInMeso / totalIncreasePerHour : Infinity
    const totalBreakEvenMaterials = totalBreakEvenHours * 2
    const totalDaysToBreakeven = materialsPerDay > 0 ? totalBreakEvenMaterials / materialsPerDay : Infinity
    
    totalResult = {
      itemId: 'total',
      netCost: totalNetCost,
      increasePerHour: totalIncreasePerHour,
      breakEvenHours: totalBreakEvenHours,
      breakEvenMaterials: totalBreakEvenMaterials,
      daysToBreakeven: totalDaysToBreakeven,
      formattedPeriod: formatPeriod(totalDaysToBreakeven)
    }
  }
  
  return {
    itemResults,
    totalResult,
    warnings
  }
}