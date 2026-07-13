import { describe, expect, it } from 'vitest'

import {
  calculateCoreDropBonus,
  calculateCoreMesoBonus,
  calculateItemDropBonus,
  calculateMesoBonus,
} from '../bonusCalculations'
import { calculateBasicCalculator } from '../basicCalculatorCalculation'
import {
  calculateItemBonus,
  calculateNetCost,
  formatPeriod,
  validateLimits,
} from '../breakevenCalculations'
import {
  calculateHuntingExpectation,
  calculateDropMultiplier,
  calculateEffectiveDropRateBonus,
  calculateLogDropMultiplier,
  calculateMesoDropRate,
  calculateNormalDropMultiplier,
} from '../huntingExpectationCalculations'
import { calculateLevelPenalty } from '../levelPenalty'
import { calculateMesoDropByLevel, isOptimalMesoLevel } from '../mesoDropCalculation'
import {
  calculateGrandAuthenticSymbolBreakevenMaterials,
  calculateGrandAuthenticSymbolBonus,
  getGrandAuthenticSymbolRemainingCost,
  GRAND_AUTHENTIC_SYMBOL_MAX_LEVEL,
} from '../grandAuthenticSymbol'
import {
  CORE_GEMSTONE_BASE_DROP_RATE,
  SOL_ERDA_FRAGMENT_BASE_DROP_RATE,
  SYMBOL_BASE_DROP_RATE,
} from '../defaults/dropItemDefaults'
import { DEFAULT_LOG_DROP_ITEMS, DEFAULT_NORMAL_DROP_ITEMS } from '../defaults/basicCalculatorDefaults'
import { GLOBAL_DEFAULTS } from '../defaults/globalDefaults'
import { validateGeardrakSymbol, validateTallahartSymbol } from '../validations'

describe('기본 입력값', () => {
  it('캐릭터와 몬스터 레벨 및 기본 아이템 값을 사용한다', () => {
    expect(GLOBAL_DEFAULTS.characterLevel).toBe(280)
    expect(GLOBAL_DEFAULTS.monsterLevel).toBe(281)
    expect(DEFAULT_NORMAL_DROP_ITEMS.map(({ dropRate }) => dropRate)).toEqual([0.5, 0.5, 1])
    expect(DEFAULT_LOG_DROP_ITEMS.find(({ id }) => id === 'symbol')?.price).toBe(20)
  })
})

describe('특수 드롭 기본값', () => {
  const legacyModuloMultiplier = (displayedDropRate: number, dropRateConstant = 50) => {
    const divisor = Math.floor(
      1_000_000_000 / (1 + displayedDropRate * (dropRateConstant / 100) / 100)
    )
    const mappingsPerWinningRemainder = Math.floor(2 ** 32 / divisor) + 1
    return mappingsPerWinningRemainder * 1_000_000_000 / 2 ** 32
  }

  it('모듈러 편향으로 보정한 통계와 가까운 정수 임계값을 사용한다', () => {
    const solErdaSamples = [
      { dropRate: 154, monsters: 554_200, drops: 432 },
      { dropRate: 174, monsters: 431_950, drops: 383 },
      { dropRate: 194, monsters: 457_600, drops: 423 },
      { dropRate: 264, monsters: 460_800, drops: 446 },
      { dropRate: 0, monsters: 28_375, drops: 20 },
      { dropRate: 196, monsters: 131_857, drops: 111 },
      { dropRate: 239, monsters: 540_000, drops: 514 },
      { dropRate: 259, monsters: 540_000, drops: 525 },
      { dropRate: 309, monsters: 540_000, drops: 617 },
    ]
    const solErdaDrops = solErdaSamples.reduce((sum, sample) => sum + sample.drops, 0)
    const solErdaExposure = solErdaSamples.reduce(
      (sum, sample) => sum + sample.monsters * legacyModuloMultiplier(sample.dropRate),
      0
    )
    const estimatedSolErdaRate = solErdaDrops / solErdaExposure * 100

    const coreGemstoneRateAt259 = (1_119 + 636)
      / ((1_723_459 + 1_000_000) * legacyModuloMultiplier(259)) * 100
    const symbolRateFromSameHuntRatio = 0.7 / 13 * CORE_GEMSTONE_BASE_DROP_RATE

    expect(Math.abs(SOL_ERDA_FRAGMENT_BASE_DROP_RATE - estimatedSolErdaRate)).toBeLessThan(0.0001)
    expect(Math.abs(CORE_GEMSTONE_BASE_DROP_RATE - coreGemstoneRateAt259)).toBeLessThan(0.0005)
    expect(Math.abs(SYMBOL_BASE_DROP_RATE - symbolRateFromSameHuntRatio)).toBeLessThan(0.00002)
    expect([
      SOL_ERDA_FRAGMENT_BASE_DROP_RATE * 10_000_000,
      CORE_GEMSTONE_BASE_DROP_RATE * 10_000_000,
      SYMBOL_BASE_DROP_RATE * 10_000_000,
    ].map(Math.round)).toEqual([425_000, 280_000, 15_000])
    expect(DEFAULT_LOG_DROP_ITEMS.map(({ dropRate }) => dropRate)).toEqual([
      SOL_ERDA_FRAGMENT_BASE_DROP_RATE,
      CORE_GEMSTONE_BASE_DROP_RATE,
      SYMBOL_BASE_DROP_RATE,
    ])
  })
})

