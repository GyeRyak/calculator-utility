'use client'

import { useState, useEffect, useCallback } from 'react'
import { canUseFunctionalCookies } from '@/utils/cookies'
import { UNSAVED_CHANGES_MESSAGE } from '@/utils/slotUtils'

export interface SlotSystemConfig {
  storagePrefix: string
  maxSlots: number
  defaultSlotName: (slotNumber: number) => string
  useModal?: boolean  // 모달 방식 사용 여부 (기본: false, confirm 사용)
}

export interface SlotData<T> {
  data: T
  slotName?: string
}

export function useSlotSystem<T>(
  config: SlotSystemConfig,
  defaultData: T,
  onSlotChange?: (slotNumber: number, data: T | null) => void,
  hasUnsavedChanges?: (currentData: T, savedData: T | null) => boolean
) {
  const [currentSlot, setCurrentSlot] = useState(1)
  const [slotNames, setSlotNames] = useState<{ [key: number]: string }>(() => {
    const names: { [key: number]: string } = {}
    for (let i = 1; i <= config.maxSlots; i++) {
      names[i] = config.defaultSlotName(i)
    }
    return names
  })
  const [tempSlotName, setTempSlotName] = useState('')
  const [isEditingSlotName, setIsEditingSlotName] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  
  // 모달 방식용 상태
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
  const [pendingSlotNumber, setPendingSlotNumber] = useState<number | null>(null)
  const [pendingCurrentData, setPendingCurrentData] = useState<T | null>(null)

  // 슬롯별 키 생성
  const getSlotKey = (slotNumber: number): string => {
    return `${config.storagePrefix}_slot_${slotNumber}`
  }

  // 슬롯 데이터 존재 여부 확인
  const hasSlotData = (slotNumber: number): boolean => {
    if (!canUseFunctionalCookies()) return false
    try {
      const slotKey = getSlotKey(slotNumber)
      return !!localStorage.getItem(slotKey)
    } catch {
      return false
    }
  }

  // 슬롯 데이터 저장
  const saveToSlot = (slotNumber: number, data: T, slotName?: string) => {
    if (!canUseFunctionalCookies()) {
      console.warn('Functional cookies are not allowed. Settings will not be saved.')
      return false
    }

    try {
      const slotKey = getSlotKey(slotNumber)
      const slotData: SlotData<T> = {
        data,
        slotName: slotName || slotNames[slotNumber]
      }
      localStorage.setItem(slotKey, JSON.stringify(slotData))
      
      if (slotName && slotName !== slotNames[slotNumber]) {
        setSlotNames(prev => ({ ...prev, [slotNumber]: slotName }))
      }
      
      return true
    } catch (error) {
      console.error('Failed to save to slot:', error)
      return false
    }
  }

  // 슬롯 데이터 불러오기
  const loadFromSlot = (slotNumber: number): T | null => {
    if (!canUseFunctionalCookies()) return null

    try {
      const slotKey = getSlotKey(slotNumber)
      const savedData = localStorage.getItem(slotKey)
      
      if (savedData) {
        const slotData = JSON.parse(savedData) as SlotData<T>
        if (slotData.slotName) {
          setSlotNames(prev => ({ ...prev, [slotNumber]: slotData.slotName! }))
        }
        return slotData.data
      }
      
      return null
    } catch (error) {
      console.error('Failed to load from slot:', error)
      return null
    }
  }

  // 슬롯 데이터와 이름을 동시에 불러오기
  const loadSlotWithName = (slotNumber: number): { data: T | null; slotName: string } => {
    if (!canUseFunctionalCookies()) {
      return { 
        data: null, 
        slotName: config.defaultSlotName(slotNumber) 
      }
    }

    try {
      const slotKey = getSlotKey(slotNumber)
      const savedData = localStorage.getItem(slotKey)
      
      if (savedData) {
        const slotData = JSON.parse(savedData) as SlotData<T>
        const actualSlotName = slotData.slotName || config.defaultSlotName(slotNumber)
        
        if (slotData.slotName) {
          setSlotNames(prev => ({ ...prev, [slotNumber]: slotData.slotName! }))
        }
        
        return { 
          data: slotData.data, 
          slotName: actualSlotName 
        }
      }
      
      return { 
        data: null, 
        slotName: config.defaultSlotName(slotNumber) 
      }
    } catch (error) {
      console.error('Failed to load from slot:', error)
      return { 
        data: null, 
        slotName: config.defaultSlotName(slotNumber) 
      }
    }
  }

  // 현재 슬롯에 저장
  const saveCurrentSlot = (data: T) => {
    const saved = saveToSlot(currentSlot, data, tempSlotName || slotNames[currentSlot])
    if (saved) {
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 3000)
    }
    return saved
  }

  // 실제 슬롯 전환 실행
  const executeSlotSwitch = useCallback((slotNumber: number, currentData: T, shouldSave: boolean = true) => {
    // 현재 슬롯 저장 (선택적)
    if (shouldSave) {
      saveToSlot(currentSlot, currentData, tempSlotName || slotNames[currentSlot])
    }

    // 새 슬롯으로 전환
    setCurrentSlot(slotNumber)
    const { data: loadedData, slotName } = loadSlotWithName(slotNumber)
    
    // 실제 슬롯 이름으로 tempSlotName 설정
    setTempSlotName(slotName)
    onSlotChange?.(slotNumber, loadedData)

    setSettingsLoaded(true)
    setTimeout(() => setSettingsLoaded(false), 3000)
  }, [currentSlot, tempSlotName, slotNames, config, onSlotChange])

  // 슬롯 전환
  const switchSlot = useCallback((slotNumber: number, currentData: T) => {
    if (slotNumber === currentSlot || slotNumber < 1 || slotNumber > config.maxSlots) return

    // 변경사항 확인
    if (hasUnsavedChanges) {
      const savedData = loadFromSlot(currentSlot)
      if (hasUnsavedChanges(currentData, savedData)) {
        if (config.useModal) {
          // 모달 방식
          setPendingSlotNumber(slotNumber)
          setPendingCurrentData(currentData)
          setShowUnsavedWarning(true)
          return
        } else {
          // confirm 방식 (기존)
          if (!confirm(UNSAVED_CHANGES_MESSAGE)) {
            return
          }
        }
      }
    }

    // 변경사항이 없거나 사용자가 확인한 경우 바로 전환
    executeSlotSwitch(slotNumber, currentData)
  }, [currentSlot, config, hasUnsavedChanges, executeSlotSwitch])

  // 슬롯 삭제
  const deleteSlot = (slotNumber: number) => {
    if (!canUseFunctionalCookies()) return false

    try {
      const slotKey = getSlotKey(slotNumber)
      localStorage.removeItem(slotKey)
      setSlotNames(prev => ({ ...prev, [slotNumber]: config.defaultSlotName(slotNumber) }))
      return true
    } catch (error) {
      console.error('Failed to delete slot:', error)
      return false
    }
  }

  // 모든 슬롯 삭제
  const deleteAllSlots = () => {
    if (!canUseFunctionalCookies()) return false

    try {
      for (let i = 1; i <= config.maxSlots; i++) {
        const slotKey = getSlotKey(i)
        localStorage.removeItem(slotKey)
      }
      
      // 슬롯 이름 초기화
      const names: { [key: number]: string } = {}
      for (let i = 1; i <= config.maxSlots; i++) {
        names[i] = config.defaultSlotName(i)
      }
      setSlotNames(names)
      
      return true
    } catch (error) {
      console.error('Failed to delete all slots:', error)
      return false
    }
  }

  // 모달 핸들러들
  const handleSaveAndSwitch = useCallback(() => {
    if (pendingSlotNumber && pendingCurrentData) {
      executeSlotSwitch(pendingSlotNumber, pendingCurrentData, true)
      setShowUnsavedWarning(false)
      setPendingSlotNumber(null)
      setPendingCurrentData(null)
    }
  }, [pendingSlotNumber, pendingCurrentData, executeSlotSwitch])

  const handleSwitchWithoutSaving = useCallback(() => {
    if (pendingSlotNumber && pendingCurrentData) {
      executeSlotSwitch(pendingSlotNumber, pendingCurrentData, false)
      setShowUnsavedWarning(false)
      setPendingSlotNumber(null)
      setPendingCurrentData(null)
    }
  }, [pendingSlotNumber, pendingCurrentData, executeSlotSwitch])

  const handleCancelSwitch = useCallback(() => {
    setShowUnsavedWarning(false)
    setPendingSlotNumber(null)
    setPendingCurrentData(null)
  }, [])

  // 초기 로드
  useEffect(() => {
    // 모든 슬롯의 이름 로드 및 현재 슬롯의 tempSlotName 설정
    for (let i = 1; i <= config.maxSlots; i++) {
      loadFromSlot(i)
    }
    
    // 현재 슬롯의 실제 이름으로 tempSlotName 초기화
    const { slotName } = loadSlotWithName(currentSlot)
    setTempSlotName(slotName)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // slotNames가 업데이트되면 현재 슬롯의 tempSlotName 업데이트 (편집 중이 아닐 때만)
  useEffect(() => {
    if (!isEditingSlotName) {
      setTempSlotName(slotNames[currentSlot] || config.defaultSlotName(currentSlot))
    }
  }, [slotNames, currentSlot, config, isEditingSlotName])

  return {
    // 현재 슬롯 정보
    currentSlot,
    slotNames,
    tempSlotName,
    setTempSlotName,
    isEditingSlotName,
    setIsEditingSlotName,
    
    // 상태 플래그
    settingsSaved,
    settingsLoaded,
    
    // 모달 관련 (useModal이 true일 때만 사용)
    showUnsavedWarning,
    handleSaveAndSwitch,
    handleSwitchWithoutSaving,
    handleCancelSwitch,
    
    // 슬롯 작업 함수
    hasSlotData,
    saveCurrentSlot,
    switchSlot,
    deleteSlot,
    deleteAllSlots,
    loadFromSlot,
    
    // 유틸리티
    maxSlots: config.maxSlots
  }
}