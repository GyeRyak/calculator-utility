// 한글날 칭호 이벤트 확률 계산 유틸리티

// 슬롯별 단어 수
export const SLOT_WORD_COUNTS = {
  X: 93,
  Y: 95,
  Z: 109
} as const;

// 재설정 비용 (잠금 슬롯 수에 따라)
export const RESET_COSTS = {
  0: 1,  // 전체 재설정 (0개 잠금)
  1: 2,  // 1개 잠금
  2: 4   // 2개 잠금
} as const;

// 슬롯 타입
export type SlotType = 'X' | 'Y' | 'Z';

// 상태 타입 (0: 안맞춤, 1: 맞춤)
export type SlotState = 0 | 1;
export type TitleState = [SlotState, SlotState, SlotState]; // [X, Y, Z]

// 단어 리스트
export const WORD_LISTS: Record<SlotType, string[]> = {
  X: [
    '(공백)',
    '가끔',
    '가디언 엔젤 슬라임의',
    '갑자기',
    '검은 마법사의',
    '굉장히',
    '귀엽고',
    '기쁘게',
    '꿈꾸는 자의',
    '나는',
    '나랏말싸미',
    '나를 따르는',
    '나의',
    '난',
    '낮에',
    '내가 바로',
    '내일도',
    '너의',
    '늘',
    '대적자의',
    '더스크의',
    '데미안의',
    '돌의 정령의',
    '동료의',
    '듄켈의',
    '또 하나의',
    '루시드의',
    '리본 돼지의',
    '림보의',
    '매그너스의',
    '메이플 월드의',
    '메이플스토리의',
    '메이플을 잘 아는',
    '모든 순간',
    '몬스터의',
    '미지의',
    '반 레온의',
    '반반의',
    '발드릭스의',
    '발록의',
    '밤에',
    '배고프고',
    '배부르고',
    '벨룸의',
    '블러디퀸의',
    '뿔버섯의',
    '사실 난',
    '새벽에',
    '세계수의',
    '세렌의',
    '세상에서 가장',
    '수줍고',
    '스우의',
    '스포아의',
    '슬라임의',
    '시그너스의',
    '아무것도 안 했는데',
    '아침에',
    '아카이럼의',
    '알고 보니',
    '언제나',
    '예티의',
    '오늘도',
    '왠지 모르게',
    '우리는',
    '우리의',
    '윌의',
    '은근히',
    '이름 모를',
    '이유 없이',
    '일찍',
    '자쿰의',
    '저녁에',
    '전설의',
    '정말',
    '정체 모를',
    '조금',
    '조금은',
    '주황버섯의',
    '지금 바로',
    '지나가던',
    '진 힐라의',
    '친구의',
    '카링의',
    '카웅의',
    '칼로스의',
    '파풀라투스의',
    '피에르의',
    '핑크빈의',
    '항상',
    '혼테일의',
    '힐라의',
    '힘세고'
  ],
  Y: [
    '각오가 된',
    '감성적인',
    '강력한',
    '거침없는',
    '건강한',
    '건설적인',
    '검은 사슬의',
    '고독한',
    '공부하는',
    '괴력의',
    '궁금한',
    '귀여운',
    '긍정적인',
    '기억 속의',
    '길을 잃은',
    '깜찍한',
    '끈끈한',
    '놀고 싶은',
    '놀라운',
    '눈부신',
    '다정한',
    '대단한',
    '독을 뿌리는',
    '되게',
    '따뜻한',
    '똑똑한',
    '뜨거운',
    '마법저항의',
    '매력 있는',
    '맹독의',
    '멈추지 않는',
    '멋진',
    '무시무시한',
    '바쁜',
    '밝은',
    '배고픈',
    '배부른',
    '봉인의',
    '빛나는',
    '사냥하는',
    '새 친구를 찾고 싶은',
    '석화의',
    '섬세한',
    '성실한',
    '성장하는',
    '소중한',
    '슬픈',
    '시비를 거는',
    '신난',
    '신비한',
    '암흑의',
    '야근하는',
    '어린',
    '언데드의',
    '역사적인',
    '오래된',
    '외로운',
    '운동하는',
    '웃음이 많은',
    '월드 베스트',
    '위대한',
    '유명한',
    '익스트림',
    '잊을 수 없는',
    '자유로운',
    '작은',
    '잠든',
    '재빠른',
    '재생하는',
    '전설의',
    '정의로운',
    '제일가는',
    '졸린',
    '주목받는',
    '지나가는',
    '집에 가고 싶은',
    '차가운',
    '찬란한',
    '참지 못하는',
    '최고의',
    '춤을 추는',
    '친절한',
    '퇴근한',
    '튼튼한',
    '평범한',
    '포션을 싫어하는',
    '프리미엄',
    '한가하게 차를 마시는',
    '해맑은',
    '행복한',
    '혼란의',
    '화려한',
    '회피하는',
    '희귀한'
  ],
  Z: [
    '캐릭터명',
    '강아지',
    '고양이',
    '공격',
    '광부',
    '궁수',
    '귀요미',
    '그림자',
    '기록',
    '기쁨',
    '기사단',
    '기억',
    '기운',
    '길라잡이',
    '꽃',
    '꿈',
    '나',
    '나그네',
    '나무',
    '노바',
    '단풍잎',
    '달',
    '대적자',
    '대학생',
    '데몬',
    '도시',
    '도적',
    '도전',
    '돌의 정령',
    '동료',
    '레벨 업',
    '레전드',
    '레지스탕스',
    '레프',
    '로그아웃',
    '로그인',
    '리본 돼지',
    '마법',
    '마법사',
    '마음',
    '메소레인저',
    '모험',
    '모험가',
    '몬스터',
    '변신술사',
    '별',
    '보물',
    '불꽃',
    '불릿',
    '비밀',
    '빛',
    '뿔버섯',
    '사냥꾼',
    '사람',
    '선생님',
    '세계',
    '순간',
    '슈퍼스타',
    '스타',
    '스포아',
    '슬라임',
    '슬픔',
    '시간',
    '시작',
    '신념',
    '아니마',
    '아이돌',
    '악마',
    '어둠',
    '에르다스',
    '영웅',
    '영혼',
    '예술가',
    '예티',
    '오리',
    '용사',
    '우리',
    '운명',
    '음유시인',
    '의자',
    '의지',
    '이야기',
    '잠수부',
    '전사',
    '전투',
    '점프',
    '존재',
    '주황버섯',
    '직장인',
    '챌린저',
    '철학자',
    '초월자',
    '추억',
    '축복',
    '친구',
    '탐험',
    '태양',
    '평화',
    '표창',
    '핑크빈',
    '학생',
    '한글',
    '해적',
    '행운',
    '헤이스트',
    '활',
    '훈장',
    '희망',
    '힘'
  ]
};

