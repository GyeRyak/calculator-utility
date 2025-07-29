'use client'

import { useState, useEffect } from 'react'
import { calculateDropData, getMesoCalculationDetails, getSolErdaCalculationDetails, type DropCalculationParams } from '../../utils/dropCalculations'
import NumberInput from '../ui/NumberInput'



interface CalculationResult {
  baseMeso: number
  solErdaCount: number
  solErdaProfit: number
  totalIncome: number
  totalMeso: number
  mesoDropRate: number
  solErdaDropRate: number
  mesoPerDrop: number
  wealthPotionCount: number
  wealthPotionCost: number
  totalMesoPerHour: number
  totalMesoWithoutPotion: number
}

interface CalculationInputs {
  mobLevel: number
  mesoBonus: number
  itemDropBonus: number
  huntTime: number
  mobCount: number
  resultTime: number
  solErdaPrice: number
  feeRate: number
  isCustomHuntTime: boolean
  huntTimeUnit: string
  customHuntTimeValue: number
  isCustomResultTime: boolean
  resultTimeUnit: string
  customResultTimeValue: number
  mesoInputMode: string
  itemDropInputMode: string
  mesoUnionBuff: boolean
  mesoPotentialMode: string
  mesoPotentialLines: number
  mesoPotentialDirect: number
  mesoAbility: number
  globalBuffMode: string
  mesoArtifactLevel: number
  itemUnionBuff: boolean
  itemPotentialMode: string
  itemPotentialLines: number
  itemPotentialDirect: number
  itemAbility: number
  itemArtifactLevel: number
  holySymbol: boolean
  usefulHolySymbol: boolean
  usefulHolySymbolLevel: number
  wealthPotion: boolean
  changeDetection: boolean
  changeDetectionLevel: number
}