describe('사냥 기댓값 계산', () => {
  it('메소 드롭률과 아이템 드롭 배율을 현행 공식으로 계산한다', () => {
    expect(calculateMesoDropRate(0)).toBeCloseTo(0.744)
    expect(calculateMesoDropRate(44)).toBe(1)
    expect(calculateMesoDropRate(100)).toBe(1)
    expect(calculateMesoDropRate(500)).toBe(1)
    expect(calculateNormalDropMultiplier(100)).toBe(2.24)
    expect(calculateLogDropMultiplier(100)).toBe(1.74)
    expect(calculateEffectiveDropRateBonus(80, 50)).toBe(64)
    expect(calculateEffectiveDropRateBonus(80, 10)).toBe(32)
    expect(calculateEffectiveDropRateBonus(80, 0)).toBe(24)
    expect(calculateDropMultiplier(80, 50)).toBeCloseTo(1.64)
  })

  it('메소, 일반 드롭, 특수 드롭의 기댓값을 합산한다', () => {
    const result = calculateHuntingExpectation({
      monsterLevel: 100,
      totalMonsters: 100,
      mesoBonus: 0,
      dropRate: 0,
      feeRate: 0,
      characterLevel: 100,
      normalDropItems: [{ id: 'normal', name: '일반', price: 1, dropRate: 1 }],
      logDropItems: [{ id: 'log', name: '특수', price: 1, dropRate: 1, dropRateConstant: 50 }],
    })

    expect(result).toMatchObject({
      mesoDropRate: 74.4,
      mesoPerDrop: 750,
      totalMeso: 55_800,
      totalDropItemValue: 24_800,
      totalIncome: 80_600,
    })
    expect(result.dropItems.map(({ expectedCount }) => expectedCount)).toEqual([1.24, 1.24])
  })

  it('아이템별 퍼센트 드롭 상수를 독립적으로 적용한다', () => {
    const result = calculateHuntingExpectation({
      monsterLevel: 100,
      totalMonsters: 100,
      mesoBonus: 0,
      dropRate: 80,
      feeRate: 0,
      normalDropItems: [{ id: 'normal', name: '일반', price: 0, dropRate: 1 }],
      logDropItems: [
        { id: 'special', name: '특수', price: 0, dropRate: 1, dropRateConstant: 50 },
        { id: 'event', name: '이벤트', price: 0, dropRate: 1, dropRateConstant: 10 },
      ],
    })

    const expectedMultipliers = [2.04, 1.64, 1.32]
    result.dropItems.forEach((item, index) => {
      expect(item.dropMultiplier).toBeCloseTo(expectedMultipliers[index])
      expect(item.expectedCount).toBeCloseTo(expectedMultipliers[index])
    })
  })
})

