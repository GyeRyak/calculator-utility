import { describe, expect, it } from 'vitest'

import { quickEstimate } from '../hangeul-medal/lib/hangeulTitleCalculations'
import {
  calculateExpWithTimingStrategy,
  getBoostMultiplier,
  getCurrentWeek,
  getTotalTime,
  getUpgradeCost,
  scaleToOriginal,
} from '../lounge/lib/loungeCalculations'
import {
  calculateAchievementProbability,
  checkGoalAchievement,
  TARGET_ALPHABETS,
} from '../origami/lib/origamiCalculations'
import {
  convertMinutesToUnit,
  convertUnitToMinutes,
  getHuntTimeStr,
  getOriginalUnitCount,
} from '../../../utils/timeUnitUtils'

describe('휴게실 계산', () => {
  it('스킬 시간, 비용, 부스트 경계를 유지한다', () => {
    expect(getTotalTime(0)).toBe(2)
    expect(getTotalTime(8)).toBe(60)
    expect(getUpgradeCost([0, 0, 0], [1, 2, 0])).toBe(45)
    expect(getBoostMultiplier(5, 5, 0)).toBe(168)
    expect(getBoostMultiplier(3, 3, 3)).toBe(159)
    expect(getBoostMultiplier(7, 0, 0)).toBe(158)
    expect(scaleToOriginal(200_000_000)).toBe(1)
  })

  it('이벤트 주차와 기본 경험치 계산 결과를 유지한다', () => {
    expect(getCurrentWeek(new Date('2025-09-01'))).toBe(1)
    expect(getCurrentWeek(new Date('2025-09-25'))).toBe(2)
    expect(getCurrentWeek(new Date('2025-12-01'))).toBe(9)
    expect(calculateExpWithTimingStrategy([0, 0, 0], [0, 0, 0], { stepTiming: [] })).toBe(2)
  })
})

describe('이벤트 확률 계산', () => {
  it('완성된 한글날 훈장은 추가 비용이 없다', () => {
    expect(quickEstimate([1, 1, 1])).toEqual({ expectedResets: 0, expectedCost: 0 })
    expect(quickEstimate([0, 0, 0])).toMatchInlineSnapshot(`
      {
        "expectedCost": 535,
        "expectedResets": 175,
      }
    `)
  })

  it('완성된 알파벳 보유 상태는 항상 성공한다', () => {
    expect(checkGoalAchievement({ ...TARGET_ALPHABETS })).toEqual({
      achieved: true,
      completionRate: 100,
      shortage: Object.fromEntries(Object.keys(TARGET_ALPHABETS).map((key) => [key, 0])),
    })

    const result = calculateAchievementProbability({
      normalPapers: 0,
      colorfulPapers: 0,
      currentAlphabets: { ...TARGET_ALPHABETS },
      iterations: 5,
    })
    expect(result.achievementProbability).toBe(100)
    expect(result.simulationResults).toEqual({ iterations: 5, successRate: 100 })
  })
})

describe('시간 단위 변환', () => {
  it('분 환산과 사용자 표시를 유지한다', () => {
    expect(convertUnitToMinutes(2, 'hours')).toBe(120)
    expect(convertMinutesToUnit(1, 'seconds')).toBe(60)
    expect(getOriginalUnitCount(90, 'hours')).toEqual({
      count: 2,
      displayValue: 1.5,
      displayUnit: '1시간 30분',
    })
    expect(getHuntTimeStr(30, 'minutes', true, 150, 'meso_limit')).toBe('메제(2시간 30분)')
  })
})
