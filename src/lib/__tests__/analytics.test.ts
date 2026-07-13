import { describe, expect, it } from 'vitest'

import { buildCalculationPerformanceSnapshot, buildHuntingAnalyticsSnapshot } from '../analytics'

describe('buildHuntingAnalyticsSnapshot', () => {
  it('구간화된 화이트리스트 필드만 생성한다', () => {
    const snapshot = buildHuntingAnalyticsSnapshot({
      characterLevel: 283,
      monsterLevel: 281,
      itemDropRate: 164,
      mesoRate: 87,
      normalItemCount: 2,
      specialItemCount: 8,
      usesPotion: true,
      mesoInputMode: 'detail',
      dropInputMode: 'direct',
      resultMode: 'meso_limit',
    })

    expect(snapshot).toEqual({
      calculator_type: 'hunting',
      character_level_bucket: '280_284',
      monster_level_bucket: '280_284',
      item_drop_rate_bucket: '150_174',
      meso_rate_bucket: '75_99',
      normal_item_count_bucket: '1_3',
      special_item_count_bucket: '7_plus',
      uses_potion: true,
      meso_input_mode: 'detail',
      drop_input_mode: 'direct',
      result_mode: 'meso_limit',
    })
    expect(Object.values(snapshot)).not.toContain(283)
    expect(Object.values(snapshot)).not.toContain(281)
    expect(Object.values(snapshot)).not.toContain(164)
    expect(Object.values(snapshot)).not.toContain(87)
  })
})

describe('buildCalculationPerformanceSnapshot', () => {
  it('정확한 연산 시간 대신 성능 구간만 생성한다', () => {
    const snapshot = buildCalculationPerformanceSnapshot('hunting', 137.42, [62.8, 711.3])

    expect(snapshot).toMatchObject({
      calculator_type: 'hunting',
      calculation_duration_bucket: '100_299ms',
      long_task_count_bucket: '2_3',
      max_blocking_duration_bucket: '500_999ms',
      freezing_detected: true,
    })
    expect(Object.values(snapshot)).not.toContain(137.42)
    expect(Object.values(snapshot)).not.toContain(62.8)
    expect(Object.values(snapshot)).not.toContain(711.3)
  })

  it('장기 작업이 없으면 연산 시간만으로 멈춤 여부를 판정한다', () => {
    expect(buildCalculationPerformanceSnapshot('breakeven', 38, [])).toMatchObject({
      calculation_duration_bucket: '10_49ms',
      long_task_count_bucket: '0',
      max_blocking_duration_bucket: '10_49ms',
      freezing_detected: false,
    })
  })
})
