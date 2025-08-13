// 보스 물욕템 계산 로직
import { getChaseItemById, getRingBoxProbabilities, RING_BOX_PROBABILITIES, ITEM_DROP_RATES } from '../data/chaseItems'
import { getBossById, getBossDifficulty } from '../data/bossData'
import type { CharacterConfig, RingPrices } from './defaults/bossChaseDefaults'

// 파티 분배 계산 함수 (추후 확장 가능)
function calculateMyShare(totalValue: number, partySize: number): number {
  // TODO: 추후 더 복잡한 분배 공식 추가 (기여도, 딜러/서포터 구분 등)
  // 현재는 단순히 총 가치를 파티 인원수로 나누어 반환
  return partySize > 0 ? totalValue / partySize : totalValue
}

export interface BossChaseCalculationParams {
  characters: CharacterConfig[]
  customDropRates: { [key: string]: number } // key: "bossId:difficulty:itemId" or "itemId" for global
  customPrices: { [itemId: string]: number }
  ringPrices: RingPrices
  grindstonePrice: number
  globalDropRateBonus: number // 전역 기본 아드 증가량 (%)
  feeRate: number // 경매장 수수료 (%)
}

export interface CharacterResult {
  characterName: string
  weeklyExpectation: number
  monthlyExpectation: number
  itemExpectations: ItemExpectation[]
}

export interface ItemExpectation {
  itemId: string
  itemName: string
  category: string
  expectedCount: number
  expectedValue: number
  actualDropRate: number
  baseDropRate: number // 기본 드롭률 (아드 증가 전)
  itemPrice: number
  bossSource: string // 어느 보스에서 드롭되는지
  partySize: number // 파티 사이즈 정보
}

export interface BossChaseResult {
  characterResults: CharacterResult[]
  totalWeeklyExpectation: number
  totalMonthlyExpectation: number
  totalExpectation: number
}

// 보스-난이도-아이템 조합에서 드롭률을 찾는 헬퍼 함수
function getItemDropRate(bossId: string, difficulty: string, itemId: string, customDropRates: { [key: string]: number } = {}): number {
  // 1. 특정 보스-난이도-아이템 조합의 커스텀 드롭률 확인
  const specificKey = `${bossId}:${difficulty}:${itemId}`
  if (customDropRates[specificKey] !== undefined) {
    return customDropRates[specificKey]
  }
  
  // 2. 글로벌 아이템 커스텀 드롭률 확인
  if (customDropRates[itemId] !== undefined) {
    return customDropRates[itemId]
  }
  
  // 3. 기본 드롭률 사용
  const dropRateEntry = ITEM_DROP_RATES.find(
    entry => entry.bossId === bossId && 
             entry.difficulty === difficulty && 
             entry.itemId === itemId
  )
  return dropRateEntry?.defaultDropRate || 0
}

// 메인 계산 함수
export function calculateBossChaseExpectation(params: BossChaseCalculationParams): BossChaseResult {
  const characterResults: CharacterResult[] = []
  
  for (const character of params.characters) {
    const result = calculateCharacterExpectation(character, params)
    characterResults.push(result)
  }
  
  // 전체 합계 계산
  const totalWeeklyExpectation = characterResults.reduce((sum, char) => sum + char.weeklyExpectation, 0)
  const totalMonthlyExpectation = characterResults.reduce((sum, char) => sum + char.monthlyExpectation, 0)
  const totalExpectation = totalWeeklyExpectation + totalMonthlyExpectation
  
  return {
    characterResults,
    totalWeeklyExpectation,
    totalMonthlyExpectation,
    totalExpectation
  }
}

// 드롭률 +20% 시뮬레이션 계산
export function calculateDropRateBonusSimulation(params: BossChaseCalculationParams, bonusPercent: number = 20): BossChaseResult {
  // 개별 드롭률 설정을 사용하는 캐릭터들도 고려하여 시뮬레이션 파라미터 생성
  const simulationParams = {
    ...params,
    globalDropRateBonus: params.globalDropRateBonus + bonusPercent,
    characters: params.characters.map(character => ({
      ...character,
      // 개별 드롭률 설정을 사용하는 캐릭터는 해당 드롭률에 보너스 적용
      customDropRate: (character.useGlobalDropRate !== false) 
        ? character.customDropRate 
        : (character.customDropRate || 0) + bonusPercent
    }))
  }
  
  return calculateBossChaseExpectation(simulationParams)
}

