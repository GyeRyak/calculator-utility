/**
 * 아지트 듀오 휴게실 경험치 최적화 계산기
 *
 * Dynamic Programming을 사용하여 9주간 최적 스킬 투자 전략을 계산합니다.
 *
 * ================================
 * 휴게실 이벤트 스펙 정보
 * ================================
 *
 * 이벤트 기간: 2025년 9월 18일(목) ~ 11월 19일(수) (총 9주)
 *
 * 포인트 획득:
 * - 레벨 범위 몬스터 2,500마리 처치 시 1포인트 획득
 * - 주간 최대 획득량: 20포인트 (매주 목요일 오전 0시 초기화)
 * - 총 획득 가능 포인트: 9주 × 20P = 180포인트
 *
 * 스킬 레벨업 필요 포인트:
 * - 1~3레벨: 각 레벨당 15포인트
 * - 4~7레벨: 각 레벨당 20포인트
 * - 8레벨: 25포인트
 * - 하나의 스킬을 마스터(8레벨)하는 데 총 150포인트 필요
 *
 * 스킬 효과:
 * - 장기 휴식: 잠수 시간 증가 + 경험치 감소 페널티 (높은 레벨일수록 시간↑, 페널티↑)
 * - 역동적 휴식: 경험치 무작위 증감 (평균적으로 증가, 높은 레벨일수록 효과↑)
 * - 간식 충전: 경험치 증가 보너스 (높은 레벨일수록 효과↑)
 *
 * 부스트 효과 (중복 적용 불가, 가장 높은 효과만 적용):
 * - 휴게실 콤보 루틴 (스킬 2개 5레벨 이상): 경험치 획득량 1.68배
 * - 휴식 삼종 세트 (스킬 3개 3레벨 이상): 경험치 획득량 1.59배
 * - 휴식 스페셜리스트 (스킬 1개 7레벨 이상): 경험치 획득량 1.58배
 * - 휴게실 입문자 (스킬 1개 5레벨 이상, 다른 스킬 1개 3레벨 이상): 경험치 획득량 1.56배
 *
 * 핵심 메커니즘:
 * 1. 장기 휴식의 특수성: 업그레이드 효과가 이후 시간에만 적용 (소급 적용 안됨)
 * 2. 역동적 휴식/간식 충전: 업그레이드 효과가 해당 주 전체 시간에 소급 적용
 * 3. 선소진 vs 선업글: 장기 휴식 업그레이드 시 타이밍 선택이 총 경험치에 영향
 *
 * 최적 전략:
 * - 초반에 역동적 휴식 또는 간식 충전에 최소 투자로 기본 배율 확보
 * - 이후 장기 휴식에 집중 투자하여 '휴식 스페셜리스트' 부스트 조기 활성화
 * - 부스트 활성화 후 남는 포인트로 다른 스킬 투자하여 총 배율 최대화
 *
 * ================================
 */

// 이벤트 기본 정보
export const LOUNGE_EVENT = {
  START_DATE: new Date('2025-09-18'), // 이벤트 시작일 (목요일)
  END_DATE: new Date('2025-11-19'), // 이벤트 종료일 (수요일)
  TOTAL_WEEKS: 9, // 총 9주
  WEEKLY_MAX_POINTS: 20, // 주간 최대 획득 포인트
  MONSTERS_PER_POINT: 2500, // 포인트 1당 필요한 몬스터 수
} as const

// 스킬 타입 (파이썬의 0,1,2를 의미적 이름으로 매핑)
export type SkillType = 'long' | 'dynamic' | 'snack' // 장기/역동/간식

// 스킬 정보
export const SKILLS = {
  long: { name: '장기 휴식', id: 'long', index: 0 },
  dynamic: { name: '역동적 휴식', id: 'dynamic', index: 1 },
  snack: { name: '간식 충전', id: 'snack', index: 2 },
} as const

// 누적 포인트 비용 (파이썬 CUMULATIVE_COST)
export const CUMULATIVE_COST = [0, 15, 30, 45, 65, 85, 105, 125, 150]

// 기본 휴게실 이용 시간
export const BASE_HOURS = 2

// 장기 휴식 레벨별 추가 시간 (기본 2시간에 추가)
export const HOURS_INCREASE = [0, 1, 2, 4, 6, 10, 18, 34, 58]

// 스킬 레벨별 경험치 배율 (정수 연산용 보정)
// 장기 휴식: 100배 보정 (1% 단위)
export const JANGGI_MULT = [100, 72, 58, 44, 35, 26, 17, 11, 7]
// 역동적 휴식: 200배 보정 (0.5% 단위)
export const YEONGDONG_MULT_AVG = [200, 217, 233, 250, 266, 294, 323, 357, 400]
// 간식 충전: 100배 보정 (1% 단위)
export const GANSIK_MULT = [100, 108, 116, 125, 133, 147, 161, 179, 200]

// 보정 계수
export const SCALE_FACTORS = {
  long: 100,    // 장기 휴식
  dynamic: 200, // 역동적 휴식
  snack: 100,   // 간식 충전
  boost: 100,   // 부스트 효과
} as const

// 전체 보정 계수 (100 × 200 × 100 × 100 = 200,000,000)
export const TOTAL_SCALE_FACTOR = SCALE_FACTORS.long * SCALE_FACTORS.dynamic * SCALE_FACTORS.snack * SCALE_FACTORS.boost

// 정수 연산 결과를 원래 스케일로 변환
export const scaleToOriginal = (scaledValue: number): number => {
  return scaledValue / TOTAL_SCALE_FACTOR
}

// 부스트 효과 타입 (100배 보정된 정수)
export interface BoostEffect {
  name: string
  multiplier: number // 100배 보정된 정수 (예: 1.68 → 168)
  description: string
}

// 부스트 효과 목록 (우선순위 순으로 정렬, SCALE_FACTORS.boost배 보정)
export const BOOST_EFFECTS: BoostEffect[] = [
  {
    name: '휴게실 콤보 루틴',
    multiplier: 168, // 1.68 × SCALE_FACTORS.boost
    description: '스킬 2개 5레벨 이상'
  },
  {
    name: '휴식 삼종 세트',
    multiplier: 159, // 1.59 × SCALE_FACTORS.boost
    description: '스킬 3개 3레벨 이상'
  },
  {
    name: '휴식 스페셜리스트',
    multiplier: 158, // 1.58 × SCALE_FACTORS.boost
    description: '스킬 1개 7레벨 이상'
  },
  {
    name: '휴게실 입문자',
    multiplier: 156, // 1.56 × SCALE_FACTORS.boost
    description: '스킬 1개 5레벨 이상, 다른 스킬 1개 3레벨 이상'
  }
]

