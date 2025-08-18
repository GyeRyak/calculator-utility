'use client'

import { useState, useMemo, useCallback } from 'react'
import { BarChart3, RefreshCw, TrendingUp, Calendar, User, Package, Archive, ChevronDown, ChevronRight } from 'lucide-react'
import type { BossChaseResult, ItemExpectation } from '@/utils/bossChaseCalculations'
import { sortItemExpectationsByValue, groupItemExpectationsByCategory } from '@/utils/bossChaseCalculations'
import { CHASE_ITEMS, getRingBoxProbabilities, RING_BOX_PROBABILITIES, PITCHED_BOX_DEFAULT_PROBABILITIES, getChaseItemById } from '@/data/chaseItems'
import type { RingPrices } from '@/utils/defaults/bossChaseDefaults'
import type { PitchedBoxProbabilities } from '@/data/chaseItems'

interface ResultsDisplayProps {
  result: BossChaseResult | null
  simulationResult: BossChaseResult | null
  isCalculating: boolean
  onRecalculate: () => void
  ringPrices: RingPrices
  grindstonePrice: number
  pitchedBoxProbabilities?: PitchedBoxProbabilities
}

export default function ResultsDisplay({
  result,
  simulationResult,
  isCalculating,
  onRecalculate,
  ringPrices,
  grindstonePrice,
  pitchedBoxProbabilities
}: ResultsDisplayProps) {
  const [viewMode, setViewMode] = useState<'overview' | 'characters' | 'items' | 'boxes'>('overview')
  const [sortBy, setSortBy] = useState<'value' | 'category' | 'character'>('value')
  const [expandedCharacters, setExpandedCharacters] = useState<Set<number>>(new Set([0])) // 첫 번째 캐릭터는 기본으로 펼쳐짐
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set()) // 아이템들은 기본적으로 모두 접어둠

  // 메소 포맷팅
  const formatMeso = (value: number): string => {
    if (value >= 100_000_000) {
      return `${(value / 100_000_000).toFixed(1)}억`
    } else if (value >= 10_000) {
      return `${(value / 10_000).toFixed(0)}만`
    }
    return value.toLocaleString()
  }

  // 카테고리 한국어 이름
  const getCategoryDisplayName = (category: string): string => {
    const categoryNames: { [key: string]: string } = {
      pitched_boss: '칠흑',
      dawn_boss: '여명',
      radiant_boss: '광휘',
      ring: '반지',
      box: '상자',
      grindstone: '연마석',
      exceptional: '익셉셔널',
      misc_chase: '기타'
    }
    return categoryNames[category] || category
  }

  // 카테고리별 색상 스타일
  const getCategoryStyle = (category: string): string => {
    const categoryStyles: { [key: string]: string } = {
      pitched_boss: 'bg-red-100 text-red-800',
      dawn_boss: 'bg-blue-100 text-blue-800',
      radiant_boss: 'bg-yellow-100 text-yellow-800',
      ring: 'bg-purple-100 text-purple-800',
      box: 'bg-indigo-100 text-indigo-800',
      grindstone: 'bg-green-100 text-green-800',
      exceptional: 'bg-orange-100 text-orange-800',
      misc_chase: 'bg-gray-100 text-gray-800'
    }
    return categoryStyles[category] || 'bg-gray-100 text-gray-800'
  }

  // 다중 카테고리 태그 렌더링
  const renderCategoryTags = (categories: string[]) => (
    <div className="flex flex-wrap gap-1">
      {categories.map((category, index) => (
        <span
          key={index}
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            getCategoryStyle(category)
          }`}
        >
          {getCategoryDisplayName(category)}
        </span>
      ))}
    </div>
  )

  // 상세 드롭률 정보 포맷팅
  const formatDetailedDropRate = (item: ItemExpectation): string => {
    const basePercent = (item.baseDropRate * 100).toFixed(2)
    const actualPercent = (item.actualDropRate * 100).toFixed(2)
    
    // 드롭률 증가가 있는 경우
    if (item.actualDropRate !== item.baseDropRate) {
      const multiplier = (item.actualDropRate / item.baseDropRate).toFixed(2)
      return `드롭률 ${basePercent}% x ${multiplier} = ${actualPercent}%`
    }
    
    // 드롭률 증가가 없는 경우
    return `드롭률 ${actualPercent}%`
  }

  // 상세 가격 정보 포맷팅
  const formatDetailedPrice = (item: ItemExpectation): string => {
    const totalPrice = formatMeso(item.itemPrice)
    
    // 반지 상자나 칠흑 상자인 경우 기댓값으로 표시
    if ((item.categories.includes('ring') && item.categories.includes('box')) || (item.categories.includes('pitched_boss') && item.categories.includes('box'))) {
      if (item.partySize === 1) {
        return `상자 기댓값: ${totalPrice}`
      }
      const distributionPercent = ((1 / item.partySize) * 100).toFixed(0)
      const myShare = formatMeso(item.itemPrice / item.partySize)
      return `기댓값 ${myShare} (${totalPrice}의 ${item.partySize}인격 분배금 ${distributionPercent}%)`
    }
    
    // 일반 아이템인 경우
    if (item.partySize === 1) {
      return `아이템 가격: ${totalPrice}`
    }
    
    // 파티 플레이인 경우 분배 정보 표시
    const distributionPercent = ((1 / item.partySize) * 100).toFixed(0)
    const myShare = formatMeso(item.itemPrice / item.partySize)
    return `가격 ${myShare} (${totalPrice}의 ${item.partySize}인격 분배금 ${distributionPercent}%)`
  }

  // 아이템별로 그룹화하는 함수
  const groupItemsByName = (items: (ItemExpectation & { characterName: string })[]): { [itemName: string]: (ItemExpectation & { characterName: string })[] } => {
    return items.reduce((groups, item) => {
      if (!groups[item.itemName]) {
        groups[item.itemName] = []
      }
      groups[item.itemName].push(item)
      return groups
    }, {} as { [itemName: string]: (ItemExpectation & { characterName: string })[] })
  }

  // 그룹화된 아이템의 총 기댓값 계산
  const calculateGroupTotalValue = (items: (ItemExpectation & { characterName: string })[]): number => {
    return items.reduce((sum, item) => sum + item.expectedValue, 0)
  }

  // 그룹화된 아이템의 총 예상 개수 계산
  const calculateGroupTotalCount = (items: (ItemExpectation & { characterName: string })[]): number => {
    return items.reduce((sum, item) => sum + item.expectedCount, 0)
  }

  // 반지 상자 기댓값 계산 (useCallback으로 메모이제이션)
  const calculateRingBoxExpectedValue = useCallback((ringBoxId: string): number => {
    const probabilities = getRingBoxProbabilities(ringBoxId)
    return (
      probabilities.restraint_lv3 * ringPrices.restraint_lv3 +
      probabilities.restraint_lv4 * ringPrices.restraint_lv4 +
      probabilities.continuous_lv3 * ringPrices.continuous_lv3 +
      probabilities.continuous_lv4 * ringPrices.continuous_lv4 +
      probabilities.grindstone * grindstonePrice
    )
  }, [ringPrices, grindstonePrice])

  // 유효 아이템 확률 계산 (모든 반지 + 연마석)
  const calculateEffectiveProbability = (ringBoxId: string): number => {
    const probabilities = getRingBoxProbabilities(ringBoxId)
    return (
      probabilities.restraint_lv3 +
      probabilities.restraint_lv4 +
      probabilities.continuous_lv3 +
      probabilities.continuous_lv4 +
      probabilities.grindstone
    )
  }

  // 칠흑 상자 기댓값 계산 (useCallback으로 메모이제이션)
  const calculatePitchedBoxExpectedValue = useCallback((): number => {
    const probabilities = pitchedBoxProbabilities || PITCHED_BOX_DEFAULT_PROBABILITIES
    
    // 칠흑 아이템들의 기본 가격 (chaseItems.ts에서 가져오기)
    const pitchedItemIds = ['berserked', 'magic_eyepatch', 'dreamy_belt', 'cursed_spellbook', 'endless_terror', 'commanding_force_earring', 'source_of_suffering']
    const pitchedItems = pitchedItemIds.map(itemId => {
      const item = getChaseItemById(itemId)
      return {
        id: itemId,
        price: item?.defaultPrice || 0
      }
    })
    
    // 전체 확률 합 계산
    let totalProbability = 0
    pitchedItems.forEach(item => {
      const prob = probabilities[item.id as keyof PitchedBoxProbabilities] || 0
      totalProbability += prob
    })
    
    // 확률 정규화 (합이 100%가 되도록)
    const normalizationFactor = totalProbability > 0 ? 1 / totalProbability : 0
    
    let expectedValue = 0
    pitchedItems.forEach(item => {
      const prob = probabilities[item.id as keyof PitchedBoxProbabilities] || 0
      const normalizedProb = prob * normalizationFactor
      expectedValue += normalizedProb * item.price
    })
    
    return expectedValue
  }, [pitchedBoxProbabilities])

  // 모든 반지 상자 데이터 (메모이제이션)
  const allRingBoxes = useMemo(() => {
    const ringBoxItems = CHASE_ITEMS.filter(item => item.categories.includes('ring') && item.categories.includes('box'))
    return ringBoxItems.map(item => {
      const probabilities = getRingBoxProbabilities(item.id)
      const expectedValue = calculateRingBoxExpectedValue(item.id)
      const effectiveProbability = calculateEffectiveProbability(item.id)
      
      return {
        id: item.id,
        name: item.name,
        probabilities,
        expectedValue,
        effectiveProbability
      }
    })
  }, [calculateRingBoxExpectedValue])

  // 칠흑 상자 데이터 (메모이제이션)
  const pitchedBoxData = useMemo(() => {
    const probabilities = pitchedBoxProbabilities || PITCHED_BOX_DEFAULT_PROBABILITIES
    const expectedValue = calculatePitchedBoxExpectedValue()
    
    return {
      id: 'pitched_boss_box',
      name: '혼돈의 칠흑 장신구 상자',
      probabilities,
      expectedValue
    }
  }, [pitchedBoxProbabilities, calculatePitchedBoxExpectedValue])

  // 모든 아이템 기댓값을 하나의 배열로 합치기 (메모이제이션)
  const allItemExpectations = useMemo(() => {
    if (!result?.characterResults) return []
    
    return result.characterResults.flatMap(char => 
      char.itemExpectations.map(item => ({
        ...item,
        characterName: char.characterName
      }))
    )
  }, [result?.characterResults])

  // 스켈레톤 컴포넌트
  const SkeletonCard = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  )

  const SkeletonSummaryCard = () => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-pulse">
      <div className="flex items-center">
        <div className="w-5 h-5 bg-blue-200 rounded mr-2"></div>
        <div>
          <div className="h-3 bg-blue-200 rounded w-24 mb-2"></div>
          <div className="h-5 bg-blue-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  )

  // 로딩 상태 - 스켈레톤 UI 표시
  if (isCalculating) {
    return (
      <div className="space-y-6">
        {/* 헤더 스켈레톤 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>

        {/* 요약 카드 스켈레톤 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonSummaryCard />
          <SkeletonSummaryCard />
          <SkeletonSummaryCard />
          <SkeletonSummaryCard />
        </div>

        {/* 탭 네비게이션 스켈레톤 */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-16"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-18"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
          </div>
        </div>

        {/* 컨텐츠 스켈레톤 */}
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  // 캐릭터 펼치기/접기 토글
  const toggleCharacterExpanded = (index: number) => {
    const newExpanded = new Set(expandedCharacters)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedCharacters(newExpanded)
  }

  // 아이템 폼치기/접기 토글
  const toggleItemExpanded = (itemName: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName)
    } else {
      newExpanded.add(itemName)
    }
    setExpandedItems(newExpanded)
  }

  // 결과 없음
  if (!result) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">
          계산 결과가 없습니다
        </h4>
        <p className="text-gray-600 mb-4">
          캐릭터를 추가하고 보스를 설정한 후 결과 탭에서 확인하세요.
        </p>
        <button
          onClick={onRecalculate}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          다시 계산
        </button>
      </div>
    )
  }

  // 메인 렌더링
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            계산 결과
          </h3>
          <p className="text-sm text-gray-600">
            {result && result.characterResults.length}개 캐릭터의 물욕템 기댓값
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onRecalculate}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 계산
          </button>
        </div>
      </div>

      {/* 전체 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-blue-900">주간 보스 기댓값</p>
              <p className="text-lg font-bold text-blue-600">
                {result && formatMeso(result.totalWeeklyExpectation)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-purple-900">월간 보스 기댓값</p>
              <p className="text-lg font-bold text-purple-600">
                {result && formatMeso(result.totalMonthlyExpectation)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Package className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <p 
                className="text-sm font-medium text-green-900 cursor-help" 
                title="주간 보스 기댓값 × 4 + 월간 보스 기댓값"
              >
                4주 기댓값
              </p>
              <p className="text-lg font-bold text-green-600">
                {result && formatMeso(result.totalWeeklyExpectation * 4 + result.totalMonthlyExpectation)}
              </p>
            </div>
          </div>
        </div>

        {/* 드롭률 +20% 시뮬레이션 */}
        {simulationResult && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-orange-600 mr-2" />
              <div>
                <p 
                  className="text-sm font-medium text-orange-900 cursor-help" 
                  title="드롭률 +20% 적용 시 4주 기댓값"
                >
                  드롭률 +20%
                </p>
                <p className="text-lg font-bold text-orange-600">
                  {formatMeso(simulationResult.totalWeeklyExpectation * 4 + simulationResult.totalMonthlyExpectation)}
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  +{result && formatMeso((simulationResult.totalWeeklyExpectation * 4 + simulationResult.totalMonthlyExpectation) - (result.totalWeeklyExpectation * 4 + result.totalMonthlyExpectation))}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 보기 모드 선택 */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {[
            { id: 'overview', name: '개요', icon: BarChart3 },
            { id: 'characters', name: '캐릭터별', icon: User },
            { id: 'items', name: '아이템별', icon: Package },
            { id: 'boxes', name: '상자', icon: Archive }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                viewMode === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 inline mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* 개요 */}
      {viewMode === 'overview' && (
        <div className="space-y-4">
          {result && result.characterResults.map((character, index) => {
            const simulationCharacter = simulationResult?.characterResults[index]
            
            return (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-medium text-gray-900">
                    {character.characterName}
                  </h4>
                  <div className="text-right">
                    <p 
                      className="text-sm text-gray-600 cursor-help" 
                      title="주간 보스 기댓값 × 4 + 월간 보스 기댓값"
                    >
                      4주 기댓값
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatMeso(character.weeklyExpectation * 4 + character.monthlyExpectation)}
                    </p>
                    {simulationCharacter && (
                      <p className="text-xs text-orange-600 mt-1">
                        드롭률 +20%: {formatMeso(simulationCharacter.weeklyExpectation * 4 + simulationCharacter.monthlyExpectation)}
                        <span className="text-orange-700 ml-1">
                          (+{formatMeso((simulationCharacter.weeklyExpectation * 4 + simulationCharacter.monthlyExpectation) - (character.weeklyExpectation * 4 + character.monthlyExpectation))})
                        </span>
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">주간 보스 기댓값</p>
                    <p className="text-md font-semibold text-blue-600">
                      {formatMeso(character.weeklyExpectation)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">월간 보스 기댓값</p>
                    <p className="text-md font-semibold text-purple-600">
                      {formatMeso(character.monthlyExpectation)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 캐릭터별 상세 */}
      {viewMode === 'characters' && (
        <div className="space-y-6">
          {result && result.characterResults.map((character, charIndex) => {
            const isExpanded = expandedCharacters.has(charIndex)
            
            return (
              <div key={charIndex} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="bg-gray-50 px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleCharacterExpanded(charIndex)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-md font-medium text-gray-900 flex items-center">
                        {isExpanded ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                        {character.characterName}
                      </h4>
                      <p 
                        className="text-sm text-gray-600 cursor-help" 
                        title="주간 보스 기댓값 × 4 + 월간 보스 기댓값"
                      >
                        {character.itemExpectations.length}개 아이템, 4주 총 {formatMeso(character.weeklyExpectation * 4 + character.monthlyExpectation)}
                      </p>
                    </div>
                  </div>
                </div>
              
              {isExpanded && (
                <div className="p-4">
                  <div className="space-y-3">
                    {(() => {
                    const itemsWithCharName = character.itemExpectations.map(item => ({ ...item, characterName: character.characterName }))
                    const groupedItems = groupItemsByName(itemsWithCharName)
                    const sortedGroups = Object.entries(groupedItems).sort(([, a], [, b]) => 
                      calculateGroupTotalValue(b) - calculateGroupTotalValue(a)
                    )
                    
                    return sortedGroups.map(([itemName, items], groupIndex) => {
                      const totalValue = calculateGroupTotalValue(items)
                      const totalCount = calculateGroupTotalCount(items)
                      const firstItem = items[0]
                      
                      return (
                        <div key={groupIndex} className="bg-gray-50 rounded-lg overflow-hidden">
                          {/* 아이템 헤더 */}
                          <div className="flex items-center justify-between py-3 px-4 bg-white border-l-4 border-blue-500">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900">{itemName}</p>
                              {renderCategoryTags(firstItem.categories)}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-blue-600">
                                {formatMeso(totalValue)}
                              </p>
                              <p className="text-xs text-gray-500">
                                총 {totalCount.toFixed(3)}개 예상
                              </p>
                            </div>
                          </div>
                          
                          {/* 보스별 상세 정보 (여러 보스에서 나오는 경우) */}
                          {items.length > 1 && (
                            <div className="px-4 py-2 space-y-1">
                              {items.map((item, itemIndex) => (
                                <div key={itemIndex} className="flex items-center justify-between text-xs text-gray-600">
                                  <span>{item.bossSource} | {formatDetailedDropRate(item)} | {formatDetailedPrice(item)}</span>
                                  <span>{formatMeso(item.expectedValue)} ({item.expectedCount.toFixed(3)}개)</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* 단일 보스에서 나오는 경우 */}
                          {items.length === 1 && (
                            <div className="px-4 py-2">
                              <p className="text-xs text-gray-600">
                                {items[0].bossSource} | {formatDetailedDropRate(items[0])} | {formatDetailedPrice(items[0])}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })
                    })()}
                  </div>
                </div>
              )}
              </div>
            )
          })}
        </div>
      )}

      {/* 아이템별 상세 */}
      {viewMode === 'items' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">정렬 기준:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="value">기댓값 순</option>
              <option value="category">카테고리별</option>
            </select>
          </div>

          <div className="space-y-3">
            {(() => {
              const groupedItems = groupItemsByName(allItemExpectations)
              let sortedGroups = Object.entries(groupedItems)
              
              if (sortBy === 'value') {
                sortedGroups.sort(([, a], [, b]) => calculateGroupTotalValue(b) - calculateGroupTotalValue(a))
              } else if (sortBy === 'category') {
                sortedGroups.sort(([, a], [, b]) => a[0].categories[0].localeCompare(b[0].categories[0]))
              }

              return sortedGroups.map(([itemName, items], groupIndex) => {
                const totalValue = calculateGroupTotalValue(items)
                const totalCount = calculateGroupTotalCount(items)
                const firstItem = items[0]
                const isItemExpanded = expandedItems.has(itemName)
                
                return (
                  <div key={groupIndex} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
                    {/* 아이템 헤더 */}
                    <div 
                      className="flex items-center justify-between py-3 px-4 border-l-4 border-blue-500 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleItemExpanded(itemName)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          {isItemExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                          <p className="text-sm font-medium text-gray-900">{itemName}</p>
                          {renderCategoryTags(firstItem.categories)}
                        </div>
                        <div className="mt-1 text-xs text-gray-600">
                          {items.length > 1 ? `${items.length}개 보스에서 드롭` : `${items[0].characterName} - ${items[0].bossSource}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-blue-600">
                          {formatMeso(totalValue)}
                        </p>
                        <p className="text-xs text-gray-500">
                          총 {totalCount.toFixed(3)}개 예상
                        </p>
                      </div>
                    </div>
                    
                    {/* 상세 정보 (모든 경우에 표시, 접힘/펼침 상태에 따라) */}
                    {isItemExpanded && (
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                        <div className="space-y-2">
                          {items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-center justify-between text-xs">
                              <div className="flex-1">
                                <span className="font-medium text-gray-700">{item.characterName}</span>
                                <span className="text-gray-500 ml-2">{item.bossSource}</span>
                                <span className="text-gray-500 ml-2">|</span>
                                <span className="text-gray-500 ml-2">{formatDetailedDropRate(item)}</span>
                                <span className="text-gray-500 ml-2">|</span>
                                <span className="text-gray-500 ml-2">{formatDetailedPrice(item)}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-medium text-blue-600">{formatMeso(item.expectedValue)}</span>
                                <span className="text-gray-500 ml-2">({item.expectedCount.toFixed(3)}개)</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            })()}
          </div>
        </div>
      )}

      {/* 상자 상세 */}
      {viewMode === 'boxes' && (
        <div className="space-y-6">
          <div className="text-center">
            <h4 className="text-lg font-medium text-gray-900 mb-2">상자별 확률 및 기댓값</h4>
            <p className="text-sm text-gray-600">
              반지 상자와 칠흑 상자의 확률과 기댓값을 확인할 수 있습니다.
            </p>
          </div>

          {/* 칠흑 상자 */}
          <div className="space-y-4">
            <h5 className="text-md font-medium text-gray-900">칠흑 상자</h5>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              {/* 헤더 */}
              <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100">
                <h5 className="font-medium text-indigo-900">{pitchedBoxData.name}</h5>
                <div className="mt-1">
                  <span className="text-sm text-indigo-700">
                    기댓값: {formatMeso(pitchedBoxData.expectedValue)}
                  </span>
                </div>
              </div>

              {/* 확률 상세 */}
              <div className="p-4 space-y-3">
                {(() => {
                  const pitchedItemIds = ['berserked', 'magic_eyepatch', 'dreamy_belt', 'cursed_spellbook', 'endless_terror', 'commanding_force_earring', 'source_of_suffering']
                  return pitchedItemIds.map(itemId => {
                    const item = getChaseItemById(itemId)
                    if (!item) return null
                    
                    return {
                      id: itemId,
                      name: item.name,
                      price: item.defaultPrice
                    }
                  }).filter((item): item is { id: string; name: string; price: number } => item !== null)
                })().map((item) => {
                  // 정규화된 확률 계산
                  const rawProbability = pitchedBoxData.probabilities[item.id as keyof PitchedBoxProbabilities] || 0
                  const totalProbability = Object.values(pitchedBoxData.probabilities).reduce((sum, prob) => sum + prob, 0)
                  const normalizedProbability = totalProbability > 0 ? rawProbability / totalProbability : 0
                  
                  return (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.name}</span>
                      <div className="text-right">
                        <span className="font-medium text-gray-900">
                          {(normalizedProbability * 100).toFixed(2)}%
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatMeso(normalizedProbability * item.price)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 반지 상자 */}
          <div className="space-y-4">
            <h5 className="text-md font-medium text-gray-900">반지 상자</h5>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {allRingBoxes.map((ringBox) => (
              <div key={ringBox.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                {/* 헤더 */}
                <div className="bg-purple-50 px-4 py-3 border-b border-purple-100">
                  <h5 className="font-medium text-purple-900">{ringBox.name}</h5>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm text-purple-700">
                      기댓값: {formatMeso(ringBox.expectedValue)}
                    </span>
                    <span className="text-sm font-medium text-purple-800">
                      유효: {(ringBox.effectiveProbability * 100).toFixed(3)}%
                    </span>
                  </div>
                </div>

                {/* 확률 상세 */}
                <div className="p-4 space-y-3">
                  {/* 리스트레인트 링 */}
                  <div>
                    <h6 className="text-sm font-medium text-gray-700 mb-2">리스트레인트 링</h6>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">3레벨</span>
                        <div className="text-right">
                          <span className="font-medium text-gray-900">
                            {(ringBox.probabilities.restraint_lv3 * 100).toFixed(4)}%
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {formatMeso(ringBox.probabilities.restraint_lv3 * ringPrices.restraint_lv3)}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">4레벨</span>
                        <div className="text-right">
                          <span className="font-medium text-gray-900">
                            {(ringBox.probabilities.restraint_lv4 * 100).toFixed(4)}%
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {formatMeso(ringBox.probabilities.restraint_lv4 * ringPrices.restraint_lv4)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 컨티뉴어스 링 */}
                  <div>
                    <h6 className="text-sm font-medium text-gray-700 mb-2">컨티뉴어스 링</h6>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">3레벨</span>
                        <div className="text-right">
                          <span className="font-medium text-gray-900">
                            {(ringBox.probabilities.continuous_lv3 * 100).toFixed(4)}%
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {formatMeso(ringBox.probabilities.continuous_lv3 * ringPrices.continuous_lv3)}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">4레벨</span>
                        <div className="text-right">
                          <span className="font-medium text-gray-900">
                            {(ringBox.probabilities.continuous_lv4 * 100).toFixed(4)}%
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {formatMeso(ringBox.probabilities.continuous_lv4 * ringPrices.continuous_lv4)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 연마석 (생명 상자만) */}
                  {ringBox.probabilities.grindstone > 0 && (
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 mb-2">연마석</h6>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">생명의 연마석</span>
                        <div className="text-right">
                          <span className="font-medium text-gray-900">
                            {(ringBox.probabilities.grindstone * 100).toFixed(4)}%
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {formatMeso(ringBox.probabilities.grindstone * grindstonePrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}