import { describe, expect, it } from 'vitest'

import {
  decodeSettingsExport,
  encodeSettingsExport,
  getCalculatorSlotKey,
  SETTINGS_EXPORT_PREFIX,
} from '../slotStorage'

describe('슬롯 저장 형식', () => {
  it('기존 localStorage 키 형식을 유지한다', () => {
    expect(getCalculatorSlotKey('basic_calculator', 3)).toBe('basic_calculator_slot_3')
  })

  it('한글 설정을 기존 공유 형식으로 왕복 변환한다', () => {
    const settings = {
      calculator: 'basic_calculator',
      slotName: '사냥 설정',
      data: { monsterLevel: 285, itemName: '솔 에르다 조각' },
      version: '1.0' as const,
      exportedAt: '2025-01-01T00:00:00.000Z',
    }

    const encoded = encodeSettingsExport(settings)
    expect(encoded.startsWith(SETTINGS_EXPORT_PREFIX)).toBe(true)
    expect(decodeSettingsExport(encoded)).toEqual(settings)
  })

  it('지원하지 않는 형식을 거부한다', () => {
    expect(() => decodeSettingsExport('invalid')).toThrow('올바른 설정 형식이 아닙니다.')
  })
})
