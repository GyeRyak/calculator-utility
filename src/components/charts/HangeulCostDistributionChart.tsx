'use client';

import { useState, useMemo } from 'react';
import type { CalculationResult } from '@/utils/hangeulTitleCalculations';

interface HangeulCostDistributionChartProps {
  result: CalculationResult;
}

interface TooltipData {
  cost: number;
  probability: number;
  cumulative: number;
  percentile: number;
  x: number;
  y: number;
}

// 확률을 x할 x푼 x리 x모 형식으로 변환
function formatKoreanProbability(probability: number): string {
  const percent = probability * 100;

  const hal = Math.floor(percent / 10); // 할 (10%)
  const pun = Math.floor((percent % 10)); // 푼 (1%)
  const ri = Math.floor((percent * 10) % 10); // 리 (0.1%)
  const mo = Math.floor((percent * 100) % 10); // 모 (0.01%)

  const parts: string[] = [];

  if (hal > 0) parts.push(`${hal}할`);
  if (pun > 0) parts.push(`${pun}푼`);
  if (ri > 0) parts.push(`${ri}리`);
  if (mo > 0) parts.push(`${mo}모`);

  return parts.length > 0 ? parts.join(' ') : '0';
}

export default function HangeulCostDistributionChart({ result }: HangeulCostDistributionChartProps) {
  const [hoveredBar, setHoveredBar] = useState<TooltipData | null>(null);

  // 차트 데이터 준비
  const chartData = useMemo(() => {
    const { costDistribution } = result;

    // 누적 확률 99.9%까지만 표시
    const displayData = costDistribution.filter(d => d.cumulative <= 0.999);

    // 최대 확률 찾기 (y축 스케일용)
    const maxProb = Math.max(...displayData.map(d => d.probability));

    return {
      data: displayData,
      maxProb
    };
  }, [result]);

  const { data, maxProb } = chartData;

  if (data.length === 0) {
    return null;
  }

  // 차트 설정 (반응형)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const width = isMobile ? window.innerWidth - 32 : 800; // 모바일: 양쪽 여백 16px씩
  const height = isMobile ? 300 : 400;
  const padding = {
    top: 20,
    right: isMobile ? 10 : 20,
    bottom: 60,
    left: isMobile ? 50 : 80
  };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // 막대 너비 계산
  const barWidth = Math.max(2, chartWidth / data.length - 2);

  // 백분위 표시 위치 계산
  const findBarIndex = (cost: number) => {
    return data.findIndex(d => d.cost >= cost);
  };

  const percentile50Index = findBarIndex(result.percentile50Cost);
  const percentile90Index = findBarIndex(result.percentile90Cost);
  const percentile99Index = findBarIndex(result.percentile99Cost);

  return (
    <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        비용 분포 (한글의 기운)
      </h3>

      {/* 차트 */}
      <div className="relative overflow-x-auto">
        <svg
          width={width}
          height={height}
          className="mx-auto max-w-full"
          onMouseLeave={() => setHoveredBar(null)}
        >
          {/* 배경 그리드 */}
          <g>
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
              const y = padding.top + chartHeight * (1 - ratio);
              const prob = ratio * maxProb;
              return (
                <g key={ratio}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + chartWidth}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth={1}
                  />
                  <text
                    x={padding.left - 10}
                    y={y}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    className="text-xs fill-gray-500"
                  >
                    {formatKoreanProbability(prob)}
                  </text>
                </g>
              );
            })}
          </g>

          {/* 막대 그래프 */}
          <g>
            {data.map((d, i) => {
              const x = padding.left + (i * (chartWidth / data.length));
              const barHeight = (d.probability / maxProb) * chartHeight;
              const y = padding.top + chartHeight - barHeight;

              // 백분위 여부 확인
              const isPercentile = i === percentile50Index || i === percentile90Index || i === percentile99Index;

              // 백분위 색상
              let fill = '#3b82f6'; // 기본 파란색
              if (i === percentile50Index) fill = '#10b981'; // 50% - 녹색
              else if (i === percentile90Index) fill = '#f59e0b'; // 90% - 주황
              else if (i === percentile99Index) fill = '#ef4444'; // 99% - 빨강

              // 백분위 지점은 더 넓고 진하게
              const actualBarWidth = isPercentile ? Math.max(barWidth, 6) : barWidth;
              const barX = isPercentile ? x - (actualBarWidth - barWidth) / 2 : x;

              return (
                <rect
                  key={i}
                  x={barX}
                  y={y}
                  width={actualBarWidth}
                  height={barHeight}
                  fill={fill}
                  opacity={hoveredBar?.cost === d.cost ? 1 : (isPercentile ? 0.9 : 0.7)}
                  className="transition-opacity pointer-events-none"
                />
              );
            })}
          </g>

          {/* 투명 호버 영역 (x축 전체) */}
          <g>
            {data.map((d, i) => {
              const x = padding.left + (i * (chartWidth / data.length));
              const barHeight = (d.probability / maxProb) * chartHeight;
              const barY = padding.top + chartHeight - barHeight;

              return (
                <rect
                  key={`hover-${i}`}
                  x={x}
                  y={padding.top}
                  width={barWidth}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={(e) => {
                    const svgRect = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
                    const barScreenX = svgRect.left + x + barWidth / 2;
                    const barScreenY = svgRect.top + barY;

                    setHoveredBar({
                      cost: d.cost,
                      probability: d.probability,
                      cumulative: d.cumulative,
                      percentile: (1 - d.cumulative) * 100,
                      x: barScreenX,
                      y: barScreenY
                    });
                  }}
                />
              );
            })}
          </g>

          {/* X축 레이블 (비용) */}
          <g>
            <line
              x1={padding.left}
              y1={padding.top + chartHeight}
              x2={padding.left + chartWidth}
              y2={padding.top + chartHeight}
              stroke="#000"
              strokeWidth={1}
            />

            {/* X축 값들 (일정 간격으로) */}
            {(() => {
              const labelIndices: number[] = [];
              const maxLabels = 8; // 최대 레이블 개수
              const step = Math.max(1, Math.floor(data.length / maxLabels));

              for (let i = 0; i < data.length; i += step) {
                labelIndices.push(i);
              }

              // 마지막 값 추가 (겹침 방지)
              const lastIndex = data.length - 1;
              const secondLastInList = labelIndices[labelIndices.length - 1];

              // 마지막 레이블이 끝에서 너무 가까우면 제거하고 마지막만 표시
              if (secondLastInList !== lastIndex) {
                // 끝에서 10% 이내에 있으면 마지막 이전 레이블 제거
                if (lastIndex - secondLastInList < data.length * 0.1) {
                  labelIndices.pop();
                }
                labelIndices.push(lastIndex);
              }

              return labelIndices.map(i => {
                const x = padding.left + (i * (chartWidth / data.length)) + barWidth / 2;
                return (
                  <g key={`x-label-${i}`}>
                    <line
                      x1={x}
                      y1={padding.top + chartHeight}
                      x2={x}
                      y2={padding.top + chartHeight + 5}
                      stroke="#666"
                      strokeWidth={1}
                    />
                    <text
                      x={x}
                      y={padding.top + chartHeight + 18}
                      textAnchor="middle"
                      className="text-xs fill-gray-600"
                    >
                      {data[i].cost.toLocaleString()}
                    </text>
                  </g>
                );
              });
            })()}

            {/* 백분위 지점 표시 */}
            {[
              { index: percentile50Index, label: '5할', color: '#10b981' },
              { index: percentile90Index, label: '9할', color: '#f59e0b' },
              { index: percentile99Index, label: '9할 9푼', color: '#ef4444' }
            ].map(({ index, label, color }) => {
              if (index < 0 || index >= data.length) return null;
              const x = padding.left + (index * (chartWidth / data.length)) + barWidth / 2;
              return (
                <g key={`percentile-${label}`}>
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + chartHeight}
                    stroke={color}
                    strokeWidth={1}
                    strokeDasharray="4 2"
                    opacity={0.5}
                  />
                  <rect
                    x={x - 25}
                    y={padding.top - 15}
                    width={50}
                    height={14}
                    fill={color}
                    rx={3}
                  />
                  <text
                    x={x}
                    y={padding.top - 5}
                    textAnchor="middle"
                    className="text-xs fill-white font-semibold"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            <text
              x={padding.left + chartWidth / 2}
              y={padding.top + chartHeight + 50}
              textAnchor="middle"
              className="text-sm fill-gray-700 font-medium"
            >
              한글의 기운
            </text>
          </g>

          {/* Y축 레이블 */}
          <g>
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={padding.top + chartHeight}
              stroke="#000"
              strokeWidth={1}
            />
            <text
              x={15}
              y={padding.top + chartHeight / 2}
              textAnchor="middle"
              className="text-sm fill-gray-700 font-medium"
              transform={`rotate(-90 15 ${padding.top + chartHeight / 2})`}
            >
              도달 확률
            </text>
          </g>
        </svg>

        {/* 툴팁 */}
        {hoveredBar && (
          <div
            className="fixed z-50 bg-gray-900 text-white text-sm px-3 py-2 rounded shadow-lg pointer-events-none"
            style={{
              left: hoveredBar.x,
              top: hoveredBar.y - 10,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className="font-semibold">한글의 기운: {hoveredBar.cost.toLocaleString()}</div>
            <div>도달 확률: {formatKoreanProbability(hoveredBar.probability)}</div>
            <div>누적 확률: {formatKoreanProbability(hoveredBar.cumulative)}</div>
            <div className="text-yellow-300">
              상위 {formatKoreanProbability(hoveredBar.percentile / 100)}
            </div>
          </div>
        )}
      </div>

      {/* 범례 */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-gray-700">일반 구간</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-gray-700">5할 지점 ({result.percentile50Cost.toLocaleString()})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-500 rounded"></div>
          <span className="text-gray-700">9할 지점 ({result.percentile90Cost.toLocaleString()})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-gray-700">9할 9푼 지점 ({result.percentile99Cost.toLocaleString()})</span>
        </div>
      </div>
    </div>
  );
}
