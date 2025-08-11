// 손익분기 계산기 전용 기본값들
import { type HuntingExpectationParams } from '../huntingExpectationCalculations'
import { type BreakevenItem } from '../breakevenCalculations'
import { GLOBAL_DEFAULTS } from './globalDefaults'
import { DEFAULT_BASIC_CALCULATOR_VALUES } from './basicCalculatorDefaults'
import { calculateMesoBonus, calculateItemDropBonus, type MesoCalculationParams, type ItemDropCalculationParams } from '../bonusCalculations'

// 손익분기 계산기의 기본 아이템
export const DEFAULT_BREAKEVEN_ITEM: BreakevenItem = {
  id: Date.now().toString(),
  name: '',
  dropLines: 0,
  mesoLines: 0,
  purchasePrice: 0,
  sellPrice: 0
}

// 손익분기 계산기의 기본 사냥 매개변수 (전역 기본값 + 계산기별 특화 값)
export const DEFAULT_BREAKEVEN_BASE_PARAMS: HuntingExpectationParams = {
  // 전역 기본값 사용
  monsterLevel: GLOBAL_DEFAULTS.monsterLevel,
  characterLevel: GLOBAL_DEFAULTS.characterLevel,
  feeRate: GLOBAL_DEFAULTS.feeRate,
  totalMonsters: GLOBAL_DEFAULTS.monstersPerHour, // 전역에서 계산된 값 사용
  
  // 기본 계산기의 기본 설정을 바탕으로 계산된 값들
  mesoBonus: (() => {
    const mesoParams: MesoCalculationParams = {
      inputMode: 'detail' as const,
      directValue: 0,
      globalBuffMode: DEFAULT_BASIC_CALCULATOR_VALUES.globalBuffMode as 'legion' | 'challenger',
      legionBuff: DEFAULT_BASIC_CALCULATOR_VALUES.mesoLegionBuff,
      phantomLegionMeso: DEFAULT_BASIC_CALCULATOR_VALUES.phantomLegionMeso,
      potentialMode: DEFAULT_BASIC_CALCULATOR_VALUES.mesoPotentialMode as 'lines' | 'direct',
      potentialLines: DEFAULT_BASIC_CALCULATOR_VALUES.mesoPotentialLines,
      potentialDirect: DEFAULT_BASIC_CALCULATOR_VALUES.mesoPotentialDirect,
      ability: DEFAULT_BASIC_CALCULATOR_VALUES.mesoAbility,
      artifactMode: DEFAULT_BASIC_CALCULATOR_VALUES.mesoArtifactMode as 'level' | 'percent',
      artifactLevel: DEFAULT_BASIC_CALCULATOR_VALUES.mesoArtifactLevelInput,
      artifactPercent: DEFAULT_BASIC_CALCULATOR_VALUES.mesoArtifactPercentInput,
      tallahartSymbolLevel: DEFAULT_BASIC_CALCULATOR_VALUES.tallahartSymbolLevel,
      wealthAcquisitionPotion: DEFAULT_BASIC_CALCULATOR_VALUES.wealthAcquisitionPotion,
      otherBuff: 0,
      otherNonBuff: 0,
      characterLevel: GLOBAL_DEFAULTS.characterLevel,
      monsterLevel: GLOBAL_DEFAULTS.monsterLevel
    }
    return calculateMesoBonus(mesoParams).totalBonus
  })(),
  dropRate: (() => {
    const dropParams: ItemDropCalculationParams = {
      inputMode: 'detail' as const,
      directValue: 0,
      globalBuffMode: DEFAULT_BASIC_CALCULATOR_VALUES.globalBuffMode as 'legion' | 'challenger',
      legionBuff: DEFAULT_BASIC_CALCULATOR_VALUES.dropRateLegionBuff,
      potentialMode: DEFAULT_BASIC_CALCULATOR_VALUES.dropRatePotentialMode as 'lines' | 'direct',
      potentialLines: DEFAULT_BASIC_CALCULATOR_VALUES.dropRatePotentialLines,
      potentialDirect: DEFAULT_BASIC_CALCULATOR_VALUES.dropRatePotentialDirect,
      ability: DEFAULT_BASIC_CALCULATOR_VALUES.dropRateAbility,
      artifactMode: DEFAULT_BASIC_CALCULATOR_VALUES.dropRateArtifactMode as 'level' | 'percent',
      artifactLevel: DEFAULT_BASIC_CALCULATOR_VALUES.dropRateArtifactLevelInput,
      artifactPercent: DEFAULT_BASIC_CALCULATOR_VALUES.dropRateArtifactPercentInput,
      holySymbol: DEFAULT_BASIC_CALCULATOR_VALUES.holySymbol,
      decentHolySymbol: DEFAULT_BASIC_CALCULATOR_VALUES.decentHolySymbol,
      decentHolySymbolLevel: DEFAULT_BASIC_CALCULATOR_VALUES.decentHolySymbolLevel,
      tallahartSymbolLevel: DEFAULT_BASIC_CALCULATOR_VALUES.tallahartSymbolLevel,
      pcRoomMode: false,
      wealthAcquisitionPotion: DEFAULT_BASIC_CALCULATOR_VALUES.wealthAcquisitionPotion,
      otherBuff: 0,
      otherNonBuff: 0
    }
    return calculateItemDropBonus(dropParams).totalBonus
  })()
}

// 손익분기 계산기 전용 기본값들 (전역 기본값 + 계산기별 특화 값)
export const DEFAULT_BREAKEVEN_VALUES = {
  // 전역 기본값 사용
  wealthAcquisitionPotion: GLOBAL_DEFAULTS.wealthAcquisitionPotion,
  materialsPerDay: GLOBAL_DEFAULTS.materialsPerDay,
  realTimeCalculation: GLOBAL_DEFAULTS.realTimeCalculation,
  currentDropFromPotential: GLOBAL_DEFAULTS.currentDropFromPotential,
  currentMesoFromPotential: GLOBAL_DEFAULTS.currentMesoFromPotential,
  otherDropBonus: 0,  // 재획비/잠재 제외 드롭률
  otherMesoBonus: 0,  // 재획비/잠재 제외 메소 획득량
  globalFeeRate: GLOBAL_DEFAULTS.breakevenFeeRate,
  mesoLimitEnabled: GLOBAL_DEFAULTS.mesoLimitEnabled,
  mesoLimitHours: GLOBAL_DEFAULTS.mesoLimitHours,
  normalDropExpectation: GLOBAL_DEFAULTS.normalDropExpectation,
  logDropExpectation: GLOBAL_DEFAULTS.logDropExpectation,
  
  // 손익분기 계산기 특화 값들
  items: [] as BreakevenItem[],
  baseParams: DEFAULT_BREAKEVEN_BASE_PARAMS,
  linkedPrices: {} as { [itemId: string]: boolean }
}