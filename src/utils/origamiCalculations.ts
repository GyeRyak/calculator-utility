// 록 스타 돌의 정령! 알파벳 색종이 이벤트 계산 유틸리티

// 목표 알파벳 개수 (SAVE STONE SPIRIT SAVIOR ROCK SPIRIT)
export const TARGET_ALPHABETS = {
  C: 2, E: 2, K: 2, V: 3,  // 상급 (9개)
  A: 3, O: 5, P: 4, S: 8, T: 5,  // 중급 (25개)
  I: 10, N: 1, R: 8  // 하급 목표 (19개)
} as const;

export type AlphabetType = keyof typeof TARGET_ALPHABETS;

// 전체 알파벳 타입 (목표 + 기타)
export type AllAlphabetType = AlphabetType | 'OTHER_LOW';

// 알파벳 분류
const ALPHABET_TIERS = {
  HIGH: ['C', 'E', 'K', 'V'] as const,
  MID: ['A', 'O', 'P', 'S', 'T'] as const,
  LOW: ['I', 'N', 'R'] as const,
  OTHER: ['B', 'D', 'F', 'G', 'H', 'J', 'L', 'M', 'Q', 'U', 'W', 'X', 'Y', 'Z'] as const,
} as const;

// 확률 상수
export const PROBABILITIES = {
  NORMAL_PAPER: { MID: 0.025, LOW: 0.975 },
  COLORFUL_PAPER: 0.25, // 각 상급 알파벳 25%
  COMBINATION: { HIGH: 0.0035, MID: 0.0249, LOW: 0.9716 }
} as const;

// 가루 시스템 상수
export const DUST_SYSTEM = {
  // 조합 시 가루 획득량 (알파벳 등급별)
  DUST_FROM_COMBINATION: {
    HIGH: { type: 'premium' as const, amount: 100 },
    MID: { type: 'normal' as const, amount: 150 },
    LOW: { type: 'normal' as const, amount: 5 }
  },
  // 제작 비용 (알파벳 등급별)
  CRAFT_COST: {
    HIGH: { type: 'premium' as const, amount: 2000 },
    MID: { type: 'normal' as const, amount: 3000 },
    LOW: { type: 'normal' as const, amount: 500 }
  }
} as const;

// 가루 타입
export interface DustAmounts {
  normal: number;
  premium: number;
}

// 알파벳 등급 판별 유틸리티
export function getAlphabetTier(alphabet: AlphabetType): 'HIGH' | 'MID' | 'LOW' {
  if (ALPHABET_TIERS.HIGH.includes(alphabet as any)) return 'HIGH';
  if (ALPHABET_TIERS.MID.includes(alphabet as any)) return 'MID';
  if (ALPHABET_TIERS.LOW.includes(alphabet as any)) return 'LOW';
  throw new Error(`Unknown alphabet: ${alphabet}`);
}

// 대량 샘플링 유틸리티 함수 (성능 최적화된 버전)
function generateRandomChoices(probabilities: number[], count: number): number[] {
  const results = new Array(count); // 사전 할당
  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    let cumulative = 0;
    for (let j = 0; j < probabilities.length; j++) {
      cumulative += probabilities[j];
      if (rand < cumulative) {
        results[i] = j;
        break;
      }
    }
  }
  return results;
}

function generateUniformChoices(optionCount: number, count: number): number[] {
  const results = new Array(count); // 사전 할당
  for (let i = 0; i < count; i++) {
    results[i] = Math.floor(Math.random() * optionCount);
  }
  return results;
}

// 목표 달성 여부 확인
export function checkGoalAchievement(alphabetCounts: Record<AlphabetType, number>): {
  achieved: boolean;
  completionRate: number;
  shortage: Record<AlphabetType, number>;
} {
  const shortage: Record<AlphabetType, number> = {} as any;
  let totalShortage = 0;
  let totalTarget = 0;

  for (const [alphabet, target] of Object.entries(TARGET_ALPHABETS)) {
    const current = alphabetCounts[alphabet as AlphabetType] || 0;
    const short = Math.max(0, target - current);
    shortage[alphabet as AlphabetType] = short;
    totalShortage += short;
    totalTarget += target;
  }

  const completionRate = ((totalTarget - totalShortage) / totalTarget) * 100;
  const achieved = totalShortage === 0;

  return { achieved, completionRate, shortage };
}

