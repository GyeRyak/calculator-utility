'use client'

import { useState, useEffect, useCallback } from 'react'
import { canUseFunctionalCookies } from '@/utils/cookies'

export interface SlotSystemConfig {
  storagePrefix: string
  maxSlots: number
  defaultSlotName: (slotNumber: number) => string
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

  // 현재 슬롯에 저장
  const saveCurrentSlot = (data: T) => {
    const saved = saveToSlot(currentSlot, data, tempSlotName || slotNames[currentSlot])
    if (saved) {
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 3000)
    }
    return saved
  }

  // 슬롯 전환
  const switchSlot = useCallback((slotNumber: number, currentData: T) => {
    if (slotNumber === currentSlot || slotNumber < 1 || slotNumber > config.maxSlots) return

    // 변경사항 확인
    if (hasUnsavedChanges) {
      const savedData = loadFromSlot(currentSlot)
      if (hasUnsavedChanges(currentData, savedData)) {
        if (!confirm('저장하지 않은 변경사항이 있습니다. 계속하시겠습니까?')) {
          return
        }
      }
    }

    // 현재 슬롯 저장
    saveToSlot(currentSlot, currentData, tempSlotName || slotNames[currentSlot])

    // 새 슬롯으로 전환
    setCurrentSlot(slotNumber)
    const loadedData = loadFromSlot(slotNumber)
    
    if (loadedData) {
      setTempSlotName(slotNames[slotNumber] || config.defaultSlotName(slotNumber))
      onSlotChange?.(slotNumber, loadedData)
    } else {
      setTempSlotName(config.defaultSlotName(slotNumber))
      onSlotChange?.(slotNumber, null)
    }

    setSettingsLoaded(true)
    setTimeout(() => setSettingsLoaded(false), 3000)
  }, [currentSlot, tempSlotName, slotNames, config, onSlotChange, hasUnsavedChanges])

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

  // 초기 로드
  useEffect(() => {
    // 모든 슬롯의 이름 로드
    for (let i = 1; i <= config.maxSlots; i++) {
      const data = loadFromSlot(i)
      if (data) {
        // 슬롯 이름은 loadFromSlot에서 자동으로 설정됨
      }
    }
    
    // 현재 슬롯 이름 설정
    setTempSlotName(slotNames[currentSlot])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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