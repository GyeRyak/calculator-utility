// 보스 표시 순서 정의
export const BOSS_DISPLAY_ORDER = [
  // 월간 보스 (제일 앞에 배치)
  { bossId: 'black_mage', difficulty: 'extreme' },
  { bossId: 'black_mage', difficulty: 'hard' },
  { bossId: 'kaling', difficulty: 'extreme' },
  { bossId: 'baldrix', difficulty: 'hard' },
  { bossId: 'kalos', difficulty: 'extreme' },
  { bossId: 'limbo', difficulty: 'hard' },
  { bossId: 'chosen_seren', difficulty: 'extreme' },
  
  // 주간 보스
  { bossId: 'kaling', difficulty: 'hard' },
  { bossId: 'baldrix', difficulty: 'normal' },
  { bossId: 'kalos', difficulty: 'chaos' },
  { bossId: 'limbo', difficulty: 'normal' },
  { bossId: 'kaling', difficulty: 'normal' },
  { bossId: 'lotus', difficulty: 'extreme' },
  { bossId: 'kalos', difficulty: 'normal' },
  { bossId: 'kaling', difficulty: 'easy' },
  { bossId: 'kalos', difficulty: 'easy' },
  { bossId: 'chosen_seren', difficulty: 'hard' },
  { bossId: 'chosen_seren', difficulty: 'normal' },
  { bossId: 'verus_hilla', difficulty: 'hard' },
  { bossId: 'darknell', difficulty: 'hard' },
  { bossId: 'gloom', difficulty: 'chaos' },
  { bossId: 'verus_hilla', difficulty: 'normal' },
  { bossId: 'guardian_angel_slime', difficulty: 'chaos' },
  { bossId: 'will', difficulty: 'hard' },
  { bossId: 'lucid', difficulty: 'hard' },
  { bossId: 'damien', difficulty: 'hard' },
  { bossId: 'lotus', difficulty: 'hard' },
  { bossId: 'darknell', difficulty: 'normal' },
  { bossId: 'gloom', difficulty: 'normal' },
  { bossId: 'will', difficulty: 'normal' },
  { bossId: 'lucid', difficulty: 'normal' },
  { bossId: 'guardian_angel_slime', difficulty: 'normal' }
]

// 보스-난이도 조합의 표시 순서를 가져오는 함수
export function getBossDisplayOrder(bossId: string, difficulty: string): number {
  const index = BOSS_DISPLAY_ORDER.findIndex(
    item => item.bossId === bossId && item.difficulty === difficulty
  )
  
  // 정의되지 않은 보스-난이도 조합은 맨 뒤로
  return index === -1 ? 9999 : index
}

// 보스 목록을 표시 순서에 따라 정렬하는 함수
export function sortBossListByDisplayOrder<T extends { bossId: string; difficulty: string }>(bossList: T[]): T[] {
  return [...bossList].sort((a, b) => {
    const orderA = getBossDisplayOrder(a.bossId, a.difficulty)
    const orderB = getBossDisplayOrder(b.bossId, b.difficulty)
    
    return orderA - orderB
  })
}

// 보스 목록을 한 줄로 표시하기 위한 문자열 생성 (미리보기용)
export function formatBossListInline(bossList: { bossId: string; difficulty: string }[]): string {
  // 표시 순서로 정렬
  const sortedBosses = sortBossListByDisplayOrder(bossList)
  
  // 보스 이름 가져오기
  const bossNames = sortedBosses.map(boss => {
    const { getBossById, getBossDifficulty } = require('@/data/bossData')
    const bossData = getBossById(boss.bossId)
    const difficultyData = getBossDifficulty(boss.bossId, boss.difficulty)
    
    if (!bossData || !difficultyData) {
      return `${boss.bossId}(${boss.difficulty})`
    }
    
    // 난이도와 보스 이름 사이에 공백 추가
    return `${difficultyData.name} ${bossData.name}`
  })
  
  return bossNames.join(', ')
}

// 보스 목록을 여러 줄로 표시하기 위한 문자열 배열 생성 (미리보기용)
export function formatBossListMultiline(bossList: { bossId: string; difficulty: string }[], maxLines: number = 3): string[] {
  // 표시 순서로 정렬
  const sortedBosses = sortBossListByDisplayOrder(bossList)
  
  // 보스 이름 가져오기
  const bossNames = sortedBosses.map(boss => {
    const { getBossById, getBossDifficulty } = require('@/data/bossData')
    const bossData = getBossById(boss.bossId)
    const difficultyData = getBossDifficulty(boss.bossId, boss.difficulty)
    
    if (!bossData || !difficultyData) {
      return `${boss.bossId}(${boss.difficulty})`
    }
    
    // 난이도와 보스 이름 사이에 공백 추가
    return `${difficultyData.name} ${bossData.name}`
  })
  
  // maxLines 수만큼만 반환
  return bossNames.slice(0, maxLines)
}