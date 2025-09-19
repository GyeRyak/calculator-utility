'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Calendar, Clock, Zap, Target, TrendingUp, Info, Share2 } from 'lucide-react'
import AutoSlotManager from '../ui/AutoSlotManager'
import DismissibleBanner from '../ui/DismissibleBanner'
import ExportModal from '../ui/ExportModal'
import { useNotification } from '@/contexts/NotificationContext'
import NumberInput from '../ui/NumberInput'
import { formatNumber } from '../../utils/formatUtils'
import {
  getCurrentWeek,
  optimizeLoungeStrategy,
  getActiveBoostEffect,
  SKILLS,
  BOOST_EFFECTS,
  LOUNGE_EVENT,
  HOURS_INCREASE,
  JANGGI_MULT,
  YEONGDONG_MULT_AVG,
  GANSIK_MULT,
  getTotalTime,
  CUMULATIVE_COST,
  generateShareText,
  calculateSaunaEfficiency,
  type LoungeCalculatorInput,
  type LoungeCalculationResult,
  type SkillState,
  type WeeklyStrategy
} from '../../utils/loungeCalculations'
import { type LoungeCalculatorExportData } from '../../utils/exportUtils'

// 기본값 정의
const getCurrentDefaultValues = () => {
  return {
    currentWeek: 1, // 기본값을 1주차로 설정
    skillLevels: {
      long: 0,    // 장기 휴식
      dynamic: 0, // 역동적 휴식
      snack: 0    // 간식 충전
    } as SkillState,
    remainingPoints: 20, // 1주차 기본 20포인트
    remainingTimeThisWeek: 2 // 기본 2시간
  }
}

const DEFAULT_VALUES = getCurrentDefaultValues()

// 스킬 레벨별 효과 텍스트 생성
const getSkillEffectText = (skillType: keyof SkillState, level: number): string => {
  if (level === 0) return '효과 없음'

  switch (skillType) {
    case 'long':
      const totalTime = getTotalTime(level)
      const expReduction = ((1 - JANGGI_MULT[level]) * 100).toFixed(0)
      return `총 ${totalTime}시간 (기본 2시간 + ${HOURS_INCREASE[level]}시간), 경험치 ${expReduction}% 감소`

    case 'dynamic':
      const dynamicBonus = ((YEONGDONG_MULT_AVG[level] - 1) * 100).toFixed(1)
      return `경험치 +${dynamicBonus}% (평균)`

    case 'snack':
      const snackBonus = ((GANSIK_MULT[level] - 1) * 100).toFixed(0)
      return `경험치 +${snackBonus}%`

    default:
      return ''
  }
}

interface CalculationResult {
  result: LoungeCalculationResult | null
  error: string | null
}

