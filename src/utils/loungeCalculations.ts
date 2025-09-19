// 아지트 듀오 휴게실 경험치 최적화 계산기 (파이썬 로직 기반)

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

// 스킬 레벨별 경험치 배율
export const JANGGI_MULT = [1.0, 0.72, 0.58, 0.44, 0.35, 0.26, 0.17, 0.11, 0.07]
export const YEONGDONG_MULT_AVG = [1.0, 1.085, 1.165, 1.25, 1.33, 1.47, 1.615, 1.785, 2.0]
export const GANSIK_MULT = [1.0, 1.08, 1.16, 1.25, 1.33, 1.47, 1.61, 1.79, 2.0]

// 부스트 효과 타입
export interface BoostEffect {
  name: string
  multiplier: number
  description: string
}

// 부스트 효과 목록 (우선순위 순으로 정렬)
export const BOOST_EFFECTS: BoostEffect[] = [
  {
    name: '휴게실 콤보 루틴',
    multiplier: 1.68,
    description: '스킬 2개 5레벨 이상'
  },
  {
    name: '휴식 삼종 세트',
    multiplier: 1.59,
    description: '스킬 3개 3레벨 이상'
  },
  {
    name: '휴식 스페셜리스트',
    multiplier: 1.58,
    description: '스킬 1개 7레벨 이상'
  },
  {
    name: '휴게실 입문자',
    multiplier: 1.56,
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

// 레벨 조합에 따른 부스트 효과 배율 (파이썬 get_boost_multiplier)
export const getBoostMultiplier = (l1: number, l2: number, l3: number): number => {
  const levels = [l1, l2, l3].sort((a, b) => b - a) // 내림차순 정렬

  if (levels[0] >= 5 && levels[1] >= 5) return 1.68  // 콤보 루틴
  if (levels[2] >= 3) return 1.59                   // 삼종 세트
  if (levels[0] >= 7) return 1.58                   // 스페셜리스트
  if (levels[0] >= 5 && levels[1] >= 3) return 1.56 // 입문자
  return 1.0
}

// 활성화된 부스트 효과 찾기
export const getActiveBoostEffect = (l1: number, l2: number, l3: number): BoostEffect | null => {
  const multiplier = getBoostMultiplier(l1, l2, l3)
  return BOOST_EFFECTS.find(boost => boost.multiplier === multiplier) || null
}

// 전체 경험치 배율 계산 (파이썬 get_total_multiplier)
export const getTotalMultiplier = (l1: number, l2: number, l3: number): number => {
  const rate = JANGGI_MULT[l1] * YEONGDONG_MULT_AVG[l2] * GANSIK_MULT[l3]
  const boost = getBoostMultiplier(l1, l2, l3)
  return rate * boost
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
  description: string   // 전략 설명 (예: "선소진", "선업글", "1→2선소진,2→3선업글")
}

// 장기 휴식 다단계 레벨업의 모든 가능한 타이밍 전략 생성
export const generateTimingStrategies = (fromLevel: number, toLevel: number): TimingStrategy[] => {
  const steps = toLevel - fromLevel
  if (steps <= 0) return []

  const strategies: TimingStrategy[] = []

  // 2^steps 개의 모든 조합 생성 (각 단계마다 선소진/선업글 선택)
  for (let mask = 0; mask < (1 << steps); mask++) {
    const stepTiming: boolean[] = []
    const descriptions: string[] = []

    for (let i = 0; i < steps; i++) {
      const shouldUseTime = (mask & (1 << i)) !== 0
      stepTiming.push(shouldUseTime)

      if (steps === 1) {
        descriptions.push(shouldUseTime ? "선소진" : "선업글")
      } else {
        descriptions.push(`장기휴식${fromLevel + i}→${fromLevel + i + 1}${shouldUseTime ? "선소진" : "선업글"}`)
      }
    }

    strategies.push({
      stepTiming,
      description: descriptions.join(", ")
    })
  }

  return strategies
}

// 하이브리드 타이밍 전략으로 경험치 계산
export const calculateExpWithTimingStrategy = (
  oldLevels: SkillLevels,
  newLevels: SkillLevels,
  strategy: TimingStrategy,
  remainingTimeThisWeek?: number
): number => {
  const [l1Start, l2Start, l3Start] = oldLevels
  const [nl1, nl2, nl3] = newLevels
  let totalExp = 0

  if (nl1 === l1Start) {
    // 장기 휴식 레벨이 변하지 않으면 단순 계산
    const totalTime = remainingTimeThisWeek !== undefined ? remainingTimeThisWeek : getTotalTime(l1Start)
    const multiplier = getTotalMultiplier(l1Start, nl2, nl3)
    return totalTime * multiplier
  }

  // 다른 스킬(역동적, 간식)은 소급 적용되므로, 최종 레벨(nl2, nl3) 기준으로 계산

  let currentLevel = l1Start
  let remainingBaseTime = remainingTimeThisWeek !== undefined ? remainingTimeThisWeek : getTotalTime(l1Start)

  for (let stepIndex = 0; stepIndex < strategy.stepTiming.length; stepIndex++) {
    const shouldUseTimeAtThisStep = strategy.stepTiming[stepIndex]
    const nextLevel = currentLevel + 1

    if (shouldUseTimeAtThisStep) {
      // 이 단계에서 시간 소진: 현재 레벨의 시간을 현재 레벨 배율로 계산
      const multiplierAtCurrentLevel = getTotalMultiplier(currentLevel, nl2, nl3)
      totalExp += remainingBaseTime * multiplierAtCurrentLevel

      // 시간 소진 후, 레벨업으로 추가된 시간만 남음
      remainingBaseTime = HOURS_INCREASE[nextLevel] - HOURS_INCREASE[currentLevel]
    } else {
      // 이 단계에서 시간 소진하지 않음: 레벨업으로 시간만 추가
      const timeAdded = HOURS_INCREASE[nextLevel] - HOURS_INCREASE[currentLevel]
      remainingBaseTime += timeAdded
    }

    currentLevel = nextLevel
  }

  // 마지막에 남은 시간을 최종 레벨 배율로 계산
  if (remainingBaseTime > 0) {
    const finalMultiplier = getTotalMultiplier(currentLevel, nl2, nl3)
    totalExp += remainingBaseTime * finalMultiplier
  }

  return totalExp
}

// 장기 휴식을 나중에 올렸을 경우의 경험치 계산 (파이썬 calculate_exp_upgrade_later)
export const calculateExpUpgradeLater = (
  oldLevels: SkillLevels,
  newLevels: SkillLevels,
  initialHoursLeft?: number
): number => {
  const [l1Start, l2Start, l3Start] = oldLevels
  const [nl1, nl2, nl3] = newLevels

  // 초기 시간 설정 (파이썬과 동일하게)
  const timeAtStart = initialHoursLeft !== undefined
    ? initialHoursLeft
    : getTotalTime(l1Start)

  if (nl1 === l1Start) {
    // 장기 휴식 레벨이 변하지 않으면 단순 계산
    const multiplier = getTotalMultiplier(l1Start, nl2, nl3)
    return timeAtStart * multiplier
  }

  let totalExp = 0

  // 1. 주 시작 시점의 시간에 대한 경험치 계산
  const multForBaseTime = getTotalMultiplier(l1Start, nl2, nl3)
  totalExp += timeAtStart * multForBaseTime

  // 2. 장기 휴식이 여러 레벨 올랐을 경우, 각 레벨업 단계별로 추가된 시간의 경험치를 계산
  for (let intermediateL1 = l1Start; intermediateL1 < nl1; intermediateL1++) {
    const timeAdded = HOURS_INCREASE[intermediateL1 + 1] - HOURS_INCREASE[intermediateL1]
    // 추가된 시간은 다음 레벨의 배율을 적용받음
    const multForAddedTime = getTotalMultiplier(intermediateL1 + 1, nl2, nl3)
    totalExp += timeAdded * multForAddedTime
  }

  return totalExp
}

// 장기 휴식을 먼저 올렸을 경우의 경험치 계산 (파이썬 calculate_exp_upgrade_first)
export const calculateExpUpgradeFirst = (
  newLevels: SkillLevels,
  initialHoursLeft?: number
): number => {
  const [nl1, nl2, nl3] = newLevels

  // 기본 시간 설정 (파이썬과 동일하게)
  const baseTime = initialHoursLeft !== undefined
    ? initialHoursLeft
    : BASE_HOURS

  // 새 레벨의 총 시간 = 기본시간 + (새레벨 추가시간 - 0레벨 추가시간)
  const timeAtNewLevel = baseTime + (HOURS_INCREASE[nl1] - HOURS_INCREASE[0])
  const newMultiplier = getTotalMultiplier(nl1, nl2, nl3)
  return timeAtNewLevel * newMultiplier
}

// 최적 타이밍 전략 찾기
export const findOptimalTimingStrategy = (
  oldLevels: SkillLevels,
  newLevels: SkillLevels,
  remainingTimeThisWeek?: number
): { strategy: TimingStrategy; exp: number } => {
  const [l1Start] = oldLevels
  const [nl1] = newLevels

  if (nl1 === l1Start) {
    // 장기 휴식 레벨이 변하지 않으면 타이밍 무의미 (간식충전/역동적휴식만 업그레이드)
    const exp = calculateExpUpgradeLater(oldLevels, newLevels, remainingTimeThisWeek)
    return {
      strategy: { stepTiming: [], description: "선업글" },
      exp
    }
  }

  const strategies = generateTimingStrategies(l1Start, nl1)
  let bestStrategy = strategies[0]
  let bestExp = -1

  for (const strategy of strategies) {
    const exp = calculateExpWithTimingStrategy(oldLevels, newLevels, strategy, remainingTimeThisWeek)
    if (exp > bestExp) {
      bestExp = exp
      bestStrategy = strategy
    }
  }

  return { strategy: bestStrategy, exp: bestExp }
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
}

// 계산 결과
export interface LoungeCalculationResult {
  currentBoost: BoostEffect | null
  weeklyStrategy: WeeklyStrategy[]
  totalExpectedExp: number
  totalExpectedTime: number
  recommendations: string[]
}

// DP 캐시
const dpCache = new Map<string, { totalExp: number; path: WeeklyStrategy[] }>()

// DP 상태를 문자열로 변환 (메모이제이션 키)
const levelsToCacheKey = (week: number, levels: SkillLevels): string => {
  return `${week}-${levels[0]}-${levels[1]}-${levels[2]}`
}

// 모든 가능한 스킬 레벨 조합 생성
const generateSkillCombinations = (
  currentLevels: SkillLevels,
  availablePoints: number
): SkillLevels[] => {
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

  return combinations
}

// 메인 DP 함수 (파이썬 find_optimal_path)
export const findOptimalPath = (
  week: number,
  levels: SkillLevels,
  remainingTimeThisWeek?: number,
  currentRemainingPoints?: number
): { totalExp: number; path: WeeklyStrategy[] } => {
  if (week > 9) {
    return { totalExp: 0, path: [] }
  }

  const cacheKey = levelsToCacheKey(week, levels)
  if (dpCache.has(cacheKey)) {
    return dpCache.get(cacheKey)!
  }

  const [l1, l2, l3] = levels

  // 사용자가 입력한 remainingPoints가 있으면 사용하고, 없으면 기본 공식 사용
  const pointsAvailableForUpgrade = currentRemainingPoints !== undefined
    ? currentRemainingPoints
    : (() => {
        const pointsSpentAtStartOfWeek = CUMULATIVE_COST[l1] + CUMULATIVE_COST[l2] + CUMULATIVE_COST[l3]
        return (week * 20) - pointsSpentAtStartOfWeek
      })()

  let bestTotalExp = -1
  let bestNextLevels: SkillLevels = levels
  let bestTimingStrategy: TimingStrategy | null = null
  let bestThisWeekExp = 0

  // 모든 가능한 스킬 조합을 시도
  for (const newLevels of generateSkillCombinations(levels, pointsAvailableForUpgrade)) {
    // 최적 타이밍 전략 찾기 (하이브리드 중간 단계별 최적화)
    const { strategy, exp: thisWeekExp } = findOptimalTimingStrategy(levels, newLevels, remainingTimeThisWeek)

    // 다음 주차의 남은 포인트 계산
    const upgradesCost = getUpgradeCost(levels, newLevels)
    const nextWeekRemainingPoints = pointsAvailableForUpgrade - upgradesCost + 20 // 다음 주차에 20포인트 추가
    const futureResult = findOptimalPath(week + 1, newLevels, undefined, nextWeekRemainingPoints)
    const totalExp = thisWeekExp + futureResult.totalExp

    if (totalExp > bestTotalExp) {
      bestTotalExp = totalExp
      bestNextLevels = newLevels
      bestTimingStrategy = strategy
      bestThisWeekExp = thisWeekExp
    }
  }

  // 스킬 업그레이드 정보 생성
  const skillUpgrades: SkillUpgrade[] = []
  const skillTypes: SkillType[] = ['long', 'dynamic', 'snack']

  for (let i = 0; i < 3; i++) {
    if (levels[i] !== bestNextLevels[i]) {
      skillUpgrades.push({
        skillType: skillTypes[i],
        fromLevel: levels[i],
        toLevel: bestNextLevels[i],
        cost: CUMULATIVE_COST[bestNextLevels[i]] - CUMULATIVE_COST[levels[i]]
      })
    }
  }

  // 해당 주차의 총 시간 계산 (첫 주차의 경우 남은 시간 고려)
  const weeklyTotalTime = remainingTimeThisWeek !== undefined
    ? remainingTimeThisWeek
    : getTotalTime(bestNextLevels[0])

  // 해당 주차 이후 남은 포인트 계산
  const upgradesCost = getUpgradeCost(levels, bestNextLevels)
  const remainingPointsAfterThisWeek = pointsAvailableForUpgrade - upgradesCost

  const currentStrategy: WeeklyStrategy = {
    week,
    startLevels: levels,
    endLevels: bestNextLevels,
    skillUpgrades,
    timingStrategy: bestTimingStrategy,
    expectedExp: bestThisWeekExp,
    boostEffect: getActiveBoostEffect(bestNextLevels[0], bestNextLevels[1], bestNextLevels[2]),
    totalTime: weeklyTotalTime,
    remainingPoints: remainingPointsAfterThisWeek
  }

  const nextWeekRemainingPoints = remainingPointsAfterThisWeek + 20 // 다음 주차에 20포인트 추가
  const futureResult = findOptimalPath(week + 1, bestNextLevels, undefined, nextWeekRemainingPoints)
  const result = {
    totalExp: bestTotalExp,
    path: [currentStrategy, ...futureResult.path]
  }

  dpCache.set(cacheKey, result)
  return result
}

// 메인 계산 함수
export const optimizeLoungeStrategy = (input: LoungeCalculatorInput): LoungeCalculationResult => {
  // 캐시 초기화
  dpCache.clear()

  const skillLevels = skillStateToLevels(input.skillLevels)
  // 시작 주차에 남은 시간과 남은 포인트 전달
  const result = findOptimalPath(input.currentWeek, skillLevels, input.remainingTimeThisWeek, input.remainingPoints)

  // 현재 부스트 효과
  const currentBoost = getActiveBoostEffect(
    input.skillLevels.long,
    input.skillLevels.dynamic,
    input.skillLevels.snack
  )

  // 총 예상 시간 계산
  const totalExpectedTime = result.path.reduce((sum, week) => {
    return sum + getTotalTime(week.endLevels[0]) // 장기 휴식 레벨로 시간 계산
  }, 0)

  // 추천사항 생성
  const recommendations = generateRecommendations(result.path, input)

  return {
    currentBoost,
    weeklyStrategy: result.path,
    totalExpectedExp: result.totalExp,
    totalExpectedTime,
    recommendations
  }
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

      let timingText = ''
      if (currentWeekStrategy.timingStrategy && currentWeekStrategy.timingStrategy.description !== "선업글") {
        timingText = ` (${currentWeekStrategy.timingStrategy.description})`
      }

      recommendations.push(`이번 주 추천: ${upgradeNames}${timingText}`)
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

    let strategyText = ''
    if (week.skillUpgrades.length > 0) {
      // 하이브리드 타이밍 전략 처리 (콤마가 포함된 복합 전략)
      if (week.timingStrategy && week.timingStrategy.description.includes(',')) {
        // 하이브리드 전략의 경우: "장기휴식1→2선소진, 장기휴식2→3선소진" 형태를 파싱
        const timingParts = week.timingStrategy.description.split(',').map(s => s.trim())
        const strategies: string[] = []

        timingParts.forEach(part => {
          // "장기휴식1→2선소진" 형태를 "시간 소진, 장기 휴식 1->2"로 변환 (선소진 = 시간 먼저 소진)
          const matchSeonSojin = part.match(/(\S+)(\d+)→(\d+)선소진/)
          if (matchSeonSojin) {
            const [, skillName, fromLevel, toLevel] = matchSeonSojin
            const fullSkillName = skillName === '장기휴식' ? '장기 휴식' :
                                  skillName === '역동휴식' ? '역동적 휴식' :
                                  skillName === '간식충전' ? '간식 충전' : skillName
            strategies.push(`시간 소진, ${fullSkillName} ${fromLevel}->${toLevel}`)
          } else {
            // "선업글" 패턴도 확인 (예: "장기휴식1→2선업글")
            const matchSeonUpgrade = part.match(/(\S+)(\d+)→(\d+)선업글/)
            if (matchSeonUpgrade) {
              const [, skillName, fromLevel, toLevel] = matchSeonUpgrade
              const fullSkillName = skillName === '장기휴식' ? '장기 휴식' :
                                    skillName === '역동휴식' ? '역동적 휴식' :
                                    skillName === '간식충전' ? '간식 충전' : skillName
              strategies.push(`${fullSkillName} ${fromLevel}->${toLevel}, 시간 소진`)
            }
          }
        })

        if (strategies.length > 0) {
          strategyText = strategies.join(', ')
          // 마지막이 시간 소진으로 끝나지 않으면 추가
          if (!strategyText.endsWith('시간 소진')) {
            strategyText += ', 시간 소진'
          }
        } else {
          // 파싱에 실패한 경우 기본 처리
          const upgrades = week.skillUpgrades.map(upgrade => {
            const skill = SKILLS[upgrade.skillType]
            return `${skill.name} ${upgrade.fromLevel}->${upgrade.toLevel}`
          })
          strategyText = [...upgrades, '시간 소진'].join(', ')
        }
      } else {
        // 단일 전략의 경우
        const upgrades = week.skillUpgrades.map(upgrade => {
          const skill = SKILLS[upgrade.skillType]
          return `${skill.name} ${upgrade.fromLevel}->${upgrade.toLevel}`
        })

        if (week.timingStrategy?.description === "선소진") {
          // 선소진: 시간 소진이 먼저
          strategyText = ['시간 소진', ...upgrades].join(', ')
        } else {
          // 선업글: 업그레이드가 먼저
          strategyText = [...upgrades, '시간 소진'].join(', ')
        }
      }
    } else {
      strategyText = '시간 소진'
    }

    lines.push(`${week.week}주차(${totalTime}시간, ${weekSaunaEfficiency.toFixed(2)}사우나): ${strategyText}`)
  })

  return lines.join('\n')
}