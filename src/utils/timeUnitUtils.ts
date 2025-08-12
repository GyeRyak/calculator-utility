// 시간 단위 관련 유틸리티 함수들

/**
 * 시간 단위 타입 정의
 */
export type TimeUnitCode = 'seconds' | 'minutes' | 'hours' | 'mini_wealth' | 'full_wealth' | 'gen' | 'meso_limit'

/**
 * 시간 단위 정보 인터페이스
 */
export interface TimeUnitInfo {
  code: TimeUnitCode
  korean: string
  shortKorean: string // 짧은 형태 (예: 재획비 -> 재획)
  minutesPerUnit: number // 해당 단위 1개가 몇 분인지 (분 기준 환산값)
}

/**
 * 시간 단위 매핑 테이블 (분 기준 환산)
 */
export const TIME_UNIT_MAP: Record<TimeUnitCode, TimeUnitInfo> = {
  'seconds': { code: 'seconds', korean: '초', shortKorean: '초', minutesPerUnit: 1/60 }, // 1초 = 1/60분
  'minutes': { code: 'minutes', korean: '분', shortKorean: '분', minutesPerUnit: 1 }, // 1분 = 1분
  'hours': { code: 'hours', korean: '시간', shortKorean: '시간', minutesPerUnit: 60 }, // 1시간 = 60분
  'mini_wealth': { code: 'mini_wealth', korean: '소형 재물 획득의 비약', shortKorean: '소재', minutesPerUnit: 1 }, // 소재 1개 = 1분으로 가정
  'full_wealth': { code: 'full_wealth', korean: '재물 획득의 비약', shortKorean: '재획', minutesPerUnit: 1 }, // 재획 1개 = 1분으로 가정
  'gen': { code: 'gen', korean: '젠', shortKorean: '젠', minutesPerUnit: 0.125 }, // 1젠 = 7.5초 = 0.125분
  'meso_limit': { code: 'meso_limit', korean: '메소 제한', shortKorean: '메제', minutesPerUnit: 1 } // 메소 제한은 분 단위로 표시
}

/**
 * 시간 단위 코드를 한글로 변환
 */
export function getTimeUnitKorean(code: TimeUnitCode, useShort: boolean = false): string {
  const unitInfo = TIME_UNIT_MAP[code]
  return useShort ? unitInfo.shortKorean : unitInfo.korean
}

/**
 * 시간을 시간과 분으로 분해
 */
export function splitTimeToHoursAndMinutes(time: number): { hours: number; minutes: number } {
  const hours = Math.floor(time)
  const minutes = Math.round((time - hours) * 60)
  return { hours, minutes }
}

/**
 * 분 단위 시간을 원본 시간 단위로 환산
 * @param minutes 분 단위 시간
 * @param targetUnit 변환할 시간 단위
 * @returns 해당 단위로 환산된 값
 */
export function convertMinutesToUnit(minutes: number, targetUnit: TimeUnitCode): number {
  const unitInfo = TIME_UNIT_MAP[targetUnit]
  return minutes / unitInfo.minutesPerUnit
}

/**
 * 원본 시간 단위를 분 단위로 환산
 * @param value 원본 값
 * @param fromUnit 원본 시간 단위
 * @returns 분 단위로 환산된 값
 */
export function convertUnitToMinutes(value: number, fromUnit: TimeUnitCode): number {
  const unitInfo = TIME_UNIT_MAP[fromUnit]
  return value * unitInfo.minutesPerUnit
}

/**
 * 분 단위 시간을 원본 시간 단위의 개수로 환산하여 반환
 * @param minutes 분 단위 시간
 * @param originalUnit 원본 시간 단위
 * @returns 원본 단위 개수와 실제 표시될 값
 */
