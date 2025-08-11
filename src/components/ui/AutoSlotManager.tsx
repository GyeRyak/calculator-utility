'use client'

import { useState, useEffect } from 'react'
import { Save, Trash2, Edit2 } from 'lucide-react'
import { canUseFunctionalCookies } from '@/utils/cookies'

interface AutoSlotManagerProps {
  calculatorId: string // 'basic_calculator' 또는 'breakeven_calculator'
  maxSlots?: number
  getCurrentData: () => any // 현재 계산기 데이터를 가져오는 함수
  loadData: (data: any, onComplete?: () => void) => void // 데이터를 계산기에 로드하는 함수 (완료 콜백 포함)
  onReset: () => void // 계산기 초기화 함수
  onNotification?: (type: 'success' | 'error', message: string) => void // 알림 함수
}

export default function AutoSlotManager({
  calculatorId,
  maxSlots = 3,
  getCurrentData,
  loadData,
  onReset,
  onNotification
}: AutoSlotManagerProps) {
  // 슬롯 상태 관리
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
  
  // 상태 추적을 위한 변수들
  const [lastSavedData, setLastSavedData] = useState<any>(null) // 마지막 저장된 상태
  const [hasDataChanged, setHasDataChanged] = useState(false) // 데이터 변경 여부
  const [isLoading, setIsLoading] = useState(false) // 로딩 중 여부
  const [justLoaded, setJustLoaded] = useState(false) // 방금 로드 완료 여부
  
  // 미저장 변경사항 경고 모달
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
  const [pendingSlotNumber, setPendingSlotNumber] = useState<number | null>(null)

  // 슬롯 키 생성
  const getSlotKey = (slotNumber: number): string => {
    return `${calculatorId}_slot_${slotNumber}`
  }

  // 데이터 변경 감지 함수
  const checkForChanges = (): boolean => {
    const currentData = getCurrentData()
    
    // lastSavedData가 있으면 비교
    if (lastSavedData) {
      try {
        // JSON 문자열로 비교 (단순하지만 효과적)
        const currentJson = JSON.stringify(currentData)
        const savedJson = JSON.stringify(lastSavedData)
        return currentJson !== savedJson
      } catch {
        return false // 비교 실패 시 변경사항 없다고 가정
      }
    }
    
    // lastSavedData가 없으면 변경사항 없음
    return false
  }

  // 슬롯 데이터 존재 여부 확인
  const checkSlotData = (slot: number): boolean => {
    if (!canUseFunctionalCookies()) return false
    try {
      const slotKey = getSlotKey(slot)
      return !!localStorage.getItem(slotKey)
    } catch {
      return false
    }
  }

  // 슬롯에서 데이터 로드
  const loadSlotData = (slotNumber: number): any => {
    if (!canUseFunctionalCookies()) return null
    try {
      const slotKey = getSlotKey(slotNumber)
      const savedData = localStorage.getItem(slotKey)
      if (savedData) {
        return JSON.parse(savedData)
      }
    } catch (error) {
      console.error('Failed to load slot data:', error)
    }
    return null
  }

  // 슬롯에 데이터 저장
  const saveSlotData = (slotNumber: number, data: any, slotName?: string): boolean => {
    if (!canUseFunctionalCookies()) {
      onNotification?.('error', '기능성 쿠키가 비활성화되어 있습니다. 설정을 저장하려면 쿠키 설정에서 기능성 쿠키를 활성화해주세요.')
      return false
    }

    try {
      const slotKey = getSlotKey(slotNumber)
      const slotData = {
        ...data,
        slotName: slotName || slotNames[slotNumber]
      }
      localStorage.setItem(slotKey, JSON.stringify(slotData))
      
      // 슬롯 이름 업데이트
      if (slotName && slotName !== slotNames[slotNumber]) {
        setSlotNames(prev => ({ ...prev, [slotNumber]: slotName }))
      }
      
      // 슬롯 데이터 상태 업데이트
      setSlotHasData(prev => ({ ...prev, [slotNumber]: true }))
      
      return true
    } catch (error) {
      console.error('Failed to save slot data:', error)
      onNotification?.('error', '설정 저장에 실패했습니다.')
      return false
    }
  }

  // 슬롯 데이터 삭제
  const deleteSlotData = (slotNumber: number): boolean => {
    if (!canUseFunctionalCookies()) return false
    try {
      const slotKey = getSlotKey(slotNumber)
      localStorage.removeItem(slotKey)
      setSlotNames(prev => ({ ...prev, [slotNumber]: `슬롯 ${slotNumber}` }))
      setSlotHasData(prev => ({ ...prev, [slotNumber]: false }))
      return true
    } catch (error) {
      console.error('Failed to delete slot data:', error)
      return false
    }
  }

  // 현재 설정 저장
  const saveCurrentSlot = (): boolean => {
    const currentData = getCurrentData()
    const success = saveSlotData(currentSlot, currentData, tempSlotName)
    if (success) {
      setLastSavedData(currentData) // 저장된 데이터 업데이트
      setHasDataChanged(false) // 변경사항 없음으로 설정
      onNotification?.('success', `슬롯 ${currentSlot}에 설정이 저장되었습니다.`)
    }
    return success
  }

  // 슬롯 전환 처리
  const handleSlotChange = (slotNumber: number) => {
    if (slotNumber === currentSlot) return

    // 로딩 중이 아니고, justLoaded가 false일 때만 변경사항 체크
    // (방금 로드한 상태가 아닐 때만)
    if (!isLoading && !justLoaded && checkForChanges()) {
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
    
    // 로드 시작
    setIsLoading(true)
    setHasDataChanged(false) // 로딩 중에는 변경사항 없음
    
    // 슬롯 데이터 로드
    const slotData = loadSlotData(slotNumber)
    if (slotData) {
      // 데이터를 먼저 로드한 후 상태 업데이트
      try {
        loadData(slotData, () => {
          // 로드 완료 콜백
          setJustLoaded(true)
          setIsLoading(false)
        })
        onNotification?.('success', `슬롯 ${slotNumber}의 설정을 불러왔습니다.`)
      } catch (error) {
        console.error('Failed to load data:', error)
        onNotification?.('error', '데이터 로드 중 오류가 발생했습니다.')
        setIsLoading(false)
      }
    } else {
      // 빈 슬롯이면 초기화 (안내 메시지 없음)
      onReset()
      // 초기화 후 바로 justLoaded 설정 (useEffect에서 처리)
      setJustLoaded(true)
      setIsLoading(false)
    }
  }

  // 저장 후 이동
  const handleSaveAndSwitch = () => {
    if (pendingSlotNumber && saveCurrentSlot()) {
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
    if (saveCurrentSlot()) {
      setSlotNames(prev => ({
        ...prev,
        [currentSlot]: tempSlotName
      }))
      setIsEditingSlotName(false)
    }
  }

  // 슬롯 초기화
  const handleReset = () => {
    if (confirm('현재 슬롯의 모든 설정을 초기화하시겠습니까?')) {
      deleteSlotData(currentSlot)
      setTempSlotName(`슬롯 ${currentSlot}`)
      onReset()
      
      // 초기화 후 justLoaded 플래그 설정 (로드와 동일하게 처리)
      setJustLoaded(true)
      
      onNotification?.('success', '현재 슬롯이 초기화되었습니다.')
    }
  }

  // 초기화 - 모든 슬롯의 이름과 데이터 상태 로드
  useEffect(() => {
    if (canUseFunctionalCookies()) {
      const newSlotNames: { [key: number]: string } = {}
      const newSlotHasData: { [key: number]: boolean } = {}

      for (let i = 1; i <= maxSlots; i++) {
        const data = loadSlotData(i)
        if (data && data.slotName) {
          newSlotNames[i] = data.slotName
        } else {
          newSlotNames[i] = `슬롯 ${i}`
        }
        newSlotHasData[i] = checkSlotData(i)
      }

      setSlotNames(newSlotNames)
      setSlotHasData(newSlotHasData)
      setTempSlotName(newSlotNames[currentSlot] || `슬롯 ${currentSlot}`)
    }
  }, [calculatorId, maxSlots])

  // 슬롯이 변경될 때 tempSlotName 업데이트 (편집 중이 아닐 때만)
  useEffect(() => {
    if (!isEditingSlotName) {
      setTempSlotName(slotNames[currentSlot] || `슬롯 ${currentSlot}`)
    }
  }, [currentSlot, slotNames, isEditingSlotName])

  // 초기 로드 시 1번 슬롯 데이터 로드
  useEffect(() => {
    // 컴포넌트가 마운트되면 1번 슬롯 데이터를 로드
    const slotData = loadSlotData(1)
    if (slotData) {
      // 저장된 데이터가 있으면 로드
      setIsLoading(true)
      loadData(slotData, () => {
        setJustLoaded(true)
        setIsLoading(false)
      })
    } else {
      // 저장된 데이터가 없으면 justLoaded 플래그 설정
      setJustLoaded(true)
    }
  }, []) // 최초 로드 시에만 실행

  // 로드 직후에만 lastSavedData 업데이트
  useEffect(() => {
    if (justLoaded) {
      // 로드가 완료되었으면 현재 상태를 저장
      const currentData = getCurrentData()
      setLastSavedData(currentData)
      setHasDataChanged(false) // 로드 직후에는 변경사항 없음
      setJustLoaded(false) // 플래그 리셋
    }
  }, [justLoaded, getCurrentData])


  // 정기적으로 변경사항 확인 (500ms마다)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        // 로딩 중이 아닐 때만 변경사항 체크
        const hasChanges = checkForChanges()
        setHasDataChanged(hasChanges)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [lastSavedData, isLoading]) // lastSavedData와 isLoading이 변경될 때마다 interval 재설정

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
                onClick={saveCurrentSlot}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1 ${
                  hasDataChanged 
                    ? 'bg-orange-500 text-white hover:bg-orange-600' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
                title={hasDataChanged ? "저장하지 않은 변경사항이 있습니다" : "현재 설정 저장"}
              >
                <Save className="h-3.5 w-3.5" />
                {hasDataChanged ? '저장 필요' : '저장'}
              </button>
              <button
                onClick={handleReset}
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