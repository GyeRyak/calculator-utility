import { matches } from 'kled';

/**
 * 한국어 검색 결과 인터페이스
 */
export interface KoreanSearchResult {
  item: string;
  matches: Array<{ start: number; end: number }>;
  score: number; // 유사도 점수 (높을수록 좋음, 0~1)
}

/**
 * 한글 음절을 초성, 중성, 종성으로 분해
 */
function decomposeHangul(char: string): [number, number, number] | null {
  const code = char.charCodeAt(0);
  const base = 0xAC00; // '가'

  if (code < base || code > 0xD7A3) {
    return null;
  }

  const offset = code - base;
  const initial = Math.floor(offset / 588); // 초성 (19개)
  const medial = Math.floor((offset % 588) / 28); // 중성 (21개)
  const final = offset % 28; // 종성 (28개, 0은 없음)

  return [initial, medial, final];
}

/**
 * 초성, 중성, 종성을 한글 음절로 조합
 */
function composeHangul(initial: number, medial: number, final: number): string {
  const base = 0xAC00;
  const code = base + (initial * 588) + (medial * 28) + final;
  return String.fromCharCode(code);
}

/**
 * 한글 자음 코드 체크
 */
function isChosung(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x3131 && code <= 0x314E; // ㄱ ~ ㅎ
}

/**
 * 한글 음절 체크
 */
function isHangulSyllable(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0xAC00 && code <= 0xD7A3;
}

/**
 * 겹자음 체크
 */
function isDoubleConsonant(char: string): boolean {
  const code = char.charCodeAt(0);
  const doubleConsonants = [
    0x3133, // ㄳ
    0x3135, // ㄵ
    0x3136, // ㄶ
    0x313A, // ㄺ
    0x313B, // ㄻ
    0x313C, // ㄼ
    0x313D, // ㄽ
    0x313E, // ㄾ
    0x313F, // ㄿ
    0x3140, // ㅀ
    0x3144  // ㅄ
  ];
  return doubleConsonants.includes(code);
}

/**
 * 문자를 정규식 패턴으로 변환 (초성 검색 지원)
 */
