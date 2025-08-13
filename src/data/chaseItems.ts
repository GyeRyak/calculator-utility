// 물욕템 데이터 정의
export interface ChaseItem {
  id: string
  name: string
  category: 'pitched_boss' | 'dawn_boss' | 'radiant_boss' | 'ring_box' | 'grindstone' | 'exceptional' | 'misc_chase'
  defaultPrice: number // 메소
  isDropAffected: 'normal' | 'log' | 'none'
}

// 보스별 아이템 드롭률 정의
export interface ItemDropRate {
  bossId: string
  difficulty: string
  itemId: string
  defaultDropRate: number // 소수점 (0.01 = 1%)
}

export const ITEM_DROP_RATES: ItemDropRate[] = [
  // 가디언 엔젤 링
  { bossId: 'guardian_angel_slime', difficulty: 'normal', itemId: 'guardian_angel_ring', defaultDropRate: 0.01 }, // 1%
  { bossId: 'guardian_angel_slime', difficulty: 'chaos', itemId: 'guardian_angel_ring', defaultDropRate: 0.05 }, // 5%
  
  // 반지 상자들 (1.5%)
  { bossId: 'guardian_angel_slime', difficulty: 'normal', itemId: 'ring_box_lv1', defaultDropRate: 0.015 },
  { bossId: 'guardian_angel_slime', difficulty: 'chaos', itemId: 'ring_box_lv3', defaultDropRate: 0.015 },
  { bossId: 'lotus', difficulty: 'hard', itemId: 'ring_box_lv2', defaultDropRate: 0.015 },
  { bossId: 'lotus', difficulty: 'extreme', itemId: 'ring_box_lv4', defaultDropRate: 0.015 },
  { bossId: 'damien', difficulty: 'hard', itemId: 'ring_box_lv2', defaultDropRate: 0.015 },
  { bossId: 'lucid', difficulty: 'normal', itemId: 'ring_box_lv1', defaultDropRate: 0.015 },
  { bossId: 'lucid', difficulty: 'hard', itemId: 'ring_box_lv2', defaultDropRate: 0.015 },
  { bossId: 'will', difficulty: 'normal', itemId: 'ring_box_lv1', defaultDropRate: 0.015 },
  { bossId: 'will', difficulty: 'hard', itemId: 'ring_box_lv2', defaultDropRate: 0.015 },
  { bossId: 'gloom', difficulty: 'normal', itemId: 'ring_box_lv1', defaultDropRate: 0.015 },
  { bossId: 'gloom', difficulty: 'chaos', itemId: 'ring_box_lv3', defaultDropRate: 0.015 },
  { bossId: 'verus_hilla', difficulty: 'normal', itemId: 'ring_box_lv2', defaultDropRate: 0.015 },
  { bossId: 'verus_hilla', difficulty: 'hard', itemId: 'ring_box_lv3', defaultDropRate: 0.015 },
  { bossId: 'darknell', difficulty: 'normal', itemId: 'ring_box_lv1', defaultDropRate: 0.015 },
  { bossId: 'darknell', difficulty: 'hard', itemId: 'ring_box_lv3', defaultDropRate: 0.015 },
  { bossId: 'chosen_seren', difficulty: 'normal', itemId: 'ring_box_lv3', defaultDropRate: 0.015 },
  { bossId: 'chosen_seren', difficulty: 'hard', itemId: 'ring_box_lv4', defaultDropRate: 0.015 },
  { bossId: 'chosen_seren', difficulty: 'extreme', itemId: 'ring_box_lv4', defaultDropRate: 0.015 },
  { bossId: 'kalos', difficulty: 'easy', itemId: 'ring_box_lv4', defaultDropRate: 0.015 },
  { bossId: 'kalos', difficulty: 'normal', itemId: 'ring_box_lv4', defaultDropRate: 0.015 },
  { bossId: 'kalos', difficulty: 'chaos', itemId: 'ring_box_lv5', defaultDropRate: 0.015 },
  { bossId: 'kalos', difficulty: 'extreme', itemId: 'ring_box_lv5', defaultDropRate: 0.015 },
  { bossId: 'kaling', difficulty: 'easy', itemId: 'ring_box_lv4', defaultDropRate: 0.015 },
  { bossId: 'kaling', difficulty: 'normal', itemId: 'ring_box_lv4', defaultDropRate: 0.015 },
  { bossId: 'kaling', difficulty: 'hard', itemId: 'ring_box_lv5', defaultDropRate: 0.015 },
  { bossId: 'kaling', difficulty: 'extreme', itemId: 'ring_box_lv5', defaultDropRate: 0.015 },
  { bossId: 'limbo', difficulty: 'normal', itemId: 'ring_box_lv5', defaultDropRate: 0.015 },
  { bossId: 'limbo', difficulty: 'hard', itemId: 'ring_box_lv5', defaultDropRate: 0.015 },
  { bossId: 'baldrix', difficulty: 'normal', itemId: 'ring_box_lv5', defaultDropRate: 0.015 },
  { bossId: 'baldrix', difficulty: 'hard', itemId: 'ring_box_lv5', defaultDropRate: 0.015 },
  { bossId: 'black_mage', difficulty: 'hard', itemId: 'ring_box_lv4', defaultDropRate: 0.015 },
  { bossId: 'black_mage', difficulty: 'extreme', itemId: 'ring_box_lv4', defaultDropRate: 0.015 },

  // 칠흑 아이템들 (하드 0.4%, 익스트림 1.5%)
  { bossId: 'lotus', difficulty: 'hard', itemId: 'berserked', defaultDropRate: 0.004 },
  { bossId: 'lotus', difficulty: 'extreme', itemId: 'berserked', defaultDropRate: 0.015 },
  { bossId: 'lotus', difficulty: 'hard', itemId: 'black_heart', defaultDropRate: 0.004 },
  { bossId: 'lotus', difficulty: 'extreme', itemId: 'black_heart', defaultDropRate: 0.015 },
  { bossId: 'lotus', difficulty: 'extreme', itemId: 'complete_under_control', defaultDropRate: 0.015 },
  { bossId: 'damien', difficulty: 'hard', itemId: 'magic_eyepatch', defaultDropRate: 0.004 },
  { bossId: 'lucid', difficulty: 'hard', itemId: 'dreamy_belt', defaultDropRate: 0.004 },
  { bossId: 'will', difficulty: 'hard', itemId: 'cursed_spellbook', defaultDropRate: 0.004 },
  { bossId: 'gloom', difficulty: 'chaos', itemId: 'endless_terror', defaultDropRate: 0.004 },
  { bossId: 'verus_hilla', difficulty: 'hard', itemId: 'source_of_suffering', defaultDropRate: 0.004 },
  { bossId: 'darknell', difficulty: 'hard', itemId: 'commanding_force_earring', defaultDropRate: 0.004 },
  { bossId: 'black_mage', difficulty: 'hard', itemId: 'genesis_badge', defaultDropRate: 0.004 },
  { bossId: 'black_mage', difficulty: 'extreme', itemId: 'genesis_badge', defaultDropRate: 0.015 },
  { bossId: 'chosen_seren', difficulty: 'hard', itemId: 'mitras_rage', defaultDropRate: 0.004 },
  { bossId: 'chosen_seren', difficulty: 'extreme', itemId: 'mitras_rage', defaultDropRate: 0.015 },

  // 여명 아이템들 (노말 1%, 하드/카오스/익스트림 2.5%)
  { bossId: 'lucid', difficulty: 'normal', itemId: 'twilight_mark', defaultDropRate: 0.01 },
  { bossId: 'lucid', difficulty: 'hard', itemId: 'twilight_mark', defaultDropRate: 0.025 },
  { bossId: 'will', difficulty: 'normal', itemId: 'twilight_mark', defaultDropRate: 0.01 },
  { bossId: 'will', difficulty: 'hard', itemId: 'twilight_mark', defaultDropRate: 0.025 },
  { bossId: 'gloom', difficulty: 'normal', itemId: 'estella_earrings', defaultDropRate: 0.01 },
  { bossId: 'gloom', difficulty: 'chaos', itemId: 'estella_earrings', defaultDropRate: 0.025 },
  { bossId: 'darknell', difficulty: 'normal', itemId: 'estella_earrings', defaultDropRate: 0.01 },
  { bossId: 'darknell', difficulty: 'hard', itemId: 'estella_earrings', defaultDropRate: 0.025 },
  { bossId: 'verus_hilla', difficulty: 'normal', itemId: 'daybreak_pendant', defaultDropRate: 0.01 },
  { bossId: 'verus_hilla', difficulty: 'hard', itemId: 'daybreak_pendant', defaultDropRate: 0.025 },
  { bossId: 'chosen_seren', difficulty: 'normal', itemId: 'daybreak_pendant', defaultDropRate: 0.01 },
  { bossId: 'chosen_seren', difficulty: 'hard', itemId: 'daybreak_pendant', defaultDropRate: 0.025 },
  { bossId: 'chosen_seren', difficulty: 'extreme', itemId: 'daybreak_pendant', defaultDropRate: 0.025 },

  // 연마석 (노말 2%, 하드/카오스 3%, 익스트림 4%)
  { bossId: 'kalos', difficulty: 'normal', itemId: 'grindstone_lv5', defaultDropRate: 0.02 },
  { bossId: 'kalos', difficulty: 'chaos', itemId: 'grindstone_lv5', defaultDropRate: 0.03 },
  { bossId: 'kalos', difficulty: 'extreme', itemId: 'grindstone_lv5', defaultDropRate: 0.04 },
  { bossId: 'kaling', difficulty: 'normal', itemId: 'grindstone_lv5', defaultDropRate: 0.02 },
  { bossId: 'kaling', difficulty: 'hard', itemId: 'grindstone_lv5', defaultDropRate: 0.03 },
  { bossId: 'kaling', difficulty: 'extreme', itemId: 'grindstone_lv5', defaultDropRate: 0.04 },
  { bossId: 'limbo', difficulty: 'normal', itemId: 'grindstone_lv6', defaultDropRate: 0.02 },
  { bossId: 'limbo', difficulty: 'hard', itemId: 'grindstone_lv6', defaultDropRate: 0.03 },
  { bossId: 'baldrix', difficulty: 'normal', itemId: 'grindstone_lv6', defaultDropRate: 0.02 },
  { bossId: 'baldrix', difficulty: 'hard', itemId: 'grindstone_lv6', defaultDropRate: 0.03 },

  // 광휘 아이템들 (0.2%)
  { bossId: 'limbo', difficulty: 'hard', itemId: 'whisper_of_the_source', defaultDropRate: 0.002 },
  { bossId: 'baldrix', difficulty: 'hard', itemId: 'oath_of_death', defaultDropRate: 0.002 },

  // 익셉셔널 해머 (드롭률 미적용, 추정치 모름)
  { bossId: 'chosen_seren', difficulty: 'extreme', itemId: 'exceptional_hammer_face', defaultDropRate: 0 },
  { bossId: 'black_mage', difficulty: 'extreme', itemId: 'exceptional_hammer_belt', defaultDropRate: 0 },
  { bossId: 'kalos', difficulty: 'extreme', itemId: 'exceptional_hammer_eye', defaultDropRate: 0 },
  { bossId: 'kaling', difficulty: 'extreme', itemId: 'exceptional_hammer_earring', defaultDropRate: 0 },

  // 기타 물욕템
  { bossId: 'damien', difficulty: 'hard', itemId: 'ruin_force_shield', defaultDropRate: 0 }
]

