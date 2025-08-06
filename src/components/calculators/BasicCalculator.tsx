'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Save, RotateCcw, AlertCircle, Trash2, ChevronDown, ChevronRight, X } from 'lucide-react'
import Link from 'next/link'
import SlotHeader from '../ui/SlotHeader'
import { useNotification } from '@/contexts/NotificationContext'
import { calculateHuntingExpectation, getMesoCalculationDetails, type HuntingExpectationParams, type DropItem as HuntingDropItem, SOL_ERDA_FRAGMENT_ID } from '../../utils/huntingExpectationCalculations'
import { saveCalculatorSettings, loadCalculatorSettings, canUseFunctionalCookies, hasSlotData, clearCalculatorSettings, setDataSourceCardDismissed, isDataSourceCardDismissed } from '../../utils/cookies'
import NumberInput from '../ui/NumberInput'
import { ToggleButton, RadioGroup, RadioGroupWithInput, DropItemInput, DropItem as UIDropItem } from '../ui'
import { formatNumber, formatMesoWithKorean, formatDecimal } from '../../utils/formatUtils'
import { calculateMesoLimit, calculateMesoBonus, calculateItemDropBonus, calculateMesoLimitTime, type MesoCalculationParams, type ItemDropCalculationParams } from '../../utils/bonusCalculations'
import { validateAllInputs, type ValidationError } from '../../utils/validations'

// 드롭 아이템 인터페이스 (UI 컴포넌트의 인터페이스 확장)
interface DropItem extends UIDropItem {
  type: 'normal' | 'log' // 일반 아이템 드롭률 또는 로그 아이템 드롭률
  dropRate: number // 로그 아이템 드롭률 아이템에도 필수로 추가
}



interface CalculationResult {
  baseMeso: number
  totalIncome: number
  totalMeso: number
  mesoDropRate: number
  mesoPerDrop: number
  wealthAcquisitionPotionCount: number
  wealthAcquisitionPotionCost: number
  totalMesoPerHour: number
  totalMesoWithoutPotion: number
  dropItems: Map<string, {
    item: DropItem
    expectedCount: number
    expectedValue: number
    actualDropRate: number // 실제 아이템 드롭률 (아이템 드롭률 증가 효과 적용)
    dropMultiplier: number // 아이템 드롭률 배수
  }>
}

interface CalculationInputs {
  monsterLevel: number
  mesoBonus: number
  dropRate: number
  huntTime: number
  monsterCount: number
  resultTime: number
  feeRate: number
  isCustomHuntTime: boolean
  huntTimeUnit: string
  customHuntTimeValue: number
  isCustomResultTime: boolean
  resultTimeUnit: string
  customResultTimeValue: number
  characterLevel: number
  mesoInputMode: string
  dropRateInputMode: string
  mesoLegionBuff: boolean
  phantomLegionMeso: number
  mesoPotentialMode: string
  mesoPotentialLines: number
  mesoPotentialDirect: number
  mesoAbility: number
  globalBuffMode: string
  mesoArtifactLevel: number
  mesoArtifactMode: string
  mesoArtifactLevelInput: number
  mesoArtifactPercentInput: number
  dropRateLegionBuff: boolean
  dropRatePotentialMode: string
  dropRatePotentialLines: number
  dropRatePotentialDirect: number
  dropRateAbility: number
  dropRateArtifactLevel: number
  dropRateArtifactMode: string
  dropRateArtifactLevelInput: number
  dropRateArtifactPercentInput: number
  holySymbol: boolean
  decentHolySymbol: boolean
  decentHolySymbolLevel: number
  wealthAcquisitionPotion: boolean
  showWealthPotionCost: boolean
  wealthAcquisitionPotionPrice: number
  spottingSmallChange: boolean
  spottingSmallChangeLevel: number
  dropItems: DropItem[]
  normalDropItems?: Omit<UIDropItem, 'id'>[]
  logDropItems?: Omit<UIDropItem, 'id'>[]
}

// 기본값 정의
const DEFAULT_VALUES = {
  monsterLevel: 275,
  mesoBonus: 40,
  dropRate: 60,
  huntTime: 0.125,
  monsterCount: 39,
  resultTime: 30,
  feeRate: 3,
  isCustomHuntTime: false,
  huntTimeUnit: 'minutes',
  customHuntTimeValue: 7.5,
  isCustomResultTime: false,
  resultTimeUnit: 'minutes',
  customResultTimeValue: 30,
  mesoInputMode: 'detail',
  dropRateInputMode: 'detail',
  mesoLegionBuff: false,
  phantomLegionMeso: 4,
  mesoPotentialMode: 'lines',
  mesoPotentialLines: 0,
  mesoPotentialDirect: 0,
  mesoAbility: 20,
  globalBuffMode: 'legion',
  mesoArtifactLevel: 10,
  mesoArtifactMode: 'level',
  mesoArtifactLevelInput: 10,
  mesoArtifactPercentInput: 12,
  dropRateLegionBuff: false,
  dropRatePotentialMode: 'lines',
  dropRatePotentialLines: 0,
  dropRatePotentialDirect: 0,
  dropRateAbility: 15,
  dropRateArtifactLevel: 10,
  dropRateArtifactMode: 'level',
  dropRateArtifactLevelInput: 10,
  dropRateArtifactPercentInput: 12,
  holySymbol: false,
  decentHolySymbol: true,
  decentHolySymbolLevel: 30,
  wealthAcquisitionPotion: true,
  spottingSmallChange: true,
  spottingSmallChangeLevel: 3,
  showWealthPotionCost: true,
  wealthAcquisitionPotionPrice: 300,
  tallahartSymbolLevel: 0,
  autoCalculate: true,
  characterLevel: 275,
  dropItems: [] as DropItem[],
  normalDropItems: [
    { id: 'reindeer-milk', name: '순록의 우유', price: 0.275, dropRate: 0.565, directUse: true },
    { id: 'twilight-dew', name: '황혼의 이슬', price: 0.51, dropRate: 0.565, directUse: true },
    { id: 'spell-trace', name: '주문의 흔적', price: 0.2, dropRate: 1.2, directUse: false }
  ] as UIDropItem[],
  logDropItems: [
    { id: SOL_ERDA_FRAGMENT_ID, name: '솔 에르다 조각', price: 600, dropRate: 0.0425, directUse: false },
    { id: 'core-gemstone', name: '코어 젬스톤', price: 12, dropRate: 0.028, directUse: false },
    { id: 'symbol', name: '심볼', price: 60, dropRate: 0.00092, directUse: false }
  ] as UIDropItem[]
}

// 설정값에서 CalculationInputs 생성
const createCalculationInputsFromSettings = (settings: any): CalculationInputs => {
  return {
    monsterLevel: settings.monsterLevel ?? settings.mobLevel ?? DEFAULT_VALUES.monsterLevel,
    mesoBonus: settings.mesoBonus ?? DEFAULT_VALUES.mesoBonus,
    dropRate: settings.dropRate ?? settings.itemDropBonus ?? DEFAULT_VALUES.dropRate,
    huntTime: settings.huntTime ?? DEFAULT_VALUES.huntTime,
    monsterCount: settings.monsterCount ?? DEFAULT_VALUES.monsterCount,
    resultTime: settings.resultTime ?? DEFAULT_VALUES.resultTime,
    feeRate: settings.feeRate ?? DEFAULT_VALUES.feeRate,
    isCustomHuntTime: settings.isCustomHuntTime ?? DEFAULT_VALUES.isCustomHuntTime,
    huntTimeUnit: settings.huntTimeUnit ?? DEFAULT_VALUES.huntTimeUnit,
    customHuntTimeValue: settings.customHuntTimeValue ?? DEFAULT_VALUES.customHuntTimeValue,
    isCustomResultTime: settings.isCustomResultTime ?? DEFAULT_VALUES.isCustomResultTime,
    resultTimeUnit: settings.resultTimeUnit ?? DEFAULT_VALUES.resultTimeUnit,
    customResultTimeValue: settings.customResultTimeValue ?? DEFAULT_VALUES.customResultTimeValue,
    mesoInputMode: settings.mesoInputMode ?? DEFAULT_VALUES.mesoInputMode,
    dropRateInputMode: settings.dropRateInputMode ?? settings.itemDropInputMode ?? DEFAULT_VALUES.dropRateInputMode,
    mesoLegionBuff: settings.mesoLegionBuff ?? DEFAULT_VALUES.mesoLegionBuff,
    phantomLegionMeso: settings.phantomLegionMeso ?? DEFAULT_VALUES.phantomLegionMeso,
    mesoPotentialMode: settings.mesoPotentialMode ?? DEFAULT_VALUES.mesoPotentialMode,
    mesoPotentialLines: settings.mesoPotentialLines ?? DEFAULT_VALUES.mesoPotentialLines,
    mesoPotentialDirect: settings.mesoPotentialDirect ?? DEFAULT_VALUES.mesoPotentialDirect,
    mesoAbility: settings.mesoAbility ?? DEFAULT_VALUES.mesoAbility,
    globalBuffMode: settings.globalBuffMode ?? DEFAULT_VALUES.globalBuffMode,
    mesoArtifactLevel: settings.mesoArtifactLevel ?? DEFAULT_VALUES.mesoArtifactLevel,
    mesoArtifactMode: settings.mesoArtifactMode ?? DEFAULT_VALUES.mesoArtifactMode,
    mesoArtifactLevelInput: settings.mesoArtifactLevelInput ?? DEFAULT_VALUES.mesoArtifactLevelInput,
    mesoArtifactPercentInput: settings.mesoArtifactPercentInput ?? DEFAULT_VALUES.mesoArtifactPercentInput,
    dropRateLegionBuff: settings.dropRateLegionBuff ?? DEFAULT_VALUES.dropRateLegionBuff,
    dropRatePotentialMode: settings.dropRatePotentialMode ?? DEFAULT_VALUES.dropRatePotentialMode,
    dropRatePotentialLines: settings.dropRatePotentialLines ?? DEFAULT_VALUES.dropRatePotentialLines,
    dropRatePotentialDirect: settings.dropRatePotentialDirect ?? DEFAULT_VALUES.dropRatePotentialDirect,
    dropRateAbility: settings.dropRateAbility ?? DEFAULT_VALUES.dropRateAbility,
    dropRateArtifactLevel: settings.dropRateArtifactLevel ?? DEFAULT_VALUES.dropRateArtifactLevel,
    dropRateArtifactMode: settings.dropRateArtifactMode ?? DEFAULT_VALUES.dropRateArtifactMode,
    dropRateArtifactLevelInput: settings.dropRateArtifactLevelInput ?? DEFAULT_VALUES.dropRateArtifactLevelInput,
    dropRateArtifactPercentInput: settings.dropRateArtifactPercentInput ?? DEFAULT_VALUES.dropRateArtifactPercentInput,
    holySymbol: settings.holySymbol ?? DEFAULT_VALUES.holySymbol,
    decentHolySymbol: settings.decentHolySymbol ?? DEFAULT_VALUES.decentHolySymbol,
    decentHolySymbolLevel: settings.decentHolySymbolLevel ?? DEFAULT_VALUES.decentHolySymbolLevel,
    wealthAcquisitionPotion: settings.wealthAcquisitionPotion ?? DEFAULT_VALUES.wealthAcquisitionPotion,
    showWealthPotionCost: settings.showWealthPotionCost ?? DEFAULT_VALUES.showWealthPotionCost,
    wealthAcquisitionPotionPrice: settings.wealthAcquisitionPotionPrice ?? DEFAULT_VALUES.wealthAcquisitionPotionPrice,
    spottingSmallChange: settings.spottingSmallChange ?? DEFAULT_VALUES.spottingSmallChange,
    spottingSmallChangeLevel: settings.spottingSmallChangeLevel ?? DEFAULT_VALUES.spottingSmallChangeLevel,
    characterLevel: settings.characterLevel ?? DEFAULT_VALUES.characterLevel,
    dropItems: settings.dropItems ?? DEFAULT_VALUES.dropItems,
    normalDropItems: settings.normalDropItems ?? DEFAULT_VALUES.normalDropItems,
    logDropItems: settings.logDropItems ?? DEFAULT_VALUES.logDropItems
  }
}

// 시간 단위 변환 함수
const convertTimeToMinutes = (value: number, unit: string): number => {
  switch(unit) {
    case 'seconds': return value / 60
    case 'hours': return value * 60
    case 'mini_wealth': return value * 30
    case 'full_wealth': return value * 120
    case 'gen': return value * 0.125
    default: return value // minutes
  }
}

const convertMinutesToUnit = (minutes: number, unit: string): number => {
  switch(unit) {
    case 'seconds': return minutes * 60
    case 'hours': return minutes / 60
    case 'mini_wealth': return minutes / 30
    case 'full_wealth': return minutes / 120
    case 'gen': return minutes / 0.125
    default: return minutes // minutes
  }
}

// 라벨이 있는 NumberInput 컴포넌트
interface LabeledNumberInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