export function getOriginalUnitCount(minutes: number, originalUnit: TimeUnitCode): { 
  count: number; 
  displayValue: number; 
  displayUnit: string 
} {
  const unitInfo = TIME_UNIT_MAP[originalUnit]
  const exactCount = minutes / unitInfo.minutesPerUnit
  
  // 매우 작은 단위(젠, 초 등)의 경우 최소 1개로 처리
  let count: number
  if (unitInfo.minutesPerUnit < 1 && exactCount > 0 && exactCount < 1) {
    count = 1 // 1젠 미만이어도 최소 1젠으로 표시
  } else {
    count = Math.round(exactCount)
  }
  
  // 표시용 값 계산 (시간의 경우 시간과 분으로 분리할 수 있음)
  if (originalUnit === 'hours' && minutes >= 60) {
    const { hours, minutes: remainingMinutes } = splitTimeToHoursAndMinutes(minutes / 60)
    return {
      count,
      displayValue: hours + (remainingMinutes / 60),
      displayUnit: remainingMinutes > 0 ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`
    }
  }
  
  return {
    count,
    displayValue: count,
    displayUnit: count === 1 ? unitInfo.shortKorean : `${count}${unitInfo.shortKorean}`
  }
}

/**
 * 몬스터 사냥량 문자열 생성
 * 예: "젠당 39마리", "1시간 2분당 2500마리", "분당 195마리", "6분당 1900마리"
 * @param huntTime 분 단위로 환산된 사냥 시간
 * @param huntTimeUnit 원본 시간 단위 코드
 * @param monsterCount 몬스터 수량
 */
export function getMonsterPerTimeStr(huntTime: number, huntTimeUnit: TimeUnitCode, monsterCount: number): string {
  const { displayUnit } = getOriginalUnitCount(huntTime, huntTimeUnit)
  return `${displayUnit}당 ${formatNumber(monsterCount)}마리`
}

/**
 * 사냥 시간 문자열 생성
 * 예: "1소재", "4시간", "1재획", "30분", "메제(2시간 30분)"
 * @param huntTime 분 단위로 환산된 사냥 시간 (기본값, resultTime이 있으면 무시됨)
 * @param huntTimeUnit 원본 시간 단위 코드 (기본값, resultTimeUnit이 있으면 무시됨)
 * @param isCustomResultTime 사용자 정의 결과 시간 사용 여부
 * @param resultTime 분 단위로 환산된 결과 시간
 * @param resultTimeUnit 결과 시간 단위 코드
 */
export function getHuntTimeStr(
  huntTime: number, 
  huntTimeUnit: TimeUnitCode, 
  isCustomResultTime?: boolean, 
  resultTime?: number, 
  resultTimeUnit?: TimeUnitCode
): string {
  // 결과 시간이 설정되어 있으면 결과 시간을 사용 (isCustomResultTime 무관)
  // resultTime이 0이 아니거나, resultTimeUnit이 meso_limit인 경우
  if (resultTime !== undefined && resultTimeUnit && (resultTime > 0 || resultTimeUnit === 'meso_limit')) {
    if (resultTimeUnit === 'meso_limit') {
      // 메소 제한인 경우 특별 표시
      const { hours, minutes } = splitTimeToHoursAndMinutes(resultTime / 60)
      
      if (hours > 0 && minutes > 0) {
        return `메제(${hours}시간 ${minutes}분)`
      } else if (hours > 0) {
        return `메제(${hours}시간)`
      } else if (minutes > 0) {
        return `메제(${minutes}분)`
      } else {
        return `메제`
      }
    } else {
      // 일반적인 결과 시간
      // resultTime은 분 단위이므로, 적절한 단위로 변환하여 표시
      if (resultTime >= 60) {
        const hours = Math.floor(resultTime / 60)
        const mins = Math.round(resultTime % 60)
        if (mins > 0) {
          return `${hours}시간 ${mins}분`
        } else {
          return `${hours}시간`
        }
      } else {
        return `${Math.round(resultTime)}분`
      }
    }
  } else {
    // 기본 사냥 시간 사용
    const { displayUnit } = getOriginalUnitCount(huntTime, huntTimeUnit)
    return displayUnit
  }
}

/**
 * 숫자를 천 단위 콤마 형식으로 포맷 (외부 의존성 제거를 위해 여기서 구현)
 */
function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(num))
}