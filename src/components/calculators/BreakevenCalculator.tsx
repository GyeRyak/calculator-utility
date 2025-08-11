'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, AlertCircle, RotateCcw, Calculator } from 'lucide-react'
import { calculateBreakeven, type BreakevenItem, type BreakevenResult } from '@/utils/breakevenCalculations'
import { calculateDropItems, type DropItem, calculateNormalDropMultiplier, calculateLogDropMultiplier, SOL_ERDA_FRAGMENT_ID } from '@/utils/huntingExpectationCalculations'
import { 
  DEFAULT_ALL_DROP_ITEMS,
  GLOBAL_DEFAULTS,
  DEFAULT_BREAKEVEN_ITEM, 
  DEFAULT_BREAKEVEN_BASE_PARAMS, 
  DEFAULT_BREAKEVEN_VALUES 
} from '@/utils/defaults'
import { loadCalculatorSettings, canUseFunctionalCookies } from '@/utils/cookies'
import { type HuntingExpectationParams } from '@/utils/huntingExpectationCalculations'
import { calculateMesoBonus, calculateItemDropBonus, type MesoCalculationParams, type ItemDropCalculationParams } from '@/utils/bonusCalculations'
import NumberInput from '../ui/NumberInput'
import { RadioGroup, Toggle } from '../ui'
import AutoSlotManager from '../ui/AutoSlotManager'
import { useNotification } from '@/contexts/NotificationContext'
import { confirmSlotReset } from '@/utils/slotUtils'

interface BreakevenSettings {
  items: BreakevenItem[]
  materialsPerDay: number
  baseParams: HuntingExpectationParams
  realTimeCalculation: boolean
  wealthAcquisitionPotion: boolean
  currentDropFromPotential: number  // 현재 잠재능력 드롭률
  currentMesoFromPotential: number  // 현재 잠재능력 메소획득량
  otherDropBonus: number  // 재획비/잠재 제외 아이템 드롭률 (%)
  otherMesoBonus: number  // 재획비/잠재 제외 메소 획득량 (%)
  globalFeeRate: 3 | 5  // 전역 경매장 수수료
  linkedPrices?: { [itemId: string]: boolean }  // 구매가-판매가 연동 상태
  mesoLimitEnabled?: boolean  // 메소 제한 활성화 여부
  mesoLimitHours?: number     // 메소 제한 시간
  normalDropExpectation?: number  // 일반 드롭 100마리당 기댓값
  logDropExpectation?: number     // 로그 드롭 100마리당 기댓값
}

