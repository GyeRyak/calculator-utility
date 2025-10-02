'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  calculateProbabilityDistribution,
  SLOT_WORD_COUNTS,
  WORD_LISTS,
  groupWordsByCategory,
  type TitleState,
  type TargetCombination,
  type CalculationResult,
  type SlotType
} from '@/utils/hangeulTitleCalculations';
import { searchKorean, highlightMatches } from '@/utils/koreanSearch';
import AutoSlotManager from '@/components/ui/AutoSlotManager';
import DismissibleBanner from '@/components/ui/DismissibleBanner';
import HangeulCostDistributionChart from '@/components/charts/HangeulCostDistributionChart';
import { AdSenseUnit } from '@/components/ads/AdSenseUnit';
import { Search, Check, Shuffle } from 'lucide-react';
import { trackCalculation, trackRandomReset } from '@/lib/analytics';

// 기본값 상수
const DEFAULT_VALUES = {
  currentState: [0, 0, 0] as TitleState,
  targetCombination: {
    X: '나랏말싸미',
    Y: '전설의',
    Z: '한글'
  } as TargetCombination
};

interface HangeulTitleData {
  currentState: TitleState;
  targetCombination: TargetCombination;
}

export default function HangeulTitleCalculator() {
  const [currentState, setCurrentState] = useState<TitleState>(DEFAULT_VALUES.currentState);
  const [targetCombination, setTargetCombination] = useState<TargetCombination>(DEFAULT_VALUES.targetCombination);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [justLoaded, setJustLoaded] = useState(false);

  // 검색어 상태
  const [searchQueries, setSearchQueries] = useState<Record<SlotType, string>>({
    X: '',
    Y: '',
    Z: ''
  });

  // 선택된 리스트 아이템 인덱스 (키보드 네비게이션용)
  const [selectedIndices, setSelectedIndices] = useState<Record<SlotType, number>>({
    X: -1,
    Y: -1,
    Z: -1
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRefs = useRef<Record<SlotType, HTMLInputElement | null>>({
    X: null,
    Y: null,
    Z: null
  });
  const scrollContainerRefs = useRef<Record<SlotType, HTMLDivElement | null>>({
    X: null,
    Y: null,
    Z: null
  });
  const selectedWordRefs = useRef<Record<SlotType, HTMLButtonElement | null>>({
    X: null,
    Y: null,
    Z: null
  });

  // 필터링된 단어 목록 (한국어 fuzzy search + 초성 검색 지원)
  const getFilteredWords = (slot: SlotType): Array<{ word: string; highlighted: string; category?: string }> => {
    const query = searchQueries[slot];
    if (!query) {
      // 검색어가 없으면 카테고리별로 그룹화해서 반환
      const grouped = groupWordsByCategory(WORD_LISTS[slot]);
      const result: Array<{ word: string; highlighted: string; category?: string }> = [];

      for (const group of grouped) {
        // 카테고리 헤더 추가
        result.push({
          word: `__CATEGORY_${group.category}__`,
          highlighted: group.category,
          category: group.category
        });

        // 해당 카테고리의 단어들 추가
        for (const word of group.words) {
          result.push({ word, highlighted: word });
        }
      }

      return result;
    }

    // 검색어가 있으면 검색 결과만 반환 (카테고리 헤더 없음)
    const results = searchKorean(query, WORD_LISTS[slot], {
      maxResults: 50
    });

    return results.map(result => ({
      word: result.item,
      highlighted: highlightMatches(result.item, result.matches)
    }));
  };

  // AutoSlotManager 함수들
  const getCurrentData = (): HangeulTitleData => ({
    currentState,
    targetCombination
  });

  const loadData = (data: any, onComplete?: () => void) => {
    setJustLoaded(true);

    if (data.currentState !== undefined) {
      setCurrentState(data.currentState);
    }
    if (data.targetCombination !== undefined) {
      setTargetCombination(data.targetCombination);
    }

    if (onComplete) {
      setTimeout(onComplete, 100);
    }
  };

  const resetAllData = () => {
    setJustLoaded(true);
    setCurrentState(DEFAULT_VALUES.currentState);
    setTargetCombination(DEFAULT_VALUES.targetCombination);
    setResult(null);
  };

  // 슬롯 상태 토글
  const toggleSlot = (slotIndex: 0 | 1 | 2) => {
    setCurrentState(prev => {
      const newState = [...prev] as TitleState;
      newState[slotIndex] = prev[slotIndex] === 0 ? 1 : 0;
      return newState;
    });
  };

  // 랜덤 조합 생성 (고정되지 않은 슬롯만)
  const handleRandomize = () => {
    const slots: SlotType[] = ['X', 'Y', 'Z'];
    const newCombination = { ...targetCombination };

    slots.forEach((slot, index) => {
      // 고정되지 않은 슬롯만 랜덤 선택
      if (currentState[index] === 0) {
        const words = WORD_LISTS[slot];
        const randomIndex = Math.floor(Math.random() * words.length);
        newCombination[slot] = words[randomIndex];
      }
    });

    setTargetCombination(newCombination);

    // 검색어 초기화
    setSearchQueries({ X: '', Y: '', Z: '' });
    setSelectedIndices({ X: -1, Y: -1, Z: -1 });

    // 변경된 슬롯만 스크롤
    slots.forEach((slot, index) => {
      if (currentState[index] === 0) {
        scrollToSelectedWord(slot);
      }
    });

    trackRandomReset(); // GA 이벤트 트래킹
  };

  // 선택된 단어로 스크롤
  const scrollToSelectedWord = (slot: SlotType) => {
    setTimeout(() => {
      const container = scrollContainerRefs.current[slot];
      const selectedButton = selectedWordRefs.current[slot];

      if (container && selectedButton) {
        const containerRect = container.getBoundingClientRect();
        const buttonRect = selectedButton.getBoundingClientRect();
        const scrollTop = container.scrollTop;

        // 버튼이 컨테이너의 중앙에 오도록 스크롤
        const targetScroll = scrollTop + (buttonRect.top - containerRect.top) - (containerRect.height / 2) + (buttonRect.height / 2);

        container.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  // 목표 조합 변경
  const handleTargetChange = (slot: SlotType, value: string) => {
    setTargetCombination(prev => ({
      ...prev,
      [slot]: value
    }));
    setSearchQueries(prev => ({ ...prev, [slot]: '' }));
    setSelectedIndices(prev => ({ ...prev, [slot]: -1 }));

    // 선택 후 스크롤
    scrollToSelectedWord(slot);
  };

  // 키보드 이벤트 핸들러
  const handleKeyDown = (slot: SlotType, e: React.KeyboardEvent<HTMLInputElement>) => {
    const filteredWords = getFilteredWords(slot);
    const currentIndex = selectedIndices[slot];

    // 카테고리 헤더가 아닌 다음 인덱스 찾기
    const findNextValidIndex = (startIdx: number, direction: 1 | -1): number => {
      let idx = startIdx;
      const maxAttempts = filteredWords.length;
      let attempts = 0;

      while (attempts < maxAttempts) {
        idx = direction === 1
          ? (idx < filteredWords.length - 1 ? idx + 1 : 0)
          : (idx > 0 ? idx - 1 : filteredWords.length - 1);

        // 카테고리 헤더가 아니면 반환
        if (!filteredWords[idx]?.word.startsWith('__CATEGORY_')) {
          return idx;
        }

        attempts++;
      }

      return startIdx; // 유효한 인덱스를 못 찾으면 원래 인덱스 반환
    };

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = findNextValidIndex(currentIndex, 1);
      setSelectedIndices(prev => ({ ...prev, [slot]: nextIndex }));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = findNextValidIndex(currentIndex, -1);
      setSelectedIndices(prev => ({ ...prev, [slot]: prevIndex }));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentIndex >= 0 && currentIndex < filteredWords.length) {
        const selectedWord = filteredWords[currentIndex];
        // 카테고리 헤더가 아닌 경우에만 선택
        if (!selectedWord.word.startsWith('__CATEGORY_')) {
          handleTargetChange(slot, selectedWord.word);
        }
      } else if (filteredWords.length > 0) {
        // 선택된 아이템이 없으면 첫 번째 유효한 단어 선택
        const firstValid = filteredWords.find(w => !w.word.startsWith('__CATEGORY_'));
        if (firstValid) {
          handleTargetChange(slot, firstValid.word);
        }
      }
    } else if (e.key === 'Tab') {
      // 탭 키는 기본 동작 유지 (다음 검색창으로 포커스 이동)
      setSelectedIndices(prev => ({ ...prev, [slot]: -1 }));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setSelectedIndices(prev => ({ ...prev, [slot]: -1 }));
      setSearchQueries(prev => ({ ...prev, [slot]: '' }));
    }
  };

  // 계산 실행
  const calculate = useCallback(() => {
    setIsCalculating(true);

    // 비동기로 계산 (UI 블로킹 방지)
    setTimeout(() => {
      try {
        const calculationResult = calculateProbabilityDistribution({
          currentState,
          targetCombination,
          maxIterations: 2000
        });

        setResult(calculationResult);
        trackCalculation('hangeul_medal'); // GA 이벤트 트래킹
      } catch (error) {
        console.error('계산 중 오류 발생:', error);
      } finally {
        setIsCalculating(false);
      }
    }, 50);
  }, [currentState, targetCombination]);

  // 자동 계산
  useEffect(() => {
    if (!justLoaded) {
      calculate();
    } else {
      setJustLoaded(false);
    }
  }, [currentState, targetCombination, calculate, justLoaded]);

  // 각 슬롯의 이전 값 추적 (스크롤 조건 판단용)
  const prevTargetCombination = useRef<TargetCombination>(targetCombination);
  const isInitialMount = useRef(true);

  // 최초 로드 시 모든 슬롯 스크롤
  useEffect(() => {
    if (isInitialMount.current) {
      (['X', 'Y', 'Z'] as SlotType[]).forEach(slot => {
        scrollToSelectedWord(slot);
      });
      isInitialMount.current = false;
    }
  }, []);

  // targetCombination 변경 시 해당 슬롯만 스크롤
  useEffect(() => {
    if (!isInitialMount.current) {
      (['X', 'Y', 'Z'] as SlotType[]).forEach(slot => {
        // 해당 슬롯의 값이 실제로 변경된 경우에만 스크롤
        if (prevTargetCombination.current[slot] !== targetCombination[slot]) {
          scrollToSelectedWord(slot);
        }
      });
    }
    prevTargetCombination.current = targetCombination;
  }, [targetCombination]);

  // 검색어 변경 시 최상단으로 스크롤
  useEffect(() => {
    (['X', 'Y', 'Z'] as SlotType[]).forEach(slot => {
      const container = scrollContainerRefs.current[slot];
      if (container && searchQueries[slot]) {
        container.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    });
  }, [searchQueries]);

  const slotNames: Record<number, string> = {
    0: 'X',
    1: 'Y',
    2: 'Z'
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold">한글날 훈장 행사 계산기</h1>
      </div>

      {/* 행사 정보 배너 */}
      <DismissibleBanner
        bannerId="hangeul-title-event-info"
        message="🎖️ 한글날 훈장 행사: 세 칸에 단어를 조합하여 원하는 훈장을 만드세요! 특정 칸을 잠그고 재설정할 수 있으며, 잠글 때마다 한글의 기운 소모량이 곱절이 됩니다."
        bgColor="bg-blue-50"
        borderColor="border-blue-200"
        textColor="text-blue-800"
        linkHref="https://maplestory.nexon.com/News/Event/Ongoing/1206"
        linkText="단풍이야기 누리집 한글의 기운 행사"
        showIcon={false}
      />

      <DismissibleBanner
        bannerId="hangeul-title-how-it-works"
        message="💡 계산 방식: 상태 전이 확률을 기반으로 기억하며 계산하기 연산법을 사용하여 비교적 정확하게 기댓값을 계산합니다."
        bgColor="bg-green-50"
        borderColor="border-green-200"
        textColor="text-green-800"
        linkHref=""
        linkText=""
        showIcon={false}
      />

      <DismissibleBanner
        bannerId="hangeul-title-optimal-strategy"
        message="✨ 재설정 중 원하는 단어가 나오면 해당 칸을 잠그고 진행하세요. 해당 방법이 최적입니다!"
        bgColor="bg-yellow-50"
        borderColor="border-yellow-200"
        textColor="text-yellow-900"
        linkHref=""
        linkText=""
        showIcon={false}
      />

      {/* AutoSlotManager */}
      <AutoSlotManager
        calculatorId="hangeul_title"
        maxSlots={2}
        getCurrentData={getCurrentData}
        loadData={loadData}
        onReset={resetAllData}
      />

      {/* 목표 훈장 선택 섹션 시작 */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">목표 훈장 고르기</h2>

        {/* 3열 그리드 레이아웃 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" ref={dropdownRef}>
          {(['X', 'Y', 'Z'] as SlotType[]).map((slot, slotIndex) => (
            <div key={slot} className="bg-gray-50 rounded-lg p-4">
              {/* 검색 및 선택 영역 시작 */}
              <div className="space-y-3">
                {/* 검색창 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    ref={(el) => {
                      searchInputRefs.current[slot] = el;
                    }}
                    type="text"
                    placeholder="검색..."
                    value={searchQueries[slot]}
                    onChange={(e) => {
                      setSearchQueries(prev => ({ ...prev, [slot]: e.target.value }));
                      setSelectedIndices(prev => ({ ...prev, [slot]: -1 }));
                    }}
                    onKeyDown={(e) => handleKeyDown(slot, e)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 단어 목록 (항상 표시) */}
                <div
                  ref={(el) => {
                    scrollContainerRefs.current[slot] = el;
                  }}
                  className="h-64 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-sm touch-pan-y"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                  tabIndex={-1}
                >
                  {getFilteredWords(slot).map(({ word, highlighted, category }, index) => {
                    // 카테고리 헤더인 경우
                    if (word.startsWith('__CATEGORY_')) {
                      return (
                        <div
                          key={word}
                          className="sticky top-0 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-600 px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 border-b border-gray-300 dark:border-gray-500 z-10 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95"
                        >
                          {highlighted}
                        </div>
                      );
                    }

                    const isSelected = targetCombination[slot] === word;
                    const isHighlighted = selectedIndices[slot] === index;

                    return (
                      <button
                        key={`${word}_${index}`}
                        ref={(el) => {
                          if (isSelected) {
                            selectedWordRefs.current[slot] = el;
                          }
                        }}
                        onClick={() => handleTargetChange(slot, word)}
                        tabIndex={-1}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${
                          isSelected ? 'bg-blue-100 font-semibold' : ''
                        } ${
                          isHighlighted ? 'bg-gray-100 ring-2 ring-blue-400 ring-inset' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="break-words"
                            dangerouslySetInnerHTML={{
                              __html: slot === 'Z' && word === '캐릭터명'
                                ? '캐릭터명 (실제 이름 출력, 영문/숫자 포함 시 "아무개")'
                                : highlighted
                            }}
                          />
                          {isSelected && (
                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                  {getFilteredWords(slot).length === 0 && (
                    <div className="px-3 py-4 text-center text-sm text-gray-500">
                      검색 결과가 없습니다
                    </div>
                  )}
                </div>

                {/* 선택된 단어 표시 */}
                <div className="p-3 bg-white rounded-lg border-2 border-blue-200 h-20">
                  <p className="text-xs text-gray-600 mb-1">선택된 단어:</p>
                  <p className="text-base font-bold text-blue-600 break-words line-clamp-2">
                    {slot === 'Z' && targetCombination[slot] === '캐릭터명'
                      ? '인물이름'
                      : targetCombination[slot]}
                  </p>
                </div>

                {/* 고정 체크박스 */}
                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-100 rounded transition-colors h-10">
                  <input
                    type="checkbox"
                    checked={currentState[slotIndex] === 1}
                    onChange={() => toggleSlot(slotIndex as 0 | 1 | 2)}
                    tabIndex={-1}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    고정
                  </span>
                </label>
              </div>
              {/* 검색 및 선택 영역 끝 */}
            </div>
          ))}
        </div>

        {/* 목표 훈장 미리보기 시작 */}
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2 text-center sm:text-left">목표 훈장:</p>
              <p className="text-2xl font-bold text-center sm:text-left text-purple-900">
                {targetCombination.X === '(공백)' ? '' : targetCombination.X}{' '}
                {targetCombination.Y}{' '}
                {targetCombination.Z === '캐릭터명' ? '[인물이름]' : targetCombination.Z}
              </p>
            </div>
            <button
              onClick={handleRandomize}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors shadow-sm hover:shadow-md whitespace-nowrap"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span className="font-medium">무작위로 재설정</span>
            </button>
          </div>
        </div>
        {/* 목표 훈장 미리보기 끝 */}
      </div>
      {/* 목표 훈장 선택 섹션 끝 */}

      {/* 계산 결과 섹션 시작 */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6 min-h-[600px]">
        {result ? (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">계산 결과</h2>

            {/* 주요 지표 그리드 시작 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* 평균 재설정 횟수 */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">평균 재설정 횟수</div>
                <div className="text-3xl font-bold text-blue-600">
                  {result.expectedResets.toFixed(1)}회
                </div>
              </div>

              {/* 평균 한글의 기운 */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">평균 한글의 기운</div>
                <div className="text-3xl font-bold text-purple-600">
                  {result.expectedCost.toFixed(1)}개
                </div>
              </div>
            </div>
            {/* 주요 지표 그리드 끝 */}

            {/* 백분위 정보 시작 */}
            <div className="bg-white rounded-lg p-5 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">확률 분포 (백분위)</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">5할 확률로 완성</span>
                  <span className="text-lg font-bold text-blue-600">
                    한글의 기운 {result.percentile50Cost}개 이내
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">9할 확률로 완성</span>
                  <span className="text-lg font-bold text-purple-600">
                    한글의 기운 {result.percentile90Cost}개 이내
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">9할 9푼 확률로 완성</span>
                  <span className="text-lg font-bold text-pink-600">
                    한글의 기운 {result.percentile99Cost}개 이내
                  </span>
                </div>
              </div>
            </div>
            {/* 백분위 정보 끝 */}

            {/* 재설정 비용 안내 시작 */}
            <div className="mt-6 bg-white rounded-lg p-5 shadow-sm">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">재설정 비용 안내</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <span>전체 재설정 (0개 잠금)</span>
                  <span className="font-bold text-blue-600">한글의 기운 1개</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>1개 칸 잠금</span>
                  <span className="font-bold text-purple-600">한글의 기운 2개</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>2개 칸 잠금</span>
                  <span className="font-bold text-pink-600">한글의 기운 4개</span>
                </div>
              </div>
            </div>
            {/* 재설정 비용 안내 끝 */}

            {/* 비용 분포 차트 */}
            <HangeulCostDistributionChart result={result} />
          </>
        ) : (
          <div className="flex items-center justify-center h-[552px]">
            <p className="text-gray-500">목표 훈장을 선택하면 계산 결과가 표시됩니다</p>
          </div>
        )}
      </div>
      {/* 계산 결과 섹션 끝 */}

    </div>
  );
}