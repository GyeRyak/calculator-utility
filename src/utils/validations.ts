/**
 * 계산기 입력값 유효성 검사 유틸리티
 */

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
 * 모든 입력 검증을 한 번에 수행
 */
export function validateAllInputs(inputs: {
  dropRateAbility: number
  mesoAbility: number
  characterLevel: number
  tallahartSymbolLevel: number
}): ValidationError[] {
  const errors: ValidationError[] = []
  
  // 레전더리 어빌리티 검증
  errors.push(...validateLegendaryAbility(inputs.dropRateAbility, inputs.mesoAbility))
  
  // 탈라하트 심볼 검증
  errors.push(...validateTallahartSymbol(inputs.characterLevel, inputs.tallahartSymbolLevel))
  
  return errors
}