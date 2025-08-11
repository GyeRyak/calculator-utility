/**
 * 메획과 아드 계산 유틸리티 함수들
 */
import { calculateLevelPenalty } from './levelPenalty'
import { getAverageMesoDropByLevel } from './mesoDropCalculation'

// 보너스 계산 결과 인터페이스
export interface BonusCalculationResult {
  totalBonus: number
  potentialBonus: number
  buffBonus: number
  exceededLimits: {
    totalExceeded: boolean
    potentialExceeded: boolean
    buffExceeded: boolean
  }
  // 메소 계산 전용 추가 정보
  bonusWithoutWealth?: number // 재획비 제외 보너스
  levelPenalty?: number // 레벨 패널티
  finalMesoBonus?: number // 레벨 패널티 적용 후 최종 보너스
}

// 메획 계산에 필요한 인터페이스
export interface MesoCalculationParams {
  inputMode: 'direct' | 'detail'
  directValue: number
  globalBuffMode: 'legion' | 'challenger' | 'none'
  legionBuff: boolean
  phantomLegionMeso: number
  potentialMode: 'lines' | 'direct'
  potentialLines: number
  potentialDirect: number
  ability: number
  artifactMode: 'level' | 'percent'
  artifactLevel: number
  artifactPercent: number
  tallahartSymbolLevel: number
  wealthAcquisitionPotion: boolean
  otherBuff: number // 기타 버프 (합연산)
  otherNonBuff: number // 기타 증가량 (합연산)
  characterLevel?: number // 캐릭터 레벨 (레벨 패널티 계산용)
  monsterLevel?: number // 몬스터 레벨 (레벨 패널티 계산용)
}

// 아드 계산에 필요한 인터페이스
export interface ItemDropCalculationParams {
  inputMode: 'direct' | 'detail'
  directValue: number
  globalBuffMode: 'legion' | 'challenger' | 'none'
  legionBuff: boolean
  potentialMode: 'lines' | 'direct'
  potentialLines: number
  potentialDirect: number
  ability: number
  artifactMode: 'level' | 'percent'
  artifactLevel: number
  artifactPercent: number
  tallahartSymbolLevel: number
  holySymbol: boolean
  decentHolySymbol: boolean
  decentHolySymbolLevel: number
  wealthAcquisitionPotion: boolean
  pcRoomMode: boolean
  otherBuff: number // 기타 버프 (합연산)
  otherNonBuff: number // 기타 증가량 (합연산)
}

/**
 * 아티팩트 보너스 계산 (Legion 아티팩트)
 * 레벨당 1%p씩 증가, 5레벨과 10레벨에서는 2%p씩 증가
 * 예: 1레벨=1%, 5레벨=6%, 10레벨=12%
 */
function calculateArtifactBonus(
  level: number,
  mode: 'level' | 'percent',
  percentValue: number
): number {
  if (mode === 'level') {
    let bonus = level
    if (level >= 5) bonus += 1 // 5레벨 이상에서 +1% 보너스
    if (level >= 10) bonus += 1 // 10레벨 이상에서 +1% 보너스
    return bonus
  } else {
    return percentValue
  }
}

/**
 * 캐릭터 레벨에 따른 메소 제한량 계산
 */
export function calculateMesoLimit(level: number): number {
  if (level >= 1 && level <= 99) {
    return 20000000 // 2000만 메소
  } else if (level >= 100 && level <= 199) {
    return 40000000 // 4000만 메소
  } else if (level >= 200 && level <= 259) {
    const exceededLevels = level - 200
    const additionalMeso = Math.floor(exceededLevels / 5) * 5000000
    return 80000000 + additionalMeso // 8000만 메소 + 5레벨당 500만 메소
  } else if (level >= 260 && level <= 300) {
    const exceededLevels = level - 260
    const additionalMeso = Math.floor(exceededLevels / 5) * 10000000
    return 150000000 + additionalMeso // 1억 5천만 메소 + 5레벨당 1000만 메소
  }
  return 0
}

/**
 * 메획 보너스 계산
 */