export default function LoungeCalculator() {
  // 기본 상태
  const [currentWeek, setCurrentWeek] = useState(DEFAULT_VALUES.currentWeek)
  const [skillLevels, setSkillLevels] = useState<SkillState>(DEFAULT_VALUES.skillLevels)
  const [remainingPoints, setRemainingPoints] = useState(DEFAULT_VALUES.remainingPoints)
  const [remainingTimeThisWeek, setRemainingTimeThisWeek] = useState(DEFAULT_VALUES.remainingTimeThisWeek)

  // 자동 계산 설정
  const [autoCalculate, setAutoCalculate] = useState(true)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  // 계산 결과
  const [calculationResult, setCalculationResult] = useState<CalculationResult>({
    result: null,
    error: null
  })

  // 알림 시스템
  const { showNotification } = useNotification()

  // 현재 데이터 가져오기 (AutoSlotManager용)
  const getCurrentData = useCallback(() => {
    return {
      currentWeek,
      skillLevels,
      remainingPoints,
      remainingTimeThisWeek
    }
  }, [currentWeek, skillLevels, remainingPoints, remainingTimeThisWeek])

  // 데이터 로드 (AutoSlotManager용)
  const loadData = useCallback((data: any, onComplete?: () => void) => {
    if (data.currentWeek !== undefined) setCurrentWeek(data.currentWeek)
    if (data.skillLevels !== undefined) setSkillLevels(data.skillLevels)
    if (data.remainingPoints !== undefined) setRemainingPoints(data.remainingPoints)
    if (data.remainingTimeThisWeek !== undefined) setRemainingTimeThisWeek(data.remainingTimeThisWeek)
    if (onComplete) onComplete()
  }, [])

  // 모든 데이터 초기화 (AutoSlotManager용)
  const resetAllData = useCallback(() => {
    const newDefaults = getCurrentDefaultValues()
    setCurrentWeek(newDefaults.currentWeek)
    setSkillLevels(newDefaults.skillLevels)
    setRemainingPoints(newDefaults.remainingPoints)
    setRemainingTimeThisWeek(newDefaults.remainingTimeThisWeek)
  }, [])

  // Export 데이터 생성
  const getExportData = (): LoungeCalculatorExportData | null => {
    const currentResult = calculationResult?.result || performCalculation().result
    if (!currentResult) return null

    return {
      // 기본 설정
      currentWeek,
      remainingPoints,
      remainingTimeThisWeek,
      skillLevels,

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

        // 타이밍 전략 처리
        let timingStrategy = ''
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
              timingStrategy = strategies.join(', ')
              // 마지막이 시간 소진으로 끝나지 않으면 추가
              if (!timingStrategy.endsWith('시간 소진')) {
                timingStrategy += ', 시간 소진'
              }
            } else {
              // 파싱에 실패한 경우 기본 처리
              timingStrategy = [...upgrades, '시간 소진'].join(', ')
            }
          } else {
            // 단일 전략의 경우
            if (week.timingStrategy?.description === "선소진") {
              // 선소진: 시간 소진이 먼저
              timingStrategy = ['시간 소진', ...upgrades].join(', ')
            } else {
              // 선업글: 업그레이드가 먼저
              timingStrategy = [...upgrades, '시간 소진'].join(', ')
            }
          }
        } else {
          timingStrategy = '시간 소진'
        }

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

    // 스킬 포인트가 기존 주차의 최대값(20 × 기존주차)인 경우 새 주차에 맞게 업데이트
    if (remainingPoints === oldWeek * 20) {
      setRemainingPoints(newWeek * 20)
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

    // 장기 휴식 레벨이 증가한 경우 남은 시간 업데이트
    if (skillType === 'long' && newLevel > oldLevel) {
      // utils에서 정의된 HOURS_INCREASE 배열 사용
      const timeIncrease = HOURS_INCREASE[newLevel] - HOURS_INCREASE[oldLevel]
      setRemainingTimeThisWeek(prev => prev + timeIncrease)
    }
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
        remainingTimeThisWeek
      }

      const result = optimizeLoungeStrategy(input)

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
  }, [currentWeek, skillLevels, remainingPoints, remainingTimeThisWeek])

  // 자동 계산
  const calculate = useMemo(() => {
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

    // 1. 현재 투자된 스킬 + 남은 스킬 포인트가 주차 × 20보다 큰 경우
    const currentlyInvested = CUMULATIVE_COST[skillLevels.long] + CUMULATIVE_COST[skillLevels.dynamic] + CUMULATIVE_COST[skillLevels.snack]
    const totalPoints = currentlyInvested + remainingPoints
    const maxPossiblePoints = currentWeek * 20

    if (totalPoints > maxPossiblePoints) {
      errors.push(`투자된 포인트 + 남은 포인트(${totalPoints})가 ${currentWeek}주차 최대 포인트(${maxPossiblePoints})를 초과합니다.`)
    }

    // 2. 현재 남은 시간이 가능한 시간(2시간 + 장기휴식 시간)보다 큰 경우
    const maxPossibleTime = getTotalTime(skillLevels.long)
    if (remainingTimeThisWeek > maxPossibleTime) {
      errors.push(`남은 시간(${remainingTimeThisWeek}시간)이 장기휴식 ${skillLevels.long}레벨의 최대 시간(${maxPossibleTime}시간)을 초과합니다.`)
    }

    return errors
  }, [currentWeek, skillLevels, remainingPoints, remainingTimeThisWeek])

  // 계산 결과 업데이트
  useEffect(() => {
    setCalculationResult(calculate)
  }, [calculate])

  // 현재 활성 부스트 효과 (파이썬 순서: 장기, 역동, 간식)
  const currentBoost = getActiveBoostEffect(skillLevels.long, skillLevels.dynamic, skillLevels.snack)

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">휴게실 경험치 최적화 계산기</h1>
        <p className="text-gray-600">
          아지트 듀오 휴게실 이벤트의 최적 스킬 투자 전략을 Dynamic Programming으로 계산합니다
        </p>
      </div>

      {/* 안내 배너 */}
      <DismissibleBanner
        bannerId="lounge-calculator-info"
        message="📅 휴게실 이벤트 정보: 2025년 9월 18일 ~ 11월 19일 (9주). 주간 최대 20포인트 획득 가능."
        bgColor="bg-blue-50"
        borderColor="border-blue-200"
        textColor="text-blue-800"
        linkHref="https://maplestory.nexon.com/News/Event/Ongoing/1200"
        linkText="이벤트 페이지 보기"
        showIcon={false}
      />

      {/* 메소레인저 화이트 세트 안내 */}
      <DismissibleBanner
        bannerId="lounge-mesoranger-white-set"
        message="💡 휴게실에서 모든 메소레인저와 대화하면 메소레인저 화이트 코디 세트를 받을 수 있습니다. 놓치지 마세요!"
        bgColor="bg-yellow-50"
        borderColor="border-yellow-200"
        textColor="text-yellow-800"
        linkHref="https://maplestory.nexon.com/News/Event/Ongoing/1200"
        linkText="이벤트 페이지 보기"
        showIcon={false}
      />

      {/* 포인트 계산 주의사항 안내 */}
      <DismissibleBanner
        bannerId="lounge-points-notice"
        message="⚠️ 이번 주 포인트는 남은 스킬 포인트에 포함하여 작성해 주세요. 이후 다음 주차부터 매주 20포인트를 획득하는 것으로 가정합니다. 1주차/20포인트/2시간을 제외한 계산에 대해 검증하지 않았으니 유의해 주세요."
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
            </div>
          </div>
          {/* 현재 상태 입력 섹션 끝 */}

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
                />
                <p className="text-xs text-gray-500 mt-1">
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
                />
                <p className="text-xs text-gray-500 mt-1">
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
                />
                <p className="text-xs text-gray-500 mt-1">
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
                <p className="text-green-700">경험치 {((currentBoost.multiplier - 1) * 100).toFixed(0)}% 증가</p>
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
              {BOOST_EFFECTS.map((boost, index) => (
                <div
                  key={index}
                  className={`text-xs p-2 rounded ${
                    currentBoost?.name === boost.name
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-50 text-gray-600'
                  }`}
                >
                  <span className="font-medium">{boost.name}</span>
                  <span className="ml-2">({((boost.multiplier - 1) * 100).toFixed(0)}% 증가)</span>
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
                  onClick={() => setCalculationResult(performCalculation())}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  계산하기
                </button>
              )}
            </div>
          </div>
          {calculationResult.error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-800 mb-2">계산 오류</h2>
              <p className="text-red-700">{calculationResult.error}</p>
            </div>
          ) : calculationResult.result ? (
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
                  <div className="mb-4 space-y-2">
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
                      {calculationResult.result.totalExpectedExp.toFixed(3)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      최적 전략 적용 시 상대적 경험치
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800">총 예상 시간</h3>
                    <p className="text-2xl font-bold text-green-900">
                      {formatNumber(calculationResult.result.totalExpectedTime)}시간
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      9주간 누적 휴게실 이용 시간
                    </p>
                  </div>
                </div>

                {/* 추천사항 */}
                {calculationResult.result.recommendations.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">추천사항:</h4>
                    <ul className="space-y-1">
                      {calculationResult.result.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <Info className="mr-2 h-4 w-4 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
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
                  {calculationResult.result.weeklyStrategy.map((week) => (
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
          )}
        </div>
      </div>

      {/* 내보내기 모달 */}
      {calculationResult.result && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          data={getExportData()!}
          type="lounge"
        />
      )}
    </div>
  )
}

// 주차별 전략 카드 컴포넌트
function WeeklyStrategyCard({ strategy }: { strategy: WeeklyStrategy }) {
  const [long, dynamic, snack] = strategy.endLevels

  return (
    <div className="border rounded-lg p-4 space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{strategy.week}주차</h3>
        <div className="text-sm text-gray-600">
          {strategy.timingStrategy?.description || '변화없음'}
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
            경험치 {((strategy.boostEffect.multiplier - 1) * 100).toFixed(0)}% 증가
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
}