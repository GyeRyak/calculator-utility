'use client'

import { useState, useEffect } from 'react'
import { Save, Trash2, Edit2 } from 'lucide-react'
import { canUseFunctionalCookies } from '@/utils/cookies'

export interface SlotManagerData {
  currentSlot: number
  slotNames: { [key: number]: string }
  tempSlotName: string
  isEditingSlotName: boolean
}

export interface SlotManagerProps {
  maxSlots: number
  storagePrefix: string
  onSlotChange: (slotNumber: number) => void
  onSave: (slotNumber: number) => boolean
  onReset: () => void
  hasUnsavedChanges?: () => boolean
  loadSlotData?: (slotNumber: number) => any
}

export default function SlotManagerV2({
  maxSlots,
  storagePrefix,
  onSlotChange,
  onSave,
  onReset,
  hasUnsavedChanges,
  loadSlotData
}: SlotManagerProps) {
  // 내부 슬롯 관리 상태
  const [currentSlot, setCurrentSlot] = useState(1)
  const [slotNames, setSlotNames] = useState<{ [key: number]: string }>(() => {
    const names: { [key: number]: string } = {}
    for (let i = 1; i <= maxSlots; i++) {
      names[i] = `슬롯 ${i}`
    }
    return names
  })
  const [tempSlotName, setTempSlotName] = useState<string>('')
  const [isEditingSlotName, setIsEditingSlotName] = useState(false)
  const [slotHasData, setSlotHasData] = useState<{ [key: number]: boolean }>(() => {
    const hasData: { [key: number]: boolean } = {}
    for (let i = 1; i <= maxSlots; i++) {
      hasData[i] = false
    }
    return hasData
  })
  
  // 미저장 변경사항 경고 모달
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
  const [pendingSlotNumber, setPendingSlotNumber] = useState<number | null>(null)

  // 슬롯 데이터 존재 여부 확인
  const hasSlotDataFunction = (slot: number): boolean => {
    if (!canUseFunctionalCookies()) return false
    try {
      const slotKey = `${storagePrefix}_slot_${slot}`
      return !!localStorage.getItem(slotKey)
    } catch {
      return false
    }
  }

  // 슬롯 전환 처리
  const handleSlotChange = (slotNumber: number) => {
    if (slotNumber === currentSlot) return

    // 저장하지 않은 변경사항이 있는지 확인
    if (hasUnsavedChanges && hasUnsavedChanges()) {
      setPendingSlotNumber(slotNumber)
      setShowUnsavedWarning(true)
      return
    }

    // 변경사항이 없으면 바로 전환
    executeSlotChange(slotNumber)
  }

  // 실제 슬롯 전환 실행
  const executeSlotChange = (slotNumber: number) => {
    setCurrentSlot(slotNumber)
    setTempSlotName(slotNames[slotNumber] || `슬롯 ${slotNumber}`)
    onSlotChange(slotNumber)
  }

  // 저장 후 이동
  const handleSaveAndSwitch = () => {
    if (pendingSlotNumber && onSave(currentSlot)) {
      executeSlotChange(pendingSlotNumber)
      setShowUnsavedWarning(false)
      setPendingSlotNumber(null)
    }
  }

  // 저장하지 않고 이동
  const handleSwitchWithoutSaving = () => {
    if (pendingSlotNumber) {
      executeSlotChange(pendingSlotNumber)
      setShowUnsavedWarning(false)
      setPendingSlotNumber(null)
    }
  }

  // 취소
  const handleCancelSwitch = () => {
    setShowUnsavedWarning(false)
    setPendingSlotNumber(null)
  }

  // 슬롯 이름 저장
  const saveSlotName = () => {
    if (onSave(currentSlot)) {
      setSlotNames(prev => ({
        ...prev,
        [currentSlot]: tempSlotName
      }))
      setIsEditingSlotName(false)
    }
  }

  // 초기화 - 모든 슬롯의 이름과 데이터 상태 로드
  useEffect(() => {
    if (canUseFunctionalCookies()) {
      const newSlotNames: { [key: number]: string } = {}
      const newSlotHasData: { [key: number]: boolean } = {}

      for (let i = 1; i <= maxSlots; i++) {
        // 슬롯 데이터 로드하여 이름 확인
        if (loadSlotData) {
          const data = loadSlotData(i)
          if (data && data.slotName) {
            newSlotNames[i] = data.slotName
          } else {
            newSlotNames[i] = `슬롯 ${i}`
          }
        } else {
          newSlotNames[i] = `슬롯 ${i}`
        }
        
        newSlotHasData[i] = hasSlotDataFunction(i)
      }

      setSlotNames(newSlotNames)
      setSlotHasData(newSlotHasData)
      setTempSlotName(newSlotNames[currentSlot] || `슬롯 ${currentSlot}`)
    }
  }, [maxSlots, storagePrefix, loadSlotData])

  // 슬롯이 변경될 때 tempSlotName 업데이트 (편집 중이 아닐 때만)
  useEffect(() => {
    if (!isEditingSlotName) {
      setTempSlotName(slotNames[currentSlot] || `슬롯 ${currentSlot}`)
    }
  }, [currentSlot, slotNames, isEditingSlotName])

  return (
    <>
      <div className="mb-4 border-b pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* 슬롯 버튼들 */}
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-700 mr-2">저장 슬롯:</h3>
            <div className="flex gap-2">
              {Array.from({ length: maxSlots }, (_, i) => i + 1).map(slot => (
                <div key={slot} className="relative">
                  <button
                    onClick={() => handleSlotChange(slot)}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                      currentSlot === slot
                        ? 'bg-blue-500 text-white shadow-md'
                        : slotHasData[slot]
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-400 border border-gray-200'
                    }`}
                  >
                    {slot}
                  </button>
                  {/* 슬롯 이름 표시 */}
                  {slotNames[slot] && slotNames[slot] !== `슬롯 ${slot}` && (
                    <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap">
                      {slotNames[slot]}
                    </div>
                  )}
                  {/* 저장된 데이터 표시 */}
                  {slotHasData[slot] && currentSlot !== slot && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" title="저장된 데이터 있음" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 슬롯 이름 및 액션 버튼 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">현재 슬롯:</span>
              {isEditingSlotName ? (
                <input
                  type="text"
                  value={tempSlotName}
                  onChange={(e) => setTempSlotName(e.target.value)}
                  onBlur={saveSlotName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      saveSlotName()
                    } else if (e.key === 'Escape') {
                      setIsEditingSlotName(false)
                      setTempSlotName(slotNames[currentSlot])
                    }
                  }}
                  className="px-3 py-1 text-sm border rounded-md w-32 font-medium"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setIsEditingSlotName(true)}
                  className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1"
                >
                  {tempSlotName || slotNames[currentSlot]}
                  <Edit2 className="h-3 w-3" />
                </button>
              )}
            </div>
            
            {/* 저장/초기화 버튼 */}
            <div className="flex gap-1">
              <button
                onClick={() => onSave(currentSlot)}
                className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center gap-1"
                title="현재 설정 저장"
              >
                <Save className="h-3.5 w-3.5" />
                저장
              </button>
              <button
                onClick={onReset}
                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center gap-1"
                title="현재 슬롯 초기화"
              >
                <Trash2 className="h-3.5 w-3.5" />
                초기화
              </button>
            </div>
          </div>
        </div>
        
        {/* 슬롯 이름들이 있을 경우 추가 여백 */}
        {Object.values(slotNames).some(name => name && name !== `슬롯 ${1}` && name !== `슬롯 ${2}` && name !== `슬롯 ${3}`) && (
          <div className="h-4"></div>
        )}
      </div>

      {/* 저장되지 않은 변경사항 모달 */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 text-orange-500">⚠️</div>
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
    </>
  )
}

// 슬롯 매니저 데이터 접근을 위한 훅
export function useSlotManagerData() {
  return {
    // 외부에서 슬롯 데이터를 가져올 수 있는 인터페이스
    getCurrentSlot: () => 1, // SlotManagerV2에서 관리하는 currentSlot 반환
    getSlotNames: () => ({}), // SlotManagerV2에서 관리하는 slotNames 반환
  }
}