export function BreakevenCalculator() {
  const [mounted, setMounted] = useState(false)
  
  // 기본 계산기 슬롯 데이터 확인 함수
  const hasBasicSlotData = (slotNumber: number): boolean => {
    if (!canUseFunctionalCookies()) return false
    
    try {
      // 새 키 형식 확인
      const newKey = `basic_calculator_slot_${slotNumber}`
      if (localStorage.getItem(newKey) !== null) return true
      
      // 기존 키 형식 확인 (fallback)
      const oldKey = `cookie_settings_slot_${slotNumber}`
      return localStorage.getItem(oldKey) !== null
    } catch {
      return false
    }
  }
  
  // 기본 계산기 슬롯 데이터 로드 함수 (새 키 형식 지원)
  const loadBasicCalculatorSettings = (slotNumber: number): any | null => {
    if (!canUseFunctionalCookies()) return null
    
    try {
      // 새 키 형식 먼저 확인
      const newKey = `basic_calculator_slot_${slotNumber}`
      let settingsData = localStorage.getItem(newKey)
      
      // 새 키가 없으면 기존 키 확인
      if (!settingsData) {
        const oldKey = `cookie_settings_slot_${slotNumber}`
        settingsData = localStorage.getItem(oldKey)
      }
      
      if (!settingsData) return null
      return JSON.parse(settingsData)
    } catch (error) {
      console.error(`Failed to load basic calculator settings from slot ${slotNumber}:`, error)
      return null
    }
  }
  const { showNotification } = useNotification()
  
  
  // 기본값 (공유된 기본값 사용)

  // 기본 계산기의 기본값을 사용한 기댓값 계산 (전역 기본값에서 가져오기)
  const calculateDefaultExpectations = () => {
    return {
      normalExpectation: GLOBAL_DEFAULTS.normalDropExpectation,
      logExpectation: GLOBAL_DEFAULTS.logDropExpectation
    }
  }

  // 상태 (기본값 사용)
  const [items, setItems] = useState<BreakevenItem[]>(DEFAULT_BREAKEVEN_VALUES.items)
  const [materialsPerDay, setMaterialsPerDay] = useState(DEFAULT_BREAKEVEN_VALUES.materialsPerDay)
  const [globalFeeRate, setGlobalFeeRate] = useState<3 | 5>(DEFAULT_BREAKEVEN_VALUES.globalFeeRate)
  const [baseParams, setBaseParams] = useState<HuntingExpectationParams>(DEFAULT_BREAKEVEN_BASE_PARAMS)
  const [realTimeCalculation, setRealTimeCalculation] = useState(DEFAULT_BREAKEVEN_VALUES.realTimeCalculation)
  const [wealthAcquisitionPotion, setWealthAcquisitionPotion] = useState(DEFAULT_BREAKEVEN_VALUES.wealthAcquisitionPotion)
  const [currentDropFromPotential, setCurrentDropFromPotential] = useState(DEFAULT_BREAKEVEN_VALUES.currentDropFromPotential)
  const [currentMesoFromPotential, setCurrentMesoFromPotential] = useState(DEFAULT_BREAKEVEN_VALUES.currentMesoFromPotential)
  const [otherDropBonus, setOtherDropBonus] = useState(DEFAULT_BREAKEVEN_VALUES.otherDropBonus)
  const [otherMesoBonus, setOtherMesoBonus] = useState(DEFAULT_BREAKEVEN_VALUES.otherMesoBonus)
  const [results, setResults] = useState<{
    itemResults: BreakevenResult[]
    totalResult: BreakevenResult | null
    warnings: string[]
  } | null>(null)
  const [selectedBasicSlot, setSelectedBasicSlot] = useState<number | null>(null)
  const [manuallySelectedBasicSlot, setManuallySelectedBasicSlot] = useState(false)
  const [loadedBaseParams, setLoadedBaseParams] = useState<HuntingExpectationParams | null>(null)
  const [loadedExtraSettings, setLoadedExtraSettings] = useState<{
    wealthAcquisitionPotion: boolean
    currentDropFromPotential: number
    currentMesoFromPotential: number
    otherDropBonus: number
    otherMesoBonus: number
  } | null>(null)
  
  // 아이템별 구매가-판매가 연동 상태
  const [linkedPrices, setLinkedPrices] = useState<{ [itemId: string]: boolean }>({})
  
  // 메소 제한 설정
  const [mesoLimitEnabled, setMesoLimitEnabled] = useState(DEFAULT_BREAKEVEN_VALUES.mesoLimitEnabled)
  const [mesoLimitHours, setMesoLimitHours] = useState(DEFAULT_BREAKEVEN_VALUES.mesoLimitHours)
  
  // 드롭 아이템 기댓값 (드롭률 0% 기준)
  const [normalDropExpectation, setNormalDropExpectation] = useState(DEFAULT_BREAKEVEN_VALUES.normalDropExpectation)
  const [logDropExpectation, setLogDropExpectation] = useState(DEFAULT_BREAKEVEN_VALUES.logDropExpectation)
  
  // 기본 기댓값 계산
  const defaultExpectations = calculateDefaultExpectations()

  // 현재 설정을 객체로 반환
  const getCurrentData = () => ({
    items,
    materialsPerDay,
    globalFeeRate,
    baseParams,
    realTimeCalculation,
    wealthAcquisitionPotion,
    currentDropFromPotential,
    currentMesoFromPotential,
    otherDropBonus,
    otherMesoBonus,
    selectedBasicSlot,
    manuallySelectedBasicSlot,
    mesoLimitEnabled,
    mesoLimitHours,
    normalDropExpectation,
    logDropExpectation,
    linkedPrices
  })

  // 데이터를 로드하는 함수
  const loadData = (data: any, onComplete?: () => void) => {
    if (data.items) setItems(data.items)
    if (data.materialsPerDay !== undefined) setMaterialsPerDay(data.materialsPerDay)
    if (data.globalFeeRate) setGlobalFeeRate(data.globalFeeRate)
    if (data.baseParams) setBaseParams(data.baseParams)
    if (data.realTimeCalculation !== undefined) setRealTimeCalculation(data.realTimeCalculation)
    if (data.wealthAcquisitionPotion !== undefined) setWealthAcquisitionPotion(data.wealthAcquisitionPotion)
    if (data.currentDropFromPotential !== undefined) setCurrentDropFromPotential(data.currentDropFromPotential)
    if (data.currentMesoFromPotential !== undefined) setCurrentMesoFromPotential(data.currentMesoFromPotential)
    if (data.otherDropBonus !== undefined) setOtherDropBonus(data.otherDropBonus)
    if (data.otherMesoBonus !== undefined) setOtherMesoBonus(data.otherMesoBonus)
    if (data.selectedBasicSlot !== undefined) setSelectedBasicSlot(data.selectedBasicSlot)
    if (data.manuallySelectedBasicSlot !== undefined) setManuallySelectedBasicSlot(data.manuallySelectedBasicSlot)
    if (data.mesoLimitEnabled !== undefined) setMesoLimitEnabled(data.mesoLimitEnabled)
    if (data.mesoLimitHours !== undefined) setMesoLimitHours(data.mesoLimitHours)
    if (data.normalDropExpectation !== undefined) setNormalDropExpectation(data.normalDropExpectation)
    if (data.logDropExpectation !== undefined) setLogDropExpectation(data.logDropExpectation)
    if (data.linkedPrices) setLinkedPrices(data.linkedPrices)

    // 로드 완료 콜백 호출
    if (onComplete) {
      requestAnimationFrame(() => {
        onComplete()
      })
    }
  }


  // 아이템 추가
  const addItem = () => {
    const newItemId = Date.now().toString()
    setItems([...items, { ...DEFAULT_BREAKEVEN_ITEM, id: newItemId }])
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
    const isCurrentlyLinked = linkedPrices[id]
    setLinkedPrices({ ...linkedPrices, [id]: !isCurrentlyLinked })
    
    // 연동이 활성화될 때 판매 가격을 구매 가격과 동일하게 설정
    if (!isCurrentlyLinked) {
      const item = items.find(item => item.id === id)
      if (item) {
        updateItem(id, 'sellPrice', item.purchasePrice)
      }
    }
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
      otherDropBonus,
      otherMesoBonus,
      globalFeeRate,
      mesoLimitEnabled,
      mesoLimitHours,
      normalDropExpectation,
      logDropExpectation
    })
    setResults(result)
  }, [items, materialsPerDay, baseParams, wealthAcquisitionPotion, currentDropFromPotential, currentMesoFromPotential, otherDropBonus, otherMesoBonus, globalFeeRate, mesoLimitEnabled, mesoLimitHours, normalDropExpectation, logDropExpectation])

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
        baseParams.feeRate !== loadedBaseParams.feeRate ||
        wealthAcquisitionPotion !== loadedExtraSettings.wealthAcquisitionPotion ||
        currentDropFromPotential !== loadedExtraSettings.currentDropFromPotential ||
        currentMesoFromPotential !== loadedExtraSettings.currentMesoFromPotential ||
        otherDropBonus !== loadedExtraSettings.otherDropBonus ||
        otherMesoBonus !== loadedExtraSettings.otherMesoBonus
      
      if (hasChanged) {
        setSelectedBasicSlot(null)
        setLoadedBaseParams(null)
        setLoadedExtraSettings(null)
      }
    }
  }, [baseParams, loadedBaseParams, loadedExtraSettings, manuallySelectedBasicSlot, 
      wealthAcquisitionPotion, currentDropFromPotential, currentMesoFromPotential, otherDropBonus, otherMesoBonus])

  // 기본 계산기 슬롯 데이터 불러오기
  const loadFromSlot = (slotNumber: number) => {
    const settings = loadBasicCalculatorSettings(slotNumber)
    if (settings) {
      // 메획 계산 (기본 계산기 함수 활용)
      const mesoParams: MesoCalculationParams = {
        inputMode: settings.mesoInputMode || 'detail',
        directValue: settings.mesoBonus || 0,
        globalBuffMode: settings.globalBuffMode || 'legion',
        legionBuff: settings.mesoLegionBuff ?? false,
        phantomLegionMeso: settings.phantomLegionMeso || 0,
        potentialMode: settings.mesoPotentialMode || 'lines',
        potentialLines: settings.mesoPotentialLines || 0,
        potentialDirect: settings.mesoPotentialDirect || 0,
        ability: settings.mesoAbility || 0,
        artifactMode: settings.mesoArtifactMode || 'level',
        artifactLevel: settings.mesoArtifactLevelInput || 0,
        artifactPercent: settings.mesoArtifactPercentInput || 0,
        tallahartSymbolLevel: 0,
        wealthAcquisitionPotion: settings.wealthAcquisitionPotion ?? false,
        otherBuff: 0,
        otherNonBuff: 0,
        characterLevel: settings.characterLevel || 275,
        monsterLevel: settings.monsterLevel || settings.mobLevel || 275
      }
      const mesoResult = calculateMesoBonus(mesoParams)
      const calculatedMesoBonus = mesoResult.totalBonus
      
      // 잠재능력에서 메소 보너스 추출
      const potentialMesoBonus = (settings.mesoPotentialMode === 'lines') 
        ? settings.mesoPotentialLines * 20 
        : settings.mesoPotentialDirect || 0
        
      // 재획비 제외한 전체 보너스에서 잠재 제외
      let otherMesoFromCalculated = 0
      if (settings.wealthAcquisitionPotion) {
        // 재획비 적용된 경우: (100 + 전체보너스) / 1.2 - 100 에서 잠재 빼면 나머지
        const beforeWealth = (100 + calculatedMesoBonus) / 1.2 - 100
        otherMesoFromCalculated = Math.max(0, beforeWealth - potentialMesoBonus)
      } else {
        // 재획비 없는 경우: 전체에서 잠재만 빼면 됨
        otherMesoFromCalculated = Math.max(0, calculatedMesoBonus - potentialMesoBonus)
      }
      
      // 아드 계산 (기본 계산기 함수 활용)
      const dropRateParams: ItemDropCalculationParams = {
        inputMode: settings.dropRateInputMode || settings.itemDropInputMode || 'detail',
        directValue: settings.dropRate || settings.itemDropBonus || 0,
        globalBuffMode: settings.globalBuffMode || 'legion',
        legionBuff: settings.dropRateLegionBuff ?? false,
        potentialMode: settings.dropRatePotentialMode || 'lines',
        potentialLines: settings.dropRatePotentialLines || 0,
        potentialDirect: settings.dropRatePotentialDirect || 0,
        ability: settings.dropRateAbility || 0,
        artifactMode: settings.dropRateArtifactMode || 'level',
        artifactLevel: settings.dropRateArtifactLevelInput || 0,
        artifactPercent: settings.dropRateArtifactPercentInput || 0,
        holySymbol: settings.holySymbol ?? false,
        decentHolySymbol: settings.decentHolySymbol ?? false,
        decentHolySymbolLevel: settings.decentHolySymbolLevel ?? 30,
        tallahartSymbolLevel: 0,
        pcRoomMode: false,
        wealthAcquisitionPotion: settings.wealthAcquisitionPotion ?? false,
        otherBuff: 0,
        otherNonBuff: 0
      }
      const dropRateResult = calculateItemDropBonus(dropRateParams)
      const calculatedDropRate = dropRateResult.totalBonus
      
      // 잠재능력에서 드롭률 보너스 추출
      const potentialDropBonus = (settings.dropRatePotentialMode === 'lines') 
        ? settings.dropRatePotentialLines * 20 
        : settings.dropRatePotentialDirect || 0
        
      // 재획비/잠재 제외한 드롭률 계산
      let otherDropFromCalculated = calculatedDropRate - potentialDropBonus
      if (settings.wealthAcquisitionPotion) {
        otherDropFromCalculated -= 20  // 재획비 드롭률 20% 제외
      }
      otherDropFromCalculated = Math.max(0, otherDropFromCalculated)
      
      // 시간당 몬스터 수 계산
      // 기본 계산기는 huntTime(분) 동안의 monsterCount를 저장
      const huntTime = settings.huntTime ?? 0.125
      const monsterCount = settings.monsterCount ?? 39
      const monstersPerMinute = monsterCount / huntTime
      const monstersPer6Minutes = Math.round(monstersPerMinute * 6)
      const totalMonstersPerHour = monstersPerMinute * 60
      
      // 현재 잠재능력 드롭률/메소획득량 설정
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
      
      // 기본 매개변수 설정 (기댓값 계산기의 원본 몬스터/캐릭터 레벨만 사용)
      setBaseParams({
        monsterLevel: settings.monsterLevel ?? settings.mobLevel ?? 275,
        totalMonsters: totalMonstersPerHour,
        mesoBonus: 0,  // 이제 메소/드롭률은 분리해서 관리
        dropRate: 0,   
        feeRate: settings.feeRate ?? 3,
        characterLevel: settings.characterLevel ?? 275
      })
      
      // 경매장 수수료 설정
      setGlobalFeeRate((settings.feeRate ?? 3) as 3 | 5)
      
      // 재물 획득의 비약 및 잠재능력 설정
      setWealthAcquisitionPotion(settings.wealthAcquisitionPotion ?? false)
      setCurrentDropFromPotential(potentialDrop)
      setCurrentMesoFromPotential(potentialMeso)
      
      // 재획비/잠재 제외 보너스 설정
      setOtherMesoBonus(otherMesoFromCalculated)
      setOtherDropBonus(otherDropFromCalculated)
      
      // 드롭 아이템 기댓값 계산 (드롭률 0% 기준)
      let normalExpectation = 0
      let logExpectation = 0
      
      
      // normalDropItems와 logDropItems가 있으면 사용
      if (settings.normalDropItems && Array.isArray(settings.normalDropItems)) {
        normalExpectation = settings.normalDropItems.reduce((sum: number, item: any) => {
          const price = item.price ? item.price * 10000 : 0 // 만 메소 단위
          const dropRate = item.dropRate || 0 // % 단위
          const directUse = item.directUse || false // 탈세 여부
          const feeRate = directUse ? 0 : (settings.feeRate || 3) // 탈세면 수수료 0%
          
          // 100마리당 기댓값 계산: 드롭률(드롭률 0% 기준) * 가격 * 100마리 * (1-수수료)
          const baseExpectation = Math.floor(dropRate * price * (1 - feeRate / 100)) // 소숫점 미만 절삭
          return sum + baseExpectation
        }, 0)
      }
      
      if (settings.logDropItems && Array.isArray(settings.logDropItems)) {
        logExpectation = settings.logDropItems.reduce((sum: number, item: any) => {
          const price = item.price ? item.price * 10000 : 0 // 만 메소 단위
          const dropRate = item.dropRate || 0 // % 단위
          const directUse = item.directUse || false // 탈세 여부
          const feeRate = directUse ? 0 : (settings.feeRate || 3) // 탈세면 수수료 0%
          
          // 100마리당 기댓값 계산: 드롭률(드롭률 0% 기준) * 가격 * 100마리 * (1-수수료)
          const baseExpectation = Math.floor(dropRate * price * (1 - feeRate / 100)) // 소숫점 미만 절삭
          return sum + baseExpectation
        }, 0)
      }
      
      // 솔 에르다 조각 별도 계산 (저장된 solErdaFragment 데이터 활용)
      if (settings.solErdaFragment) {
        const solErda = settings.solErdaFragment
        const price = solErda.price ? solErda.price * 10000 : 0 // 만 메소 단위
        const dropRate = solErda.dropRate || 0 // % 단위
        const directUse = solErda.directUse || false // 탈세 여부
        const feeRate = directUse ? 0 : (settings.feeRate || 3) // 탈세면 수수료 0%
        
        // 100마리당 기댓값 계산
        const solErdaExpectation = Math.floor(dropRate * price * (1 - feeRate / 100)) // 소숫점 미만 절삭
        logExpectation += solErdaExpectation
      }
      
      setNormalDropExpectation(normalExpectation)
      setLogDropExpectation(logExpectation)
      
      // 불러온 기본 매개변수 저장 (새로운 분리 방식)
      const newBaseParams = {
        monsterLevel: settings.monsterLevel ?? settings.mobLevel ?? 275,
        totalMonsters: totalMonstersPerHour,
        mesoBonus: 0,  // 분리 관리
        dropRate: 0,   // 분리 관리
        feeRate: settings.feeRate ?? 3
      }
      setLoadedBaseParams(newBaseParams)
      
      // 불러온 추가 설정 저장 (새 필드 포함)
      setLoadedExtraSettings({
        wealthAcquisitionPotion: settings.wealthAcquisitionPotion ?? false,
        currentDropFromPotential: potentialDrop,
        currentMesoFromPotential: potentialMeso,
        otherDropBonus: otherDropFromCalculated,
        otherMesoBonus: otherMesoFromCalculated
      })
      
      setSelectedBasicSlot(slotNumber)
      setManuallySelectedBasicSlot(true)
      showNotification('success', `기본 계산기 "${settings.slotName || `슬롯 ${slotNumber}`}" 데이터를 불러왔습니다.`)
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
    otherDropBonus,
    otherMesoBonus,
    globalFeeRate,
    linkedPrices,
    mesoLimitEnabled,
    mesoLimitHours,
    normalDropExpectation,
    logDropExpectation
  })


  // 초기화
  const resetAllData = () => {
    setItems(DEFAULT_BREAKEVEN_VALUES.items)
    setMaterialsPerDay(DEFAULT_BREAKEVEN_VALUES.materialsPerDay)
    setBaseParams(DEFAULT_BREAKEVEN_BASE_PARAMS)
    setRealTimeCalculation(DEFAULT_BREAKEVEN_VALUES.realTimeCalculation)
    setWealthAcquisitionPotion(DEFAULT_BREAKEVEN_VALUES.wealthAcquisitionPotion)
    setCurrentDropFromPotential(DEFAULT_BREAKEVEN_VALUES.currentDropFromPotential)
    setCurrentMesoFromPotential(DEFAULT_BREAKEVEN_VALUES.currentMesoFromPotential)
    setOtherDropBonus(DEFAULT_BREAKEVEN_VALUES.otherDropBonus)
    setOtherMesoBonus(DEFAULT_BREAKEVEN_VALUES.otherMesoBonus)
    setGlobalFeeRate(DEFAULT_BREAKEVEN_VALUES.globalFeeRate)
    setLinkedPrices(DEFAULT_BREAKEVEN_VALUES.linkedPrices)
    setMesoLimitEnabled(DEFAULT_BREAKEVEN_VALUES.mesoLimitEnabled)
    setMesoLimitHours(DEFAULT_BREAKEVEN_VALUES.mesoLimitHours)
    setNormalDropExpectation(defaultExpectations.normalExpectation)
    setLogDropExpectation(defaultExpectations.logExpectation)
    setResults(null)
    setSelectedBasicSlot(null)
  }

  // 컴포넌트 마운트 시 초기 설정
  useEffect(() => {
    setMounted(true)
    
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
      <AutoSlotManager
        calculatorId="breakeven_calculator"
        maxSlots={3}
        getCurrentData={getCurrentData}
        loadData={loadData}
        onReset={resetAllData}
        onNotification={(type, message) => showNotification(type, message)}
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
                setBaseParams(DEFAULT_BREAKEVEN_BASE_PARAMS)
                setWealthAcquisitionPotion(DEFAULT_BREAKEVEN_VALUES.wealthAcquisitionPotion)
                setCurrentDropFromPotential(DEFAULT_BREAKEVEN_VALUES.currentDropFromPotential)
                setCurrentMesoFromPotential(DEFAULT_BREAKEVEN_VALUES.currentMesoFromPotential)
                setOtherDropBonus(DEFAULT_BREAKEVEN_VALUES.otherDropBonus)
                setOtherMesoBonus(DEFAULT_BREAKEVEN_VALUES.otherMesoBonus)
                setGlobalFeeRate(DEFAULT_BREAKEVEN_VALUES.globalFeeRate)
                setNormalDropExpectation(defaultExpectations.normalExpectation)
                setLogDropExpectation(defaultExpectations.logExpectation)
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
                disabled={!hasBasicSlotData(slot)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  selectedBasicSlot === slot && manuallySelectedBasicSlot
                    ? 'bg-green-500 text-white'
                    : hasBasicSlotData(slot)
                    ? 'bg-gray-200 hover:bg-gray-300'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
{(() => {
                  const basicSettings = loadBasicCalculatorSettings(slot);
                  return basicSettings?.slotName || `슬롯 ${slot}`;
                })()}
                {!hasBasicSlotData(slot) && ' (비어있음)'}
              </button>
            ))}
          </div>
        </div>
        {/* 기본 매개변수 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">캐릭터 레벨</label>
            <NumberInput
              value={baseParams.characterLevel ?? 275}
              onChange={(value) => setBaseParams({ ...baseParams, characterLevel: value })}
              min={1}
              max={300}
              step={1}
            />
          </div>
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
            <label 
              className="block text-sm font-medium text-gray-700 mb-1 cursor-help" 
              title="아이템 드롭률 0%를 기준으로 한 기댓값입니다. 직접 입력하기보다는 사냥 기댓값 계산기에서 계산한 값을 가져오는 것을 권장합니다."
            >
              일반 드롭 100마리당 기댓값 (메소)
            </label>
            <NumberInput
              value={normalDropExpectation}
              onChange={setNormalDropExpectation}
              min={0}
              step={1000}
              placeholder="0"
            />
          </div>
          <div>
            <label 
              className="block text-sm font-medium text-gray-700 mb-1 cursor-help" 
              title="아이템 드롭률 0%를 기준으로 한 기댓값입니다. 직접 입력하기보다는 사냥 기댓값 계산기에서 계산한 값을 가져오는 것을 권장합니다."
            >
              로그 드롭 100마리당 기댓값 (메소)
            </label>
            <NumberInput
              value={logDropExpectation}
              onChange={setLogDropExpectation}
              min={0}
              step={1000}
              placeholder="0"
            />
          </div>
        </div>
        
        {/* 잠재능력 및 재획비 설정 */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              현재 잠재능력 아이템 드롭률 (%)
            </label>
            <NumberInput
              value={currentDropFromPotential}
              onChange={setCurrentDropFromPotential}
              min={0}
              max={200}
              step={20}
              placeholder="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              재획비/잠재 제외 드롭률 (%)
            </label>
            <NumberInput
              value={otherDropBonus}
              onChange={setOtherDropBonus}
              min={0}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              현재 잠재능력 메소 획득량 (%)
            </label>
            <NumberInput
              value={currentMesoFromPotential}
              onChange={setCurrentMesoFromPotential}
              min={0}
              max={100}
              step={20}
              placeholder="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              재획비/잠재 제외 메소 획득량 (%)
            </label>
            <NumberInput
              value={otherMesoBonus}
              onChange={setOtherMesoBonus}
              min={0}
              placeholder="0"
            />
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
              <div className="flex items-center gap-2">
                <NumberInput
                  value={materialsPerDay}
                  onChange={setMaterialsPerDay}
                  min={1}
                  max={48}
                  step={1}
                  disabled={mesoLimitEnabled}
                />
                <label className="flex items-center text-sm text-gray-600 cursor-pointer whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={mesoLimitEnabled}
                    onChange={(e) => setMesoLimitEnabled(e.target.checked)}
                    className="mr-1 h-3 w-3"
                  />
                  메소 제한
                </label>
              </div>
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
          <h2 className="text-xl font-semibold">아이템 드롭률/메소 획득량 증가 아이템</h2>
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
                      아이템 드롭률 증가 (줄)
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
                      step={1}
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
                      step={1}
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
                      <span className="text-gray-600">
                        {mesoLimitEnabled ? 
                          `메소 제한 기준:` : 
                          `하루 ${materialsPerDay}소재 기준:`
                        }
                      </span>
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
                    <span className="text-gray-700">
                      {mesoLimitEnabled ? 
                        `메소 제한 기준:` : 
                        `하루 ${materialsPerDay}소재 기준:`
                      }
                    </span>
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