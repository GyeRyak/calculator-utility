'use client'

import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react'
import { Calendar, Clock, Zap, Target, TrendingUp, Info, Share2, ChevronDown, ChevronUp } from 'lucide-react'
import AutoSlotManager from '../ui/AutoSlotManager'
import DismissibleBanner from '../ui/DismissibleBanner'
import ExportModal from '../ui/ExportModal'
import { useNotification } from '@/contexts/NotificationContext'
import NumberInput from '../ui/NumberInput'
import { formatNumber } from '../../utils/formatUtils'
import {
  getCurrentWeek,
  optimizeLoungeStrategy,
  OptimizedLoungeCalculator,
  getActiveBoostEffect,
  actionsToDetailedString,
  actionsToDetailedItems,
  SKILLS,
  BOOST_EFFECTS,
  LOUNGE_EVENT,
  HOURS_INCREASE,
  JANGGI_MULT,
  YEONGDONG_MULT_AVG,
  GANSIK_MULT,
  getTotalTime,
  CUMULATIVE_COST,
  SCALE_FACTORS,
  generateShareText,
  calculateSaunaEfficiency,
  type LoungeCalculatorInput,
  type LoungeCalculationResult,
  type SkillState,
  type WeeklyStrategy
} from '../../utils/loungeCalculations'
import { type LoungeCalculatorExportData } from '../../utils/exportUtils'
import { trackCalculation } from '@/lib/analytics'

// 기본값 정의
const getCurrentDefaultValues = () => {
  // 기본 주간 포인트 배열 (1주차부터 9주차까지, 모든 주 20포인트)
  const defaultWeeklyPoints = Array(9).fill(20)

  return {
    currentWeek: 1, // 기본값을 1주차로 설정
    skillLevels: {
      long: 0,    // 장기 휴식
      dynamic: 0, // 역동적 휴식
      snack: 0    // 간식 충전
    } as SkillState,
    remainingPoints: 20, // 1주차 기본 20포인트
    remainingTimeThisWeek: 2, // 기본 2시간
    // 장기 휴식 제한 관련
    enableLongRestLimit: true, // 제한 활성화 여부
    maxLongRestLevel: 5, // 기본 최대 레벨
    // 주간 획득 포인트 (1주차부터 9주차까지)
    weeklyPoints: defaultWeeklyPoints
  }
}

const DEFAULT_VALUES = getCurrentDefaultValues()

// 스킬 레벨별 효과 텍스트 생성
const getSkillEffectText = (skillType: keyof SkillState, level: number): string => {
  if (level === 0) return '효과 없음'

  switch (skillType) {
    case 'long':
      const totalTime = getTotalTime(level)
      const expReduction = ((1 - JANGGI_MULT[level] / SCALE_FACTORS.long) * 100).toFixed(0)
      return `총 ${totalTime}시간 (기본 2시간 + ${HOURS_INCREASE[level]}시간), 경험치 ${expReduction}% 감소`

    case 'dynamic':
      const dynamicBonus = ((YEONGDONG_MULT_AVG[level] / SCALE_FACTORS.dynamic - 1) * 100).toFixed(1)
      return `경험치 +${dynamicBonus}% (평균)`

    case 'snack':
      const snackBonus = ((GANSIK_MULT[level] / SCALE_FACTORS.snack - 1) * 100).toFixed(0)
      return `경험치 +${snackBonus}%`

    default:
      return ''
  }
}

