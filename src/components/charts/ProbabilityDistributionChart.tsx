'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { calculateAchievementProbability } from '@/utils/origamiCalculations';

interface ProgressState {
  isCalculating: boolean;
  currentProgress: number;
  comparisonProgress: number;
  currentTotal: number;
  comparisonTotal: number;
}

interface ProbabilityDistributionChartProps {
  normalPapers: number;
  colorfulPapers: number;
  currentSettingIterations: number;
  comparisonIterations: number;
  targetPercentiles?: number[];
  onColorfulPaperClick?: (count: number) => void;
  onNormalPaperClick?: (count: number) => void;
  onProgressUpdate?: (current: number, total: number, isCurrentSetting: boolean, comparisonProgress?: number, comparisonTotal?: number) => void;
  progressState?: ProgressState;
}

export default function ProbabilityDistributionChart({
  normalPapers,
  colorfulPapers,
  currentSettingIterations,
  comparisonIterations,
  targetPercentiles = [50, 80, 90, 95, 99],
  onColorfulPaperClick,
  onNormalPaperClick,
  onProgressUpdate,
  progressState
}: ProbabilityDistributionChartProps) {

  // 호버링 상태
  const [hoveredPoint, setHoveredPoint] = useState<{x: number, y: number, isColorful: boolean} | null>(null);

  // 계산 상태
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculatedData, setCalculatedData] = useState<{
    colorfulAnalysisData: Array<{ x: number; probability: number }>;
    normalAnalysisData: Array<{ x: number; probability: number }>;
    currentSettingResult: number;
  } | null>(null);

  // 비동기 계산 함수
  const calculateAsync = useCallback(async () => {
    if (isCalculating) return;

    setIsCalculating(true);
    onProgressUpdate?.(0, 100, true);

    try {
      // 1. 현재 설정 계산 (정확도 높음)
      onProgressUpdate?.(10, 100, true);
      const currentResult = calculateAchievementProbability({
        normalPapers,
        colorfulPapers,
        iterations: currentSettingIterations
      });
      onProgressUpdate?.(100, 100, true);

      // 잠시 대기 후 비교 데이터 계산 시작
      await new Promise(resolve => setTimeout(resolve, 100));

      // 2. 알록달록 색종이 변동 분석
      const colorfulData: Array<{ x: number; probability: number }> = [];
      const colorfulPoints = [];
      for (let colorful = 5; colorful <= 50; colorful += 2) {
        colorfulPoints.push(colorful);
      }

      for (let i = 0; i < colorfulPoints.length; i++) {
        const colorful = colorfulPoints[i];
        let probability: number;

        if (colorful === colorfulPapers) {
          probability = currentResult.achievementProbability;
        } else {
          const result = calculateAchievementProbability({
            normalPapers,
            colorfulPapers: colorful,
            iterations: comparisonIterations
          });
          probability = result.achievementProbability;
        }

        colorfulData.push({ x: colorful, probability });

        // 진행률 업데이트 (비교 계산 진행률)
        const colorfulProgress = ((i + 1) / colorfulPoints.length) * 50; // 50%까지
        onProgressUpdate?.(0, 100, true, colorfulProgress, 100);

        // 매 5번째마다 잠시 대기 (UI 업데이트를 위해)
        if (i % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      // 3. 일반 색종이 변동 분석
      const normalData: Array<{ x: number; probability: number }> = [];
      const normalPoints = [];
      for (let normal = 500; normal <= 10000; normal += 200) {
        normalPoints.push(normal);
      }

      for (let i = 0; i < normalPoints.length; i++) {
        const normal = normalPoints[i];
        let probability: number;

        if (normal === normalPapers) {
          probability = currentResult.achievementProbability;
        } else {
          const result = calculateAchievementProbability({
            normalPapers: normal,
            colorfulPapers,
            iterations: comparisonIterations
          });
          probability = result.achievementProbability;
        }

        normalData.push({ x: normal, probability });

        // 진행률 업데이트 (50% ~ 100%)
        const normalProgress = 50 + ((i + 1) / normalPoints.length) * 50;
        onProgressUpdate?.(100, 100, true, normalProgress, 100);

        // 매 5번째마다 잠시 대기
        if (i % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      setCalculatedData({
        colorfulAnalysisData: colorfulData,
        normalAnalysisData: normalData,
        currentSettingResult: currentResult.achievementProbability
      });

      // 계산 완료 시 진행률을 100%로 설정
      onProgressUpdate?.(100, 100, true, 100, 100);

    } finally {
      setIsCalculating(false);
    }
  }, [normalPapers, colorfulPapers, currentSettingIterations, comparisonIterations, isCalculating]);

  // 설정 변경 시 재계산
  useEffect(() => {
    calculateAsync();
  }, [normalPapers, colorfulPapers, currentSettingIterations, comparisonIterations]);

  // 계산된 데이터 사용 (기본값으로 빈 배열)
  const colorfulAnalysisData = calculatedData?.colorfulAnalysisData || [];
  const normalAnalysisData = calculatedData?.normalAnalysisData || [];
  const currentSettingResult = calculatedData?.currentSettingResult || 0;

  // 알록달록 색종이 백분위별 필요 개수 계산 (최적화: 동일 지점의 최고 % 하나만)
  const colorfulPercentileRequirements = useMemo(() => {
    if (!colorfulAnalysisData.length) return [];

    const requirements: Array<{ percentile: number; required: number; color: string }> = [];
    const requiredMap = new Map<number, number[]>(); // 필요개수 -> 달성한 백분위들

    // 각 백분위별 필요 개수 찾기
    for (const percentile of targetPercentiles) {
      let required = 50; // 최댓값으로 초기화

      for (const dataPoint of colorfulAnalysisData) {
        if (dataPoint.probability >= percentile) {
          required = dataPoint.x;
          break;
        }
      }

      if (!requiredMap.has(required)) {
        requiredMap.set(required, []);
      }
      requiredMap.get(required)!.push(percentile);
    }

    // 각 필요개수별로 최고 백분위만 표시
    for (const [required, percentiles] of Array.from(requiredMap.entries())) {
      const maxPercentile = Math.max(...percentiles);

      // 색상 지정
      let color = '';
      if (maxPercentile >= 95) color = 'rgb(34, 197, 94)'; // green-500
      else if (maxPercentile >= 90) color = 'rgb(59, 130, 246)'; // blue-500
      else if (maxPercentile >= 80) color = 'rgb(245, 158, 11)'; // amber-500
      else color = 'rgb(156, 163, 175)'; // gray-400

      requirements.push({ percentile: maxPercentile, required, color });
    }

    return requirements.sort((a, b) => a.required - b.required);
  }, [colorfulAnalysisData, targetPercentiles]);

  // 일반 색종이 백분위별 필요 개수 계산 (최적화: 동일 지점의 최고 % 하나만)
  const normalPercentileRequirements = useMemo(() => {
    const requirements: Array<{ percentile: number; required: number; color: string }> = [];
    const requiredMap = new Map<number, number[]>(); // 필요개수 -> 달성한 백분위들

    // 각 백분위별 필요 개수 찾기
    for (const percentile of targetPercentiles) {
      let required = 10000; // 최댓값으로 초기화

      for (const dataPoint of normalAnalysisData) {
        if (dataPoint.probability >= percentile) {
          required = dataPoint.x;
          break;
        }
      }

      if (!requiredMap.has(required)) {
        requiredMap.set(required, []);
      }
      requiredMap.get(required)!.push(percentile);
    }

    // 각 필요개수별로 최고 백분위만 표시
    for (const [required, percentiles] of Array.from(requiredMap.entries())) {
      const maxPercentile = Math.max(...percentiles);

      // 색상 지정
      let color = '';
      if (maxPercentile >= 95) color = 'rgb(34, 197, 94)'; // green-500
      else if (maxPercentile >= 90) color = 'rgb(59, 130, 246)'; // blue-500
      else if (maxPercentile >= 80) color = 'rgb(245, 158, 11)'; // amber-500
      else color = 'rgb(156, 163, 175)'; // gray-400

      requirements.push({ percentile: maxPercentile, required, color });
    }

    return requirements.sort((a, b) => a.required - b.required);
  }, [normalAnalysisData, targetPercentiles]);

  // 차트 SVG 계산
  const chartWidth = 500;
  const chartHeight = 280;
  const padding = { top: 20, right: 60, bottom: 40, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // 알록달록 색종이 스케일 및 경로
  const colorfulXScale = (x: number) => ((x - 5) / (50 - 5)) * innerWidth;
  const colorfulYScale = (probability: number) => innerHeight - (probability / 100) * innerHeight;

  const colorfulCurvePath = useMemo(() => {
    if (colorfulAnalysisData.length === 0) return '';

    let path = `M ${colorfulXScale(colorfulAnalysisData[0].x)} ${colorfulYScale(colorfulAnalysisData[0].probability)}`;

    for (let i = 1; i < colorfulAnalysisData.length; i++) {
      const current = colorfulAnalysisData[i];
      const prev = colorfulAnalysisData[i - 1];

      const controlX1 = colorfulXScale(prev.x) + (colorfulXScale(current.x) - colorfulXScale(prev.x)) / 3;
      const controlY1 = colorfulYScale(prev.probability);
      const controlX2 = colorfulXScale(current.x) - (colorfulXScale(current.x) - colorfulXScale(prev.x)) / 3;
      const controlY2 = colorfulYScale(current.probability);

      path += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${colorfulXScale(current.x)} ${colorfulYScale(current.probability)}`;
    }

    return path;
  }, [colorfulAnalysisData]);

  // 일반 색종이 스케일 및 경로
  const normalXScale = (x: number) => ((x - 500) / (10000 - 500)) * innerWidth;
  const normalYScale = (probability: number) => innerHeight - (probability / 100) * innerHeight;

  const normalCurvePath = useMemo(() => {
    if (normalAnalysisData.length === 0) return '';

    let path = `M ${normalXScale(normalAnalysisData[0].x)} ${normalYScale(normalAnalysisData[0].probability)}`;

    for (let i = 1; i < normalAnalysisData.length; i++) {
      const current = normalAnalysisData[i];
      const prev = normalAnalysisData[i - 1];

      const controlX1 = normalXScale(prev.x) + (normalXScale(current.x) - normalXScale(prev.x)) / 3;
      const controlY1 = normalYScale(prev.probability);
      const controlX2 = normalXScale(current.x) - (normalXScale(current.x) - normalXScale(prev.x)) / 3;
      const controlY2 = normalYScale(current.probability);

      path += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${normalXScale(current.x)} ${normalYScale(current.probability)}`;
    }

    return path;
  }, [normalAnalysisData]);

  // 차트 생성 도우미 함수
  const renderChart = (
    data: Array<{ x: number; probability: number }>,
    xScale: (x: number) => number,
    yScale: (probability: number) => number,
    curvePath: string,
    currentValue: number,
    percentileReqs: Array<{ percentile: number; required: number; color: string }>,
    isColorful: boolean
  ) => (
    <div className="relative">
      <svg width={chartWidth} height={chartHeight} className="border border-gray-300 dark:border-gray-600 rounded">
      {/* 배경 격자 */}
      <defs>
        <pattern id={`grid-${isColorful ? 'colorful' : 'normal'}`} width="40" height="30" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 30" fill="none" className="stroke-gray-100 dark:stroke-gray-800" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width={innerWidth} height={innerHeight} x={padding.left} y={padding.top} fill={`url(#grid-${isColorful ? 'colorful' : 'normal'})`} />

      {/* Y축 격자선 및 라벨 */}
      {[0, 25, 50, 75, 100].map(percent => (
        <g key={percent}>
          <line
            x1={padding.left}
            y1={padding.top + yScale(percent)}
            x2={padding.left + innerWidth}
            y2={padding.top + yScale(percent)}
            className="stroke-gray-200 dark:stroke-gray-700"
            strokeWidth="1"
          />
          <text
            x={padding.left - 10}
            y={padding.top + yScale(percent) + 4}
            textAnchor="end"
            className="text-xs fill-gray-700"
          >
            {percent}%
          </text>
        </g>
      ))}

      {/* X축 격자선 및 라벨 */}
      {(() => {
        const step = isColorful ? 10 : 2000;
        const start = isColorful ? 5 : 500;
        const end = isColorful ? 50 : 10000;
        const ticks = [];

        for (let x = start; x <= end; x += step) {
          ticks.push(x);
        }

        return ticks.map(x => (
          <g key={x}>
            <line
              x1={padding.left + xScale(x)}
              y1={padding.top}
              x2={padding.left + xScale(x)}
              y2={padding.top + innerHeight}
              className="stroke-gray-200 dark:stroke-gray-700"
              strokeWidth="1"
            />
            <text
              x={padding.left + xScale(x)}
              y={padding.top + innerHeight + 20}
              textAnchor="middle"
              className="text-xs fill-gray-700"
            >
              {isColorful ? x : `${(x / 1000).toFixed(1)}k`}
            </text>
          </g>
        ));
      })()}

      {/* 백분위 수평선 */}
      {targetPercentiles.map(percentile => (
        <line
          key={percentile}
          x1={padding.left}
          y1={padding.top + yScale(percentile)}
          x2={padding.left + innerWidth}
          y2={padding.top + yScale(percentile)}
          className="stroke-red-600 dark:stroke-red-700"
          strokeWidth="1"
          strokeDasharray="3,3"
          opacity="0.7"
        />
      ))}

      {/* 주 곡선 */}
      <path
        d={curvePath}
        fill="none"
        className="stroke-blue-500 dark:stroke-blue-600"
        strokeWidth="3"
        transform={`translate(${padding.left}, ${padding.top})`}
      />

      {/* 호버링용 invisible 포인트들 */}
      {data.map(point => (
        <circle
          key={point.x}
          cx={padding.left + xScale(point.x)}
          cy={padding.top + yScale(point.probability)}
          r="8"
          fill="transparent"
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setHoveredPoint({x: point.x, y: point.probability, isColorful})}
          onMouseLeave={() => setHoveredPoint(null)}
        />
      ))}

      {/* 현재 설정 포인트 */}
      {(() => {
        const currentDataPoint = data.find(d => d.x === currentValue);

        if (currentDataPoint) {
          return (
            <circle
              cx={padding.left + xScale(currentDataPoint.x)}
              cy={padding.top + yScale(currentDataPoint.probability)}
              r="6"
              fill="#ef4444"
              stroke="white"
              strokeWidth="2"
            />
          );
        }
        return null;
      })()}

      {/* 백분위 포인트 */}
      {percentileReqs.map(({ percentile, required, color }) => (
        <g key={percentile}>
          <circle
            cx={padding.left + xScale(required)}
            cy={padding.top + yScale(percentile)}
            r="6"
            fill={color}
            stroke="white"
            strokeWidth="2"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              if (isColorful && onColorfulPaperClick) {
                onColorfulPaperClick(required);
              } else if (!isColorful && onNormalPaperClick) {
                onNormalPaperClick(required);
              }
            }}
          />
          <text
            x={padding.left + xScale(required)}
            y={padding.top + yScale(percentile) - 12}
            textAnchor="middle"
            className="text-xs font-medium fill-gray-700 pointer-events-none"
          >
            {percentile}%
          </text>
        </g>
      ))}

      {/* 축 라벨 */}
      <text
        x={padding.left + innerWidth / 2}
        y={chartHeight - 5}
        textAnchor="middle"
        className="text-sm fill-gray-700 font-medium"
      >
        {isColorful ? '알록달록 색종이 개수' : '일반 색종이 개수'}
      </text>
      <text
        x={15}
        y={padding.top + innerHeight / 2}
        textAnchor="middle"
        transform={`rotate(-90, 15, ${padding.top + innerHeight / 2})`}
        className="text-sm fill-gray-700 font-medium"
      >
        달성 확률 (%)
      </text>

      {/* 호버 툴팁 */}
      {hoveredPoint && (
        <div
          className="absolute bg-black bg-opacity-75 text-white text-xs rounded px-2 py-1 pointer-events-none z-10"
          style={{
            left: padding.left + (hoveredPoint.isColorful ?
              ((hoveredPoint.x - 5) / 45) * (chartWidth - padding.left - padding.right) :
              ((hoveredPoint.x - 500) / 9500) * (chartWidth - padding.left - padding.right)
            ),
            top: padding.top + ((100 - hoveredPoint.y) / 100) * (chartHeight - padding.top - padding.bottom) - 30
          }}
        >
          {hoveredPoint.isColorful ? '알록달록' : '일반'} {hoveredPoint.x.toLocaleString()}개: {hoveredPoint.y.toFixed(1)}%
        </div>
      )}
      </svg>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold fill-gray-700 mb-4">
          확률 분포 분석
        </h3>

        {/* 계산 진행률 표시 */}
        {progressState?.isCalculating &&
         !(progressState.currentProgress >= progressState.currentTotal &&
           progressState.comparisonProgress >= progressState.comparisonTotal) && (
          <div className="mb-4 space-y-3">
            {/* 현재 설정 진행률 바 */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium fill-gray-700">현재 설정 계산</span>
                <span className="text-sm text-gray-500">
                  {Math.round((progressState.currentProgress / progressState.currentTotal) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${Math.min(100, (progressState.currentProgress / progressState.currentTotal) * 100)}%`
                  }}
                />
              </div>
            </div>

            {/* 비교 설정 진행률 바 */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium fill-gray-700">비교 설정 계산</span>
                <span className="text-sm text-gray-500">
                  {Math.round((progressState.comparisonProgress / progressState.comparisonTotal) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-green-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${Math.min(100, (progressState.comparisonProgress / progressState.comparisonTotal) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* 알록달록 색종이 분석 */}
          <div>
            <div className="mb-3">
              <h4 className="text-base font-medium fill-gray-700 mb-2">알록달록 색종이 변동 분석</h4>
              <p className="text-sm text-blue-800 bg-blue-50 p-2 rounded">
                일반 색종이 {normalPapers.toLocaleString()}개 고정
              </p>
            </div>
            <div className="overflow-x-auto">
              {renderChart(
                colorfulAnalysisData,
                colorfulXScale,
                colorfulYScale,
                colorfulCurvePath,
                colorfulPapers,
                colorfulPercentileRequirements,
                true
              )}
            </div>

            {/* 알록달록 색종이 현재 설정 분석 */}
            {(() => {
              const currentDataPoint = colorfulAnalysisData.find(d => d.x === colorfulPapers);
              if (currentDataPoint) {
                return (
                  <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
                    <strong>현재 설정:</strong> 알록달록 {colorfulPapers}개로{' '}
                    <strong>{currentDataPoint.probability.toFixed(1)}%</strong> 달성 확률
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* 일반 색종이 분석 */}
          <div>
            <div className="mb-3">
              <h4 className="text-base font-medium fill-gray-700 mb-2">일반 색종이 변동 분석</h4>
              <p className="text-sm text-blue-800 bg-blue-50 p-2 rounded">
                알록달록 색종이 {colorfulPapers}개 고정
              </p>
            </div>
            <div className="overflow-x-auto">
              {renderChart(
                normalAnalysisData,
                normalXScale,
                normalYScale,
                normalCurvePath,
                normalPapers,
                normalPercentileRequirements,
                false
              )}
            </div>

            {/* 일반 색종이 현재 설정 분석 */}
            {(() => {
              const currentDataPoint = normalAnalysisData.find(d => d.x === normalPapers);
              if (currentDataPoint) {
                return (
                  <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
                    <strong>현재 설정:</strong> 일반 {normalPapers.toLocaleString()}개로{' '}
                    <strong>{currentDataPoint.probability.toFixed(1)}%</strong> 달성 확률
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>

      {/* 범례 및 백분위 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 범례 */}
        <div>
          <h4 className="text-sm font-medium fill-gray-700 mb-3">범례</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-500"></div>
              <span className="text-sm text-gray-600">달성 확률 곡선</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full border border-white"></div>
              <span className="text-sm text-gray-600">현재 설정 포인트</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 border-t border-red-600 border-dashed"></div>
              <span className="text-sm text-gray-600">목표 달성률 라인</span>
            </div>
          </div>
        </div>

        {/* 백분위 분석 요약 */}
        <div>
          <h4 className="text-sm font-medium fill-gray-700 mb-3">백분위 요약 (90% 달성률 기준)</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">알록달록 색종이:</span>
              <span className="font-medium">
                {colorfulPercentileRequirements.find(r => r.percentile === 90)?.required || '-'}개 필요
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">일반 색종이:</span>
              <span className="font-medium">
                {normalPercentileRequirements.find(r => r.percentile === 90)?.required.toLocaleString() || '-'}개 필요
              </span>
            </div>
          </div>

          <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
            상세한 백분위 데이터는 각 차트의 컬러 포인트를 참조하세요.
          </div>
        </div>
      </div>
    </div>
  );
}