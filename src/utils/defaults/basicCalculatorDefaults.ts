// 기본 계산기(사냥 기댓값 계산기) 전용 기본값들
import { SOL_ERDA_FRAGMENT_ID } from '../huntingExpectationCalculations'
import { GLOBAL_DEFAULTS } from './globalDefaults'

export interface DefaultDropItem {
  id: string
  name: string
  price: number // 만 메소 단위
  dropRate: number // % 단위
  directUse: boolean // 탈세 여부
  type: 'normal' | 'log' // 드롭률 타입
}

// 기본 계산기의 기본 드롭 아이템들
export const DEFAULT_NORMAL_DROP_ITEMS: DefaultDropItem[] = [
  { id: 'reindeer-milk', name: '순록의 우유', price: 0.275, dropRate: 0.565, directUse: true, type: 'normal' },
  { id: 'twilight-dew', name: '황혼의 이슬', price: 0.51, dropRate: 0.565, directUse: true, type: 'normal' },
  { id: 'spell-trace', name: '주문의 흔적', price: 0.2, dropRate: 1.2, directUse: false, type: 'normal' }
]

export const DEFAULT_LOG_DROP_ITEMS: DefaultDropItem[] = [
  { id: SOL_ERDA_FRAGMENT_ID, name: '솔 에르다 조각', price: 600, dropRate: 0.0425, directUse: false, type: 'log' },
  { id: 'core-gemstone', name: '코어 젬스톤', price: 12, dropRate: 0.028, directUse: false, type: 'log' },
  { id: 'symbol', name: '심볼', price: 60, dropRate: 0.00092, directUse: false, type: 'log' }
]

// 모든 드롭 아이템을 하나의 배열로 통합
export const DEFAULT_ALL_DROP_ITEMS: DefaultDropItem[] = [
  ...DEFAULT_NORMAL_DROP_ITEMS,
  ...DEFAULT_LOG_DROP_ITEMS
]

// 기본 계산기 전용 기본값들 (전역 기본값 + 계산기별 특화 값)
export const DEFAULT_BASIC_CALCULATOR_VALUES = {
  // 전역 기본값 사용
  monsterLevel: GLOBAL_DEFAULTS.monsterLevel,
  characterLevel: GLOBAL_DEFAULTS.characterLevel,
  feeRate: GLOBAL_DEFAULTS.feeRate,
  huntTime: GLOBAL_DEFAULTS.huntTime,
  monsterCount: GLOBAL_DEFAULTS.monsterCount,
  wealthAcquisitionPotion: GLOBAL_DEFAULTS.wealthAcquisitionPotion,
  
  // 기본 계산기 특화 값들
  mesoBonus: 40,
  dropRate: 60,
  resultTime: 0,
  isCustomHuntTime: false,
  huntTimeUnit: 'minutes',
  customHuntTimeValue: 7.5,
  isCustomResultTime: true,
  resultTimeUnit: 'meso_limit',
  customResultTimeValue: 0,
  mesoInputMode: 'detail',
  dropRateInputMode: 'detail',
  mesoLegionBuff: false,
  phantomLegionMeso: 4,
  mesoPotentialMode: 'lines',
  mesoPotentialLines: 0,
  mesoPotentialDirect: 0,
  mesoAbility: 20,
  globalBuffMode: 'legion',
  mesoArtifactLevel: 10,
  mesoArtifactMode: 'level',
  mesoArtifactLevelInput: 10,
  mesoArtifactPercentInput: 12,
  dropRateLegionBuff: false,
  dropRatePotentialMode: 'lines',
  dropRatePotentialLines: 0,
  dropRatePotentialDirect: 0,
  dropRateAbility: 15,
  dropRateArtifactLevel: 10,
  dropRateArtifactMode: 'level',
  dropRateArtifactLevelInput: 10,
  dropRateArtifactPercentInput: 12,
  holySymbol: false,
  decentHolySymbol: true,
  decentHolySymbolLevel: 30,
  spottingSmallChange: true,
  spottingSmallChangeLevel: 3,
  showWealthPotionCost: true,
  wealthAcquisitionPotionPrice: 300,
  tallahartSymbolLevel: 0,
  autoCalculate: true
}