export const CHASE_ITEMS: ChaseItem[] = [
  // 반지 상자 (ring_box)
  {
    id: 'ring_box_lv1',
    name: '녹옥의 보스 반지 상자',
    category: 'ring_box',
    defaultPrice: 0, // 반지 가격으로 계산
    isDropAffected: 'normal'
  },
  {
    id: 'ring_box_lv2',
    name: '홍옥의 보스 반지 상자',
    category: 'ring_box',
    defaultPrice: 0, // 반지 가격으로 계산
    isDropAffected: 'normal'
  },
  {
    id: 'ring_box_lv3',
    name: '흑옥의 보스 반지 상자',
    category: 'ring_box',
    defaultPrice: 0, // 반지 가격으로 계산
    isDropAffected: 'normal'
  },
  {
    id: 'ring_box_lv4',
    name: '백옥의 보스 반지 상자',
    category: 'ring_box',
    defaultPrice: 0, // 반지 가격으로 계산
    isDropAffected: 'normal'
  },
  {
    id: 'ring_box_lv5',
    name: '생명의 보스 반지 상자',
    category: 'ring_box',
    defaultPrice: 0, // 반지 가격으로 계산
    isDropAffected: 'normal'
  },

  // 칠흑의 보스 세트 (pitched_boss)
  {
    id: 'berserked',
    name: '루즈 컨트롤 머신 마크',
    category: 'pitched_boss',
    defaultPrice: 2_500_000_000, // 25억
    isDropAffected: 'normal'
  },
  {
    id: 'black_heart',
    name: '블랙 하트',
    category: 'pitched_boss',
    defaultPrice: 700_000_000, // 7억
    isDropAffected: 'normal'
  },
  {
    id: 'complete_under_control',
    name: '컴플리트 언더컨트롤',
    category: 'pitched_boss',
    defaultPrice: 26_000_000_000, // 260억
    isDropAffected: 'normal'
  },
  {
    id: 'magic_eyepatch',
    name: '마력이 깃든 안대',
    category: 'pitched_boss',
    defaultPrice: 3_000_000_000, // 30억
    isDropAffected: 'normal'
  },
  {
    id: 'dreamy_belt',
    name: '몽환의 벨트',
    category: 'pitched_boss',
    defaultPrice: 2_500_000_000, // 25억
    isDropAffected: 'normal'
  },
  {
    id: 'cursed_spellbook',
    name: '저주받은 마도서',
    category: 'pitched_boss',
    defaultPrice: 4_000_000_000, // 40억
    isDropAffected: 'normal'
  },
  {
    id: 'endless_terror',
    name: '거대한 공포',
    category: 'pitched_boss',
    defaultPrice: 3_000_000_000, // 30억
    isDropAffected: 'normal'
  },
  {
    id: 'source_of_suffering',
    name: '고통의 근원',
    category: 'pitched_boss',
    defaultPrice: 4_000_000_000, // 40억
    isDropAffected: 'normal'
  },
  {
    id: 'commanding_force_earring',
    name: '커맨더 포스 이어링',
    category: 'pitched_boss',
    defaultPrice: 1_500_000_000, // 15억
    isDropAffected: 'normal'
  },
  {
    id: 'genesis_badge',
    name: '창세의 뱃지',
    category: 'pitched_boss',
    defaultPrice: 21_000_000_000, // 210억
    isDropAffected: 'normal'
  },
  {
    id: 'mitras_rage',
    name: '미트라의 분노',
    category: 'pitched_boss',
    defaultPrice: 6_000_000_000, // 60억
    isDropAffected: 'normal'
  },

  // 여명의 보스 세트 (dawn_boss)
  {
    id: 'guardian_angel_ring',
    name: '가디언 엔젤 링',
    category: 'dawn_boss',
    defaultPrice: 500_000_000, // 5억
    isDropAffected: 'normal'
  },
  {
    id: 'twilight_mark',
    name: '트와일라이트 마크',
    category: 'dawn_boss',
    defaultPrice: 500_000_000, // 5억
    isDropAffected: 'normal'
  },
  {
    id: 'estella_earrings',
    name: '에스텔라 이어링',
    category: 'dawn_boss',
    defaultPrice: 100_000_000, // 1억
    isDropAffected: 'normal'
  },
  {
    id: 'daybreak_pendant',
    name: '데이브레이크 펜던트',
    category: 'dawn_boss',
    defaultPrice: 1_000_000_000, // 10억
    isDropAffected: 'normal'
  },

  // 연마석 (grindstone)
  {
    id: 'grindstone_lv5',
    name: '생명의 연마석',
    category: 'grindstone',
    defaultPrice: 2_400_000_000, // 24억
    isDropAffected: 'normal'
  },
  {
    id: 'grindstone_lv6',
    name: '신념의 연마석',
    category: 'grindstone',
    defaultPrice: 10_500_000_000, // 105억
    isDropAffected: 'normal'
  },

  // 광휘의 보스 세트 (radiant_boss)
  {
    id: 'whisper_of_the_source',
    name: '근원의 속삭임',
    category: 'radiant_boss',
    defaultPrice: 200_000_000_000, // 2000억
    isDropAffected: 'normal'
  },
  {
    id: 'oath_of_death',
    name: '죽음의 맹세',
    category: 'radiant_boss',
    defaultPrice: 300_000_000_000, // 3000억
    isDropAffected: 'normal'
  },

  // 익셉셔널 해머 (exceptional) - 드롭률 미적용
  {
    id: 'exceptional_hammer_belt',
    name: '익셉셔널 해머 - 벨트',
    category: 'exceptional',
    defaultPrice: 12_000_000_000, // 120억
    isDropAffected: 'none'
  },
  {
    id: 'exceptional_hammer_face',
    name: '익셉셔널 해머 - 얼굴장식',
    category: 'exceptional',
    defaultPrice: 30_000_000_000, // 300억
    isDropAffected: 'none'
  },
  {
    id: 'exceptional_hammer_eye',
    name: '익셉셔널 해머 - 눈장식',
    category: 'exceptional',
    defaultPrice: 42_000_000_000, // 420억
    isDropAffected: 'none'
  },
  {
    id: 'exceptional_hammer_earring',
    name: '익셉셔널 해머 - 귀고리',
    category: 'exceptional',
    defaultPrice: 0, // 0원
    isDropAffected: 'none'
  },

  // 기타 물욕템 (misc_chase)
  {
    id: 'ruin_force_shield',
    name: '루인 포스실드',
    category: 'misc_chase',
    defaultPrice: 0, // 0원
    isDropAffected: 'normal'
  }
]