// 목표 조합 타입
export interface TargetCombination {
  X: string;
  Y: string;
  Z: string;
}

// 계산 입력
export interface CalculationInput {
  currentState: TitleState;
  targetCombination: TargetCombination;
  maxIterations?: number;
}

// 계산 결과
export interface CalculationResult {
  expectedResets: number;
  expectedCost: number;
  percentile50: number; // 재설정 횟수 기준
  percentile90: number;
  percentile99: number;
  percentile50Cost: number; // 한글의 기운 기준
  percentile90Cost: number;
  percentile99Cost: number;
  distribution: { resets: number; probability: number; cumulative: number }[];
  costDistribution: { cost: number; probability: number; cumulative: number }[];
}

// 상태 인코딩 (비트 연산으로 최적화)
function encodeState(state: TitleState): number {
  return (state[0] << 2) | (state[1] << 1) | state[2];
}

// 상태 디코딩
function decodeState(encoded: number): TitleState {
  return [
    ((encoded >> 2) & 1) as SlotState,
    ((encoded >> 1) & 1) as SlotState,
    (encoded & 1) as SlotState
  ];
}

// 상태가 완성되었는지 확인
function isComplete(state: TitleState): boolean {
  return state[0] === 1 && state[1] === 1 && state[2] === 1;
}

// 맞춰진 슬롯 개수
function countMatched(state: TitleState): number {
  return state[0] + state[1] + state[2];
}

// 최적 잠금 전략: 맞춰진 슬롯은 잠그기
function getLockCount(state: TitleState): 0 | 1 | 2 {
  const matched = countMatched(state);
  return matched as 0 | 1 | 2;
}

// 전이 확률 캐시 (상태는 8가지만 존재)
const transitionCache = new Map<number, Map<number, number>>();