export function calculateMesoBonus(params: MesoCalculationParams): BonusCalculationResult {
  if (params.inputMode === 'direct') {
    return {
      totalBonus: params.directValue,
      potentialBonus: 0,
      buffBonus: 0,
      exceededLimits: {
        totalExceeded: false,
        potentialExceeded: false,
        buffExceeded: false
      }
    }
  }
  
  // 잠재능력 계산
  const potentialLines = params.potentialMode === 'lines' 
    ? params.potentialLines 
    : Math.floor(params.potentialDirect / 20)
  
  // 기타 보너스 계산
  let otherBonus = 0
  
  // 버프 계산 (유니온의 부만 포함, 최대 100%)
  let buffBonus = 0
  if (params.globalBuffMode !== 'challenger' && params.legionBuff) {
    buffBonus += 50
  }
  buffBonus += params.otherBuff
  const buffExceededBeforeLimit = buffBonus > 100
  if (buffExceededBeforeLimit) {
    buffBonus = 100
  }
  otherBonus += buffBonus
  
  // 팬텀 Legion (일반 월드에서만)
  if (params.globalBuffMode === 'legion') {
    otherBonus += params.phantomLegionMeso
  }
  
  // 어빌리티
  otherBonus += params.ability
  
  // 글로벌 버프 (챌린저스 월드 다이아 또는 Legion 아티팩트)
  if (params.globalBuffMode === 'challenger') {
    otherBonus += 20
  } else if (params.globalBuffMode === 'legion') {
    otherBonus += calculateArtifactBonus(
      params.artifactLevel,
      params.artifactMode,
      params.artifactPercent
    )
  }
  
  // 탈라하트 심볼 (0레벨: 0%, 1레벨 이상: 4+레벨%)
  if (params.tallahartSymbolLevel > 0) {
    otherBonus += params.tallahartSymbolLevel + 4
  }

  // 기타 증가량
  otherBonus += params.otherNonBuff
  
  // 핵심 보너스 계산 함수 호출
  const coreResult = calculateCoreMesoBonus(potentialLines, otherBonus, params.wealthAcquisitionPotion)
  
  // 재획비 제외 보너스 계산 (UI 표시용)
  let bonusWithoutWealth = otherBonus + (potentialLines * 20)
  if (bonusWithoutWealth > 300) bonusWithoutWealth = 300
  
  // 레벨 패널티 계산
  let levelPenalty = 1
  let finalMesoBonus = coreResult.totalBonus
  if (params.characterLevel !== undefined && params.monsterLevel !== undefined) {
    levelPenalty = calculateLevelPenalty(params.characterLevel, params.monsterLevel)
    finalMesoBonus = coreResult.totalBonus * levelPenalty
  }
  
  // buffExceeded는 이미 위에서 계산됨
  
  return {
    totalBonus: coreResult.totalBonus,
    potentialBonus: coreResult.potentialBonus,
    buffBonus,
    exceededLimits: {
      totalExceeded: coreResult.exceededLimits.totalExceeded,
      potentialExceeded: coreResult.exceededLimits.potentialExceeded,
      buffExceeded: buffExceededBeforeLimit
    },
    bonusWithoutWealth,
    levelPenalty,
    finalMesoBonus
  }
}

/**
 * 아드 보너스 계산
 */
export function calculateItemDropBonus(params: ItemDropCalculationParams): BonusCalculationResult {
  if (params.inputMode === 'direct') {
    return {
      totalBonus: params.directValue,
      potentialBonus: 0,
      buffBonus: 0,
      exceededLimits: {
        totalExceeded: false,
        potentialExceeded: false,
        buffExceeded: false
      }
    }
  }
  
  // 잠재능력 계산
  const potentialLines = params.potentialMode === 'lines'
    ? params.potentialLines
    : Math.floor(params.potentialDirect / 20)
  
  // 기타 보너스 계산
  let otherBonus = 0
  
  // 버프 계산 (유니온의 행운만 포함, 최대 100%)
  let buffBonus = 0
  if (params.globalBuffMode !== 'challenger' && params.legionBuff) {
    buffBonus += 50
  }
  buffBonus += params.otherBuff
  const buffExceededBeforeLimit = buffBonus > 100
  if (buffExceededBeforeLimit) {
    buffBonus = 100
  }
  otherBonus += buffBonus
  
  // 어빌리티
  otherBonus += params.ability
  
  // 글로벌 버프 (챌린저스 월드 다이아 또는 Legion 아티팩트)
  if (params.globalBuffMode === 'challenger') {
    otherBonus += 20
  } else if (params.globalBuffMode === 'legion') {
    otherBonus += calculateArtifactBonus(
      params.artifactLevel,
      params.artifactMode,
      params.artifactPercent
    )
  }
  
  // 홀리 심볼 (둘 중 하나만 사용 가능)
  if (params.holySymbol && !params.decentHolySymbol) {
    otherBonus += 30
  } else if (params.decentHolySymbol && !params.holySymbol) {
    // Decent Holy Symbol: 1레벨=14%, 3레벨당 1% 추가
    const basePercent = 14
    const additionalPercent = Math.floor(params.decentHolySymbolLevel / 3)
    otherBonus += basePercent + additionalPercent
  }
  
  // 탈라하트 심볼 (0레벨: 0%, 1레벨 이상: 4+레벨%)
  if (params.tallahartSymbolLevel > 0) {
    otherBonus += params.tallahartSymbolLevel + 4
  }

  // PC방 (10% 추가)
  if (params.pcRoomMode) {
    otherBonus += 10
  }

  // 기타 증가량
  otherBonus += params.otherNonBuff
  
  // 핵심 보너스 계산 함수 호출
  const coreResult = calculateCoreDropBonus(potentialLines, otherBonus, params.wealthAcquisitionPotion)
  
  // buffExceeded는 이미 위에서 계산됨
  
  return {
    totalBonus: coreResult.totalBonus,
    potentialBonus: coreResult.potentialBonus,
    buffBonus,
    exceededLimits: {
      totalExceeded: coreResult.exceededLimits.totalExceeded,
      potentialExceeded: coreResult.exceededLimits.potentialExceeded,
      buffExceeded: buffExceededBeforeLimit
    }
  }
}