const LabeledNumberInput: React.FC<LabeledNumberInputProps> = ({
  label, value, onChange, min, max, step, className = "w-full"
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <NumberInput
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      step={step}
      size="md"
      className={className}
    />
  </div>
)


export function BasicCalculator() {
  const { showNotification } = useNotification()
  
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
  const [isEditingSlotName, setIsEditingSlotName] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
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
  const [isDropItemResultExpanded, setIsDropItemResultExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isLoadingSlot, setIsLoadingSlot] = useState(false)
  const [isDataSourceCardDismissedState, setIsDataSourceCardDismissedState] = useState(true) // 초기에는 숨김
  
  // 입력 검증 에러 상태
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  
  // 입력 상태
  const [monsterLevel, setMonsterLevel] = useState<number>(275)
  const [mesoBonus, setMesoBonus] = useState<number>(40)
  const [dropRate, setDropRate] = useState<number>(60)
  const [tallahartSymbolLevel, setTallahartSymbolLevel] = useState<number>(0)
  
  // 입력 방식 선택
  const [mesoInputMode, setMesoInputMode] = useState<'direct' | 'detail'>('detail')
  const [dropRateInputMode, setDropRateInputMode] = useState<'direct' | 'detail'>('detail')
  
  // 메획 상세 옵션
  const [mesoLegionBuff, setMesoLegionBuff] = useState<boolean>(false) // 유니온의 부
  const [phantomLegionMeso, setPhantomLegionMeso] = useState<number>(4) // 팬텀 유니온 (0~5%, 기본 4%)
  const [mesoPotentialMode, setMesoPotentialMode] = useState<'lines' | 'direct'>('lines')
  const [mesoPotentialLines, setMesoPotentialLines] = useState<number>(0)
  const [mesoPotentialDirect, setMesoPotentialDirect] = useState<number>(0)
  const [mesoAbility, setMesoAbility] = useState<number>(20)
  const [globalBuffMode, setGlobalBuffMode] = useState<'none' | 'challenger' | 'legion'>('legion')
  const [mesoArtifactLevel, setMesoArtifactLevel] = useState<number>(10)
  const [mesoArtifactMode, setMesoArtifactMode] = useState<'level' | 'percent'>('level')
  const [mesoArtifactLevelInput, setMesoArtifactLevelInput] = useState<number>(10)
  const [mesoArtifactPercentInput, setMesoArtifactPercentInput] = useState<number>(12)
  const [mesoOtherBuff, setMesoOtherBuff] = useState<number>(0) // 메소 기타 버프
  const [mesoOtherNonBuff, setMesoOtherNonBuff] = useState<number>(0) // 메소 기타 증가량
  const [dropRateLegionBuff, setDropRateLegionBuff] = useState<boolean>(false) // 유니온의 행운
  const [pcRoomMode, setPcRoomMode] = useState<boolean>(false) // PC방 아이템 드롭률 10%
  const [dropRatePotentialMode, setDropRatePotentialMode] = useState<'lines' | 'direct'>('lines')
  const [dropRatePotentialLines, setDropRatePotentialLines] = useState<number>(0) // Drop Rate 0줄
  const [dropRatePotentialDirect, setDropRatePotentialDirect] = useState<number>(0) 
  const [dropRateAbility, setDropRateAbility] = useState<number>(15) // 유니크 15%
  const [dropRateArtifactLevel, setDropRateArtifactLevel] = useState<number>(10)
  const [dropRateArtifactMode, setDropRateArtifactMode] = useState<'level' | 'percent'>('level')
  const [dropRateArtifactLevelInput, setDropRateArtifactLevelInput] = useState<number>(10)
  const [dropRateArtifactPercentInput, setDropRateArtifactPercentInput] = useState<number>(12)
  const [dropRateOtherBuff, setDropRateOtherBuff] = useState<number>(0) // 아이템 드롭률 기타 버프
  const [dropRateOtherNonBuff, setDropRateOtherNonBuff] = useState<number>(0) // 아이템 드롭률 기타 증가량
  const [holySymbol, setHolySymbol] = useState<boolean>(false)
  const [decentHolySymbol, setDecentHolySymbol] = useState<boolean>(true)
  const [decentHolySymbolLevel, setDecentHolySymbolLevel] = useState<number>(30)
  
  // Spotting Small Change
  const [spottingSmallChange, setSpottingSmallChange] = useState<boolean>(true)
  const [spottingSmallChangeLevel, setSpottingSmallChangeLevel] = useState<number>(3)
  
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
  const [resultTimeUnit, setResultTimeUnit] = useState<'seconds' | 'minutes' | 'hours' | 'mini_wealth' | 'full_wealth' | 'meso_limit'>('minutes')
  const [customResultTimeValue, setCustomResultTimeValue] = useState<number>(30)
  const [characterLevel, setCharacterLevel] = useState<number>(275) // 캐릭터 레벨 (메소 제한용)
  const [feeRate, setFeeRate] = useState<number>(3) // %
  
  // 자동 연산 토글
  const [autoCalculate, setAutoCalculate] = useState<boolean>(true)
  
  // 계산된 결과 및 계산 시점의 입력값
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [calculatedInputs, setCalculatedInputs] = useState<CalculationInputs | null>(null)
  
  // 드롭 아이템 상태 (일반 아이템 드롭률과 로그 아이템 드롭률로 분리)
  const [normalDropItems, setNormalDropItems] = useState<UIDropItem[]>(DEFAULT_VALUES.normalDropItems)
  const [logDropItems, setLogDropItems] = useState<UIDropItem[]>(DEFAULT_VALUES.logDropItems)
  
  // 전체 드롭 아이템 (계산용)
  const dropItems: DropItem[] = useMemo(() => [
    ...normalDropItems.map(item => ({ ...item, type: 'normal' as const, dropRate: item.dropRate || 0 })),
    ...logDropItems.map(item => ({ ...item, type: 'log' as const, dropRate: item.dropRate || 0 }))
  ], [normalDropItems, logDropItems])
  
  // setState 매핑
  const stateSetters = {
    monsterLevel: setMonsterLevel,
    mesoBonus: setMesoBonus,
    dropRate: setDropRate,
    mesoInputMode: setMesoInputMode,
    dropRateInputMode: setDropRateInputMode,
    mesoLegionBuff: setMesoLegionBuff,
    phantomLegionMeso: setPhantomLegionMeso,
    mesoPotentialMode: setMesoPotentialMode,
    mesoPotentialLines: setMesoPotentialLines,
    mesoPotentialDirect: setMesoPotentialDirect,
    mesoAbility: setMesoAbility,
    globalBuffMode: setGlobalBuffMode,
    mesoArtifactLevel: setMesoArtifactLevel,
    mesoArtifactMode: setMesoArtifactMode,
    mesoArtifactLevelInput: setMesoArtifactLevelInput,
    mesoArtifactPercentInput: setMesoArtifactPercentInput,
    dropRateLegionBuff: setDropRateLegionBuff,
    dropRatePotentialMode: setDropRatePotentialMode,
    dropRatePotentialLines: setDropRatePotentialLines,
    dropRatePotentialDirect: setDropRatePotentialDirect,
    dropRateAbility: setDropRateAbility,
    dropRateArtifactLevel: setDropRateArtifactLevel,
    dropRateArtifactMode: setDropRateArtifactMode,
    dropRateArtifactLevelInput: setDropRateArtifactLevelInput,
    dropRateArtifactPercentInput: setDropRateArtifactPercentInput,
    holySymbol: setHolySymbol,
    decentHolySymbol: setDecentHolySymbol,
    decentHolySymbolLevel: setDecentHolySymbolLevel,
    wealthAcquisitionPotion: setWealthAcquisitionPotion,
    spottingSmallChange: setSpottingSmallChange,
    spottingSmallChangeLevel: setSpottingSmallChangeLevel,
    huntTime: setHuntTime,
    isCustomHuntTime: setIsCustomHuntTime,
    huntTimeUnit: setHuntTimeUnit,
    customHuntTimeValue: setCustomHuntTimeValue,
    monsterCount: setMonsterCount,
    resultTime: setResultTime,
    isCustomResultTime: setIsCustomResultTime,
    resultTimeUnit: setResultTimeUnit,
    customResultTimeValue: setCustomResultTimeValue,
    feeRate: setFeeRate,
    showWealthPotionCost: setShowWealthPotionCost,
    wealthAcquisitionPotionPrice: setWealthAcquisitionPotionPrice,
    tallahartSymbolLevel: setTallahartSymbolLevel,
    autoCalculate: setAutoCalculate,
    characterLevel: setCharacterLevel,
    normalDropItems: setNormalDropItems,
    logDropItems: setLogDropItems
  }
  
  // 설정 저장/복원 함수
  // 슬롯 데이터 확인 함수
  const hasSlotDataFunction = (slot: number): boolean => {
    return mounted && slotHasData[slot]
  }

  // 초기화 함수
  const resetAll = () => {
    if (confirm('현재 슬롯의 모든 설정을 초기화하시겠습니까?')) {
      clearCalculatorSettings(currentSlot)
      
      // 기본값으로 초기화
      const RESET_VALUES = DEFAULT_VALUES
      
      // stateSetters를 사용하여 상태 업데이트
      Object.entries(RESET_VALUES).forEach(([key, value]) => {
        if (key in stateSetters) {
          stateSetters[key as keyof typeof stateSetters](value as any)
        }
      })
      
      // 슬롯 이름 초기화
      setSlotNames(prev => ({
        ...prev,
        [currentSlot]: `슬롯 ${currentSlot}`
      }))
      setTempSlotName(`슬롯 ${currentSlot}`)
      setSlotHasData(prev => ({
        ...prev,
        [currentSlot]: false
      }))
      
      showNotification('success', '현재 슬롯이 초기화되었습니다.')
    }
  }

  const saveSettings = (slotNumber: number = currentSlot) => {
    if (!canUseFunctionalCookies()) {
      showNotification('error', '기능성 쿠키가 비활성화되어 있습니다.')
      return
    }
    
    const settings = {
      ...getCurrentInputs(),
      autoCalculate,
      slotName: slotNumber === currentSlot ? tempSlotName : slotNames[slotNumber]
    }
    
    if (saveCalculatorSettings(settings, slotNumber)) {
      setSlotHasData(prev => ({
        ...prev,
        [slotNumber]: true
      }))
      // 슬롯 이름도 저장
      if (slotNumber === currentSlot && tempSlotName) {
        setSlotNames(prev => ({
          ...prev,
          [slotNumber]: tempSlotName
        }))
      }
      // 저장 성공 시 마지막 저장된 입력값 및 슬롯 이름 업데이트
      // settings 객체에서 실제 저장된 값들을 사용
      const actualSavedInputs: CalculationInputs = settings
      
      setLastSavedInputs(prev => ({
        ...prev,
        [slotNumber]: actualSavedInputs
      }))
      setLastSavedSlotNames(prev => ({
        ...prev,
        [slotNumber]: slotNumber === currentSlot ? tempSlotName : slotNames[slotNumber]
      }))
      showNotification('success', `슬롯 ${slotNumber}에 설정이 저장되었습니다.`)
      // 슬롯 이름 편집 모드 종료
      if (slotNumber === currentSlot) {
        setIsEditingSlotName(false)
      }
    } else {
      showNotification('error', '설정 저장에 실패했습니다.')
    }
  }
  
  const loadSettings = (slotNumber: number = currentSlot, isInitialLoad: boolean = false) => {
    if (!canUseFunctionalCookies()) {
      return
    }
    
    setIsLoadingSlot(true)
    
    const settings = loadCalculatorSettings(slotNumber)
    
    if (!settings) {
      // 슬롯이 비어있으면 기본값으로 초기화
      setCurrentSlot(slotNumber)
      setTempSlotName(slotNames[slotNumber] || `슬롯 ${slotNumber}`)
      
      // DEFAULT_VALUES를 사용하여 초기화
      Object.entries(DEFAULT_VALUES).forEach(([key, value]) => {
        if (key in stateSetters) {
          stateSetters[key as keyof typeof stateSetters](value as any)
        }
      })
      setAutoCalculate(true)
      setCharacterLevel(275)
      
      setLastSavedSlotNames(prev => ({
        ...prev,
        [slotNumber]: slotNames[slotNumber] || `슬롯 ${slotNumber}`
      }))
      
      setIsLoadingSlot(false)
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
    Object.entries(settings).forEach(([key, value]) => {
      if (value !== undefined && key in stateSetters) {
        stateSetters[key as keyof typeof stateSetters](value as any)
      }
    })
    
    // 호환용: union을 legion으로 변경
    if (settings.globalBuffMode === 'union') {
      setGlobalBuffMode('legion')
    }
    
    // dropItems를 normalDropItems와 logDropItems로 분리 (레거시 지원)
    if (settings.dropItems) {
      const normalItems = settings.dropItems.filter((item: DropItem) => item.type === 'normal')
        .map(({ name, price, dropRate, directUse }: any, index: number) => ({ 
          id: `normal-drop-item-${index + 1}`, // ID를 순서대로 자동 부여
          name, 
          price: price || 0, 
          dropRate: dropRate || 0, 
          directUse: directUse || false 
        }))
      const logItems = settings.dropItems.filter((item: DropItem) => item.type === 'log')
        .map(({ name, price, dropRate, directUse }: any, index: number) => ({ 
          id: `log-drop-item-${index + 1}`, // ID를 순서대로 자동 부여
          name, 
          price: price || 0, 
          dropRate: dropRate || 0, 
          directUse: directUse || false 
        }))
      
      // 레거시 데이터에서 솔 에르다 조각 ID 오버라이드 및 추가
      const solErdaIndex = logItems.findIndex((item: any) => item.name === '솔 에르다 조각')
      if (solErdaIndex !== -1) {
        // 솔 에르다 조각이 있으면 ID를 고정 ID로 오버라이드
        logItems[solErdaIndex].id = SOL_ERDA_FRAGMENT_ID
      } else {
        // 없으면 추가
        logItems.push({
          id: SOL_ERDA_FRAGMENT_ID,
          name: '솔 에르다 조각',
          price: 600,
          dropRate: 0.0425,
          directUse: false
        })
      }
      
      setNormalDropItems(normalItems)
      setLogDropItems(logItems)
    }
    
    // 새로운 형식의 normalDropItems와 logDropItems 처리 (기본값 지원)
    if (settings.normalDropItems) {
      setNormalDropItems(settings.normalDropItems.map((item: any, index: number) => ({
        ...item,
        id: `normal-drop-item-${index + 1}`, // ID를 순서대로 자동 부여
        price: item.price || 0,
        dropRate: item.dropRate || 0,
        directUse: item.directUse || false
      })))
    } else if (!settings.dropItems) {
      // 기존 데이터에 드롭 설정이 전혀 없으면 기본값 사용
      setNormalDropItems(DEFAULT_VALUES.normalDropItems)
    }
    
    if (settings.logDropItems) {
      const logItems = settings.logDropItems.map((item: any, index: number) => ({
        ...item,
        id: `log-drop-item-${index + 1}`, // ID를 순서대로 자동 부여
        price: item.price || 0,
        dropRate: item.dropRate || 0,
        directUse: item.directUse || false
      }))
      
      // 솔 에르다 조각 ID 오버라이드 및 추가 처리
      const solErdaIndex = logItems.findIndex((item: any) => item.name === '솔 에르다 조각')
      if (solErdaIndex !== -1) {
        // 리스트에 솔 에르다 조각이 있으면 ID를 고정 ID로 오버라이드
        logItems[solErdaIndex].id = SOL_ERDA_FRAGMENT_ID
      } else {
        // 리스트에 없으면 별도 저장된 솔 에르다 조각 확인
        if (settings.solErdaFragment) {
          logItems.push({
            id: SOL_ERDA_FRAGMENT_ID,
            name: settings.solErdaFragment.name || '솔 에르다 조각',
            price: settings.solErdaFragment.price || 600,
            dropRate: settings.solErdaFragment.dropRate || 0.0425,
            directUse: settings.solErdaFragment.directUse || false
          })
        } else {
          // 솔 에르다 조각이 아예 없으면 기본값 추가
          logItems.push({
            id: SOL_ERDA_FRAGMENT_ID,
            name: '솔 에르다 조각',
            price: 600,
            dropRate: 0.0425,
            directUse: false
          })
        }
      }
      
      setLogDropItems(logItems)
    } else if (!settings.dropItems) {
      // 기존 데이터에 드롭 설정이 전혀 없으면 기본값 사용
      setLogDropItems(DEFAULT_VALUES.logDropItems)
    }
    
    // 저장된 슬롯 이름이 있으면 사용, 없으면 기본값 사용
    const slotName = settings.slotName || slotNames[slotNumber] || `슬롯 ${slotNumber}`
    setTempSlotName(slotName)
    
    setCurrentSlot(slotNumber)
    setSettingsLoaded(true)
    if (!isInitialLoad) {
      showNotification('success', `슬롯 ${slotNumber}의 설정을 불러왔습니다.`)
    }
    
    setLastSavedSlotNames(prev => ({
      ...prev,
      [slotNumber]: settings.slotName || slotNames[slotNumber] || `슬롯 ${slotNumber}`
    }))
    
    // 설정 복원 메시지를 3초 후 숨김
    setTimeout(() => setSettingsLoaded(false), 3000)
    
    setIsLoadingSlot(false)
  }
  
  // 컴포넌트 마운트 시 설정 로드
  useEffect(() => {
    setMounted(true)
    
    // 모든 슬롯의 이름과 데이터 유무를 로드
    if (canUseFunctionalCookies()) {
      const newSlotNames: {[key: number]: string} = {}
      const newSlotHasData: {[key: number]: boolean} = {}
      
      for (let i = 1; i <= 3; i++) {
        const settings = loadCalculatorSettings(i)
        
        if (settings) {
          newSlotHasData[i] = true
          if (settings.slotName) {
            newSlotNames[i] = settings.slotName
          } else {
            newSlotNames[i] = `슬롯 ${i}`
          }
        } else {
          newSlotHasData[i] = false
          newSlotNames[i] = `슬롯 ${i}`
        }
      }
      setSlotNames(newSlotNames)
      setSlotHasData(newSlotHasData)
      setTempSlotName(newSlotNames[1] || '슬롯 1')
      // 초기 로드 시 슬롯 이름만 먼저 설정
      setLastSavedSlotNames(newSlotNames)
      
      // 데이터 소스 카드 닫기 상태 로드
      setIsDataSourceCardDismissedState(isDataSourceCardDismissed())
      
      // slotNames가 업데이트된 후에 loadSettings 호출
      // setTimeout을 사용하여 다음 렌더링 사이클에서 실행
      setTimeout(() => {
        loadSettings(1, true)
      }, 0)
    } else {
      setTempSlotName('슬롯 1')
      // 쿠키 사용 불가 시에도 기본값 로드
      setTimeout(() => {
        loadSettings(1, true)
      }, 0)
    }
  }, [])

  // 현재 입력값들을 객체로 반환
  // 현재 상태값들을 객체로 묶어서 반환
  const getCurrentInputs = () => ({
    monsterLevel, mesoBonus, dropRate, huntTime, monsterCount, resultTime,
    feeRate, isCustomHuntTime, huntTimeUnit,
    customHuntTimeValue, isCustomResultTime, resultTimeUnit, customResultTimeValue,
    characterLevel, mesoInputMode, dropRateInputMode, mesoLegionBuff,
    phantomLegionMeso, mesoPotentialMode, mesoPotentialLines, mesoPotentialDirect,
    mesoAbility, globalBuffMode, mesoArtifactLevel, mesoArtifactMode,
    mesoArtifactLevelInput, mesoArtifactPercentInput, dropRateLegionBuff,
    dropRatePotentialMode, dropRatePotentialLines, dropRatePotentialDirect,
    dropRateAbility, dropRateArtifactLevel, dropRateArtifactMode,
    dropRateArtifactLevelInput, dropRateArtifactPercentInput, holySymbol,
    decentHolySymbol, decentHolySymbolLevel, wealthAcquisitionPotion,
    showWealthPotionCost, wealthAcquisitionPotionPrice, spottingSmallChange,
    spottingSmallChangeLevel, tallahartSymbolLevel, dropItems,
    normalDropItems: normalDropItems
      .map(({ name, price, dropRate, directUse }) => ({ name, price, dropRate, directUse, type: 'normal' as const })),
    logDropItems: logDropItems
      .filter(item => item.id !== SOL_ERDA_FRAGMENT_ID)
      .map(({ name, price, dropRate, directUse }) => ({ name, price, dropRate, directUse, type: 'log' as const })),
    // 솔 에르다 조각 별도 저장
    solErdaFragment: (() => {
      const solErdaItem = logDropItems.find(item => item.id === SOL_ERDA_FRAGMENT_ID)
      return solErdaItem ? {
        name: solErdaItem.name,
        price: solErdaItem.price,
        dropRate: solErdaItem.dropRate,
        directUse: solErdaItem.directUse
      } : null
    })()
  })

  // 데이터 소스 카드 닫기 핸들러
  const handleDataSourceCardDismiss = () => {
    setIsDataSourceCardDismissedState(true)
    setDataSourceCardDismissed()
  }

  // 미저장 변경사항 감지
  const hasUnsavedChanges = useMemo(() => {
    // 초기 로드 중이거나 슬롯 로딩 중이면 변경사항 없음
    if (!mounted || isLoadingSlot) {
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
      
      // 배열이나 객체인 경우 JSON 문자열로 변환하여 비교
      if (typeof currentValue === 'object' && currentValue !== null) {
        return JSON.stringify(currentValue) !== JSON.stringify(savedValue)
      }
      
      return currentValue !== savedValue
    })
    
    return nameChanged || valuesChanged
  }, [tempSlotName, lastSavedSlotNames, currentSlot, lastSavedInputs, mounted, isLoadingSlot, monsterLevel, mesoBonus, dropRate, huntTime, monsterCount, resultTime, feeRate, isCustomHuntTime, huntTimeUnit, customHuntTimeValue, isCustomResultTime, resultTimeUnit, customResultTimeValue, mesoInputMode, dropRateInputMode, mesoLegionBuff, phantomLegionMeso, mesoPotentialMode, mesoPotentialLines, mesoPotentialDirect, mesoAbility, globalBuffMode, mesoArtifactLevel, dropRateLegionBuff, dropRatePotentialMode, dropRatePotentialLines, dropRatePotentialDirect, dropRateAbility, dropRateArtifactLevel, holySymbol, decentHolySymbol, decentHolySymbolLevel, wealthAcquisitionPotion, mesoArtifactMode, mesoArtifactLevelInput, mesoArtifactPercentInput, dropRateArtifactMode, dropRateArtifactLevelInput, dropRateArtifactPercentInput, showWealthPotionCost, wealthAcquisitionPotionPrice, spottingSmallChange, spottingSmallChangeLevel, characterLevel, normalDropItems, logDropItems])

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


  // 메획 계산 파라미터 생성
  const getMesoCalculationParams = (): MesoCalculationParams => ({
    inputMode: mesoInputMode,
    directValue: mesoBonus,
    globalBuffMode: globalBuffMode,
    legionBuff: mesoLegionBuff,
    phantomLegionMeso: phantomLegionMeso,
    potentialMode: mesoPotentialMode,
    potentialLines: mesoPotentialLines,
    potentialDirect: mesoPotentialDirect,
    ability: mesoAbility,
    artifactMode: mesoArtifactMode,
    artifactLevel: mesoArtifactLevelInput,
    artifactPercent: mesoArtifactPercentInput,
    tallahartSymbolLevel: tallahartSymbolLevel,
    wealthAcquisitionPotion: wealthAcquisitionPotion,
    otherBuff: mesoOtherBuff,
    otherNonBuff: mesoOtherNonBuff,
    characterLevel: characterLevel,
    monsterLevel: monsterLevel
  })

  // 아드 계산 파라미터 생성
  const getItemDropCalculationParams = (): ItemDropCalculationParams => ({
    inputMode: dropRateInputMode,
    directValue: dropRate,
    globalBuffMode: globalBuffMode,
    legionBuff: dropRateLegionBuff,
    potentialMode: dropRatePotentialMode,
    potentialLines: dropRatePotentialLines,
    potentialDirect: dropRatePotentialDirect,
    ability: dropRateAbility,
    artifactMode: dropRateArtifactMode,
    artifactLevel: dropRateArtifactLevelInput,
    artifactPercent: dropRateArtifactPercentInput,
    tallahartSymbolLevel: tallahartSymbolLevel,
    holySymbol: holySymbol,
    decentHolySymbol: decentHolySymbol,
    decentHolySymbolLevel: decentHolySymbolLevel,
    wealthAcquisitionPotion: wealthAcquisitionPotion,
    pcRoomMode: pcRoomMode,
    otherBuff: dropRateOtherBuff,
    otherNonBuff: dropRateOtherNonBuff
  })

  // calculateDrops 함수 내부
  const calculateDrops = () => {
    const inputs = getCurrentInputs()
    
    // 현재 파라미터들 저장
    const currentMesoParams = getMesoCalculationParams()
    const currentItemDropParams = getItemDropCalculationParams()
    const calculatedMesoBonus = calculateMesoBonus(currentMesoParams).totalBonus
    const calculatedItemDropBonus = calculateItemDropBonus(currentItemDropParams).totalBonus
    
    // 단위 시간당 처치 수
    const mobsPerMinute = inputs.monsterCount / inputs.huntTime
    const mobsPerHour = mobsPerMinute * 60
    
    // 메소 제한 옵션 처리
    let actualResultTime = inputs.resultTime
    
    if (inputs.isCustomResultTime && inputs.resultTimeUnit === 'meso_limit') {
      // 메소 제한량 계산
      const mesoLimit = calculateMesoLimit(characterLevel)
      
      // 몬스터 1마리당 기본 메소 드롭량 계산 (메획 보너스 적용 전)
      const baseMesoPerMob = inputs.monsterLevel * 7.5
      
      // 메소 제한량에 도달하는데 필요한 몬스터 수
      const mobsForMesoLimit = Math.ceil(mesoLimit / baseMesoPerMob)
      
      // 필요한 시간 계산 (분 단위)
      actualResultTime = mobsForMesoLimit / mobsPerMinute
    }
    
    // 결과 시간 동안의 총 처치 수
    const totalMonsters = mobsPerMinute * actualResultTime
    
    // 잔돈이 눈에 띄네 보너스 계산
    const spottingSmallChangeBonus = inputs.spottingSmallChange ? inputs.spottingSmallChangeLevel * 2 + 2 : 0

    // 현재 헌팅 파라미터들 저장
    const currentHuntingParams = {
      monsterLevel: inputs.monsterLevel,
      totalMonsters,
      mesoBonus: calculatedMesoBonus,
      dropRate: calculatedItemDropBonus,
      feeRate: inputs.feeRate,
      spottingSmallChangeBonus: spottingSmallChangeBonus,
      characterLevel: inputs.characterLevel,
      normalDropItems: dropItems.filter(item => item.type === 'normal'),
      logDropItems: dropItems.filter(item => item.type === 'log')
    }

    // 재물 획득의 비약 적용된 상태의 드롭 데이터 계산
    const dropResultWithPotion = calculateHuntingExpectation(currentHuntingParams)
    
    // 시간당 계산 (재물 획득의 비약 적용된 상태)
    const perHourHuntingParams = { ...currentHuntingParams, totalMonsters: mobsPerHour }
    const dropResultPerHourWithPotion = calculateHuntingExpectation(perHourHuntingParams)
    
    // 재물 획득의 비약 없을 때의 파라미터 계산
    let futureMesoParams = { ...currentMesoParams }
    let futureItemDropParams = { ...currentItemDropParams }
    
    if (wealthAcquisitionPotion) {
      // 재물 획득의 비약 효과 제거
      futureMesoParams.wealthAcquisitionPotion = false
      futureItemDropParams.wealthAcquisitionPotion = false
    }
    
    const mesoAcquisitionRateWithoutPotion = calculateMesoBonus(futureMesoParams).totalBonus
    const itemDropRateWithoutPotion = calculateItemDropBonus(futureItemDropParams).totalBonus
    
    const withoutPotionHuntingParams = {
      ...currentHuntingParams,
      mesoBonus: mesoAcquisitionRateWithoutPotion,
      dropRate: itemDropRateWithoutPotion
    }
    const dropResultWithoutPotion = calculateHuntingExpectation(withoutPotionHuntingParams)
    
    // 드롭 아이템 결과를 Map으로 변환 (ID를 키로 사용)
    const dropItemResults = new Map(
      dropResultWithPotion.dropItems.map(dropResult => [
        dropResult.item.id,
        {
          item: {
            ...dropResult.item,
            type: (dropResult.item.type || 'normal') as 'normal' | 'log'
          } as DropItem,
          expectedCount: dropResult.expectedCount,
          expectedValue: dropResult.expectedValue,
          actualDropRate: dropResult.actualDropRate,
          dropMultiplier: dropResult.dropMultiplier
        }
      ])
    )
    
    const dropItemResultsPerHour = new Map(
      dropResultPerHourWithPotion.dropItems.map(dropResult => [
        dropResult.item.id,
        {
          item: {
            ...dropResult.item,
            type: (dropResult.item.type || 'normal') as 'normal' | 'log'
          } as DropItem,
          expectedCount: dropResult.expectedCount,
          expectedValue: dropResult.expectedValue,
          actualDropRate: dropResult.actualDropRate,
          dropMultiplier: dropResult.dropMultiplier
        }
      ])
    )
    
    // 드롭 아이템 총 가치
    const totalDropItemValue = Array.from(dropItemResults.values())
      .reduce((sum, item) => sum + item.expectedValue, 0)
    
    const totalDropItemValuePerHour = Array.from(dropItemResultsPerHour.values())
      .reduce((sum, item) => sum + item.expectedValue, 0)
    
    // 재물 획득의 비약 관련 계산
    let wealthAcquisitionPotionCount = 0
    let wealthAcquisitionPotionCost = 0
    let wealthAcquisitionPotionCountPerHour = 0
    let wealthAcquisitionPotionCostPerHour = 0

    if (wealthAcquisitionPotion && showWealthPotionCost) {
      // 30분마다 1개씩 사용 (31분이면 2개)
      wealthAcquisitionPotionCount = Math.ceil(actualResultTime / 30)
      wealthAcquisitionPotionCost = wealthAcquisitionPotionCount * wealthAcquisitionPotionPrice * 10000
      
      // 1시간 기준 계산 (2개 사용)
      wealthAcquisitionPotionCountPerHour = 2
      wealthAcquisitionPotionCostPerHour = wealthAcquisitionPotionCountPerHour * wealthAcquisitionPotionPrice * 10000
    }

    // 재획비 없을 때의 드롭 아이템 결과도 통합된 계산에서 가져옴
    const totalDropItemValueWithoutPotion = dropResultWithoutPotion.totalDropItemValue

    // 총 메소 계산 (각 구성 요소를 명확히 분리)
    const baseMeso = dropResultWithPotion.totalMeso // 기본 메소만
    const totalIncomeBeforeCost = baseMeso + totalDropItemValue // 전체 수익
    const totalMesoWithPotion = totalIncomeBeforeCost - wealthAcquisitionPotionCost // 재획비 차감 후
    
    // 재획비 없을 때 계산도 동일하게 분리
    const totalMesoWithoutPotion = dropResultWithoutPotion.totalIncome // 재획비 없을 때
    
    // 시간당 계산도 분리해서 처리  
    const baseMesoPerHour = dropResultPerHourWithPotion.totalMeso
    const totalMesoPerHour = baseMesoPerHour + totalDropItemValuePerHour - wealthAcquisitionPotionCostPerHour

    const newResult = {
      baseMeso, // 기본 메소만 (솔 에르다, 드롭 아이템 제외)
      totalIncome: totalIncomeBeforeCost, // 기본 메소 + 솔 에르다 + 드롭 아이템 (재획비 비용 제외)
      totalMeso: totalMesoWithPotion, // 최종 총 메소 (재획비 비용 차감)
      mesoDropRate: dropResultWithPotion.mesoDropRate,
      mesoPerDrop: dropResultWithPotion.mesoPerDrop,
      wealthAcquisitionPotionCount,
      wealthAcquisitionPotionCost,
      totalMesoPerHour,
      totalMesoWithoutPotion,
      dropItems: dropItemResults
    }

    setResult(newResult)
    setCalculatedInputs(inputs)
  }

  // 슬롯 로딩 완료 시 현재 상태를 저장
  useEffect(() => {
    if (!isLoadingSlot && mounted) {
      const currentInputs = getCurrentInputs()
      setLastSavedInputs(prev => ({
        ...prev,
        [currentSlot]: currentInputs
      }))
    }
  }, [isLoadingSlot, mounted, currentSlot])

  // 자동 연산이 켜져있을 때 입력값 변경 감지
  useEffect(() => {
    if (autoCalculate) {
      calculateDrops()
    }
  }, [monsterLevel, mesoBonus, dropRate, huntTime, monsterCount, resultTime, feeRate, autoCalculate, customHuntTimeValue, huntTimeUnit, customResultTimeValue, resultTimeUnit, isCustomHuntTime, isCustomResultTime, mesoInputMode, dropRateInputMode, mesoLegionBuff, phantomLegionMeso, mesoPotentialMode, mesoPotentialLines, mesoPotentialDirect, mesoAbility, globalBuffMode, mesoArtifactLevel, dropRateLegionBuff, dropRatePotentialMode, dropRatePotentialLines, dropRatePotentialDirect, dropRateAbility, dropRateArtifactLevel, holySymbol, decentHolySymbol, decentHolySymbolLevel, wealthAcquisitionPotion, mesoArtifactMode, mesoArtifactLevelInput, mesoArtifactPercentInput, dropRateArtifactMode, dropRateArtifactLevelInput, dropRateArtifactPercentInput, showWealthPotionCost, wealthAcquisitionPotionPrice, spottingSmallChange, spottingSmallChangeLevel, characterLevel, normalDropItems, logDropItems, tallahartSymbolLevel, pcRoomMode])

  // 입력값 유효성 검사
  useEffect(() => {
    const errors = validateAllInputs({
      dropRateAbility,
      mesoAbility,
      characterLevel,
      tallahartSymbolLevel
    })
    setValidationErrors(errors)
  }, [dropRateAbility, mesoAbility, characterLevel, tallahartSymbolLevel])


  // 유니온 버프 효과를 고려한 계산 헬퍼 함수
  const calculateWithLegionEffect = useCallback((
    withLegionBuff: boolean, 
    effectType: 'drop' | 'meso',
    currentHuntingParams: any,
    currentMesoParams: MesoCalculationParams,
    currentItemDropParams: ItemDropCalculationParams
  ) => {
    if (!result) return null

    // future params 생성
    let futureMesoParams = { ...currentMesoParams }
    let futureItemDropParams = { ...currentItemDropParams }

    if (effectType === 'drop' && withLegionBuff && globalBuffMode !== 'challenger') {
      // 아이템 드롭률: 유니온의 행운 상태를 토글
      futureItemDropParams.legionBuff = !dropRateLegionBuff
    }

    if (effectType === 'meso' && withLegionBuff && globalBuffMode !== 'challenger') {
      // 메소: 유니온의 부 상태를 토글
      futureMesoParams.legionBuff = !mesoLegionBuff
    }

    // future hunting params 생성
    const futureHuntingParams = {
      ...currentHuntingParams,
      mesoBonus: calculateMesoBonus(futureMesoParams).totalBonus,
      dropRate: calculateItemDropBonus(futureItemDropParams).totalBonus
    }

    return calculateHuntingExpectation(futureHuntingParams)
  }, [result, globalBuffMode, dropRateLegionBuff, mesoLegionBuff])

  // TMI 정보 계산
  const calculateTMIInfo = useMemo(() => {
    if (!result) return null

    const inputs = getCurrentInputs()
    const mobsPerMinute = inputs.monsterCount / inputs.huntTime
    
    // 메소 제한 옵션인 경우 실제 시간 계산
    let actualResultTime = inputs.resultTime
    if (inputs.isCustomResultTime && inputs.resultTimeUnit === 'meso_limit') {
      actualResultTime = calculateMesoLimitTime(characterLevel, inputs.monsterLevel, inputs.monsterCount, inputs.huntTime)
    }
    
    const totalMonsters = mobsPerMinute * actualResultTime

    // 현재 파라미터들 저장
    const currentMesoParams = getMesoCalculationParams()
    const currentItemDropParams = getItemDropCalculationParams()
    const currentMesoBonus = calculateMesoBonus(currentMesoParams).totalBonus
    const currentItemDropBonus = calculateItemDropBonus(currentItemDropParams).totalBonus

    // 잔돈이 눈에 띄네 보너스 계산
    const spottingSmallChangeBonus = inputs.spottingSmallChange ? inputs.spottingSmallChangeLevel * 2 + 2 : 0

    // 현재 헌팅 파라미터들 저장
    const currentHuntingParams = {
      monsterLevel: inputs.monsterLevel,
      totalMonsters,
      mesoBonus: currentMesoBonus,
      dropRate: currentItemDropBonus,
      feeRate: inputs.feeRate,
      spottingSmallChangeBonus: spottingSmallChangeBonus,
      characterLevel: inputs.characterLevel,
      normalDropItems: dropItems.filter(item => item.type === 'normal'),
      logDropItems: dropItems.filter(item => item.type === 'log')
    }

    // 아이템 드롭률 20% 증가 효과 - 전체 기댓값 계산
    const dropBonusHuntingParams = {
      ...currentHuntingParams,
      dropRate: currentItemDropBonus + 20 // 기존 아이템 드롭률에 20% 추가
    }
    const dropCalcWithDropBonus = calculateHuntingExpectation(dropBonusHuntingParams)
    const dragonDropRateTotal = dropCalcWithDropBonus.totalIncome
    
    // 메획 20% 증가 효과 - 전체 기댓값 계산
    const additionalMesoBonus = wealthAcquisitionPotion ? 24 : 20
    const mesoBonusHuntingParams = {
      ...currentHuntingParams,
      mesoBonus: currentMesoBonus + additionalMesoBonus
    }
    const dropCalcWithMesoBonus = calculateHuntingExpectation(mesoBonusHuntingParams)
    const dragonMesoRateTotal = dropCalcWithMesoBonus.totalIncome

    // 잠재능력 0줄 대비 현재 이득 계산
    const calculateZeroPotentialBenefit = (type: 'drop' | 'meso') => {
      // future params 생성
      let futureMesoParams = { ...currentMesoParams }
      let futureItemDropParams = { ...currentItemDropParams }
      
      if (type === 'drop') {
        // 아이템 드롭률 잠재능력만 0으로 설정
        futureItemDropParams.potentialLines = 0
        futureItemDropParams.potentialDirect = 0
      } else {
        // 메소 잠재능력만 0으로 설정  
        futureMesoParams.potentialLines = 0
        futureMesoParams.potentialDirect = 0
      }
      
      const futureHuntingParams = {
        ...currentHuntingParams,
        mesoBonus: calculateMesoBonus(futureMesoParams).totalBonus,
        dropRate: calculateItemDropBonus(futureItemDropParams).totalBonus
      }
      
      const zeroCalc = calculateHuntingExpectation(futureHuntingParams)
      
      return result.totalIncome - zeroCalc.totalIncome
    }

    // 유니온 아티팩트 & 팬텀 유니온 개별 계산
    const calculateLegionArtifactBenefit = () => {
      // 아이템 드롭률 유니온 아티팩트 10레벨 (12%)
      const maxDropArtifactBonus = 12
      let futureDropParams = { ...currentItemDropParams }
      futureDropParams.artifactLevel = 10
      futureDropParams.artifactMode = 'percent'
      futureDropParams.artifactPercent = maxDropArtifactBonus
      
      const maxDropArtifactHuntingParams = {
        ...currentHuntingParams,
        dropRate: calculateItemDropBonus(futureDropParams).totalBonus
      }
      const maxDropArtifactCalc = calculateHuntingExpectation(maxDropArtifactHuntingParams)

      // 메획 유니온 아티팩트 10레벨 (12%)
      const maxMesoArtifactBonus = 12
      let futureMesoParams = { ...currentMesoParams }
      futureMesoParams.artifactLevel = 10
      futureMesoParams.artifactMode = 'percent'
      futureMesoParams.artifactPercent = maxMesoArtifactBonus
      
      const maxMesoArtifactHuntingParams = {
        ...currentHuntingParams,
        mesoBonus: calculateMesoBonus(futureMesoParams).totalBonus
      }
      const maxMesoArtifactCalc = calculateHuntingExpectation(maxMesoArtifactHuntingParams)

      // 팬텀 유니온 5%
      const maxPhantomLegionBonus = 5
      let futurePhantomMesoParams = { ...currentMesoParams }
      futurePhantomMesoParams.phantomLegionMeso = maxPhantomLegionBonus
      
      const maxPhantomLegionHuntingParams = {
        ...currentHuntingParams,
        mesoBonus: calculateMesoBonus(futurePhantomMesoParams).totalBonus
      }
      const maxPhantomLegionCalc = calculateHuntingExpectation(maxPhantomLegionHuntingParams)

      // 0레벨/0% 대비 현재 이득 계산 - 현재 설정값이 얼마나 도움이 되는지 측정
      
      // 아이템 드롭률 유니온 아티팩트 0레벨/0% 상태로 계산
      let zeroDropArtifactParams = { ...currentItemDropParams }
      zeroDropArtifactParams.artifactLevel = 0
      zeroDropArtifactParams.artifactPercent = 0
      
      const zeroDropArtifactHuntingParams = {
        ...currentHuntingParams,
        dropRate: calculateItemDropBonus(zeroDropArtifactParams).totalBonus
      }
      const zeroDropArtifactCalc = calculateHuntingExpectation(zeroDropArtifactHuntingParams)

      // 메소 유니온 아티팩트 0레벨/0% 상태로 계산
      let zeroMesoArtifactParams = { ...currentMesoParams }
      zeroMesoArtifactParams.artifactLevel = 0
      zeroMesoArtifactParams.artifactPercent = 0
      
      const zeroMesoArtifactHuntingParams = {
        ...currentHuntingParams,
        mesoBonus: calculateMesoBonus(zeroMesoArtifactParams).totalBonus
      }
      const zeroMesoArtifactCalc = calculateHuntingExpectation(zeroMesoArtifactHuntingParams)

      // 팬텀 유니온 0% 상태로 계산
      let zeroPhantomLegionParams = { ...currentMesoParams }
      zeroPhantomLegionParams.phantomLegionMeso = 0
      
      const zeroPhantomLegionHuntingParams = {
        ...currentHuntingParams,
        mesoBonus: calculateMesoBonus(zeroPhantomLegionParams).totalBonus
      }
      const zeroPhantomLegionCalc = calculateHuntingExpectation(zeroPhantomLegionHuntingParams)

      return {
        // 최대 레벨/% 달성 시 현재 대비 추가 이득
        maxDropArtifactIncrease: maxDropArtifactCalc.totalIncome - result.totalIncome,
        maxMesoArtifactIncrease: maxMesoArtifactCalc.totalIncome - result.totalIncome,
        maxPhantomLegionIncrease: maxPhantomLegionCalc.totalIncome - result.totalIncome,
        // 현재 설정값이 0레벨/0% 대비 제공하는 이득
        currentDropArtifactBenefit: result.totalIncome - zeroDropArtifactCalc.totalIncome,
        currentMesoArtifactBenefit: result.totalIncome - zeroMesoArtifactCalc.totalIncome,
        currentPhantomLegionBenefit: result.totalIncome - zeroPhantomLegionCalc.totalIncome
      }
    }

    const legionBenefits = calculateLegionArtifactBenefit()

    // 어빌리티 종결 계산
    const calculateAbilityFinishBenefit = () => {
      // 드롭 종결: 아이템 드롭률 어빌리티 20%, 메소 어빌리티 15%
      let dropFinishMesoParams = { ...currentMesoParams }
      let dropFinishDropParams = { ...currentItemDropParams }
      dropFinishMesoParams.ability = 15
      dropFinishDropParams.ability = 20
      
      const dropFinishHuntingParams = {
        ...currentHuntingParams,
        mesoBonus: calculateMesoBonus(dropFinishMesoParams).totalBonus,
        dropRate: calculateItemDropBonus(dropFinishDropParams).totalBonus
      }
      const dropFinishCalc = calculateHuntingExpectation(dropFinishHuntingParams)

      // 메소 종결: 메소 어빌리티 20%, 아이템 드롭률 어빌리티 15%
      let mesoFinishMesoParams = { ...currentMesoParams }
      let mesoFinishDropParams = { ...currentItemDropParams }
      mesoFinishMesoParams.ability = 20
      mesoFinishDropParams.ability = 15
      
      const mesoFinishHuntingParams = {
        ...currentHuntingParams,
        mesoBonus: calculateMesoBonus(mesoFinishMesoParams).totalBonus,
        dropRate: calculateItemDropBonus(mesoFinishDropParams).totalBonus
      }
      const mesoFinishCalc = calculateHuntingExpectation(mesoFinishHuntingParams)

      // 어빌리티 없는 경우 대비 계산
      let noAbilityMesoParams = { ...currentMesoParams }
      let noAbilityDropParams = { ...currentItemDropParams }
      noAbilityMesoParams.ability = 0
      noAbilityDropParams.ability = 0
      
      const noAbilityHuntingParams = {
        ...currentHuntingParams,
        mesoBonus: calculateMesoBonus(noAbilityMesoParams).totalBonus,
        dropRate: calculateItemDropBonus(noAbilityDropParams).totalBonus
      }
      const noAbilityCalc = calculateHuntingExpectation(noAbilityHuntingParams)

      return {
        dropFinishIncrease: dropFinishCalc.totalIncome - result.totalIncome,
        mesoFinishIncrease: mesoFinishCalc.totalIncome - result.totalIncome,
        currentAbilityBenefit: result.totalIncome - noAbilityCalc.totalIncome
      }
    }

    const abilityBenefits = calculateAbilityFinishBenefit()

    // 탈라하트 심볼 계산
    const calculateTallahartSymbolBenefit = () => {
      // 탈라하트 심볼 1레벨 시 계산 (미개방 -> 1레벨)
      let tallahartLevel1MesoParams = { ...currentMesoParams }
      let tallahartLevel1DropParams = { ...currentItemDropParams }
      tallahartLevel1MesoParams.tallahartSymbolLevel = 1
      tallahartLevel1DropParams.tallahartSymbolLevel = 1
      
      const tallahartLevel1HuntingParams = {
        ...currentHuntingParams,
        mesoBonus: calculateMesoBonus(tallahartLevel1MesoParams).totalBonus,
        dropRate: calculateItemDropBonus(tallahartLevel1DropParams).totalBonus
      }
      const tallahartLevel1Calc = calculateHuntingExpectation(tallahartLevel1HuntingParams)

      // 탈라하트 심볼 10레벨 시 계산 (만렙)
      let tallahartLevel10MesoParams = { ...currentMesoParams }
      let tallahartLevel10DropParams = { ...currentItemDropParams }
      tallahartLevel10MesoParams.tallahartSymbolLevel = 10
      tallahartLevel10DropParams.tallahartSymbolLevel = 10
      
      const tallahartLevel10HuntingParams = {
        ...currentHuntingParams,
        mesoBonus: calculateMesoBonus(tallahartLevel10MesoParams).totalBonus,
        dropRate: calculateItemDropBonus(tallahartLevel10DropParams).totalBonus
      }
      const tallahartLevel10Calc = calculateHuntingExpectation(tallahartLevel10HuntingParams)

      // 탈라하트 심볼 0레벨 시 계산 (미개방)
      let tallahartLevel0MesoParams = { ...currentMesoParams }
      let tallahartLevel0DropParams = { ...currentItemDropParams }
      tallahartLevel0MesoParams.tallahartSymbolLevel = 0
      tallahartLevel0DropParams.tallahartSymbolLevel = 0
      
      const tallahartLevel0HuntingParams = {
        ...currentHuntingParams,
        mesoBonus: calculateMesoBonus(tallahartLevel0MesoParams).totalBonus,
        dropRate: calculateItemDropBonus(tallahartLevel0DropParams).totalBonus
      }
      const tallahartLevel0Calc = calculateHuntingExpectation(tallahartLevel0HuntingParams)

      return {
        level1Increase: tallahartLevel1Calc.totalIncome - tallahartLevel0Calc.totalIncome, // 미개방 대비 1레벨 이득
        level10Increase: tallahartLevel10Calc.totalIncome - result.totalIncome, // 현재 대비 10레벨 이득  
        currentBenefit: result.totalIncome - tallahartLevel0Calc.totalIncome, // 현재 레벨 대비 0레벨(미개방) 이득
        maxBenefit: tallahartLevel10Calc.totalIncome - tallahartLevel1Calc.totalIncome // 1레벨 대비 10레벨 이득
      }
    }

    const tallahartBenefits = calculateTallahartSymbolBenefit()

    return {
      dropRateIncrease: dragonDropRateTotal - result.totalIncome,
      mesoRateIncrease: dragonMesoRateTotal - result.totalIncome,
      dropRateBenefitFromZero: calculateZeroPotentialBenefit('drop'),
      mesoRateBenefitFromZero: calculateZeroPotentialBenefit('meso'),
      ...legionBenefits,
      ...abilityBenefits,
      ...tallahartBenefits,
      // 현재 파라미터들 노출
      currentHuntingParams,
      currentMesoParams,
      currentItemDropParams
    }
  }, [result, characterLevel, monsterLevel, monsterCount, huntTime, resultTime, isCustomResultTime, resultTimeUnit, spottingSmallChange, spottingSmallChangeLevel, wealthAcquisitionPotion, showWealthPotionCost, wealthAcquisitionPotionPrice, feeRate, normalDropItems, logDropItems, dropRatePotentialDirect, dropRatePotentialLines, dropRatePotentialMode, mesoPotentialDirect, mesoPotentialLines, mesoPotentialMode, dropRateArtifactMode, dropRateArtifactLevelInput, dropRateArtifactPercentInput, mesoArtifactMode, mesoArtifactLevelInput, mesoArtifactPercentInput, phantomLegionMeso, dropItems, getCurrentInputs, dropRateAbility, mesoAbility, tallahartSymbolLevel, pcRoomMode, getMesoCalculationParams, getItemDropCalculationParams])





  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-7xl mx-auto">{/* 메인 계산기 컨테이너 시작 */}
      {/* 슬롯 선택 UI */}
      <SlotHeader
        currentSlot={currentSlot}
        maxSlots={3}
        slotNames={slotNames}
        tempSlotName={tempSlotName}
        isEditingSlotName={isEditingSlotName}
        hasSlotData={hasSlotDataFunction}
        onSlotSwitch={handleSlotChange}
        onSlotNameChange={setTempSlotName}
        onSlotNameEdit={setIsEditingSlotName}
        onSave={() => saveSettings(currentSlot)}
        onReset={resetAll}
      />
      
      {/* 데이터 출처 안내 */}
      {!isDataSourceCardDismissedState && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 relative">
          <button
            onClick={handleDataSourceCardDismiss}
            className="absolute top-2 right-2 p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
            title="이 안내를 닫습니다"
          >
            <X className="w-4 h-4" />
          </button>
          <p className="text-sm text-blue-800 pr-8">
            💡 이 계산기의 기본 아이템 드롭률 및 계산 공식은 외부 연구 자료를 참고했습니다. 
            <Link href="/about" className="text-blue-600 hover:text-blue-800 underline ml-1">
              자세한 출처 정보 보기 →
            </Link>
          </p>
        </div>
      )}
      
      {/* 메인 그리드 컨테이너 시작 */}
      <div className="grid grid-cols-1 lg:grid-cols-11 gap-6">
        {/* 사냥 정보 섹션 시작 */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="text-base font-semibold text-gray-800 border-b pb-2">사냥 정보</h3>
          
          {/* 캐릭터 레벨 */}
          <LabeledNumberInput
            label="캐릭터 레벨"
            value={characterLevel}
            onChange={setCharacterLevel}
            min={1}
            max={300}
          />
          
          {/* 몬스터 레벨 */}
          <LabeledNumberInput
            label="몬스터 레벨"
            value={monsterLevel}
            onChange={setMonsterLevel}
            min={1}
          />

          {/* 사냥량 설정 */}
          {/* 사냥량 설정 영역 시작 */}
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
                      const newMinutes = convertTimeToMinutes(value, huntTimeUnit)
                      
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
                        const oldMinutes = convertTimeToMinutes(customHuntTimeValue, huntTimeUnit)
                        
                        // 새 단위의 값 계산
                        const newValue = convertMinutesToUnit(oldMinutes, newUnit)
                        
                        // 새 단위의 시간 계산 (분 단위)
                        const newMinutes = convertTimeToMinutes(newValue, newUnit)
                        
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
              value={isCustomResultTime ? (resultTimeUnit === 'meso_limit' ? 'meso_limit' : 'custom') : resultTime}
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
                        setResultTimeUnit('minutes')
                        setCustomResultTimeValue(0.125)
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
                } else if (e.target.value === 'meso_limit') {
                  setIsCustomResultTime(true)
                  setResultTimeUnit('meso_limit')
                  setCustomResultTimeValue(0) // 자동 계산되므로 0으로 설정
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
                      <option value="meso_limit">메소 제한</option>
                      <option value="custom">직접 입력</option>
            </select>
            
            {/* 직접 입력 필드 */}
            {isCustomResultTime && resultTimeUnit !== 'meso_limit' && (
              <div className="mt-2 grid grid-cols-3 gap-2 items-center">
                <NumberInput
                  value={customResultTimeValue}
                  onChange={(value) => {
                    setCustomResultTimeValue(value)
                    // 분 단위로 변환하여 resultTime 업데이트
                    const minutes = convertTimeToMinutes(value, resultTimeUnit)
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
                    const newUnit = e.target.value as 'seconds' | 'minutes' | 'hours' | 'mini_wealth' | 'full_wealth'
                    if (newUnit !== resultTimeUnit) {
                      // 현재 값을 분으로 변환
                      const currentMinutes = convertTimeToMinutes(customResultTimeValue, resultTimeUnit)
                      
                      // 새 단위로 변환
                      const newValue = convertMinutesToUnit(currentMinutes, newUnit)
                      
                      setCustomResultTimeValue(newValue)
                    }
                    setResultTimeUnit(newUnit)
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="seconds">초</option>
                  <option value="minutes">분</option>
                  <option value="hours">시간</option>
                  <option value="mini_wealth">소재</option>
                  <option value="full_wealth">재획</option>
                </select>
               </div>
             )}
             
             {/* 메소 제한 정보 표시 */}
             {isCustomResultTime && resultTimeUnit === 'meso_limit' && (
               <div className="mt-2 p-3 bg-blue-50 rounded-md">
                 <div className="text-sm text-blue-700">
                   <div>{characterLevel}레벨 메소 제한: {(calculateMesoLimit(characterLevel) / 100000000).toFixed(1)}억 메소</div>
                   <div className="text-xs mt-1">메소 제한량 달성에 필요한 시간이 자동으로 계산됩니다.</div>
                 </div>
               </div>
             )}
           </div>{/* 사냥량 설정 영역 끝 */}

          
          {/* 드롭 아이템 관리 영역 시작 */}
          <div className="space-y-4 border-t pt-4 mt-4">
            {/* 경매장 수수료 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                경매장 수수료
              </label>
              <RadioGroup
                options={[
                  { value: '3', label: '3%' },
                  { value: '5', label: '5%' }
                ]}
                value={feeRate.toString()}
                onChange={(value) => setFeeRate(Number(value))}
                name="feeRate"
              />
            </div>
            
            <DropItemInput
              items={logDropItems}
              onItemsChange={setLogDropItems}
              showDropRate={true}
              title="정해진 비율 드롭템"
              placeholder="아이템 이름"
            />
            
            <DropItemInput
              items={normalDropItems}
              onItemsChange={setNormalDropItems}
              showDropRate={true}
              title="일반 드롭템"
              placeholder="아이템 이름"
            />
          </div>{/* 드롭 아이템 관리 영역 끝 */}
        </div>
        {/* 사냥 정보 섹션 끝 */}

        {/* 스탯 정보 섹션 시작 */}
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
                { value: 'legion', label: '일반 월드: 유니온 (0~12%)' },
                { value: 'none', label: '해당 없음' }
              ]}
              value={globalBuffMode}
              onChange={(value) => setGlobalBuffMode(value as 'none' | 'challenger' | 'legion')}
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

          {/* 아드 섹션 시작 */}
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
                  value={dropRateInputMode === 'direct' ? dropRate : calculateItemDropBonus(getItemDropCalculationParams()).totalBonus}
                  onChange={(e) => {
                    if (dropRateInputMode === 'direct') {
                      setDropRate(Number(e.target.value))
                    }
                  }}
                  onClick={() => {
                    if (dropRateInputMode === 'detail') {
                      setDropRate(calculateItemDropBonus(getItemDropCalculationParams()).totalBonus)
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

            {/* 아드 상세 옵션 영역 시작 */}
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
                      checked={dropRateLegionBuff}
                      onChange={(e) => {
                        setDropRateLegionBuff(e.target.checked)
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
                  <div className="relative group">
                    <NumberInput
                      value={dropRateAbility}
                      onChange={(value) => setDropRateAbility(Math.min(20, Math.max(0, value)))}
                      min={0}
                      max={20}
                      size="md"
                      className={`w-20 ${validationErrors.some(e => e.field === 'ability') ? 'border-red-500 bg-red-50' : ''}`}
                    />
                    {validationErrors.some(e => e.field === 'ability') && (
                      <div className="absolute z-10 invisible group-hover:visible bg-red-600 text-white text-xs rounded px-2 py-1 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        {validationErrors.find(e => e.field === 'ability')?.shortMessage || validationErrors.find(e => e.field === 'ability')?.message}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-red-600"></div>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>

              {/* 유니온 아티팩트(드롭) 레벨 */}
              {globalBuffMode === 'legion' && (
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
        onClick={() => setDropRateArtifactMode('percent')}
        className={`px-2 py-1 text-sm rounded ${dropRateArtifactMode === 'percent' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
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
                  <label className="text-sm text-gray-700">쓸만한 홀리 심볼</label>
                  <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                    {holySymbol ? '30%' : decentHolySymbol ? `${14 + Math.floor(decentHolySymbolLevel / 3)}%` : '0%'}
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
                      value: 'decent', 
                      label: '쓸만한 홀리 심볼',
                      hasInput: true,
                      inputProps: {
                        value: decentHolySymbolLevel,
                        onChange: (value) => {
                          const level = Math.min(30, Math.max(1, value))
                          setDecentHolySymbolLevel(level)
                          if (!decentHolySymbol) {
                            setDecentHolySymbol(true)
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
                  value={holySymbol ? 'regular' : decentHolySymbol ? 'decent' : 'none'}
                  onChange={(value) => {
                    if (value === 'none') {
                      setHolySymbol(false)
                      setDecentHolySymbol(false)
                    } else if (value === 'regular') {
                      setHolySymbol(true)
                      setDecentHolySymbol(false)
                    } else if (value === 'decent') {
                      setHolySymbol(false)
                      setDecentHolySymbol(true)
                    }
                    if (dropRateInputMode === 'direct') {
                      setDropRateInputMode('detail')
                    }
                  }}
                  name="holySymbol"
                  orientation="horizontal"
                />
              </div>
              <div className="flex items-center justify-between"> {/* 탈라하트 심볼 섹션 시작 */}
                <label className="text-sm text-gray-700">탈라하트 심볼</label>
                <div className="flex items-center space-x-2">
                  <div className="relative group">
                    <NumberInput
                      value={tallahartSymbolLevel}
                      onChange={(value) => {
                        setTallahartSymbolLevel(value)
                        if (dropRateInputMode === 'direct') {
                          setDropRateInputMode('detail')
                        }
                        if (mesoInputMode === 'direct') {
                          setMesoInputMode('detail')
                        }
                      }}
                      min={0}
                      max={11}
                      className={`w-16 ${validationErrors.some(e => e.field === 'tallahartSymbol') ? 'border-red-500 bg-red-50' : ''}`}
                    />
                    {validationErrors.some(e => e.field === 'tallahartSymbol') && (
                      <div className="absolute z-10 invisible group-hover:visible bg-red-600 text-white text-xs rounded px-2 py-1 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        {validationErrors.find(e => e.field === 'tallahartSymbol')?.shortMessage || validationErrors.find(e => e.field === 'tallahartSymbol')?.message}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-red-600"></div>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">레벨</span>
                  <span className="text-xs text-gray-400 w-12">
                    ({tallahartSymbolLevel > 0 ? tallahartSymbolLevel + 4 : 0}%)
                  </span>
                </div>
              </div> {/* 탈라하트 심볼 섹션 끝 */}
              
              {/* PC방 옵션 */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">PC방</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={pcRoomMode}
                    onChange={(e) => {
                      setPcRoomMode(e.target.checked)
                      if (dropRateInputMode === 'direct') {
                        setDropRateInputMode('detail')
                      }
                      if (mesoInputMode === 'direct') {
                        setMesoInputMode('detail')
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-xs text-gray-400 w-12">
                    10%
                  </span>
                </div>
              </div>
              
            </div>{/* 아드 상세 옵션 영역 끝 */}  
          </div>{/* 아드 섹션 끝 */}

          {/* 메획 섹션 시작 */}
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
                  value={mesoInputMode === 'direct' ? mesoBonus : calculateMesoBonus(getMesoCalculationParams()).totalBonus}
                  onChange={(e) => {
                    if (mesoInputMode === 'direct') {
                      setMesoBonus(Number(e.target.value))
                    }
                  }}
                  onClick={() => {
                    if (mesoInputMode === 'detail') {
                      setMesoBonus(calculateMesoBonus(getMesoCalculationParams()).totalBonus)
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

            {/* 메획 상세 옵션 영역 시작 */}
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
                      checked={mesoLegionBuff}
                      onChange={(e) => {
                        setMesoLegionBuff(e.target.checked)
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
              {globalBuffMode === 'legion' && (
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">팬텀 유니온</label>
                  <div className="flex items-center space-x-2">
                    <NumberInput
                      value={phantomLegionMeso}
                      onChange={(value) => {
                        setPhantomLegionMeso(value)
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
                  <div className="relative group">
                    <NumberInput
                      value={mesoAbility}
                      onChange={(value) => setMesoAbility(Math.min(20, Math.max(0, value)))}
                      min={0}
                      max={20}
                      className={`w-20 ${validationErrors.some(e => e.field === 'ability') ? 'border-red-500 bg-red-50' : ''}`}
                    />
                    {validationErrors.some(e => e.field === 'ability') && (
                      <div className="absolute z-10 invisible group-hover:visible bg-red-600 text-white text-xs rounded px-2 py-1 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        {validationErrors.find(e => e.field === 'ability')?.shortMessage || validationErrors.find(e => e.field === 'ability')?.message}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-red-600"></div>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>

              {/* 유니온 아티팩트(메획) 레벨 */}
              {globalBuffMode === 'legion' && (
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
        onClick={() => setMesoArtifactMode('percent')}
        className={`px-2 py-1 text-sm rounded ${mesoArtifactMode === 'percent' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
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
                    {spottingSmallChange ? `+${spottingSmallChangeLevel * 2 + 2}메소/드롭` : '사용 안함'}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      id="change-detection"
                      checked={spottingSmallChange}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setSpottingSmallChange(checked)
                        // 체크를 해제하면 레벨을 0으로 설정
                        if (!checked) {
                          setSpottingSmallChangeLevel(0)
                        } else if (spottingSmallChangeLevel === 0) {
                          // 체크를 활성화하면서 레벨이 0이면 1로 설정
                          setSpottingSmallChangeLevel(1)
                        }
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
                          const level = Math.min(3, Math.max(0, value))
                          setSpottingSmallChangeLevel(level)
                          // 0레벨이 되면 자동으로 사용 체크 해제
                          if (level === 0) {
                            setSpottingSmallChange(false)
                          } else if (!spottingSmallChange) {
                            // 미사용에서 레벨이 0이 아닌 값으로 바뀌면 자동으로 체크
                            setSpottingSmallChange(true)
                          }
                          if (mesoInputMode === 'direct') {
                            setMesoInputMode('detail')
                          }
                        }}
                        min={0}
                        max={3}
                        size="md"
                        className="w-20"
                        placeholder="3"
                      />
                      <span className="text-sm text-gray-500">레벨</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between"> {/* 탈라하트 심볼 섹션 시작 */}
                <label className="text-sm text-gray-700">탈라하트 심볼</label>
                <div className="flex items-center space-x-2">
                  <div className="relative group">
                    <NumberInput
                      value={tallahartSymbolLevel}
                      onChange={(value) => {
                        setTallahartSymbolLevel(value)
                        if (mesoInputMode === 'direct') {
                          setMesoInputMode('detail')
                        }
                        if (dropRateInputMode === 'direct') {
                          setDropRateInputMode('detail')
                        }
                      }}
                      min={0}
                      max={11}
                      className={`w-16 ${validationErrors.some(e => e.field === 'tallahartSymbol') ? 'border-red-500 bg-red-50' : ''}`}
                    />
                    {validationErrors.some(e => e.field === 'tallahartSymbol') && (
                      <div className="absolute z-10 invisible group-hover:visible bg-red-600 text-white text-xs rounded px-2 py-1 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        {validationErrors.find(e => e.field === 'tallahartSymbol')?.shortMessage || validationErrors.find(e => e.field === 'tallahartSymbol')?.message}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-red-600"></div>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">레벨</span>
                  <span className="text-xs text-gray-400 w-12">
                    ({tallahartSymbolLevel > 0 ? tallahartSymbolLevel + 4 : 0}%)
                  </span>
                </div>
              </div> {/* 탈라하트 심볼 섹션 끝 */}
              
            </div> {/* 메획 상세 옵션 영역 끝 */}
          </div>{/* 메획 섹션 끝 */}
        </div>{/* 스탯 정보 섹션 끝 */}

        {/* 계산 결과 섹션 시작 */}
        <div className="lg:col-span-4 space-y-4">
          {/* 계산 결과 헤더 영역 시작 */}
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
          </div>{/* 계산 결과 헤더 영역 끝 */}
        
          {result ? (<>
          <div className="space-y-4"> {/* 계산 결과 내용 영역 시작 */}
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

            {/* 유효성 검사 에러 경고 */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-red-600 mr-2 mt-0.5">❌</span>
                  <div>
                    <p className="text-sm font-medium text-red-800 mb-2">
                      현재 불가능한 옵션이 적용되어 있습니다:
                    </p>
                    <ul className="text-sm text-red-700 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-2 flex-shrink-0"></span>
                          {error.message}
                        </li>
                      ))}
                    </ul>
                  </div>
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
              <div className="font-medium text-green-600">{calculateItemDropBonus(getItemDropCalculationParams()).totalBonus}%</div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">메소 획득량</div>
              <div className="font-medium text-purple-600">
                {calculateMesoBonus(getMesoCalculationParams()).totalBonus}%
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
                         const mesoResult = calculateMesoBonus(getMesoCalculationParams())
                         const mesoDetails = getMesoCalculationDetails(
                           inputs.monsterLevel,
                           mesoResult.bonusWithoutWealth || 0,
                           wealthAcquisitionPotion,
                           mesoResult.levelPenalty || 1
                         )
                         const spottingSmallChangeBonus = inputs.spottingSmallChange ? inputs.spottingSmallChangeLevel * 2 + 2 : 0
                         return `${mesoDetails.baseMeso} × ${mesoDetails.mesoMultiplier.toFixed(2)}${mesoDetails.levelPenalty !== 1 ? ` × ${mesoDetails.levelPenalty.toFixed(2)}(레벨 패널티)` : ''} × ${mesoDetails.wealthPotionMultiplier}${spottingSmallChangeBonus > 0 ? ` + ${spottingSmallChangeBonus}` : ''}`
                       })()}
                     </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  메소 드롭률: <span className={`font-medium ${result.mesoDropRate < 100 ? 'text-red-500' : ''}`}>{formatDecimal(result.mesoDropRate, 1)}%</span>
                </p>
                <div className="flex items-center text-sm text-gray-600">
                  <span>솔 에르다 조각 아이템 드롭률: <span className="font-medium">{formatDecimal(result.dropItems.get(SOL_ERDA_FRAGMENT_ID)?.actualDropRate || 0, 4)}%</span></span>
                  <div className="relative ml-1 group">
                    <div className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs cursor-help">
                      ?
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10">
                       {(() => {
                         const currentDropRate = calculateItemDropBonus(getItemDropCalculationParams()).totalBonus
                         const solErdaResult = result?.dropItems.get(SOL_ERDA_FRAGMENT_ID)
                         if (!solErdaResult) return null
                         
                         const originalRate = (solErdaResult.item.dropRate || 0) / 100 // 원본 확률
                         const multiplier = solErdaResult.dropMultiplier // 배수
                         const finalRate = solErdaResult.actualDropRate / 100 // 최종 확률
                         
                         return (
                           <div className="text-center">
                             <div className="mb-1">솔 에르다 조각 아이템 드롭률</div>
                             <div>원본 확률: {(originalRate * 100).toFixed(4)}%</div>
                             <div>배수: {multiplier.toFixed(3)}x (아이템 드롭률 +{currentDropRate}%)</div>
                             <div>최종 확률: {(finalRate * 100).toFixed(4)}%</div>
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
                {(() => {
                  // 메소 제한인 경우 실제 계산된 시간 사용
                  let displayTime = resultTime;
                  if (isCustomResultTime && resultTimeUnit === 'meso_limit') {
                    displayTime = calculateMesoLimitTime(characterLevel, monsterLevel, monsterCount, huntTime)
                  }
                  
                  return displayTime >= 60 && displayTime % 60 === 0 
                    ? `${displayTime/60}시간` 
                    : displayTime >= 60 
                      ? `${Math.floor(displayTime/60)}시간 ${Math.round(displayTime % 60)}분`
                      : `${Math.round(displayTime)}분`;
                })()
                } 정산
              </h4>
              <p className="text-sm text-gray-600">
                사냥한 몬스터: <span className="font-medium text-blue-600">{formatNumber((() => {
                  const inputs = getCurrentInputs()
                  const mobsPerMinute = inputs.monsterCount / inputs.huntTime
                  
                  // 메소 제한인 경우 실제 계산된 몬스터 수 사용
                  if (inputs.isCustomResultTime && inputs.resultTimeUnit === 'meso_limit') {
    const mesoLimitTime = calculateMesoLimitTime(characterLevel, inputs.monsterLevel, inputs.monsterCount, inputs.huntTime)
    return Math.floor(inputs.monsterCount / inputs.huntTime * mesoLimitTime)
  }
                  
                  return Math.floor(mobsPerMinute * inputs.resultTime)
                })())} 마리</span>
              </p>
              <p className="text-sm text-gray-600">
                기본 메소: <span className="font-medium text-blue-600">{formatMesoWithKorean(result.baseMeso)} 메소</span>
              </p>
              <p className="text-sm text-gray-600">
                솔 에르다 조각: <span className="font-medium text-green-600">{formatDecimal(result.dropItems.get(SOL_ERDA_FRAGMENT_ID)?.expectedCount || 0, 2)}개</span>
              </p>
              <p className="text-sm text-gray-600">
                다조 환산: <span className="font-medium text-green-600">{formatMesoWithKorean(result.dropItems.get(SOL_ERDA_FRAGMENT_ID)?.expectedValue || 0)} 메소</span>
              </p>
              {(() => {
                // 솔 에르다 조각을 제외한 기타 아이템들의 총합 계산
                const otherItemsTotal = result.dropItems 
                  ? Array.from(result.dropItems.values())
                      .filter(item => item.item.id !== SOL_ERDA_FRAGMENT_ID)
                      .reduce((sum, item) => sum + Math.floor(item.expectedValue), 0)
                  : 0
                
                return otherItemsTotal > 0 ? (
                  <p className="text-sm text-gray-600">
                    기타 아이템: <span className="font-medium text-purple-600">{formatMesoWithKorean(otherItemsTotal)} 메소</span>
                  </p>
                ) : null
              })()}
              {wealthAcquisitionPotion && showWealthPotionCost && (
                <>
                  <p className="text-sm text-gray-600">
                    소형 재물 획득의 비약: <span className="font-medium text-red-600">-{result.wealthAcquisitionPotionCount}개 ({formatMesoWithKorean(result.wealthAcquisitionPotionCost, true)} 메소)</span>
                  </p>
                </>
              )}
            </div>
            
            {/* 드롭 아이템 결과 */}
            {result.dropItems && result.dropItems.size > 0 && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <button
                  onClick={() => setIsDropItemResultExpanded(!isDropItemResultExpanded)}
                  className="flex items-center gap-1 font-medium text-gray-900 hover:text-gray-700 transition-colors mb-2"
                >
                  {isDropItemResultExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  드롭 아이템 정산
                </button>
                {isDropItemResultExpanded && (
                  <div className="space-y-2">
                    {/* 모든 드롭 아이템들 - 총 판매 가격순 내림차순 정렬 */}
                    {Array.from(result.dropItems.values())
                      .sort((a, b) => b.expectedValue - a.expectedValue)
                      .map((dropResult, index) => (
                      <div key={dropResult.item.id} className="text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">
                            {dropResult.item.name}
                            <span className="text-xs text-gray-500 ml-1">
                              ({dropResult.item.type === 'normal' ? '일반' : '로그'})
                            </span>
                          </span>
                          <span className="font-medium text-purple-600">
                            {formatMesoWithKorean(Math.floor(dropResult.expectedValue))} 메소
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          기본 {dropResult.item.dropRate}% → 실제 {formatDecimal(dropResult.actualDropRate, 4)}%
                          ({formatDecimal(dropResult.expectedCount, 2)}개)
                          {dropResult.item.directUse && <span className="text-green-600 ml-1">[수수료 0%]</span>}
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex items-center justify-between font-medium">
                        <span className="text-gray-700">드롭 아이템 총합</span>
                        <span className="text-purple-600">
                          {formatMesoWithKorean(Array.from(result.dropItems.values())
                            .reduce((sum, item) => sum + Math.floor(item.expectedValue), 0))} 메소
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

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

            {/* TMI */}
            {(() => {
              const tmiInfo = calculateTMIInfo
              if (!tmiInfo) return null

              // 잠재능력 줄 수 기준으로 최대치 확인
              const currentItemPotentialLines = dropRatePotentialMode === 'lines' ? dropRatePotentialLines : Math.floor(dropRatePotentialDirect / 20)
              const currentMesoPotentialLines = mesoPotentialMode === 'lines' ? mesoPotentialLines : Math.floor(mesoPotentialDirect / 20)
              const isDropRateMaxed = currentItemPotentialLines >= 10 // 10줄
              const isMesoRateMaxed = currentMesoPotentialLines >= 5 // 5줄

              // 유니온 아티팩트 & 팬텀 유니온 최대치 확인
              const isDropArtifactMaxed = dropRateArtifactLevelInput >= 10 // 10레벨
              const isMesoArtifactMaxed = mesoArtifactLevelInput >= 10 // 10레벨
              const isPhantomLegionMaxed = phantomLegionMeso >= 5 // 5%

              // 어빌리티 종결 확인
              const isDropAbilityFinished = dropRateAbility >= 20 && mesoAbility >= 15 // 드롭20% + 메소15%
              const isMesoAbilityFinished = mesoAbility >= 20 && dropRateAbility >= 15 // 메소20% + 드롭15%
              
              // 어빌리티 종결 이익/손해 체크
              const isDropAbilityLoss = tmiInfo.dropFinishIncrease < 0
              const isMesoAbilityLoss = tmiInfo.mesoFinishIncrease < 0

              const showLegionEffects = globalBuffMode !== 'challenger'

              return (
                <div className="bg-orange-50 p-3 rounded-lg border-2 border-orange-200">
                  <h4 className="font-semibold text-orange-800 mb-2 flex items-center">
                    💡 TMI
                  </h4>
                  <div className="space-y-2">
                    {/* 잠재 줄 - 드롭/메획 */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* 드롭률 잠재 카드 */}
                      <div className={`p-2 rounded border ${isDropRateMaxed ? 'bg-gray-100 border-gray-300' : 'bg-white border-orange-200'}`}>
                        <h5 className={`text-xs font-medium mb-1 ${isDropRateMaxed ? 'text-gray-500' : 'text-orange-700'}`}>
                          아이템 드롭률 잠재 {isDropRateMaxed ? '(완료)' : '+1줄'}
                        </h5>
                        {isDropRateMaxed ? (
                          <>
                            <p className="text-xs text-gray-500 mb-1">
                              이미 최대치 달성
                            </p>
                            <p className="text-sm font-bold text-gray-500">
                              0줄 대비 +{formatMesoWithKorean(tmiInfo.dropRateBenefitFromZero)} 이득
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-gray-600 mb-1">
                              채용 시 기댓값: {formatMesoWithKorean(result.totalIncome + tmiInfo.dropRateIncrease)}
                            </p>
                            <p className="text-sm font-bold">
                              <span className={tmiInfo.dropRateIncrease >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {tmiInfo.dropRateIncrease >= 0 ? '+' : ''}{formatMesoWithKorean(tmiInfo.dropRateIncrease)} 증가
                              </span>
                            </p>
                          </>
                        )}
                      </div>

                      {/* 메소 잠재 카드 */}
                      <div className={`p-2 rounded border ${isMesoRateMaxed ? 'bg-gray-100 border-gray-300' : 'bg-white border-orange-200'}`}>
                        <h5 className={`text-xs font-medium mb-1 ${isMesoRateMaxed ? 'text-gray-500' : 'text-orange-700'}`}>
                          메소 획득량 잠재 {isMesoRateMaxed ? '(완료)' : '+1줄'}
                        </h5>
                        {isMesoRateMaxed ? (
                          <>
                            <p className="text-xs text-gray-500 mb-1">
                              이미 최대치 달성
                            </p>
                            <p className="text-sm font-bold text-gray-500">
                              0줄 대비 +{formatMesoWithKorean(tmiInfo.mesoRateBenefitFromZero)} 이득
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-gray-600 mb-1">
                              채용 시 기댓값: {formatMesoWithKorean(result.totalIncome + tmiInfo.mesoRateIncrease)}
                            </p>
                            <p className="text-sm font-bold">
                              <span className={tmiInfo.mesoRateIncrease >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {tmiInfo.mesoRateIncrease >= 0 ? '+' : ''}{formatMesoWithKorean(tmiInfo.mesoRateIncrease)} 증가
                              </span>
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 잠재 추천 */}
                    <div className="bg-gradient-to-r from-orange-100 to-yellow-100 p-2 rounded border border-orange-300">
                      <h5 className="text-xs font-medium text-orange-800 mb-1">💡 추천</h5>
                      <p className="text-xs text-orange-700">
                        {isDropRateMaxed && isMesoRateMaxed 
                          ? "이미 풀드메네요! 🎉"
                          : isDropRateMaxed && !isMesoRateMaxed
                          ? "아이템 드롭률 잠재는 최대치! 이제 메소 획득량을 챙겨보세요"
                          : !isDropRateMaxed && isMesoRateMaxed  
                          ? "메소 획득량 잠재는 최대치! 이제 아이템 드롭률을 챙겨보세요"
                          : tmiInfo.dropRateIncrease > tmiInfo.mesoRateIncrease 
                          ? "아이템 드롭률 증가가 더 효율적입니다. 뭐죠?" 
                          : tmiInfo.mesoRateIncrease > tmiInfo.dropRateIncrease
                          ? "메소 획득량 증가가 더 효율적입니다."
                          : "신기하게도 효율이 같네요."}
                      </p>
                    </div>

                    {/* 유니온 줄 - 행운/부 */}
                    {showLegionEffects && (() => {
                      const legionDropEffect = calculateWithLegionEffect(true, 'drop', tmiInfo.currentHuntingParams, tmiInfo.currentMesoParams, tmiInfo.currentItemDropParams)
                      const legionMesoEffect = calculateWithLegionEffect(true, 'meso', tmiInfo.currentHuntingParams, tmiInfo.currentMesoParams, tmiInfo.currentItemDropParams)
                      
                      if (!legionDropEffect || !legionMesoEffect) return null
                      
                      const legionDropBenefit = legionDropEffect.totalIncome - result.totalIncome
                      const legionMesoBenefit = legionMesoEffect.totalIncome - result.totalIncome
                      
                      return (
                        <div className="grid grid-cols-2 gap-2">
                          {/* 유니온의 행운 카드 */}
                          <div className={`p-2 rounded border ${dropRateLegionBuff ? 'bg-gray-100 border-gray-300' : 'bg-blue-50 border-blue-200'}`}>
                            <h5 className={`text-xs font-medium mb-1 ${dropRateLegionBuff ? 'text-gray-500' : 'text-blue-700'}`}>
                              💫 유니온의 행운
                            </h5>
                            {dropRateLegionBuff ? (
                              <>
                                <p className="text-xs text-gray-500 mb-1">
                                  현재 사용 중
                                </p>
                                <p className="text-sm font-bold text-gray-500">
                                  미사용 대비 +{formatMesoWithKorean(Math.abs(legionDropBenefit))} 이득
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-xs text-gray-600 mb-1">
                                  사용 시 기댓값: {formatMesoWithKorean(legionDropEffect.totalIncome)}
                                </p>
                                <p className="text-sm font-bold">
                                  <span className={legionDropBenefit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    사용하면 {legionDropBenefit >= 0 ? '+' : ''}{formatMesoWithKorean(legionDropBenefit)} 증가
                                  </span>
                                </p>
                              </>
                            )}
                          </div>

                          {/* 유니온의 부 카드 */}
                          <div className={`p-2 rounded border ${mesoLegionBuff ? 'bg-gray-100 border-gray-300' : 'bg-purple-50 border-purple-200'}`}>
                            <h5 className={`text-xs font-medium mb-1 ${mesoLegionBuff ? 'text-gray-500' : 'text-purple-700'}`}>
                              💰 유니온의 부
                            </h5>
                            {mesoLegionBuff ? (
                              <>
                                <p className="text-xs text-gray-500 mb-1">
                                  현재 사용 중
                                </p>
                                <p className="text-sm font-bold text-gray-500">
                                  미사용 대비 +{formatMesoWithKorean(Math.abs(legionMesoBenefit))} 이득
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-xs text-gray-600 mb-1">
                                  사용 시 기댓값: {formatMesoWithKorean(legionMesoEffect.totalIncome)}
                                </p>
                                <p className="text-sm font-bold">
                                  <span className={legionMesoBenefit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    사용하면 {legionMesoBenefit >= 0 ? '+' : ''}{formatMesoWithKorean(legionMesoBenefit)} 증가
                                  </span>
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })()}

                    {/* 유니온 아티팩트 줄 - 드롭/메소 */}
                    {showLegionEffects && (
                      <div className="grid grid-cols-2 gap-2">
                        {/* 드롭률 유니온 아티팩트 카드 */}
                        <div className={`p-2 rounded border ${isDropArtifactMaxed ? 'bg-gray-100 border-gray-300' : 'bg-green-50 border-green-200'}`}>
                          <h5 className={`text-xs font-medium mb-1 ${isDropArtifactMaxed ? 'text-gray-500' : 'text-green-700'}`}>
                            🔮 아드 아티팩트
                          </h5>
                          {isDropArtifactMaxed ? (
                            <>
                              <p className="text-xs text-gray-500 mb-1">
                                이미 10레벨 달성
                              </p>
                              <p className="text-sm font-bold text-gray-500">
                                0레벨 대비 +{formatMesoWithKorean(tmiInfo.currentDropArtifactBenefit)} 이득
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-xs text-gray-600 mb-1">
                                10레벨 시 기댓값: {formatMesoWithKorean(result.totalIncome + tmiInfo.maxDropArtifactIncrease)}
                              </p>
                              <p className="text-sm font-bold">
                                <span className={tmiInfo.maxDropArtifactIncrease >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  10레벨 달성 시 {tmiInfo.maxDropArtifactIncrease >= 0 ? '+' : ''}{formatMesoWithKorean(tmiInfo.maxDropArtifactIncrease)} 증가
                                </span>
                              </p>
                            </>
                          )}
                        </div>

                        {/* 메획 유니온 아티팩트 카드 */}
                        <div className={`p-2 rounded border ${isMesoArtifactMaxed ? 'bg-gray-100 border-gray-300' : 'bg-yellow-50 border-yellow-200'}`}>
                          <h5 className={`text-xs font-medium mb-1 ${isMesoArtifactMaxed ? 'text-gray-500' : 'text-yellow-700'}`}>
                            🔮 메획 아티팩트
                          </h5>
                          {isMesoArtifactMaxed ? (
                            <>
                              <p className="text-xs text-gray-500 mb-1">
                                이미 10레벨 달성
                              </p>
                              <p className="text-sm font-bold text-gray-500">
                                0레벨 대비 +{formatMesoWithKorean(tmiInfo.currentMesoArtifactBenefit)} 이득
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-xs text-gray-600 mb-1">
                                10레벨 시 기댓값: {formatMesoWithKorean(result.totalIncome + tmiInfo.maxMesoArtifactIncrease)}
                              </p>
                              <p className="text-sm font-bold">
                                <span className={tmiInfo.maxMesoArtifactIncrease >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  10레벨 달성 시 {tmiInfo.maxMesoArtifactIncrease >= 0 ? '+' : ''}{formatMesoWithKorean(tmiInfo.maxMesoArtifactIncrease)} 증가
                                </span>
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 팬텀 유니온 줄 */}
                    {showLegionEffects && (
                      <div className="grid grid-cols-1 gap-2">
                        {/* 팬텀 유니온 카드 */}
                        <div className={`p-2 rounded border ${isPhantomLegionMaxed ? 'bg-gray-100 border-gray-300' : 'bg-pink-50 border-pink-200'}`}>
                          <h5 className={`text-xs font-medium mb-1 ${isPhantomLegionMaxed ? 'text-gray-500' : 'text-pink-700'}`}>
                            👻 팬텀 SSS
                          </h5>
                          {isPhantomLegionMaxed ? (
                            <>
                              <p className="text-xs text-gray-500 mb-1">
                                이미 5% 달성
                              </p>
                              <p className="text-sm font-bold text-gray-500">
                                0% 대비 +{formatMesoWithKorean(tmiInfo.currentPhantomLegionBenefit)} 이득
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-xs text-gray-600 mb-1">
                                5% 시 기댓값: {formatMesoWithKorean(result.totalIncome + tmiInfo.maxPhantomLegionIncrease)}
                              </p>
                              <p className="text-sm font-bold">
                                <span className={tmiInfo.maxPhantomLegionIncrease >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  최대치(5%) 달성 시 {tmiInfo.maxPhantomLegionIncrease >= 0 ? '+' : ''}{formatMesoWithKorean(tmiInfo.maxPhantomLegionIncrease)} 증가
                                </span>
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 어빌리티 종결 줄 */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* 어빌리티 종결(드롭) 카드 */}
                      <div className={`p-2 rounded border ${
                        isDropAbilityFinished || isDropAbilityLoss
                          ? 'bg-gray-100 border-gray-300' 
                          : 'bg-indigo-50 border-indigo-200'
                      }`}>
                        <div className="relative group">
                          <h5 className={`text-xs font-medium mb-1 cursor-help ${
                            isDropAbilityFinished || isDropAbilityLoss
                              ? 'text-gray-500' 
                              : 'text-indigo-700'
                          }`}>
                            ⚡ 아드 종결 어빌리티
                          </h5>
                          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 w-max max-w-48 z-10">
                            아이템 드롭률 20%<br />+ 메소 획득량 15%
                          </div>
                        </div>
                        {isDropAbilityFinished ? (
                          <>
                            <p className="text-xs text-gray-600 mb-1">
                              적용 중
                            </p>
                            <p className="text-sm font-bold text-gray-500">
                              어빌리티로 {formatMesoWithKorean(tmiInfo.currentAbilityBenefit)} 이득
                            </p>
                          </>
                        ) : isDropAbilityLoss ? (
                          <>
                            <p className="text-xs text-gray-600 mb-1">
                              적용 시 기댓값: {formatMesoWithKorean(result.totalIncome + tmiInfo.dropFinishIncrease)}
                            </p>
                            <p className="text-sm font-bold" style={{color: '#8b6b6b'}}>
                              변경 시 {formatMesoWithKorean(Math.abs(tmiInfo.dropFinishIncrease))} 손해
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-gray-600 mb-1">
                              적용 시 기댓값: {formatMesoWithKorean(result.totalIncome + tmiInfo.dropFinishIncrease)}
                            </p>
                            <p className="text-sm font-bold text-green-600">
                              달성 시 {formatMesoWithKorean(tmiInfo.dropFinishIncrease)} 이득
                            </p>
                          </>
                        )}
                      </div>

                      {/* 어빌리티 종결(메획) 카드 */}
                      <div className={`p-2 rounded border ${
                        isMesoAbilityFinished || isMesoAbilityLoss
                          ? 'bg-gray-100 border-gray-300' 
                          : 'bg-teal-50 border-teal-200'
                      }`}>
                        <div className="relative group">
                          <h5 className={`text-xs font-medium mb-1 cursor-help ${
                            isMesoAbilityFinished || isMesoAbilityLoss
                              ? 'text-gray-500' 
                              : 'text-teal-700'
                          }`}>
                            ⚡ 메획 종결 어빌리티
                          </h5>
                          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 w-max max-w-48 z-10">
                            메소 획득량 20%<br />+ 아이템 드롭률 15%
                          </div>
                        </div>
                        {isMesoAbilityFinished ? (
                          <>
                            <p className="text-xs text-gray-600 mb-1">
                              적용 중
                            </p>
                            <p className="text-sm font-bold text-gray-500">
                              어빌리티로 {formatMesoWithKorean(tmiInfo.currentAbilityBenefit)} 이득
                            </p>
                          </>
                        ) : isMesoAbilityLoss ? (
                          <>
                            <p className="text-xs text-gray-600 mb-1">
                              적용 시 기댓값: {formatMesoWithKorean(result.totalIncome + tmiInfo.mesoFinishIncrease)}
                            </p>
                            <p className="text-sm font-bold" style={{color: '#8b6b6b'}}>
                              변경 시 {formatMesoWithKorean(Math.abs(tmiInfo.mesoFinishIncrease))} 손해
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-gray-600 mb-1">
                              적용 시 기댓값: {formatMesoWithKorean(result.totalIncome + tmiInfo.mesoFinishIncrease)}
                            </p>
                            <p className="text-sm font-bold text-green-600">
                              달성 시 {formatMesoWithKorean(tmiInfo.mesoFinishIncrease)} 이득
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 탈라하트 심볼 줄 */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* 탈라하트 심볼 개방 시 카드 */}
                      <div className={`p-2 rounded border ${tallahartSymbolLevel > 0 ? 'bg-gray-100 border-gray-300' : 'bg-purple-50 border-purple-200'}`}>
                        <h5 className={`text-xs font-medium mb-1 ${tallahartSymbolLevel > 0 ? 'text-gray-500' : 'text-purple-700'}`}>
                          🌟 탈라하트 심볼 개방
                        </h5>
                        {tallahartSymbolLevel > 0 ? (
                          <>
                            <p className="text-xs text-gray-500 mb-1">
                              이미 {tallahartSymbolLevel}레벨 달성
                            </p>
                            <p className="text-sm font-bold text-gray-500">
                              미개방 대비 +{formatMesoWithKorean(tmiInfo.currentBenefit)} 이득
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-gray-600 mb-1">
                              1레벨 시 기댓값: {formatMesoWithKorean(result.totalIncome + tmiInfo.level1Increase)}
                            </p>
                            <p className="text-sm font-bold">
                              <span className={tmiInfo.level1Increase >= 0 ? 'text-green-600' : 'text-red-600'}>
                                개방 시 {tmiInfo.level1Increase >= 0 ? '+' : ''}{formatMesoWithKorean(tmiInfo.level1Increase)} 증가
                              </span>
                            </p>
                          </>
                        )}
                      </div>

                      {/* 탈라하트 심볼 만렙 카드 */}
                      <div className={`p-2 rounded border ${tallahartSymbolLevel >= 10 ? 'bg-gray-100 border-gray-300' : 'bg-amber-50 border-amber-200'}`}>
                        <h5 className={`text-xs font-medium mb-1 ${tallahartSymbolLevel >= 10 ? 'text-gray-500' : 'text-amber-700'}`}>
                          ⭐ 탈라하트 심볼 만렙
                        </h5>
                        {tallahartSymbolLevel >= 10 ? (
                          <>
                            <p className="text-xs text-gray-500 mb-1">
                              이미 10레벨 달성
                            </p>
                            <p className="text-sm font-bold text-gray-500">
                              1레벨 대비 +{formatMesoWithKorean(tmiInfo.maxBenefit)} 이득
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-gray-600 mb-1">
                              10레벨 시 기댓값: {formatMesoWithKorean(result.totalIncome + tmiInfo.level10Increase)}
                            </p>
                            <p className="text-sm font-bold">
                              <span className={tmiInfo.level10Increase >= 0 ? 'text-green-600' : 'text-red-600'}>
                                만렙 달성 시 {tmiInfo.level10Increase >= 0 ? '+' : ''}{formatMesoWithKorean(tmiInfo.level10Increase)} 증가
                              </span>
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* PC방 줄 */}
                    {(() => {
                      // PC방 효과 계산
                      const withPcParams = { ...tmiInfo.currentItemDropParams, pcRoomMode: true }
                      const withPcDropRate = calculateItemDropBonus(withPcParams).totalBonus
                      const withPcHuntingParams = { ...tmiInfo.currentHuntingParams, dropRate: withPcDropRate }
                      const withPcResult = calculateHuntingExpectation(withPcHuntingParams)
                      
                      const withoutPcParams = { ...tmiInfo.currentItemDropParams, pcRoomMode: false }
                      const withoutPcDropRate = calculateItemDropBonus(withoutPcParams).totalBonus
                      const withoutPcHuntingParams = { ...tmiInfo.currentHuntingParams, dropRate: withoutPcDropRate }
                      const withoutPcResult = calculateHuntingExpectation(withoutPcHuntingParams)
                      
                      const pcBenefit = withPcResult.totalIncome - withoutPcResult.totalIncome
                      const currentPcBenefit = pcRoomMode ? result.totalIncome - withoutPcResult.totalIncome : withPcResult.totalIncome - result.totalIncome
                      
                      return (
                        <div className="grid grid-cols-1 gap-2">
                          {/* PC방 카드 */}
                          <div className={`p-2 rounded border ${pcRoomMode ? 'bg-gray-100 border-gray-300' : 'bg-orange-50 border-orange-200'}`}>
                            <h5 className={`text-xs font-medium mb-1 ${pcRoomMode ? 'text-gray-500' : 'text-orange-700'}`}>
                              🖥️ PC방 사냥
                            </h5>
                            {pcRoomMode ? (
                              <>
                                <p className="text-xs text-gray-500 mb-1">
                                  PC방 보너스 적용 중
                                </p>
                                <p className="text-sm font-bold text-gray-500">
                                  집 대비 +{formatMesoWithKorean(currentPcBenefit)} 이득
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-xs text-gray-600 mb-1">
                                  PC방 사냥 기댓값: {formatMesoWithKorean(withPcResult.totalIncome)}
                                </p>
                                <p className="text-sm font-bold">
                                  <span className={currentPcBenefit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    PC방 사냥 시 {currentPcBenefit >= 0 ? '+' : ''}{formatMesoWithKorean(currentPcBenefit)} 증가
                                  </span>
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )
            })()}
          </div>{/* 계산 결과 내용 영역 끝 */}
        </>) : (
          <div className="text-center text-gray-500 py-8"> {/* 계산 결과 없음 표시 영역 */}
            <p>{autoCalculate ? '값을 입력하면 자동으로 계산됩니다' : '계산하기 버튼을 눌러서 결과를 확인하세요'}</p>
          </div>
        )}
        </div> {/* 계산 결과 섹션 끝 */}
      </div> {/* 메인 그리드 컨테이너 끝 */}

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
      </div>{/* 메인 계산기 컨테이너 끝 */}
    </>
  )
}

export default BasicCalculator 