// 전이 확률 계산 (캐싱 적용)
function calculateTransitions(state: TitleState): Map<number, number> {
  const encodedState = encodeState(state);

  // 캐시 확인
  if (transitionCache.has(encodedState)) {
    return transitionCache.get(encodedState)!;
  }

  const transitions = new Map<number, number>();

  if (isComplete(state)) {
    // 이미 완성된 상태는 그대로 유지
    transitions.set(encodedState, 1.0);
    transitionCache.set(encodedState, transitions);
    return transitions;
  }

  // 각 슬롯의 성공/실패 확률
  const probs: Array<[number, number]> = [
    state[0] === 1 ? [1, 0] : [1 / SLOT_WORD_COUNTS.X, 1 - 1 / SLOT_WORD_COUNTS.X],
    state[1] === 1 ? [1, 0] : [1 / SLOT_WORD_COUNTS.Y, 1 - 1 / SLOT_WORD_COUNTS.Y],
    state[2] === 1 ? [1, 0] : [1 / SLOT_WORD_COUNTS.Z, 1 - 1 / SLOT_WORD_COUNTS.Z]
  ];

  // 모든 가능한 결과 조합 (2^3 = 8가지, 하지만 잠긴 슬롯은 제외)
  for (let mask = 0; mask < 8; mask++) {
    const newState: TitleState = [
      (mask & 4) ? 1 : 0,
      (mask & 2) ? 1 : 0,
      (mask & 1) ? 1 : 0
    ];

    // 잠긴 슬롯(이미 맞춰진 슬롯)은 변하지 않음
    if (state[0] === 1 && newState[0] === 0) continue;
    if (state[1] === 1 && newState[1] === 0) continue;
    if (state[2] === 1 && newState[2] === 0) continue;

    // 이 결과가 나올 확률 계산
    let prob = 1.0;
    prob *= newState[0] === 1 ? probs[0][0] : probs[0][1];
    prob *= newState[1] === 1 ? probs[1][0] : probs[1][1];
    prob *= newState[2] === 1 ? probs[2][0] : probs[2][1];

    if (prob > 0) {
      const encoded = encodeState(newState);
      transitions.set(encoded, (transitions.get(encoded) || 0) + prob);
    }
  }

  // 캐시에 저장
  transitionCache.set(encodedState, transitions);
  return transitions;
}

// 확률 분포 계산 (동적 프로그래밍)
export function calculateProbabilityDistribution(
  input: CalculationInput
): CalculationResult {
  const { currentState, maxIterations = 2000 } = input;

  // dp[재설정횟수] = Map<상태, 확률>
  const dp: Map<number, number>[] = [];

  // 비용별 완성 확률 추적 (cost -> probability)
  const costCompletionMap = new Map<number, number>();

  // 초기 상태
  dp[0] = new Map();
  dp[0].set(encodeState(currentState), 1.0);

  // 완성 상태의 확률 추적
  const completionProbs: number[] = [0]; // completionProbs[n] = n회 재설정으로 완성한 확률

  // 동적 프로그래밍
  let cumulativeCostProb = 0; // 총 누적 비용 기댓값

  for (let turn = 1; turn <= maxIterations; turn++) {
    dp[turn] = new Map();

    for (const [encodedState, prob] of Array.from(dp[turn - 1].entries())) {
      if (prob < 1e-12) continue; // 무시할 만큼 작은 확률

      const state = decodeState(encodedState);

      if (isComplete(state)) {
        // 이미 완성된 상태는 그대로 유지
        dp[turn].set(encodedState, (dp[turn].get(encodedState) || 0) + prob);
      } else {
        // 이번 턴의 비용
        const lockCount = getLockCount(state);
        const turnCost = RESET_COSTS[lockCount];

        // 전이 확률 계산
        const transitions = calculateTransitions(state);

        for (const [nextEncoded, transProb] of Array.from(transitions.entries())) {
          const newProb = prob * transProb;
          dp[turn].set(nextEncoded, (dp[turn].get(nextEncoded) || 0) + newProb);

          // 완성된 경우 비용 기록
          const nextState = decodeState(nextEncoded);
          if (isComplete(nextState)) {
            // 이 경로로 완성된 경우의 총 비용 계산 (간단한 추정)
            const estimatedTotalCost = estimateTotalCostForTurn(currentState, turn);
            costCompletionMap.set(estimatedTotalCost, (costCompletionMap.get(estimatedTotalCost) || 0) + newProb);
          }
        }
      }
    }

    // 이번 턴에서 완성된 확률 계산
    const completeEncoded = encodeState([1, 1, 1]);
    const currentCompleteProb = dp[turn].get(completeEncoded) || 0;
    const prevCompleteProb = turn > 0 ? (dp[turn - 1].get(completeEncoded) || 0) : 0;
    completionProbs[turn] = currentCompleteProb - prevCompleteProb;

    // 조기 종료: 99.99% 이상 완성
    if (currentCompleteProb > 0.9999) {
      break;
    }
  }

  // 기댓값 계산 (정확한 비용 추적)
  let expectedResets = 0;
  let expectedCost = 0;

  for (let turn = 1; turn < completionProbs.length; turn++) {
    if (completionProbs[turn] > 0) {
      expectedResets += turn * completionProbs[turn];
      const turnCost = estimateTotalCostForTurn(currentState, turn);
      expectedCost += turnCost * completionProbs[turn];
    }
  }

  // 누적 확률 계산
  const cumulative: number[] = [0];
  for (let i = 1; i < completionProbs.length; i++) {
    cumulative[i] = cumulative[i - 1] + completionProbs[i];
  }

  // 재설정 횟수 기준 백분위 계산
  const percentile50 = findPercentile(cumulative, 0.50);
  const percentile90 = findPercentile(cumulative, 0.90);
  const percentile99 = findPercentile(cumulative, 0.99);

  // 비용 기준 백분위 계산
  const percentile50Cost = estimateTotalCostForTurn(currentState, percentile50);
  const percentile90Cost = estimateTotalCostForTurn(currentState, percentile90);
  const percentile99Cost = estimateTotalCostForTurn(currentState, percentile99);

  // 분포 데이터 생성
  const distribution = completionProbs.slice(1).map((prob, idx) => ({
    resets: idx + 1,
    probability: prob,
    cumulative: cumulative[idx + 1]
  }));

  // 비용 분포 데이터 생성
  const costDistribution = completionProbs.slice(1).map((prob, idx) => ({
    cost: estimateTotalCostForTurn(currentState, idx + 1),
    probability: prob,
    cumulative: cumulative[idx + 1]
  }));

  return {
    expectedResets,
    expectedCost,
    percentile50,
    percentile90,
    percentile99,
    percentile50Cost,
    percentile90Cost,
    percentile99Cost,
    distribution,
    costDistribution
  };
}

