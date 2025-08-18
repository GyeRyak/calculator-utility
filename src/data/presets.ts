// 캐릭터 프리셋 데이터
export interface CharacterPreset {
  id: string
  name: string
  description: string
  characters: PresetCharacter[]
}

export interface PresetCharacter {
  name: string
  bossList: PresetBossEntry[]
}

export interface PresetBossEntry {
  bossId: string
  difficulty: string
  partySize: number
}

export const CHARACTER_PRESETS: CharacterPreset[] = [
  {
    id: 'solo_under_dark_mage',
    name: '검밑솔',
    description: '하드 스우, 하드 데미안, 카오스 가디언 엔젤 슬라임, 하드 루시드, 하드 윌, 하드 더스크, 하드 진 힐라, 하드 듄켈',
    characters: [
      {
        name: '메인 캐릭터',
        bossList: [
          { bossId: 'lotus', difficulty: 'hard', partySize: 1 },
          { bossId: 'damien', difficulty: 'hard', partySize: 1 },
          { bossId: 'guardian_angel_slime', difficulty: 'chaos', partySize: 1 },
          { bossId: 'lucid', difficulty: 'hard', partySize: 1 },
          { bossId: 'will', difficulty: 'hard', partySize: 1 },
          { bossId: 'gloom', difficulty: 'chaos', partySize: 1 },
          { bossId: 'verus_hilla', difficulty: 'hard', partySize: 1 },
          { bossId: 'darknell', difficulty: 'hard', partySize: 1 }
        ]
      }
    ]
  },
  {
    id: 'hard_seren_easy_kalos',
    name: '하세이칼',
    description: '검밑솔 + 하드 검은 마법사(월간), 하드 선택받은 세렌, 이지 감시자 칼로스',
    characters: [
      {
        name: '메인 캐릭터',
        bossList: [
          // 검밑솔 보스들
          { bossId: 'lotus', difficulty: 'hard', partySize: 1 },
          { bossId: 'damien', difficulty: 'hard', partySize: 1 },
          { bossId: 'guardian_angel_slime', difficulty: 'chaos', partySize: 1 },
          { bossId: 'lucid', difficulty: 'hard', partySize: 1 },
          { bossId: 'will', difficulty: 'hard', partySize: 1 },
          { bossId: 'gloom', difficulty: 'chaos', partySize: 1 },
          { bossId: 'verus_hilla', difficulty: 'hard', partySize: 1 },
          { bossId: 'darknell', difficulty: 'hard', partySize: 1 },
          // 추가 보스들
          { bossId: 'black_mage', difficulty: 'hard', partySize: 1 },
          { bossId: 'chosen_seren', difficulty: 'hard', partySize: 1 },
          { bossId: 'first_adversary', difficulty: 'easy', partySize: 1 },
          { bossId: 'kalos', difficulty: 'easy', partySize: 1 }
        ]
      }
    ]
  },
  {
    id: 'extreme_party_noob',
    name: '익검6인',
    description: '검밑솔 + 익스트림 스우(2인), 익스트림 검은 마법사(6인), 노말 칼로스, 이지 카링, 하드 세렌',
    characters: [
      {
        name: '메인 캐릭터',
        bossList: [
          // 검밑솔 보스들
          { bossId: 'damien', difficulty: 'hard', partySize: 1 },
          { bossId: 'guardian_angel_slime', difficulty: 'chaos', partySize: 1 },
          { bossId: 'lucid', difficulty: 'hard', partySize: 1 },
          { bossId: 'will', difficulty: 'hard', partySize: 1 },
          { bossId: 'gloom', difficulty: 'chaos', partySize: 1 },
          { bossId: 'verus_hilla', difficulty: 'hard', partySize: 1 },
          { bossId: 'darknell', difficulty: 'hard', partySize: 1 },
          // 익검6인 전용 보스들
          { bossId: 'lotus', difficulty: 'extreme', partySize: 2 },
          { bossId: 'black_mage', difficulty: 'extreme', partySize: 6 },
          { bossId: 'first_adversary', difficulty: 'normal', partySize: 2 },
          { bossId: 'kalos', difficulty: 'normal', partySize: 1 },
          { bossId: 'kaling', difficulty: 'easy', partySize: 1 },
          { bossId: 'chosen_seren', difficulty: 'hard', partySize: 1 }
        ]
      }
    ]
  }
]

export const getPresetById = (id: string): CharacterPreset | undefined => {
  return CHARACTER_PRESETS.find(preset => preset.id === id)
}