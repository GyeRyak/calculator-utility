'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  calculateAchievementProbability,
  calculatePercentileRequirements,
  TARGET_ALPHABETS,
  type AlphabetType,
  type CalculationInput,
  type DustAmounts
} from '@/utils/origamiCalculations';
import AutoSlotManager from '@/components/ui/AutoSlotManager';
import DismissibleBanner from '@/components/ui/DismissibleBanner';
import ProbabilityDistributionChart from '@/components/charts/ProbabilityDistributionChart';

// 기본값 상수
const DEFAULT_VALUES = {
  normalPapers: 2500,
  colorfulPapers: 17,
  currentAlphabets: {
    C: 0, E: 0, K: 0, V: 0,
    A: 0, O: 0, P: 0, S: 0, T: 0,
    I: 0, N: 0, R: 0
  } as Record<AlphabetType, number>,
  currentDust: {
    normal: 0,
    premium: 0
  } as DustAmounts,
  otherLowAlphabets: 0,
  colorfulPaperPrice: 1.5,
  currentSettingIterations: 1000,
  comparisonIterations: 600
};

interface OrigamiData {
  normalPapers: number;
  colorfulPapers: number;
  currentAlphabets: Record<AlphabetType, number>;
  otherLowAlphabets: number;
  currentDust: DustAmounts;
  colorfulPaperPrice: number;
  currentSettingIterations: number;
  comparisonIterations: number;
}

