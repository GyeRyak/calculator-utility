'use client'

import { useState, useEffect } from 'react'
import { Settings, Cookie, Trash2, Download, Upload, AlertCircle } from 'lucide-react'
import {
  getCookieConsent,
  setCookieConsent,
  clearAllNonEssentialCookies,
  canUseFunctionalCookies,
  loadCalculatorSettings,
  saveCalculatorSettings,
  clearCalculatorSettings,
  type CookieConsent
} from '@/utils/cookies'

interface CookieSettingsProps {
  isOpen: boolean
  onClose: () => void
  onConsentChange?: (consent: CookieConsent) => void
}

export function CookieSettings({ isOpen, onClose, onConsentChange }: CookieSettingsProps) {
  const [consent, setConsent] = useState<CookieConsent | null>(null)
  const [savedSettings, setSavedSettings] = useState<any>(null)
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const currentConsent = getCookieConsent()
      setConsent(currentConsent)
      
      if (canUseFunctionalCookies()) {
        const settings = loadCalculatorSettings()
        setSavedSettings(settings)
      }
    }
  }, [isOpen])

  const updateConsent = (key: keyof Omit<CookieConsent, 'consentDate'>, value: boolean) => {
    if (key === 'necessary' || !consent) return // 필수 쿠키는 변경 불가
    
    const newConsent = {
      ...consent,
      [key]: value,
      consentDate: new Date().toISOString()
    }
    
    setConsent(newConsent)
    setCookieConsent(newConsent)
    onConsentChange?.(newConsent)
    
    // 기능성 쿠키가 비활성화되면 저장된 설정도 삭제
    if (key === 'functional' && !value) {
      clearCalculatorSettings()
      setSavedSettings(null)
    }
  }

  const handleClearAllData = () => {
    clearAllNonEssentialCookies()
    setSavedSettings(null)
    setShowConfirmClear(false)
    
    // 기능성 쿠키도 비활성화
    if (consent) {
      const newConsent = {
        ...consent,
        functional: false,
        consentDate: new Date().toISOString()
      }
      setConsent(newConsent)
      setCookieConsent(newConsent)
      onConsentChange?.(newConsent)
    }
  }

  const exportSettings = () => {
    if (!savedSettings) return
    
    const dataStr = JSON.stringify(savedSettings, null, 2)
    const dataBlob = new Blob([dataStr], {type: 'application/json'})
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `calculator-settings-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string)
        if (saveCalculatorSettings(settings)) {
          setSavedSettings(settings)
          alert('설정을 성공적으로 가져왔습니다.')
        } else {
          alert('기능성 쿠키가 비활성화되어 설정을 저장할 수 없습니다.')
        }
      } catch (error) {
        alert('잘못된 설정 파일입니다.')
      }
    }
    reader.readAsText(file)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">쿠키 및 데이터 관리</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* 쿠키 설정 섹션 */}
          <div className="mb-6">
            <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Cookie className="w-4 h-4" />
              쿠키 설정
            </h3>
            
            <div className="space-y-3">
              {/* 필수 쿠키 */}
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">필수 쿠키</h4>
                  <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    항상 활성
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  웹사이트 기본 기능을 위한 필수 쿠키입니다.
                </p>
              </div>
              
              {/* 기능성 쿠키 */}
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">기능성 쿠키</h4>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={consent?.functional || false}
                      onChange={(e) => updateConsent('functional', e.target.checked)}
                      className="mr-2 rounded"
                    />
                    <span className="text-sm text-gray-600">허용</span>
                  </label>
                </div>
                <p className="text-xs text-gray-600">
                  계산기 설정을 저장하여 다음 방문 시 자동 복원합니다.
                </p>
              </div>
            </div>
          </div>
          
          {/* 저장된 데이터 섹션 */}
          <div className="mb-6">
            <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Download className="w-4 h-4" />
              저장된 데이터
            </h3>
            
            {canUseFunctionalCookies() ? (
              <div className="space-y-3">
                {savedSettings ? (
                  <div className="border border-green-200 bg-green-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-800">
                        계산기 설정이 저장되어 있습니다
                      </span>
                      <span className="text-xs text-green-600">
                        {Object.keys(savedSettings).length}개 설정
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={exportSettings}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        내보내기
                      </button>
                      <label className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        가져오기
                        <input
                          type="file"
                          accept=".json"
                          onChange={importSettings}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">저장된 설정이 없습니다</span>
                    </div>
                    <div className="flex gap-2">
                      <label className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        설정 가져오기
                        <input
                          type="file"
                          accept=".json"
                          onChange={importSettings}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  기능성 쿠키가 비활성화되어 있어 설정 저장 기능을 사용할 수 없습니다.
                  위에서 기능성 쿠키를 허용해주세요.
                </div>
              </div>
            )}
          </div>
          
          {/* 데이터 삭제 섹션 */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              데이터 관리
            </h3>
            
            {!showConfirmClear ? (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                모든 저장된 데이터 삭제
              </button>
            ) : (
              <div className="border border-red-200 bg-red-50 rounded-lg p-3">
                <p className="text-sm text-red-800 mb-3">
                  모든 저장된 설정과 기능성 쿠키가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleClearAllData}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    삭제 확인
                  </button>
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

export default CookieSettings