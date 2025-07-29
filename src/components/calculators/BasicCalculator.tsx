'use client'

import { useState, useEffect, useMemo } from 'react'
import { Save, RotateCcw, AlertCircle, Trash2 } from 'lucide-react'
import { calculateHuntingExpectation, getMesoCalculationDetails, getSolErdaFragmentCalculationDetails, type HuntingExpectationParams } from '../../utils/huntingExpectationCalculations'
import { saveCalculatorSettings, loadCalculatorSettings, canUseFunctionalCookies, hasSlotData, clearCalculatorSettings } from '../../utils/cookies'
import NumberInput from '../ui/NumberInput'
import { ToggleButton, RadioGroup, RadioGroupWithInput } from '../ui'



interface CalculationResult {
  baseMeso: number
  solErdaCount: number
  solErdaProfit: number
  totalIncome: number
  totalMeso: number
  mesoDropRate: number
  solErdaDropRate: number
  mesoPerDrop: number
  wealthAcquisitionPotionCount: number
  wealthAcquisitionPotionCost: number
  totalMesoPerHour: number
  totalMesoWithoutPotion: number
}

interface CalculationInputs {
  monsterLevel: number
  mesoBonus: number
  dropRate: number
  huntTime: number
  monsterCount: number
  resultTime: number
  solErdaFragmentPrice: number
  feeRate: number
  isCustomHuntTime: boolean
  huntTimeUnit: string
  customHuntTimeValue: number
  isCustomResultTime: boolean
  resultTimeUnit: string
  customResultTimeValue: number
  mesoInputMode: string
  dropRateInputMode: string
  mesoUnionBuff: boolean
  phantomUnionMeso: number
  mesoPotentialMode: string
  mesoPotentialLines: number
  mesoPotentialDirect: number
  mesoAbility: number
  globalBuffMode: string
  mesoArtifactLevel: number
  mesoArtifactMode: string
  mesoArtifactLevelInput: number
  mesoArtifactPercentInput: number
  dropRateUnionBuff: boolean
  dropRatePotentialMode: string
  dropRatePotentialLines: number
  dropRatePotentialDirect: number
  dropRateAbility: number
  dropRateArtifactLevel: number
  dropRateArtifactMode: string
  dropRateArtifactLevelInput: number
  dropRateArtifactPercentInput: number
  holySymbol: boolean
  usefulHolySymbol: boolean
  usefulHolySymbolLevel: number
  wealthAcquisitionPotion: boolean
  showWealthPotionCost: boolean
  wealthAcquisitionPotionPrice: number
  spottingSmallChange: boolean
  spottingSmallChangeLevel: number
}