export default function OrigamiCalculator() {
  const [normalPapers, setNormalPapers] = useState(DEFAULT_VALUES.normalPapers);
  const [colorfulPapers, setColorfulPapers] = useState(DEFAULT_VALUES.colorfulPapers);
  const [currentAlphabets, setCurrentAlphabets] = useState(DEFAULT_VALUES.currentAlphabets);
  const [currentDust, setCurrentDust] = useState(DEFAULT_VALUES.currentDust);
  const [otherLowAlphabets, setOtherLowAlphabets] = useState(DEFAULT_VALUES.otherLowAlphabets);
  const [colorfulPaperPrice, setColorfulPaperPrice] = useState(DEFAULT_VALUES.colorfulPaperPrice);
  const [currentSettingIterations, setCurrentSettingIterations] = useState(DEFAULT_VALUES.currentSettingIterations);
  const [comparisonIterations, setComparisonIterations] = useState(DEFAULT_VALUES.comparisonIterations);
  const [justLoaded, setJustLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 진행률 상태 관리
  const [progressState, setProgressState] = useState({
    isCalculating: false,
    currentProgress: 0,
    comparisonProgress: 0,
    currentTotal: 100,
    comparisonTotal: 100
  });

  // 마운트 상태 설정
  useEffect(() => {
    setMounted(true);
  }, []);

  // AutoSlotManager 함수들
  const getCurrentData = (): OrigamiData => ({
    normalPapers,
    colorfulPapers,
    currentAlphabets,
    currentDust,
    otherLowAlphabets,
    colorfulPaperPrice,
    currentSettingIterations,
    comparisonIterations
  });

  const loadData = (data: any, onComplete?: () => void) => {
    setJustLoaded(true);

    if (data.normalPapers !== undefined) setNormalPapers(data.normalPapers);
    if (data.colorfulPapers !== undefined) setColorfulPapers(data.colorfulPapers);
    if (data.currentAlphabets !== undefined) setCurrentAlphabets({ ...DEFAULT_VALUES.currentAlphabets, ...data.currentAlphabets });
    if (data.currentDust !== undefined) setCurrentDust({ ...DEFAULT_VALUES.currentDust, ...data.currentDust });
    if (data.otherLowAlphabets !== undefined) setOtherLowAlphabets(data.otherLowAlphabets);
    if (data.colorfulPaperPrice !== undefined) setColorfulPaperPrice(data.colorfulPaperPrice);
    if (data.currentSettingIterations !== undefined) setCurrentSettingIterations(data.currentSettingIterations);
    if (data.comparisonIterations !== undefined) setComparisonIterations(data.comparisonIterations);

    if (onComplete) {
      setTimeout(onComplete, 100);
    }
  };

  const resetAllData = () => {
    setJustLoaded(true);
    setNormalPapers(DEFAULT_VALUES.normalPapers);
    setColorfulPapers(DEFAULT_VALUES.colorfulPapers);
    setCurrentAlphabets(DEFAULT_VALUES.currentAlphabets);
    setCurrentDust(DEFAULT_VALUES.currentDust);
    setOtherLowAlphabets(DEFAULT_VALUES.otherLowAlphabets);
    setColorfulPaperPrice(DEFAULT_VALUES.colorfulPaperPrice);
    setCurrentSettingIterations(DEFAULT_VALUES.currentSettingIterations);
    setComparisonIterations(DEFAULT_VALUES.comparisonIterations);
  };

  const handleAlphabetChange = (alphabet: AlphabetType, value: number) => {
    setCurrentAlphabets(prev => ({
      ...prev,
      [alphabet]: Math.max(0, Math.min(50, value))
    }));
  };

  // 진행률 업데이트 콜백
  const handleProgressUpdate = useCallback((currentProgress: number, currentTotal: number, isCurrentSetting: boolean, comparisonProgress?: number, comparisonTotal?: number) => {
    setProgressState(prev => ({
      ...prev,
      isCalculating: currentProgress < currentTotal || (comparisonProgress !== undefined && comparisonProgress < comparisonTotal!),
      currentProgress: isCurrentSetting ? currentProgress : prev.currentProgress,
      currentTotal: isCurrentSetting ? currentTotal : prev.currentTotal,
      comparisonProgress: comparisonProgress !== undefined ? comparisonProgress : prev.comparisonProgress,
      comparisonTotal: comparisonTotal !== undefined ? comparisonTotal : prev.comparisonTotal
    }));
  }, []);

  const totalCost = colorfulPapers * colorfulPaperPrice;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">록 스타 돌의 정령! 확률 계산기</h1>
        <p className="text-gray-600">
          보유 자산과 색종이 구매 계획에 따른 이벤트 달성 확률을 정확히 계산합니다
        </p>
      </div>

      {/* 이벤트 정보 배너 */}
      <DismissibleBanner
        bannerId="origami-event-info"
        message="🎨 록 스타 돌의 정령! 이벤트 정보: 알파벳 색종이를 모아서 특별한 보상을 획득하세요! 몬테카를로 시뮬레이션으로 최적의 색종이 개수를 계산합니다."
        bgColor="bg-purple-50"
        borderColor="border-purple-200"
        textColor="text-purple-800"
        linkHref="https://maplestory.nexon.com/News/Event"
        linkText="이벤트 페이지 보기"
        showIcon={false}
      />

      <DismissibleBanner
        bannerId="origami-event-in-development"
        // 경고 메시지
        message="⚠️ 이 계산기는 아직 개발 중입니다. 일부 기능이 완전하지 않은 상태이니 사용에 유의해주세요."
        bgColor="bg-red-50"
        borderColor="border-red-200"
        textColor="text-red-800"
        linkHref=""
        linkText=""
        showIcon={false}
      />

      {/* AutoSlotManager */}
      <AutoSlotManager
        calculatorId="origami"
        maxSlots={3}
        getCurrentData={getCurrentData}
        loadData={loadData}
        onReset={resetAllData}
      />

      {/* 메인 입력 섹션 시작 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 색종이 입력 섹션 시작 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">색종이 설정</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                일반 색종이 개수: {normalPapers.toLocaleString()}개
              </label>
              <input
                type="range"
                min="500"
                max="10000"
                step="100"
                value={normalPapers}
                onChange={(e) => setNormalPapers(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>500개</span>
                <span>10,000개</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                알록달록 색종이 개수: {colorfulPapers}개
              </label>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={colorfulPapers}
                onChange={(e) => setColorfulPapers(Number(e.target.value))}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5개</span>
                <span>50개</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                알록달록 색종이 시세: {colorfulPaperPrice}억 메소
              </label>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={colorfulPaperPrice}
                onChange={(e) => setColorfulPaperPrice(Number(e.target.value))}
                className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.1억</span>
                <span>3.0억</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  현재 설정 시뮬레이션 횟수 (1,000 ~ 50,000회)
                </label>
                <input
                  type="number"
                  min="1000"
                  max="50000"
                  step="100"
                  value={currentSettingIterations}
                  onChange={(e) => setCurrentSettingIterations(Math.max(1000, Math.min(50000, parseInt(e.target.value) || 1000)))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">높을수록 정확하지만 계산 시간이 오래 걸립니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비교 설정 시뮬레이션 횟수 (100 ~ 5,000회)
                </label>
                <input
                  type="number"
                  min="100"
                  max="5000"
                  step="50"
                  value={comparisonIterations}
                  onChange={(e) => setComparisonIterations(Math.max(100, Math.min(5000, parseInt(e.target.value) || 600)))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">그래프의 다른 점들에 사용되는 계산 횟수</p>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>예상 비용:</strong> {totalCost.toLocaleString()}억 메소
              </p>
            </div>
          </div>
        </div>
        {/* 색종이 입력 섹션 끝 */}

        {/* 현재 보유 자산 섹션 시작 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">현재 보유 자산</h2>

          {/* 가루 섹션 */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-purple-700 mb-3">가루</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 w-12">일반:</label>
                <input
                  type="number"
                  min="0"
                  max="50000"
                  value={currentDust.normal}
                  onChange={(e) => setCurrentDust(prev => ({ ...prev, normal: Number(e.target.value) }))}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="0"
                />
                <span className="text-xs text-gray-500">개</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 w-12">상급:</label>
                <input
                  type="number"
                  min="0"
                  max="20000"
                  value={currentDust.premium}
                  onChange={(e) => setCurrentDust(prev => ({ ...prev, premium: Number(e.target.value) }))}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="0"
                />
                <span className="text-xs text-gray-500">개</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              제작비용: 상급 2000개, 중급 3000개, 하급 500개
            </p>
          </div>

          {/* 알파벳 섹션 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">알파벳</h4>
            <div className="space-y-3">
              {/* 상급 */}
              <div>
                <div className="text-xs text-red-600 mb-1">상급 (알록달록 전용)</div>
                <div className="grid grid-cols-4 gap-2">
                  {(['C', 'E', 'K', 'V'] as AlphabetType[]).map((alphabet) => (
                    <div key={alphabet} className="flex items-center gap-1">
                      <label className="text-xs font-medium text-gray-700 w-3">{alphabet}</label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={currentAlphabets[alphabet]}
                        onChange={(e) => handleAlphabetChange(alphabet, Number(e.target.value))}
                        className="flex-1 px-1 py-0.5 border border-gray-300 rounded text-xs w-12"
                      />
                      <span className="text-xs text-gray-400">/{TARGET_ALPHABETS[alphabet]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 중급 */}
              <div>
                <div className="text-xs text-orange-600 mb-1">중급 (일반 2.5%)</div>
                <div className="grid grid-cols-5 gap-2">
                  {(['A', 'O', 'P', 'S', 'T'] as AlphabetType[]).map((alphabet) => (
                    <div key={alphabet} className="flex items-center gap-1">
                      <label className="text-xs font-medium text-gray-700 w-3">{alphabet}</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={currentAlphabets[alphabet]}
                        onChange={(e) => handleAlphabetChange(alphabet, Number(e.target.value))}
                        className="flex-1 px-1 py-0.5 border border-gray-300 rounded text-xs w-12"
                      />
                      <span className="text-xs text-gray-400">/{TARGET_ALPHABETS[alphabet]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 하급 목표 */}
              <div>
                <div className="text-xs text-green-600 mb-1">하급 목표 (일반 97.5%)</div>
                <div className="grid grid-cols-3 gap-2">
                  {(['I', 'N', 'R'] as AlphabetType[]).map((alphabet) => (
                    <div key={alphabet} className="flex items-center gap-1">
                      <label className="text-xs font-medium text-gray-700 w-3">{alphabet}</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={currentAlphabets[alphabet]}
                        onChange={(e) => handleAlphabetChange(alphabet, Number(e.target.value))}
                        className="flex-1 px-1 py-0.5 border border-gray-300 rounded text-xs w-12"
                      />
                      <span className="text-xs text-gray-400">/{TARGET_ALPHABETS[alphabet]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 기타 하급 */}
              <div>
                <div className="text-xs text-green-600 mb-1">기타 하급 (조합용)</div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-700">기타 하급:</label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={otherLowAlphabets}
                    onChange={(e) => setOtherLowAlphabets(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded text-sm w-16"
                    placeholder="0"
                  />
                  <span className="text-xs text-gray-500">개</span>
                  <span className="text-xs text-gray-400">(B,D,F,G,H,J,L,M,Q,U,W,X,Y,Z)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>가루 획득:</strong> 조합 시 알파벳 등급에 따라 가루 획득 (상급 100개, 중급 150개, 하급 5개)
            </p>
          </div>
        </div>
        {/* 현재 보유 자산 섹션 끝 */}
      </div>
      {/* 메인 입력 섹션 끝 */}


      {/* 확률 분포 그래프 */}
      {mounted && (
        <ProbabilityDistributionChart
          normalPapers={normalPapers}
          colorfulPapers={colorfulPapers}
          currentSettingIterations={currentSettingIterations}
          comparisonIterations={comparisonIterations}
          onColorfulPaperClick={setColorfulPapers}
          onNormalPaperClick={setNormalPapers}
          onProgressUpdate={handleProgressUpdate}
          progressState={progressState}
        />
      )}
    </div>
  );
}