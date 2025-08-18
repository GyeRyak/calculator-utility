// 보스 물욕템 계산기 기본값
import { GLOBAL_DEFAULTS } from './globalDefaults'
import { PitchedBoxProbabilities, PITCHED_BOX_DEFAULT_PROBABILITIES } from '@/data/chaseItems'

export interface RingPrices {
  restraint_lv3: number    // 리스트레인트 링 3레벨 가격
  restraint_lv4: number    // 리스트레인트 링 4레벨 가격
  continuous_lv3: number   // 컨티뉴어스 링 3레벨 가격
  continuous_lv4: number   // 컨티뉴어스 링 4레벨 가격
}

export interface CharacterConfig {
  id: string
  name: string
  bossList: BossEntry[]
  useGlobalDropRate?: boolean // 전역 드롭률 설정 사용 여부 (기본값: true)
  customDropRate?: number // 개별 드롭률 설정 (useGlobalDropRate가 false일 때 사용)
}

export interface BossEntry {
  bossId: string
  difficulty: string
  partySize: number
}

export interface BossChaseSettings {
  characters: CharacterConfig[]
  customDropRates: { [key: string]: number } // key: "bossId:difficulty:itemId" or "itemId" for global
  customPrices: { [itemId: string]: number }
  ringPrices: RingPrices
  grindstonePrice: number
  dropRateBonus: number // 아드 증가량 (%)
  feeRate: number // 경매장 수수료 (%)
  pitchedBoxProbabilities?: PitchedBoxProbabilities // 칠흑 상자 확률 사용자 설정
}

// 기본 반지 가격 (메소)
export const DEFAULT_RING_PRICES: RingPrices = {
  restraint_lv3: 300_000_000,       // 3억
  restraint_lv4: 4_500_000_000,     // 45억
  continuous_lv3: 50_000_000,       // 0.5억
  continuous_lv4: 2_000_000_000     // 20억
}

export const DEFAULT_GRINDSTONE_PRICE = 2_400_000_000  // 24억 (생명의 연마석)

export const DEFAULT_DROP_RATE_BONUS = 0  // 0% 아드 증가

export const DEFAULT_FEE_RATE = GLOBAL_DEFAULTS.feeRate  // 전역 기본값에서 수수료 가져오기 (3%)

export const DEFAULT_PITCHED_BOX_PROBABILITIES = PITCHED_BOX_DEFAULT_PROBABILITIES // 칠흑 상자 기본 확률 (균등)

// 기본 캐릭터 생성 함수
const createDefaultCharacters = (): CharacterConfig[] => {
  const { CHARACTER_PRESETS } = require('../../data/presets')
  
  const characters: CharacterConfig[] = []
  
  // 검밑솔 캐릭터 추가
  const geomMitSolPreset = CHARACTER_PRESETS.find((p: any) => p.id === 'solo_under_dark_mage')
  if (geomMitSolPreset) {
    characters.push({
      id: 'default_solo_under_dark_mage',
      name: '(예시) 검밑솔',
      bossList: geomMitSolPreset.characters[0].bossList.map((boss: any) => ({
        bossId: boss.bossId,
        difficulty: boss.difficulty,
        partySize: boss.partySize
      })),
      useGlobalDropRate: true
    })
  }
  
  // 하세이칼 캐릭터 추가
  const haSeiKalPreset = CHARACTER_PRESETS.find((p: any) => p.id === 'hard_seren_easy_kalos')
  if (haSeiKalPreset) {
    characters.push({
      id: 'default_hard_seren_easy_kalos',
      name: '(예시) 하세이칼',
      bossList: haSeiKalPreset.characters[0].bossList.map((boss: any) => ({
        bossId: boss.bossId,
        difficulty: boss.difficulty,
        partySize: boss.partySize
      })),
      useGlobalDropRate: true
    })
  }
  
  return characters
}

export const DEFAULT_BOSS_CHASE_VALUES: BossChaseSettings = {
  characters: createDefaultCharacters(),
  customDropRates: {},
  customPrices: {},
  ringPrices: DEFAULT_RING_PRICES,
  grindstonePrice: DEFAULT_GRINDSTONE_PRICE,
  dropRateBonus: DEFAULT_DROP_RATE_BONUS,
  feeRate: DEFAULT_FEE_RATE,
  pitchedBoxProbabilities: DEFAULT_PITCHED_BOX_PROBABILITIES
}