function charToPattern(char: string): string {
  // 겹자음인 경우 - 분해된 형태로도 매칭
  if (isDoubleConsonant(char)) {
    const decomposed = decomposeDoubleConsonant(char);
    if (decomposed) {
      const [first, second] = decomposed;
      const pattern1 = charToPattern(first);
      const pattern2 = charToPattern(second);
      // 겹자음 자체를 이스케이프
      const escapedChar = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // "ㅄ" 또는 "ㅂ" 다음에 "ㅅ"
      return `(?:${escapedChar}|${pattern1}${pattern2})`;
    }
  }

  // 초성인 경우
  if (isChosung(char)) {
    // 자음(ㄱ~ㅎ) 유니코드: 0x3131 ~ 0x314E (30개)
    // 한글 음절 초성 인덱스: 0~18 (19개, 쌍자음 제외)
    // ㄱ(0x3131) -> 0, ㄲ(0x3132) -> 1, ㄴ(0x3134) -> 2, ...
    const chosungCode = char.charCodeAt(0);

    // 자음 유니코드를 초성 인덱스로 매핑
    const chosungToInitialMap: { [key: number]: number } = {
      0x3131: 0,  // ㄱ
      0x3132: 1,  // ㄲ
      0x3134: 2,  // ㄴ
      0x3137: 3,  // ㄷ
      0x3138: 4,  // ㄸ
      0x3139: 5,  // ㄹ
      0x3141: 6,  // ㅁ
      0x3142: 7,  // ㅂ
      0x3143: 8,  // ㅃ
      0x3145: 9,  // ㅅ
      0x3146: 10, // ㅆ
      0x3147: 11, // ㅇ
      0x3148: 12, // ㅈ
      0x3149: 13, // ㅉ
      0x314A: 14, // ㅊ
      0x314B: 15, // ㅋ
      0x314C: 16, // ㅌ
      0x314D: 17, // ㅍ
      0x314E: 18  // ㅎ
    };

    const initialIndex = chosungToInitialMap[chosungCode];
    if (initialIndex !== undefined) {
      // 해당 초성으로 시작하는 모든 한글 음절 매칭
      const startChar = composeHangul(initialIndex, 0, 0);
      const endChar = composeHangul(initialIndex, 20, 27);
      return `[${startChar}-${endChar}]`;
    }
  }

  // 한글 음절인 경우 - 부분 매칭 지원
  if (isHangulSyllable(char)) {
    const decomposed = decomposeHangul(char);
    if (decomposed) {
      const [initial, medial, final] = decomposed;

      // 종성이 있는 경우: 정확히 일치
      if (final > 0) {
        return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }

      // 종성이 없는 경우: 종성 있는 것도 매칭 (예: "가" -> "각", "간" 등도 매칭)
      const withoutFinal = char;
      const withFinalStart = composeHangul(initial, medial, 1);
      const withFinalEnd = composeHangul(initial, medial, 27);
      return `[${withoutFinal}${withFinalStart}-${withFinalEnd}]`;
    }
  }

  // 일반 문자는 이스케이프
  return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 겹자음을 기본 자음 2개로 분해
 */
function decomposeDoubleConsonant(char: string): string[] | null {
  const doubleConsonantMap: { [key: string]: string[] } = {
    'ㄳ': ['ㄱ', 'ㅅ'],
    'ㄵ': ['ㄴ', 'ㅈ'],
    'ㄶ': ['ㄴ', 'ㅎ'],
    'ㄺ': ['ㄹ', 'ㄱ'],
    'ㄻ': ['ㄹ', 'ㅁ'],
    'ㄼ': ['ㄹ', 'ㅂ'],
    'ㄽ': ['ㄹ', 'ㅅ'],
    'ㄾ': ['ㄹ', 'ㅌ'],
    'ㄿ': ['ㄹ', 'ㅍ'],
    'ㅀ': ['ㄹ', 'ㅎ'],
    'ㅄ': ['ㅂ', 'ㅅ']
  };

  return doubleConsonantMap[char] || null;
}

/**
 * 검색어를 전처리하여 겹자음을 분해된 형태로도 검색 가능하게 함
 * 예: "ㅂㅅ" 입력 시 "ㅄ"도 매칭되도록
 */
function preprocessQuery(query: string): string {
  // 연속된 두 자음이 겹자음을 구성하는지 확인하고 겹자음도 추가
  let processed = '';
  const chars = query.split('');

  for (let i = 0; i < chars.length; i++) {
    const current = chars[i];
    const next = chars[i + 1];

    processed += current;

    // 현재와 다음 문자가 겹자음을 만들 수 있는지 확인
    if (next && isChosung(current) && isChosung(next)) {
      const combined = current + next;

      // 겹자음 매핑 확인
      const doubleConsonants: { [key: string]: string } = {
        'ㄱㅅ': 'ㄳ',
        'ㄴㅈ': 'ㄵ',
        'ㄴㅎ': 'ㄶ',
        'ㄹㄱ': 'ㄺ',
        'ㄹㅁ': 'ㄻ',
        'ㄹㅂ': 'ㄼ',
        'ㄹㅅ': 'ㄽ',
        'ㄹㅌ': 'ㄾ',
        'ㄹㅍ': 'ㄿ',
        'ㄹㅎ': 'ㅀ',
        'ㅂㅅ': 'ㅄ'
      };

      const doubleConsonant = doubleConsonants[combined];
      if (doubleConsonant) {
        // 겹자음이 있으면 원본은 유지하되, 패턴 생성 시 겹자음도 매칭되도록 처리
        // 여기서는 원본 그대로 반환 (charToPattern에서 처리)
      }
    }
  }

  return processed;
}

/**
 * 검색어를 fuzzy 정규식 패턴으로 변환 (각 문자를 개별 캡처 그룹으로)
 */
function createFuzzyPattern(query: string): RegExp | null {
  if (!query) return null;

  const chars = query.split('');
  const patterns: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    const current = chars[i];
    const next = chars[i + 1];

    // 연속된 두 자음이 겹자음을 만들 수 있는지 확인
    if (next && isChosung(current) && isChosung(next)) {
      const combined = current + next;

      const doubleConsonants: { [key: string]: string } = {
        'ㄱㅅ': 'ㄳ',
        'ㄴㅈ': 'ㄵ',
        'ㄴㅎ': 'ㄶ',
        'ㄹㄱ': 'ㄺ',
        'ㄹㅁ': 'ㄻ',
        'ㄹㅂ': 'ㄼ',
        'ㄹㅅ': 'ㄽ',
        'ㄹㅌ': 'ㄾ',
        'ㄹㅍ': 'ㄿ',
        'ㄹㅎ': 'ㅀ',
        'ㅂㅅ': 'ㅄ'
      };

      const doubleConsonant = doubleConsonants[combined];
      if (doubleConsonant) {
        // "ㅂㅅ" -> "(ㅂ)(ㅅ)" 또는 "(ㅄ)" 둘 다 매칭
        const pattern1 = charToPattern(current);
        const pattern2 = charToPattern(next);
        const pattern3 = charToPattern(doubleConsonant);

        // (ㅂ)(ㅅ) 또는 (ㅄ) 패턴
        patterns.push(`((?:${pattern1}${pattern2})|(?:${pattern3}))`);

        i++; // 다음 문자는 이미 처리했으므로 건너뛰기
        continue;
      }
    }

    // 일반 문자 처리
    const pattern = charToPattern(current);
    patterns.push(`(${pattern})`);
  }

  const fullPattern = patterns.join('.*?');

  try {
    return new RegExp(fullPattern, 'i');
  } catch (e) {
    return null;
  }
}