// 스킬 상태 (레벨 배열로 관리: [장기, 역동, 간식])
export type SkillLevels = [number, number, number]

// 스킬 상태 객체 (UI용)
export interface SkillState {
  long: number    // 장기 휴식 레벨
  dynamic: number // 역동적 휴식 레벨
  snack: number   // 간식 충전 레벨
}

// 스킬 상태 변환 함수들
export const skillStateToLevels = (state: SkillState): SkillLevels => [
  state.long, state.dynamic, state.snack
]

export const skillLevelsToState = (levels: SkillLevels): SkillState => ({
  long: levels[0],
  dynamic: levels[1],
  snack: levels[2]
})

// 디바이스 환경에 따른 캐시 크기 설정
const getDeviceMemorySettings = () => {
  if (typeof window === 'undefined') return { isMobile: false, memoryGB: 8 } // SSR 환경

  // 모바일 디바이스 감지
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform))

  // 디바이스 메모리 정보 (일부 브라우저에서 지원)
  const memoryGB = (navigator as any).deviceMemory || (isMobile ? 4 : 8)

  return { isMobile, memoryGB }
}

const { isMobile, memoryGB } = getDeviceMemorySettings()

// 환경에 따른 캐시 크기 설정
const getCacheSize = (baseSize: number, factor: number = 1) => {
  if (isMobile && memoryGB <= 4) {
    return Math.floor(baseSize * 0.2 * factor) // 모바일 저사양: 20%
  } else if (isMobile) {
    return Math.floor(baseSize * 0.5 * factor) // 모바일 고사양: 50%
  } else if (memoryGB >= 16) {
    return Math.floor(baseSize * 3 * factor) // 데스크탑 고사양: 300%
  } else {
    return Math.floor(baseSize * 1.5 * factor) // 데스크탑 일반: 150%
  }
}

// 부스트 배율 캐시 (환경별 크기 조정)
const boostMultiplierCache = new Map<number, number>()
const MAX_BOOST_CACHE_SIZE = getCacheSize(1000)

// 레벨 조합에 따른 부스트 효과 배율 (캐싱 적용)
export const getBoostMultiplier = (l1: number, l2: number, l3: number): number => {
  // 캐시 키 생성 (각 레벨 4비트씩)
  const cacheKey = (l1 << 8) | (l2 << 4) | l3

  // 캐시에서 확인
  if (boostMultiplierCache.has(cacheKey)) {
    return boostMultiplierCache.get(cacheKey)!
  }

  const levels = [l1, l2, l3].sort((a, b) => b - a) // 내림차순 정렬

  let multiplier: number
  if (levels[0] >= 5 && levels[1] >= 5) multiplier = 168  // 콤보 루틴 (1.68 × SCALE_FACTORS.boost)
  else if (levels[2] >= 3) multiplier = 159                   // 삼종 세트 (1.59 × SCALE_FACTORS.boost)
  else if (levels[0] >= 7) multiplier = 158                   // 스페셜리스트 (1.58 × SCALE_FACTORS.boost)
  else if (levels[0] >= 5 && levels[1] >= 3) multiplier = 156 // 입문자 (1.56 × SCALE_FACTORS.boost)
  else multiplier = SCALE_FACTORS.boost  // 1.0 × SCALE_FACTORS.boost

  // 캐시에 저장 (크기 제한)
  if (boostMultiplierCache.size >= MAX_BOOST_CACHE_SIZE) {
    // 가장 오래된 항목 제거 (FIFO)
    const firstKey = boostMultiplierCache.keys().next().value
    if (firstKey !== undefined) {
      boostMultiplierCache.delete(firstKey)
    }
  }
  boostMultiplierCache.set(cacheKey, multiplier)
  return multiplier
}

// 활성화된 부스트 효과 찾기
export const getActiveBoostEffect = (l1: number, l2: number, l3: number): BoostEffect | null => {
  const multiplier = getBoostMultiplier(l1, l2, l3)
  return BOOST_EFFECTS.find(boost => boost.multiplier === multiplier) || null
}

// 총 배율 캐시
const totalMultiplierCache = new Map<number, number>()

// 전체 경험치 배율 계산 (정수 연산, 캐싱 적용)
export const getTotalMultiplier = (l1: number, l2: number, l3: number): number => {
  // 캐시 키 생성 (각 레벨 4비트씩)
  const cacheKey = (l1 << 8) | (l2 << 4) | l3

  // 캐시에서 확인
  if (totalMultiplierCache.has(cacheKey)) {
    return totalMultiplierCache.get(cacheKey)!
  }

  // 정수 연산: 장기(×100) × 역동(×200) × 간식(×100) × 부스트(×100)
  // = 최종 보정 계수 100×200×100×100 = 200,000,000
  const rate = JANGGI_MULT[l1] * YEONGDONG_MULT_AVG[l2] * GANSIK_MULT[l3]
  const boost = getBoostMultiplier(l1, l2, l3)
  const totalMultiplier = rate * boost

  // 캐시에 저장
  totalMultiplierCache.set(cacheKey, totalMultiplier)
  return totalMultiplier
}

// 특정 레벨의 총 시간 계산
export const getTotalTime = (longLevel: number): number => {
  return BASE_HOURS + HOURS_INCREASE[longLevel]
}

// 현재 주차 계산 (9월 18일 = 1주차)
export const getCurrentWeek = (currentDate?: Date): number => {
  const now = currentDate || new Date()
  const startDate = LOUNGE_EVENT.START_DATE

  // 시작 날짜 이전이면 1주차
  if (now < startDate) {
    return 1
  }

  // 종료 날짜 이후면 마지막 주차
  if (now > LOUNGE_EVENT.END_DATE) {
    return LOUNGE_EVENT.TOTAL_WEEKS
  }

  // 밀리초 차이를 일 단위로 변환
  const diffInMs = now.getTime() - startDate.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  // 주차 계산 (7일마다 1주차씩 증가)
  const week = Math.floor(diffInDays / 7) + 1

  // 최대 주차를 넘지 않도록 제한
  return Math.min(week, LOUNGE_EVENT.TOTAL_WEEKS)
}


