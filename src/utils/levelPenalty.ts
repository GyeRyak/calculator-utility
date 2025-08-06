export function calculateLevelPenalty(characterLevel: number, monsterLevel: number): number {
  const levelDiff = characterLevel - monsterLevel;
  
  if (levelDiff >= 30) {
    return 0;
  }
  
  if (levelDiff >= 11) {
    const penalties: Record<number, number> = {
      29: 0.03,
      28: 0.16,
      27: 0.24,
      26: 0.35,
      25: 0.45,
      24: 0.54,
      23: 0.62,
      22: 0.69,
      21: 0.75,
      20: 0.80,
      19: 0.82,
      18: 0.84,
      17: 0.86,
      16: 0.88,
      15: 0.90,
      14: 0.92,
      13: 0.94,
      12: 0.96,
      11: 0.98
    };
    return penalties[levelDiff] ?? 0;
  }
  
  if (levelDiff >= -10) {
    return 1.00;
  }
  
  if (levelDiff >= -34) {
    const penalties: Record<number, number> = {
      [-11]: 0.97,
      [-12]: 0.94,
      [-13]: 0.91,
      [-14]: 0.88,
      [-15]: 0.85,
      [-16]: 0.82,
      [-17]: 0.79,
      [-18]: 0.76,
      [-19]: 0.73,
      [-20]: 0.70,
      [-21]: 0.65,
      [-22]: 0.60,
      [-23]: 0.55,
      [-24]: 0.50,
      [-25]: 0.45,
      [-26]: 0.40,
      [-27]: 0.35,
      [-28]: 0.30,
      [-29]: 0.25,
      [-30]: 0.20,
      [-31]: 0.15,
      [-32]: 0.10,
      [-33]: 0.05,
      [-34]: 0,
    };
    return penalties[levelDiff] ?? 0;
  }
  
  return 0;
}