export function BasicCalculator() {
  // 입력 상태
  const [mobLevel, setMobLevel] = useState<number>(275)
  const [mesoBonus, setMesoBonus] = useState<number>(40)
  const [itemDropBonus, setItemDropBonus] = useState<number>(60)
  
  // 입력 방식 선택
  const [mesoInputMode, setMesoInputMode] = useState<'direct' | 'detail'>('detail')
  const [itemDropInputMode, setItemDropInputMode] = useState<'direct' | 'detail'>('detail')
  
  // 메소 획득량 상세 옵션
  const [mesoUnionBuff, setMesoUnionBuff] = useState<boolean>(false) // 유니온의 부
  const [mesoPotentialMode, setMesoPotentialMode] = useState<'lines' | 'direct'>('lines')
  const [mesoPotentialLines, setMesoPotentialLines] = useState<number>(0)
  const [mesoPotentialDirect, setMesoPotentialDirect] = useState<number>(0)
  const [mesoAbility, setMesoAbility] = useState<number>(20)
  const [globalBuffMode, setGlobalBuffMode] = useState<'none' | 'challenger' | 'artifact'>('artifact')
  const [mesoArtifactLevel, setMesoArtifactLevel] = useState<number>(10)
  const [mesoArtifactMode, setMesoArtifactMode] = useState<'level' | 'direct'>('level')
  const [mesoArtifactLevelInput, setMesoArtifactLevelInput] = useState<number>(10)
  const [mesoArtifactPercentInput, setMesoArtifactPercentInput] = useState<number>(12)
  const [itemUnionBuff, setItemUnionBuff] = useState<boolean>(false) // 유니온의 행운
  const [itemPotentialMode, setItemPotentialMode] = useState<'lines' | 'direct'>('lines')
  const [itemPotentialLines, setItemPotentialLines] = useState<number>(0) // 드랍 0줄
  const [itemPotentialDirect, setItemPotentialDirect] = useState<number>(0) 
  const [itemAbility, setItemAbility] = useState<number>(15) // 유니크 15%
  const [itemArtifactLevel, setItemArtifactLevel] = useState<number>(10)
  const [itemArtifactMode, setItemArtifactMode] = useState<'level' | 'direct'>('level')
  const [itemArtifactLevelInput, setItemArtifactLevelInput] = useState<number>(10)
  const [itemArtifactPercentInput, setItemArtifactPercentInput] = useState<number>(12)
  const [holySymbol, setHolySymbol] = useState<boolean>(false)
  const [usefulHolySymbol, setUsefulHolySymbol] = useState<boolean>(true)
  const [usefulHolySymbolLevel, setUsefulHolySymbolLevel] = useState<number>(30)
  
  // 잔돈이 눈에 띄네 
  const [changeDetection, setChangeDetection] = useState<boolean>(true)
  const [changeDetectionLevel, setChangeDetectionLevel] = useState<number>(4)
  
  // 재물 획득의 비약
  const [wealthPotion, setWealthPotion] = useState<boolean>(true)
  // 상태 추가 (컴포넌트 상단)
  const [showWealthPotionCost, setShowWealthPotionCost] = useState<boolean>(true)
  const [wealthPotionPrice, setWealthPotionPrice] = useState<number>(300) // 만 메소

  // 사냥 정보
  const [huntTime, setHuntTime] = useState<number>(0.125) // 1젠 = 7.5초 = 0.125분
  const [isCustomHuntTime, setIsCustomHuntTime] = useState<boolean>(false)
  const [huntTimeUnit, setHuntTimeUnit] = useState<'seconds' | 'minutes' | 'hours' | 'mini_wealth' | 'full_wealth' | 'gen'>('gen')
  const [customHuntTimeValue, setCustomHuntTimeValue] = useState<number>(1)
  const [mobCount, setMobCount] = useState<number>(39)
  const [resultTime, setResultTime] = useState<number>(30) // 분
  const [isCustomResultTime, setIsCustomResultTime] = useState<boolean>(false)
  const [resultTimeUnit, setResultTimeUnit] = useState<'seconds' | 'minutes' | 'hours' | 'mini_wealth' | 'full_wealth' | 'gen'>('minutes')
  const [customResultTimeValue, setCustomResultTimeValue] = useState<number>(30)
  const [solErdaPrice, setSolErdaPrice] = useState<number>(600) // 만 메소
  const [feeRate, setFeeRate] = useState<number>(3) // %
  
  // 자동 연산 토글
  const [autoCalculate, setAutoCalculate] = useState<boolean>(true)
  
  // 계산된 결과 및 계산 시점의 입력값
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [calculatedInputs, setCalculatedInputs] = useState<CalculationInputs | null>(null)

  // 현재 입력값들을 객체로 반환
  const getCurrentInputs = (): CalculationInputs => ({
    mobLevel,
    mesoBonus,
    itemDropBonus,
    huntTime,
    mobCount,
    resultTime,
    solErdaPrice,
    feeRate,
    isCustomHuntTime,
    huntTimeUnit,
    customHuntTimeValue,
    isCustomResultTime,
    resultTimeUnit,
    customResultTimeValue,
    mesoInputMode,
    itemDropInputMode,
    mesoUnionBuff,
    mesoPotentialMode,
    mesoPotentialLines,
    mesoPotentialDirect,
    mesoAbility,
    globalBuffMode,
    mesoArtifactLevel,
    itemUnionBuff,
    itemPotentialMode,
    itemPotentialLines,
    itemPotentialDirect,
    itemAbility,
    itemArtifactLevel,
    holySymbol,
    usefulHolySymbol,
    usefulHolySymbolLevel,
    wealthPotion,
    changeDetection,
    changeDetectionLevel
  })

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
    
    // 잠재능력
    const mesoPotential = mesoPotentialMode === 'lines' ? mesoPotentialLines * 20 : mesoPotentialDirect
    total += mesoPotential
    
    // 어빌리티
    total += mesoAbility
    
    // 글로벌 버프 (챌린저스 월드 다이아 또는 유니온 아티팩트)
    if (globalBuffMode === 'challenger') {
      total += 20
    } else if (globalBuffMode === 'artifact') {
      total += calculateArtifactBonus(
        mesoArtifactMode === 'level' ? mesoArtifactLevelInput : 0,
        mesoArtifactMode,
        mesoArtifactPercentInput
      )
    }

    if (wealthPotion) {
      total = (100 + total) * 12 - 1000 // 소숫점 연산 회피
      total /= 10
    }
    
    return total
  }
  
  // 아이템 드랍률 계산
  const calculateItemDropBonus = () => {
    if (itemDropInputMode === 'direct') {
      return itemDropBonus
    }
    
    let total = 0
    
    // 유니온의 행운
    if (globalBuffMode !== 'challenger' && itemUnionBuff) total += 50;
    
    // 잠재능력
    const itemPotential = itemPotentialMode === 'lines' ? itemPotentialLines * 20 : itemPotentialDirect
    total += itemPotential
    
    // 어빌리티
    total += itemAbility
    
    // 글로벌 버프 (챌린저스 월드 다이아 또는 유니온 아티팩트)
    if (globalBuffMode === 'challenger') {
      total += 20
    } else if (globalBuffMode === 'artifact') {
      total += calculateArtifactBonus(
        itemArtifactMode === 'level' ? itemArtifactLevelInput : 0,
        itemArtifactMode,
        itemArtifactPercentInput
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
    if (wealthPotion) {
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
    const mobsPerMinute = inputs.mobCount / inputs.huntTime
    const mobsPerHour = mobsPerMinute * 60
    
    // 결과 시간 동안의 총 처치 수
    const totalMobs = mobsPerMinute * inputs.resultTime
    
    // 잔돈이 눈에 띄네 보너스 계산
    const changeDetectionBonus = inputs.changeDetection ? inputs.changeDetectionLevel * 2 : 0

    // 재물 획득의 비약 적용된 상태의 드랍 데이터 계산
    const dropResultWithPotion = calculateDropData({
      mobLevel: inputs.mobLevel,
      totalMobs,
      mesoAcquisitionRate: calculatedMesoBonus,
      itemDropRate: calculatedItemDropBonus,
      solErdaPrice: inputs.solErdaPrice,
      feeRate: inputs.feeRate,
      changeDetectionBonus: changeDetectionBonus
    })
    
    // 시간당 계산 (재물 획득의 비약 적용된 상태)
    const dropResultPerHourWithPotion = calculateDropData({
      mobLevel: inputs.mobLevel,
      totalMobs: mobsPerHour,
      mesoAcquisitionRate: calculatedMesoBonus,
      itemDropRate: calculatedItemDropBonus,
      solErdaPrice: inputs.solErdaPrice,
      feeRate: inputs.feeRate,
      changeDetectionBonus: changeDetectionBonus
    })
    
    // 재물 획득의 비약 없을 때의 드랍 데이터 계산 (20% 곱연산/합연산 전 상태)
    let mesoAcquisitionRateWithoutPotion = calculatedMesoBonus
    let itemDropRateWithoutPotion = calculatedItemDropBonus
    
    if (wealthPotion) {
      // 재물 획득의 비약 효과 제거
      itemDropRateWithoutPotion = calculatedItemDropBonus - 20 // 합연산 20% 제거
      // 메소 획득량에서 20% 곱연산 효과 제거
      mesoAcquisitionRateWithoutPotion = (1 + calculatedMesoBonus / 100) / 1.2 - 1
      mesoAcquisitionRateWithoutPotion *= 100
    }
    
    const dropResultWithoutPotion = calculateDropData({
      mobLevel: inputs.mobLevel,
      totalMobs,
      mesoAcquisitionRate: mesoAcquisitionRateWithoutPotion,
      itemDropRate: itemDropRateWithoutPotion,
      solErdaPrice: inputs.solErdaPrice,
      feeRate: inputs.feeRate,
      changeDetectionBonus: changeDetectionBonus
    })
    
    // 재물 획득의 비약 관련 계산
    let wealthPotionCount = 0
    let wealthPotionCost = 0
    let wealthPotionCountPerHour = 0
    let wealthPotionCostPerHour = 0

    if (wealthPotion && showWealthPotionCost) {
      // 30분마다 1개씩 사용 (31분이면 2개)
      wealthPotionCount = Math.ceil(inputs.resultTime / 30)
      wealthPotionCost = wealthPotionCount * wealthPotionPrice * 10000
      
      // 1시간 기준 계산 (2개 사용)
      wealthPotionCountPerHour = 2
      wealthPotionCostPerHour = wealthPotionCountPerHour * wealthPotionPrice * 10000
    }

    // 총 메소 (재물 획득의 비약 비용 차감)
    const totalMeso = dropResultWithPotion.totalIncome - wealthPotionCost
    const totalMesoPerHour = dropResultPerHourWithPotion.totalIncome - wealthPotionCostPerHour

    const newResult = {
      baseMeso: dropResultWithPotion.totalMeso,
      solErdaCount: dropResultWithPotion.solErdaCount,
      solErdaProfit: dropResultWithPotion.solErdaProfit,
      totalIncome: dropResultWithPotion.totalIncome,
      totalMeso,
      mesoDropRate: dropResultWithPotion.mesoDropRate,
      solErdaDropRate: dropResultWithPotion.solErdaDropRate,
      mesoPerDrop: dropResultWithPotion.mesoPerDrop,
      wealthPotionCount,
      wealthPotionCost,
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
  }, [mobLevel, mesoBonus, itemDropBonus, huntTime, mobCount, resultTime, solErdaPrice, feeRate, autoCalculate, customHuntTimeValue, huntTimeUnit, customResultTimeValue, resultTimeUnit, isCustomHuntTime, isCustomResultTime, mesoInputMode, itemDropInputMode, mesoUnionBuff, mesoPotentialMode, mesoPotentialLines, mesoPotentialDirect, mesoAbility, globalBuffMode, mesoArtifactLevel, itemUnionBuff, itemPotentialMode, itemPotentialLines, itemPotentialDirect, itemAbility, itemArtifactLevel, holySymbol, usefulHolySymbol, usefulHolySymbolLevel, wealthPotion, mesoArtifactMode, mesoArtifactLevelInput, mesoArtifactPercentInput, itemArtifactMode, itemArtifactLevelInput, itemArtifactPercentInput, showWealthPotionCost, wealthPotionPrice, changeDetection, changeDetectionLevel])

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
    const mobsPerMinute = inputs.mobCount / inputs.huntTime
    const totalMobs = mobsPerMinute * inputs.resultTime

    // 현재 계산된 보너스 값들
    const currentMesoBonus = calculateMesoBonus()
    const currentItemDropBonus = calculateItemDropBonus()

    // 잔돈이 눈에 띄네 보너스 계산
    const changeDetectionBonus = inputs.changeDetection ? inputs.changeDetectionLevel * 2 : 0

    // 드랍률 20% 증가 효과 (합연산)
    const dropCalcWithDropBonus = calculateDropData({
      mobLevel: inputs.mobLevel,
      totalMobs,
      mesoAcquisitionRate: currentMesoBonus,
      itemDropRate: currentItemDropBonus + 20, // 기존 드랍률에 20% 추가
      solErdaPrice: inputs.solErdaPrice,
      feeRate: inputs.feeRate, // 사용자가 설정한 수수료율 사용
      changeDetectionBonus: changeDetectionBonus
    })

    // 메소 획득량 20% 증가 효과 (합연산)
    const additionalMesoBonus = wealthPotion ? 24 : 20
    const dropCalcWithMesoBonus = calculateDropData({
      mobLevel: inputs.mobLevel,
      totalMobs,
      mesoAcquisitionRate: currentMesoBonus + additionalMesoBonus,
      itemDropRate: currentItemDropBonus,
      solErdaPrice: inputs.solErdaPrice,
      feeRate: inputs.feeRate, // 사용자가 설정한 수수료율 사용
      changeDetectionBonus: changeDetectionBonus
    })

    // 재물 획득의 비약 비용 계산 (기존 로직과 동일)
    let wealthPotionCost = 0
    if (wealthPotion && showWealthPotionCost) {
      const wealthPotionCount = Math.ceil(inputs.resultTime / 30)
      wealthPotionCost = wealthPotionCount * wealthPotionPrice * 10000
    }

    return {
      dropRateIncrease: (dropCalcWithDropBonus.totalIncome - wealthPotionCost) - result.totalMeso,
      mesoRateIncrease: (dropCalcWithMesoBonus.totalIncome - wealthPotionCost) - result.totalMeso
    }
  }





  return (
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-6">
          {/* 사냥 정보 */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-base font-semibold text-gray-800 border-b pb-2">사냥 정보</h3>
          
            {/* 몹 레벨 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                몹 레벨
              </label>
                              <NumberInput
                  value={mobLevel}
                  onChange={setMobLevel}
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
                        const newMobCount = Math.floor(mobCount * (newTime / oldTime))
                        
                        setIsCustomHuntTime(false)
                        setHuntTime(newTime)
                        setMobCount(newMobCount)
                      }
                    }}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0.125} selected>1젠</option>
                    <option value={2}>2분</option>
                    <option value={6}>6분</option>
                    <option value={10}>10분</option>
                    <option value={30}>30분</option>
                    <option value={60}>1시간</option>
                    <option value="custom">직접 입력</option>
                  </select>
                  <span className="text-sm text-gray-600">당</span>
                                     <NumberInput
                     value={mobCount}
                     onChange={setMobCount}
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
                      const newMobCount = Math.floor(mobCount * (newMinutes / oldMinutes))
                      
                      setCustomHuntTimeValue(value)
                      setHuntTime(newMinutes)
                      setMobCount(newMobCount)
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
                        const newMobCount = Math.floor(mobCount * (newMinutes / oldMinutes))
                        
                        setCustomHuntTimeValue(newValue)
                        setMobCount(newMobCount)
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
              value={solErdaPrice}
              onChange={setSolErdaPrice}
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
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="challenger-buff"
                  name="globalBuff"
                  checked={globalBuffMode === 'challenger'}
                  onChange={() => setGlobalBuffMode('challenger')}
                />
                <label htmlFor="challenger-buff" className="text-sm text-gray-700">챌린저스: 다이아 버프 (20%)</label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="artifact-buff"
                  name="globalBuff"
                  checked={globalBuffMode === 'artifact'}
                  onChange={() => setGlobalBuffMode('artifact')}
                />
                <label htmlFor="artifact-buff" className="text-sm text-gray-700">일반 월드: 유니온 (0~12%)</label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="no-global-buff"
                  name="globalBuff"
                  checked={globalBuffMode === 'none'}
                  onChange={() => setGlobalBuffMode('none')}
                />
                <label htmlFor="no-global-buff" className="text-sm text-gray-700">해당 없음</label>
              </div>
            </div>
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
                  checked={wealthPotion}
                  onChange={(e) => setWealthPotion(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">사용</span>
              </div>
            </div>
            
            {wealthPotion && (
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
                        value={wealthPotionPrice}
                        onChange={setWealthPotionPrice}
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
                <button
                  type="button"
                  onClick={() => setItemDropInputMode(itemDropInputMode === 'direct' ? 'detail' : 'direct')}
                  className={`px-2 py-1 text-sm rounded ${
                    itemDropInputMode === 'direct' 
                      ? 'bg-red-500 text-white' 
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {itemDropInputMode === 'direct' ? '직접' : '자동'}
                </button>
                <input
                  type="number"
                  value={itemDropInputMode === 'direct' ? itemDropBonus : calculateItemDropBonus()}
                  onChange={(e) => {
                    if (itemDropInputMode === 'direct') {
                      setItemDropBonus(Number(e.target.value))
                    }
                  }}
                  onClick={() => {
                    if (itemDropInputMode === 'detail') {
                      setItemDropBonus(calculateItemDropBonus())
                      setItemDropInputMode('direct')
                    }
                  }}
                  readOnly={itemDropInputMode === 'detail'}
                  className={`w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center ${
                    itemDropInputMode === 'detail' ? 'bg-gray-100 text-gray-500 cursor-pointer' : ''
                  } [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                  min="0"
                />
                <span className="text-xs text-gray-500">%</span>
              </div>
            </div>

            {/* 상세 옵션들 */}
            <div className={`p-4 rounded-lg space-y-3 ${
              itemDropInputMode === 'direct' 
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
                      checked={itemUnionBuff}
                      onChange={(e) => {
                        setItemUnionBuff(e.target.checked)
                        if (itemDropInputMode === 'direct') {
                          setItemDropInputMode('detail')
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
                  <button
                    type="button"
                    onClick={() => {
                      if (itemPotentialMode === 'direct') {
                        // 직접 -> 줄수: 20% 단위로 변환, 나머지 버림
                        setItemPotentialLines(Math.floor(itemPotentialDirect / 20))
                      }
                      setItemPotentialMode('lines')
                      if (itemDropInputMode === 'direct') {
                        setItemDropInputMode('detail')
                      }
                    }}
                    className={`px-2 py-1 text-sm rounded ${
                      itemPotentialMode === 'lines' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    줄수
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (itemPotentialMode === 'lines') {
                        // 줄수 -> 직접: 줄수 * 20%
                        setItemPotentialDirect(itemPotentialLines * 20)
                      }
                      setItemPotentialMode('direct')
                      if (itemDropInputMode === 'direct') {
                        setItemDropInputMode('detail')
                      }
                    }}
                    className={`px-2 py-1 text-sm rounded ${
                      itemPotentialMode === 'direct' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    직접
                  </button>
                  {itemPotentialMode === 'lines' ? (
                    <>
                                              <NumberInput
                          value={itemPotentialLines}
                          onChange={(value) => {
                            setItemPotentialLines(Math.min(10, Math.max(0, value)))
                            if (itemDropInputMode === 'direct') {
                              setItemDropInputMode('detail')
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
                          value={itemPotentialDirect}
                          onChange={(value) => setItemPotentialDirect(Math.min(200, Math.max(0, value)))}
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
                      value={itemAbility}
                      onChange={(value) => setItemAbility(Math.min(20, Math.max(0, value)))}
                      min={0}
                      max={20}
                      size="md"
                      className="w-20"
                    />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>

              {/* 유니온 아티팩트(드랍) 레벨 */}
              {globalBuffMode === 'artifact' && (
  <div className="flex items-center justify-between">
    <label className="text-sm text-gray-700">유니온 아티팩트</label>
    <div className="flex items-center space-x-2">
      <button
        type="button"
        onClick={() => setItemArtifactMode('level')}
        className={`px-2 py-1 text-sm rounded ${itemArtifactMode === 'level' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
      >
        레벨
      </button>
      <button
        type="button"
        onClick={() => setItemArtifactMode('direct')}
        className={`px-2 py-1 text-sm rounded ${itemArtifactMode === 'direct' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
      >
        %
      </button>
      {itemArtifactMode === 'level' ? (
        <>
          <NumberInput
            value={itemArtifactLevelInput}
            onChange={(value) => setItemArtifactLevelInput(Math.max(0, value))}
            min={0}
            max={10}
            className="w-20"
          />
          <span className="text-xs text-gray-500">레벨</span>
        </>
      ) : (
        <>
          <NumberInput
            value={itemArtifactPercentInput}
            onChange={(value) => setItemArtifactPercentInput(Math.max(0, value))}
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
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <input
                      type="radio"
                      id="no-holy-symbol"
                      name="holySymbol"
                      checked={!holySymbol && !usefulHolySymbol}
                      onChange={() => {
                        setHolySymbol(false)
                        setUsefulHolySymbol(false)
                        if (itemDropInputMode === 'direct') {
                          setItemDropInputMode('detail')
                        }
                      }}
                      className="rounded"
                    />
                    <label htmlFor="no-holy-symbol" className="text-sm text-gray-700">사용 안함</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <input
                      type="radio"
                      id="regular-holy-symbol"
                      name="holySymbol"
                      checked={holySymbol}
                      onChange={() => {
                        setHolySymbol(true)
                        setUsefulHolySymbol(false)
                        if (itemDropInputMode === 'direct') {
                          setItemDropInputMode('detail')
                        }
                      }}
                      className="rounded"
                    />
                    <label htmlFor="regular-holy-symbol" className="text-sm text-gray-700">홀리 심볼</label>
                  </div>
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  <input
                    type="radio"
                    id="useful-holy-symbol"
                    name="holySymbol"
                    checked={usefulHolySymbol}
                    onChange={() => {
                      setHolySymbol(false)
                      setUsefulHolySymbol(true)
                      if (itemDropInputMode === 'direct') {
                        setItemDropInputMode('detail')
                      }
                    }}
                    className="rounded"
                  />
                  <label htmlFor="useful-holy-symbol" className="text-sm text-gray-700">쓸만한 홀리 심볼</label>
                                      <NumberInput
                      value={usefulHolySymbolLevel}
                      onChange={(value) => {
                        const level = Math.min(30, Math.max(1, value))
                        setUsefulHolySymbolLevel(level)
                        if (!usefulHolySymbol) {
                          setUsefulHolySymbol(true)
                          setHolySymbol(false)
                        }
                        if (itemDropInputMode === 'direct') {
                          setItemDropInputMode('detail')
                        }
                      }}
                      min={1}
                      max={30}
                      className="w-20"
                      placeholder="30"
                    />
                  <span className="text-sm text-gray-500">레벨</span>
                </div>
              </div>

              {/* 잔돈이 눈에 띄네 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">잔돈이 눈에 띄네</label>
                  <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                    {changeDetection ? `+${changeDetectionLevel * 2}메소/드랍` : '사용 안함'}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      id="change-detection"
                      checked={changeDetection}
                      onChange={(e) => {
                        setChangeDetection(e.target.checked)
                        if (mesoInputMode === 'direct') {
                          setMesoInputMode('detail')
                        }
                      }}
                      className="rounded"
                    />
                    <label htmlFor="change-detection" className="text-sm text-gray-700">사용</label>
                  </div>
                  {changeDetection && (
                    <div className="flex items-center space-x-1">
                      <NumberInput
                        value={changeDetectionLevel}
                        onChange={(value) => {
                          const level = Math.min(4, Math.max(0, value))
                          setChangeDetectionLevel(level)
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

          {/* 메소 획득량 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                메소 획득량
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setMesoInputMode(mesoInputMode === 'direct' ? 'detail' : 'direct')}
                  className={`px-2 py-1 text-sm rounded ${
                    mesoInputMode === 'direct' 
                      ? 'bg-red-500 text-white' 
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {mesoInputMode === 'direct' ? '직접' : '자동'}
                </button>
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
              {/* 잠재능력 */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">잠재능력</label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (mesoPotentialMode === 'direct') {
                        // 직접 -> 줄수: 20% 단위로 변환, 나머지 버림
                        setMesoPotentialLines(Math.floor(mesoPotentialDirect / 20))
                      }
                      setMesoPotentialMode('lines')
                      if (mesoInputMode === 'direct') {
                        setMesoInputMode('detail')
                      }
                    }}
                    className={`px-2 py-1 text-sm rounded ${
                      mesoPotentialMode === 'lines' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    줄수
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (mesoPotentialMode === 'lines') {
                        // 줄수 -> 직접: 줄수 * 20%
                        setMesoPotentialDirect(mesoPotentialLines * 20)
                      }
                      setMesoPotentialMode('direct')
                      if (mesoInputMode === 'direct') {
                        setMesoInputMode('detail')
                      }
                    }}
                    className={`px-2 py-1 text-sm rounded ${
                      mesoPotentialMode === 'direct' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    직접
                  </button>
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
              {globalBuffMode === 'artifact' && (
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
            </div>
          </div>
        </div>

        {/* 계산 결과 */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-base font-semibold text-gray-800 border-b pb-2">계산 결과</h3>
        
          {result ? (
          <div className="space-y-4">
            {/* 입력값 변경 경고 */}
            {!autoCalculate && hasInputsChanged() && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-yellow-600 mr-2">⚠️</span>
                  <p className="text-sm text-yellow-800">
                    현재 표시된 결과는 입력된 값과 다른 계산 결과입니다. '계산하기' 버튼을 눌러 최신 결과를 확인하세요.
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
              <div className="font-medium text-blue-600">{mobLevel}</div>
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
                         if (wealthPotion) {
                           // 재획비 20% 곱연산 효과 제거
                           mesoRateWithoutWealth = (1 + calculateMesoBonus() / 100) / 1.2 - 1
                           mesoRateWithoutWealth *= 100
                         }
                         const mesoDetails = getMesoCalculationDetails(
                           inputs.mobLevel,
                           mesoRateWithoutWealth,
                           wealthPotion
                         )
                         const changeDetectionBonus = inputs.changeDetection ? inputs.changeDetectionLevel * 2 : 0
                         return `${mesoDetails.baseMeso} × ${mesoDetails.mesoMultiplier.toFixed(2)} × ${mesoDetails.wealthPotionMultiplier}${changeDetectionBonus > 0 ? ` + ${changeDetectionBonus}` : ''}`
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
                         const solErdaDetails = getSolErdaCalculationDetails(currentDropRate)
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
                  const mobsPerMinute = inputs.mobCount / inputs.huntTime
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
              {wealthPotion && showWealthPotionCost && (
                <>
                  <p className="text-sm text-gray-600">
                    소형 재물 획득의 비약: <span className="font-medium text-red-600">-{result.wealthPotionCount}개 ({formatMesoWithKorean(result.wealthPotionCost, true)} 메소)</span>
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
              {wealthPotion && showWealthPotionCost && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>재획비 적용 전: {formatMesoWithKorean(result.totalMesoWithoutPotion, true)} 메소</p>
                  <p>재획비 적용 후: {formatMesoWithKorean(result.totalIncome, true)} 메소 - {formatMesoWithKorean(result.wealthPotionCost, true)} 메소</p>
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
              const currentItemPotentialLines = itemPotentialMode === 'lines' ? itemPotentialLines : Math.floor(itemPotentialDirect / 20)
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
                          현재 메소 획득량: <span className="font-medium">{formatDecimal(currentMesoRate, 0)}%</span> → <span className="font-medium">{formatDecimal(currentMesoRate + (wealthPotion ? 24 : 20), 0)}%</span>
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
    </div>
  )
} 