// 타이밍 전략 인터페이스 (중간 단계별 시간 소진 결정)
export interface TimingStrategy {
  stepTiming: boolean[] // 각 레벨업 단계에서 시간을 소진할지 여부
}


// calculateExpWithTimingStrategy 캐시 (환경별 크기 조정, 단순화된 키)
const expWithTimingStrategyCache = new Map<number, number>()
const MAX_EXP_TIMING_CACHE_SIZE = getCacheSize(1000)

// 장기휴식 타이밍 최적화를 위한 2차원 DP (경로 추적 포함)
const findOptimalLongRestTiming = (
  oldL1: number,
  newL1: number,
  nl2: number,
  nl3: number,
  initialTime: number
): { maxExp: number; strategy: TimingStrategy } => {
  const steps = newL1 - oldL1
  if (steps === 0) {
    // 장기휴식 변화 없음
    const multiplier = getTotalMultiplier(oldL1, nl2, nl3)
    return {
      maxExp: initialTime * multiplier,
      strategy: { stepTiming: [] }
    }
  }

  // DP 테이블: dp[step][integerHours][hasInitialTime] = 최대 경험치
  // 키: (step << 8) | (integerHours << 1) | hasInitialTime
  // step: 4비트, integerHours: 7비트, hasInitialTime: 1비트
  const dp = new Map<number, number>()
  // 경로 추적을 위한 parent 포인터
  const parent = new Map<number, { prev: number; exhaustFirst: boolean }>()

  // 초기 상태: step=0, integerHours=0, hasInitialTime=true
  const initialKey = (0 << 8) | (0 << 1) | 1
  dp.set(initialKey, 0)

  // DP 전이
  for (let step = 0; step < steps; step++) {
    const currentLevel = oldL1 + step
    const nextLevel = currentLevel + 1
    const timeAdded = HOURS_INCREASE[nextLevel] - HOURS_INCREASE[currentLevel]

    for (const [key, exp] of Array.from(dp.entries())) {
      const keyStep = key >> 8
      if (keyStep !== step) continue

      const integerHours = (key >> 1) & 0x7F
      const hasInitialTime = (key & 1) === 1

      // 현재 총 시간 계산
      const currentTime = integerHours + (hasInitialTime ? initialTime : 0)

      // 선택 1: 선소진 (시간 먼저 소진 후 업그레이드)
      const multiplierCurrent = getTotalMultiplier(currentLevel, nl2, nl3)
      const expFromCurrentTime = currentTime * multiplierCurrent
      // 선소진 후에는 추가된 정수 시간만 남음 (initialTime 소진됨)
      const newKey1 = ((step + 1) << 8) | (timeAdded << 1) | 0
      const newExp1 = exp + expFromCurrentTime

      if (!dp.has(newKey1) || dp.get(newKey1)! < newExp1) {
        dp.set(newKey1, newExp1)
        parent.set(newKey1, { prev: key, exhaustFirst: true })
      }

      // 선택 2: 선업글 (업그레이드 후 시간 누적)
      const newIntegerHours = integerHours + timeAdded
      const newKey2 = ((step + 1) << 8) | (newIntegerHours << 1) | (hasInitialTime ? 1 : 0)

      if (!dp.has(newKey2) || dp.get(newKey2)! < exp) {
        dp.set(newKey2, exp)
        parent.set(newKey2, { prev: key, exhaustFirst: false })
      }
    }
  }

  // 최종 단계에서 최대 경험치와 해당 상태 찾기
  let maxExp = 0
  let bestFinalState = 0
  const finalMultiplier = getTotalMultiplier(newL1, nl2, nl3)

  for (const [key, exp] of Array.from(dp.entries())) {
    const keyStep = key >> 8
    if (keyStep !== steps) continue

    const integerHours = (key >> 1) & 0x7F
    const hasInitialTime = (key & 1) === 1

    // 최종 총 시간 계산
    const finalTime = integerHours + (hasInitialTime ? initialTime : 0)
    const finalExp = exp + finalTime * finalMultiplier

    if (finalExp > maxExp) {
      maxExp = finalExp
      bestFinalState = key
    }
  }

  // 경로 복원을 통해 strategy 생성
  const stepTiming: boolean[] = []
  let currentState = bestFinalState

  while (parent.has(currentState)) {
    const parentInfo = parent.get(currentState)!
    stepTiming.unshift(parentInfo.exhaustFirst) // 앞에 추가 (역순이므로)
    currentState = parentInfo.prev
  }

  const strategy: TimingStrategy = {
    stepTiming
  }

  return { maxExp, strategy }
}

// 하이브리드 타이밍 전략으로 경험치 계산 (2차원 DP 사용)
export const calculateExpWithTimingStrategy = (
  oldLevels: SkillLevels,
  newLevels: SkillLevels,
  strategy: TimingStrategy,
  remainingTimeThisWeek?: number
): number => {
  // 단순화된 캐시 키 (oldL1, newL1, nl2, nl3, time만 사용)
  const remainingTimeInt = remainingTimeThisWeek !== undefined ? Math.floor(remainingTimeThisWeek * 100) : 99999
  const cacheKey = (oldLevels[0] << 20) | (newLevels[0] << 16) |
                   (newLevels[1] << 12) | (newLevels[2] << 8)
  const fullCacheKey = (cacheKey << 17) | (remainingTimeInt & 0x1FFFF)

  if (expWithTimingStrategyCache.has(fullCacheKey)) {
    return scaleToOriginal(expWithTimingStrategyCache.get(fullCacheKey)!)
  }

  const [l1Start] = oldLevels
  const [nl1, nl2, nl3] = newLevels
  const initialTime = remainingTimeThisWeek !== undefined ? remainingTimeThisWeek : getTotalTime(l1Start)

  // 2차원 DP로 최적 경험치 계산
  const result = findOptimalLongRestTiming(l1Start, nl1, nl2, nl3, initialTime)
  const totalExp = result.maxExp

  // 캐시에 저장 (크기 제한)
  if (expWithTimingStrategyCache.size >= MAX_EXP_TIMING_CACHE_SIZE) {
    const firstKey = expWithTimingStrategyCache.keys().next().value
    if (firstKey !== undefined) {
      expWithTimingStrategyCache.delete(firstKey)
    }
  }
  expWithTimingStrategyCache.set(fullCacheKey, totalExp)
  return scaleToOriginal(totalExp)
}



