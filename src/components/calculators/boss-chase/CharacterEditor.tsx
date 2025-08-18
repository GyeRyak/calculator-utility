'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Save, X, Plus, Trash2, Users } from 'lucide-react'
import type { CharacterConfig, BossEntry } from '@/utils/defaults/bossChaseDefaults'
import { BOSSES, getBossById, getBossDifficulty } from '@/data/bossData'
import { getChaseItemById } from '@/data/chaseItems'
import SlotSelector from '@/components/ui/SlotSelector'
import { loadDropRateFromBasicCalculator, getDefaultDropRateFromBasicCalculator } from '@/utils/bossChaseCalculations'

interface CharacterEditorProps {
  character: CharacterConfig
  onSave: (character: CharacterConfig) => void
  onCancel: () => void
}

export default function CharacterEditor({
  character,
  onSave,
  onCancel
}: CharacterEditorProps) {
  const [name, setName] = useState(character.name)
  const [useGlobalDropRate, setUseGlobalDropRate] = useState(character.useGlobalDropRate ?? true)
  const [customDropRate, setCustomDropRate] = useState(character.customDropRate ?? 0)
  const [selectedBasicSlot, setSelectedBasicSlot] = useState<number | null>(null)
  
  // 뒤로가기 처리를 위한 popstate 핸들러
  const handlePopState = useCallback((e: PopStateEvent) => {
    e.preventDefault()
    onCancel()
  }, [onCancel])
  
  // 컴포넌트 마운트 시 history state 추가
  useEffect(() => {
    // 현재 상태를 history에 추가
    window.history.pushState({ characterEditor: true }, '')
    
    // popstate 이벤트 리스너 추가
    window.addEventListener('popstate', handlePopState)
    
    // 클린업
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [handlePopState])
  
  const [bossList, setBossList] = useState<BossEntry[]>(() => {
    // 보스별로 하나의 난이도만 선택 가능하도록 초기화
    const bossSettings: { [bossId: string]: BossEntry } = {}
    
    BOSSES.forEach(boss => {
      // 기존 설정에서 해당 보스의 활성화된 난이도 찾기
      const existingEntry = character.bossList.find(entry => entry.bossId === boss.id)
      
      if (existingEntry) {
        bossSettings[boss.id] = existingEntry
      } else {
        // 기본값: 첫 번째 난이도, 격파 인원 0 (비활성)
        bossSettings[boss.id] = {
          bossId: boss.id,
          difficulty: boss.difficulties[0]?.id || '',
          partySize: 0
        }
      }
    })
    
    return Object.values(bossSettings)
  })

  // 주간 보스 개수 계산
  const getWeeklyBossCount = useCallback((bossListToCheck: BossEntry[]) => {
    return bossListToCheck.filter(boss => {
      const bossData = getBossById(boss.bossId)
      return boss.partySize > 0 && bossData?.type === 'weekly'
    }).length
  }, [])

  // 보스 활성화/비활성화
  const handleBossToggle = (bossId: string, active: boolean) => {
    const bossData = getBossById(bossId)
    
    // 주간 보스를 활성화하려고 할 때 12개 제한 확인
    if (active && bossData?.type === 'weekly') {
      const currentWeeklyCount = getWeeklyBossCount(bossList)
      if (currentWeeklyCount >= 12) {
        alert('주간 보스는 최대 12개까지만 선택할 수 있습니다.')
        return
      }
    }
    
    const newBossList = bossList.map(boss => {
      if (boss.bossId === bossId) {
        if (active) {
          // 활성화할 때: 최저 난이도로 설정하고 격파 인원 1로 설정
          const lowestDifficulty = bossData?.difficulties[0]?.id || boss.difficulty
          return {
            ...boss,
            difficulty: lowestDifficulty,
            partySize: 1
          }
        } else {
          // 비활성화할 때: 격파 인원만 0으로 설정 (난이도는 유지)
          return {
            ...boss,
            partySize: 0
          }
        }
      }
      return boss
    })
    setBossList(newBossList)
  }

  // 보스 난이도 변경 (자동으로 활성화, 토글 기능)
  const handleDifficultyChange = (bossId: string, difficulty: string) => {
    const bossData = getBossById(bossId)
    const currentBoss = bossList.find(boss => boss.bossId === bossId)
    
    // 현재 비활성화 상태에서 주간 보스를 활성화하려고 할 때 12개 제한 확인
    if (currentBoss && currentBoss.partySize === 0 && bossData?.type === 'weekly') {
      const currentWeeklyCount = getWeeklyBossCount(bossList)
      if (currentWeeklyCount >= 12) {
        alert('주간 보스는 최대 12개까지만 선택할 수 있습니다.')
        return
      }
    }
    
    const newBossList = bossList.map(boss => {
      if (boss.bossId === bossId) {
        // 현재 선택된 난이도를 다시 클릭하면 체크 해제 (토글)
        if (boss.partySize > 0 && boss.difficulty === difficulty) {
          return {
            ...boss,
            partySize: 0 // 비활성화
          }
        }
        
        // 다른 난이도를 클릭하면 해당 난이도로 변경하고 활성화
        return {
          ...boss,
          difficulty,
          partySize: boss.partySize > 0 ? boss.partySize : 1 // 난이도 변경 시 자동으로 활성화
        }
      }
      return boss
    })
    setBossList(newBossList)
  }

  // 격파 인원 변경
  const handlePartySizeChange = (bossId: string, partySize: number) => {
    const newBossList = bossList.map(boss => {
      if (boss.bossId === bossId) {
        return {
          ...boss,
          partySize
        }
      }
      return boss
    })
    setBossList(newBossList)
  }

  // 저장
  const handleSave = () => {
    if (!name.trim()) {
      alert('캐릭터 이름을 입력해주세요.')
      return
    }

    // 격파 인원이 1 이상인 보스만 필터링
    const activeBossList = bossList.filter(boss => boss.partySize > 0)

    const updatedCharacter: CharacterConfig = {
      ...character,
      name: name.trim(),
      bossList: activeBossList,
      useGlobalDropRate,
      customDropRate
    }

    onSave(updatedCharacter)
  }

  // 보스 이름을 한국어로 표시
  const getBossDisplayName = (bossId: string, difficulty: string) => {
    const boss = getBossById(bossId)
    const difficultyData = getBossDifficulty(bossId, difficulty)
    if (!boss || !difficultyData) return ''
    
    return `${difficultyData.name} ${boss.name}`
  }

  // 드롭 아이템 목록 가져오기
  const getDropItemNames = (bossId: string, difficulty: string) => {
    const difficultyData = getBossDifficulty(bossId, difficulty)
    if (!difficultyData) return []
    
    return difficultyData.dropTable.map(itemId => {
      const item = getChaseItemById(itemId)
      return item?.name || itemId
    })
  }

  // 사냥 기댓값 계산기 슬롯 데이터 캐싱
  const basicSlotData = useMemo(() => {
    const slots: { [key: number]: { exists: boolean; name: string } } = {}
    for (let i = 1; i <= 5; i++) {
      try {
        const key = `basic_calculator_slot_${i}`
        const data = localStorage.getItem(key)
        if (data) {
          const settings = JSON.parse(data)
          slots[i] = {
            exists: true,
            name: settings.slotName || `슬롯 ${i}`
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
      setCustomDropRate(calculatedDropRate)
      setSelectedBasicSlot(slotNumber)
      // 개별 설정 모드로 자동 전환
      setUseGlobalDropRate(false)
    }
  }, [])

  // 기본값으로 초기화
  const resetDropRateSettings = useCallback(() => {
    const defaultDropRate = getDefaultDropRateFromBasicCalculator()
    
    setCustomDropRate(defaultDropRate)
    setSelectedBasicSlot(null)
    // 개별 설정 모드로 자동 전환
    setUseGlobalDropRate(false)
  }, [])

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {character.name ? '캐릭터 편집' : '새 캐릭터 추가'}
          </h3>
          <p className="text-sm text-gray-600">
            캐릭터 정보와 클리어 가능한 보스들을 설정하세요.
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={onCancel}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4 mr-2" />
            취소
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            저장
          </button>
        </div>
      </div>

      {/* 캐릭터 기본 정보 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          캐릭터 이름
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="캐릭터 이름을 입력하세요"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 드롭률 설정 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-md font-medium text-gray-900 mb-3">드롭률 설정</h4>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`useGlobal_${character.id}`}
              checked={useGlobalDropRate}
              onChange={(e) => setUseGlobalDropRate(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={`useGlobal_${character.id}`} className="ml-2 text-sm text-gray-700">
              기본 아이템 드롭률 증가 설정 사용
            </label>
          </div>
          
          {!useGlobalDropRate && (
            <div className="ml-6 space-y-4">
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

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  개별 드롭률 설정 (%)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={customDropRate}
                    onChange={(e) => setCustomDropRate(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <p className="text-xs text-gray-500">
                  위에서 사냥 기댓값 계산기 데이터를 불러오거나 직접 입력하여 설정할 수 있습니다.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 보스 목록 */}
      <div>
        <div className="mb-4">
          <h4 className="text-md font-medium text-gray-900">보스 클리어 설정</h4>
          <p className="text-sm text-gray-600">
            보스별로 하나의 난이도만 선택할 수 있습니다. 체크박스로 활성화/비활성화를 설정하세요.
          </p>
          {(() => {
            const weeklyCount = getWeeklyBossCount(bossList)
            const monthlyCount = bossList.filter(boss => {
              const bossData = getBossById(boss.bossId)
              return boss.partySize > 0 && bossData?.type === 'monthly'
            }).length
            
            return (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center space-x-4 text-sm">
                  <div className={`font-medium ${weeklyCount >= 12 ? 'text-red-600' : 'text-blue-600'}`}>
                    주간 보스: {weeklyCount}/12 {weeklyCount >= 12 && '(최대)'}
                  </div>
                  <div className="text-blue-600">
                    월간 보스: {monthlyCount}개
                  </div>
                </div>
                {weeklyCount >= 12 && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ 주간 보스는 최대 12개까지만 선택할 수 있습니다.
                  </p>
                )}
              </div>
            )
          })()}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {BOSSES.map((bossData) => {
            const bossEntry = bossList.find(entry => entry.bossId === bossData.id)
            const isActive = bossEntry && bossEntry.partySize > 0
            const currentDifficulty = bossEntry?.difficulty || bossData.difficulties[0]?.id
            
            return (
              <div
                key={bossData.id}
                className={`border rounded-lg p-4 transition-colors ${
                  isActive ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
                }`}
              >
                {/* 보스 헤더 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => handleBossToggle(bossData.id, e.target.checked)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <h5 className="text-md font-medium text-gray-900">{bossData.name}</h5>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    bossData.type === 'weekly' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {bossData.type === 'weekly' ? '주간' : '월간'}
                  </span>
                </div>
                
                {/* 난이도 선택 */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">난이도</label>
                  <div className="flex flex-wrap gap-2">
                    {bossData.difficulties.map((difficulty) => (
                      <label
                        key={difficulty.id}
                        onClick={() => handleDifficultyChange(bossData.id, difficulty.id)}
                        className={`inline-flex items-center px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                          isActive && currentDifficulty === difficulty.id
                            ? 'border-blue-500 bg-blue-100 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-sm font-medium">{difficulty.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 격파 인원 및 상태 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className="text-sm text-gray-600">격파 인원:</span>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={isActive ? (bossEntry?.partySize || 1) : 1}
                      onChange={(e) => handlePartySizeChange(bossData.id, parseInt(e.target.value) || 1)}
                      disabled={!isActive}
                      className={`w-16 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 ${
                        isActive 
                          ? 'border-blue-300 focus:ring-blue-500 bg-white' 
                          : 'border-gray-300 bg-gray-100 text-gray-500'
                      }`}
                    />
                  </div>
                  
                  <div className="text-right">
                    {isActive ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ 활성화
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        비활성화
                      </span>
                    )}
                  </div>
                </div>

                {/* 드롭 아이템 정보 (활성화된 경우만) */}
                {isActive && currentDifficulty && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-600">
                      {(() => {
                        const dropItems = getDropItemNames(bossData.id, currentDifficulty)
                        return (
                          <div>
                            <div className="font-medium mb-1">
                              {getBossDisplayName(bossData.id, currentDifficulty)} - 드롭 아이템 {dropItems.length}개
                            </div>
                            <div className="space-y-1 max-h-20 overflow-y-auto">
                              {dropItems.map((itemName, index) => (
                                <div key={index} className="truncate">• {itemName}</div>
                              ))}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}