// 반지 상자별 고정 확률
export interface RingBoxProbabilities {
  restraint_lv3: number
  restraint_lv4: number
  continuous_lv3: number
  continuous_lv4: number
  grindstone: number // 생명 반지상자만
}

export const RING_BOX_PROBABILITIES: { [key: string]: RingBoxProbabilities } = {
  ring_box_lv1: { // 녹옥
    restraint_lv3: 0.0211268 * 0.09,
    restraint_lv4: 0,
    continuous_lv3: 0.0211268 * 0.09,
    continuous_lv4: 0,
    grindstone: 0
  },
  ring_box_lv2: { // 홍옥
    restraint_lv3: 0.0692308 * 0.20,
    restraint_lv4: 0.0692308 * 0.10,
    continuous_lv3: 0.0692308 * 0.20,
    continuous_lv4: 0.0692308 * 0.10,
    grindstone: 0
  },
  ring_box_lv3: { // 흑옥
    restraint_lv3: 0.125 * 0.30,
    restraint_lv4: 0.125 * 0.20,
    continuous_lv3: 0.125 * 0.30,
    continuous_lv4: 0.125 * 0.20,
    grindstone: 0
  },
  ring_box_lv4: { // 백옥
    restraint_lv3: 0.1428571 * 0.65,
    restraint_lv4: 0.1428571 * 0.35,
    continuous_lv3: 0.1428571 * 0.65,
    continuous_lv4: 0.1428571 * 0.35,
    grindstone: 0
  },
  ring_box_lv5: { // 생명
    restraint_lv3: 0.1451613 * 0.30,
    restraint_lv4: 0.1451613 * 0.70,
    continuous_lv3: 0.1451613 * 0.30,
    continuous_lv4: 0.1451613 * 0.70,
    grindstone: 0.1451613
  }
}

// 아이템 찾기 헬퍼 함수들
export const getChaseItemById = (id: string): ChaseItem | undefined => {
  return CHASE_ITEMS.find(item => item.id === id)
}

export const getChaseItemsByCategory = (category: ChaseItem['category']): ChaseItem[] => {
  return CHASE_ITEMS.filter(item => item.category === category)
}

export const getRingBoxProbabilities = (ringBoxId: string): RingBoxProbabilities => {
  return RING_BOX_PROBABILITIES[ringBoxId] || RING_BOX_PROBABILITIES.ring_box_lv1
}