// 몬테카를로 시뮬레이션 단일 실행
export function simulateOnce(input: CalculationInput): {
  alphabets: Record<AlphabetType, number>;
  dust: DustAmounts;
  achieved: boolean;
} {
  const { normalPapers, colorfulPapers, currentAlphabets = {}, currentDust = { normal: 0, premium: 0 }, otherLowAlphabets = 0, useCombinations = true, useCrafting = true } = input;

  // 현재 보유 알파벳으로 시작
  const alphabets: Record<AlphabetType, number> = {
    C: 0, E: 0, K: 0, V: 0,
    A: 0, O: 0, P: 0, S: 0, T: 0,
    I: 0, N: 0, R: 0,
    ...currentAlphabets
  };

  // 기타 하급 알파벳 추적 (조합용)
  let currentOtherLow = otherLowAlphabets;

  // 현재 보유 가루로 시작
  const dust: DustAmounts = { ...currentDust };

  // 알록달록 색종이 시뮬레이션 (대량 처리 최적화)
  if (colorfulPapers > 0) {
    const colorfulChoices = generateUniformChoices(ALPHABET_TIERS.HIGH.length, colorfulPapers);
    const highCount = new Array(ALPHABET_TIERS.HIGH.length).fill(0);

    // 각 알파벳별 개수 계산
    for (let i = 0; i < colorfulPapers; i++) {
      highCount[colorfulChoices[i]]++;
    }

    // 결과 적용
    for (let i = 0; i < ALPHABET_TIERS.HIGH.length; i++) {
      if (highCount[i] > 0) {
        const selectedAlphabet = ALPHABET_TIERS.HIGH[i] as AlphabetType;
        alphabets[selectedAlphabet] += highCount[i];
      }
    }
  }

  // 일반 색종이 시뮬레이션 (대량 처리)
  if (normalPapers > 0) {
    // 전체 결과 확률: 중급 2.5%, 하급목표 3/17 * 97.5%, 하급기타 14/17 * 97.5%
    const midProb = PROBABILITIES.NORMAL_PAPER.MID;
    const lowTargetProb = PROBABILITIES.NORMAL_PAPER.LOW * (3/17);
    const lowOtherProb = PROBABILITIES.NORMAL_PAPER.LOW * (14/17);

    const normalChoices = generateRandomChoices([midProb, lowTargetProb, lowOtherProb], normalPapers);

    // 각 결과 유형별 개수 계산
    let midTotalCount = 0;
    let lowTotalCount = 0;
    let otherLowTotalCount = 0;

    for (let i = 0; i < normalPapers; i++) {
      if (normalChoices[i] === 0) midTotalCount++;
      else if (normalChoices[i] === 1) lowTotalCount++;
      else if (normalChoices[i] === 2) otherLowTotalCount++;
    }

    // 중급 알파벳 처리
    if (midTotalCount > 0) {
      const midChoices = generateUniformChoices(ALPHABET_TIERS.MID.length, midTotalCount);
      const midCount = new Array(ALPHABET_TIERS.MID.length).fill(0);

      for (let i = 0; i < midTotalCount; i++) {
        midCount[midChoices[i]]++;
      }

      for (let i = 0; i < ALPHABET_TIERS.MID.length; i++) {
        if (midCount[i] > 0) {
          const selectedAlphabet = ALPHABET_TIERS.MID[i] as AlphabetType;
          alphabets[selectedAlphabet] += midCount[i];
        }
      }
    }

    // 하급 목표 알파벳 처리
    if (lowTotalCount > 0) {
      const lowChoices = generateUniformChoices(ALPHABET_TIERS.LOW.length, lowTotalCount);
      const lowCount = new Array(ALPHABET_TIERS.LOW.length).fill(0);

      for (let i = 0; i < lowTotalCount; i++) {
        lowCount[lowChoices[i]]++;
      }

      for (let i = 0; i < ALPHABET_TIERS.LOW.length; i++) {
        if (lowCount[i] > 0) {
          const selectedAlphabet = ALPHABET_TIERS.LOW[i] as AlphabetType;
          alphabets[selectedAlphabet] += lowCount[i];
        }
      }
    }

    // 기타 하급 알파벳 처리
    currentOtherLow += otherLowTotalCount;
  }

  // 효율적인 조합 시스템
  if (useCombinations) {
    let combinationRounds = 0;
    const maxRounds = 100; // 무한루프 방지

    while (combinationRounds < maxRounds) {
      // 1. 부족분 분서
      const shortageList: { alphabet: AlphabetType; amount: number; tier: 'HIGH' | 'MID' | 'LOW' }[] = [];
      for (const alphabet of Object.keys(alphabets) as AlphabetType[]) {
        const target = TARGET_ALPHABETS[alphabet];
        const shortage = Math.max(0, target - alphabets[alphabet]);
        if (shortage > 0) {
          shortageList.push({
            alphabet,
            amount: shortage,
            tier: getAlphabetTier(alphabet)
          });
        }
      }

      // 부족분이 없으면 완료
      if (shortageList.length === 0) break;

      // 2. 잉여 알파벳 수집 및 조합 처리
      let highSurplus = 0;
      let midSurplus = 0;
      let lowSurplus = 0;
      let totalCombinations = 0;

      // 각 등급별 잉여 수집
      for (const alphabet of ALPHABET_TIERS.HIGH) {
        const target = TARGET_ALPHABETS[alphabet as AlphabetType];
        const extra = Math.max(0, alphabets[alphabet as AlphabetType] - target);
        if (extra > 0) {
          highSurplus += extra;
          alphabets[alphabet as AlphabetType] = target; // 목표량만 유지
        }
      }

      for (const alphabet of ALPHABET_TIERS.MID) {
        const target = TARGET_ALPHABETS[alphabet as AlphabetType];
        const extra = Math.max(0, alphabets[alphabet as AlphabetType] - target);
        if (extra > 0) {
          midSurplus += extra;
          alphabets[alphabet as AlphabetType] = target; // 목표량만 유지
        }
      }

      for (const alphabet of ALPHABET_TIERS.LOW) {
        const target = TARGET_ALPHABETS[alphabet as AlphabetType];
        const extra = Math.max(0, alphabets[alphabet as AlphabetType] - target);
        if (extra > 0) {
          lowSurplus += extra;
          alphabets[alphabet as AlphabetType] = target; // 목표량만 유지
        }
      }

      // 기타 하급도 하급 풀에 합치기
      lowSurplus += currentOtherLow;
      currentOtherLow = 0;

      // 등급별 조합 처리 (상->중->하급 순으로)
      let totalSurplus = highSurplus + midSurplus + lowSurplus;

      // 조합이 불가능하면 중단
      if (totalSurplus < 5) break;

      // 등급별 순차 처리 (상->중->하)

      // 상급 자체 조합
      const highCombinations = Math.floor(highSurplus / 5);
      totalCombinations += highCombinations;
      dust.premium += highCombinations * 5 * DUST_SYSTEM.DUST_FROM_COMBINATION.HIGH.amount;
      highSurplus = highSurplus % 5;

      // 중급으로 넘어가기 (상급 나머지 + 중급)
      midSurplus += highSurplus;
      const midCombinations = Math.floor(midSurplus / 5);
      totalCombinations += midCombinations;
      dust.normal += midCombinations * 5 * DUST_SYSTEM.DUST_FROM_COMBINATION.MID.amount;
      midSurplus = midSurplus % 5;

      // 하급으로 넘어가기 (중급 나머지 + 하급)
      lowSurplus += midSurplus;
      const lowCombinations = Math.floor(lowSurplus / 5);
      totalCombinations += lowCombinations;
      dust.normal += lowCombinations * 5 * DUST_SYSTEM.DUST_FROM_COMBINATION.LOW.amount;
      lowSurplus = lowSurplus % 5;

      // 3. 조합이 불가능하면 중단
      if (totalCombinations === 0) break;

      // 4. 가루로 제작 시도 (상급 -> 중급 -> 하급 순)
      // 상급 제작
      for (const shortage of shortageList.filter(s => s.tier === 'HIGH')) {
        const craftCost = DUST_SYSTEM.CRAFT_COST.HIGH;
        const canCraft = Math.min(shortage.amount, Math.floor(dust[craftCost.type] / craftCost.amount));
        if (canCraft > 0) {
          alphabets[shortage.alphabet] += canCraft;
          dust[craftCost.type] -= canCraft * craftCost.amount;
        }
      }

      // 중급 제작
      for (const shortage of shortageList.filter(s => s.tier === 'MID')) {
        const craftCost = DUST_SYSTEM.CRAFT_COST.MID;
        const canCraft = Math.min(shortage.amount, Math.floor(dust[craftCost.type] / craftCost.amount));
        if (canCraft > 0) {
          alphabets[shortage.alphabet] += canCraft;
          dust[craftCost.type] -= canCraft * craftCost.amount;
        }
      }

      // 하급 제작
      for (const shortage of shortageList.filter(s => s.tier === 'LOW')) {
        const craftCost = DUST_SYSTEM.CRAFT_COST.LOW;
        const canCraft = Math.min(shortage.amount, Math.floor(dust[craftCost.type] / craftCost.amount));
        if (canCraft > 0) {
          alphabets[shortage.alphabet] += canCraft;
          dust[craftCost.type] -= canCraft * craftCost.amount;
        }
      }

      // 5. 조합 뽑기 실행
      for (let i = 0; i < totalCombinations; i++) {
        const rand = Math.random();
        let selectedAlphabet: AlphabetType;

        if (rand < PROBABILITIES.COMBINATION.HIGH) {
          const index = Math.floor(Math.random() * ALPHABET_TIERS.HIGH.length);
          selectedAlphabet = ALPHABET_TIERS.HIGH[index] as AlphabetType;
        } else if (rand < PROBABILITIES.COMBINATION.HIGH + PROBABILITIES.COMBINATION.MID) {
          const index = Math.floor(Math.random() * ALPHABET_TIERS.MID.length);
          selectedAlphabet = ALPHABET_TIERS.MID[index] as AlphabetType;
        } else {
          const index = Math.floor(Math.random() * ALPHABET_TIERS.LOW.length);
          selectedAlphabet = ALPHABET_TIERS.LOW[index] as AlphabetType;
        }

        // 결과 추가
        alphabets[selectedAlphabet]++;
      }

      combinationRounds++;
    }
  }

  // 제작 시스템은 조합 시스템 내에 통합됨

  const { achieved } = checkGoalAchievement(alphabets);
  return { alphabets, dust, achieved };
}