// 장기휴식 관련 모든 계산을 DP로 통합 처리
export const findOptimalTimingStrategy = (
  oldLevels: SkillLevels,
  newLevels: SkillLevels,
  remainingTimeThisWeek?: number
): { strategy: TimingStrategy; exp: number } => {
  const [l1Start] = oldLevels
  const [nl1, nl2, nl3] = newLevels
  const initialTime = remainingTimeThisWeek !== undefined ? remainingTimeThisWeek : getTotalTime(l1Start)

  if (nl1 === l1Start) {
    // 장기 휴식 레벨이 변하지 않으면 단순 계산
    const multiplier = getTotalMultiplier(l1Start, nl2, nl3)
    const exp = scaleToOriginal(initialTime * multiplier)
    return {
      strategy: { stepTiming: [] },
      exp
    }
  }

  // DP를 통한 최적 타이밍 계산
  const result = findOptimalLongRestTiming(l1Start, nl1, nl2, nl3, initialTime)
  return {
    strategy: result.strategy,
    exp: scaleToOriginal(result.maxExp)
  }
}

// 업그레이드 비용 계산
export const getUpgradeCost = (fromLevels: SkillLevels, toLevels: SkillLevels): number => {
  let totalCost = 0
  for (let i = 0; i < 3; i++) {
    totalCost += CUMULATIVE_COST[toLevels[i]] - CUMULATIVE_COST[fromLevels[i]]
  }
  return totalCost
}

// 스킬 업그레이드 정보
export interface SkillUpgrade {
  skillType: SkillType
  fromLevel: number
  toLevel: number
  cost: number
}

// 주차별 전략
export interface WeeklyStrategy {
  week: number
  startLevels: SkillLevels
  endLevels: SkillLevels
  skillUpgrades: SkillUpgrade[]
  timingStrategy: TimingStrategy | null // 하이브리드 타이밍 전략
  actions: Action[] // 실행할 액션 시퀀스
  expectedExp: number
  boostEffect: BoostEffect | null
  totalTime: number // 해당 주차의 총 시간
  remainingPoints: number // 해당 주차 이후 남은 포인트
}

// 계산기 입력 데이터
export interface LoungeCalculatorInput {
  currentWeek: number
  skillLevels: SkillState
  remainingPoints: number
  remainingTimeThisWeek: number
  maxLongRestLevel?: number // 장기 휴식 최대 레벨 제한 (null/undefined = 제한 없음)
  weeklyPoints?: number[] // 주차별 획득 포인트 (1주차~9주차, undefined면 기본 20포인트)
}

// 계산 결과
export interface LoungeCalculationResult {
  currentBoost: BoostEffect | null
  weeklyStrategy: WeeklyStrategy[]
  totalExpectedExp: number
  totalExpectedTime: number
  recommendations: string[]
  // 제한 관련 정보
  isLimited: boolean // 장기 휴식 레벨 제한이 적용되었는지
  maxLongRestLevel?: number // 적용된 최대 레벨
  weeklyMaxHours?: number // 주당 최대 잠수 시간
  lossComparedToUnlimited?: number // 제한 없을 때 대비 손실 (사우나 시간 기준)
  unlimitedTotalTime?: number // 제한 없을 때의 총 시간
  unlimitedTotalExp?: number // 제한 없을 때의 총 경험치
}

// State 인코딩/디코딩 함수들 (32비트 정수 사용)
// week: 5비트 (0-19), l1/l2/l3: 각 4비트 (0-8)
const encodeState = (week: number, l1: number, l2: number, l3: number): number => {
  return (week << 12) | (l1 << 8) | (l2 << 4) | l3
}

const decodeState = (state: number): [number, number, number, number] => {
  return [
    (state >> 12) & 0x1F,  // week
    (state >> 8) & 0xF,    // l1
    (state >> 4) & 0xF,    // l2
    state & 0xF            // l3
  ]
}

// 액션 타입 정의
export type Action =
  | { type: 'upgrade'; skill: number; level: number }
  | { type: 'exhaust' }


// 스킬 업그레이드에 필요한 액션 시퀀스 생성 (새 DP에서 사용)
const generateActionSequence = (
  fromLevels: SkillLevels,
  toLevels: SkillLevels,
  timingStrategy: TimingStrategy | null,
  remainingTime?: number
): Action[] => {
  const actions: Action[] = []
  const [l1Start, l2Start, l3Start] = fromLevels
  const [nl1, nl2, nl3] = toLevels

  // 소급 적용 스킬들을 먼저 업그레이드 (역동적 휴식, 간식 충전)
  if (nl2 > l2Start) {
    for (let level = l2Start + 1; level <= nl2; level++) {
      actions.push({ type: 'upgrade', skill: 1, level })
    }
  }

  if (nl3 > l3Start) {
    for (let level = l3Start + 1; level <= nl3; level++) {
      actions.push({ type: 'upgrade', skill: 2, level })
    }
  }

  // 장기 휴식 레벨 변화가 있는 경우 (타이밍 전략 적용)
  if (nl1 > l1Start && timingStrategy) {
    let currentLevel = l1Start

    for (let i = 0; i < timingStrategy.stepTiming.length; i++) {
      const shouldExhaustFirst = timingStrategy.stepTiming[i]
      const targetLevel = currentLevel + 1

      if (shouldExhaustFirst) {
        actions.push({ type: 'exhaust' })
      }

      actions.push({ type: 'upgrade', skill: 0, level: targetLevel })
      currentLevel = targetLevel
    }
  }

  // 남은 시간 소진
  if (actions.length == 0 || actions[actions.length - 1].type !== 'exhaust') {
    actions.push({ type: 'exhaust' })
  }
  

  return actions
}

// Action 항목의 타입 정의
export interface ActionItem {
  text: string
  isMultiLevel: boolean // 2레벨 이상 업그레이드인지
  isLongRestWithoutExhaust: boolean // 시간 소진 없이 바로 장기 휴식하는 경우
  // 텍스트를 부분별로 나눈 것
  parts?: {
    prefix: string // "장기 휴식 "
    startLevel: string // "0"
    arrow: string // "→"
    endLevel: string // "3"
    suffix: string // "레벨"
  }
}

