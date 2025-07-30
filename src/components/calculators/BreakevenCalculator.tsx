'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, AlertCircle, RotateCcw, Calculator } from 'lucide-react'
import { calculateBreakeven, type BreakevenItem, type BreakevenResult } from '@/utils/breakevenCalculations'
import { loadCalculatorSettings, canUseFunctionalCookies, hasSlotData } from '@/utils/cookies'
import { type HuntingExpectationParams } from '@/utils/huntingExpectationCalculations'
import { useSlotSystem } from '@/hooks/useSlotSystem'
import NumberInput from '../ui/NumberInput'
import { RadioGroup, Toggle } from '../ui'
import SlotHeader from '../ui/SlotHeader'
import { useNotification } from '@/contexts/NotificationContext'

interface BreakevenSettings {
  items: BreakevenItem[]
  materialsPerDay: number
  baseParams: HuntingExpectationParams
  realTimeCalculation: boolean
  wealthAcquisitionPotion: boolean
  currentDropFromPotential: number  // 현재 잠재능력 드랍률
  currentMesoFromPotential: number  // 현재 잠재능력 메소획득량
  globalFeeRate: 3 | 5  // 전역 경매장 수수료
  linkedPrices?: { [itemId: string]: boolean }  // 구매가-판매가 연동 상태
}