describe('그랜드 어센틱심볼', () => {
  it('지역 개방 레벨 미만에서는 계산을 막지 않는 경고를 반환한다', () => {
    expect(validateTallahartSymbol(289, 1)).toMatchObject([{ severity: 'warning' }])
    expect(validateTallahartSymbol(290, 1)).toEqual([])
    expect(validateGeardrakSymbol(294, 1)).toMatchObject([{ severity: 'warning' }])
    expect(validateGeardrakSymbol(295, 1)).toEqual([])
  })

  it('탈라하트와 기어드락 보너스를 독립적으로 합산한다', () => {
    const commonParams = {
      inputMode: 'detail' as const,
      directValue: 0,
      globalBuffMode: 'none' as const,
      legionBuff: false,
      potentialMode: 'lines' as const,
      potentialLines: 0,
      potentialDirect: 0,
      ability: 0,
      artifactMode: 'level' as const,
      artifactLevel: 0,
      artifactPercent: 0,
      tallahartSymbolLevel: 3,
      geardrakSymbolLevel: 5,
      wealthAcquisitionPotion: false,
      otherBuff: 0,
      otherNonBuff: 0,
    }

    expect(calculateMesoBonus({
      ...commonParams,
      phantomLegionMeso: 0,
    }).totalBonus).toBe(16)
    expect(calculateItemDropBonus({
      ...commonParams,
      holySymbol: false,
      decentHolySymbol: false,
      decentHolySymbolLevel: 0,
      pcRoomMode: false,
    }).totalBonus).toBe(16)
  })

  it('11레벨 효과와 심볼별 누적 비용을 사용한다', () => {
    expect(GRAND_AUTHENTIC_SYMBOL_MAX_LEVEL).toBe(11)
    expect(calculateGrandAuthenticSymbolBonus(0)).toBe(0)
    expect(calculateGrandAuthenticSymbolBonus(11)).toBe(15)
    expect(getGrandAuthenticSymbolRemainingCost('tallahart', 0)).toBe(16_072_800_000)
    expect(getGrandAuthenticSymbolRemainingCost('geardrak', 0)).toBe(20_181_300_000)
    expect(getGrandAuthenticSymbolRemainingCost('tallahart', 10)).toBe(3_718_000_000)
    expect(getGrandAuthenticSymbolRemainingCost('geardrak', 10)).toBe(4_708_000_000)
  })

  it('강화 비용을 소재당 추가 수익으로 나눠 손익분기를 계산한다', () => {
    expect(calculateGrandAuthenticSymbolBreakevenMaterials(1_000, 40)).toBe(25)
    expect(calculateGrandAuthenticSymbolBreakevenMaterials(0, 40)).toBe(0)
    expect(calculateGrandAuthenticSymbolBreakevenMaterials(1_000, 0)).toBe(Infinity)
  })
})

