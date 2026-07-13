/**
 * Google Analytics 이벤트 트래킹 유틸리티
 * 프라이버시 보호를 위해 사용 횟수만 기록하고 실제 설정값이나 결과는 기록하지 않음
 */

import { canSendDetailedAnalytics, canUseAnalyticsCookies } from '../utils/cookies'

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
 * 계산 이벤트 디바운싱 간격 (ms)
 * 이 시간 내에 재발생하는 계산 이벤트는 무시됨
 */
const CALCULATION_EVENT_DEBOUNCE_MS = 300

/**
 * 마지막 계산 이벤트 발생 시간을 저장하는 Map
 * key: calculatorType, value: timestamp
 */
const lastCalculationTime = new Map<string, number>()

const PERFORMANCE_EVENT_INTERVAL_MS = 2000
const PERFORMANCE_EVENT_LIMIT = 20
const performanceEventState = new Map<string, { lastSentAt: number; count: number }>()

/**
 * 기본 이벤트 트래킹 함수
 */
export const trackEvent = (
  eventName: string,
  params?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && canUseAnalyticsCookies() && window.gtag) {
    window.gtag('event', eventName, params)
  }
}

interface HuntingAnalyticsInput {
  characterLevel: number
  monsterLevel: number
  itemDropRate: number
  mesoRate: number
  normalItemCount: number
  specialItemCount: number
  usesPotion: boolean
  mesoInputMode: 'direct' | 'detail'
  dropInputMode: 'direct' | 'detail'
  resultMode: 'custom' | 'meso_limit'
}

const bucketRange = (value: number, size: number, maximum: number) => {
  const normalizedValue = Math.max(0, Math.floor(value))
  if (normalizedValue >= maximum) return `${maximum}_plus`
  const start = Math.floor(normalizedValue / size) * size
  return `${start}_${start + size - 1}`
}

const bucketCount = (value: number) => {
  if (value <= 0) return '0'
  if (value <= 3) return '1_3'
  if (value <= 6) return '4_6'
  return '7_plus'
}

export const buildHuntingAnalyticsSnapshot = (input: HuntingAnalyticsInput) => ({
  calculator_type: 'hunting',
  character_level_bucket: bucketRange(input.characterLevel, 5, 300),
  monster_level_bucket: bucketRange(input.monsterLevel, 5, 300),
  item_drop_rate_bucket: bucketRange(input.itemDropRate, 25, 500),
  meso_rate_bucket: bucketRange(input.mesoRate, 25, 500),
  normal_item_count_bucket: bucketCount(input.normalItemCount),
  special_item_count_bucket: bucketCount(input.specialItemCount),
  uses_potion: input.usesPotion,
  meso_input_mode: input.mesoInputMode,
  drop_input_mode: input.dropInputMode,
  result_mode: input.resultMode,
})

const bucketDuration = (durationMs: number) => {
  if (durationMs < 10) return 'under_10ms'
  if (durationMs < 50) return '10_49ms'
  if (durationMs < 100) return '50_99ms'
  if (durationMs < 300) return '100_299ms'
  if (durationMs < 500) return '300_499ms'
  if (durationMs < 1000) return '500_999ms'
  return '1000ms_plus'
}

const bucketLongTaskCount = (count: number) => {
  if (count === 0) return '0'
  if (count === 1) return '1'
  if (count <= 3) return '2_3'
  return '4_plus'
}

export const buildCalculationPerformanceSnapshot = (
  calculatorType: string,
  calculationDurationMs: number,
  longTaskDurationsMs: number[]
) => {
  const maxBlockingDuration = Math.max(calculationDurationMs, ...longTaskDurationsMs, 0)

  return {
    calculator_type: calculatorType,
    calculation_duration_bucket: bucketDuration(calculationDurationMs),
    long_task_count_bucket: bucketLongTaskCount(longTaskDurationsMs.length),
    max_blocking_duration_bucket: bucketDuration(maxBlockingDuration),
    freezing_detected: maxBlockingDuration >= 500,
    long_task_observer_supported: typeof PerformanceObserver !== 'undefined',
  }
}

const canTrackCalculationPerformance = (calculatorType: string) => {
  const state = performanceEventState.get(calculatorType) ?? { lastSentAt: 0, count: 0 }
  const now = Date.now()
  if (state.count >= PERFORMANCE_EVENT_LIMIT || now - state.lastSentAt < PERFORMANCE_EVENT_INTERVAL_MS) {
    return false
  }

  performanceEventState.set(calculatorType, { lastSentAt: now, count: state.count + 1 })
  return true
}

export const measureCalculationPerformance = <T>(calculatorType: string, calculate: () => T): T => {
  if (
    typeof window === 'undefined' ||
    typeof performance === 'undefined' ||
    !canUseAnalyticsCookies() ||
    !canTrackCalculationPerformance(calculatorType)
  ) {
    return calculate()
  }

  const longTaskDurations: number[] = []
  let observer: PerformanceObserver | null = null

  if (typeof PerformanceObserver !== 'undefined') {
    try {
      observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => longTaskDurations.push(entry.duration))
      })
      observer.observe({ type: 'longtask', buffered: false })
    } catch {
      observer = null
    }
  }

  const startedAt = performance.now()
  try {
    return calculate()
  } finally {
    const calculationDuration = performance.now() - startedAt

    window.setTimeout(() => {
      observer?.takeRecords().forEach((entry) => longTaskDurations.push(entry.duration))
      observer?.disconnect()

      if (canUseAnalyticsCookies()) {
        trackEvent(
          'calculation_performance',
          buildCalculationPerformanceSnapshot(calculatorType, calculationDuration, longTaskDurations)
        )
      }
    }, 0)
  }
}

let huntingSnapshotTimer: ReturnType<typeof setTimeout> | null = null

export const trackHuntingAnalyticsSnapshot = (input: HuntingAnalyticsInput) => {
  if (typeof window === 'undefined' || !canSendDetailedAnalytics()) return

  const snapshot = buildHuntingAnalyticsSnapshot(input)
  if (huntingSnapshotTimer) clearTimeout(huntingSnapshotTimer)
  huntingSnapshotTimer = setTimeout(() => {
    if (canSendDetailedAnalytics()) trackEvent('calculation_settings', snapshot)
    huntingSnapshotTimer = null
  }, 1500)
}

/**
 * 계산기 사용 횟수 트래킹 (디바운싱 적용)
 * @param calculatorType - 계산기 타입 ('hunting', 'breakeven', 'lounge', 'hangeul_medal', 'boss_greed')
 */
export const trackCalculation = (calculatorType: string) => {
  const now = Date.now()
  const lastTime = lastCalculationTime.get(calculatorType) || 0

  // 마지막 이벤트 발생 후 DEBOUNCE 시간이 지나지 않았으면 무시
  if (now - lastTime < CALCULATION_EVENT_DEBOUNCE_MS) {
    return
  }

  // 이벤트 발생 시간 기록
  lastCalculationTime.set(calculatorType, now)

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
