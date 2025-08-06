/**
 * 몬스터 레벨에 따른 메소 드롭량 계산
 * 참고: https://strategywiki.org/wiki/MapleStory/Formulas#Meso_Drop
 */

export interface MesoDropRange {
  minimum: number
  maximum: number
  average: number
  currentAverageMultiplier: number
}

// 최대 메소 드롭 배율 (91+ 레벨 구간의 평균 배율)
export const maxAverageMultiplier = 7.5
export const maxAverageMinMonsterLevel = 91

/**
 * 몬스터 레벨에 따른 메소 드롭량 범위 계산
 */
export function calculateMesoDropByLevel(monsterLevel: number): MesoDropRange {
  let minMultiplier: number
  let maxMultiplier: number
  
  if (monsterLevel === 1) {
    minMultiplier = 1
    maxMultiplier = 1
  } else if (monsterLevel >= 2 && monsterLevel <= 20) {
    minMultiplier = 1.6
    maxMultiplier = 2.4
  } else if (monsterLevel >= 21 && monsterLevel <= 30) {
    minMultiplier = 2.0
    maxMultiplier = 3.0
  } else if (monsterLevel >= 31 && monsterLevel <= 40) {
    minMultiplier = 2.4
    maxMultiplier = 3.6
  } else if (monsterLevel >= 41 && monsterLevel <= 50) {
    minMultiplier = 2.8
    maxMultiplier = 4.2
  } else if (monsterLevel >= 51 && monsterLevel <= 60) {
    minMultiplier = 4.0
    maxMultiplier = 6.0
  } else if (monsterLevel >= 61 && monsterLevel <= 70) {
    minMultiplier = 4.8
    maxMultiplier = 7.2
  } else if (monsterLevel >= 71 && monsterLevel <= 80) {
    minMultiplier = 5.2
    maxMultiplier = 7.8
  } else if (monsterLevel >= 81 && monsterLevel <= 90) {
    minMultiplier = 5.6
    maxMultiplier = 8.4
  } else { // 91+
    minMultiplier = 6.0
    maxMultiplier = 9.0
  }
  
  const minimum = Math.floor(minMultiplier * monsterLevel)
  const maximum = Math.floor(maxMultiplier * monsterLevel)
  const average = Math.floor((minimum + maximum) / 2)
  const currentAverageMultiplier = average / monsterLevel
  
  return {
    minimum,
    maximum,
    average,
    currentAverageMultiplier
  }
}

/**
 * 몬스터 레벨에 따른 평균 메소 드롭량 (기존 함수 대체용)
 */
export function getAverageMesoDropByLevel(monsterLevel: number): number {
  return calculateMesoDropByLevel(monsterLevel).average
}

/**
 * 몬스터 레벨에 따른 평균 메소 드롭 배율 반환
 */
export function getCurrentMesoMultiplier(monsterLevel: number): number {
  return calculateMesoDropByLevel(monsterLevel).currentAverageMultiplier
}

/**
 * 현재 몬스터 레벨이 최적의 메소 배율인지 확인
 */
export function isOptimalMesoLevel(monsterLevel: number): boolean {
  const currentMultiplier = getCurrentMesoMultiplier(monsterLevel)
  return currentMultiplier === maxAverageMultiplier
}