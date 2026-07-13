import {
  calculateItemDropBonus,
  calculateMesoBonus,
  calculateMesoLimitTime,
  type ItemDropCalculationParams,
  type MesoCalculationParams,
} from './bonusCalculations'
import {
  calculateHuntingExpectation,
  type DropItem,
} from './huntingExpectationCalculations'

export interface BasicCalculatorDropItem extends DropItem {
  type: 'normal' | 'log'
  dropRate: number
}

export interface BasicCalculatorResult {
  baseMeso: number
  baseMesoPerHour: number
  totalIncome: number
  totalMeso: number
  mesoDropRate: number
  mesoPerDrop: number
  wealthAcquisitionPotionCount: number
  wealthAcquisitionPotionCost: number
  totalMesoPerHour: number
  totalMesoWithoutPotion: number
  dropItems: Map<string, {
    item: BasicCalculatorDropItem
    expectedCount: number
    expectedValue: number
    actualDropRate: number
    dropMultiplier: number
  }>
}

export interface BasicCalculationRequest {
  monsterLevel: number
  characterLevel: number
  monsterCount: number
  huntTime: number
  resultTime: number
  resultTimeUnit: string
  isCustomResultTime: boolean
  feeRate: number
  spottingSmallChange: boolean
  spottingSmallChangeLevel: number
  wealthAcquisitionPotion: boolean
  showWealthPotionCost: boolean
  wealthAcquisitionPotionPrice: number
  dropItems: BasicCalculatorDropItem[]
  mesoParams: MesoCalculationParams
  itemDropParams: ItemDropCalculationParams
}

function toDropItemMap(result: ReturnType<typeof calculateHuntingExpectation>) {
  return new Map(
    result.dropItems.map((dropResult) => [
      dropResult.item.id,
      {
        item: {
          ...dropResult.item,
          type: dropResult.item.type || 'normal',
        } as BasicCalculatorDropItem,
        expectedCount: dropResult.expectedCount,
        expectedValue: dropResult.expectedValue,
        actualDropRate: dropResult.actualDropRate,
        dropMultiplier: dropResult.dropMultiplier,
      },
    ])
  )
}

export function calculateBasicCalculator(request: BasicCalculationRequest): BasicCalculatorResult {
  const {
    monsterLevel,
    characterLevel,
    monsterCount,
    huntTime,
    resultTime,
    resultTimeUnit,
    isCustomResultTime,
    feeRate,
    spottingSmallChange,
    spottingSmallChangeLevel,
    wealthAcquisitionPotion,
    showWealthPotionCost,
    wealthAcquisitionPotionPrice,
    dropItems,
    mesoParams,
    itemDropParams,
  } = request

  const mesoBonus = calculateMesoBonus(mesoParams).totalBonus
  const dropRate = calculateItemDropBonus(itemDropParams).totalBonus
  const monstersPerMinute = monsterCount / huntTime
  const monstersPerHour = monstersPerMinute * 60
  const actualResultTime = isCustomResultTime && resultTimeUnit === 'meso_limit'
    ? calculateMesoLimitTime(characterLevel, monsterLevel, monsterCount, huntTime)
    : resultTime
  const totalMonsters = monstersPerMinute * actualResultTime
  const spottingSmallChangeBonus = spottingSmallChange ? spottingSmallChangeLevel * 2 + 2 : 0

  const huntingParams = {
    monsterLevel,
    totalMonsters,
    mesoBonus,
    dropRate,
    feeRate,
    spottingSmallChangeBonus,
    characterLevel,
    normalDropItems: dropItems.filter((item) => item.type === 'normal'),
    logDropItems: dropItems.filter((item) => item.type === 'log'),
  }
  const result = calculateHuntingExpectation(huntingParams)
  const hourlyResult = calculateHuntingExpectation({
    ...huntingParams,
    totalMonsters: monstersPerHour,
  })

  const withoutPotionMesoParams = wealthAcquisitionPotion
    ? { ...mesoParams, wealthAcquisitionPotion: false }
    : mesoParams
  const withoutPotionDropParams = wealthAcquisitionPotion
    ? { ...itemDropParams, wealthAcquisitionPotion: false }
    : itemDropParams
  const withoutPotionResult = calculateHuntingExpectation({
    ...huntingParams,
    mesoBonus: calculateMesoBonus(withoutPotionMesoParams).totalBonus,
    dropRate: calculateItemDropBonus(withoutPotionDropParams).totalBonus,
  })

  const resultItems = toDropItemMap(result)
  const hourlyItems = toDropItemMap(hourlyResult)
  const totalDropItemValue = Array.from(resultItems.values())
    .reduce((sum, item) => sum + item.expectedValue, 0)
  const hourlyDropItemValue = Array.from(hourlyItems.values())
    .reduce((sum, item) => sum + item.expectedValue, 0)

  const potionCount = wealthAcquisitionPotion && showWealthPotionCost
    ? Math.ceil(actualResultTime / 30)
    : 0
  const potionCost = potionCount * wealthAcquisitionPotionPrice * 10_000
  const hourlyPotionCost = wealthAcquisitionPotion && showWealthPotionCost
    ? 2 * wealthAcquisitionPotionPrice * 10_000
    : 0
  const totalIncome = result.totalMeso + totalDropItemValue

  return {
    baseMeso: result.totalMeso,
    totalIncome,
    totalMeso: totalIncome - potionCost,
    mesoDropRate: result.mesoDropRate,
    mesoPerDrop: result.mesoPerDrop,
    wealthAcquisitionPotionCount: potionCount,
    wealthAcquisitionPotionCost: potionCost,
    baseMesoPerHour: hourlyResult.totalMeso,
    totalMesoPerHour: hourlyResult.totalMeso + hourlyDropItemValue - hourlyPotionCost,
    totalMesoWithoutPotion: withoutPotionResult.totalIncome,
    dropItems: resultItems,
  }
}