// 캐릭터별 기댓값 계산
function calculateCharacterExpectation(
  character: CharacterConfig, 
  params: BossChaseCalculationParams
): CharacterResult {
  const itemExpectations: ItemExpectation[] = []
  let weeklyExpectation = 0
  let monthlyExpectation = 0
  
  // 캐릭터별 드롭률 설정 확인
  const characterDropRate = (character.useGlobalDropRate !== false) 
    ? params.globalDropRateBonus 
    : (character.customDropRate || 0)
  
  // 캐릭터별 파라미터 생성
  const characterParams = {
    ...params,
    globalDropRateBonus: characterDropRate // 해당 캐릭터의 드롭률로 설정
  }
  
  for (const bossEntry of character.bossList) {
    const boss = getBossById(bossEntry.bossId)
    const difficulty = getBossDifficulty(bossEntry.bossId, bossEntry.difficulty)
    
    if (!boss || !difficulty) continue
    
    // 각 아이템별 기댓값 계산
    for (const itemId of difficulty.dropTable) {
      const itemExpectation = calculateItemExpectation(
        itemId,
        bossEntry.bossId,
        bossEntry.difficulty,
        bossEntry.partySize,
        characterParams,
        `${difficulty.name} ${boss.name}`
      )
      
      if (itemExpectation.expectedValue > 0) {
        itemExpectations.push(itemExpectation)
        
        // 주간/월간 분류
        if (boss.type === 'weekly') {
          weeklyExpectation += itemExpectation.expectedValue
        } else {
          monthlyExpectation += itemExpectation.expectedValue
        }
      }
    }
  }
  
  return {
    characterName: character.name,
    weeklyExpectation,
    monthlyExpectation,
    itemExpectations
  }
}

// 개별 아이템 기댓값 계산
function calculateItemExpectation(
  itemId: string,
  bossId: string,
  difficulty: string,
  partySize: number,
  params: BossChaseCalculationParams,
  bossSource: string
): ItemExpectation {
  const item = getChaseItemById(itemId)
  
  if (!item) {
    return {
      itemId,
      itemName: 'Unknown Item',
      category: 'unknown',
      expectedCount: 0,
      expectedValue: 0,
      actualDropRate: 0,
      baseDropRate: 0,
      itemPrice: 0,
      bossSource,
      partySize
    }
  }
  
  // 드롭률 계산 - 새로운 시스템 사용
  const baseDropRate = getItemDropRate(bossId, difficulty, itemId, params.customDropRates)
  let actualDropRate = baseDropRate
  
  // 드롭률 증가 효과 적용 (normal 타입만)
  if (item.isDropAffected === 'normal' && params.globalDropRateBonus > 0) {
    actualDropRate = baseDropRate * (1 + params.globalDropRateBonus / 100)
  }
  
  // 반지 상자 처리
  if (item.category === 'ring_box') {
    return calculateRingBoxExpectation(itemId, actualDropRate, partySize, params, bossSource, bossId)
  }
  
  // 보스 유형 확인 (주간/월간)
  const boss = getBossById(bossId)
  const isWeeklyBoss = boss?.type === 'weekly'
  
  // 일반 아이템 처리
  const itemPrice = params.customPrices[itemId] || item.defaultPrice
  // 수수료 적용한 실제 판매 가격
  const actualPrice = itemPrice * (1 - params.feeRate / 100)
  // 4주 단위 표시를 위해 주간 보스는 4배 적용
  const totalExpectedCount = actualDropRate * (isWeeklyBoss ? 4 : 1)
  // 파티 분배 적용하여 내 기댓값 개수 계산
  const expectedCount = calculateMyShare(totalExpectedCount, partySize)
  const expectedValue = expectedCount * actualPrice
  
  return {
    itemId,
    itemName: item.name,
    category: item.category,
    expectedCount,
    expectedValue,
    actualDropRate,
    baseDropRate,
    itemPrice, // 표시용으로는 원래 가격 유지
    bossSource,
    partySize
  }
}

