/**
 * 슬롯 관리 관련 공통 유틸리티 함수들
 */

// 저장하지 않은 변경사항 경고 메시지
export const UNSAVED_CHANGES_MESSAGE = '저장하지 않은 변경사항이 있습니다. 계속하시겠습니까?'

// 슬롯 전환 시 변경사항 확인
export function confirmSlotSwitch(hasChanges: boolean): boolean {
  if (!hasChanges) return true
  return confirm(UNSAVED_CHANGES_MESSAGE)
}

// 슬롯 초기화 확인
export function confirmSlotReset(): boolean {
  return confirm('현재 슬롯의 모든 설정을 초기화하시겠습니까?')
}

// JSON 비교를 통한 변경사항 감지
export function hasDataChanged<T>(currentData: T, savedData: T | null): boolean {
  if (!savedData) return false
  return JSON.stringify(currentData) !== JSON.stringify(savedData)
}

// 슬롯 이름 유효성 검사
export function validateSlotName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 20
}

// 기본 슬롯 이름 생성
export function getDefaultSlotName(slotNumber: number): string {
  return `슬롯 ${slotNumber}`
}