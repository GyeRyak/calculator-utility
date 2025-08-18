'use client'

import { useState, useMemo, useCallback } from 'react'
import { Settings, DollarSign, Percent, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react'
import type { RingPrices } from '@/utils/defaults/bossChaseDefaults'
import { CHASE_ITEMS, getChaseItemsByCategory, ITEM_DROP_RATES, PitchedBoxProbabilities, getChaseItemById } from '@/data/chaseItems'
import { BOSSES, getBossById, getBossDifficulty } from '@/data/bossData'
import { DEFAULT_RING_PRICES, DEFAULT_GRINDSTONE_PRICE, DEFAULT_DROP_RATE_BONUS, DEFAULT_FEE_RATE } from '@/utils/defaults/bossChaseDefaults'
import SlotSelector from '@/components/ui/SlotSelector'
import { loadDropRateFromBasicCalculator, getDefaultDropRateFromBasicCalculator } from '@/utils/bossChaseCalculations'

interface SettingsPanelProps {
  customDropRates: { [key: string]: number } // key: "bossId:difficulty:itemId" or "itemId"
  customPrices: { [itemId: string]: number }
  ringPrices: RingPrices
  grindstonePrice: number
  dropRateBonus: number
  feeRate: number
  pitchedBoxProbabilities?: PitchedBoxProbabilities
  onCustomDropRatesChange: (rates: { [key: string]: number }) => void
  onCustomPricesChange: (prices: { [itemId: string]: number }) => void
  onRingPricesChange: (prices: RingPrices) => void
  onGrindstoneePriceChange: (price: number) => void
  onDropRateBonusChange: (bonus: number) => void
  onFeeRateChange: (feeRate: number) => void
  onPitchedBoxProbabilitiesChange?: (probabilities: PitchedBoxProbabilities) => void
}

export default function SettingsPanel({
  customDropRates,
  customPrices,
  ringPrices,
  grindstonePrice,
  dropRateBonus,
  feeRate,
  pitchedBoxProbabilities,
  onCustomDropRatesChange,
  onCustomPricesChange,
  onRingPricesChange,
  onGrindstoneePriceChange,
  onDropRateBonusChange,
  onFeeRateChange,
  onPitchedBoxProbabilitiesChange
}: SettingsPanelProps) {
  const [activeSection, setActiveSection] = useState<'rings' | 'prices' | 'droprates' | 'global' | 'boxes'>('rings')
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({})
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({})
  const [dropRateView, setDropRateView] = useState<'category' | 'boss' | 'item'>('category')
  const [selectedBasicSlot, setSelectedBasicSlot] = useState<number | null>(null)

  // 반지 가격 업데이트
  const handleRingPriceChange = (ring: keyof RingPrices, value: number) => {
    onRingPricesChange({
      ...ringPrices,
      [ring]: value
    })
  }

  // 아이템 가격 업데이트
  const handleItemPriceChange = (itemId: string, value: number) => {
    onCustomPricesChange({
      ...customPrices,
      [itemId]: value
    })
  }

  // 특정 보스-난이도-아이템 드롭률 업데이트
  const handleSpecificDropRateChange = (bossId: string, difficulty: string, itemId: string, value: number) => {
    const key = `${bossId}:${difficulty}:${itemId}`
    if (value === 0 || isNaN(value)) {
      // 0이거나 NaN이면 커스텀 드롭률에서 제거 (기본값 사용)
      const { [key]: _, ...rest } = customDropRates
      onCustomDropRatesChange(rest)
    } else {
      onCustomDropRatesChange({
        ...customDropRates,
        [key]: value / 100 // 퍼센트를 소수로 변환
      })
    }
  }

  // 글로벌 아이템 드롭률 업데이트
  const handleGlobalDropRateChange = (itemId: string, value: number) => {
    if (value === 0 || isNaN(value)) {
      // 0이거나 NaN이면 커스텀 드롭률에서 제거
      const { [itemId]: _, ...rest } = customDropRates
      onCustomDropRatesChange(rest)
    } else {
      onCustomDropRatesChange({
        ...customDropRates,
        [itemId]: value / 100 // 퍼센트를 소수로 변환
      })
    }
  }

  // 카테고리별 일괄 드롭률 설정
  const handleCategoryDropRateChange = (category: string, value: number) => {
    const items = getChaseItemsByCategory(category as any)
    const newRates = { ...customDropRates }
    
    items.forEach(item => {
      if (value === 0 || isNaN(value)) {
        delete newRates[item.id]
      } else {
        newRates[item.id] = value / 100
      }
    })
    
    onCustomDropRatesChange(newRates)
  }

  // 칠흑 상자 확률 업데이트
  const handlePitchedBoxProbabilityChange = (itemId: keyof PitchedBoxProbabilities, value: number) => {
    if (!onPitchedBoxProbabilitiesChange || !pitchedBoxProbabilities) return
    
    onPitchedBoxProbabilitiesChange({
      ...pitchedBoxProbabilities,
      [itemId]: value / 100 // 퍼센트를 소수로 변환
    })
  }

  // 칠흑 상자 확률 균등분할 설정
  const setEqualPitchedBoxProbabilities = () => {
    if (!onPitchedBoxProbabilitiesChange) return
    
    const equalProbability = 1 / 7 // 7개 아이템 균등 확률
    onPitchedBoxProbabilitiesChange({
      berserked: equalProbability,
      magic_eyepatch: equalProbability,
      dreamy_belt: equalProbability,
      cursed_spellbook: equalProbability,
      endless_terror: equalProbability,
      commanding_force_earring: equalProbability,
      source_of_suffering: equalProbability
    })
  }

  // 가격 초기화
  const resetPrices = () => {
    if (confirm('모든 가격을 기본값으로 초기화하시겠습니까?')) {
      onCustomPricesChange({})
      onRingPricesChange(DEFAULT_RING_PRICES)
      onGrindstoneePriceChange(DEFAULT_GRINDSTONE_PRICE)
    }
  }

  // 드롭률 초기화
  const resetDropRates = () => {
    if (confirm('모든 커스텀 드롭률을 기본값으로 초기화하시겠습니까?')) {
      onCustomDropRatesChange({})
    }
  }

  // 기본 드롭률 가져오기
  const getDefaultDropRate = (bossId: string, difficulty: string, itemId: string): number => {
    const dropRateEntry = ITEM_DROP_RATES.find(
      entry => entry.bossId === bossId && 
               entry.difficulty === difficulty && 
               entry.itemId === itemId
    )
    return dropRateEntry?.defaultDropRate || 0
  }

  // 현재 사용 중인 드롭률 가져오기 (커스텀 또는 기본값)
  const getCurrentDropRate = (bossId: string, difficulty: string, itemId: string): number => {
    const specificKey = `${bossId}:${difficulty}:${itemId}`
    if (customDropRates[specificKey] !== undefined) {
      return customDropRates[specificKey]
    }
    if (customDropRates[itemId] !== undefined) {
      return customDropRates[itemId]
    }
    return getDefaultDropRate(bossId, difficulty, itemId)
  }

  // 보스 이름 한국어 표시
  const getBossDisplayName = (bossId: string, difficulty: string) => {
    const boss = getBossById(bossId)
    const difficultyData = getBossDifficulty(bossId, difficulty)
    if (!boss || !difficultyData) return `${bossId} (${difficulty})`
    return `${difficultyData.name} ${boss.name}`
  }

  // 메소 포맷팅
  const formatMeso = (value: number): string => {
    if (value >= 100_000_000) {
      return `${(value / 100_000_000).toFixed(0)}억`
    }
    return value.toLocaleString()
  }

  // 사냥 기댓값 계산기 슬롯 데이터 캐싱
  const basicSlotData = useMemo(() => {
    const slots: { [key: number]: { exists: boolean; name: string; feeRate?: number } } = {}
    for (let i = 1; i <= 5; i++) {
      try {
        const key = `basic_calculator_slot_${i}`
        const data = localStorage.getItem(key)
        if (data) {
          const settings = JSON.parse(data)
          slots[i] = {
            exists: true,
            name: settings.slotName || `슬롯 ${i}`,
            feeRate: settings.feeRate
          }
        } else {
          slots[i] = { exists: false, name: `슬롯 ${i}` }
        }
      } catch {
        slots[i] = { exists: false, name: `슬롯 ${i}` }
      }
    }
    return slots
  }, [])

  // 사냥 기댓값 계산기 슬롯 데이터 확인
  const hasBasicSlotData = useCallback((slotNumber: number): boolean => {
    return basicSlotData[slotNumber]?.exists || false
  }, [basicSlotData])

  // 사냥 기댓값 계산기 슬롯 이름 가져오기
  const getBasicSlotName = useCallback((slotNumber: number): string => {
    return basicSlotData[slotNumber]?.name || `슬롯 ${slotNumber}`
  }, [basicSlotData])

  // 사냥 기댓값 계산기에서 드롭률 불러오기
  const handleLoadDropRateFromBasicCalculator = useCallback((slotNumber: number) => {
    const calculatedDropRate = loadDropRateFromBasicCalculator(slotNumber)
    
    if (calculatedDropRate > 0) {
      onDropRateBonusChange(calculatedDropRate)
      setSelectedBasicSlot(slotNumber)
    }
    
    // 수수료 설정도 함께 불러오기 (캐싱된 데이터 사용)
    const slotInfo = basicSlotData[slotNumber]
    if (slotInfo && slotInfo.feeRate !== undefined) {
      onFeeRateChange(slotInfo.feeRate)
    }
  }, [basicSlotData, onDropRateBonusChange, onFeeRateChange])

  // 기본값으로 초기화
  const resetDropRateSettings = useCallback(() => {
    const defaultDropRate = getDefaultDropRateFromBasicCalculator()
    
    onDropRateBonusChange(defaultDropRate)
    setSelectedBasicSlot(null)
  }, [onDropRateBonusChange])

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          설정
        </h3>
        <p className="text-sm text-gray-600">
          가격과 드롭률을 조정하여 더 정확한 계산을 할 수 있습니다.
        </p>
      </div>

      {/* 섹션 탭 */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {[
            { id: 'rings', name: '반지류 가격', icon: DollarSign },
            { id: 'prices', name: '아이템 가격', icon: DollarSign },
            { id: 'droprates', name: '드롭률', icon: Percent },
            { id: 'boxes', name: '상자 확률', icon: Percent },
            { id: 'global', name: '전역 설정', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === tab.id
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

      {/* 반지류 가격 설정 */}
      {activeSection === 'rings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900">반지류 가격 설정</h4>
            <button
              onClick={() => {
                onRingPricesChange(DEFAULT_RING_PRICES)
                onGrindstoneePriceChange(DEFAULT_GRINDSTONE_PRICE)
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              기본값으로 초기화
            </button>
          </div>
          
          {/* 반지 가격 */}
          <div>
            <h5 className="text-md font-medium text-gray-800 mb-4">반지 가격</h5>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 w-32 flex-shrink-0">리스트레인트 링 3레벨</label>
                <div className="relative w-24">
                  <input
                    type="number"
                    step="0.1"
                    value={ringPrices.restraint_lv3 / 100_000_000}
                    onChange={(e) => handleRingPriceChange('restraint_lv3', (parseFloat(e.target.value) || 0) * 100_000_000)}
                    className="w-full px-2 py-2 pr-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="10"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-xs text-gray-500">
                    억
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 w-32 flex-shrink-0">리스트레인트 링 4레벨</label>
                <div className="relative w-24">
                  <input
                    type="number"
                    step="0.1"
                    value={ringPrices.restraint_lv4 / 100_000_000}
                    onChange={(e) => handleRingPriceChange('restraint_lv4', (parseFloat(e.target.value) || 0) * 100_000_000)}
                    className="w-full px-2 py-2 pr-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="45"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-xs text-gray-500">
                    억
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 w-32 flex-shrink-0">컨티뉴어스 링 3레벨</label>
                <div className="relative w-24">
                  <input
                    type="number"
                    step="0.1"
                    value={ringPrices.continuous_lv3 / 100_000_000}
                    onChange={(e) => handleRingPriceChange('continuous_lv3', (parseFloat(e.target.value) || 0) * 100_000_000)}
                    className="w-full px-2 py-2 pr-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="0.5"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-xs text-gray-500">
                    억
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 w-32 flex-shrink-0">컨티뉴어스 링 4레벨</label>
                <div className="relative w-24">
                  <input
                    type="number"
                    step="0.1"
                    value={ringPrices.continuous_lv4 / 100_000_000}
                    onChange={(e) => handleRingPriceChange('continuous_lv4', (parseFloat(e.target.value) || 0) * 100_000_000)}
                    className="w-full px-2 py-2 pr-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="20"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-xs text-gray-500">
                    억
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 연마석 가격 */}
          <div className="pt-4 border-t border-gray-200">
            <h5 className="text-md font-medium text-gray-800 mb-4">연마석 가격</h5>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 w-32 flex-shrink-0">생명의 연마석 (Lv.5)</label>
                <div className="relative w-24">
                  <input
                    type="number"
                    step="0.1"
                    value={grindstonePrice / 100_000_000}
                    onChange={(e) => onGrindstoneePriceChange((parseFloat(e.target.value) || 0) * 100_000_000)}
                    className="w-full px-2 py-2 pr-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="24"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-xs text-gray-500">
                    억
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 w-32 flex-shrink-0">신념의 연마석 (Lv.6)</label>
                <div className="relative w-24">
                  <input
                    type="number"
                    step="0.1"
                    value={(customPrices['grindstone_lv6'] || 10_500_000_000) / 100_000_000}
                    onChange={(e) => handleItemPriceChange('grindstone_lv6', (parseFloat(e.target.value) || 0) * 100_000_000)}
                    className="w-full px-2 py-2 pr-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="105"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-xs text-gray-500">
                    억
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 아이템 가격 설정 */}
      {activeSection === 'prices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900">아이템 가격 설정</h4>
            <button
              onClick={resetPrices}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              기본값으로 초기화
            </button>
          </div>

          {/* 카테고리별 아이템 표시 (상자 카테고리 제외) */}
          {['pitched_boss', 'dawn_boss', 'radiant_boss', 'grindstone', 'exceptional', 'misc_chase'].map((category) => {
            const items = getChaseItemsByCategory(category as any).filter(item => !item.categories.includes('box'))
            if (items.length === 0) return null

            const categoryNames: { [key: string]: string } = {
              pitched_boss: '칠흑의 보스 세트',
              dawn_boss: '여명의 보스 세트', 
              radiant_boss: '광휘의 보스 세트',
              grindstone: '연마석',
              exceptional: '익셉셔널 해머',
              misc_chase: '기타 물욕템'
            }

            return (
              <div key={category} className="space-y-2">
                <h5 className="font-medium text-gray-700">{categoryNames[category]}</h5>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <label className="text-sm text-gray-600 w-32 flex-shrink-0">{item.name}</label>
                      <div className="relative w-24">
                        <input
                          type="number"
                          step="0.1"
                          value={(customPrices[item.id] || item.defaultPrice) / 100_000_000}
                          onChange={(e) => handleItemPriceChange(item.id, (parseFloat(e.target.value) || 0) * 100_000_000)}
                          className="w-full px-2 py-2 pr-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder={((item.defaultPrice) / 100_000_000).toFixed(1)}
                        />
                        <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-xs text-gray-500">
                          억
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 드롭률 설정 */}
      {activeSection === 'droprates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900">드롭률 설정</h4>
            <div className="flex items-center space-x-2">
              <select
                value={dropRateView}
                onChange={(e) => setDropRateView(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="category">카테고리별</option>
                <option value="boss">보스별</option>
                <option value="item">아이템별</option>
              </select>
              <button
                onClick={resetDropRates}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                기본값으로 초기화
              </button>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>우선순위:</strong> 보스별 개별 설정 → 아이템 글로벌 설정 → 기본값
            </p>
          </div>

          {/* 카테고리별 보기 */}
          {dropRateView === 'category' && (
            <div className="space-y-4">
              {['pitched_boss', 'dawn_boss', 'radiant_boss', 'ring_box', 'grindstone', 'exceptional', 'misc_chase'].map((category) => {
                const items = getChaseItemsByCategory(category as any)
                if (items.length === 0) return null

                const categoryNames: { [key: string]: string } = {
                  pitched_boss: '칠흑의 보스 세트',
                  dawn_boss: '여명의 보스 세트', 
                  radiant_boss: '광휘의 보스 세트',
                  ring_box: '반지 상자',
                  grindstone: '연마석',
                  exceptional: '익셉셔널 해머',
                  misc_chase: '기타 물욕템'
                }

                const isExpanded = expandedCategories[category]

                return (
                  <div key={category} className="border border-gray-200 rounded-lg">
                    <div className="p-4 bg-gray-50 rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !isExpanded }))}
                          className="flex items-center space-x-2 text-left"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          <h5 className="font-medium text-gray-900">{categoryNames[category]}</h5>
                          <span className="text-sm text-gray-500">({items.length}개 아이템)</span>
                        </button>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">일괄 설정:</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder={(() => {
                              // 카테고리의 첫 번째 아이템의 기본 드롭률을 사용
                              const firstItem = items[0]
                              if (firstItem) {
                                const firstDropRate = ITEM_DROP_RATES.find(rate => rate.itemId === firstItem.id)
                                return firstDropRate ? (firstDropRate.defaultDropRate * 100).toFixed(2) : "0"
                              }
                              return "0"
                            })()}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={(e) => {
                              const value = parseFloat(e.target.value)
                              if (!isNaN(value)) {
                                handleCategoryDropRateChange(category, value)
                              }
                            }}
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="p-4 space-y-3">
                        {items.map((item) => {
                          const itemDropRates = ITEM_DROP_RATES.filter(rate => rate.itemId === item.id)
                          const isItemExpanded = expandedItems[item.id]
                          
                          return (
                            <div key={item.id} className="border border-gray-100 rounded">
                              <div className="p-3 bg-gray-50">
                                <div className="flex items-center justify-between">
                                  <button
                                    onClick={() => setExpandedItems(prev => ({ ...prev, [item.id]: !isItemExpanded }))}
                                    className="flex items-center space-x-2 text-left flex-1"
                                  >
                                    {isItemExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                    <span className="text-sm font-medium">{item.name}</span>
                                    <span className="text-xs text-gray-500">({itemDropRates.length}개 보스)</span>
                                  </button>
                                  
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-600">글로벌:</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      max="100"
                                      value={customDropRates[item.id] ? (customDropRates[item.id] * 100).toFixed(2) : ''}
                                      placeholder={(() => {
                                        // 해당 아이템의 첫 번째 드롭률을 기본값으로 사용
                                        const itemDropRates = ITEM_DROP_RATES.filter(rate => rate.itemId === item.id)
                                        const firstDropRate = itemDropRates[0]
                                        return firstDropRate ? (firstDropRate.defaultDropRate * 100).toFixed(2) : "0"
                                      })()}
                                      className="w-16 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      onChange={(e) => {
                                        const value = parseFloat(e.target.value)
                                        handleGlobalDropRateChange(item.id, value)
                                      }}
                                    />
                                    <span className="text-xs text-gray-500">%</span>
                                  </div>
                                </div>
                              </div>
                              
                              {isItemExpanded && (
                                <div className="p-3 space-y-2">
                                  {itemDropRates.map((dropRate) => {
                                    const specificKey = `${dropRate.bossId}:${dropRate.difficulty}:${dropRate.itemId}`
                                    const currentRate = getCurrentDropRate(dropRate.bossId, dropRate.difficulty, dropRate.itemId)
                                    const defaultRate = getDefaultDropRate(dropRate.bossId, dropRate.difficulty, dropRate.itemId)
                                    const hasCustomRate = customDropRates[specificKey] !== undefined
                                    
                                    return (
                                      <div key={specificKey} className="flex items-center justify-between py-1">
                                        <span className="text-xs text-gray-600 flex-1">
                                          {getBossDisplayName(dropRate.bossId, dropRate.difficulty)}
                                        </span>
                                        <div className="flex items-center space-x-2">
                                          <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={hasCustomRate ? (customDropRates[specificKey] * 100).toFixed(2) : ''}
                                            placeholder={(defaultRate * 100).toFixed(2)}
                                            className={`w-16 px-2 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                              hasCustomRate ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                                            }`}
                                            onChange={(e) => {
                                              const value = parseFloat(e.target.value)
                                              handleSpecificDropRateChange(dropRate.bossId, dropRate.difficulty, dropRate.itemId, value)
                                            }}
                                          />
                                          <span className="text-xs text-gray-500">%</span>
                                          {hasCustomRate && (
                                            <span className="text-xs text-blue-600">커스텀</span>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* 보스별 보기 */}
          {dropRateView === 'boss' && (
            <div className="space-y-4">
              {BOSSES.map((boss) => {
                const isExpanded = expandedCategories[boss.id]
                
                return (
                  <div key={boss.id} className="border border-gray-200 rounded-lg">
                    <div className="p-4 bg-gray-50 rounded-t-lg">
                      <button
                        onClick={() => setExpandedCategories(prev => ({ ...prev, [boss.id]: !isExpanded }))}
                        className="flex items-center space-x-2 text-left w-full"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <h5 className="font-medium text-gray-900">{boss.name}</h5>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          boss.type === 'weekly' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {boss.type === 'weekly' ? '주간' : '월간'}
                        </span>
                      </button>
                    </div>
                    
                    {isExpanded && (
                      <div className="p-4 space-y-4">
                        {boss.difficulties.map((difficulty) => {
                          const dropRates = ITEM_DROP_RATES.filter(
                            rate => rate.bossId === boss.id && rate.difficulty === difficulty.id
                          )
                          
                          return (
                            <div key={difficulty.id} className="border border-gray-100 rounded p-3">
                              <h6 className="font-medium text-sm text-gray-900 mb-3">
                                {getBossDisplayName(boss.id, difficulty.id)}
                              </h6>
                              <div className="space-y-2">
                                {dropRates.map((dropRate) => {
                                  const item = CHASE_ITEMS.find(i => i.id === dropRate.itemId)
                                  const specificKey = `${dropRate.bossId}:${dropRate.difficulty}:${dropRate.itemId}`
                                  const hasCustomRate = customDropRates[specificKey] !== undefined
                                  const defaultRate = getDefaultDropRate(dropRate.bossId, dropRate.difficulty, dropRate.itemId)
                                  
                                  return (
                                    <div key={dropRate.itemId} className="flex items-center justify-between">
                                      <span className="text-sm text-gray-600 flex-1">
                                        {item?.name || dropRate.itemId}
                                      </span>
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          max="100"
                                          value={hasCustomRate ? (customDropRates[specificKey] * 100).toFixed(2) : ''}
                                          placeholder={(defaultRate * 100).toFixed(2)}
                                          className={`w-20 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            hasCustomRate ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                                          }`}
                                          onChange={(e) => {
                                            const value = parseFloat(e.target.value)
                                            handleSpecificDropRateChange(dropRate.bossId, dropRate.difficulty, dropRate.itemId, value)
                                          }}
                                        />
                                        <span className="text-sm text-gray-500">%</span>
                                        {hasCustomRate && (
                                          <span className="text-xs text-blue-600">커스텀</span>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* 아이템별 보기 */}
          {dropRateView === 'item' && (
            <div className="space-y-4">
              {CHASE_ITEMS.map((item) => {
                const itemDropRates = ITEM_DROP_RATES.filter(rate => rate.itemId === item.id)
                const isExpanded = expandedItems[item.id]
                
                return (
                  <div key={item.id} className="border border-gray-200 rounded-lg">
                    <div className="p-4 bg-gray-50 rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setExpandedItems(prev => ({ ...prev, [item.id]: !isExpanded }))}
                          className="flex items-center space-x-2 text-left flex-1"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          <h5 className="font-medium text-gray-900">{item.name}</h5>
                          <span className="text-sm text-gray-500">({itemDropRates.length}개 보스)</span>
                        </button>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">글로벌:</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={customDropRates[item.id] ? (customDropRates[item.id] * 100).toFixed(2) : ''}
                            placeholder={(() => {
                              // 해당 아이템의 첫 번째 드롭률을 기본값으로 사용
                              const firstDropRate = itemDropRates[0]
                              return firstDropRate ? (firstDropRate.defaultDropRate * 100).toFixed(2) : "0"
                            })()}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={(e) => {
                              const value = parseFloat(e.target.value)
                              handleGlobalDropRateChange(item.id, value)
                            }}
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="p-4 space-y-2">
                        {itemDropRates.map((dropRate) => {
                          const specificKey = `${dropRate.bossId}:${dropRate.difficulty}:${dropRate.itemId}`
                          const hasCustomRate = customDropRates[specificKey] !== undefined
                          const defaultRate = getDefaultDropRate(dropRate.bossId, dropRate.difficulty, dropRate.itemId)
                          
                          return (
                            <div key={specificKey} className="flex items-center justify-between py-1">
                              <span className="text-sm text-gray-600 flex-1">
                                {getBossDisplayName(dropRate.bossId, dropRate.difficulty)}
                              </span>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  value={hasCustomRate ? (customDropRates[specificKey] * 100).toFixed(2) : ''}
                                  placeholder={(defaultRate * 100).toFixed(2)}
                                  className={`w-20 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    hasCustomRate ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                                  }`}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value)
                                    handleSpecificDropRateChange(dropRate.bossId, dropRate.difficulty, dropRate.itemId, value)
                                  }}
                                />
                                <span className="text-sm text-gray-500">%</span>
                                {hasCustomRate && (
                                  <span className="text-xs text-blue-600">커스텀</span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 상자 확률 설정 */}
      {activeSection === 'boxes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900">상자 확률 설정</h4>
            <button
              onClick={setEqualPitchedBoxProbabilities}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              균등 확률로 설정
            </button>
          </div>

          {/* 칠흑 상자 확률 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-sm font-medium text-gray-900">혼돈의 칠흑 장신구 상자</h5>
              <span className="text-xs text-gray-500">
                총 확률: {pitchedBoxProbabilities ? (Object.values(pitchedBoxProbabilities).reduce((sum, prob) => sum + prob, 0) * 100).toFixed(2) : '0.00'}%
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {(() => {
                const pitchedItemIds = ['berserked', 'magic_eyepatch', 'dreamy_belt', 'cursed_spellbook', 'endless_terror', 'commanding_force_earring', 'source_of_suffering']
                return pitchedItemIds.map(itemId => {
                  const item = getChaseItemById(itemId)
                  return item ? { id: itemId, name: item.name } : null
                }).filter((item): item is { id: string; name: string } => item !== null)
              })().map((item) => {
                const currentProbability = pitchedBoxProbabilities?.[item.id as keyof PitchedBoxProbabilities] || 0
                return (
                  <div key={item.id} className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 flex-1">
                      {item.name}
                    </label>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={(currentProbability * 100).toFixed(2)}
                        onChange={(e) => handlePitchedBoxProbabilityChange(
                          item.id as keyof PitchedBoxProbabilities, 
                          parseFloat(e.target.value) || 0
                        )}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-right"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              <p>• 각 아이템의 확률을 백분율(%)로 입력하세요.</p>
              <p>• 총 확률이 100%를 초과하거나 미달해도 정상적으로 계산됩니다.</p>
              <p>• &quot;균등 확률로 설정&quot; 버튼으로 모든 아이템을 동일한 확률(약 14.29%)로 설정할 수 있습니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* 전역 설정 */}
      {activeSection === 'global' && (
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">전역 설정</h4>
          
          {/* 사냥 기댓값 계산기에서 불러오기 */}
          <SlotSelector
            title="사냥 기댓값 계산기에서 불러오기"
            description="사냥 기댓값 계산기의 드롭률 설정을 가져옵니다."
            selectedSlot={selectedBasicSlot}
            onSlotSelect={handleLoadDropRateFromBasicCalculator}
            onReset={resetDropRateSettings}
            hasSlotData={hasBasicSlotData}
            getSlotName={getBasicSlotName}
            className="mb-4"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                아이템 드롭률 증가량 (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={dropRateBonus}
                onChange={(e) => onDropRateBonusChange(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                새 캐릭터의 기본 드롭률로 사용될 값입니다. 
                각 캐릭터는 개별 설정을 통해 다른 드롭률을 사용할 수 있습니다.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                경매장 수수료 (%)
              </label>
              <select
                value={feeRate}
                onChange={(e) => onFeeRateChange(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={3}>3%</option>
                <option value={5}>5%</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                아이템 판매 시 적용될 경매장 수수료입니다.
                실제 수익은 판매가격에서 수수료를 제외한 금액입니다.
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}