/**
 * 계산기 입력값 유효성 검사 유틸리티
 */

import { calculateLevelPenalty } from './levelPenalty'
import { getCurrentMesoMultiplier, maxAverageMultiplier, maxAverageMinMonsterLevel, isOptimalMesoLevel } from './mesoDropCalculation'

export interface ValidationError {
  field: string
  message: string
  shortMessage?: string // 호버 툴팁용 짧은 메시지
  severity: 'warning' | 'error'
}

/**
 * 레전더리 어빌리티 유효성 검사
 * 16~20% 어빌리티는 하나만 가능
 */
export function validateLegendaryAbility(
  dropRateAbility: number, 
  mesoAbility: number
): ValidationError[] {
  const errors: ValidationError[] = []
  
  const isDropLegendary = dropRateAbility >= 16
  const isMesoLegendary = mesoAbility >= 16
  
  // 둘 다 16% 이상인 경우
  if (isDropLegendary && isMesoLegendary) {
    errors.push({
      field: 'ability',
      message: '아이템 드롭률 어빌리티와 메소 획득량 어빌리티가 모두 레전더리 구간으로 입력되어 있습니다.',
      shortMessage: '레전더리 어빌리티가 2줄 이상일 수 없습니다',
      severity: 'error'
    })
  }
  
  return errors
}

/**
 * 탈라하트 심볼 레벨 제한 검사
 * 캐릭터 레벨 290 이상에서만 사용 가능
 */
export function validateTallahartSymbol(
  characterLevel: number, 
  tallahartSymbolLevel: number
): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (tallahartSymbolLevel > 0 && characterLevel < 290) {
    errors.push({
      field: 'tallahartSymbol',
      message: '탈라하트를 개방할 수 없는 레벨임에도 탈라하트 심볼이 장착되어 있습니다.',
      shortMessage: '탈라하트 지역을 개방할 수 없는 레벨입니다',
      severity: 'error'
    })
  }
  
  return errors
}

/**
 * 몬스터/캐릭터 레벨 차이 패널티 경고
 */
export function checkLevelPenaltyWarning(
  monsterLevel: number,
  characterLevel: number
): ValidationError[] {
  const warnings: ValidationError[] = []
  
  const penaltyRate = calculateLevelPenalty(characterLevel, monsterLevel)
  const levelDifference = characterLevel - monsterLevel
  
  // 패널티가 있는 경우 (1.0 미만)
  if (penaltyRate < 1.0) {
    const penaltyPercent = Math.round((1.0 - penaltyRate) * 100) // 정수로 표시
    const levelDiffSign = levelDifference >= 0 ? '+' : '' // 음수는 자동으로 - 표시됨
    
    // 권장 레벨 범위 계산 (캐릭터 레벨 ±10)
    const recommendedMin = characterLevel - 10
    const recommendedMax = characterLevel + 10
    
    warnings.push({
      field: 'levelPenalty',
      message: `캐릭터 레벨과 몬스터 레벨의 차이가 ${levelDiffSign}${levelDifference}이므로 ${penaltyPercent}% 메소 패널티가 적용 중입니다. 레벨 ${recommendedMin}~${recommendedMax} 구간 몬스터를 사냥하시는 것을 권장드립니다.`,
      shortMessage: `레벨 차이 패널티 ${penaltyPercent}% 적용 중`,
      severity: 'warning'
    })
  }
  
  return warnings
}

/**
 * 메소 드롭률 100% 미달 경고
 */
export function checkMesoDropRateWarning(
  mesoDropRate: number,
  currentItemDropRate?: number
): ValidationError[] {
  const warnings: ValidationError[] = []
  
  if (mesoDropRate < 100) {
    // 메소 드롭률 100%에 필요한 아이템 드롭률 계산 (대략적인 공식)
    // 메소 드롭률 ≈ min(100, 아이템 드롭률 * 1.5) 정도로 추정
    const requiredDropRate = Math.ceil(100 / 1.5) // 약 67%
    
    warnings.push({
      field: 'mesoDropRate',
      message: `아이템 드롭률이 ${requiredDropRate}% 이상이어야 메소가 100%로 드랍됩니다. 사냥 최대 수익원은 드롭 메소이므로, 아이템 드롭률을 올려 메소 드롭률을 현재 ${mesoDropRate.toFixed(1)}%에서 100%로 올려주시는 것을 권장드립니다.`,
      shortMessage: '메소 드롭률 100% 미달',
      severity: 'warning'
    })
  }
  
  return warnings
}

/**
 * 재물 획득의 비약 미사용 경고
 */
export function checkWealthPotionWarning(
  wealthAcquisitionPotion: boolean
): ValidationError[] {
  const warnings: ValidationError[] = []
  
  if (!wealthAcquisitionPotion) {
    warnings.push({
      field: 'wealthPotion',
      message: '재물 획득의 비약의 경우 메소 획득량에 20%를 곱연산으로 올려주므로 사용하시는 것을 권장드립니다. 사용 및 비용 계산 체크 시 재물 획득의 비약으로 얻을 수 있는 추가 기댓값을 확인하실 수 있습니다.',
      shortMessage: '재물 획득의 비약 미사용',
      severity: 'warning'
    })
  }
  
  return warnings
}

/**
 * 메소 배율 비최적화 경고
 */
export function checkMesoMultiplierWarning(
  monsterLevel: number
): ValidationError[] {
  const warnings: ValidationError[] = []
  
  if (!isOptimalMesoLevel(monsterLevel)) {
    const currentMultiplier = getCurrentMesoMultiplier(monsterLevel)
    
    warnings.push({
      field: 'mesoMultiplier',
      message: `어째서인지 잘 모르겠지만, 사냥 대상 몬스터 레벨(${monsterLevel})이 과도하게 낮습니다. 해당 구간의 몬스터 레벨당 메소 배율은 ${currentMultiplier.toFixed(1)}배입니다. 최대 메소 수익을 위해 ${maxAverageMinMonsterLevel}레벨 이상의 몬스터(${maxAverageMultiplier}배)를 사냥하시는 것을 권장드립니다.`,
      shortMessage: `메소 배율 ${currentMultiplier.toFixed(1)}배로 최적화되어있지 않음`,
      severity: 'warning'
    })
  }
  
  return warnings
}

/**
 * 모든 입력 검증을 한 번에 수행 (에러 + 경고)
 */
export function validateAllInputs(inputs: {
  dropRateAbility: number
  mesoAbility: number
  characterLevel: number
  tallahartSymbolLevel: number
  monsterLevel: number
  mesoDropRate: number
  wealthAcquisitionPotion: boolean
}): ValidationError[] {
  const results: ValidationError[] = []
  
  // 에러 검증
  results.push(...validateLegendaryAbility(inputs.dropRateAbility, inputs.mesoAbility))
  results.push(...validateTallahartSymbol(inputs.characterLevel, inputs.tallahartSymbolLevel))
  
  // 경고 검증
  results.push(...checkLevelPenaltyWarning(inputs.monsterLevel, inputs.characterLevel))
  results.push(...checkMesoDropRateWarning(inputs.mesoDropRate))
  results.push(...checkWealthPotionWarning(inputs.wealthAcquisitionPotion))
  results.push(...checkMesoMultiplierWarning(inputs.monsterLevel))
  
  return results
}