// 반지 상자 기댓값 계산
function calculateRingBoxExpectation(
  ringBoxId: string,
  ringBoxDropRate: number,
  partySize: number,
  params: BossChaseCalculationParams,
  bossSource: string,
  bossId: string
): ItemExpectation {
  const item = getChaseItemById(ringBoxId)
  const probabilities = getRingBoxProbabilities(ringBoxId)
  
  if (!item) {
    return {
      itemId: ringBoxId,
      itemName: 'Unknown Ring Box',
      category: 'ring_box',
      expectedCount: 0,
      expectedValue: 0,
      actualDropRate: 0,
      baseDropRate: 0,
      itemPrice: 0,
      bossSource,
      partySize
    }
  }
  
  // 보스 유형 확인 (주간/월간)
  const boss = getBossById(bossId)
  const isWeeklyBoss = boss?.type === 'weekly'
  
  // 반지 기댓값 계산 (수수료 적용)
  const ringExpectedValue = 
    probabilities.restraint_lv3 * params.ringPrices.restraint_lv3 * (1 - params.feeRate / 100) +
    probabilities.restraint_lv4 * params.ringPrices.restraint_lv4 * (1 - params.feeRate / 100) +
    probabilities.continuous_lv3 * params.ringPrices.continuous_lv3 * (1 - params.feeRate / 100) +
    probabilities.continuous_lv4 * params.ringPrices.continuous_lv4 * (1 - params.feeRate / 100) +
    probabilities.grindstone * params.grindstonePrice * (1 - params.feeRate / 100)
  
  // 표시용 기댓값 (수수료 미적용)
  const displayRingExpectedValue = 
    probabilities.restraint_lv3 * params.ringPrices.restraint_lv3 +
    probabilities.restraint_lv4 * params.ringPrices.restraint_lv4 +
    probabilities.continuous_lv3 * params.ringPrices.continuous_lv3 +
    probabilities.continuous_lv4 * params.ringPrices.continuous_lv4 +
    probabilities.grindstone * params.grindstonePrice
  
  // 4주 단위 표시를 위해 주간 보스는 4배 적용
  const totalExpectedCount = ringBoxDropRate * (isWeeklyBoss ? 4 : 1)
  // 파티 분배 적용하여 내 기댓값 개수 계산
  const expectedCount = calculateMyShare(totalExpectedCount, partySize)
  const expectedValue = expectedCount * ringExpectedValue
  
  return {
    itemId: ringBoxId,
    itemName: item.name,
    category: item.category,
    expectedCount,
    expectedValue,
    actualDropRate: ringBoxDropRate,
    baseDropRate: ringBoxDropRate, // 반지 상자는 기본 드롭률과 동일
    itemPrice: displayRingExpectedValue, // 표시용으로는 수수료 미적용 가격 사용
    bossSource,
    partySize
  }
}

// 사냥 기댓값 계산기에서 드롭률 가져오기
export function loadDropRateFromBasicCalculator(slotNumber: number = 1): number {
  try {
    const key = `basic_calculator_slot_${slotNumber}`
    const data = localStorage.getItem(key)
    
    if (!data) {
      return 0
    }
    
    const settings = JSON.parse(data)
    
    // 손익분기 계산기와 동일한 방식으로 드롭률 계산
    const { calculateItemDropBonus } = require('./bonusCalculations')
    
    // 아드 계산 (기본 계산기 함수 활용)
    // inputMode에 따라 다르게 처리
    const inputMode = settings.dropRateInputMode || settings.itemDropInputMode || 'detail'
    
    if (inputMode === 'direct') {
      // 직접 입력 모드: 저장된 dropRate 값을 그대로 사용
      return settings.dropRate || 0
    }
    
    // detail 모드: 개별 설정들로 계산 (저장된 설정 그대로 사용)
    const dropRateParams = {
      inputMode: 'detail',
      directValue: 0, // detail 모드에서는 사용되지 않음
      globalBuffMode: settings.globalBuffMode || 'legion',
      legionBuff: settings.dropRateLegionBuff ?? false,
      potentialMode: settings.dropRatePotentialMode || 'lines',
      potentialLines: settings.dropRatePotentialLines || 0, // 저장된 값 그대로
      potentialDirect: settings.dropRatePotentialDirect || 0, // 저장된 값 그대로
      ability: settings.dropRateAbility || 0,
      artifactMode: settings.dropRateArtifactMode || 'level',
      artifactLevel: settings.dropRateArtifactLevelInput || 0,
      artifactPercent: settings.dropRateArtifactPercentInput || 0,
      holySymbol: settings.holySymbol ?? false,
      decentHolySymbol: settings.decentHolySymbol ?? false,
      decentHolySymbolLevel: settings.decentHolySymbolLevel ?? 30,
      spottingSmallChange: settings.spottingSmallChange ?? false,
      spottingSmallChangeLevel: settings.spottingSmallChangeLevel ?? 3,
      tallahartSymbolLevel: settings.tallahartSymbolLevel || 0,
      pcRoomMode: false, // PC방 모드는 제외
      wealthAcquisitionPotion: settings.wealthAcquisitionPotion ?? false, // 저장된 값 그대로
      otherBuff: 0,
      otherNonBuff: 0
    }
    
    const result = calculateItemDropBonus(dropRateParams)
    
    return result.totalBonus
  } catch (error) {
    console.error('Failed to load drop rate from basic calculator:', error)
    return 0
  }
}

