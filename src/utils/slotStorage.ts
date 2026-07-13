import { canUseFunctionalCookies } from './cookies'

export const SETTINGS_EXPORT_PREFIX = 'CALC_SETTINGS_V1:'

interface ExportedSettings<T> {
  calculator: string
  slotName: string
  data: T
  version: '1.0'
  exportedAt: string
}

export function getCalculatorSlotKey(calculatorId: string, slotNumber: number): string {
  return `${calculatorId}_slot_${slotNumber}`
}

export function hasCalculatorSlotData(calculatorId: string, slotNumber: number): boolean {
  if (!canUseFunctionalCookies()) return false

  try {
    return localStorage.getItem(getCalculatorSlotKey(calculatorId, slotNumber)) !== null
  } catch {
    return false
  }
}

export function loadCalculatorSlot<T>(calculatorId: string, slotNumber: number): T | null {
  if (!canUseFunctionalCookies()) return null

  try {
    const savedData = localStorage.getItem(getCalculatorSlotKey(calculatorId, slotNumber))
    return savedData ? JSON.parse(savedData) as T : null
  } catch (error) {
    console.error('Failed to load slot data:', error)
    return null
  }
}

export function saveCalculatorSlot(
  calculatorId: string,
  slotNumber: number,
  data: unknown
): boolean {
  if (!canUseFunctionalCookies()) return false

  try {
    localStorage.setItem(getCalculatorSlotKey(calculatorId, slotNumber), JSON.stringify(data))
    return true
  } catch (error) {
    console.error('Failed to save slot data:', error)
    return false
  }
}

export function deleteCalculatorSlot(calculatorId: string, slotNumber: number): boolean {
  if (!canUseFunctionalCookies()) return false

  try {
    localStorage.removeItem(getCalculatorSlotKey(calculatorId, slotNumber))
    return true
  } catch (error) {
    console.error('Failed to delete slot data:', error)
    return false
  }
}

export function encodeSettingsExport<T>(settings: ExportedSettings<T>): string {
  const bytes = encodeURIComponent(JSON.stringify(settings)).replace(
    /%([0-9A-F]{2})/g,
    (_, hex: string) => String.fromCharCode(parseInt(hex, 16))
  )
  return `${SETTINGS_EXPORT_PREFIX}${btoa(bytes)}`
}

export function decodeSettingsExport<T>(value: string): ExportedSettings<T> {
  const trimmedValue = value.trim()
  if (!trimmedValue.startsWith(SETTINGS_EXPORT_PREFIX)) {
    throw new Error('올바른 설정 형식이 아닙니다.')
  }

  const encoded = trimmedValue.slice(SETTINGS_EXPORT_PREFIX.length)
  const json = decodeURIComponent(
    atob(encoded)
      .split('')
      .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join('')
  )

  return JSON.parse(json) as ExportedSettings<T>
}
