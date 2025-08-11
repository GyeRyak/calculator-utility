import { calculateHuntingExpectation, type HuntingExpectationParams } from './huntingExpectationCalculations'
import { calculateCoreMesoBonus, calculateCoreDropBonus, calculateMesoLimitTime } from './bonusCalculations'

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
  currentDropFromPotential?: number  // 현재 잠재능력 드롭률
  currentMesoFromPotential?: number  // 현재 잠재능력 메소획득량
  otherDropBonus?: number  // 재획비/잠재 제외 아이템 드롭률 (%)
  otherMesoBonus?: number  // 재획비/잠재 제외 메소 획득량 (%)
  globalFeeRate: 3 | 5  // 전역 경매장 수수료
  mesoLimitEnabled?: boolean  // 메소 제한 활성화 여부
  mesoLimitHours?: number     // 메소 제한 시간 (시간 단위)
  normalDropExpectation?: number  // 일반 드롭 아이템 100마리당 판매 기댓값 (메소 단위, 드롭률 0% 기준)
  logDropExpectation?: number     // 로그 드롭 아이템 100마리당 판매 기댓값 (메소 단위, 드롭률 0% 기준)
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
 * 기댓값으로부터 더미 드롭 아이템 생성
 * @param normalDropExpectation 일반 드롭 100마리당 기댓값 (메소 단위)
 * @param logDropExpectation 로그 드롭 100마리당 기댓값 (메소 단위)
 * @returns 더미 드롭 아이템 배열
 */
function createDummyDropItems(normalDropExpectation: number, logDropExpectation: number): {
  normalDropItems: Array<{ id: string, name: string, price: number, dropRate: number, directUse: boolean }>,
  logDropItems: Array<{ id: string, name: string, price: number, dropRate: number, directUse: boolean }>
} {
  const normalDropItems = []
  const logDropItems = []
  
  // 일반 드롭 더미 아이템 (드롭률 1%, 가격은 기댓값/만메소)
  if (normalDropExpectation > 0) {
    normalDropItems.push({
      id: '__dummy_normal_drop__',
      name: '일반 드롭 더미 아이템',
      price: normalDropExpectation / 10000, // 100마리당 기댓값 / 10000(만 메소 단위)
      dropRate: 1, // 1%
      directUse: true // 수수료 없음
    })
  }
  
  // 로그 드롭 더미 아이템 (드롭률 1%, 가격은 기댓값/만메소)  
  if (logDropExpectation > 0) {
    logDropItems.push({
      id: '__dummy_log_drop__',
      name: '로그 드롭 더미 아이템',
      price: logDropExpectation / 10000, // 100마리당 기댓값 / 10000(만 메소 단위)
      dropRate: 1, // 1%
      directUse: true // 수수료 없음
    })
  }
  
  return { normalDropItems, logDropItems }
}

/**
 * 개별 아이템 손익분기 계산
 * @param params 계산 매개변수
 * @param item 아이템 정보
 * @param normalDropExpectation 일반 드롭 기댓값
 * @param logDropExpectation 로그 드롭 기댓값
 * @returns 손익분기 결과
 */