/**
 * 정규식 매칭 결과에서 각 캡처 그룹의 위치 추출
 */
function extractMatchPositions(match: RegExpMatchArray): Array<{ start: number; end: number }> {
  const positions: Array<{ start: number; end: number }> = [];
  const fullMatch = match[0];
  const matchStart = match.index ?? 0;

  // 각 캡처 그룹의 위치 추출
  let searchOffset = 0;
  for (let i = 1; i < match.length; i++) {
    const captured = match[i];
    if (captured) {
      // fullMatch 내에서 captured의 위치 찾기
      const relativeIndex = fullMatch.indexOf(captured, searchOffset);
      if (relativeIndex !== -1) {
        positions.push({
          start: matchStart + relativeIndex,
          end: matchStart + relativeIndex + captured.length
        });
        searchOffset = relativeIndex + captured.length;
      }
    }
  }

  return positions;
}

/**
 * 한국어 fuzzy search를 수행하고 매칭된 부분 정보를 반환
 *
 * @param query 검색어 (초성 검색 지원: "ㅎㅅㄱ" -> "힘세고")
 * @param items 검색 대상 문자열 배열
 * @param options 검색 옵션
 * @returns 매칭된 아이템과 하이라이트 정보
 */
export function searchKorean(
  query: string,
  items: string[],
  options: {
    maxResults?: number; // 최대 결과 개수
  } = {}
): KoreanSearchResult[] {
  const { maxResults = 50 } = options;

  if (!query.trim()) {
    return [];
  }

  const fuzzyRegex = createFuzzyPattern(query);
  if (!fuzzyRegex) {
    return [];
  }

  const results: KoreanSearchResult[] = [];

  for (const item of items) {
    // 1. 정규식 매칭으로 하이라이트 위치 추출
    const match = item.match(fuzzyRegex);

    if (match) {
      const matchPositions = extractMatchPositions(match);

      // 2. kled의 matches() 함수로 유사도 점수 계산
      const similarityScore = matches(query, item, false);

      results.push({
        item,
        matches: matchPositions,
        score: similarityScore
      });
    }
  }

  // 점수 순으로 정렬 (높은 점수가 더 좋은 매칭)
  results.sort((a, b) => b.score - a.score);

  // 최대 결과 개수 제한
  return results.slice(0, maxResults);
}

/**
 * 검색 결과를 하이라이트된 HTML로 변환
 *
 * @param text 원본 텍스트
 * @param matches 매칭 위치 배열
 * @returns <mark> 태그로 하이라이트된 HTML 문자열
 */
export function highlightMatches(
  text: string,
  matches: Array<{ start: number; end: number }>
): string {
  if (matches.length === 0) {
    return text;
  }

  let result = '';
  let lastIndex = 0;

  // 매칭 위치를 시작 인덱스 기준으로 정렬
  const sortedMatches = [...matches].sort((a, b) => a.start - b.start);

  for (const match of sortedMatches) {
    // 매칭 이전 부분
    result += text.slice(lastIndex, match.start);

    // 매칭된 부분 (하이라이트)
    result += `<mark>${text.slice(match.start, match.end)}</mark>`;

    lastIndex = match.end;
  }

  // 나머지 부분
  result += text.slice(lastIndex);

  return result;
}