/**
 * 메소 제한량 도달 시간 계산
 */
export function calculateMesoLimitTime(
  characterLevel: number,
  monsterLevel: number,
  monsterCount: number,
  huntTime: number
): number {
  const mesoLimit = calculateMesoLimit(characterLevel)
  const baseMesoPerMob = getAverageMesoDropByLevel(monsterLevel)
  const mobsForMesoLimit = Math.ceil(mesoLimit / baseMesoPerMob)
  const mobsPerMinute = monsterCount / huntTime
  return mobsForMesoLimit / mobsPerMinute
}

/**
 * 핵심 메소 보너스 계산 (잠재능력 + 기타효과 + 재물 획득의 비약)
 */
export function calculateCoreMesoBonus(
  potentialLines: number,
  otherBonuses: number = 0,
  wealthAcquisitionPotion: boolean = false
): BonusCalculationResult {
  // 잠재능력 (최대 100%)
  let potentialBonus = potentialLines * 20
  const potentialExceeded = potentialBonus > 100
  if (potentialExceeded) {
    potentialBonus = 100
  }
  
  // 재물 획득의 비약 적용 전 총합 (최대 300%)
  let totalBeforePotion = potentialBonus + otherBonuses
  const totalExceededBeforePotion = totalBeforePotion > 300
  if (totalExceededBeforePotion) {
    totalBeforePotion = 300
  }
  
  // 재물 획득의 비약 (곱연산 1.2배)
  let finalTotal = totalBeforePotion
  if (wealthAcquisitionPotion) {
    finalTotal = 20 + totalBeforePotion * 12 / 10 // 소숫점 연산 회피
  }
  
  return {
    totalBonus: finalTotal,
    potentialBonus,
    buffBonus: 0, // 핵심 함수에서는 버프 보너스 분리하지 않음
    exceededLimits: {
      totalExceeded: totalExceededBeforePotion,
      potentialExceeded,
      buffExceeded: false // 핵심 함수에서는 버프 exceeded 계산하지 않음
    }
  }
}

/**
 * 핵심 드롭 보너스 계산 (잠재능력 + 기타효과 + 재물 획득의 비약)
 */
export function calculateCoreDropBonus(
  potentialLines: number,
  otherBonuses: number = 0,
  wealthAcquisitionPotion: boolean = false
): BonusCalculationResult {
  // 잠재능력 (최대 200%)
  let potentialBonus = potentialLines * 20
  const potentialExceeded = potentialBonus > 200
  if (potentialExceeded) {
    potentialBonus = 200
  }
  
  // 재물 획득의 비약 효과 (+20% 합연산)
  let wealthBonusEffect = 0
  if (wealthAcquisitionPotion) {
    wealthBonusEffect = 20
  }
  
  // 총합 (최대 400%)
  let totalBonus = potentialBonus + otherBonuses + wealthBonusEffect
  const totalExceeded = totalBonus > 400
  if (totalExceeded) {
    totalBonus = 400
  }
  
  return {
    totalBonus,
    potentialBonus,
    buffBonus: 0, // 핵심 함수에서는 버프 보너스 분리하지 않음
    exceededLimits: {
      totalExceeded,
      potentialExceeded,
      buffExceeded: false // 핵심 함수에서는 버프 exceeded 계산하지 않음
    }
  }
}