// Action 배열을 구조화된 데이터로 변환
export const actionsToDetailedItems = (actions: Action[], fromLevels: SkillLevels): ActionItem[] => {
  const skillNames = ['장기 휴식', '역동적 휴식', '간식 충전']
  const items: ActionItem[] = []
  const currentLevels = [...fromLevels]

  // 스킬별 최종 레벨 추적 (연속 업그레이드 통합용)
  const skillRanges: { [skillId: number]: { start: number; end: number } } = {}

  let i = 0
  while (i < actions.length) {
    const action = actions[i]

    if (action.type === 'upgrade') {
      const skillId = action.skill
      const skillName = skillNames[skillId]
      const startLevel = currentLevels[skillId]

      // 해당 스킬의 연속된 업그레이드 찾기
      let endLevel = action.level
      currentLevels[skillId] = endLevel
      let j = i + 1

      // 연속된 같은 스킬 업그레이드들을 통합
      while (j < actions.length) {
        const nextAction = actions[j]
        if (nextAction.type !== 'upgrade' ||
            nextAction.skill !== skillId ||
            nextAction.level !== endLevel + 1) {
          break
        }
        endLevel = nextAction.level
        currentLevels[skillId] = endLevel
        j++
      }

      const levelDiff = endLevel - startLevel
      const isMultiLevel = levelDiff >= 2

      // 장기 휴식이고, 첫 번째 액션이거나 바로 앞이 시간 소진이 아닌 경우
      const isLongRestWithoutExhaust = skillId === 0 && (
        i === 0 || // 첫 번째 액션
        (i > 0 && actions[i - 1].type !== 'exhaust') // 앞이 시간 소진이 아님
      )

      items.push({
        text: `${skillName} ${startLevel}→${endLevel}레벨`,
        isMultiLevel,
        isLongRestWithoutExhaust,
        parts: {
          prefix: `${skillName} `,
          startLevel: startLevel.toString(),
          arrow: '→',
          endLevel: endLevel.toString(),
          suffix: '레벨'
        }
      })
      i = j // 통합된 액션들 건너뛰기

    } else if (action.type === 'exhaust') {
      items.push({
        text: '시간 소진',
        isMultiLevel: false,
        isLongRestWithoutExhaust: false
      })
      i++
    } else {
      i++
    }
  }

  return items
}

// 기존 문자열 함수도 유지 (호환성을 위해)
export const actionsToDetailedString = (actions: Action[], fromLevels: SkillLevels): string => {
  return actionsToDetailedItems(actions, fromLevels).map(item => item.text).join(', ')
}



// 스킬 조합 캐시 (숫자 키 사용, 환경별 크기 조정)
const skillCombinationsCache = new Map<number, SkillLevels[]>()
const MAX_SKILL_COMBINATIONS_CACHE_SIZE = getCacheSize(200, 0.5)  // 메모리 사용량이 많으므로 factor 0.5

// 모든 가능한 스킬 레벨 조합 생성 (캐싱 적용)
const generateSkillCombinations = (
  currentLevels: SkillLevels,
  availablePoints: number
): SkillLevels[] => {
  // 캐시 키 생성 (숫자로 압축)
  // l1,l2,l3: 각 4비트 (0-8), availablePoints: 8비트 (0-255)
  const cacheKey = (currentLevels[0] << 16) | (currentLevels[1] << 12) | (currentLevels[2] << 8) | availablePoints

  // 캐시에서 확인
  if (skillCombinationsCache.has(cacheKey)) {
    return skillCombinationsCache.get(cacheKey)!
  }

  const [l1, l2, l3] = currentLevels
  const combinations: SkillLevels[] = []

  for (let nl1 = l1; nl1 <= 8; nl1++) {
    const cost1 = CUMULATIVE_COST[nl1] - CUMULATIVE_COST[l1]
    if (cost1 > availablePoints) break

    for (let nl2 = l2; nl2 <= 8; nl2++) {
      const cost2 = CUMULATIVE_COST[nl2] - CUMULATIVE_COST[l2]
      if (cost1 + cost2 > availablePoints) break

      for (let nl3 = l3; nl3 <= 8; nl3++) {
        const cost3 = CUMULATIVE_COST[nl3] - CUMULATIVE_COST[l3]
        const totalCost = cost1 + cost2 + cost3
        if (totalCost > availablePoints) break

        combinations.push([nl1, nl2, nl3] as SkillLevels)
      }
    }
  }

  // 캐시에 저장 (크기 제한)
  if (skillCombinationsCache.size >= MAX_SKILL_COMBINATIONS_CACHE_SIZE) {
    // 가장 오래된 항목 제거 (FIFO)
    const firstKey = skillCombinationsCache.keys().next().value
    if (firstKey !== undefined) {
      skillCombinationsCache.delete(firstKey)
    }
  }
  skillCombinationsCache.set(cacheKey, combinations)
  return combinations
}


// 상태 정보 저장 구조
interface StateInfo {
  totalExp: number
  pastState?: number  // 이전 주차의 상태 (week-1의 상태 키)
  weeklyUpgrade?: {
    actions: Action[]
    timingStrategy: TimingStrategy | null
  }
}

// week별로 분리된 상태 관리
interface WeeklyStates {
  [week: number]: Map<number, StateInfo>  // week -> (l1,l2,l3 상태 -> StateInfo)
}

// 3차원 상태를 정수로 인코딩 (week 없이)
const encodeSkillState = (l1: number, l2: number, l3: number): number => {
  return (l1 << 8) | (l2 << 4) | l3
}

// 3차원 상태 디코딩
const decodeSkillState = (state: number): [number, number, number] => {
  return [
    (state >> 8) & 0xF,    // l1
    (state >> 4) & 0xF,    // l2
    state & 0xF            // l3
  ]
}

// 주차별 포인트에서 특정 주차까지의 누적 포인트 계산
const getTotalPointsUpToWeek = (weekIndex: number, weeklyPoints?: number[]): number => {
  if (!weeklyPoints || weeklyPoints.length !== 9) {
    // 기본값: 모든 주차에서 20포인트
    return (weekIndex + 1) * LOUNGE_EVENT.WEEKLY_MAX_POINTS
  }

  let total = 0
  for (let i = 0; i <= weekIndex && i < weeklyPoints.length; i++) {
    total += weeklyPoints[i]
  }
  return total
}