// 특정 턴까지의 총 비용 추정
function estimateTotalCostForTurn(startState: TitleState, turn: number): number {
  const startMatched = countMatched(startState);

  if (turn === 0) return 0;

  // 단계별 전환 추정
  let cost = 0;
  let matched = startMatched;
  let remainingTurns = turn;

  // 0개 -> 1개
  if (matched === 0 && remainingTurns > 0) {
    const p = 1 / SLOT_WORD_COUNTS.X + 1 / SLOT_WORD_COUNTS.Y + 1 / SLOT_WORD_COUNTS.Z;
    const turnsToFirst = Math.min(remainingTurns, Math.ceil(1 / p));
    cost += turnsToFirst * RESET_COSTS[0];
    remainingTurns -= turnsToFirst;
    matched = 1;
  }

  // 1개 -> 2개
  if (matched === 1 && remainingTurns > 0) {
    const avgP = 1 / ((SLOT_WORD_COUNTS.Y + SLOT_WORD_COUNTS.Z) / 2);
    const turnsToSecond = Math.min(remainingTurns, Math.ceil(1 / avgP / 2)); // 2개 슬롯 중 하나
    cost += turnsToSecond * RESET_COSTS[1];
    remainingTurns -= turnsToSecond;
    matched = 2;
  }

  // 2개 -> 3개
  if (matched === 2 && remainingTurns > 0) {
    cost += remainingTurns * RESET_COSTS[2];
  } else if (matched < 2 && remainingTurns > 0) {
    // 예외 케이스: 아직 2개가 안됐는데 턴이 남음
    cost += remainingTurns * RESET_COSTS[matched as 0 | 1 | 2];
  }

  return Math.round(cost);
}

// 백분위 찾기
function findPercentile(cumulative: number[], percentile: number): number {
  for (let i = 0; i < cumulative.length; i++) {
    if (cumulative[i] >= percentile) {
      return i;
    }
  }
  return cumulative.length - 1;
}

// 평균 비용 추정 (근사값)
function estimateAverageCostPerReset(startState: TitleState, totalResets: number): number {
  const startMatched = countMatched(startState);

  // 간단한 휴리스틱: 평균적으로 상태가 어떻게 진행되는지 추정
  if (totalResets <= 5) {
    // 초반에는 첫 슬롯 맞추는 중
    return RESET_COSTS[startMatched as 0 | 1 | 2];
  }

  // 중반 이후: 평균적으로 1개 정도 맞춰진 상태
  const avgMatched = Math.min(2, startMatched + Math.floor(totalResets / 50));
  return RESET_COSTS[avgMatched as 0 | 1 | 2];
}

