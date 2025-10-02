/**
 * Google Analytics 이벤트 트래킹 유틸리티
 * 프라이버시 보호를 위해 사용 횟수만 기록하고 실제 설정값이나 결과는 기록하지 않음
 */

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string | Date,
      config?: Record<string, any>
    ) => void
  }
}

/**
 * 기본 이벤트 트래킹 함수
 */
export const trackEvent = (
  eventName: string,
  params?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params)
  }
}

/**
 * 계산기 사용 횟수 트래킹
 * @param calculatorType - 계산기 타입 ('hunting', 'breakeven', 'lounge', 'hangeul_medal', 'boss_greed')
 */
export const trackCalculation = (calculatorType: string) => {
  trackEvent('calculate', {
    calculator_type: calculatorType,
  })
}

/**
 * 슬롯 기능 사용 트래킹
 * @param action - 슬롯 동작 ('save', 'load', 'export', 'import', 'reset')
 * @param calculatorType - 계산기 타입
 */
export const trackSlotAction = (
  action: 'save' | 'load' | 'export' | 'import' | 'reset',
  calculatorType: string
) => {
  trackEvent('slot_action', {
    action,
    calculator_type: calculatorType,
  })
}

/**
 * 한글날 이벤트 계산기 무작위 재설정 사용 트래킹
 */
export const trackRandomReset = () => {
  trackEvent('random_reset', {
    calculator_type: 'hangeul_medal',
  })
}

/**
 * 설정 공유 기능 사용 트래킹
 * @param action - 공유 동작 ('copy_text', 'copy_image')
 * @param calculatorType - 계산기 타입
 */
export const trackShareAction = (
  action: 'copy_text' | 'copy_image',
  calculatorType: string
) => {
  trackEvent('share_action', {
    action,
    calculator_type: calculatorType,
  })
}
