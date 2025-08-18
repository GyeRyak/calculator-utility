'use client'

import { useState, useCallback, useEffect } from 'react'
import { Plus, Settings, BarChart3 } from 'lucide-react'
import AutoSlotManager from '@/components/ui/AutoSlotManager'
import DismissibleBanner from '@/components/ui/DismissibleBanner'
import { useNotification } from '@/contexts/NotificationContext'
import { DEFAULT_BOSS_CHASE_VALUES, type BossChaseSettings, type CharacterConfig } from '@/utils/defaults/bossChaseDefaults'
import { PitchedBoxProbabilities, PITCHED_BOX_DEFAULT_PROBABILITIES } from '@/data/chaseItems'
import { calculateBossChaseExpectation, calculateDropRateBonusSimulation, getDefaultDropRateFromBasicCalculator } from '@/utils/bossChaseCalculations'
import CharacterManagement from './boss-chase/CharacterManagement'
import SettingsPanel from './boss-chase/SettingsPanel'
import ResultsDisplay from './boss-chase/ResultsDisplay'

const STORAGE_KEY_PREFIX = 'boss_chase_calculator_slot_'

export default function BossChaseCalculator() {
  // 기본 상태
  const [characters, setCharacters] = useState<CharacterConfig[]>(DEFAULT_BOSS_CHASE_VALUES.characters)
  const [customDropRates, setCustomDropRates] = useState(DEFAULT_BOSS_CHASE_VALUES.customDropRates)
  const [customPrices, setCustomPrices] = useState(DEFAULT_BOSS_CHASE_VALUES.customPrices)
  const [ringPrices, setRingPrices] = useState(DEFAULT_BOSS_CHASE_VALUES.ringPrices)
  const [grindstonePrice, setGrindstonePrice] = useState(DEFAULT_BOSS_CHASE_VALUES.grindstonePrice)
  const [globalDropRateBonus, setGlobalDropRateBonus] = useState(() => {
    // 사냥 기댓값 계산기의 기본값에서 드롭률 계산
    const defaultDropRate = getDefaultDropRateFromBasicCalculator()
    return defaultDropRate > 0 ? defaultDropRate : DEFAULT_BOSS_CHASE_VALUES.dropRateBonus
  })
  const [feeRate, setFeeRate] = useState(DEFAULT_BOSS_CHASE_VALUES.feeRate)
  const [pitchedBoxProbabilities, setPitchedBoxProbabilities] = useState<PitchedBoxProbabilities>(DEFAULT_BOSS_CHASE_VALUES.pitchedBoxProbabilities || PITCHED_BOX_DEFAULT_PROBABILITIES)
  
  // UI 상태
  const [activeTab, setActiveTab] = useState<'characters' | 'settings' | 'results'>('characters')
  const [isCalculating, setIsCalculating] = useState(false)
  
  // 계산 결과
  const [calculationResult, setCalculationResult] = useState<ReturnType<typeof calculateBossChaseExpectation> | null>(null)
  const [simulationResult, setSimulationResult] = useState<ReturnType<typeof calculateBossChaseExpectation> | null>(null)

  // 알림 컨텍스트
  const { showNotification } = useNotification()

  // AutoSlotManager용 함수들
  const getCurrentData = useCallback((): BossChaseSettings => ({
    characters,
    customDropRates,
    customPrices,
    ringPrices,
    grindstonePrice,
    dropRateBonus: globalDropRateBonus, // 호환성을 위해 이전 필드명 유지
    feeRate,
    pitchedBoxProbabilities
  }), [characters, customDropRates, customPrices, ringPrices, grindstonePrice, globalDropRateBonus, feeRate, pitchedBoxProbabilities])

  const loadData = useCallback((data: BossChaseSettings, onComplete?: () => void) => {
    if (data.characters !== undefined) setCharacters(data.characters)
    if (data.customDropRates !== undefined) setCustomDropRates(data.customDropRates)
    if (data.customPrices !== undefined) setCustomPrices(data.customPrices)
    if (data.ringPrices !== undefined) setRingPrices(data.ringPrices)
    if (data.grindstonePrice !== undefined) setGrindstonePrice(data.grindstonePrice)
    if (data.dropRateBonus !== undefined) setGlobalDropRateBonus(data.dropRateBonus)
    if (data.feeRate !== undefined) setFeeRate(data.feeRate)
    if (data.pitchedBoxProbabilities !== undefined) setPitchedBoxProbabilities(data.pitchedBoxProbabilities || PITCHED_BOX_DEFAULT_PROBABILITIES)
    
    if (onComplete) {
      setTimeout(onComplete, 100)
    }
  }, [])

  const resetAllData = useCallback(() => {
    setCharacters(DEFAULT_BOSS_CHASE_VALUES.characters)
    setCustomDropRates(DEFAULT_BOSS_CHASE_VALUES.customDropRates)
    setCustomPrices(DEFAULT_BOSS_CHASE_VALUES.customPrices)
    setRingPrices(DEFAULT_BOSS_CHASE_VALUES.ringPrices)
    setGrindstonePrice(DEFAULT_BOSS_CHASE_VALUES.grindstonePrice)
    setFeeRate(DEFAULT_BOSS_CHASE_VALUES.feeRate)
    setPitchedBoxProbabilities(DEFAULT_BOSS_CHASE_VALUES.pitchedBoxProbabilities || PITCHED_BOX_DEFAULT_PROBABILITIES)
    
    // 드롭률 보너스는 사냥 기댓값 계산기 기본값에서 계산
    const defaultDropRate = getDefaultDropRateFromBasicCalculator()
    setGlobalDropRateBonus(defaultDropRate > 0 ? defaultDropRate : DEFAULT_BOSS_CHASE_VALUES.dropRateBonus)
    
    setCalculationResult(null)
    setSimulationResult(null)
  }, [])


  // 계산 실행
  const handleCalculate = useCallback(() => {
    if (characters.length === 0) {
      alert('최소 1개의 캐릭터를 추가해주세요.')
      return
    }

    setIsCalculating(true)
    
    try {
      const params = {
        characters,
        customDropRates,
        customPrices,
        ringPrices,
        grindstonePrice,
        globalDropRateBonus,
        feeRate,
        pitchedBoxProbabilities
      }
      
      const result = calculateBossChaseExpectation(params)
      const simulation = calculateDropRateBonusSimulation(params, 20)
      
      setCalculationResult(result)
      setSimulationResult(simulation)
    } catch (error) {
      console.error('계산 중 오류 발생:', error)
      alert('계산 중 오류가 발생했습니다.')
    } finally {
      setIsCalculating(false)
    }
  }, [characters, customDropRates, customPrices, ringPrices, grindstonePrice, globalDropRateBonus, feeRate, pitchedBoxProbabilities])

  // 결과 탭 진입 시 계산 수행
  const handleTabChange = (tab: 'characters' | 'settings' | 'results') => {
    setActiveTab(tab)
    
    if (tab === 'results' && characters.length > 0) {
      handleCalculate()
    }
  }

  return (
    <>
      {/* 미완성 상태 안내 */}
      <DismissibleBanner 
        bannerId="boss_chase_incomplete"
        message="⚠️ 이 계산기는 아직 개발 중입니다. 일부 기능이 완전하지 않을 수 있으며, 지속적으로 개선 중입니다."
        bgColor="bg-orange-50"
        borderColor="border-orange-200"
        textColor="text-orange-800"
        buttonColor="text-orange-600 hover:text-orange-800 hover:bg-orange-100"
        linkColor="text-orange-600 hover:text-orange-800"
        showIcon={false}
        className="mb-4"
      />

      {/* 추정치 면책 조항 */}
      <DismissibleBanner 
        bannerId="boss_chase_disclaimer"
        message="이 계산기의 보스 물욕템 드롭률은 외부 연구 자료를 참고한 추정치입니다. 실제 드롭률과 차이가 있을 수 있으며, 필요한 경우 수정하시기 바랍니다."
      />

      {/* 패치 변경사항 고지 */}
      <DismissibleBanner 
        bannerId="boss_chase_patch_notice_250821"
        message="⚠️ 2025년 8월 21일 패치에 따른 변경사항이 적용됨에 따라, 일부 아이템의 확률은 기존 추정치를 기반으로 예상한 2차 추정치이므로 상당히 부정확할 수 있습니다."
        bgColor="bg-red-50"
        borderColor="border-red-200"
        textColor="text-red-800"
        buttonColor="text-red-600 hover:text-red-800 hover:bg-red-100"
        linkText=""
        showIcon={false}
        className="mb-4"
      />

      {/* AutoSlotManager */}
      <div className="mb-6">
        <AutoSlotManager
          calculatorId="boss_chase_calculator"
          maxSlots={5}
          getCurrentData={getCurrentData}
          loadData={loadData}
          onReset={resetAllData}
          onNotification={(type, message) => showNotification(type, message)}
        />
      </div>

      {/* 메인 컨테이너 */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => handleTabChange('characters')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'characters'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              캐릭터 관리
            </button>
            <button
              onClick={() => handleTabChange('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              설정
            </button>
            <button
              onClick={() => handleTabChange('results')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'results'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              결과
            </button>
          </nav>
        </div>

        {/* 탭 내용 */}
        <div className="p-6">
          {activeTab === 'characters' && (
            <CharacterManagement
              characters={characters}
              onCharactersChange={setCharacters}
              globalDropRateBonus={globalDropRateBonus}
            />
          )}
          
          {activeTab === 'settings' && (
            <SettingsPanel
              customDropRates={customDropRates}
              customPrices={customPrices}
              ringPrices={ringPrices}
              grindstonePrice={grindstonePrice}
              dropRateBonus={globalDropRateBonus}
              feeRate={feeRate}
              pitchedBoxProbabilities={pitchedBoxProbabilities}
              onCustomDropRatesChange={setCustomDropRates}
              onCustomPricesChange={setCustomPrices}
              onRingPricesChange={setRingPrices}
              onGrindstoneePriceChange={setGrindstonePrice}
              onDropRateBonusChange={setGlobalDropRateBonus}
              onFeeRateChange={setFeeRate}
              onPitchedBoxProbabilitiesChange={setPitchedBoxProbabilities}
            />
          )}
          
          {activeTab === 'results' && (
            <ResultsDisplay
              result={calculationResult}
              simulationResult={simulationResult}
              isCalculating={isCalculating}
              onRecalculate={handleCalculate}
              ringPrices={ringPrices}
              grindstonePrice={grindstonePrice}
              pitchedBoxProbabilities={pitchedBoxProbabilities}
            />
          )}
        </div>
      </div>
    </>
  )
}