// Forward DP 함수 (week별 분리)
const findOptimalPathWithParents = (
  startWeek: number,
  startLevels: SkillLevels,
  remainingTimeThisWeek?: number,
  currentRemainingPoints?: number,
  weeklyPoints?: number[]
): WeeklyStates => {
  const startLevelCost = CUMULATIVE_COST[startLevels[0]] + CUMULATIVE_COST[startLevels[1]] + CUMULATIVE_COST[startLevels[2]]
  const weeklyStates: WeeklyStates = {}

  // 시작 상태 초기화 (startWeek-1에서 시작)
  const actualStartWeek = startWeek - 1
  weeklyStates[actualStartWeek] = new Map()
  const startState = encodeSkillState(startLevels[0], startLevels[1], startLevels[2])
  weeklyStates[actualStartWeek].set(startState, { totalExp: 0 })

  let availableMaxPoints = currentRemainingPoints || 0
  const [l1, l2, l3] = startLevels
  const initialPointsSpent = CUMULATIVE_COST[l1] + CUMULATIVE_COST[l2] + CUMULATIVE_COST[l3]
  availableMaxPoints += initialPointsSpent

  // Forward DP: actualStartWeek부터 9주차까지
  for (let previousWeek = actualStartWeek; previousWeek < 9; previousWeek++) {
    availableMaxPoints += previousWeek >= startWeek ? (weeklyPoints?.[previousWeek] || 0) : 0
    if (!weeklyStates[previousWeek]) continue // 이 주차에 도달 가능한 상태가 없음
    const currentWeekStates = weeklyStates[previousWeek]

    // 다음 주차 상태 맵 초기화
    const targetWeek = previousWeek + 1
    weeklyStates[targetWeek] = new Map() 

    // 현재 주차의 모든 상태들을 확인
    for (const [currentStateKey, currentInfo] of Array.from(currentWeekStates.entries())) {
      const [l1, l2, l3] = decodeSkillState(currentStateKey)
      const currentLevels: SkillLevels = [l1, l2, l3]
      const currentPointsSpent = CUMULATIVE_COST[l1] + CUMULATIVE_COST[l2] + CUMULATIVE_COST[l3]

      // 사용 가능한 포인트 계산
      let pointsAvailable = availableMaxPoints - currentPointsSpent

      if (pointsAvailable < 0) continue

      // 가능한 업그레이드 조합들 시도
      for (const newLevels of generateSkillCombinations(currentLevels, pointsAvailable)) {
        // 이번 주차 경험치 계산
        const timeThisWeek = (targetWeek === startWeek && remainingTimeThisWeek !== undefined)
          ? remainingTimeThisWeek
          : getTotalTime(currentLevels[0])

        const { strategy, exp: currentExp } = findOptimalTimingStrategy(
          currentLevels,
          newLevels,
          timeThisWeek
        )

        // 누적 경험치
        const cumulativeExp = currentInfo.totalExp + currentExp

        // 다음 주차로 전파
        const targetStateKey = encodeSkillState(newLevels[0], newLevels[1], newLevels[2])
        const targetWeekStates = weeklyStates[targetWeek]
        const targetInfo = targetWeekStates.get(targetStateKey)

        // 더 좋은 경로면 갱신
        if (!targetInfo || targetInfo.totalExp < cumulativeExp) {
          // 액션 시퀀스 생성
          const actions = generateActionSequence(currentLevels, newLevels, strategy)

          targetWeekStates.set(targetStateKey, {
            totalExp: cumulativeExp,
            pastState: currentStateKey,
            weeklyUpgrade: {
              actions,
              timingStrategy: strategy
            }
          })
        }
        
      }
    }
  }

  return weeklyStates
}

// 9주차에서 제한별 최적값 찾기 (bestExp[0~8] 테이블)
const findBestFinalStatesWithLimits = (
  weeklyStates: WeeklyStates
): Map<number, { stateKey: number; totalExp: number }> => {
  const bestExp = new Map<number, { stateKey: number; totalExp: number }>()

  // 각 제한 레벨별로 초기화
  for (let x = 0; x <= 8; x++) {
    bestExp.set(x, { stateKey: -1, totalExp: -1 })
  }

  // 9주차의 모든 상태를 확인
  const week9States = weeklyStates[9]
  if (week9States) {
    for (const [stateKey, info] of Array.from(week9States.entries())) {
      const [l1, l2, l3] = decodeSkillState(stateKey)
      const longRestLevel = l1

      // 제한 레벨 x에 대해: longRestLevel <= x인 모든 x에 대해 최적값 갱신
      // 최적화: 갱신이 안 되는 순간 break (제한이 커질수록 경험치가 줄어들거나 같음)
      for (let x = longRestLevel; x <= 8; x++) {
        const current = bestExp.get(x)!
        if (info.totalExp > current.totalExp) {
          bestExp.set(x, { stateKey, totalExp: info.totalExp })
        } else {
          // 현재 상태가 기존 최적값보다 작거나 같으면 더 큰 제한에서도 갱신 불가
          break
        }
      }
    }
  }

  return bestExp
}