export function calculateItemBreakeven(
  params: HuntingExpectationParams,
  item: BreakevenItem,
  materialsPerDay: number,
  globalFeeRate: 3 | 5,
  normalDropExpectation: number,
  logDropExpectation: number,
  mesoLimitEnabled?: boolean,
  mesoLimitHours?: number,
  wealthAcquisitionPotion?: boolean,
  currentDropFromPotential?: number,
  currentMesoFromPotential?: number,
  otherDropBonus?: number,
  otherMesoBonus?: number
): BreakevenResult {
  // 더미 드롭 아이템 생성
  const { normalDropItems, logDropItems } = createDummyDropItems(normalDropExpectation, logDropExpectation)
  
  // 아이템 보너스 적용
  const { dropBonus, mesoBonus } = calculateItemBonus(item)
  
  // 현재 잠재능력 값 직접 사용
  const currentMesoBonus = currentMesoFromPotential || 0
  const currentDropBonus = currentDropFromPotential || 0
  
  // 잠재능력을 줄 수로 변환
  const currentMesoLines = currentMesoBonus / 20
  const currentDropLines = currentDropBonus / 20
  
  // 기타 보너스는 입력값 그대로 사용
  const baseMesoBonus = otherMesoBonus || 0
  const baseDropBonus = otherDropBonus || 0
  
  // 기존 보너스 (현재 상태에서 재획비 고려)
  const baseMesoResult = calculateCoreMesoBonus(currentMesoLines, baseMesoBonus, wealthAcquisitionPotion)
  const baseDropResult = calculateCoreDropBonus(currentDropLines, baseDropBonus, wealthAcquisitionPotion)
  
  // 아이템 적용 후 보너스 (현재 상태 + 아이템 줄 수, 재획비 고려)
  const itemMesoResult = calculateCoreMesoBonus(currentMesoLines + mesoBonus / 20, baseMesoBonus, wealthAcquisitionPotion)
  const itemDropResult = calculateCoreDropBonus(currentDropLines + dropBonus / 20, baseDropBonus, wealthAcquisitionPotion)
  
  // 실제 증가분
  const actualMesoBonus = itemMesoResult.totalBonus - baseMesoResult.totalBonus
  const actualDropBonus = itemDropResult.totalBonus - baseDropResult.totalBonus
  
  // 기본 수익 계산용 파라미터 
  const baseParams: HuntingExpectationParams = {
    ...params,
    mesoBonus: baseMesoResult.totalBonus,  // 재획비 포함 계산된 값
    dropRate: currentDropBonus + baseDropBonus + (wealthAcquisitionPotion ? 20 : 0),
    normalDropItems,
    logDropItems
  }
  
  // 기본 수익 계산
  const baseResult = calculateHuntingExpectation(baseParams)
  
  // 아이템 적용 후 수익 계산
  const itemParams: HuntingExpectationParams = {
    ...baseParams,
    dropRate: baseParams.dropRate + actualDropBonus,
    mesoBonus: itemMesoResult.totalBonus,  // 아이템 적용 후 재획비 포함 계산된 값
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
  
  // 메소 제한이 활성화된 경우 하루 소재 수 조정
  let effectiveMaterialsPerDay = materialsPerDay
  if (mesoLimitEnabled) {
    // 메소 제한에 도달하는 시간을 계산 (기본 계산기와 동일한 로직)
    const huntTimeInMinutes = 30 // 1소재 = 30분으로 가정
    const monstersPerHuntTime = Math.round(params.totalMonsters / 60 * huntTimeInMinutes) // 30분당 몬스터 수
    const mesoLimitTimeInMinutes = calculateMesoLimitTime(
      params.characterLevel || 275, 
      params.monsterLevel, 
      monstersPerHuntTime, 
      huntTimeInMinutes
    )
    
    // 메소 제한 도달 시간을 소재로 변환 (1소재 = 30분)
    effectiveMaterialsPerDay = mesoLimitTimeInMinutes / 30
  }
  
  const daysToBreakeven = effectiveMaterialsPerDay > 0 ? breakEvenMaterials / effectiveMaterialsPerDay : Infinity
  
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
  const { items, materialsPerDay, wealthAcquisitionPotion, currentDropFromPotential, currentMesoFromPotential, otherDropBonus, otherMesoBonus, globalFeeRate, mesoLimitEnabled, mesoLimitHours, normalDropExpectation = 0, logDropExpectation = 0, ...huntingParams } = params
  
  // 기본 파라미터 구성 (잠재 + 기타 보너스)
  const currentMeso = currentMesoFromPotential || 0
  const currentDrop = currentDropFromPotential || 0
  const baseMeso = otherMesoBonus || 0
  const baseDrop = otherDropBonus || 0
  
  let adjustedHuntingParams = { 
    ...huntingParams,
    mesoBonus: currentMeso + baseMeso,
    dropRate: currentDrop + baseDrop
  }
  
  // 재물 획득의 비약 효과 적용
  if (wealthAcquisitionPotion) {
    adjustedHuntingParams.dropRate += 20  // 드롭률 +20%
    // 메소는 곱연산이므로 calculateCoreMesoBonus에서 처리됨
  }
  
  // 개별 아이템 계산
  const itemResults = items.map(item => 
    calculateItemBreakeven(adjustedHuntingParams, item, materialsPerDay, globalFeeRate, normalDropExpectation, logDropExpectation, mesoLimitEnabled, mesoLimitHours, wealthAcquisitionPotion, currentDropFromPotential, currentMesoFromPotential, otherDropBonus, otherMesoBonus)
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
    // 더미 드롭 아이템 생성
    const { normalDropItems, logDropItems } = createDummyDropItems(normalDropExpectation, logDropExpectation)
    
    // 기본 수익 (재물 획득의 비약 효과 포함, 더미 드롭 아이템 포함)
    const baseParams: HuntingExpectationParams = {
      ...adjustedHuntingParams,
      normalDropItems,
      logDropItems
    }
    const baseResult = calculateHuntingExpectation(baseParams)
    
    // 제한사항 적용된 전체 보너스
    const effectiveTotalDropBonus = totalPotentialDropBonus
    const effectiveTotalMesoBonus = totalPotentialMesoBonus
    
    // 전체 아이템 적용 후 수익 (더미 드롭 아이템 포함)
    const totalParams: HuntingExpectationParams = {
      ...adjustedHuntingParams,
      dropRate: adjustedHuntingParams.dropRate + effectiveTotalDropBonus,
      mesoBonus: adjustedHuntingParams.mesoBonus + effectiveTotalMesoBonus,
      normalDropItems,
      logDropItems
    }
    const totalItemResult = calculateHuntingExpectation(totalParams)
    
    // 전체 순 투자 비용
    const totalNetCost = items.reduce((sum, item) => sum + calculateNetCost(item, globalFeeRate), 0)
    const totalNetCostInMeso = totalNetCost * 100000000
    
    // 시간당 총 증가 수익 (메소 + 드롭 아이템 모두 huntingExpectation에서 계산됨)
    const totalIncreasePerHour = totalItemResult.totalIncome - baseResult.totalIncome
    
    // 전체 손익분기
    const totalBreakEvenHours = totalIncreasePerHour > 0 ? totalNetCostInMeso / totalIncreasePerHour : Infinity
    const totalBreakEvenMaterials = totalBreakEvenHours * 2
    
    // 메소 제한이 활성화된 경우 하루 소재 수 조정
    let effectiveMaterialsPerDay = materialsPerDay
    if (mesoLimitEnabled) {
      // 메소 제한에 도달하는 시간을 계산 (기본 계산기와 동일한 로직)
      const huntTimeInMinutes = 30 // 1소재 = 30분으로 가정
      const monstersPerHuntTime = Math.round(adjustedHuntingParams.totalMonsters / 60 * huntTimeInMinutes) // 30분당 몬스터 수
      const mesoLimitTimeInMinutes = calculateMesoLimitTime(
        adjustedHuntingParams.characterLevel || 275, 
        adjustedHuntingParams.monsterLevel, 
        monstersPerHuntTime, 
        huntTimeInMinutes
      )
      
      // 메소 제한 도달 시간을 소재로 변환 (1소재 = 30분)
      effectiveMaterialsPerDay = mesoLimitTimeInMinutes / 30
    }
    
    const totalDaysToBreakeven = effectiveMaterialsPerDay > 0 ? totalBreakEvenMaterials / effectiveMaterialsPerDay : Infinity
    
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