// 사냥 기댓값 계산기 기본값에서 드롭률 계산
export function getDefaultDropRateFromBasicCalculator(): number {
  try {
    // 기본값 모듈과 계산 함수를 동적으로 import하여 순환 참조 방지
    const { DEFAULT_BASIC_CALCULATOR_VALUES } = require('./defaults/basicCalculatorDefaults')
    const { calculateItemDropBonus } = require('./bonusCalculations')
    
    // 기본값을 사용해서 ItemDropCalculationParams 생성 (기본값 그대로)
    const params = {
      inputMode: 'detail',
      directValue: 0, // detail 모드에서는 사용되지 않음
      globalBuffMode: DEFAULT_BASIC_CALCULATOR_VALUES.globalBuffMode || 'legion',
      legionBuff: DEFAULT_BASIC_CALCULATOR_VALUES.dropRateLegionBuff || false,
      potentialMode: DEFAULT_BASIC_CALCULATOR_VALUES.dropRatePotentialMode || 'lines',
      potentialLines: DEFAULT_BASIC_CALCULATOR_VALUES.dropRatePotentialLines || 0, // 기본값 그대로
      potentialDirect: DEFAULT_BASIC_CALCULATOR_VALUES.dropRatePotentialDirect || 0, // 기본값 그대로
      ability: DEFAULT_BASIC_CALCULATOR_VALUES.dropRateAbility || 0,
      artifactMode: DEFAULT_BASIC_CALCULATOR_VALUES.dropRateArtifactMode || 'level',
      artifactLevel: DEFAULT_BASIC_CALCULATOR_VALUES.dropRateArtifactLevelInput || 0,
      artifactPercent: DEFAULT_BASIC_CALCULATOR_VALUES.dropRateArtifactPercentInput || 0,
      holySymbol: DEFAULT_BASIC_CALCULATOR_VALUES.holySymbol || false,
      decentHolySymbol: DEFAULT_BASIC_CALCULATOR_VALUES.decentHolySymbol || false,
      decentHolySymbolLevel: DEFAULT_BASIC_CALCULATOR_VALUES.decentHolySymbolLevel || 30,
      spottingSmallChange: DEFAULT_BASIC_CALCULATOR_VALUES.spottingSmallChange || false,
      spottingSmallChangeLevel: DEFAULT_BASIC_CALCULATOR_VALUES.spottingSmallChangeLevel || 3,
      tallahartSymbolLevel: DEFAULT_BASIC_CALCULATOR_VALUES.tallahartSymbolLevel || 0,
      pcRoomMode: false, // PC방 모드는 기본적으로 제외
      wealthAcquisitionPotion: DEFAULT_BASIC_CALCULATOR_VALUES.wealthAcquisitionPotion || false, // 기본값 그대로
      otherBuff: 0,
      otherNonBuff: 0
    }
    
    // 실제 사냥 기댓값 계산기의 드롭률 계산 함수 사용
    const result = calculateItemDropBonus(params)
    
    return result.totalBonus
  } catch (error) {
    console.error('Failed to calculate default drop rate from basic calculator:', error)
    return 0
  }
}

// 결과 정렬 및 필터링 유틸리티
export function sortItemExpectationsByValue(items: ItemExpectation[]): ItemExpectation[] {
  return [...items].sort((a, b) => b.expectedValue - a.expectedValue)
}

export function groupItemExpectationsByCategory(items: ItemExpectation[]): { [category: string]: ItemExpectation[] } {
  return items.reduce((groups, item) => {
    const category = item.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(item)
    return groups
  }, {} as { [category: string]: ItemExpectation[] })
}