// 과거노드로 경로 역추적
const backtrackPath = (
  weeklyStates: WeeklyStates,
  finalStateKey: number,
  startWeek: number,
  startRemainingPoints: number,
  weeklyPoints?: number[]
): WeeklyStrategy[] => {
  const traceResult: WeeklyStrategy[] = []

  let currentWeek = 9
  let currentStateKey = finalStateKey

  let totalAcquiredPoints = startRemainingPoints
  if (weeklyPoints) {
    for (let week = startWeek + 1; week <= currentWeek; week++) {
      if (weeklyPoints && week <= weeklyPoints.length) {
        totalAcquiredPoints += weeklyPoints[week-1] // week-1은 배열 인덱스
      }
    }
  }

  // 9주차부터 actualStartWeek까지 역추적
  while (currentWeek >= startWeek) {
    const currentWeekStates = weeklyStates[currentWeek]
    const previousWeek = currentWeek - 1
    const previousWeekStates = weeklyStates[previousWeek]
    if (!currentWeekStates) break
    if (!previousWeekStates) break

    const currentInfo = currentWeekStates.get(currentStateKey)
    if (!currentInfo || currentInfo.pastState === undefined) break
    const previousInfo = previousWeekStates.get(currentInfo.pastState)
    if (!previousInfo) break
    
    const [l1, l2, l3] = decodeSkillState(currentStateKey)
    const [pl1, pl2, pl3] = decodeSkillState(currentInfo.pastState)

    // WeeklyStrategy 생성
    const startLevels: SkillLevels = [pl1, pl2, pl3]
    const endLevels: SkillLevels = [l1, l2, l3]

    // 스킬 업그레이드 정보 생성 (소급 적용 스킬들을 먼저)
    const skillUpgrades: SkillUpgrade[] = []
    const skillTypes: SkillType[] = ['long', 'dynamic', 'snack']
    const priorityOrder = [1, 2, 0] // 역동적 휴식, 간식 충전, 장기 휴식 순서

    for (const i of priorityOrder) {
      if (startLevels[i] !== endLevels[i]) {
        skillUpgrades.push({
          skillType: skillTypes[i],
          fromLevel: startLevels[i],
          toLevel: endLevels[i],
          cost: CUMULATIVE_COST[endLevels[i]] - CUMULATIVE_COST[startLevels[i]]
        })
      }
    }

    // 저장된 타이밍 전략 사용
    const timingStrategy = currentInfo.weeklyUpgrade?.timingStrategy || null

    // 이번 주차 경험치 계산
    const currentWeekExp = currentInfo.totalExp - previousInfo.totalExp

    // 남은 포인트 계산
    const pastWeek = currentWeek - 1
    const pointsSpentAtStart = CUMULATIVE_COST[pl1] + CUMULATIVE_COST[pl2] + CUMULATIVE_COST[pl3]
    const upgradesCost = getUpgradeCost(startLevels, endLevels)

    const totalSpentPoints = pointsSpentAtStart + upgradesCost
    const remainingPoints = totalAcquiredPoints - totalSpentPoints

    // actions 저장
    const actions = currentInfo.weeklyUpgrade?.actions || []

    const weeklyStrategy: WeeklyStrategy = {
      week: currentWeek, // 이 전략이 실행되는 주차
      startLevels,
      endLevels,
      skillUpgrades,
      timingStrategy,
      actions,
      expectedExp: currentWeekExp,
      boostEffect: getActiveBoostEffect(l1, l2, l3),
      totalTime: getTotalTime(l1),
      remainingPoints
    }

    traceResult.unshift(weeklyStrategy) // 앞에 추가 (시간순으로)

    // 이전 주차로 이동
    if (currentWeek > startWeek) {
      totalAcquiredPoints -= weeklyPoints?.[currentWeek - 1] || 0
    }
    currentWeek--
    currentStateKey = currentInfo.pastState
  }

  return traceResult
}

// 최적화된 휴게실 계산기 클래스
export class OptimizedLoungeCalculator {
  private fullStates: WeeklyStates | null = null
  private precomputedResults: Map<number, { totalExp: number; path: WeeklyStrategy[] }> = new Map()
  private currentInput: LoungeCalculatorInput | null = null
  private maxPointsResult: LoungeCalculationResult | null = null

  // 제한 없이 전체 계산 실행 (한 번만)
  calculateFull(input: LoungeCalculatorInput): void {
    this.currentInput = input
    const skillLevels = skillStateToLevels(input.skillLevels)

    // 새로운 Forward DP 함수로 계산
    const weeklyStates = findOptimalPathWithParents(
      input.currentWeek,
      skillLevels,
      input.remainingTimeThisWeek,
      input.remainingPoints,
      input.weeklyPoints
    )

    this.fullStates = weeklyStates

    // 최대 포인트 시나리오 계산 (모든 주차 20포인트)
    const maxWeeklyPoints = Array(9).fill(20)
    this.calculateMaxPointsScenario(input, maxWeeklyPoints)

    // 9주차에서 제한별 최적값 찾기 (bestExp[0~8])
    const bestExp = findBestFinalStatesWithLimits(weeklyStates)

    // 제한값별 결과 미리 계산
    for (const limit of [5, 8]) {
      const bestResult = bestExp.get(limit)
      if (bestResult && bestResult.totalExp >= 0) {
        const path = backtrackPath(weeklyStates, bestResult.stateKey, input.currentWeek, input.remainingPoints, input.weeklyPoints)
        this.precomputedResults.set(limit, {
          totalExp: bestResult.totalExp,
          path
        })
      }
    }
  }

  // 최대 포인트 시나리오 계산
  private calculateMaxPointsScenario(baseInput: LoungeCalculatorInput, maxWeeklyPoints: number[]): void {
    // 현재 주차 이후의 포인트만 비교 (이미 지난 주차는 변경할 수 없음)
    const currentWeek = baseInput.currentWeek
    const hasPointsDifference = baseInput.weeklyPoints?.some((points, index) => {
      // 현재 주차 이후의 주차만 확인
      return index >= currentWeek && points !== maxWeeklyPoints[index]
    }) || !baseInput.weeklyPoints

    if (!hasPointsDifference) {
      // 이미 최대 포인트로 설정되어 있으면 계산하지 않음
      this.maxPointsResult = null
      return
    }

    try {
      // 최대 포인트로 설정한 입력으로 계산
      const maxPointsInput: LoungeCalculatorInput = {
        ...baseInput,
        weeklyPoints: maxWeeklyPoints
      }

      const result = optimizeLoungeStrategy(maxPointsInput)
      this.maxPointsResult = result
    } catch (error) {
      console.warn('최대 포인트 시나리오 계산 실패:', error)
      this.maxPointsResult = null
    }
  }

  // 최대 포인트 대비 손실 정보 가져오기
  getMaxPointsComparison(currentResult: LoungeCalculationResult): {
    maxPointsExp: number;
    lossExp: number;
    lossSaunaHours: number
  } | null {
    if (!this.maxPointsResult || !this.currentInput) return null

    const lossExp = this.maxPointsResult.totalExpectedExp - currentResult.totalExpectedExp
    const lossSaunaHours = lossExp * 0.8

    return {
      maxPointsExp: this.maxPointsResult.totalExpectedExp,
      lossExp,
      lossSaunaHours
    }
  }

