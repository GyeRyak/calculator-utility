// 보스 데이터 정의
export interface Boss {
  id: string
  name: string
  type: 'weekly' | 'monthly'
  difficulties: BossDifficulty[]
}

export interface BossDifficulty {
  id: string
  name: string
  requiredLevel?: number
  dropTable: string[] // 아이템 ID 배열
}

export const BOSSES: Boss[] = [
  // 주간 보스
  {
    id: 'lotus',
    name: '스우',
    type: 'weekly',
    difficulties: [
      {
        id: 'hard',
        name: '하드',
        requiredLevel: 235,
        dropTable: ['berserked', 'ring_box_lv2']
      },
      {
        id: 'extreme',
        name: '익스트림',
        requiredLevel: 265,
        dropTable: ['berserked', 'complete_under_control', 'ring_box_lv4']
      }
    ]
  },
  {
    id: 'damien',
    name: '데미안',
    type: 'weekly',
    difficulties: [
      {
        id: 'hard',
        name: '하드',
        requiredLevel: 210,
        dropTable: ['magic_eyepatch', 'ruin_force_shield', 'ring_box_lv2']
      }
    ]
  },
  {
    id: 'guardian_angel_slime',
    name: '가디언 엔젤 슬라임',
    type: 'weekly',
    difficulties: [
      {
        id: 'normal',
        name: '노말',
        requiredLevel: 235,
        dropTable: ['guardian_angel_ring', 'ring_box_lv1']
      },
      {
        id: 'chaos',
        name: '카오스',
        requiredLevel: 265,
        dropTable: ['guardian_angel_ring', 'ring_box_lv3']
      }
    ]
  },
  {
    id: 'lucid',
    name: '루시드',
    type: 'weekly',
    difficulties: [
      {
        id: 'normal',
        name: '노말',
        dropTable: ['twilight_mark', 'ring_box_lv1']
      },
      {
        id: 'hard',
        name: '하드',
        dropTable: ['dreamy_belt', 'twilight_mark', 'ring_box_lv2']
      }
    ]
  },
  {
    id: 'will',
    name: '윌',
    type: 'weekly',
    difficulties: [
      {
        id: 'normal',
        name: '노말',
        dropTable: ['twilight_mark', 'ring_box_lv1']
      },
      {
        id: 'hard',
        name: '하드',
        dropTable: ['cursed_spellbook', 'twilight_mark', 'ring_box_lv2']
      }
    ]
  },
  {
    id: 'gloom',
    name: '더스크',
    type: 'weekly',
    difficulties: [
      {
        id: 'normal',
        name: '노말',
        dropTable: ['estella_earrings', 'ring_box_lv1']
      },
      {
        id: 'chaos',
        name: '카오스',
        dropTable: ['endless_terror', 'estella_earrings', 'ring_box_lv3']
      }
    ]
  },
  {
    id: 'verus_hilla',
    name: '진 힐라',
    type: 'weekly',
    difficulties: [
      {
        id: 'normal',
        name: '노말',
        dropTable: ['daybreak_pendant', 'ring_box_lv2']
      },
      {
        id: 'hard',
        name: '하드',
        dropTable: ['source_of_suffering', 'daybreak_pendant', 'ring_box_lv3']
      }
    ]
  },
  {
    id: 'darknell',
    name: '듄켈',
    type: 'weekly',
    difficulties: [
      {
        id: 'normal',
        name: '노말',
        dropTable: ['estella_earrings', 'ring_box_lv1']
      },
      {
        id: 'hard',
        name: '하드',
        dropTable: ['commanding_force_earring', 'estella_earrings', 'ring_box_lv3']
      }
    ]
  },
  {
    id: 'chosen_seren',
    name: '선택받은 세렌',
    type: 'weekly',
    difficulties: [
      {
        id: 'normal',
        name: '노말',
        dropTable: ['daybreak_pendant', 'ring_box_lv3']
      },
      {
        id: 'hard',
        name: '하드',
        dropTable: ['mitras_rage', 'daybreak_pendant', 'ring_box_lv4']
      },
      {
        id: 'extreme',
        name: '익스트림',
        dropTable: ['mitras_rage', 'exceptional_hammer_face', 'daybreak_pendant', 'ring_box_lv4']
      }
    ]
  },
  {
    id: 'kalos',
    name: '감시자 칼로스',
    type: 'weekly',
    difficulties: [
      {
        id: 'easy',
        name: '이지',
        dropTable: ['ring_box_lv4']
      },
      {
        id: 'normal',
        name: '노말',
        dropTable: ['grindstone_lv5', 'ring_box_lv4']
      },
      {
        id: 'chaos',
        name: '카오스',
        dropTable: ['grindstone_lv5', 'ring_box_lv5']
      },
      {
        id: 'extreme',
        name: '익스트림',
        dropTable: ['exceptional_hammer_eye', 'grindstone_lv5', 'ring_box_lv5']
      }
    ]
  },
  {
    id: 'first_adversary',
    name: '최초의 대적자',
    type: 'weekly',
    difficulties: [
      {
        id: 'easy',
        name: '이지',
        dropTable: ['ring_box_lv4']
      },
      {
        id: 'normal',
        name: '노말',
        dropTable: ['ring_box_lv4', 'grindstone_lv5']
      },
      {
        id: 'hard',
        name: '하드',
        dropTable: ['radiant_medal', 'ring_box_lv5', 'grindstone_lv5']
      },
      {
        id: 'extreme',
        name: '익스트림',
        dropTable: ['exceptional_hammer_medal', 'radiant_medal', 'ring_box_lv5', 'grindstone_lv5']
      }
    ]
  },
  {
    id: 'kaling',
    name: '카링',
    type: 'weekly',
    difficulties: [
      {
        id: 'easy',
        name: '이지',
        dropTable: ['ring_box_lv4']
      },
      {
        id: 'normal',
        name: '노말',
        dropTable: ['grindstone_lv5', 'ring_box_lv4']
      },
      {
        id: 'hard',
        name: '하드',
        dropTable: ['grindstone_lv5', 'ring_box_lv5', 'pitched_boss_box']
      },
      {
        id: 'extreme',
        name: '익스트림',
        dropTable: ['exceptional_hammer_earring', 'grindstone_lv5', 'ring_box_lv5', 'pitched_boss_box']
      }
    ]
  },
  {
    id: 'limbo',
    name: '림보',
    type: 'weekly',
    difficulties: [
      {
        id: 'normal',
        name: '노말',
        dropTable: ['grindstone_lv6', 'ring_box_lv5', 'pitched_boss_box']
      },
      {
        id: 'hard',
        name: '하드',
        dropTable: ['whisper_of_the_source', 'grindstone_lv6', 'ring_box_lv5', 'pitched_boss_box']
      }
    ]
  },
  {
    id: 'baldrix',
    name: '발드릭스',
    type: 'weekly',
    difficulties: [
      {
        id: 'normal',
        name: '노말',
        dropTable: ['grindstone_lv6', 'ring_box_lv5', 'pitched_boss_box']
      },
      {
        id: 'hard',
        name: '하드',
        dropTable: ['oath_of_death', 'grindstone_lv6', 'ring_box_lv5', 'pitched_boss_box']
      }
    ]
  },
  
  
  // 월간 보스
  {
    id: 'black_mage',
    name: '검은 마법사',
    type: 'monthly',
    difficulties: [
      {
        id: 'hard',
        name: '하드',
        dropTable: ['genesis_badge', 'ring_box_lv4']
      },
      {
        id: 'extreme',
        name: '익스트림',
        dropTable: ['genesis_badge', 'exceptional_hammer_belt', 'ring_box_lv4']
      }
    ]
  }
]

// 보스 찾기 헬퍼 함수들
export const getBossById = (id: string): Boss | undefined => {
  return BOSSES.find(boss => boss.id === id)
}

export const getBossDifficulty = (bossId: string, difficultyId: string): BossDifficulty | undefined => {
  const boss = getBossById(bossId)
  return boss?.difficulties.find(diff => diff.id === difficultyId)
}

export const getWeeklyBosses = (): Boss[] => {
  return BOSSES.filter(boss => boss.type === 'weekly')
}

export const getMonthlyBosses = (): Boss[] => {
  return BOSSES.filter(boss => boss.type === 'monthly')
}