export function BasicCalculator() {
  // 설정 저장/복원 상태
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [showSaveError, setShowSaveError] = useState(false)
  const [currentSlot, setCurrentSlot] = useState(1)
  const [slotNames, setSlotNames] = useState<{[key: number]: string}>({
    1: '슬롯 1',
    2: '슬롯 2', 
    3: '슬롯 3'
  })
  const [tempSlotName, setTempSlotName] = useState<string>('') // 임시 슬롯 이름
  const [lastSavedInputs, setLastSavedInputs] = useState<{[key: number]: CalculationInputs | null}>({
    1: null,
    2: null,
    3: null
  }) // 슬롯별 마지막 저장된 입력값
  const [lastSavedSlotNames, setLastSavedSlotNames] = useState<{[key: number]: string}>({
    1: '슬롯 1',
    2: '슬롯 2',
    3: '슬롯 3'
  }) // 슬롯별 마지막 저장된 이름
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false) // 미저장 경고 모달
  const [pendingSlotNumber, setPendingSlotNumber] = useState<number | null>(null) // 전환 대기 중인 슬롯 번호
  const [slotHasData, setSlotHasData] = useState<{[key: number]: boolean}>({
    1: false,
    2: false,
    3: false
  })
  const [mounted, setMounted] = useState(false)
  
  // 입력 상태
  const [monsterLevel, setMonsterLevel] = useState<number>(275)
  const [mesoBonus, setMesoBonus] = useState<number>(40)
  const [dropRate, setDropRate] = useState<number>(60)
  
  // 입력 방식 선택
  const [mesoInputMode, setMesoInputMode] = useState<'direct' | 'detail'>('detail')
  const [dropRateInputMode, setDropRateInputMode] = useState<'direct' | 'detail'>('detail')
  
  // 메소 획득량 상세 옵션
  const [mesoUnionBuff, setMesoUnionBuff] = useState<boolean>(false) // 유니온의 부
  const [phantomUnionMeso, setPhantomUnionMeso] = useState<number>(4) // 팬텀 유니온 (0~5%, 기본 4%)
  const [mesoPotentialMode, setMesoPotentialMode] = useState<'lines' | 'direct'>('lines')
  const [mesoPotentialLines, setMesoPotentialLines] = useState<number>(0)
  const [mesoPotentialDirect, setMesoPotentialDirect] = useState<number>(0)
  const [mesoAbility, setMesoAbility] = useState<number>(20)
  const [globalBuffMode, setGlobalBuffMode] = useState<'none' | 'challenger' | 'union'>('union')
  const [mesoArtifactLevel, setMesoArtifactLevel] = useState<number>(10)
  const [mesoArtifactMode, setMesoArtifactMode] = useState<'level' | 'direct'>('level')
  const [mesoArtifactLevelInput, setMesoArtifactLevelInput] = useState<number>(10)
  const [mesoArtifactPercentInput, setMesoArtifactPercentInput] = useState<number>(12)
  const [dropRateUnionBuff, setDropRateUnionBuff] = useState<boolean>(false) // 유니온의 행운
  const [dropRatePotentialMode, setDropRatePotentialMode] = useState<'lines' | 'direct'>('lines')
  const [dropRatePotentialLines, setDropRatePotentialLines] = useState<number>(0) // Drop Rate 0줄
  const [dropRatePotentialDirect, setDropRatePotentialDirect] = useState<number>(0) 
  const [dropRateAbility, setDropRateAbility] = useState<number>(15) // 유니크 15%
  const [dropRateArtifactLevel, setDropRateArtifactLevel] = useState<number>(10)
  const [dropRateArtifactMode, setDropRateArtifactMode] = useState<'level' | 'direct'>('level')
  const [dropRateArtifactLevelInput, setDropRateArtifactLevelInput] = useState<number>(10)
  const [dropRateArtifactPercentInput, setDropRateArtifactPercentInput] = useState<number>(12)
  const [holySymbol, setHolySymbol] = useState<boolean>(false)
  const [usefulHolySymbol, setUsefulHolySymbol] = useState<boolean>(true)
  const [usefulHolySymbolLevel, setUsefulHolySymbolLevel] = useState<number>(30)
  
  // Spotting Small Change
  const [spottingSmallChange, setSpottingSmallChange] = useState<boolean>(true)
  const [spottingSmallChangeLevel, setSpottingSmallChangeLevel] = useState<number>(4)
  
  // Wealth Acquisition Potion
  const [wealthAcquisitionPotion, setWealthAcquisitionPotion] = useState<boolean>(true)
  // 상태 추가 (컴포넌트 상단)
  const [showWealthPotionCost, setShowWealthPotionCost] = useState<boolean>(true)
  const [wealthAcquisitionPotionPrice, setWealthAcquisitionPotionPrice] = useState<number>(300) // 만 메소

  // 사냥 정보
  const [huntTime, setHuntTime] = useState<number>(0.125) // 1젠 = 7.5초 = 0.125분
  const [isCustomHuntTime, setIsCustomHuntTime] = useState<boolean>(false)
  const [huntTimeUnit, setHuntTimeUnit] = useState<'seconds' | 'minutes' | 'hours' | 'mini_wealth' | 'full_wealth' | 'gen'>('gen')
  const [customHuntTimeValue, setCustomHuntTimeValue] = useState<number>(1)
  const [monsterCount, setMonsterCount] = useState<number>(39)
  const [resultTime, setResultTime] = useState<number>(30) // 분
  const [isCustomResultTime, setIsCustomResultTime] = useState<boolean>(false)
  const [resultTimeUnit, setResultTimeUnit] = useState<'seconds' | 'minutes' | 'hours' | 'mini_wealth' | 'full_wealth' | 'gen'>('minutes')
  const [customResultTimeValue, setCustomResultTimeValue] = useState<number>(30)
  const [solErdaFragmentPrice, setSolErdaFragmentPrice] = useState<number>(600) // 만 메소
  const [feeRate, setFeeRate] = useState<number>(3) // %
  
  // 자동 연산 토글
  const [autoCalculate, setAutoCalculate] = useState<boolean>(true)
  
  // 계산된 결과 및 계산 시점의 입력값
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [calculatedInputs, setCalculatedInputs] = useState<CalculationInputs | null>(null)
  
  // 설정 저장/복원 함수
  const saveSettings = (slotNumber: number = currentSlot) => {
    if (!canUseFunctionalCookies()) {
      setShowSaveError(true)
      setTimeout(() => setShowSaveError(false), 3000)
      return
    }
    
    const settings = {
      monsterLevel,
      mesoBonus,
      dropRate,
      mesoInputMode,
      dropRateInputMode,
      mesoUnionBuff,
      phantomUnionMeso,
      mesoPotentialMode,
      mesoPotentialLines,
      mesoPotentialDirect,
      mesoAbility,
      globalBuffMode,
      mesoArtifactLevel,
      mesoArtifactMode,
      mesoArtifactLevelInput,
      mesoArtifactPercentInput,
      dropRateUnionBuff,
      dropRatePotentialMode,
      dropRatePotentialLines,
      dropRatePotentialDirect,
      dropRateAbility,
      dropRateArtifactLevel,
      dropRateArtifactMode,
      dropRateArtifactLevelInput,
      dropRateArtifactPercentInput,
      holySymbol,
      usefulHolySymbol,
      usefulHolySymbolLevel,
      wealthAcquisitionPotion,
      spottingSmallChange,
      spottingSmallChangeLevel,
      huntTime,
      isCustomHuntTime,
      huntTimeUnit,
      customHuntTimeValue,
      monsterCount,
      resultTime,
      isCustomResultTime,
      resultTimeUnit,
      customResultTimeValue,
      solErdaFragmentPrice,
      feeRate,
      showWealthPotionCost,
      wealthAcquisitionPotionPrice,
      autoCalculate,
      slotName: slotNames[slotNumber]
    }
    
    if (saveCalculatorSettings(settings, slotNumber)) {
      setSlotHasData(prev => ({
        ...prev,
        [slotNumber]: true
      }))
      // 저장 성공 시 마지막 저장된 입력값 및 슬롯 이름 업데이트
      // settings 객체에서 실제 저장된 값들을 사용
      const actualSavedInputs: CalculationInputs = {
        monsterLevel: settings.monsterLevel,
        mesoBonus: settings.mesoBonus,
        dropRate: settings.dropRate,
        huntTime: settings.huntTime,
        monsterCount: settings.monsterCount,
        resultTime: settings.resultTime,
        solErdaFragmentPrice: settings.solErdaFragmentPrice,
        feeRate: settings.feeRate,
        isCustomHuntTime: settings.isCustomHuntTime,
        huntTimeUnit: settings.huntTimeUnit,
        customHuntTimeValue: settings.customHuntTimeValue,
        isCustomResultTime: settings.isCustomResultTime,
        resultTimeUnit: settings.resultTimeUnit,
        customResultTimeValue: settings.customResultTimeValue,
        mesoInputMode: settings.mesoInputMode,
        dropRateInputMode: settings.dropRateInputMode,
        mesoUnionBuff: settings.mesoUnionBuff,
        phantomUnionMeso: settings.phantomUnionMeso,
        mesoPotentialMode: settings.mesoPotentialMode,
        mesoPotentialLines: settings.mesoPotentialLines,
        mesoPotentialDirect: settings.mesoPotentialDirect,
        mesoAbility: settings.mesoAbility,
        globalBuffMode: settings.globalBuffMode,
        mesoArtifactLevel: settings.mesoArtifactLevel,
        dropRateUnionBuff: settings.dropRateUnionBuff,
        dropRatePotentialMode: settings.dropRatePotentialMode,
        dropRatePotentialLines: settings.dropRatePotentialLines,
        dropRatePotentialDirect: settings.dropRatePotentialDirect,
        dropRateAbility: settings.dropRateAbility,
        dropRateArtifactLevel: settings.dropRateArtifactLevel,
        holySymbol: settings.holySymbol,
        usefulHolySymbol: settings.usefulHolySymbol,
        usefulHolySymbolLevel: settings.usefulHolySymbolLevel,
        wealthAcquisitionPotion: settings.wealthAcquisitionPotion,
        mesoArtifactMode: settings.mesoArtifactMode,
        mesoArtifactLevelInput: settings.mesoArtifactLevelInput,
        mesoArtifactPercentInput: settings.mesoArtifactPercentInput,
        dropRateArtifactMode: settings.dropRateArtifactMode,
        dropRateArtifactLevelInput: settings.dropRateArtifactLevelInput,
        dropRateArtifactPercentInput: settings.dropRateArtifactPercentInput,
        showWealthPotionCost: settings.showWealthPotionCost,
        wealthAcquisitionPotionPrice: settings.wealthAcquisitionPotionPrice,
        spottingSmallChange: settings.spottingSmallChange,
        spottingSmallChangeLevel: settings.spottingSmallChangeLevel
      }
      
      console.log('저장 시 actualSavedInputs:', actualSavedInputs)
      setLastSavedInputs(prev => ({
        ...prev,
        [slotNumber]: actualSavedInputs
      }))
      setLastSavedSlotNames(prev => ({
        ...prev,
        [slotNumber]: slotNames[slotNumber]
      }))
      setShowSaveSuccess(true)
      setTimeout(() => setShowSaveSuccess(false), 3000)
    } else {
      setShowSaveError(true)
      setTimeout(() => setShowSaveError(false), 3000)
    }
  }
  
  const loadSettings = (slotNumber: number = currentSlot) => {
    if (!canUseFunctionalCookies()) {
      return
    }
    
    const settings = loadCalculatorSettings(slotNumber)
    
    if (!settings) {
      // 슬롯이 비어있으면 기본값으로 초기화
      setCurrentSlot(slotNumber)
      setTempSlotName(slotNames[slotNumber] || `슬롯 ${slotNumber}`)
      
      // 기본값으로 초기화
      setMonsterLevel(275)
      setMesoBonus(40)
      setDropRate(60)
      setMesoInputMode('detail')
      setDropRateInputMode('detail')
      setMesoUnionBuff(false)
      setPhantomUnionMeso(4)
      setMesoPotentialMode('lines')
      setMesoPotentialLines(0)
      setMesoPotentialDirect(0)
      setMesoAbility(20)
      setGlobalBuffMode('union')
      setMesoArtifactLevel(10)
      setMesoArtifactMode('level')
      setMesoArtifactLevelInput(10)
      setMesoArtifactPercentInput(12)
      setDropRateUnionBuff(false)
      setDropRatePotentialMode('lines')
      setDropRatePotentialLines(0)
      setDropRatePotentialDirect(0)
      setDropRateAbility(15)
      setDropRateArtifactLevel(10)
      setDropRateArtifactMode('level')
      setDropRateArtifactLevelInput(10)
      setDropRateArtifactPercentInput(12)
      setHolySymbol(false)
      setUsefulHolySymbol(true)
      setUsefulHolySymbolLevel(30)
      setWealthAcquisitionPotion(true)
      setSpottingSmallChange(true)
      setSpottingSmallChangeLevel(4)
      setHuntTime(0.125)
      setIsCustomHuntTime(false)
      setHuntTimeUnit('gen')
      setCustomHuntTimeValue(1)
      setMonsterCount(39)
      setResultTime(30)
      setIsCustomResultTime(false)
      setResultTimeUnit('minutes')
      setCustomResultTimeValue(30)
      setSolErdaFragmentPrice(600)
      setFeeRate(3)
      setShowWealthPotionCost(true)
      setWealthAcquisitionPotionPrice(300)
      setAutoCalculate(true)
      
      // 빈 슬롯의 기본값으로 lastSavedInputs 설정
      const defaultInputs: CalculationInputs = {
        monsterLevel: 275,
        mesoBonus: 40,
        dropRate: 60,
        huntTime: 0.125,
        monsterCount: 39,
        resultTime: 30,
        solErdaFragmentPrice: 600,
        feeRate: 3,
        isCustomHuntTime: false,
        huntTimeUnit: 'minutes',
        customHuntTimeValue: 7.5,
        isCustomResultTime: false,
        resultTimeUnit: 'minutes',
        customResultTimeValue: 30,
        mesoInputMode: 'detail',
        dropRateInputMode: 'detail',
        mesoUnionBuff: false,
        phantomUnionMeso: 4,
        mesoPotentialMode: 'lines',
        mesoPotentialLines: 0,
        mesoPotentialDirect: 0,
        mesoAbility: 0,
        globalBuffMode: 'union',
        mesoArtifactLevel: 0,
        mesoArtifactMode: 'level',
        mesoArtifactLevelInput: 0,
        mesoArtifactPercentInput: 0,
        dropRateUnionBuff: false,
        dropRatePotentialMode: 'lines',
        dropRatePotentialLines: 0,
        dropRatePotentialDirect: 0,
        dropRateAbility: 0,
        dropRateArtifactLevel: 0,
        dropRateArtifactMode: 'level',
        dropRateArtifactLevelInput: 0,
        dropRateArtifactPercentInput: 0,
        holySymbol: false,
        usefulHolySymbol: false,
        usefulHolySymbolLevel: 1,
        wealthAcquisitionPotion: false,
        showWealthPotionCost: true,
        wealthAcquisitionPotionPrice: 300,
        spottingSmallChange: false,
        spottingSmallChangeLevel: 0
      }
      
      setLastSavedInputs(prev => ({
        ...prev,
        [slotNumber]: defaultInputs
      }))
      setLastSavedSlotNames(prev => ({
        ...prev,
        [slotNumber]: slotNames[slotNumber] || `슬롯 ${slotNumber}`
      }))
      
      return
    }
    
    // 슬롯 이름 복원
    if (settings.slotName) {
      setSlotNames(prev => ({
        ...prev,
        [slotNumber]: settings.slotName
      }))
      // tempSlotName도 함께 업데이트
      if (slotNumber === currentSlot) {
        setTempSlotName(settings.slotName)
      }
    }
    
    // 설정값 복원
    if (settings.monsterLevel !== undefined) setMonsterLevel(settings.monsterLevel)
    if (settings.mesoBonus !== undefined) setMesoBonus(settings.mesoBonus)
    if (settings.dropRate !== undefined) setDropRate(settings.dropRate)
    if (settings.mesoInputMode !== undefined) setMesoInputMode(settings.mesoInputMode)
    if (settings.dropRateInputMode !== undefined) setDropRateInputMode(settings.dropRateInputMode)
    if (settings.mesoUnionBuff !== undefined) setMesoUnionBuff(settings.mesoUnionBuff)
    if (settings.phantomUnionMeso !== undefined) setPhantomUnionMeso(settings.phantomUnionMeso)
    if (settings.mesoPotentialMode !== undefined) setMesoPotentialMode(settings.mesoPotentialMode)
    if (settings.mesoPotentialLines !== undefined) setMesoPotentialLines(settings.mesoPotentialLines)
    if (settings.mesoPotentialDirect !== undefined) setMesoPotentialDirect(settings.mesoPotentialDirect)
    if (settings.mesoAbility !== undefined) setMesoAbility(settings.mesoAbility)
    if (settings.globalBuffMode !== undefined) setGlobalBuffMode(settings.globalBuffMode)
    if (settings.mesoArtifactLevel !== undefined) setMesoArtifactLevel(settings.mesoArtifactLevel)
    if (settings.mesoArtifactMode !== undefined) setMesoArtifactMode(settings.mesoArtifactMode)
    if (settings.mesoArtifactLevelInput !== undefined) setMesoArtifactLevelInput(settings.mesoArtifactLevelInput)
    if (settings.mesoArtifactPercentInput !== undefined) setMesoArtifactPercentInput(settings.mesoArtifactPercentInput)
    if (settings.dropRateUnionBuff !== undefined) setDropRateUnionBuff(settings.dropRateUnionBuff)
    if (settings.dropRatePotentialMode !== undefined) setDropRatePotentialMode(settings.dropRatePotentialMode)
    if (settings.dropRatePotentialLines !== undefined) setDropRatePotentialLines(settings.dropRatePotentialLines)
    if (settings.dropRatePotentialDirect !== undefined) setDropRatePotentialDirect(settings.dropRatePotentialDirect)
    if (settings.dropRateAbility !== undefined) setDropRateAbility(settings.dropRateAbility)
    if (settings.dropRateArtifactLevel !== undefined) setDropRateArtifactLevel(settings.dropRateArtifactLevel)
    if (settings.dropRateArtifactMode !== undefined) setDropRateArtifactMode(settings.dropRateArtifactMode)
    if (settings.dropRateArtifactLevelInput !== undefined) setDropRateArtifactLevelInput(settings.dropRateArtifactLevelInput)
    if (settings.dropRateArtifactPercentInput !== undefined) setDropRateArtifactPercentInput(settings.dropRateArtifactPercentInput)
    if (settings.holySymbol !== undefined) setHolySymbol(settings.holySymbol)
    if (settings.usefulHolySymbol !== undefined) setUsefulHolySymbol(settings.usefulHolySymbol)
    if (settings.usefulHolySymbolLevel !== undefined) setUsefulHolySymbolLevel(settings.usefulHolySymbolLevel)
    if (settings.wealthAcquisitionPotion !== undefined) setWealthAcquisitionPotion(settings.wealthAcquisitionPotion)
    if (settings.spottingSmallChange !== undefined) setSpottingSmallChange(settings.spottingSmallChange)
    if (settings.spottingSmallChangeLevel !== undefined) setSpottingSmallChangeLevel(settings.spottingSmallChangeLevel)
    if (settings.huntTime !== undefined) setHuntTime(settings.huntTime)
    if (settings.isCustomHuntTime !== undefined) setIsCustomHuntTime(settings.isCustomHuntTime)
    if (settings.huntTimeUnit !== undefined) setHuntTimeUnit(settings.huntTimeUnit)
    if (settings.customHuntTimeValue !== undefined) setCustomHuntTimeValue(settings.customHuntTimeValue)
    if (settings.monsterCount !== undefined) setMonsterCount(settings.monsterCount)
    if (settings.resultTime !== undefined) setResultTime(settings.resultTime)
    if (settings.isCustomResultTime !== undefined) setIsCustomResultTime(settings.isCustomResultTime)
    if (settings.resultTimeUnit !== undefined) setResultTimeUnit(settings.resultTimeUnit)
    if (settings.customResultTimeValue !== undefined) setCustomResultTimeValue(settings.customResultTimeValue)
    if (settings.solErdaFragmentPrice !== undefined) setSolErdaFragmentPrice(settings.solErdaFragmentPrice)
    if (settings.feeRate !== undefined) setFeeRate(settings.feeRate)
    if (settings.showWealthPotionCost !== undefined) setShowWealthPotionCost(settings.showWealthPotionCost)
    if (settings.wealthAcquisitionPotionPrice !== undefined) setWealthAcquisitionPotionPrice(settings.wealthAcquisitionPotionPrice)
    if (settings.autoCalculate !== undefined) setAutoCalculate(settings.autoCalculate)
    
    // 저장된 슬롯 이름이 있으면 사용, 없으면 기본값 사용
    const slotName = settings.slotName || slotNames[slotNumber] || `슬롯 ${slotNumber}`
    setTempSlotName(slotName)
    
    setCurrentSlot(slotNumber)
    setSettingsLoaded(true)
    
    // 저장된 설정값을 직접 lastSavedInputs로 설정
    // 이전 버전 호환성을 위해 속성 이름 확인
    const savedInputs: CalculationInputs = {
      monsterLevel: settings.monsterLevel ?? settings.mobLevel ?? 275,
      mesoBonus: settings.mesoBonus ?? 40,
      dropRate: settings.dropRate ?? settings.itemDropBonus ?? 60,
      huntTime: settings.huntTime ?? 0.125,
      monsterCount: settings.monsterCount ?? 39,
      resultTime: settings.resultTime ?? 30,
      solErdaFragmentPrice: settings.solErdaFragmentPrice ?? 600,
      feeRate: settings.feeRate ?? 3,
      isCustomHuntTime: settings.isCustomHuntTime ?? false,
      huntTimeUnit: settings.huntTimeUnit ?? 'minutes',
      customHuntTimeValue: settings.customHuntTimeValue ?? 7.5,
      isCustomResultTime: settings.isCustomResultTime ?? false,
      resultTimeUnit: settings.resultTimeUnit ?? 'minutes', 
      customResultTimeValue: settings.customResultTimeValue ?? 30,
      mesoInputMode: settings.mesoInputMode ?? 'detail',
      dropRateInputMode: settings.dropRateInputMode ?? settings.itemDropInputMode ?? 'detail',
      mesoUnionBuff: settings.mesoUnionBuff ?? false,
      phantomUnionMeso: settings.phantomUnionMeso ?? 4,
      mesoPotentialMode: settings.mesoPotentialMode ?? 'lines',
      mesoPotentialLines: settings.mesoPotentialLines ?? 0,
      mesoPotentialDirect: settings.mesoPotentialDirect ?? 0,
      mesoAbility: settings.mesoAbility ?? 0,
      globalBuffMode: settings.globalBuffMode ?? 'union',
      mesoArtifactLevel: settings.mesoArtifactLevel ?? 0,
      mesoArtifactMode: settings.mesoArtifactMode ?? 'level',
      mesoArtifactLevelInput: settings.mesoArtifactLevelInput ?? 0,
      mesoArtifactPercentInput: settings.mesoArtifactPercentInput ?? 0,
      dropRateUnionBuff: settings.dropRateUnionBuff ?? false,
      dropRatePotentialMode: settings.dropRatePotentialMode ?? 'lines',
      dropRatePotentialLines: settings.dropRatePotentialLines ?? 0,
      dropRatePotentialDirect: settings.dropRatePotentialDirect ?? 0,
      dropRateAbility: settings.dropRateAbility ?? 0,
      dropRateArtifactLevel: settings.dropRateArtifactLevel ?? 0,
      dropRateArtifactMode: settings.dropRateArtifactMode ?? 'level',
      dropRateArtifactLevelInput: settings.dropRateArtifactLevelInput ?? 0,
      dropRateArtifactPercentInput: settings.dropRateArtifactPercentInput ?? 0,
      holySymbol: settings.holySymbol ?? false,
      usefulHolySymbol: settings.usefulHolySymbol ?? false,
      usefulHolySymbolLevel: settings.usefulHolySymbolLevel ?? 1,
      wealthAcquisitionPotion: settings.wealthAcquisitionPotion ?? false,
      showWealthPotionCost: settings.showWealthPotionCost ?? true,
      wealthAcquisitionPotionPrice: settings.wealthAcquisitionPotionPrice ?? 300,
      spottingSmallChange: settings.spottingSmallChange ?? false,
      spottingSmallChangeLevel: settings.spottingSmallChangeLevel ?? 0
    }
    
    console.log('직접 설정한 savedInputs:', savedInputs)
    setLastSavedInputs(prev => ({
      ...prev,
      [slotNumber]: savedInputs
    }))
    setLastSavedSlotNames(prev => ({
      ...prev,
      [slotNumber]: settings.slotName || slotNames[slotNumber] || `슬롯 ${slotNumber}`
    }))
    
    // 설정 복원 메시지를 3초 후 숨김
    setTimeout(() => setSettingsLoaded(false), 3000)
  }
  
  // 컴포넌트 마운트 시 설정 로드
  useEffect(() => {
    setMounted(true)
    
    // 모든 슬롯의 이름과 데이터 유무를 로드
    if (canUseFunctionalCookies()) {
      const newSlotNames: {[key: number]: string} = {}
      const newSlotHasData: {[key: number]: boolean} = {}
      
      const initialLastSavedInputs: {[key: number]: CalculationInputs | null} = {
        1: null,
        2: null,
        3: null
      }
      
      for (let i = 1; i <= 3; i++) {
        const settings = loadCalculatorSettings(i)
        console.log(`초기 로드 슬롯 ${i} 설정:`, settings)
        if (settings && i === 1) {
          console.log('슬롯 1의 dropRateAbility 값:', settings.dropRateAbility)
        }
        
        if (settings) {
          newSlotHasData[i] = true
          if (settings.slotName) {
            newSlotNames[i] = settings.slotName
          } else {
            newSlotNames[i] = `슬롯 ${i}`
          }
          
          // 초기 로드 시 저장된 값을 lastSavedInputs에 설정
          // 이전 버전 호환성을 위해 속성 이름 확인
          initialLastSavedInputs[i] = {
            monsterLevel: settings.monsterLevel ?? settings.mobLevel ?? 275,
            mesoBonus: settings.mesoBonus ?? 40,
            dropRate: settings.dropRate ?? settings.itemDropBonus ?? 60,
            huntTime: settings.huntTime ?? 0.125,
            monsterCount: settings.monsterCount ?? 39,
            resultTime: settings.resultTime ?? 30,
            solErdaFragmentPrice: settings.solErdaFragmentPrice ?? 600,
            feeRate: settings.feeRate ?? 3,
            isCustomHuntTime: settings.isCustomHuntTime ?? false,
            huntTimeUnit: settings.huntTimeUnit ?? 'minutes',
            customHuntTimeValue: settings.customHuntTimeValue ?? 7.5,
            isCustomResultTime: settings.isCustomResultTime ?? false,
            resultTimeUnit: settings.resultTimeUnit ?? 'minutes',
            customResultTimeValue: settings.customResultTimeValue ?? 30,
            mesoInputMode: settings.mesoInputMode ?? 'detail',
            dropRateInputMode: settings.dropRateInputMode ?? settings.itemDropInputMode ?? 'detail',
            mesoUnionBuff: settings.mesoUnionBuff ?? false,
            phantomUnionMeso: settings.phantomUnionMeso ?? 4,
            mesoPotentialMode: settings.mesoPotentialMode ?? 'lines',
            mesoPotentialLines: settings.mesoPotentialLines ?? 0,
            mesoPotentialDirect: settings.mesoPotentialDirect ?? 0,
            mesoAbility: settings.mesoAbility ?? 0,
            globalBuffMode: settings.globalBuffMode ?? 'union',
            mesoArtifactLevel: settings.mesoArtifactLevel ?? 0,
            mesoArtifactMode: settings.mesoArtifactMode ?? 'level',
            mesoArtifactLevelInput: settings.mesoArtifactLevelInput ?? 0,
            mesoArtifactPercentInput: settings.mesoArtifactPercentInput ?? 0,
            dropRateUnionBuff: settings.dropRateUnionBuff ?? false,
            dropRatePotentialMode: settings.dropRatePotentialMode ?? 'lines',
            dropRatePotentialLines: settings.dropRatePotentialLines ?? 0,
            dropRatePotentialDirect: settings.dropRatePotentialDirect ?? 0,
            dropRateAbility: settings.dropRateAbility ?? 0,
            dropRateArtifactLevel: settings.dropRateArtifactLevel ?? 0,
            dropRateArtifactMode: settings.dropRateArtifactMode ?? 'level',
            dropRateArtifactLevelInput: settings.dropRateArtifactLevelInput ?? 0,
            dropRateArtifactPercentInput: settings.dropRateArtifactPercentInput ?? 0,
            holySymbol: settings.holySymbol ?? false,
            usefulHolySymbol: settings.usefulHolySymbol ?? false,
            usefulHolySymbolLevel: settings.usefulHolySymbolLevel ?? 1,
            wealthAcquisitionPotion: settings.wealthAcquisitionPotion ?? false,
            showWealthPotionCost: settings.showWealthPotionCost ?? true,
            wealthAcquisitionPotionPrice: settings.wealthAcquisitionPotionPrice ?? 300,
            spottingSmallChange: settings.spottingSmallChange ?? false,
            spottingSmallChangeLevel: settings.spottingSmallChangeLevel ?? 0
          }
        } else {
          newSlotHasData[i] = false
          newSlotNames[i] = `슬롯 ${i}`
          // 빈 슬롯은 null로 유지
        }
      }
      setSlotNames(newSlotNames)
      setSlotHasData(newSlotHasData)
      setTempSlotName(newSlotNames[1] || '슬롯 1')
      // 초기 로드 시 저장된 슬롯 이름과 입력값 설정
      setLastSavedSlotNames(newSlotNames)
      setLastSavedInputs(initialLastSavedInputs)
      
      console.log('초기 로드 시 설정된 lastSavedInputs:', initialLastSavedInputs)
      
      // slotNames가 업데이트된 후에 loadSettings 호출
      // setTimeout을 사용하여 다음 렌더링 사이클에서 실행
      setTimeout(() => {
        loadSettings(1)
      }, 0)
    } else {
      setTempSlotName('슬롯 1')
      // 쿠키 사용 불가 시에도 기본값 로드
      setTimeout(() => {
        loadSettings(1)
      }, 0)
    }
  }, [])

  // 현재 입력값들을 객체로 반환
  const getCurrentInputs = (): CalculationInputs => ({
    monsterLevel,
    mesoBonus,
    dropRate,
    huntTime,
    monsterCount,
    resultTime,
    solErdaFragmentPrice,
    feeRate,
    isCustomHuntTime,
    huntTimeUnit,
    customHuntTimeValue,
    isCustomResultTime,
    resultTimeUnit,
    customResultTimeValue,
    mesoInputMode,
    dropRateInputMode,
    mesoUnionBuff,
    phantomUnionMeso,
    mesoPotentialMode,
    mesoPotentialLines,
    mesoPotentialDirect,
    mesoAbility,
    globalBuffMode,
    mesoArtifactLevel,
    mesoArtifactMode,
    mesoArtifactLevelInput,
    mesoArtifactPercentInput,
    dropRateUnionBuff,
    dropRatePotentialMode,
    dropRatePotentialLines,
    dropRatePotentialDirect,
    dropRateAbility,
    dropRateArtifactLevel,
    dropRateArtifactMode,
    dropRateArtifactLevelInput,
    dropRateArtifactPercentInput,
    holySymbol,
    usefulHolySymbol,
    usefulHolySymbolLevel,
    wealthAcquisitionPotion,
    showWealthPotionCost,
    wealthAcquisitionPotionPrice,
    spottingSmallChange,
    spottingSmallChangeLevel
  })

  // 미저장 변경사항 감지
  const hasUnsavedChanges = useMemo(() => {
    // 초기 로드 중이면 변경사항 없음
    if (!mounted) {
      return false
    }
    
    // 현재 슬롯의 저장된 데이터가 없으면 변경사항 없음
    const currentSlotSavedInputs = lastSavedInputs[currentSlot]
    if (!currentSlotSavedInputs) {
      return false
    }
    
    // 실제로 저장된 슬롯 이름과 비교
    const savedSlotName = lastSavedSlotNames[currentSlot]
    const nameChanged = tempSlotName !== savedSlotName
    
    // 계산기 값 변경 확인 (저장된 설정과 현재 입력값 비교)
    const current = getCurrentInputs()
    const valuesChanged = Object.keys(current).some(key => {
      const currentValue = current[key as keyof CalculationInputs]
      const savedValue = currentSlotSavedInputs[key as keyof CalculationInputs]
      return currentValue !== savedValue
    })
    
    return nameChanged || valuesChanged
  }, [tempSlotName, lastSavedSlotNames, currentSlot, lastSavedInputs, mounted, monsterLevel, mesoBonus, dropRate, huntTime, monsterCount, resultTime, solErdaFragmentPrice, feeRate, isCustomHuntTime, huntTimeUnit, customHuntTimeValue, isCustomResultTime, resultTimeUnit, customResultTimeValue, mesoInputMode, dropRateInputMode, mesoUnionBuff, phantomUnionMeso, mesoPotentialMode, mesoPotentialLines, mesoPotentialDirect, mesoAbility, globalBuffMode, mesoArtifactLevel, dropRateUnionBuff, dropRatePotentialMode, dropRatePotentialLines, dropRatePotentialDirect, dropRateAbility, dropRateArtifactLevel, holySymbol, usefulHolySymbol, usefulHolySymbolLevel, wealthAcquisitionPotion, mesoArtifactMode, mesoArtifactLevelInput, mesoArtifactPercentInput, dropRateArtifactMode, dropRateArtifactLevelInput, dropRateArtifactPercentInput, showWealthPotionCost, wealthAcquisitionPotionPrice, spottingSmallChange, spottingSmallChangeLevel])

  // 슬롯 전환 처리 함수
  const handleSlotChange = (slotNumber: number) => {
    if (slotNumber === currentSlot) return
    
    // 미저장 변경사항이 있으면 경고 표시
    if (hasUnsavedChanges) {
      setPendingSlotNumber(slotNumber)
      setShowUnsavedWarning(true)
    } else {
      // 변경사항이 없으면 바로 슬롯 전환
      loadSettings(slotNumber)
    }
  }

  // 경고 모달에서 저장 후 이동
  const handleSaveAndSwitch = () => {
    if (pendingSlotNumber !== null) {
      saveSettings(currentSlot)
      // 저장 후 잠시 대기한 다음 슬롯 전환 (저장 완료를 위해)
      setTimeout(() => {
        loadSettings(pendingSlotNumber)
        setShowUnsavedWarning(false)
        setPendingSlotNumber(null)
      }, 100)
    }
  }

  // 경고 모달에서 저장하지 않고 이동
  const handleSwitchWithoutSaving = () => {
    if (pendingSlotNumber !== null) {
      loadSettings(pendingSlotNumber)
      setShowUnsavedWarning(false)
      setPendingSlotNumber(null)
    }
  }

  // 경고 모달에서 취소
  const handleCancelSwitch = () => {
    setShowUnsavedWarning(false)
    setPendingSlotNumber(null)
  }

  // 입력값 변경 여부 확인
  const hasInputsChanged = (): boolean => {
    if (!calculatedInputs) return false
    const current = getCurrentInputs()
    return Object.keys(current).some(key => 
      current[key as keyof CalculationInputs] !== calculatedInputs[key as keyof CalculationInputs]
    )
  }

  // 아티팩트 보너스 계산 (5레벨, 10레벨에 1%p 추가)
  const calculateArtifactBonus = (level: number, mode: 'level' | 'direct', directPercent: number) => {
    if (mode === 'direct') return directPercent
    let bonus = level
    if (level >= 5) bonus += 1
    if (level >= 10) bonus += 1
    return bonus
  }

  // 메소 획득량 계산
  const calculateMesoBonus = () => {
    if (mesoInputMode === 'direct') {
      return mesoBonus
    }
    
    let total = 0
    
    // 유니온의 부
    if (globalBuffMode !== 'challenger' && mesoUnionBuff) total += 50;
    
    // 팬텀 유니온 (일반 월드에서만)
    if (globalBuffMode === 'union') {
      total += phantomUnionMeso
    }
    
    // 잠재능력
    const mesoPotential = mesoPotentialMode === 'lines' ? mesoPotentialLines * 20 : mesoPotentialDirect
    total += mesoPotential
    
    // 어빌리티
    total += mesoAbility
    
    // 글로벌 버프 (챌린저스 월드 다이아 또는 유니온 아티팩트)
    if (globalBuffMode === 'challenger') {
      total += 20
    } else if (globalBuffMode === 'union') {
      total += calculateArtifactBonus(
        mesoArtifactMode === 'level' ? mesoArtifactLevelInput : 0,
        mesoArtifactMode,
        mesoArtifactPercentInput
      )
    }

    if (wealthAcquisitionPotion) {
      total = (100 + total) * 12 - 1000 // 소숫점 연산 회피
      total /= 10
    }
    
    return total
  }
  
  // 아이템 드랍률 계산
  const calculateItemDropBonus = () => {
    if (dropRateInputMode === 'direct') {
      return dropRate
    }
    
    let total = 0
    
    // 유니온의 행운
    if (globalBuffMode !== 'challenger' && dropRateUnionBuff) total += 50;
    
    // 잠재능력
    const itemPotential = dropRatePotentialMode === 'lines' ? dropRatePotentialLines * 20 : dropRatePotentialDirect
    total += itemPotential
    
    // 어빌리티
    total += dropRateAbility
    
    // 글로벌 버프 (챌린저스 월드 다이아 또는 유니온 아티팩트)
    if (globalBuffMode === 'challenger') {
      total += 20
    } else if (globalBuffMode === 'union') {
      total += calculateArtifactBonus(
        dropRateArtifactMode === 'level' ? dropRateArtifactLevelInput : 0,
        dropRateArtifactMode,
        dropRateArtifactPercentInput
      )
    }
    
    // 홀리 심볼 (둘 중 하나만 사용 가능)
    if (holySymbol && !usefulHolySymbol) {
      total += 30
    } else if (usefulHolySymbol && !holySymbol) {
      // 쓸만한 홀리 심볼: 1레벨=14%, 3레벨당 1% 추가
      const basePercent = 14
      const additionalPercent = Math.floor(usefulHolySymbolLevel / 3)
      total += basePercent + additionalPercent
    }
    
    // 재물 획득의 비약 (합연산)
    if (wealthAcquisitionPotion) {
      total += 20
    }
    
    return total
  }

  // calculateDrops 함수 내부
  const calculateDrops = () => {
    const inputs = getCurrentInputs()
    
    // 계산된 메소 획득량과 아이템 드랍률
    const calculatedMesoBonus = calculateMesoBonus()
    const calculatedItemDropBonus = calculateItemDropBonus()
    
    // 단위 시간당 처치 수
    const mobsPerMinute = inputs.monsterCount / inputs.huntTime
    const mobsPerHour = mobsPerMinute * 60
    
    // 결과 시간 동안의 총 처치 수
    const totalMonsters = mobsPerMinute * inputs.resultTime
    
    // 잔돈이 눈에 띄네 보너스 계산
    const spottingSmallChangeBonus = inputs.spottingSmallChange ? inputs.spottingSmallChangeLevel * 2 : 0

    // 재물 획득의 비약 적용된 상태의 드랍 데이터 계산
    const dropResultWithPotion = calculateHuntingExpectation({
      monsterLevel: inputs.monsterLevel,
      totalMonsters,
      mesoBonus: calculatedMesoBonus,
      dropRate: calculatedItemDropBonus,
      solErdaFragmentPrice: inputs.solErdaFragmentPrice,
      feeRate: inputs.feeRate,
      spottingSmallChangeBonus: spottingSmallChangeBonus
    })
    
    // 시간당 계산 (재물 획득의 비약 적용된 상태)
    const dropResultPerHourWithPotion = calculateHuntingExpectation({
      monsterLevel: inputs.monsterLevel,
      totalMonsters: mobsPerHour,
      mesoBonus: calculatedMesoBonus,
      dropRate: calculatedItemDropBonus,
      solErdaFragmentPrice: inputs.solErdaFragmentPrice,
      feeRate: inputs.feeRate,
      spottingSmallChangeBonus: spottingSmallChangeBonus
    })
    
    // 재물 획득의 비약 없을 때의 드랍 데이터 계산 (20% 곱연산/합연산 전 상태)
    let mesoAcquisitionRateWithoutPotion = calculatedMesoBonus
    let itemDropRateWithoutPotion = calculatedItemDropBonus
    
    if (wealthAcquisitionPotion) {
      // 재물 획득의 비약 효과 제거
      itemDropRateWithoutPotion = calculatedItemDropBonus - 20 // 합연산 20% 제거
      // 메소 획득량에서 20% 곱연산 효과 제거
      mesoAcquisitionRateWithoutPotion = (1 + calculatedMesoBonus / 100) / 1.2 - 1
      mesoAcquisitionRateWithoutPotion *= 100
    }
    
    const dropResultWithoutPotion = calculateHuntingExpectation({
      monsterLevel: inputs.monsterLevel,
      totalMonsters,
      mesoBonus: mesoAcquisitionRateWithoutPotion,
      dropRate: itemDropRateWithoutPotion,
      solErdaFragmentPrice: inputs.solErdaFragmentPrice,
      feeRate: inputs.feeRate,
      spottingSmallChangeBonus: spottingSmallChangeBonus
    })
    
    // 재물 획득의 비약 관련 계산
    let wealthAcquisitionPotionCount = 0
    let wealthAcquisitionPotionCost = 0
    let wealthAcquisitionPotionCountPerHour = 0
    let wealthAcquisitionPotionCostPerHour = 0

    if (wealthAcquisitionPotion && showWealthPotionCost) {
      // 30분마다 1개씩 사용 (31분이면 2개)
      wealthAcquisitionPotionCount = Math.ceil(inputs.resultTime / 30)
      wealthAcquisitionPotionCost = wealthAcquisitionPotionCount * wealthAcquisitionPotionPrice * 10000
      
      // 1시간 기준 계산 (2개 사용)
      wealthAcquisitionPotionCountPerHour = 2
      wealthAcquisitionPotionCostPerHour = wealthAcquisitionPotionCountPerHour * wealthAcquisitionPotionPrice * 10000
    }

    // 총 메소 (재물 획득의 비약 비용 차감)
    const totalMeso = dropResultWithPotion.totalIncome - wealthAcquisitionPotionCost
    const totalMesoPerHour = dropResultPerHourWithPotion.totalIncome - wealthAcquisitionPotionCostPerHour

    const newResult = {
      baseMeso: dropResultWithPotion.totalMeso,
      solErdaCount: dropResultWithPotion.solErdaCount,
      solErdaProfit: dropResultWithPotion.solErdaProfit,
      totalIncome: dropResultWithPotion.totalIncome,
      totalMeso,
      mesoDropRate: dropResultWithPotion.mesoDropRate,
      solErdaDropRate: dropResultWithPotion.solErdaDropRate,
      mesoPerDrop: dropResultWithPotion.mesoPerDrop,
      wealthAcquisitionPotionCount,
      wealthAcquisitionPotionCost,
      totalMesoPerHour,
      totalMesoWithoutPotion: dropResultWithoutPotion.totalIncome
    }

    setResult(newResult)
    setCalculatedInputs(inputs)
  }

  // 자동 연산이 켜져있을 때 입력값 변경 감지
  useEffect(() => {
    if (autoCalculate) {
      calculateDrops()
    }
  }, [monsterLevel, mesoBonus, dropRate, huntTime, monsterCount, resultTime, solErdaFragmentPrice, feeRate, autoCalculate, customHuntTimeValue, huntTimeUnit, customResultTimeValue, resultTimeUnit, isCustomHuntTime, isCustomResultTime, mesoInputMode, dropRateInputMode, mesoUnionBuff, phantomUnionMeso, mesoPotentialMode, mesoPotentialLines, mesoPotentialDirect, mesoAbility, globalBuffMode, mesoArtifactLevel, dropRateUnionBuff, dropRatePotentialMode, dropRatePotentialLines, dropRatePotentialDirect, dropRateAbility, dropRateArtifactLevel, holySymbol, usefulHolySymbol, usefulHolySymbolLevel, wealthAcquisitionPotion, mesoArtifactMode, mesoArtifactLevelInput, mesoArtifactPercentInput, dropRateArtifactMode, dropRateArtifactLevelInput, dropRateArtifactPercentInput, showWealthPotionCost, wealthAcquisitionPotionPrice, spottingSmallChange, spottingSmallChangeLevel])

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(Math.floor(num))
  }

  const formatMesoWithKorean = (num: number, onlyKorean: boolean = false) => {
    const mesoNum = Math.floor(num)
    const formatted = new Intl.NumberFormat('ko-KR').format(mesoNum)
    
    // 한글 단위 계산
    let koreanUnit = ''
    if (mesoNum >= 1000000000000) { // 조 단위
      const jo = Math.floor(mesoNum / 1000000000000)
      const remainingAfterJo = mesoNum % 1000000000000
      const eok = Math.floor(remainingAfterJo / 100000000)
      const man = Math.floor((remainingAfterJo % 100000000) / 10000)
      
      koreanUnit = `${jo}조`
      if (eok > 0) koreanUnit += ` ${eok}억`
      if (man > 0) koreanUnit += ` ${man}만`
    } else if (mesoNum >= 100000000) { // 억 단위
      const eok = Math.floor(mesoNum / 100000000)
      const man = Math.floor((mesoNum % 100000000) / 10000)
      
      koreanUnit = `${eok}억`
      if (man > 0) koreanUnit += ` ${man}만`
    } else if (mesoNum >= 10000) { // 만 단위
      const man = Math.floor(mesoNum / 10000)
      koreanUnit = `${man}만`
    }
    // 0인 경우 처리
    if (mesoNum === 0) {
      return '0'
    }
    
    return onlyKorean ? koreanUnit : (koreanUnit ? `${formatted} (${koreanUnit})` : formatted)
  }

  const formatDecimal = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat('ko-KR', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals 
    }).format(num)
  }

  // 드메 효과 계산
  const calculateDragonMercenaryEffect = () => {
    if (!result) return null

    const inputs = getCurrentInputs()
    const mobsPerMinute = inputs.monsterCount / inputs.huntTime
    const totalMonsters = mobsPerMinute * inputs.resultTime

    // 현재 계산된 보너스 값들
    const currentMesoBonus = calculateMesoBonus()
    const currentItemDropBonus = calculateItemDropBonus()

    // 잔돈이 눈에 띄네 보너스 계산
    const spottingSmallChangeBonus = inputs.spottingSmallChange ? inputs.spottingSmallChangeLevel * 2 : 0

    // 드랍률 20% 증가 효과 (합연산)
    const dropCalcWithDropBonus = calculateHuntingExpectation({
      monsterLevel: inputs.monsterLevel,
      totalMonsters,
      mesoBonus: currentMesoBonus,
      dropRate: currentItemDropBonus + 20, // 기존 드랍률에 20% 추가
      solErdaFragmentPrice: inputs.solErdaFragmentPrice,
      feeRate: inputs.feeRate, // 사용자가 설정한 수수료율 사용
      spottingSmallChangeBonus: spottingSmallChangeBonus
    })

    // 메소 획득량 20% 증가 효과 (합연산)
    const additionalMesoBonus = wealthAcquisitionPotion ? 24 : 20
    const dropCalcWithMesoBonus = calculateHuntingExpectation({
      monsterLevel: inputs.monsterLevel,
      totalMonsters,
      mesoBonus: currentMesoBonus + additionalMesoBonus,
      dropRate: currentItemDropBonus,
      solErdaFragmentPrice: inputs.solErdaFragmentPrice,
      feeRate: inputs.feeRate, // 사용자가 설정한 수수료율 사용
      spottingSmallChangeBonus: spottingSmallChangeBonus
    })

    // 재물 획득의 비약 비용 계산 (기존 로직과 동일)
    let wealthAcquisitionPotionCost = 0
    if (wealthAcquisitionPotion && showWealthPotionCost) {
      const wealthAcquisitionPotionCount = Math.ceil(inputs.resultTime / 30)
      wealthAcquisitionPotionCost = wealthAcquisitionPotionCount * wealthAcquisitionPotionPrice * 10000
    }

    return {
      dropRateIncrease: (dropCalcWithDropBonus.totalIncome - wealthAcquisitionPotionCost) - result.totalMeso,
      mesoRateIncrease: (dropCalcWithMesoBonus.totalIncome - wealthAcquisitionPotionCost) - result.totalMeso
    }
  }





  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-7xl mx-auto">
      {/* 슬롯 선택 UI */}
      <div className="mb-4 border-b pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* 슬롯 버튼들 */}
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-700 mr-2">저장 슬롯:</h3>
            <div className="flex gap-2">
              {[1, 2, 3].map((slot) => (
                <div key={slot} className="flex items-center gap-1">
                  <button
                    onClick={() => handleSlotChange(slot)}
                    className={`px-3 py-2 text-sm rounded transition-all ${
                      currentSlot === slot
                        ? 'bg-blue-600 text-white'
                        : mounted && slotHasData[slot]
                        ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
                    }`}
                  >
                    {mounted && slotHasData[slot] ? (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        {slot === currentSlot && tempSlotName ? tempSlotName : slotNames[slot]}
                      </span>
                    ) : (
                      <span>
                        {slot === currentSlot && tempSlotName ? tempSlotName : slotNames[slot]} 
                        {mounted && !slotHasData[slot] ? ' (비어있음)' : ''}
                      </span>
                    )}
                  </button>
                  {currentSlot === slot && (
                    <>
                      <button
                        onClick={() => saveSettings(slot)}
                        className="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        title="현재 설정 저장"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      {mounted && slotHasData[slot] && (
                        <button
                          onClick={() => {
                            if (confirm(`슬롯 ${slot}의 데이터를 삭제하시겠습니까?`)) {
                              clearCalculatorSettings(slot)
                              setSlotNames(prev => ({
                                ...prev,
                                [slot]: `슬롯 ${slot}`
                              }))
                              setSlotHasData(prev => ({
                                ...prev,
                                [slot]: false
                              }))
                              setShowSaveSuccess(true)
                              setTimeout(() => setShowSaveSuccess(false), 3000)
                            }
                          }}
                          className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          title="슬롯 데이터 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* 슬롯 이름 변경 */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">슬롯 이름:</label>
            <input
              type="text"
              value={tempSlotName}
              onChange={(e) => {
                setTempSlotName(e.target.value)
              }}
              onFocus={() => {
                // 포커스 시 이미 tempSlotName이 설정되어 있으므로 아무것도 하지 않음
              }}
              onBlur={() => {
                // 블러 시 빈 값이면 원래 이름으로 복원
                if (!tempSlotName.trim()) {
                  setTempSlotName(slotNames[currentSlot] || `슬롯 ${currentSlot}`)
                } else {
                  // 변경된 이름을 슬롯 이름에 적용
                  setSlotNames(prev => ({
                    ...prev,
                    [currentSlot]: tempSlotName
                  }))
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur()
                }
              }}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
              placeholder={`슬롯 ${currentSlot}`}
              maxLength={20}
            />
          </div>
        </div>
        
        {/* 상태 메시지 */}
        <div className="flex items-center gap-2 mt-2">
          {showSaveSuccess && (
            <div className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              설정이 저장되었습니다
            </div>
          )}
          {showSaveError && (
            <div className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              기능성 쿠키가 비활성화되어 있습니다
            </div>
          )}
          {settingsLoaded && canUseFunctionalCookies() && (
            <div className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              저장된 설정 복원됨
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-11 gap-6">
        {/* 사냥 정보 */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="text-base font-semibold text-gray-800 border-b pb-2">사냥 정보</h3>
          
          {/* 몬스터 레벨 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              몬스터 레벨
            </label>
            <NumberInput
              value={monsterLevel}
              onChange={setMonsterLevel}
              min={1}
              size="md"
              className="w-full"
            />
            </div>

          {/* 사냥량 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              사냥량
            </label>
            <div className="flex items-center space-x-2">
                  <select
                    value={isCustomHuntTime ? 'custom' : huntTime}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setIsCustomHuntTime(true)
                        // 현재 선택된 값을 기본값으로 설정
                        const currentMinutes = huntTime
                        if (currentMinutes === 30) {
                          setHuntTimeUnit('mini_wealth')
                          setCustomHuntTimeValue(1)
                        } else if (currentMinutes === 120) {
                          setHuntTimeUnit('full_wealth')
                          setCustomHuntTimeValue(1)
                        } else if (currentMinutes === 0.125) { // 7.5초 = 0.125분
                          setHuntTimeUnit('gen')
                          setCustomHuntTimeValue(1)
                        } else if (currentMinutes >= 60 && currentMinutes % 60 === 0) {
                          setHuntTimeUnit('hours')
                          setCustomHuntTimeValue(currentMinutes / 60)
                        } else if (currentMinutes < 1) { // 1분 미만은 초 단위로
                          setHuntTimeUnit('seconds')
                          setCustomHuntTimeValue(currentMinutes * 60)
                        } else {
                          setHuntTimeUnit('minutes')
                          setCustomHuntTimeValue(currentMinutes)
                        }
                      } else {
                        // 기존 시간과 새로운 시간을 이용해 마릿수 계산
                        const oldTime = huntTime
                        const newTime = Number(e.target.value)
                        const newMobCount = Math.floor(monsterCount * (newTime / oldTime))
                        
                        setIsCustomHuntTime(false)
                        setHuntTime(newTime)
                        setMonsterCount(newMobCount)
                      }
                    }}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0.125}>1젠</option>
                    <option value={2}>2분</option>
                    <option value={6}>6분</option>
                    <option value={10}>10분</option>
                    <option value={30}>30분</option>
                    <option value={60}>1시간</option>
                    <option value="custom">직접 입력</option>
                  </select>
                  <span className="text-sm text-gray-600">당</span>
                  <NumberInput
                    value={monsterCount}
                    onChange={setMonsterCount}
                    min={1}
                    size="md"
                    className="w-24"
                  />
                  <span className="text-sm text-gray-600">마리</span>
                </div>
              
              {/* 직접 입력 필드 */}
              {isCustomHuntTime && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <NumberInput
                    value={customHuntTimeValue}
                    onChange={(value) => {
                      // 기존 시간과 새로운 시간을 계산하여 마릿수 업데이트
                      const oldMinutes = huntTime
                      let newMinutes = value
                      if (huntTimeUnit === 'seconds') newMinutes = value / 60
                      else if (huntTimeUnit === 'hours') newMinutes = value * 60
                      else if (huntTimeUnit === 'mini_wealth') newMinutes = value * 30
                      else if (huntTimeUnit === 'full_wealth') newMinutes = value * 120
                      else if (huntTimeUnit === 'gen') newMinutes = value * 0.125 // 1젠 = 7.5초 = 0.125분
                      
                      // 마릿수 자동 계산 (소수점 이하 버림)
                      const newMobCount = Math.floor(monsterCount * (newMinutes / oldMinutes))
                      
                      setCustomHuntTimeValue(value)
                      setHuntTime(newMinutes)
                      setMonsterCount(newMobCount)
                    }}
                    min={0.1}
                    step={1}
                    className="w-full"
                    placeholder="시간 입력"
                  />
                  <select
                    value={huntTimeUnit}
                    onChange={(e) => {
                      const newUnit = e.target.value as 'seconds' | 'minutes' | 'hours' | 'mini_wealth' | 'full_wealth' | 'gen'
                      if (newUnit !== huntTimeUnit) {
                        // 기존 시간 계산 (분 단위)
                        let oldMinutes = customHuntTimeValue
                        if (huntTimeUnit === 'seconds') oldMinutes = customHuntTimeValue / 60
                        else if (huntTimeUnit === 'hours') oldMinutes = customHuntTimeValue * 60
                        else if (huntTimeUnit === 'mini_wealth') oldMinutes = customHuntTimeValue * 30
                        else if (huntTimeUnit === 'full_wealth') oldMinutes = customHuntTimeValue * 120
                        else if (huntTimeUnit === 'gen') oldMinutes = customHuntTimeValue * 0.125
                        
                        // 새 단위의 값 계산
                        let newValue = oldMinutes
                        if (newUnit === 'seconds') newValue = oldMinutes * 60
                        else if (newUnit === 'hours') newValue = oldMinutes / 60
                        else if (newUnit === 'mini_wealth') newValue = oldMinutes / 30
                        else if (newUnit === 'full_wealth') newValue = oldMinutes / 120
                        else if (newUnit === 'gen') newValue = oldMinutes / 0.125
                        
                        // 새 단위의 시간 계산 (분 단위)
                        let newMinutes = newValue
                        if (newUnit === 'seconds') newMinutes = newValue / 60
                        else if (newUnit === 'hours') newMinutes = newValue * 60
                        else if (newUnit === 'mini_wealth') newMinutes = newValue * 30
                        else if (newUnit === 'full_wealth') newMinutes = newValue * 120
                        else if (newUnit === 'gen') newMinutes = newValue * 0.125
                        
                        // 마릿수 자동 계산 (소수점 이하 버림)
                        const newMobCount = Math.floor(monsterCount * (newMinutes / oldMinutes))
                        
                        setCustomHuntTimeValue(newValue)
                        setMonsterCount(newMobCount)
                      }
                      setHuntTimeUnit(newUnit)
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="seconds">초</option>
                    <option value="gen">젠</option>
                    <option value="minutes">분</option>
                    <option value="hours">시간</option>
                    <option value="mini_wealth">소재</option>
                    <option value="full_wealth">재획</option>
                 </select>
               </div>
             )}
            </div>

          {/* 계산 결과 단위 시간 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              계산 결과 단위 시간
            </label>
            <select
              value={isCustomResultTime ? 'custom' : resultTime}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setIsCustomResultTime(true)
                  // 현재 선택된 값을 기본값으로 설정
                  const currentMinutes = resultTime
                  if (currentMinutes === 30) {
                        setResultTimeUnit('mini_wealth')
                        setCustomResultTimeValue(1)
                      } else if (currentMinutes === 120) {
                        setResultTimeUnit('full_wealth')
                        setCustomResultTimeValue(1)
                      } else if (currentMinutes === 0.125) { // 7.5초 = 0.125분
                        setResultTimeUnit('gen')
                        setCustomResultTimeValue(1)
                      } else if (currentMinutes < 1) { // 1분 미만은 초 단위로
                        setResultTimeUnit('seconds')
                        setCustomResultTimeValue(currentMinutes * 60)
                      } else if (currentMinutes === 270) {
                    setResultTimeUnit('hours')
                    setCustomResultTimeValue(4.5)
                  } else if (currentMinutes >= 60 && currentMinutes % 60 === 0) {
                    setResultTimeUnit('hours')
                    setCustomResultTimeValue(currentMinutes / 60)
                  } else {
                    setResultTimeUnit('minutes')
                    setCustomResultTimeValue(currentMinutes)
                  }
                } else {
                  setIsCustomResultTime(false)
                  setResultTime(Number(e.target.value))
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                      <option value={0.125}>1젠 (7.5초)</option>
                      <option value={30}>30분</option>
                      <option value={60}>1시간</option>
                      <option value={270}>4시간 30분</option>
                      <option value="custom">직접 입력</option>
            </select>
            
            {/* 직접 입력 필드 */}
            {isCustomResultTime && (
              <div className="mt-2 grid grid-cols-3 gap-2 items-center">
                <NumberInput
                  value={customResultTimeValue}
                  onChange={(value) => {
                    setCustomResultTimeValue(value)
                    // 분 단위로 변환하여 resultTime 업데이트
                    let minutes = value
                    if (resultTimeUnit === 'seconds') minutes = value / 60
                    else if (resultTimeUnit === 'hours') minutes = value * 60
                    else if (resultTimeUnit === 'mini_wealth') minutes = value * 30
                    else if (resultTimeUnit === 'full_wealth') minutes = value * 120
                    else if (resultTimeUnit === 'gen') minutes = value * 0.125 // 1젠 = 7.5초 = 0.125분
                    setResultTime(minutes)
                  }}
                  min={0.1}
                  step={1}
                  className="w-full"
                  placeholder="시간 입력"
                />
                <select
                  value={resultTimeUnit}
                  onChange={(e) => {
                    const newUnit = e.target.value as 'seconds' | 'minutes' | 'hours' | 'mini_wealth' | 'full_wealth' | 'gen'
                    if (newUnit !== resultTimeUnit) {
                      // 현재 값을 분으로 변환
                      let currentMinutes = customResultTimeValue
                      if (resultTimeUnit === 'seconds') currentMinutes = customResultTimeValue / 60
                      else if (resultTimeUnit === 'hours') currentMinutes = customResultTimeValue * 60
                      else if (resultTimeUnit === 'mini_wealth') currentMinutes = customResultTimeValue * 30
                      else if (resultTimeUnit === 'full_wealth') currentMinutes = customResultTimeValue * 120
                      else if (resultTimeUnit === 'gen') currentMinutes = customResultTimeValue * 0.125
                      
                      // 새 단위로 변환
                      let newValue = currentMinutes
                      if (newUnit === 'seconds') newValue = currentMinutes * 60
                      else if (newUnit === 'hours') newValue = currentMinutes / 60
                      else if (newUnit === 'mini_wealth') newValue = currentMinutes / 30
                      else if (newUnit === 'full_wealth') newValue = currentMinutes / 120
                      else if (newUnit === 'gen') newValue = currentMinutes / 0.125
                      
                      setCustomResultTimeValue(newValue)
                    }
                    setResultTimeUnit(newUnit)
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="seconds">초</option>
                  <option value="gen">젠</option>
                  <option value="minutes">분</option>
                  <option value="hours">시간</option>
                  <option value="mini_wealth">소재</option>
                  <option value="full_wealth">재획</option>
                </select>
               </div>
             )}
           </div>

           {/* 솔 에르다 조각 가격 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              솔 에르다 조각 가격 (만 메소)
            </label>
            <NumberInput
              value={solErdaFragmentPrice}
              onChange={setSolErdaFragmentPrice}
              min={0}
              step={10}
              className="w-full"
            />
          </div>

          {/* 수수료 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              다조 거래 수수료
            </label>
            <select
              value={feeRate}
              onChange={(e) => setFeeRate(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>0% (직접 사용)</option>
              <option value={3}>3%</option>
              <option value={5}>5%</option>
            </select>
          </div>
        </div>

        {/* 스탯 정보 */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-base font-semibold text-gray-800 border-b pb-2">스탯 정보</h3>
          
          {/* 글로벌 버프 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              기본 환경 설정
            </label>
            <RadioGroup
              options={[
                { value: 'challenger', label: '챌린저스: 다이아 버프 (20%)' },
                { value: 'union', label: '일반 월드: 유니온 (0~12%)' },
                { value: 'none', label: '해당 없음' }
              ]}
              value={globalBuffMode}
              onChange={(value) => setGlobalBuffMode(value as 'none' | 'challenger' | 'union')}
              name="globalBuff"
            />
          </div>

          {/* 재물 획득의 비약 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                재물 획득의 비약
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={wealthAcquisitionPotion}
                  onChange={(e) => setWealthAcquisitionPotion(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">사용</span>
              </div>
            </div>
            
            {wealthAcquisitionPotion && (
              <div className="mt-3 space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showWealthPotionCost}
                    onChange={(e) => setShowWealthPotionCost(e.target.checked)}
                    className="rounded"
                  />
                  <label className="text-sm text-gray-700">재획비 비용 계산하기</label>
                </div>
                
                {showWealthPotionCost && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      소형 재물 획득의 비약 가격
                    </label>
                    <div className="flex items-center space-x-1">
                      <NumberInput
                        value={wealthAcquisitionPotionPrice}
                        onChange={setWealthAcquisitionPotionPrice}
                        min={0}
                        step={10}
                        className="w-32"
                      />
                      <span className="text-sm text-gray-600">만 메소</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 아이템 드랍률 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                아이템 드롭률
              </label>
              <div className="flex items-center space-x-2">
                <ToggleButton
                  options={[
                    { value: 'detail', label: '자동' },
                    { value: 'direct', label: '직접' }
                  ]}
                  value={dropRateInputMode}
                  onChange={(value) => setDropRateInputMode(value as 'direct' | 'detail')}
                  size="sm"
                />
                <input
                  type="number"
                  value={dropRateInputMode === 'direct' ? dropRate : calculateItemDropBonus()}
                  onChange={(e) => {
                    if (dropRateInputMode === 'direct') {
                      setDropRate(Number(e.target.value))
                    }
                  }}
                  onClick={() => {
                    if (dropRateInputMode === 'detail') {
                      setDropRate(calculateItemDropBonus())
                      setDropRateInputMode('direct')
                    }
                  }}
                  readOnly={dropRateInputMode === 'detail'}
                  className={`w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center ${
                    dropRateInputMode === 'detail' ? 'bg-gray-100 text-gray-500 cursor-pointer' : ''
                  } [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                  min="0"
                />
                <span className="text-xs text-gray-500">%</span>
              </div>
            </div>

            {/* 상세 옵션들 */}
            <div className={`p-4 rounded-lg space-y-3 ${
              dropRateInputMode === 'direct' 
                ? 'bg-gray-200 opacity-60' 
                : 'bg-gray-50'
            }`}>
              <h4 className="text-sm font-semibold text-gray-700">상세 옵션</h4>
              {/* 유니온의 행운 */}
              {globalBuffMode !== 'challenger' && (
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">유니온의 행운</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={dropRateUnionBuff}
                      onChange={(e) => {
                        setDropRateUnionBuff(e.target.checked)
                        if (dropRateInputMode === 'direct') {
                          setDropRateInputMode('detail')
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-500">50%</span>
                  </div>
                </div>
              )}
              {/* 잠재능력 */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">잠재능력</label>
                <div className="flex items-center space-x-2">
                  <ToggleButton
                    options={[
                      { value: 'lines', label: '줄수' },
                      { value: 'direct', label: '직접' }
                    ]}
                    value={dropRatePotentialMode}
                    onChange={(value) => {
                      if (value === 'lines' && dropRatePotentialMode === 'direct') {
                        // 직접 -> 줄수: 20% 단위로 변환, 나머지 버림
                        setDropRatePotentialLines(Math.floor(dropRatePotentialDirect / 20))
                      } else if (value === 'direct' && dropRatePotentialMode === 'lines') {
                        // 줄수 -> 직접: 줄수 * 20%
                        setDropRatePotentialDirect(dropRatePotentialLines * 20)
                      }
                      setDropRatePotentialMode(value as 'lines' | 'direct')
                      if (dropRateInputMode === 'direct') {
                        setDropRateInputMode('detail')
                      }
                    }}
                    size="sm"
                  />
                  {dropRatePotentialMode === 'lines' ? (
                    <>
                      <NumberInput
                        value={dropRatePotentialLines}
                        onChange={(value) => {
                          setDropRatePotentialLines(Math.min(10, Math.max(0, value)))
                          if (dropRateInputMode === 'direct') {
                            setDropRateInputMode('detail')
                          }
                        }}
                        min={0}
                        max={10}
                        size="md"
                        className="w-20"
                      />
                      <span className="text-sm text-gray-500">줄</span>
                    </>
                  ) : (
                    <>
                      <NumberInput
                        value={dropRatePotentialDirect}
                        onChange={(value) => setDropRatePotentialDirect(Math.min(200, Math.max(0, value)))}
                        min={0}
                        max={200}
                        step={5}
                        size="md"
                        className="w-20"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </>
                  )}
                </div>
              </div>

              {/* 어빌리티 */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">어빌리티</label>
                <div className="flex items-center space-x-2">
                  <NumberInput
                    value={dropRateAbility}
                    onChange={(value) => setDropRateAbility(Math.min(20, Math.max(0, value)))}
                    min={0}
                    max={20}
                    size="md"
                    className="w-20"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>

              {/* 유니온 아티팩트(드랍) 레벨 */}
              {globalBuffMode === 'union' && (
  <div className="flex items-center justify-between">
    <label className="text-sm text-gray-700">유니온 아티팩트</label>
    <div className="flex items-center space-x-2">
      <button
        type="button"
        onClick={() => setDropRateArtifactMode('level')}
        className={`px-2 py-1 text-sm rounded ${dropRateArtifactMode === 'level' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
      >
        레벨
      </button>
      <button
        type="button"
        onClick={() => setDropRateArtifactMode('direct')}
        className={`px-2 py-1 text-sm rounded ${dropRateArtifactMode === 'direct' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
      >
        %
      </button>
      {dropRateArtifactMode === 'level' ? (
        <>
          <NumberInput
            value={dropRateArtifactLevelInput}
            onChange={(value) => setDropRateArtifactLevelInput(Math.max(0, value))}
            min={0}
            max={10}
            className="w-20"
          />
          <span className="text-xs text-gray-500">레벨</span>
        </>
      ) : (
        <>
          <NumberInput
            value={dropRateArtifactPercentInput}
            onChange={(value) => setDropRateArtifactPercentInput(Math.max(0, value))}
            min={0}
            max={12}
            className="w-20"
          />
          <span className="text-xs text-gray-500">%</span>
        </>
      )}
    </div>
  </div>
)}
              {/* 홀리 심볼 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">홀리 심볼</label>
                  <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                    {holySymbol ? '30%' : usefulHolySymbol ? `${14 + Math.floor(usefulHolySymbolLevel / 3)}%` : '0%'}
                  </div>
                </div>
                <RadioGroupWithInput
                  options={[
                    { 
                      value: 'none', 
                      label: '사용 안함' 
                    },
                    { 
                      value: 'regular', 
                      label: '홀리 심볼' 
                    },
                    { 
                      value: 'useful', 
                      label: '쓸만한 홀리 심볼',
                      hasInput: true,
                      inputProps: {
                        value: usefulHolySymbolLevel,
                        onChange: (value) => {
                          const level = Math.min(30, Math.max(1, value))
                          setUsefulHolySymbolLevel(level)
                          if (!usefulHolySymbol) {
                            setUsefulHolySymbol(true)
                            setHolySymbol(false)
                          }
                          if (dropRateInputMode === 'direct') {
                            setDropRateInputMode('detail')
                          }
                        },
                        min: 1,
                        max: 30,
                        placeholder: '30',
                        suffix: '레벨'
                      }
                    }
                  ]}
                  value={holySymbol ? 'regular' : usefulHolySymbol ? 'useful' : 'none'}
                  onChange={(value) => {
                    if (value === 'none') {
                      setHolySymbol(false)
                      setUsefulHolySymbol(false)
                    } else if (value === 'regular') {
                      setHolySymbol(true)
                      setUsefulHolySymbol(false)
                    } else if (value === 'useful') {
                      setHolySymbol(false)
                      setUsefulHolySymbol(true)
                    }
                    if (dropRateInputMode === 'direct') {
                      setDropRateInputMode('detail')
                    }
                  }}
                  name="holySymbol"
                  orientation="horizontal"
                />
              </div>
            </div>
          </div>

          {/* 메소 획득량 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                메소 획득량
              </label>
              <div className="flex items-center space-x-2">
                <ToggleButton
                  options={[
                    { value: 'detail', label: '자동' },
                    { value: 'direct', label: '직접' }
                  ]}
                  value={mesoInputMode}
                  onChange={(value) => setMesoInputMode(value as 'direct' | 'detail')}
                  size="sm"
                />
                <input
                  type="number"
                  value={mesoInputMode === 'direct' ? mesoBonus : calculateMesoBonus()}
                  onChange={(e) => {
                    if (mesoInputMode === 'direct') {
                      setMesoBonus(Number(e.target.value))
                    }
                  }}
                  onClick={() => {
                    if (mesoInputMode === 'detail') {
                      setMesoBonus(calculateMesoBonus())
                      setMesoInputMode('direct')
                    }
                  }}
                  readOnly={mesoInputMode === 'detail'}
                  className={`w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center ${
                    mesoInputMode === 'detail' ? 'bg-gray-100 text-gray-500 cursor-pointer' : ''
                  } [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                  min="0"
                />
                <span className="text-xs text-gray-500">%</span>
              </div>
            </div>

            {/* 상세 옵션들 */}
            <div className={`p-4 rounded-lg space-y-3 ${
              mesoInputMode === 'direct' 
                ? 'bg-gray-200 opacity-60' 
                : 'bg-gray-50'
            }`}>
              <h4 className="text-sm font-semibold text-gray-700">상세 옵션</h4>
              {/* 유니온의 부 */}
              {globalBuffMode !== 'challenger' && (
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">유니온의 부</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={mesoUnionBuff}
                      onChange={(e) => {
                        setMesoUnionBuff(e.target.checked)
                        if (mesoInputMode === 'direct') {
                          setMesoInputMode('detail')
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-500">50%</span>
                  </div>
                </div>
              )}
              
              {/* 팬텀 유니온 (일반 월드에서만) */}
              {globalBuffMode === 'union' && (
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">팬텀 유니온</label>
                  <div className="flex items-center space-x-2">
                    <NumberInput
                      value={phantomUnionMeso}
                      onChange={(value) => {
                        setPhantomUnionMeso(value)
                        if (mesoInputMode === 'direct') {
                          setMesoInputMode('detail')
                        }
                      }}
                      min={0}
                      max={5}
                      step={1}
                      size="sm"
                      className="w-20"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>
              )}
              
              {/* 잠재능력 */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">잠재능력</label>
                <div className="flex items-center space-x-2">
                  <ToggleButton
                    options={[
                      { value: 'lines', label: '줄수' },
                      { value: 'direct', label: '직접' }
                    ]}
                    value={mesoPotentialMode}
                    onChange={(value) => {
                      if (value === 'lines' && mesoPotentialMode === 'direct') {
                        // 직접 -> 줄수: 20% 단위로 변환, 나머지 버림
                        setMesoPotentialLines(Math.floor(mesoPotentialDirect / 20))
                      } else if (value === 'direct' && mesoPotentialMode === 'lines') {
                        // 줄수 -> 직접: 줄수 * 20%
                        setMesoPotentialDirect(mesoPotentialLines * 20)
                      }
                      setMesoPotentialMode(value as 'lines' | 'direct')
                      if (mesoInputMode === 'direct') {
                        setMesoInputMode('detail')
                      }
                    }}
                    size="sm"
                  />
                  {mesoPotentialMode === 'lines' ? (
                    <>
                      <NumberInput
                        value={mesoPotentialLines}
                        onChange={(value) => {
                          setMesoPotentialLines(Math.min(5, Math.max(0, value)))
                          if (mesoInputMode === 'direct') {
                            setMesoInputMode('detail')
                          }
                        }}
                        min={0}
                        max={5}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-500">줄</span>
                    </>
                  ) : (
                    <>
                      <NumberInput
                        value={mesoPotentialDirect}
                        onChange={(value) => setMesoPotentialDirect(Math.min(100, Math.max(0, value)))}
                        min={0}
                        max={100}
                        step={5}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </>
                  )}
                </div>
              </div>

              {/* 어빌리티 */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">어빌리티</label>
                <div className="flex items-center space-x-2">
                  <NumberInput
                    value={mesoAbility}
                    onChange={(value) => setMesoAbility(Math.min(20, Math.max(0, value)))}
                    min={0}
                    max={20}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>

              {/* 유니온 아티팩트(메소) 레벨 */}
              {globalBuffMode === 'union' && (
  <div className="flex items-center justify-between">
    <label className="text-sm text-gray-700">유니온 아티팩트</label>
    <div className="flex items-center space-x-2">
      <button
        type="button"
        onClick={() => setMesoArtifactMode('level')}
        className={`px-2 py-1 text-sm rounded ${mesoArtifactMode === 'level' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
      >
        레벨
      </button>
      <button
        type="button"
        onClick={() => setMesoArtifactMode('direct')}
        className={`px-2 py-1 text-sm rounded ${mesoArtifactMode === 'direct' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
      >
        %
      </button>
      {mesoArtifactMode === 'level' ? (
        <>
          <NumberInput
            value={mesoArtifactLevelInput}
            onChange={(value) => setMesoArtifactLevelInput(Math.max(0, value))}
            min={0}
            max={10}
            className="w-20"
          />
          <span className="text-xs text-gray-500">레벨</span>
        </>
      ) : (
        <>
          <NumberInput
            value={mesoArtifactPercentInput}
            onChange={(value) => setMesoArtifactPercentInput(Math.max(0, value))}
            min={0}
            max={12}
            className="w-20"
          />
          <span className="text-xs text-gray-500">%</span>
        </>
      )}
    </div>
  </div>
)}
              
              {/* 잔돈이 눈에 띄네 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">잔돈이 눈에 띄네</label>
                  <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                    {spottingSmallChange ? `+${spottingSmallChangeLevel * 2}메소/드랍` : '사용 안함'}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      id="change-detection"
                      checked={spottingSmallChange}
                      onChange={(e) => {
                        setSpottingSmallChange(e.target.checked)
                        if (mesoInputMode === 'direct') {
                          setMesoInputMode('detail')
                        }
                      }}
                      className="rounded"
                    />
                    <label htmlFor="change-detection" className="text-sm text-gray-700">사용</label>
                  </div>
                  {spottingSmallChange && (
                    <div className="flex items-center space-x-1">
                      <NumberInput
                        value={spottingSmallChangeLevel}
                        onChange={(value) => {
                          const level = Math.min(4, Math.max(0, value))
                          setSpottingSmallChangeLevel(level)
                          if (mesoInputMode === 'direct') {
                            setMesoInputMode('detail')
                          }
                        }}
                        min={0}
                        max={4}
                        size="md"
                        className="w-20"
                        placeholder="4"
                      />
                      <span className="text-sm text-gray-500">레벨</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 계산 결과 */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-base font-semibold text-gray-800">계산 결과</h3>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoCalculate}
                  onChange={(e) => setAutoCalculate(e.target.checked)}
                  className="rounded"
                />
                <span className="text-gray-700">자동 계산</span>
              </label>
              {!autoCalculate && (
                <button
                  onClick={() => calculateDrops()}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  계산하기
                </button>
              )}
            </div>
          </div>
        
          {result ? (
          <div className="space-y-4">
            {/* 입력값 변경 경고 */}
            {!autoCalculate && hasInputsChanged() && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-yellow-600 mr-2">⚠️</span>
                  <p className="text-sm text-yellow-800">
                    현재 표시된 결과는 입력된 값과 다른 계산 결과입니다. &apos;계산하기&apos; 버튼을 눌러 최신 결과를 확인하세요.
                  </p>
                </div>
              </div>
            )}

                    {/* 연산 기초값 정보 */}
          <div className="p-3 bg-gray-50 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-800 mb-2">연산 기초값</h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="text-center">
              <div className="text-gray-600">몹 레벨</div>
              <div className="font-medium text-blue-600">{monsterLevel}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">아이템 드롭률</div>
              <div className="font-medium text-green-600">{calculateItemDropBonus()}%</div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">메소 획득량</div>
              <div className="font-medium text-purple-600">
                {calculateMesoBonus()}%
              </div>
            </div>
          </div>
        </div>
        
        
        

                            {/* 드롭 정보 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">드롭 정보</h4>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <span>돈주머니 평균 메소: <span className="font-medium">{formatMesoWithKorean(result.mesoPerDrop)} 메소</span></span>
                  <div className="relative ml-1 group">
                    <div className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs cursor-help">
                      ?
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                       {(() => {
                         const inputs = getCurrentInputs()
                         // 재획비를 제외한 메소 획득량 계산
                         let mesoRateWithoutWealth = calculateMesoBonus()
                         if (wealthAcquisitionPotion) {
                           // 재획비 20% 곱연산 효과 제거
                           mesoRateWithoutWealth = (1 + calculateMesoBonus() / 100) / 1.2 - 1
                           mesoRateWithoutWealth *= 100
                         }
                         const mesoDetails = getMesoCalculationDetails(
                           inputs.monsterLevel,
                           mesoRateWithoutWealth,
                           wealthAcquisitionPotion
                         )
                         const spottingSmallChangeBonus = inputs.spottingSmallChange ? inputs.spottingSmallChangeLevel * 2 : 0
                         return `${mesoDetails.baseMeso} × ${mesoDetails.mesoMultiplier.toFixed(2)} × ${mesoDetails.wealthPotionMultiplier}${spottingSmallChangeBonus > 0 ? ` + ${spottingSmallChangeBonus}` : ''}`
                       })()}
                     </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  메소 드롭률: <span className={`font-medium ${result.mesoDropRate < 100 ? 'text-red-500' : ''}`}>{formatDecimal(result.mesoDropRate, 1)}%</span>
                </p>
                <div className="flex items-center text-sm text-gray-600">
                  <span>솔 에르다 조각 드롭률: <span className="font-medium">{formatDecimal(result.solErdaDropRate, 4)}%</span></span>
                  <div className="relative ml-1 group">
                    <div className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs cursor-help">
                      ?
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10">
                       {(() => {
                         const currentDropRate = calculateItemDropBonus()
                         const solErdaDetails = getSolErdaFragmentCalculationDetails(currentDropRate)
                         return (
                           <div className="text-center">
                             <div>드랍률 {currentDropRate}% → 다조 드랍률 {Math.round((solErdaDetails.dropRateMultiplier - 1) * 100)}%</div>
                             <div className="text-sm opacity-70 mt-0.5">
                               (기본 드랍률 {solErdaDetails.baseSolErdaRate.toFixed(4)}% 및 드랍률 로그 추정치 적용)
                             </div>
                           </div>
                         )
                       })()}
                     </div>
                  </div>
                </div>
              </div>

            {/* 획득량 정보 */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">
                {resultTime >= 60 && resultTime % 60 === 0 
                  ? `${resultTime/60}시간` 
                  : resultTime >= 60 
                    ? `${Math.floor(resultTime/60)}시간 ${resultTime % 60}분`
                    : `${resultTime}분`} 정산
              </h4>
              <p className="text-sm text-gray-600">
                사냥한 몬스터: <span className="font-medium text-blue-600">{formatNumber((() => {
                  const inputs = getCurrentInputs()
                  const mobsPerMinute = inputs.monsterCount / inputs.huntTime
                  return Math.floor(mobsPerMinute * inputs.resultTime)
                })())} 마리</span>
              </p>
              <p className="text-sm text-gray-600">
                기본 메소: <span className="font-medium text-blue-600">{formatMesoWithKorean(result.baseMeso)} 메소</span>
              </p>
              <p className="text-sm text-gray-600">
                솔 에르다 조각: <span className="font-medium text-green-600">{formatDecimal(result.solErdaCount, 2)}개</span>
              </p>
              <p className="text-sm text-gray-600">
                다조 환산: <span className="font-medium text-green-600">{formatMesoWithKorean(result.solErdaProfit)} 메소</span>
              </p>
              {wealthAcquisitionPotion && showWealthPotionCost && (
                <>
                  <p className="text-sm text-gray-600">
                    소형 재물 획득의 비약: <span className="font-medium text-red-600">-{result.wealthAcquisitionPotionCount}개 ({formatMesoWithKorean(result.wealthAcquisitionPotionCost, true)} 메소)</span>
                  </p>
                </>
              )}
            </div>

            {/* 총 수익 */}
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">총 메소 정산</h4>
              <p className="text-xl font-bold text-green-600">
                {formatMesoWithKorean(result.totalMeso)} 메소
              </p>
              <p className="text-sm text-green-600 mt-1">
                시간당 {formatMesoWithKorean(result.totalMesoPerHour)} 메소 
              </p>
              {wealthAcquisitionPotion && showWealthPotionCost && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>재획비 적용 전: {formatMesoWithKorean(result.totalMesoWithoutPotion, true)} 메소</p>
                  <p>재획비 적용 후: {formatMesoWithKorean(result.totalIncome, true)} 메소 - {formatMesoWithKorean(result.wealthAcquisitionPotionCost, true)} 메소</p>
                  <p className={result.totalMeso > result.totalMesoWithoutPotion ? 'text-blue-600 font-medium' : 'text-red-600 font-medium'}>
                    재획비 사용으로 총 {formatMesoWithKorean(Math.abs(result.totalMeso - result.totalMesoWithoutPotion), true)} 메소
                    {result.totalMeso > result.totalMesoWithoutPotion ? ' 이득' : ' 손해'}
                  </p>
                </div>
              )}
            </div>

            {/* 드메 추가 효과 */}
            {(() => {
              const dragonEffect = calculateDragonMercenaryEffect()
              if (!dragonEffect) return null

              // 잠재능력 줄 수 기준으로 최대치 확인
              const currentItemPotentialLines = dropRatePotentialMode === 'lines' ? dropRatePotentialLines : Math.floor(dropRatePotentialDirect / 20)
              const currentMesoPotentialLines = mesoPotentialMode === 'lines' ? mesoPotentialLines : Math.floor(mesoPotentialDirect / 20)
              const isDropRateMaxed = currentItemPotentialLines >= 10 // 10줄
              const isMesoRateMaxed = currentMesoPotentialLines >= 5 // 5줄

              // UI 표시용 현재 값들
              const currentDropRate = calculateItemDropBonus()
              const currentMesoRate = calculateMesoBonus()

              // 둘 다 최대치면 카드 자체를 숨김
              if (isDropRateMaxed && isMesoRateMaxed) return null

              const showDropRateSection = !isDropRateMaxed
              const showMesoRateSection = !isMesoRateMaxed
              const showRecommendation = showDropRateSection && showMesoRateSection

              return (
                <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
                  <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
                    🐉 드메 추가?
                  </h4>
                  <div className="space-y-3">
                    {showDropRateSection && (
                      <div className="bg-white p-3 rounded-md border border-orange-200">
                        <h5 className="text-sm font-medium text-orange-700 mb-1">아이템 드랍률 +20%</h5>
                        <p className="text-sm text-orange-600">
                          현재 드랍률: <span className="font-medium">{formatDecimal(currentDropRate, 0)}%</span> → <span className="font-medium">{formatDecimal(currentDropRate + 20, 0)}%</span>
                        </p>
                        <p className="text-lg font-bold text-orange-600 mt-1">
                          수익 증가: <span className={dragonEffect.dropRateIncrease >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {dragonEffect.dropRateIncrease >= 0 ? '+' : ''}{formatMesoWithKorean(dragonEffect.dropRateIncrease)} 메소
                          </span>
                        </p>
                      </div>
                    )}
                    
                    {showMesoRateSection && (
                      <div className="bg-white p-3 rounded-md border border-orange-200">
                        <h5 className="text-sm font-medium text-orange-700 mb-1">메소 획득량 +20%</h5>
                        <p className="text-sm text-orange-600">
                          현재 메소 획득량: <span className="font-medium">{formatDecimal(currentMesoRate, 0)}%</span> → <span className="font-medium">{formatDecimal(currentMesoRate + (wealthAcquisitionPotion ? 24 : 20), 0)}%</span>
                        </p>
                        <p className="text-lg font-bold text-orange-600 mt-1">
                          수익 증가: <span className={dragonEffect.mesoRateIncrease >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {dragonEffect.mesoRateIncrease >= 0 ? '+' : ''}{formatMesoWithKorean(dragonEffect.mesoRateIncrease)} 메소
                          </span>
                        </p>
                      </div>
                    )}

                    {showRecommendation && (
                      <div className="bg-gradient-to-r from-orange-100 to-yellow-100 p-3 rounded-md border border-orange-300">
                        <h5 className="text-sm font-medium text-orange-800 mb-1">💡 추천</h5>
                        <p className="text-sm text-orange-700">
                          {dragonEffect.dropRateIncrease > dragonEffect.mesoRateIncrease 
                            ? "드랍률 증가가 더 효율적입니다!" 
                            : dragonEffect.mesoRateIncrease > dragonEffect.dropRateIncrease
                            ? "메소 획득량 증가가 더 효율적입니다! 보스 전리품 드랍의 가치는 배제된 것임에 유의하세요."
                            : "두 효과의 수익이 비슷합니다. 취향에 따라 선택하세요!"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>{autoCalculate ? '값을 입력하면 자동으로 계산됩니다' : '계산하기 버튼을 눌러서 결과를 확인하세요'}</p>
          </div>
        )}
        </div>
      </div>

      {/* 미저장 변경사항 경고 모달 */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">저장되지 않은 변경사항</h3>
            </div>
            <p className="text-gray-600 mb-6">
              현재 슬롯에 저장되지 않은 변경사항이 있습니다. 다른 슬롯으로 이동하시겠습니까?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelSwitch}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSwitchWithoutSaving}
                className="px-4 py-2 text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
              >
                저장하지 않고 이동
              </button>
              <button
                onClick={handleSaveAndSwitch}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                저장 후 이동
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 