describe('기본 계산기 파이프라인', () => {
  it('화면에서 사용하는 기간 및 시간당 결과를 동일하게 조합한다', () => {
    const result = calculateBasicCalculator({
      monsterLevel: 100,
      characterLevel: 100,
      monsterCount: 100,
      huntTime: 1,
      resultTime: 1,
      resultTimeUnit: 'minutes',
      isCustomResultTime: true,
      feeRate: 0,
      spottingSmallChange: false,
      spottingSmallChangeLevel: 0,
      wealthAcquisitionPotion: false,
      showWealthPotionCost: false,
      wealthAcquisitionPotionPrice: 0,
      dropItems: [
        { id: 'normal', name: '일반', price: 1, dropRate: 1, type: 'normal' },
        { id: 'log', name: '특수', price: 1, dropRate: 1, dropRateConstant: 50, type: 'log' },
      ],
      mesoParams: {
        inputMode: 'direct', directValue: 0, globalBuffMode: 'none', legionBuff: false,
        phantomLegionMeso: 0, potentialMode: 'lines', potentialLines: 0,
        potentialDirect: 0, ability: 0, artifactMode: 'level', artifactLevel: 0,
        artifactPercent: 0, tallahartSymbolLevel: 0, wealthAcquisitionPotion: false,
        otherBuff: 0, otherNonBuff: 0, characterLevel: 100, monsterLevel: 100,
      },
      itemDropParams: {
        inputMode: 'direct', directValue: 0, globalBuffMode: 'none', legionBuff: false,
        potentialMode: 'lines', potentialLines: 0, potentialDirect: 0, ability: 0,
        artifactMode: 'level', artifactLevel: 0, artifactPercent: 0,
        tallahartSymbolLevel: 0, holySymbol: false, decentHolySymbol: false,
        decentHolySymbolLevel: 0, wealthAcquisitionPotion: false, pcRoomMode: false,
        otherBuff: 0, otherNonBuff: 0,
      },
    })

    expect(result).toMatchObject({
      baseMeso: 55_800,
      totalIncome: 80_600,
      totalMeso: 80_600,
      baseMesoPerHour: 3_348_000,
      totalMesoPerHour: 4_836_000,
      totalMesoWithoutPotion: 80_600,
    })
    expect(Array.from(result.dropItems.keys())).toEqual(['normal', 'log'])
  })
})

describe('메소와 레벨 보정', () => {
  it('몬스터 레벨 구간별 메소 범위를 유지한다', () => {
    expect(calculateMesoDropByLevel(1)).toEqual({
      minimum: 1,
      maximum: 1,
      average: 1,
      currentAverageMultiplier: 1,
    })
    expect(calculateMesoDropByLevel(100)).toEqual({
      minimum: 600,
      maximum: 900,
      average: 750,
      currentAverageMultiplier: 7.5,
    })
    expect(isOptimalMesoLevel(91)).toBe(true)
  })

  it('레벨 차이 경계의 패널티를 유지한다', () => {
    expect(calculateLevelPenalty(130, 100)).toBe(0)
    expect(calculateLevelPenalty(129, 100)).toBe(0.03)
    expect(calculateLevelPenalty(111, 100)).toBe(0.98)
    expect(calculateLevelPenalty(90, 100)).toBe(1)
    expect(calculateLevelPenalty(89, 100)).toBe(0.97)
    expect(calculateLevelPenalty(66, 100)).toBe(0)
  })
})

describe('보너스와 손익분기 보조 계산', () => {
  it('메획과 드롭률 상한 및 재획비 효과를 적용한다', () => {
    expect(calculateCoreMesoBonus(3, 40, true)).toMatchObject({
      totalBonus: 140,
      potentialBonus: 60,
    })
    expect(calculateCoreMesoBonus(6, 250, false)).toMatchObject({
      totalBonus: 300,
      potentialBonus: 100,
      exceededLimits: { potentialExceeded: true, totalExceeded: true },
    })
    expect(calculateCoreDropBonus(11, 250, true)).toMatchObject({
      totalBonus: 400,
      potentialBonus: 200,
      exceededLimits: { potentialExceeded: true, totalExceeded: true },
    })
  })

  it('장비 비용과 기간 표시를 유지한다', () => {
    const item = {
      id: 'item',
      name: '아이템',
      dropLines: 2,
      mesoLines: 1,
      purchasePrice: 100,
      sellPrice: 80,
    }

    expect(calculateNetCost(item, 5)).toBe(24)
    expect(calculateItemBonus(item)).toEqual({ dropBonus: 40, mesoBonus: 20 })
    expect(formatPeriod(0)).toBe('0일')
    expect(formatPeriod(45)).toBe('1개월 2주 1일')
    expect(validateLimits(20, 20, 200, 100)).toHaveLength(2)
  })
})
