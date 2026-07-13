'use client'

import { useEffect, useRef, useState } from 'react'
import { Save, Trash2, Edit2, Copy, Share2, Download, AlertTriangle, Settings } from 'lucide-react'
import { canUseFunctionalCookies, OPEN_DATA_PRIVACY_SETTINGS_EVENT } from '@/utils/cookies'
import { trackSlotAction } from '@/lib/analytics'
import {
  decodeSettingsExport,
  deleteCalculatorSlot,
  encodeSettingsExport,
  hasCalculatorSlotData,
  loadCalculatorSlot,
  saveCalculatorSlot,
} from '@/utils/slotStorage'

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
  maxSlots = 5,
  getCurrentData,
  loadData,
  onReset,
  onNotification
}: AutoSlotManagerProps) {
  const getCurrentDataRef = useRef(getCurrentData)
  const loadDataRef = useRef(loadData)
  getCurrentDataRef.current = getCurrentData
  loadDataRef.current = loadData

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
  const [showFunctionalCookieWarning, setShowFunctionalCookieWarning] = useState(false)
  const [pendingSlotNumber, setPendingSlotNumber] = useState<number | null>(null)
  
  // 슬롯 복사 모달
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<{slot: number, name: string}[]>([])
  
  // 불러오기 모달 탭 상태
  const [loadModalTab, setLoadModalTab] = useState<'slots' | 'text'>('slots')
  const [importText, setImportText] = useState('')
  
  // 내보내기 모달
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportText, setExportText] = useState('')

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
    return hasCalculatorSlotData(calculatorId, slot)
  }

  // 슬롯에서 데이터 로드
  const loadSlotData = (slotNumber: number): any => {
    return loadCalculatorSlot(calculatorId, slotNumber)
  }

  // 슬롯에 데이터 저장
  const saveSlotData = (slotNumber: number, data: any, slotName?: string): boolean => {
    if (!canUseFunctionalCookies()) {
      setShowFunctionalCookieWarning(true)
      return false
    }

    const slotData = {
      ...data,
      slotName: slotName || slotNames[slotNumber]
    }

    if (saveCalculatorSlot(calculatorId, slotNumber, slotData)) {
      
      // 슬롯 이름 업데이트
      if (slotName && slotName !== slotNames[slotNumber]) {
        setSlotNames(prev => ({ ...prev, [slotNumber]: slotName }))
      }
      
      // 슬롯 데이터 상태 업데이트
      setSlotHasData(prev => ({ ...prev, [slotNumber]: true }))
      
      return true
    }

    onNotification?.('error', '설정 저장에 실패했습니다.')
    return false
  }

  // 슬롯 데이터 삭제
  const deleteSlotData = (slotNumber: number): boolean => {
    if (deleteCalculatorSlot(calculatorId, slotNumber)) {
      setSlotNames(prev => ({ ...prev, [slotNumber]: `슬롯 ${slotNumber}` }))
      setSlotHasData(prev => ({ ...prev, [slotNumber]: false }))
      return true
    }
    return false
  }

  // 현재 설정 저장
  const saveCurrentSlot = (): boolean => {
    const currentData = getCurrentData()
    const success = saveSlotData(currentSlot, currentData, tempSlotName)
    if (success) {
      setLastSavedData(currentData) // 저장된 데이터 업데이트
      setHasDataChanged(false) // 변경사항 없음으로 설정
      onNotification?.('success', `슬롯 ${currentSlot}에 설정이 저장되었습니다.`)
      trackSlotAction('save', calculatorId) // GA 이벤트 트래킹
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

  const openCookieSettings = () => {
    setShowFunctionalCookieWarning(false)
    window.dispatchEvent(new Event(OPEN_DATA_PRIVACY_SETTINGS_EVENT))
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
      trackSlotAction('reset', calculatorId) // GA 이벤트 트래킹
    }
  }

  // 다른 슬롯에서 복사하기
  const handleOpenCopyModal = () => {
    // 현재 슬롯을 제외한 데이터가 있는 슬롯 목록 가져오기
    const slots: {slot: number, name: string}[] = []
    for (let i = 1; i <= maxSlots; i++) {
      if (i !== currentSlot && slotHasData[i]) {
        slots.push({
          slot: i,
          name: slotNames[i] || `슬롯 ${i}`
        })
      }
    }
    setAvailableSlots(slots)
    setShowCopyModal(true)
  }

  // 슬롯 데이터 복사
  const handleCopyFromSlot = (sourceSlot: number) => {
    const confirmMessage = `슬롯 ${sourceSlot}의 데이터를 현재 슬롯으로 복사하시겠습니까?\n현재 슬롯의 기존 데이터는 모두 삭제됩니다.`
    if (confirm(confirmMessage)) {
      const sourceData = loadSlotData(sourceSlot)
      if (sourceData) {
        // 슬롯 이름은 복사하지 않고 데이터만 복사
        const { slotName, ...dataWithoutName } = sourceData

        // 데이터 로드
        setIsLoading(true)
        loadData(dataWithoutName, () => {
          setJustLoaded(true)
          setIsLoading(false)
          // 복사된 데이터를 현재 슬롯에 저장
          const currentData = getCurrentData()
          saveSlotData(currentSlot, currentData, tempSlotName)
          setLastSavedData(currentData)
          setHasDataChanged(false)
        })

        onNotification?.('success', `슬롯 ${sourceSlot}의 데이터를 복사했습니다.`)
        trackSlotAction('load', calculatorId) // GA 이벤트 트래킹
        setShowCopyModal(false)
      } else {
        onNotification?.('error', '슬롯 데이터를 불러올 수 없습니다.')
      }
    }
  }

  // 설정을 텍스트로 내보내기
  const handleExport = () => {
    const currentData = getCurrentData()
    const exportData = {
      calculator: calculatorId,
      slotName: tempSlotName,
      data: currentData,
      version: '1.0' as const,
      exportedAt: new Date().toISOString()
    }

    const exportString = encodeSettingsExport(exportData)
    setExportText(exportString)
    setShowExportModal(true)
    trackSlotAction('export', calculatorId) // GA 이벤트 트래킹
  }

  // 텍스트 설정 불러오기
  const handleImportFromText = () => {
    try {
      const importData = decodeSettingsExport<any>(importText)
      
      // 계산기 타입 검증
      if (importData.calculator !== calculatorId) {
        throw new Error(`이 설정은 다른 계산기(${importData.calculator})용입니다.`)
      }
      
      // 데이터 로드
      const confirmMessage = '불러온 설정으로 현재 슬롯을 덮어씌우시겠습니까?'
      if (confirm(confirmMessage)) {
        setIsLoading(true)
        loadData(importData.data, () => {
          setJustLoaded(true)
          setIsLoading(false)
          // 불러온 데이터를 현재 슬롯에 저장
          const currentData = getCurrentData()
          saveSlotData(currentSlot, currentData, tempSlotName)
          setLastSavedData(currentData)
          setHasDataChanged(false)
        })

        onNotification?.('success', '설정을 성공적으로 불러왔습니다.')
        trackSlotAction('import', calculatorId) // GA 이벤트 트래킹
        setShowCopyModal(false)
        setImportText('')
      }
    } catch (error) {
      onNotification?.('error', error instanceof Error ? error.message : '설정을 불러오는 중 오류가 발생했습니다.')
    }
  }

  // 클립보드에 복사
  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportText).then(() => {
      onNotification?.('success', '설정이 클립보드에 복사되었습니다.')
    }).catch(() => {
      onNotification?.('error', '클립보드 복사에 실패했습니다.')
    })
  }

  // 초기화 - 모든 슬롯의 이름과 데이터 상태 로드
  useEffect(() => {
    if (canUseFunctionalCookies()) {
      const newSlotNames: { [key: number]: string } = {}
      const newSlotHasData: { [key: number]: boolean } = {}

      for (let i = 1; i <= maxSlots; i++) {
        const data = loadCalculatorSlot<any>(calculatorId, i)
        if (data && data.slotName) {
          newSlotNames[i] = data.slotName
        } else {
          newSlotNames[i] = `슬롯 ${i}`
        }
        newSlotHasData[i] = hasCalculatorSlotData(calculatorId, i)
      }

      setSlotNames(newSlotNames)
      setSlotHasData(newSlotHasData)
      setTempSlotName(newSlotNames[1] || '슬롯 1')
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
    const slotData = loadCalculatorSlot<any>(calculatorId, 1)
    if (slotData) {
      // 저장된 데이터가 있으면 로드
      setIsLoading(true)
      loadDataRef.current(slotData, () => {
        setJustLoaded(true)
        setIsLoading(false)
      })
    } else {
      // 저장된 데이터가 없으면 justLoaded 플래그 설정
      setJustLoaded(true)
    }
  }, [calculatorId])

  // 로드 직후에만 lastSavedData 업데이트
  useEffect(() => {
    if (justLoaded) {
      // 로드가 완료되었으면 현재 상태를 저장
      const currentData = getCurrentDataRef.current()
      setLastSavedData(currentData)
      setHasDataChanged(false) // 로드 직후에는 변경사항 없음
      setJustLoaded(false) // 플래그 리셋
    }
  }, [justLoaded])


  // 정기적으로 변경사항 확인 (500ms마다)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        // 로딩 중이 아닐 때만 변경사항 체크
        const currentData = getCurrentDataRef.current()
        let hasChanges = false
        if (lastSavedData) {
          try {
            hasChanges = JSON.stringify(currentData) !== JSON.stringify(lastSavedData)
          } catch {
            hasChanges = false
          }
        }
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
            
            {/* 저장/불러오기/내보내기/초기화 버튼 */}
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
                onClick={handleOpenCopyModal}
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-1"
                title="슬롯 또는 텍스트에서 불러오기"
              >
                <Download className="h-3.5 w-3.5" />
                불러오기
              </button>
              <button
                onClick={handleExport}
                className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors flex items-center gap-1"
                title="현재 설정을 텍스트로 내보내기"
              >
                <Share2 className="h-3.5 w-3.5" />
                내보내기
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
        {Object.values(slotNames).some(name => name && name !== `슬롯 ${1}` && name !== `슬롯 ${2}` && name !== `슬롯 ${3}` && name !== `슬롯 ${4}` && name !== `슬롯 ${5}`) && (
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

      {/* 기능성 쿠키 비활성화 경고 */}
      {showFunctionalCookieWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 flex-shrink-0 text-amber-500" />
              <h3 className="text-lg font-semibold text-gray-900">설정을 저장할 수 없습니다</h3>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-gray-600">
              슬롯에 계산기 설정을 저장하려면 기능성 쿠키를 허용해야 합니다.
              데이터 및 개인정보 설정에서 기능성 저장을 켠 뒤 다시 저장해 주세요.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowFunctionalCookieWarning(false)}
                className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={openCookieSettings}
                className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
              >
                <Settings className="h-4 w-4" />
                데이터 설정 열기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 불러오기 모달 (탭 형태) */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <Download className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">설정 불러오기</h3>
            </div>
            
            {/* 탭 버튼 */}
            <div className="flex border-b mb-4">
              <button
                onClick={() => setLoadModalTab('slots')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  loadModalTab === 'slots'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                다른 슬롯에서
              </button>
              <button
                onClick={() => setLoadModalTab('text')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  loadModalTab === 'text'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                텍스트에서
              </button>
            </div>
            
            {/* 탭 내용 */}
            {loadModalTab === 'slots' ? (
              // 슬롯 복사 탭
              availableSlots.length > 0 ? (
                <>
                  <p className="text-gray-600 mb-4">
                    불러올 슬롯을 선택하세요. 현재 슬롯의 데이터는 덮어씌워집니다.
                  </p>
                  <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                    {availableSlots.map(({ slot, name }) => (
                      <button
                        key={slot}
                        onClick={() => handleCopyFromSlot(slot)}
                        className="w-full p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-400 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">슬롯 {slot}</span>
                          <span className="text-sm text-gray-500">{name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-gray-600 mb-6">
                  불러올 수 있는 슬롯이 없습니다. 다른 슬롯에 먼저 데이터를 저장해주세요.
                </p>
              )
            ) : (
              // 텍스트 불러오기 탭
              <>
                <p className="text-gray-600 mb-4">
                  내보낸 설정 텍스트를 붙여넣으세요.
                </p>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  placeholder="CALC_SETTINGS_V1:..."
                />
              </>
            )}
            
            <div className="mt-4 flex justify-end gap-2">
              {loadModalTab === 'text' && (
                <button
                  onClick={handleImportFromText}
                  disabled={!importText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  불러오기
                </button>
              )}
              <button
                onClick={() => {
                  setShowCopyModal(false)
                  setImportText('')
                  setLoadModalTab('slots')
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 내보내기 모달 */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <Share2 className="w-6 h-6 text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-900">설정 내보내기</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              아래 텍스트를 복사하여 다른 사람과 공유하거나 나중에 불러올 수 있습니다.
            </p>
            
            <div className="relative">
              <textarea
                value={exportText}
                readOnly
                className="w-full h-32 p-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-xs"
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                onClick={copyToClipboard}
                className="absolute top-2 right-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                복사
              </button>
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              <p>📋 &quot;불러오기 → 텍스트에서&quot; 탭에서 이 텍스트를 붙여넣어 설정을 복원할 수 있습니다.</p>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowExportModal(false)
                  setExportText('')
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