export default function LoungeCalculator() {
  // 기본 상태
  const [currentWeek, setCurrentWeek] = useState(DEFAULT_VALUES.currentWeek)
  const [skillLevels, setSkillLevels] = useState<SkillState>(DEFAULT_VALUES.skillLevels)
  const [remainingPoints, setRemainingPoints] = useState(DEFAULT_VALUES.remainingPoints)
  const [remainingTimeThisWeek, setRemainingTimeThisWeek] = useState(DEFAULT_VALUES.remainingTimeThisWeek)

  // 장기 휴식 제한 관련 상태
  const [enableLongRestLimit, setEnableLongRestLimit] = useState(DEFAULT_VALUES.enableLongRestLimit)
  const [maxLongRestLevel, setMaxLongRestLevel] = useState(DEFAULT_VALUES.maxLongRestLevel)

  // 주간 획득 포인트 상태
  const [weeklyPoints, setWeeklyPoints] = useState<number[]>(DEFAULT_VALUES.weeklyPoints)

  // 자동 계산 설정
  const [autoCalculate, setAutoCalculate] = useState(true)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  // 주간 포인트 상세 입력 표시 상태
  const [showWeeklyPointsDetail, setShowWeeklyPointsDetail] = useState(false)

  // 수동 계산 결과 (버튼 클릭 시에만 사용)
  const [manualCalculation, setManualCalculation] = useState<{ result: LoungeCalculationResult | null; error: string | null } | null>(null)

  // 최적화된 계산기 인스턴스
  const [optimizedCalculator] = useState(() => new OptimizedLoungeCalculator())
  const lastCalculatorStateRef = useRef('')

  // 알림 시스템
  const { showNotification } = useNotification()

  // 현재 데이터 가져오기 (AutoSlotManager용)
  const getCurrentData = useCallback(() => {
    return {
      currentWeek,
      skillLevels,
      remainingPoints,
      remainingTimeThisWeek,
      enableLongRestLimit,
      maxLongRestLevel,
      weeklyPoints
    }
  }, [currentWeek, skillLevels, remainingPoints, remainingTimeThisWeek, enableLongRestLimit, maxLongRestLevel, weeklyPoints])

  // 데이터 로드 (AutoSlotManager용)
  const loadData = useCallback((data: any, onComplete?: () => void) => {
    if (data.currentWeek !== undefined) setCurrentWeek(data.currentWeek)
    if (data.skillLevels !== undefined) setSkillLevels(data.skillLevels)
    if (data.remainingPoints !== undefined) setRemainingPoints(data.remainingPoints)
    if (data.remainingTimeThisWeek !== undefined) setRemainingTimeThisWeek(data.remainingTimeThisWeek)
    if (data.enableLongRestLimit !== undefined) setEnableLongRestLimit(data.enableLongRestLimit)
    if (data.maxLongRestLevel !== undefined) setMaxLongRestLevel(data.maxLongRestLevel)
    if (data.weeklyPoints !== undefined) setWeeklyPoints(data.weeklyPoints)
    if (onComplete) onComplete()
  }, [])

  // 모든 데이터 초기화 (AutoSlotManager용)
  const resetAllData = useCallback(() => {
    const newDefaults = getCurrentDefaultValues()
    setCurrentWeek(newDefaults.currentWeek)
    setSkillLevels(newDefaults.skillLevels)
    setRemainingPoints(newDefaults.remainingPoints)
    setRemainingTimeThisWeek(newDefaults.remainingTimeThisWeek)
    setEnableLongRestLimit(newDefaults.enableLongRestLimit)
    setMaxLongRestLevel(newDefaults.maxLongRestLevel)
    setWeeklyPoints(newDefaults.weeklyPoints)
  }, [])

  // Export 데이터 생성
  const getExportData = (): LoungeCalculatorExportData | null => {
    const currentCalculation = manualCalculation || autoCalculation
    const currentResult = currentCalculation?.result || performCalculation().result
    if (!currentResult) return null

    return {
      // 기본 설정
      currentWeek,
      remainingPoints,
      remainingTimeThisWeek,
      weeklyPoints,
      skillLevels,

      // 장기 휴식 제한 설정
      isLimited: currentResult.isLimited,
      maxLongRestLevel: currentResult.maxLongRestLevel,
      weeklyMaxHours: currentResult.weeklyMaxHours,
      lossComparedToUnlimited: currentResult.lossComparedToUnlimited,
      unlimitedTotalTime: currentResult.unlimitedTotalTime,
      unlimitedTotalExp: currentResult.unlimitedTotalExp,

      // 계산 결과
      totalExpectedExp: currentResult.totalExpectedExp,
      totalExpectedTime: currentResult.totalExpectedTime,
      saunaEfficiency: calculateSaunaEfficiency(currentResult.totalExpectedExp),

      // 주차별 전략
      weeklyStrategy: currentResult.weeklyStrategy.map(week => {
        const upgrades = week.skillUpgrades.map(upgrade => {
          const skill = SKILLS[upgrade.skillType]
          return `${skill.name} ${upgrade.fromLevel}->${upgrade.toLevel}`
        })

        // actions를 사용한 타이밍 전략 생성
        const timingStrategy = week.actions.length > 0
          ? actionsToDetailedString(week.actions, week.startLevels)
          : '시간 소진'

        return {
          week: week.week,
          skillUpgrades: upgrades,
          timingStrategy,
          totalTime: getTotalTime(week.endLevels[0]),
          weekSaunaEfficiency: calculateSaunaEfficiency(week.expectedExp)
        }
      }),

      // 계산 일시
      calculatedAt: new Date().toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Seoul'
      })
    }
  }

  // 공유하기 함수 (모달 열기)
  const handleShare = () => {
    const exportData = getExportData()
    if (!exportData) {
      showNotification('error', '계산 결과가 없습니다')
      return
    }
    setIsExportModalOpen(true)
  }

  // 현재 주차 업데이트 (스킬 포인트 자동 계산)
  const updateCurrentWeek = (newWeek: number) => {
    const oldWeek = currentWeek
    setCurrentWeek(newWeek)

    // 스킬 포인트가 기존 주차의 최대값인 경우 새 주차에 맞게 업데이트
    const oldMaxPoints = weeklyPoints.slice(0, oldWeek).reduce((sum, points) => sum + points, 0)
    const newMaxPoints = weeklyPoints.slice(0, newWeek).reduce((sum, points) => sum + points, 0)

    if (remainingPoints === oldMaxPoints) {
      setRemainingPoints(newMaxPoints)
    }
  }

  // 스킬 레벨 업데이트
  const updateSkillLevel = (skillType: keyof SkillState, level: number) => {
    const oldLevel = skillLevels[skillType]
    const newLevel = Math.max(0, Math.min(8, level))

    setSkillLevels(prev => ({
      ...prev,
      [skillType]: newLevel
    }))

    // 장기 휴식 레벨 변경 시 남은 시간 업데이트
    if (skillType === 'long') {
      if (newLevel > oldLevel) {
        // 레벨 증가: 시간 추가
        const timeIncrease = HOURS_INCREASE[newLevel] - HOURS_INCREASE[oldLevel]
        setRemainingTimeThisWeek(prev => prev + timeIncrease)
      } else if (newLevel < oldLevel) {
        // 레벨 감소: 최대 시간을 초과하지 않도록 조정
        const maxTime = getTotalTime(newLevel)
        setRemainingTimeThisWeek(prev => Math.min(prev, maxTime))
      }
    }
  }

  // 특정 주차의 포인트 업데이트
  const updateWeeklyPoint = (weekIndex: number, points: number) => {
    const newPoints = Math.max(0, Math.min(20, Math.round(points))) // 0~20 정수로 제한
    setWeeklyPoints(prev => {
      const newWeeklyPoints = [...prev]
      newWeeklyPoints[weekIndex] = newPoints
      return newWeeklyPoints
    })
  }

  // 모든 미래 주차를 같은 포인트로 설정
  const setAllFutureWeeksPoints = (points: number) => {
    const validPoints = Math.max(0, Math.min(20, points))
    setWeeklyPoints(prev => {
      const newWeeklyPoints = [...prev]
      // 현재 주차 이후의 모든 주차를 같은 포인트로 설정
      for (let i = currentWeek; i < 9; i++) {
        newWeeklyPoints[i] = validPoints
      }
      return newWeeklyPoints
    })
  }

  // 실제 계산 로직 (자동/수동 계산 모두 사용)
  const performCalculation = useCallback(() => {
    try {
      // 입력 검증
      if (currentWeek < 1 || currentWeek > LOUNGE_EVENT.TOTAL_WEEKS) {
        return {
          result: null,
          error: `주차는 1~${LOUNGE_EVENT.TOTAL_WEEKS} 범위여야 합니다.`
        }
      }

      if (remainingPoints < 0) {
        return {
          result: null,
          error: '남은 포인트는 0 이상이어야 합니다.'
        }
      }

      if (remainingTimeThisWeek < 0 || remainingTimeThisWeek > 60) {
        return {
          result: null,
          error: '이번 주 남은 시간은 0~60시간 범위여야 합니다.'
        }
      }

      const input: LoungeCalculatorInput = {
        currentWeek,
        skillLevels,
        remainingPoints,
        remainingTimeThisWeek,
        maxLongRestLevel: enableLongRestLimit ? maxLongRestLevel : undefined,
        weeklyPoints
      }

      // 입력 상태 해시 생성 (제한 설정 제외 - 제한은 사전계산 결과 재조립만 하므로)
      const currentState = JSON.stringify({
        currentWeek,
        skillLevels,
        remainingPoints,
        remainingTimeThisWeek,
        weeklyPoints
      })

      // 기본 입력이 변경되면 캐시 초기화하고 재계산
      if (lastCalculatorStateRef.current !== currentState) {
        optimizedCalculator.calculateFull({
          ...input,
          maxLongRestLevel: undefined // 제한 없이 전체 계산
        })
        lastCalculatorStateRef.current = currentState
      }

      // 제한 레벨에 따른 결과 반환 (빠른 재구성)
      const result = optimizedCalculator.getResultForLimit(
        input,
        enableLongRestLimit ? maxLongRestLevel : undefined
      )

      trackCalculation('lounge') // GA 이벤트 트래킹

      return {
        result,
        error: null
      }
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : '계산 중 오류가 발생했습니다.'
      }
    }
  }, [currentWeek, skillLevels, remainingPoints, remainingTimeThisWeek, enableLongRestLimit, maxLongRestLevel, weeklyPoints, optimizedCalculator])

  // 자동 계산
  const autoCalculation = useMemo(() => {
    if (!autoCalculate) {
      return {
        result: null,
        error: null
      }
    }
    return performCalculation()
  }, [autoCalculate, performCalculation])

  // 유효성 검증
  const validationErrors = useMemo(() => {
    const errors: string[] = []

    // 1. 현재 투자된 스킬 + 남은 스킬 포인트가 현재 주차까지 최대 포인트보다 큰 경우
    const currentlyInvested = CUMULATIVE_COST[skillLevels.long] + CUMULATIVE_COST[skillLevels.dynamic] + CUMULATIVE_COST[skillLevels.snack]
    const totalPoints = currentlyInvested + remainingPoints
    const maxPossiblePoints = 20 * currentWeek

    if (totalPoints > maxPossiblePoints) {
      errors.push(`투자된 포인트 + 남은 포인트(${totalPoints})가 ${currentWeek}주차 최대 포인트(${maxPossiblePoints})를 초과합니다.`)
    }

    // 2. 현재 남은 시간이 가능한 시간(2시간 + 장기휴식 시간)보다 큰 경우
    const maxPossibleTime = getTotalTime(skillLevels.long)
    if (remainingTimeThisWeek > maxPossibleTime) {
      errors.push(`남은 시간(${remainingTimeThisWeek}시간)이 장기휴식 ${skillLevels.long}레벨의 최대 시간(${maxPossibleTime}시간)을 초과합니다.`)
    }

    // 3. 장기 휴식 제한이 활성화되어 있고 현재 레벨이 제한을 초과하는 경우
    if (enableLongRestLimit && skillLevels.long > maxLongRestLevel) {
      errors.push(`현재 장기 휴식 레벨(${skillLevels.long})이 설정된 최대 레벨(${maxLongRestLevel})을 초과합니다.`)
    }

    return errors
  }, [currentWeek, skillLevels, remainingPoints, remainingTimeThisWeek, enableLongRestLimit, maxLongRestLevel])

  // 현재 활성 부스트 효과 (파이썬 순서: 장기, 역동, 간식)
  const currentBoost = getActiveBoostEffect(skillLevels.long, skillLevels.dynamic, skillLevels.snack)

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">휴게실 경험치 최적화 계산기</h1>
        <p className="text-gray-600">
          아지트 듀오 휴게실 이벤트의 최적 스킬 투자 전략을{' '}
          <a
            href="https://namu.wiki/w/Dynamic%20Programming"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            Dynamic Programming
          </a>
          으로 계산합니다 ({' '}
          <a
            href="/blog/agit-duo-lounge-dp"
            className="text-purple-600 underline hover:no-underline text-sm"
          >
            관련 블로그 글 보기
          </a>
          {' '})
        </p>
      </div>

      {/* 안내 배너 */}
      <DismissibleBanner
        bannerId="lounge-calculator-info"
        message="📅 휴게실 이벤트 정보: 2025년 9월 18일 ~ 11월 19일 (9주). 주간 최대 20포인트 획득 가능. 휴게실에서 모든 메소레인저와 대화하면 메소레인저 화이트 코디 세트를 받을 수 있습니다. 놓치지 마세요!"
        bgColor="bg-blue-50"
        borderColor="border-blue-200"
        textColor="text-blue-800"
        linkHref="https://maplestory.nexon.com/News/Event/Ongoing/1200"
        linkText="이벤트 페이지 보기"
        showIcon={false}
      />

      {/* 메소레인저 화이트 다이아 세트 안내 */}
      <DismissibleBanner
        bannerId="lounge-mesoranger-white-set"
        message="💡 [히든미션] 모든 메소레인저와 대화를 3일 진행하면 메소레인저 화이트 다이아 세트를 받을 수 있습니다. 놓치지 마세요!"
        bgColor="bg-yellow-50"
        borderColor="border-yellow-200"
        textColor="text-yellow-800"
        linkHref="https://www.inven.co.kr/board/maple/5974/5678876"
        linkText="관련 게시글 보기"
        showIcon={false}
      />

      {/* 포인트 계산 주의사항 안내 */}
      <DismissibleBanner
        bannerId="lounge-points-notice"
        message="⚠️ 기본 설정(1주차/20포인트/2시간/매주20포인트)을 제외한 상황에 대해서는 충분히 검증되지 않았으니 유의해 주세요."
        bgColor="bg-orange-50"
        borderColor="border-orange-200"
        textColor="text-orange-800"
        linkHref=""
        linkText=""
        showIcon={false}
      />

      {/* AutoSlotManager */}
      <AutoSlotManager
        calculatorId="lounge_calculator"
        maxSlots={3}
        getCurrentData={getCurrentData}
        loadData={loadData}
        onReset={resetAllData}
        onNotification={showNotification}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 입력 패널 */}
        <div className="space-y-6">
          {/* 현재 상태 입력 섹션 시작 */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              현재 상태
            </h2>

            <div className="space-y-4">
              {/* 현재 주차 */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  현재 주차 (9월 18일 = 1주차)
                </label>
                <div className="flex gap-2 items-center">
                  <NumberInput
                    value={currentWeek}
                    onChange={updateCurrentWeek}
                    min={1}
                    max={LOUNGE_EVENT.TOTAL_WEEKS}
                    placeholder="현재 주차"
                    className="flex-1"
                  />
                  <button
                    onClick={() => updateCurrentWeek(getCurrentWeek())}
                    className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors whitespace-nowrap"
                  >
                    지금으로 설정
                  </button>
                </div>
              </div>

              {/* 남은 포인트 */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  남은 스킬 포인트
                </label>
                <NumberInput
                  value={remainingPoints}
                  onChange={setRemainingPoints}
                  min={0}
                  placeholder="남은 포인트"
                />
              </div>

              {/* 이번 주 남은 시간 */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  이번 주 남은 시간 (시간)
                </label>
                <NumberInput
                  value={remainingTimeThisWeek}
                  onChange={setRemainingTimeThisWeek}
                  min={0}
                  max={60} // 장기 휴식 8레벨 기준 최대 시간
                  placeholder="남은 시간"
                />
              </div>

              {/* 장기 휴식 최대 레벨 제한 */}
              <div className="border-t pt-4">
                <div className="flex items-center space-x-3 mb-3">
                  <input
                    type="checkbox"
                    id="enableLongRestLimit"
                    checked={enableLongRestLimit}
                    onChange={(e) => setEnableLongRestLimit(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <label htmlFor="enableLongRestLimit" className="text-sm font-medium text-gray-700">
                    장기 휴식 최대 레벨 제한
                  </label>
                </div>

                {enableLongRestLimit && (
                  <div className="ml-6 space-y-2">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">최대 레벨:</label>
                      <NumberInput
                        value={maxLongRestLevel}
                        onChange={setMaxLongRestLevel}
                        min={0}
                        max={8}
                        placeholder="최대 레벨"
                        className="w-20"
                        aria-describedby="maxLongRestLevel-help"
                      />
                    </div>
                    <p id="maxLongRestLevel-help" className="text-xs text-blue-600">
                      1주일 잠수 시간 {getTotalTime(maxLongRestLevel)}시간 이내
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* 현재 상태 입력 섹션 끝 */}

          {/* 주간 획득 포인트 설정 섹션 시작 */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              주간 획득 포인트 설정
            </h2>

            <div className="space-y-4">
              {/* 기본 설정 영역 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-blue-800">
                    {currentWeek + 1}주차부터 9주차까지 기본 설정
                  </h3>
                  <span className="text-sm text-blue-600">
                    ({9 - currentWeek}주간)
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-blue-700">
                    모든 주차 포인트:
                  </label>
                  <NumberInput
                    value={currentWeek < 9 ? weeklyPoints[currentWeek] : 20}
                    onChange={(value) => setAllFutureWeeksPoints(value)}
                    min={0}
                    max={20}
                    placeholder="포인트"
                    className="w-24"
                  />
                  <span className="text-sm text-blue-600">포인트/주</span>
                </div>

                <div className="text-xs text-blue-600 mt-2 space-y-1">
                  <p>💡 위 설정을 변경하면 {currentWeek + 1}주차부터 9주차까지 모든 주차가 같은 포인트로 설정됩니다.</p>
                  <p>⚠️ {currentWeek}주차 포인트는 위의 &apos;남은 스킬 포인트&apos;에 합산하여 입력해 주세요.</p>
                </div>
              </div>

              {/* 상세 설정 접기/펼치기 */}
              {currentWeek < 9 && (
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setShowWeeklyPointsDetail(!showWeeklyPointsDetail)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-700">
                      주차별 상세 설정 ({currentWeek + 1}주차 ~ 9주차)
                    </span>
                    {showWeeklyPointsDetail ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>

                  {showWeeklyPointsDetail && (
                    <div className="border-t border-gray-200 p-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Array.from({ length: 9 - currentWeek }, (_, index) => {
                          const weekIndex = currentWeek + index
                          const weekNum = weekIndex + 1
                          return (
                            <div key={weekIndex} className="flex items-center gap-2">
                              <label className="text-sm font-medium text-gray-600 min-w-[50px]">
                                {weekNum}주차:
                              </label>
                              <NumberInput
                                value={weeklyPoints[weekIndex]}
                                onChange={(value) => updateWeeklyPoint(weekIndex, value)}
                                min={0}
                                max={20}
                                placeholder="포인트"
                                className="flex-1"
                                forceCompact={true}
                                size="sm"
                              />
                            </div>
                          )
                        })}
                      </div>

                      <div className="mt-3 p-3 bg-gray-50 rounded text-xs text-gray-600">
                        💡 각 주차별로 0~20포인트 범위에서 획득할 포인트를 개별 설정할 수 있습니다.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 현재 주차가 9주차인 경우 안내 */}
              {currentWeek >= 9 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-gray-600">9주차는 마지막 주차입니다. 추가 포인트 설정이 불필요합니다.</p>
                </div>
              )}
            </div>
          </div>
          {/* 주간 획득 포인트 설정 섹션 끝 */}

          {/* 스킬 레벨 입력 섹션 시작 */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Zap className="mr-2 h-5 w-5" />
              현재 스킬 레벨
            </h2>

            <div className="space-y-4">
              {/* 장기 휴식 */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {SKILLS.long.name} (시간 증가, 경험치 감소)
                </label>
                <NumberInput
                  value={skillLevels.long}
                  onChange={(value) => updateSkillLevel('long', value)}
                  min={0}
                  max={8}
                  placeholder="레벨"
                  aria-describedby="skillLevels-long-help"
                />
                <p id="skillLevels-long-help" className="text-xs text-gray-500 mt-1">
                  {getSkillEffectText('long', skillLevels.long)}
                </p>
              </div>

              {/* 역동적 휴식 */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {SKILLS.dynamic.name} (경험치 증가)
                </label>
                <NumberInput
                  value={skillLevels.dynamic}
                  onChange={(value) => updateSkillLevel('dynamic', value)}
                  min={0}
                  max={8}
                  placeholder="레벨"
                  aria-describedby="skillLevels-dynamic-help"
                />
                <p id="skillLevels-dynamic-help" className="text-xs text-gray-500 mt-1">
                  {getSkillEffectText('dynamic', skillLevels.dynamic)}
                </p>
              </div>

              {/* 간식 충전 */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {SKILLS.snack.name} (경험치 증가)
                </label>
                <NumberInput
                  value={skillLevels.snack}
                  onChange={(value) => updateSkillLevel('snack', value)}
                  min={0}
                  max={8}
                  placeholder="레벨"
                  aria-describedby="skillLevels-snack-help"
                />
                <p id="skillLevels-snack-help" className="text-xs text-gray-500 mt-1">
                  {getSkillEffectText('snack', skillLevels.snack)}
                </p>
              </div>
            </div>
          </div>
          {/* 스킬 레벨 입력 섹션 끝 */}

          {/* 현재 부스트 효과 섹션 시작 */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Target className="mr-2 h-5 w-5" />
              현재 부스트 효과
            </h2>

            {currentBoost ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800">{currentBoost.name}</h3>
                <p className="text-green-700">경험치 {((currentBoost.multiplier / SCALE_FACTORS.boost - 1) * 100).toFixed(0)}% 증가</p>
                <p className="text-sm text-green-600 mt-1">{currentBoost.description}</p>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-600">활성화된 부스트 효과가 없습니다</p>
              </div>
            )}

            {/* 부스트 효과 목록 */}
            <div className="mt-4 space-y-2">
              <h4 className="font-medium text-sm text-gray-700">모든 부스트 효과:</h4>
              {BOOST_EFFECTS.map((boost) => (
                <div
                  key={boost.name}
                  className={`text-xs p-2 rounded ${
                    currentBoost?.name === boost.name
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-50 text-gray-600'
                  }`}
                >
                  <span className="font-medium">{boost.name}</span>
                  <span className="ml-2">({((boost.multiplier / SCALE_FACTORS.boost - 1) * 100).toFixed(0)}% 증가)</span>
                  <br />
                  <span className="text-xs">{boost.description}</span>
                </div>
              ))}
            </div>
          </div>
          {/* 현재 부스트 효과 섹션 끝 */}

        </div>

        {/* 결과 패널 */}
        <div className="space-y-6">
          {/* 계산 설정 */}
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoCalculate"
                  checked={autoCalculate}
                  onChange={(e) => setAutoCalculate(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <label htmlFor="autoCalculate" className="text-sm font-medium text-gray-700">
                  자동 계산
                </label>
              </div>

              {/* 수동 계산 버튼 */}
              {!autoCalculate && (
                <button
                  onClick={() => setManualCalculation(performCalculation())}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  계산하기
                </button>
              )}
            </div>
          </div>
          {(() => {
            const currentCalculation = manualCalculation || autoCalculation
            return currentCalculation.error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-red-800 mb-2">계산 오류</h2>
                <p className="text-red-700">{currentCalculation.error}</p>
              </div>
            ) : currentCalculation.result ? (
            <>
              {/* 전체 요약 섹션 시작 */}
              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    최적화 결과
                  </h2>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    공유하기
                  </button>
                </div>

                {/* 유효성 검증 경고 */}
                {validationErrors.length > 0 && (
                  <div className="mb-4 space-y-2" role="alert" aria-live="polite">
                    {validationErrors.map((error, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-start">
                          <span className="text-red-600 mr-2">⚠️</span>
                          <span className="text-red-800 text-sm">{error}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800">총 예상 경험치</h3>
                    <p className="text-2xl font-bold text-blue-900">
                      {currentCalculation.result.totalExpectedExp.toFixed(3)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      최적 전략 적용 시 상대적 경험치
                    </p>
                    <p className="text-xs text-blue-500 mt-1">
                      사우나 기준 {(currentCalculation.result.totalExpectedExp * 0.8).toFixed(1)}시간
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800">총 예상 시간</h3>
                    <p className="text-2xl font-bold text-green-900">
                      {formatNumber(currentCalculation.result.totalExpectedTime)}시간
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      9주간 누적 휴게실 이용 시간
                    </p>
                    <p className="text-xs text-green-500 mt-1">
                      {(9 - currentWeek + 1)}주간 주 평균 {(currentCalculation.result.totalExpectedTime / (9 - currentWeek + 1)).toFixed(1)}시간
                    </p>
                  </div>
                </div>

                {/* 장기 휴식 제한 정보 */}
                {currentCalculation.result.isLimited && currentCalculation.result.maxLongRestLevel !== undefined && currentCalculation.result.maxLongRestLevel < 8 && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <span className="text-yellow-600 mr-2">⚠️</span>
                      <div className="space-y-2">
                        <p className="text-yellow-800 font-medium">
                          장기 휴식 {currentCalculation.result.maxLongRestLevel}레벨 제한 적용
                        </p>
                        <p className="text-yellow-700 text-sm">
                          주당 최대 {currentCalculation.result.weeklyMaxHours}시간 잠수
                        </p>
                        {currentCalculation.result.lossComparedToUnlimited && currentCalculation.result.lossComparedToUnlimited > 0 ? (
                          <p className="text-yellow-700 text-sm">
                            제한 없을 때 대비{' '}
                            {currentCalculation.result.unlimitedTotalTime! - currentCalculation.result.totalExpectedTime}시간 덜 잠수하여{' '}
                            사우나 {currentCalculation.result.lossComparedToUnlimited.toFixed(2)}시간어치
                            ({((currentCalculation.result.lossComparedToUnlimited / currentCalculation.result.totalExpectedExp) * 100).toFixed(1)}%) 손실
                          </p>
                        ) : (
                          <p className="text-green-700 text-sm">
                            ✅ 현재 설정에서는 제한이 최적 전략에 영향을 주지 않습니다. 제한을 풀어도 결과가 동일합니다.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 최대 포인트 미획득 경고 */}
                {(() => {
                  const maxPointsComparison = optimizedCalculator.getMaxPointsComparison(currentCalculation.result)
                  return maxPointsComparison && maxPointsComparison.lossExp > 0 ? (
                    <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <span className="text-orange-600 mr-2">📈</span>
                        <div className="space-y-2">
                          <p className="text-orange-800 font-medium">
                            최대 포인트 미획득
                          </p>
                          <p className="text-orange-700 text-sm">
                            매주 20포인트 모두 획득 및 장기 휴식 제한 없는 최적 전략 사용 시 사우나 {maxPointsComparison.lossSaunaHours.toFixed(1)}시간어치
                            ({((maxPointsComparison.lossExp / currentCalculation.result.totalExpectedExp) * 100).toFixed(1)}%) 추가 획득 가능
                          </p>
                          <p className="text-orange-600 text-xs">
                            현재 설정: {currentCalculation.result.totalExpectedExp.toFixed(3)} → 최대 포인트: {maxPointsComparison.maxPointsExp.toFixed(3)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null
                })()}

                {/* 추천사항 */}
                {currentCalculation.result.recommendations.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">추천사항:</h4>
                    <ul className="space-y-1">
                      {currentCalculation.result.recommendations.map((rec, index) => {
                        // "이번 주 추천: " 부분이 있으면 색상 적용
                        const prefix = '이번 주 추천: '
                        if (rec.startsWith(prefix)) {
                          const actionText = rec.substring(prefix.length)
                          // 현재 주차의 전략에서 actions 찾기
                          const currentWeekStrategy = currentCalculation.result?.weeklyStrategy.find(s => s.week === currentWeek)
                          if (currentWeekStrategy && currentWeekStrategy.actions.length > 0) {
                            const items = actionsToDetailedItems(currentWeekStrategy.actions, currentWeekStrategy.startLevels)
                            return (
                              <li key={index} className="text-sm text-gray-600 flex items-start">
                                <Info className="mr-2 h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>
                                  {prefix}
                                  {items.map((item, itemIndex) => (
                                    <span key={itemIndex}>
                                      {item.parts ? (
                                        <span>
                                          <span className={item.isLongRestWithoutExhaust ? 'text-orange-600 font-semibold' : ''}>
                                            {item.parts.prefix}
                                          </span>
                                          {item.parts.startLevel}
                                          <span className={item.isMultiLevel ? 'text-orange-600 font-semibold' : ''}>
                                            {item.parts.arrow}{item.parts.endLevel}
                                          </span>
                                          {item.parts.suffix}
                                        </span>
                                      ) : (
                                        <span>{item.text}</span>
                                      )}
                                      {itemIndex < items.length - 1 && ', '}
                                    </span>
                                  ))}
                                </span>
                              </li>
                            )
                          }
                        }
                        // 기본 표시
                        return (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <Info className="mr-2 h-4 w-4 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>
              {/* 전체 요약 섹션 끝 */}

              {/* 주차별 전략 섹션 시작 */}
              <div className="bg-white border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  주차별 최적 전략
                </h2>

                <div className="space-y-4">
                  {currentCalculation.result.weeklyStrategy.map((week) => (
                    <WeeklyStrategyCard key={week.week} strategy={week} />
                  ))}
                </div>
              </div>
              {/* 주차별 전략 섹션 끝 */}
            </>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <p className="text-gray-600 text-center">계산 결과가 여기에 표시됩니다</p>
              </div>
            )
          })()}
        </div>
      </div>

      {/* 내보내기 모달 */}
      {(() => {
        const currentCalculation = manualCalculation || autoCalculation
        return currentCalculation.result && (
          <ExportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            data={getExportData()!}
            type="lounge"
          />
        )
      })()}
    </div>
  )
}

// 주차별 전략 카드 컴포넌트
const WeeklyStrategyCard = memo(function WeeklyStrategyCard({ strategy }: { strategy: WeeklyStrategy }) {
  const [long, dynamic, snack] = strategy.endLevels

  return (
    <div className="border rounded-lg p-4 space-y-3 min-w-0">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold flex-shrink-0" style={{ minWidth: '60px' }}>{strategy.week}주차</h3>
        <div className="text-sm text-gray-600 min-w-0 flex-1 text-right">
          <span style={{ whiteSpace: 'nowrap', overflowWrap: 'anywhere' }}>
            {strategy.actions.length > 0 ?
              actionsToDetailedItems(strategy.actions, strategy.startLevels)
                .map((item, index, array) => (
                  <span key={index}>
                    {item.parts ? (
                      <span>
                        <span className={item.isLongRestWithoutExhaust ? 'text-orange-600 font-semibold' : ''}>
                          {item.parts.prefix}
                        </span>
                        {item.parts.startLevel}
                        <span className={item.isMultiLevel ? 'text-orange-600 font-semibold' : ''}>
                          {item.parts.arrow}{item.parts.endLevel}
                        </span>
                        {item.parts.suffix}
                      </span>
                    ) : (
                      <span>{item.text}</span>
                    )}
                    {index < array.length - 1 && <><span>, </span><wbr /></>}
                  </span>
                ))
              : '변화없음'
            }
          </span>
        </div>
      </div>

      {/* 스킬 업그레이드 */}
      {strategy.skillUpgrades.length > 0 ? (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">스킬 업그레이드:</h4>
          <div className="space-y-1">
            {strategy.skillUpgrades.map((upgrade, index) => (
              <div key={index} className="text-sm bg-blue-50 rounded px-2 py-1">
                {SKILLS[upgrade.skillType].name}: {upgrade.fromLevel}→{upgrade.toLevel}레벨
                ({upgrade.cost}포인트)
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">스킬 업그레이드 없음</div>
      )}

      {/* 부스트 효과 */}
      {strategy.boostEffect ? (
        <div className="bg-green-50 rounded p-2">
          <div className="text-sm font-medium text-green-800">{strategy.boostEffect.name}</div>
          <div className="text-xs text-green-600">
            경험치 {((strategy.boostEffect.multiplier / SCALE_FACTORS.boost - 1) * 100).toFixed(0)}% 증가
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-500">활성 부스트 없음</div>
      )}

      {/* 결과 */}
      <div className="grid grid-cols-1 gap-2 text-sm">
        <div>
          <span className="text-gray-600">예상 경험치: </span>
          <span className="font-medium">{strategy.expectedExp.toFixed(3)}</span>
          <span className="text-gray-500 ml-1">(사우나 {(strategy.expectedExp * 0.8).toFixed(1)}시간)</span>
        </div>
        <div>
          <span className="text-gray-600">총 시간: </span>
          <span className="font-medium">{strategy.totalTime}시간</span>
        </div>
        <div>
          <span className="text-gray-600">남은 포인트: </span>
          <span className="font-medium">{strategy.remainingPoints}점</span>
        </div>
      </div>

      {/* 주차 종료 시 스킬 레벨 */}
      <div className="text-xs text-gray-500 border-t pt-2">
        주차 종료: 장기 {long}레벨, 역동적 {dynamic}레벨, 간식 {snack}레벨
      </div>
    </div>
  )
})