// 계산 입력 인터페이스
export interface CalculationInput {
  normalPapers: number;
  colorfulPapers: number;
  currentAlphabets?: Partial<Record<AlphabetType, number>>;
  currentDust?: DustAmounts;
  otherLowAlphabets?: number;
  useCombinations?: boolean;
  useCrafting?: boolean;
  iterations?: number;
}

// 계산 결과 인터페이스
export interface CalculationResult {
  achievementProbability: number;
  shortage: Record<AlphabetType, number>;
  recommendedStrategy: {
    colorfulPapers: number;
    cost: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  simulationResults: {
    iterations: number;
    successRate: number;
  };
}

// 메인 계산 함수 (성능 최적화)
export function calculateAchievementProbability(input: CalculationInput): CalculationResult {
  const { iterations = 3000 } = input;

  // 시뮬레이션 실행 (결과 만 추적)
  let successCount = 0;

  for (let i = 0; i < iterations; i++) {
    const result = simulateOnce(input);
    if (result.achieved) successCount++;
  }

  const achievementProbability = (successCount / iterations) * 100;

  // 마지막 시뮬레이션 결과로 부족분 계산
  const lastResult = simulateOnce(input);
  const goalAnalysis = checkGoalAchievement(lastResult.alphabets);

  // 추천 전략 계산
  const requiredHigh = 9; // 상급 총 필요량
  const recommendedColorfulPapers = Math.ceil(requiredHigh / PROBABILITIES.COLORFUL_PAPER);

  const recommendedStrategy = {
    colorfulPapers: recommendedColorfulPapers,
    cost: recommendedColorfulPapers * 1.5, // 기본 1.5억 가정
    confidence: achievementProbability > 90 ? 'HIGH' as const :
                achievementProbability > 70 ? 'MEDIUM' as const : 'LOW' as const
  };

  return {
    achievementProbability,
    shortage: goalAnalysis.shortage,
    recommendedStrategy,
    simulationResults: {
      iterations,
      successRate: achievementProbability
    }
  };
}

// 백분위 분석 함수
export function calculatePercentileRequirements(
  normalPapers: number,
  targetPercentiles: number[] = [50, 80, 90, 95, 99],
  iterations: number = 1500
): Record<number, number> {
  const requirements: Record<number, number> = {};

  for (const percentile of targetPercentiles) {
    let low = 5;
    let high = 50;

    // 이진 탐색
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      const result = calculateAchievementProbability({
        normalPapers,
        colorfulPapers: mid,
        iterations: 1000
      });

      if (result.achievementProbability >= percentile) {
        high = mid;
      } else {
        low = mid + 1;
      }
    }

    requirements[percentile] = low;
  }

  return requirements;
}