  // 특정 제한 레벨에 대한 결과 반환
  getResultForLimit(
    input: LoungeCalculatorInput,
    maxLevel?: number
  ): LoungeCalculationResult {
    if (!this.fullStates) {
      throw new Error('calculateFull을 먼저 호출해야 합니다')
    }

    const isLimited = maxLevel !== undefined

    let limitedResult: { totalExp: number; path: WeeklyStrategy[] }
    let unlimitedResult: { totalExp: number; path: WeeklyStrategy[] }

    // 제한 없는 결과 (레벨 8)
    if (this.precomputedResults.has(8)) {
      unlimitedResult = this.precomputedResults.get(8)!
    } else {
      const bestExp = findBestFinalStatesWithLimits(this.fullStates)
      const bestResult = bestExp.get(8)
      if (bestResult && bestResult.totalExp >= 0) {
        const path = backtrackPath(this.fullStates, bestResult.stateKey, input.currentWeek, input.remainingPoints, input.weeklyPoints)
        unlimitedResult = { totalExp: bestResult.totalExp, path }
      } else {
        unlimitedResult = { totalExp: 0, path: [] }
      }
    }

    if (isLimited) {
      // 미리 계산된 결과가 있으면 사용
      if (this.precomputedResults.has(maxLevel)) {
        limitedResult = this.precomputedResults.get(maxLevel)!
      } else {
        // 없으면 새로 계산
        const bestExp = findBestFinalStatesWithLimits(this.fullStates)
        const bestResult = bestExp.get(maxLevel)
        if (bestResult && bestResult.totalExp >= 0) {
          const path = backtrackPath(this.fullStates, bestResult.stateKey, input.currentWeek, input.remainingPoints, input.weeklyPoints)
          limitedResult = { totalExp: bestResult.totalExp, path }
        } else {
          limitedResult = { totalExp: 0, path: [] }
        }
        this.precomputedResults.set(maxLevel, limitedResult)
      }
    } else {
      limitedResult = unlimitedResult
    }

    return this.formatResult(input, limitedResult, unlimitedResult, isLimited, maxLevel)
  }

  // 결과를 LoungeCalculationResult 형식으로 변환
  private formatResult(
    input: LoungeCalculatorInput,
    limitedResult: { totalExp: number; path: WeeklyStrategy[] },
    unlimitedResult: { totalExp: number; path: WeeklyStrategy[] },
    isLimited: boolean,
    maxLevel?: number
  ): LoungeCalculationResult {
    let lossComparedToUnlimited: number | undefined = undefined
    let unlimitedTotalTime: number | undefined = undefined
    let unlimitedTotalExp: number | undefined = undefined

    if (isLimited) {
      unlimitedTotalTime = unlimitedResult.path.reduce((sum, week) => {
        return sum + getTotalTime(week.endLevels[0])
      }, 0)

      unlimitedTotalExp = unlimitedResult.totalExp

      // 손실 계산 (사우나 시간 기준: 차이 × 0.8)
      const expDifference = unlimitedResult.totalExp - limitedResult.totalExp
      lossComparedToUnlimited = expDifference * 0.8
    }

    // 현재 부스트 효과
    const currentBoost = getActiveBoostEffect(
      input.skillLevels.long,
      input.skillLevels.dynamic,
      input.skillLevels.snack
    )

    // 총 예상 시간 계산
    const totalExpectedTime = limitedResult.path.reduce((sum, week) => {
      return sum + getTotalTime(week.endLevels[0])
    }, 0)

    // 주당 최대 잠수 시간 계산
    const weeklyMaxHours = isLimited && maxLevel !== undefined ? getTotalTime(maxLevel) : undefined

    // 추천사항 생성
    const recommendations = generateRecommendations(limitedResult.path, input)

    return {
      currentBoost,
      weeklyStrategy: limitedResult.path,
      totalExpectedExp: limitedResult.totalExp,
      totalExpectedTime,
      recommendations,
      // 제한 관련 정보
      isLimited,
      maxLongRestLevel: maxLevel,
      weeklyMaxHours,
      lossComparedToUnlimited,
      unlimitedTotalTime,
      unlimitedTotalExp
    }
  }
}

// 메인 계산 함수 (하위 호환성 유지 - OptimizedLoungeCalculator 사용)
export const optimizeLoungeStrategy = (input: LoungeCalculatorInput): LoungeCalculationResult => {
  const calculator = new OptimizedLoungeCalculator()
  calculator.calculateFull(input)
  return calculator.getResultForLimit(input, input.maxLongRestLevel)
}

// 추천사항 생성
const generateRecommendations = (
  strategy: WeeklyStrategy[],
  input: LoungeCalculatorInput
): string[] => {
  const recommendations: string[] = []

  // 현재 주차의 전략 분석만 표시
  const currentWeekStrategy = strategy.find(s => s.week === input.currentWeek)
  if (currentWeekStrategy) {
    if (currentWeekStrategy.skillUpgrades.length > 0) {
      const upgradeNames = currentWeekStrategy.skillUpgrades.map(u =>
        `${SKILLS[u.skillType].name} ${u.fromLevel}→${u.toLevel}레벨`
      ).join(', ')

      // actions를 사용한 상세한 추천사항 생성
      const detailedStrategy = currentWeekStrategy.actions.length > 0
        ? actionsToDetailedString(currentWeekStrategy.actions, currentWeekStrategy.startLevels)
        : '시간 소진'

      recommendations.push(`이번 주 추천: ${detailedStrategy}`)
    } else {
      recommendations.push('이번 주는 스킬 업그레이드 없이 시간 소진 추천')
    }
  }

  return recommendations
}

// 사우나 효율 계산 (총 예상 경험치의 0.8배)
export const calculateSaunaEfficiency = (totalExp: number): number => {
  return totalExp * 0.8
}

// 텍스트 공유 형식 생성
export const generateShareText = (
  input: LoungeCalculatorInput,
  result: LoungeCalculationResult
): string => {
  const { currentWeek, remainingPoints, remainingTimeThisWeek } = input
  const { totalExpectedExp, totalExpectedTime, weeklyStrategy } = result

  // 사우나 효율 계산
  const saunaEfficiency = calculateSaunaEfficiency(totalExpectedExp)

  // 헤더 정보
  const lines: string[] = []
  lines.push(`${currentWeek}주차, ${remainingPoints}포인트, ${remainingTimeThisWeek}시간 남은 기준으로`)
  lines.push(`이벤트 최대 참여 시 ${totalExpectedTime}시간동안 잠수 시 ${totalExpectedExp.toFixed(2)}시간 사우나와 동일한 효율`)

  // 주차별 전략
  weeklyStrategy.forEach(week => {
    const totalTime = getTotalTime(week.endLevels[0]) // 장기 휴식 레벨로 시간 계산
    const weekSaunaEfficiency = calculateSaunaEfficiency(week.expectedExp)

    // actions를 사용한 전략 텍스트 생성
    const strategyText = week.actions.length > 0
      ? actionsToDetailedString(week.actions, week.startLevels)
      : '시간 소진'

    lines.push(`${week.week}주차(${totalTime}시간, ${weekSaunaEfficiency.toFixed(2)}사우나): ${strategyText}`)
  })

  return lines.join('\n')
}