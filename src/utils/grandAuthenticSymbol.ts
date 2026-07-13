export const GRAND_AUTHENTIC_SYMBOL_MAX_LEVEL = 11

export type GrandAuthenticSymbolKind = 'tallahart' | 'geardrak'

const CUMULATIVE_COSTS: Record<GrandAuthenticSymbolKind, readonly number[]> = {
  tallahart: [
    0,
    0,
    113_600_000,
    406_900_000,
    942_700_000,
    1_780_400_000,
    2_976_400_000,
    4_583_600_000,
    6_651_900_000,
    9_227_900_000,
    12_354_800_000,
    16_072_800_000,
  ],
  geardrak: [
    0,
    0,
    139_700_000,
    501_400_000,
    1_164_100_000,
    2_203_400_000,
    3_691_900_000,
    5_698_700_000,
    8_289_900_000,
    11_528_300_000,
    15_473_300_000,
    20_181_300_000,
  ],
}

export function calculateGrandAuthenticSymbolBonus(level: number): number {
  return level > 0 ? Math.min(level, GRAND_AUTHENTIC_SYMBOL_MAX_LEVEL) + 4 : 0
}

export function getGrandAuthenticSymbolCumulativeCost(
  kind: GrandAuthenticSymbolKind,
  level: number
): number {
  const normalizedLevel = Math.max(0, Math.min(Math.floor(level), GRAND_AUTHENTIC_SYMBOL_MAX_LEVEL))
  return CUMULATIVE_COSTS[kind][normalizedLevel]
}

export function getGrandAuthenticSymbolRemainingCost(
  kind: GrandAuthenticSymbolKind,
  currentLevel: number,
  targetLevel = GRAND_AUTHENTIC_SYMBOL_MAX_LEVEL
): number {
  return Math.max(
    0,
    getGrandAuthenticSymbolCumulativeCost(kind, targetLevel)
      - getGrandAuthenticSymbolCumulativeCost(kind, currentLevel)
  )
}

export function calculateGrandAuthenticSymbolBreakevenMaterials(
  upgradeCost: number,
  incomeIncreasePerMaterial: number
): number {
  if (upgradeCost <= 0) return 0
  if (incomeIncreasePerMaterial <= 0) return Infinity
  return upgradeCost / incomeIncreasePerMaterial
}