export function BreakevenCalculator() {
  const [mounted, setMounted] = useState(false)
  const { showNotification } = useNotification()
  
  // 기본값
  const defaultItem: BreakevenItem = {
    id: Date.now().toString(),
    name: '',
    dropLines: 0,
    mesoLines: 0,
    purchasePrice: 0,
    sellPrice: 0
  }

  const defaultBaseParams: HuntingExpectationParams = {
    monsterLevel: 275,
    totalMonsters: 18500, // 6분당 1850마리 = 시간당 18500마리
    mesoBonus: 20,
    dropRate: 71,
    solErdaFragmentPrice: 600,
    feeRate: 3
  }

  // 상태
  const [items, setItems] = useState<BreakevenItem[]>([])
  const [materialsPerDay, setMaterialsPerDay] = useState(4)
  const [globalFeeRate, setGlobalFeeRate] = useState<3 | 5>(5)
  const [baseParams, setBaseParams] = useState<HuntingExpectationParams>(defaultBaseParams)
  const [realTimeCalculation, setRealTimeCalculation] = useState(true)
  const [wealthAcquisitionPotion, setWealthAcquisitionPotion] = useState(true)
  const [currentDropFromPotential, setCurrentDropFromPotential] = useState(0)
  const [currentMesoFromPotential, setCurrentMesoFromPotential] = useState(0)
  const [results, setResults] = useState<{
    itemResults: BreakevenResult[]
    totalResult: BreakevenResult | null
    warnings: string[]
  } | null>(null)
  const [selectedBasicSlot, setSelectedBasicSlot] = useState<number | null>(null)
  const [manuallySelectedBasicSlot, setManuallySelectedBasicSlot] = useState(false)
  const [basicSlotNames, setBasicSlotNames] = useState<{[key: number]: string}>({
    1: '슬롯 1',
    2: '슬롯 2', 
    3: '슬롯 3'
  })
  const [loadedBaseParams, setLoadedBaseParams] = useState<HuntingExpectationParams | null>(null)
  const [loadedExtraSettings, setLoadedExtraSettings] = useState<{
    wealthAcquisitionPotion: boolean
    currentDropFromPotential: number
    currentMesoFromPotential: number
  } | null>(null)
  
  // 아이템별 구매가-판매가 연동 상태
  const [linkedPrices, setLinkedPrices] = useState<{ [itemId: string]: boolean }>({})
  
  // 슬롯 시스템 훅 사용
  const slotSystem = useSlotSystem<BreakevenSettings>(
    {
      storagePrefix: 'breakeven_calculator',
      maxSlots: 3,
      defaultSlotName: (num) => `슬롯 ${num}`
    },
    {
      items: [],
      materialsPerDay: 4,
      baseParams: defaultBaseParams,
      realTimeCalculation: true,
      wealthAcquisitionPotion: true,
      currentDropFromPotential: 0,
      currentMesoFromPotential: 0,
      globalFeeRate: 5,
      linkedPrices: {}
    },
    (slotNumber, data) => {
      // 슬롯 변경 시 데이터 로드
      if (data) {
        setItems(data.items)
        setMaterialsPerDay(data.materialsPerDay)
        setBaseParams(data.baseParams)
        setRealTimeCalculation(data.realTimeCalculation)
        setWealthAcquisitionPotion(data.wealthAcquisitionPotion ?? true)
        setCurrentDropFromPotential(data.currentDropFromPotential ?? 0)
        setCurrentMesoFromPotential(data.currentMesoFromPotential ?? 0)
        setGlobalFeeRate(data.globalFeeRate ?? 5)
        setLinkedPrices(data.linkedPrices ?? {})
      } else {
        // 빈 슬롯
        setItems([])
        setMaterialsPerDay(4)
        setBaseParams(defaultBaseParams)
        setRealTimeCalculation(true)
        setWealthAcquisitionPotion(true)
        setCurrentDropFromPotential(0)
        setCurrentMesoFromPotential(0)
        setGlobalFeeRate(5)
        setLinkedPrices({})
      }
      setResults(null)
      setSelectedBasicSlot(null)
      setManuallySelectedBasicSlot(false)
      setLoadedBaseParams(null)
      setLoadedExtraSettings(null)
    },
    (currentData, savedData) => {
      // 변경사항 감지
      if (!savedData) return false
      
      return JSON.stringify(currentData) !== JSON.stringify(savedData)
    }
  )

  // 아이템 추가
  const addItem = () => {
    const newItemId = Date.now().toString()
    setItems([...items, { ...defaultItem, id: newItemId }])
    setLinkedPrices({ ...linkedPrices, [newItemId]: true }) // 기본적으로 연동 활성화
  }

  // 아이템 제거
  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
    const newLinkedPrices = { ...linkedPrices }
    delete newLinkedPrices[id]
    setLinkedPrices(newLinkedPrices)
  }

  // 아이템 업데이트
  const updateItem = (id: string, field: keyof BreakevenItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        // 구매 가격이 변경되고 연동이 활성화되어 있으면 판매 가격도 업데이트
        if (field === 'purchasePrice' && linkedPrices[id]) {
          updatedItem.sellPrice = value
        }
        return updatedItem
      }
      return item
    }))
  }

  // 구매가-판매가 연동 토글
  const togglePriceLink = (id: string) => {
    setLinkedPrices({ ...linkedPrices, [id]: !linkedPrices[id] })
  }

  // 계산 실행
  const calculate = useCallback(() => {
    if (items.length === 0) {
      setResults(null)
      return
    }

    const result = calculateBreakeven({
      ...baseParams,
      items,
      materialsPerDay,
      wealthAcquisitionPotion,
      currentDropFromPotential,
      currentMesoFromPotential,
      globalFeeRate
    })
    setResults(result)
  }, [items, materialsPerDay, baseParams, wealthAcquisitionPotion, currentDropFromPotential, currentMesoFromPotential, globalFeeRate])

  // 실시간 계산
  useEffect(() => {
    if (realTimeCalculation) {
      calculate()
    }
  }, [realTimeCalculation, calculate])

  // 값이 변경되면 하이라이트 제거 (사냥 소재 수 제외)
  useEffect(() => {
    if (loadedBaseParams && loadedExtraSettings && manuallySelectedBasicSlot) {
      const hasChanged = 
        baseParams.monsterLevel !== loadedBaseParams.monsterLevel ||
        baseParams.totalMonsters !== loadedBaseParams.totalMonsters ||
        baseParams.mesoBonus !== loadedBaseParams.mesoBonus ||
        baseParams.dropRate !== loadedBaseParams.dropRate ||
        baseParams.solErdaFragmentPrice !== loadedBaseParams.solErdaFragmentPrice ||
        baseParams.feeRate !== loadedBaseParams.feeRate ||
        wealthAcquisitionPotion !== loadedExtraSettings.wealthAcquisitionPotion ||
        currentDropFromPotential !== loadedExtraSettings.currentDropFromPotential ||
        currentMesoFromPotential !== loadedExtraSettings.currentMesoFromPotential
      
      if (hasChanged) {
        setSelectedBasicSlot(null)
        setLoadedBaseParams(null)
        setLoadedExtraSettings(null)
      }
    }
  }, [baseParams, loadedBaseParams, loadedExtraSettings, manuallySelectedBasicSlot, 
      wealthAcquisitionPotion, currentDropFromPotential, currentMesoFromPotential])

  // 기본 계산기 슬롯 데이터 불러오기
  const loadFromSlot = (slotNumber: number) => {
    const settings = loadCalculatorSettings(slotNumber)
    if (settings) {
      // 슬롯 이름 설정
      if (settings.slotName) {
        setBasicSlotNames(prev => ({ ...prev, [slotNumber]: settings.slotName }))
      }
      // 메소 획득량 계산 (기본 계산기와 동일한 로직)
      let calculatedMesoBonus = 0
      
      // 메소 입력 모드에 따른 계산
      if (settings.mesoInputMode === 'detail') {
        // 유니온 점령 효과
        if (settings.mesoUnionBuff) {
          if (settings.globalBuffMode === 'union' || settings.globalBuffMode === 'both') {
            calculatedMesoBonus += 2.5
          }
        }
        
        // 팬텀 유니온원 효과
        if (settings.phantomUnionMeso && settings.phantomUnionMeso > 0) {
          if (settings.globalBuffMode === 'union' || settings.globalBuffMode === 'both') {
            calculatedMesoBonus += settings.phantomUnionMeso
          }
        }
        
        // 장비 잠재능력
        if (settings.mesoPotentialMode === 'lines' && settings.mesoPotentialLines > 0) {
          calculatedMesoBonus += settings.mesoPotentialLines * 20
        } else if (settings.mesoPotentialMode === 'direct' && settings.mesoPotentialDirect > 0) {
          calculatedMesoBonus += settings.mesoPotentialDirect
        }
        
        // 어빌리티
        if (settings.mesoAbility > 0) {
          if (settings.globalBuffMode === 'core' || settings.globalBuffMode === 'both') {
            calculatedMesoBonus += settings.mesoAbility
          }
        }
        
        // HEXA 스탯
        if (settings.mesoArtifactMode === 'level' && settings.mesoArtifactLevelInput > 0) {
          const artifactBonus = Math.min(settings.mesoArtifactLevelInput, 10) * 5
          calculatedMesoBonus += artifactBonus
        } else if (settings.mesoArtifactMode === 'percent' && settings.mesoArtifactPercentInput > 0) {
          calculatedMesoBonus += settings.mesoArtifactPercentInput
        }
        
        // 재물 획득의 비약 (곱연산 적용을 위해 별도로 처리)
        if (settings.wealthAcquisitionPotion) {
          calculatedMesoBonus = (100 + calculatedMesoBonus) * 1.2 - 100
        }
      } else {
        // 단순 입력 모드
        calculatedMesoBonus = settings.mesoBonus ?? 0
      }
      
      // 아이템 드랍률 계산
      let calculatedDropRate = 0
      
      if (settings.dropRateInputMode === 'detail' || settings.itemDropInputMode === 'detail') {
        // 유니온 점령 효과
        if (settings.dropRateUnionBuff) {
          if (settings.globalBuffMode === 'union' || settings.globalBuffMode === 'both') {
            calculatedDropRate += 10
          }
        }
        
        // 장비 잠재능력
        if (settings.dropRatePotentialMode === 'lines' && settings.dropRatePotentialLines > 0) {
          calculatedDropRate += settings.dropRatePotentialLines * 20
        } else if (settings.dropRatePotentialMode === 'direct' && settings.dropRatePotentialDirect > 0) {
          calculatedDropRate += settings.dropRatePotentialDirect
        }
        
        // 어빌리티
        if (settings.dropRateAbility > 0) {
          if (settings.globalBuffMode === 'core' || settings.globalBuffMode === 'both') {
            calculatedDropRate += settings.dropRateAbility
          }
        }
        
        // HEXA 스탯
        if (settings.dropRateArtifactMode === 'level' && settings.dropRateArtifactLevelInput > 0) {
          const artifactBonus = Math.min(settings.dropRateArtifactLevelInput, 10) * 5
          calculatedDropRate += artifactBonus
        } else if (settings.dropRateArtifactMode === 'percent' && settings.dropRateArtifactPercentInput > 0) {
          calculatedDropRate += settings.dropRateArtifactPercentInput
        }
        
        // 홀리 심볼
        if (settings.holySymbol) {
          calculatedDropRate += 50
        }
        
        // 쓸만한 홀리 심볼
        if (settings.usefulHolySymbol && settings.usefulHolySymbolLevel > 0) {
          const baseBonus = 24
          const levelBonus = (settings.usefulHolySymbolLevel - 1) * 1
          calculatedDropRate += baseBonus + levelBonus
        }
        
        // 재물 획득의 비약 (드랍률에 합연산 +20%)
        if (settings.wealthAcquisitionPotion) {
          calculatedDropRate += 20
        }
      } else {
        // 단순 입력 모드
        calculatedDropRate = settings.dropRate ?? settings.itemDropBonus ?? 0
      }
      
      // 시간당 몬스터 수 계산
      // 기본 계산기는 huntTime(분) 동안의 monsterCount를 저장
      const huntTime = settings.huntTime ?? 0.125
      const monsterCount = settings.monsterCount ?? 39
      const monstersPerMinute = monsterCount / huntTime
      const monstersPer6Minutes = Math.round(monstersPerMinute * 6)
      const totalMonstersPerHour = monstersPerMinute * 60
      
      // 현재 잠재능력 드랍률/메소획득량 설정
      let potentialDrop = 0
      let potentialMeso = 0
      
      if (settings.dropRatePotentialMode === 'lines' && settings.dropRatePotentialLines > 0) {
        potentialDrop = settings.dropRatePotentialLines * 20
      } else if (settings.dropRatePotentialMode === 'direct' && settings.dropRatePotentialDirect > 0) {
        potentialDrop = settings.dropRatePotentialDirect
      }
      
      if (settings.mesoPotentialMode === 'lines' && settings.mesoPotentialLines > 0) {
        potentialMeso = settings.mesoPotentialLines * 20
      } else if (settings.mesoPotentialMode === 'direct' && settings.mesoPotentialDirect > 0) {
        potentialMeso = settings.mesoPotentialDirect
      }
      
      // 기본 매개변수 설정
      setBaseParams({
        monsterLevel: settings.monsterLevel ?? settings.mobLevel ?? 275,
        totalMonsters: totalMonstersPerHour,
        mesoBonus: calculatedMesoBonus,
        dropRate: calculatedDropRate,
        solErdaFragmentPrice: settings.solErdaFragmentPrice ?? 600,
        feeRate: settings.feeRate ?? 3
      })
      
      // 재물 획득의 비약 및 잠재능력 설정
      setWealthAcquisitionPotion(settings.wealthAcquisitionPotion ?? false)
      setCurrentDropFromPotential(potentialDrop)
      setCurrentMesoFromPotential(potentialMeso)
      
      // 불러온 기본 매개변수 저장
      const newBaseParams = {
        monsterLevel: settings.monsterLevel ?? settings.mobLevel ?? 275,
        totalMonsters: totalMonstersPerHour,
        mesoBonus: calculatedMesoBonus,
        dropRate: calculatedDropRate,
        solErdaFragmentPrice: settings.solErdaFragmentPrice ?? 600,
        feeRate: settings.feeRate ?? 3
      }
      setLoadedBaseParams(newBaseParams)
      
      // 불러온 추가 설정 저장
      setLoadedExtraSettings({
        wealthAcquisitionPotion: settings.wealthAcquisitionPotion ?? false,
        currentDropFromPotential: potentialDrop,
        currentMesoFromPotential: potentialMeso
      })
      
      setSelectedBasicSlot(slotNumber)
      setManuallySelectedBasicSlot(true)
      showNotification('success', `기본 계산기 "${basicSlotNames[slotNumber] || `슬롯 ${slotNumber}`}" 데이터를 불러왔습니다.`)
    }
  }

  // 현재 설정 가져오기
  const getCurrentSettings = (): BreakevenSettings => ({
    items,
    materialsPerDay,
    baseParams,
    realTimeCalculation,
    wealthAcquisitionPotion,
    currentDropFromPotential,
    currentMesoFromPotential,
    globalFeeRate,
    linkedPrices
  })

  // 슬롯 전환 래퍼
  const switchSlot = (slotNumber: number) => {
    slotSystem.switchSlot(slotNumber, getCurrentSettings())
  }

  // 설정 저장
  const saveSettings = () => {
    if (!canUseFunctionalCookies()) {
      showNotification('error', '기능성 쿠키가 비활성화되어 있습니다. 설정을 저장하려면 쿠키 설정에서 기능성 쿠키를 활성화해주세요.')
      return
    }
    
    const success = slotSystem.saveCurrentSlot(getCurrentSettings())
    if (success) {
      showNotification('success', `슬롯 ${slotSystem.currentSlot}에 설정이 저장되었습니다.`)
    } else {
      showNotification('error', '설정 저장에 실패했습니다.')
    }
  }

  // 초기화
  const resetAll = () => {
    if (confirm('현재 슬롯의 모든 설정을 초기화하시겠습니까?')) {
      setItems([])
      setMaterialsPerDay(4)
      setBaseParams(defaultBaseParams)
      setRealTimeCalculation(true)
      setWealthAcquisitionPotion(true)
      setCurrentDropFromPotential(0)
      setCurrentMesoFromPotential(0)
      setGlobalFeeRate(5)
      setLinkedPrices({})
      setResults(null)
      setSelectedBasicSlot(null)
      slotSystem.deleteSlot(slotSystem.currentSlot)
      showNotification('success', '현재 슬롯이 초기화되었습니다.')
    }
  }

  // 컴포넌트 마운트 시 초기 슬롯 로드 및 기본 계산기 슬롯 이름 로드
  useEffect(() => {
    setMounted(true)
    
    // 손익분기 계산기 슬롯 로드
    const initialData = slotSystem.loadFromSlot(1)
    if (initialData) {
      setItems(initialData.items)
      setMaterialsPerDay(initialData.materialsPerDay)
      setBaseParams(initialData.baseParams)
      setRealTimeCalculation(initialData.realTimeCalculation)
      setWealthAcquisitionPotion(initialData.wealthAcquisitionPotion ?? true)
      setCurrentDropFromPotential(initialData.currentDropFromPotential ?? 0)
      setCurrentMesoFromPotential(initialData.currentMesoFromPotential ?? 0)
      setGlobalFeeRate(initialData.globalFeeRate ?? 5)
      setLinkedPrices(initialData.linkedPrices ?? {})
    }
    
    // 기본 계산기 슬롯 이름 로드
    for (let i = 1; i <= 3; i++) {
      const basicSettings = loadCalculatorSettings(i)
      if (basicSettings && basicSettings.slotName) {
        setBasicSlotNames(prev => ({ ...prev, [i]: basicSettings.slotName }))
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-7xl mx-auto">
        <div className="text-center py-8 text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-7xl mx-auto">
      {/* 슬롯 선택 UI */}
      <SlotHeader
        currentSlot={slotSystem.currentSlot}
        maxSlots={slotSystem.maxSlots}
        slotNames={slotSystem.slotNames}
        tempSlotName={slotSystem.tempSlotName}
        isEditingSlotName={slotSystem.isEditingSlotName}
        hasSlotData={slotSystem.hasSlotData}
        onSlotSwitch={switchSlot}
        onSlotNameChange={slotSystem.setTempSlotName}
        onSlotNameEdit={slotSystem.setIsEditingSlotName}
        onSave={saveSettings}
        onReset={resetAll}
      />

      <div className="space-y-6">
        {/* 기본 설정 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">기본 설정</h2>

        {/* 기본 계산기 데이터 불러오기 */}
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium text-gray-700">기본 계산기에서 불러오기</div>
            <button
              onClick={() => {
                setBaseParams(defaultBaseParams)
                setWealthAcquisitionPotion(true)
                setCurrentDropFromPotential(0)
                setCurrentMesoFromPotential(0)
                setGlobalFeeRate(5)
                setSelectedBasicSlot(null)
                setLoadedBaseParams(null)
                setLoadedExtraSettings(null)
              }}
              className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              기본값으로 초기화
            </button>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map(slot => (
              <button
                key={slot}
                onClick={() => loadFromSlot(slot)}
                disabled={!hasSlotData(slot)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  selectedBasicSlot === slot && manuallySelectedBasicSlot
                    ? 'bg-green-500 text-white'
                    : hasSlotData(slot)
                    ? 'bg-gray-200 hover:bg-gray-300'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {basicSlotNames[slot] || `슬롯 ${slot}`}
                {!hasSlotData(slot) && ' (비어있음)'}
              </button>
            ))}
          </div>
        </div>
        {/* 기본 매개변수 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">몬스터 레벨</label>
            <NumberInput
              value={baseParams.monsterLevel}
              onChange={(value) => setBaseParams({ ...baseParams, monsterLevel: value })}
              min={1}
              max={300}
              step={1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">6분당 처치 수</label>
            <NumberInput
              value={Math.round(baseParams.totalMonsters / 10)}
              onChange={(value) => setBaseParams({ ...baseParams, totalMonsters: value * 10 })}
              min={1}
              step={10}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">최종 메소 획득량 (%)</label>
            <NumberInput
              value={baseParams.mesoBonus}
              onChange={(value) => setBaseParams({ ...baseParams, mesoBonus: value })}
              min={0}
              max={700}
              step={1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">최종 아이템 드랍률 (%)</label>
            <NumberInput
              value={baseParams.dropRate}
              onChange={(value) => setBaseParams({ ...baseParams, dropRate: value })}
              min={0}
              max={400}
              step={1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">솔 에르다 조각 가격 (만 메소)</label>
            <NumberInput
              value={baseParams.solErdaFragmentPrice}
              onChange={(value) => setBaseParams({ ...baseParams, solErdaFragmentPrice: value })}
              min={0}
              step={10}
            />
          </div>
        </div>
        
        {/* 잠재능력 및 재획비 설정 */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              현재 잠재능력 메소획득량 (%)
            </label>
            <NumberInput
              value={currentMesoFromPotential}
              onChange={setCurrentMesoFromPotential}
              min={0}
              max={100}
              step={20}
              placeholder="0"
            />
            <div className="text-xs text-gray-500 mt-1">장비 잠재능력으로 얻은 메소획득량</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              현재 잠재능력 드랍률 (%)
            </label>
            <NumberInput
              value={currentDropFromPotential}
              onChange={setCurrentDropFromPotential}
              min={0}
              max={200}
              step={20}
              placeholder="0"
            />
            <div className="text-xs text-gray-500 mt-1">장비 잠재능력으로 얻은 드랍률</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              재물 획득의 비약 사용
            </label>
            <Toggle
              checked={wealthAcquisitionPotion}
              onChange={setWealthAcquisitionPotion}
            />
          </div>
        </div>

        {/* 추가 설정 */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                하루 사냥 소재 수
              </label>
              <NumberInput
                value={materialsPerDay}
                onChange={setMaterialsPerDay}
                min={1}
                max={48}
                step={1}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                경매장 수수료
              </label>
              <RadioGroup
                value={globalFeeRate.toString()}
                onChange={(value) => setGlobalFeeRate(parseInt(value) as 3 | 5)}
                options={[
                  { value: '3', label: '3%' },
                  { value: '5', label: '5%' }
                ]}
              />
            </div>
            
          </div>
        </div>
      </div>
      </div>

      {/* 아이템 목록 */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">드랍/메획 아이템</h2>
          <button
            onClick={addItem}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            아이템 추가
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            아이템을 추가하여 손익분기를 계산하세요.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium">아이템 {index + 1}</h3>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      아이템 이름
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      placeholder="예: 반지"
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      드랍률 증가 (줄)
                    </label>
                    <NumberInput
                      value={item.dropLines}
                      onChange={(value) => updateItem(item.id, 'dropLines', value)}
                      min={0}
                      max={3}
                      step={1}
                    />
                    <div className="text-xs text-gray-500 mt-1">+{item.dropLines * 20}%</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      메소 획득량 증가 (줄)
                    </label>
                    <NumberInput
                      value={item.mesoLines}
                      onChange={(value) => updateItem(item.id, 'mesoLines', value)}
                      min={0}
                      max={3}
                      step={1}
                    />
                    <div className="text-xs text-gray-500 mt-1">+{item.mesoLines * 20}%</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      구매 가격 (억 메소)
                    </label>
                    <NumberInput
                      value={item.purchasePrice}
                      onChange={(value) => updateItem(item.id, 'purchasePrice', value)}
                      min={0}
                      step={0.1}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-gray-700">
                        판매 예상 가격 (억 메소)
                      </label>
                      <label className="flex items-center text-xs text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={linkedPrices[item.id] ?? true}
                          onChange={() => togglePriceLink(item.id)}
                          className="mr-1 h-3 w-3"
                        />
                        구매가와 동일
                      </label>
                    </div>
                    <NumberInput
                      value={item.sellPrice}
                      onChange={(value) => updateItem(item.id, 'sellPrice', value)}
                      min={0}
                      step={0.1}
                      disabled={linkedPrices[item.id] ?? true}
                    />
                  </div>

                </div>

                {/* 제한 검증 */}
                {item.dropLines + item.mesoLines > 3 && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    한 아이템에는 최대 3줄까지만 가능합니다.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 계산 옵션 */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Toggle
                checked={realTimeCalculation}
                onChange={setRealTimeCalculation}
              />
              <span className="text-sm font-medium text-gray-700">실시간 계산</span>
            </div>
            {!realTimeCalculation && (
              <button
                onClick={calculate}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                <Calculator className="h-4 w-4" />
                계산하기
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 결과 표시 */}
      {results && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">손익분기 계산 결과</h2>

          {/* 경고 메시지 */}
          {results.warnings.length > 0 && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              {results.warnings.map((warning, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-yellow-800">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}

          {/* 개별 아이템 결과 */}
          <div className="space-y-4">
            {results.itemResults.map((result, index) => {
              const item = items.find(i => i.id === result.itemId)
              return (
                <div key={result.itemId} className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">
                    {item?.name || `아이템 ${index + 1}`}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">순 투자 비용:</span>
                      <span className="ml-2 font-medium">{result.netCost.toFixed(1)}억 메소</span>
                    </div>
                    <div>
                      <span className="text-gray-600">시간당 증가 수익:</span>
                      <span className="ml-2 font-medium">
                        {(result.increasePerHour / 10000).toFixed(0)}만 메소
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">손익분기 소재:</span>
                      <span className="ml-2 font-medium text-blue-600">
                        {result.breakEvenMaterials.toFixed(0)}소재
                      </span>
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                      <span className="text-gray-600">하루 {materialsPerDay}소재 기준:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {result.formattedPeriod}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* 전체 결과 */}
            {results.totalResult && items.length > 1 && (
              <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-blue-900 mb-2">전체 아이템 구매 시</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-700">총 순 투자 비용:</span>
                    <span className="ml-2 font-bold text-blue-900">
                      {results.totalResult.netCost.toFixed(1)}억 메소
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-700">시간당 총 증가 수익:</span>
                    <span className="ml-2 font-bold text-blue-900">
                      {(results.totalResult.increasePerHour / 10000).toFixed(0)}만 메소
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-700">손익분기 소재:</span>
                    <span className="ml-2 font-bold text-blue-600">
                      {results.totalResult.breakEvenMaterials.toFixed(0)}소재
                    </span>
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <span className="text-gray-700">하루 {materialsPerDay}소재 기준:</span>
                    <span className="ml-2 font-bold text-green-600">
                      {results.totalResult.formattedPeriod}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}