// 정확한 기대 비용 계산
function calculateExpectedCost(startState: TitleState, expectedResets: number): number {
  const startMatched = countMatched(startState);

  // 각 단계별 기댓값 계산
  if (startMatched === 0) {
    // (0,0,0) → (1,0,0) 또는 유사
    const p1 = 1 / SLOT_WORD_COUNTS.X;
    const p2 = 1 / SLOT_WORD_COUNTS.Y;
    const p3 = 1 / SLOT_WORD_COUNTS.Z;
    const pAny = p1 + p2 + p3 - p1 * p2 - p1 * p3 - p2 * p3 + p1 * p2 * p3;

    const resetsToFirst = 1 / pAny;
    const costToFirst = resetsToFirst * RESET_COSTS[0];

    // 첫 슬롯 이후
    const remainingResets = expectedResets - resetsToFirst;
    return costToFirst + calculateExpectedCostFromOne(remainingResets);
  } else if (startMatched === 1) {
    return calculateExpectedCostFromOne(expectedResets);
  } else if (startMatched === 2) {
    // 2개 맞춰진 상태에서 시작
    const remaining = [SLOT_WORD_COUNTS.X, SLOT_WORD_COUNTS.Y, SLOT_WORD_COUNTS.Z].find((count, idx) => {
      return startState[idx] === 0;
    }) || SLOT_WORD_COUNTS.Z;

    return expectedResets * RESET_COSTS[2];
  } else {
    return 0; // 이미 완성
  }
}

// 1개 맞춰진 상태부터의 기대 비용
function calculateExpectedCostFromOne(remainingResets: number): number {
  // 1개 맞춰진 상태 → 2개 맞춰진 상태
  // 대략적인 추정: 두 슬롯 중 하나를 맞출 때까지
  const avgTwoSlots = (SLOT_WORD_COUNTS.Y + SLOT_WORD_COUNTS.Z) / 2;
  const p = 1 / avgTwoSlots + 1 / avgTwoSlots;
  const resetsToSecond = 1 / p;
  const costToSecond = Math.min(remainingResets, resetsToSecond) * RESET_COSTS[1];

  // 2개 맞춰진 상태 → 완성
  const resetsToThird = Math.max(0, remainingResets - resetsToSecond);
  const costToThird = resetsToThird * RESET_COSTS[2];

  return costToSecond + costToThird;
}

// 간단한 기댓값 계산 (빠른 추정용)
export function quickEstimate(currentState: TitleState): {
  expectedResets: number;
  expectedCost: number;
} {
  const matched = countMatched(currentState);

  if (matched === 3) {
    return { expectedResets: 0, expectedCost: 0 };
  }

  let totalResets = 0;
  let totalCost = 0;

  if (matched === 0) {
    // 첫 슬롯 맞추기
    const p1 = 1 / SLOT_WORD_COUNTS.X;
    const p2 = 1 / SLOT_WORD_COUNTS.Y;
    const p3 = 1 / SLOT_WORD_COUNTS.Z;
    const pAny = p1 + p2 + p3;

    const resets1 = 1 / pAny;
    totalResets += resets1;
    totalCost += resets1 * RESET_COSTS[0];
  }

  if (matched <= 1) {
    // 두 번째 슬롯 맞추기
    const remaining = [SLOT_WORD_COUNTS.X, SLOT_WORD_COUNTS.Y, SLOT_WORD_COUNTS.Z]
      .filter((_, idx) => currentState[idx] === 0);

    const pSum = remaining.reduce((sum, count) => sum + 1 / count, 0);
    const resets2 = 1 / pSum;
    totalResets += resets2;
    totalCost += resets2 * RESET_COSTS[1];
  }

  if (matched <= 2) {
    // 마지막 슬롯 맞추기
    const remaining = [SLOT_WORD_COUNTS.X, SLOT_WORD_COUNTS.Y, SLOT_WORD_COUNTS.Z]
      .filter((_, idx) => currentState[idx] === 0);

    if (remaining.length > 0) {
      const lastCount = remaining[remaining.length - 1];
      const resets3 = lastCount;
      totalResets += resets3;
      totalCost += resets3 * RESET_COSTS[2];
    }
  }

  return {
    expectedResets: Math.round(totalResets),
    expectedCost: Math.round(totalCost)
  };
}