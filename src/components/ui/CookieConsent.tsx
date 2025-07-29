'use client'

import { useState, useEffect } from 'react'
import { X, Cookie, Settings } from 'lucide-react'
import { 
  getCookieConsent, 
  setCookieConsent, 
  DEFAULT_COOKIE_CONSENT,
  type CookieConsent as CookieConsentType 
} from '@/utils/cookies'

interface CookieConsentProps {
  onConsentChange?: (consent: CookieConsentType) => void
}

export function CookieConsent({ onConsentChange }: CookieConsentProps) {
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [consent, setConsent] = useState<CookieConsentType>(DEFAULT_COOKIE_CONSENT)

  useEffect(() => {
    // 기존 동의 정보 확인
    const existingConsent = getCookieConsent()
    if (!existingConsent) {
      setShowBanner(true)
    } else {
      setConsent(existingConsent)
      onConsentChange?.(existingConsent)
    }
  }, [onConsentChange])

  const handleAcceptAll = () => {
    const newConsent: CookieConsentType = {
      necessary: true,
      functional: true,
      analytics: false,
      marketing: false,
      consentDate: new Date().toISOString()
    }
    
    setCookieConsent(newConsent)
    setConsent(newConsent)
    setShowBanner(false)
    setShowDetails(false)
    onConsentChange?.(newConsent)
  }

  const handleAcceptNecessary = () => {
    const newConsent: CookieConsentType = {
      ...DEFAULT_COOKIE_CONSENT,
      consentDate: new Date().toISOString()
    }
    
    setCookieConsent(newConsent)
    setConsent(newConsent)
    setShowBanner(false)
    setShowDetails(false)
    onConsentChange?.(newConsent)
  }

  const handleCustomConsent = () => {
    const newConsent: CookieConsentType = {
      ...consent,
      consentDate: new Date().toISOString()
    }
    
    setCookieConsent(newConsent)
    setConsent(newConsent)
    setShowBanner(false)
    setShowDetails(false)
    onConsentChange?.(newConsent)
  }

  const updateConsent = (key: keyof Omit<CookieConsentType, 'consentDate'>, value: boolean) => {
    if (key === 'necessary') return // 필수 쿠키는 변경 불가
    
    setConsent(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (!showBanner) return null

  return (
    <>
      {/* 배경 오버레이 */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      )}
      
      {/* 쿠키 동의 배너 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-7xl mx-auto p-4">
          {!showDetails ? (
            // 간단한 배너
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Cookie className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">쿠키 사용 동의</h3>
                  <p className="text-sm text-gray-600">
                    이 사이트는 기능성 쿠키를 사용하여 계산기 설정을 저장합니다. 
                    동의하시면 다음 방문 시 설정이 자동으로 복원됩니다.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowDetails(true)}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  상세 설정
                </button>
                <button
                  onClick={handleAcceptNecessary}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  필수만 허용
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  모두 허용
                </button>
              </div>
            </div>
          ) : (
            // 상세 설정
            <div className="bg-white rounded-lg max-w-2xl mx-auto">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">쿠키 설정</h2>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                <div className="text-sm text-gray-600 mb-4">
                  쿠키는 웹사이트가 귀하의 브라우저에 저장하는 작은 텍스트 파일입니다. 
                  계산기의 설정을 저장하고 다음 방문 시 복원하는 데 사용됩니다.
                </div>
                
                {/* 필수 쿠키 */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">필수 쿠키</h3>
                    <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      항상 활성
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    웹사이트의 기본 기능을 위해 필요한 쿠키입니다. 이 쿠키들은 비활성화할 수 없습니다.
                  </p>
                </div>
                
                {/* 기능성 쿠키 */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">기능성 쿠키</h3>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={consent.functional}
                        onChange={(e) => updateConsent('functional', e.target.checked)}
                        className="mr-2 rounded"
                      />
                      <span className="text-sm text-gray-600">허용</span>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600">
                    계산기 설정 (몹 레벨, 메소 획득량, 아이템 드롭률 등)을 저장하여 
                    다음 방문 시 자동으로 복원합니다. 이 쿠키 없이는 설정 저장 기능을 사용할 수 없습니다.
                  </p>
                </div>
                
                {/* 분석 쿠키 (현재 사용 안함) */}
                <div className="border border-gray-200 rounded-lg p-4 opacity-60">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">분석 쿠키</h3>
                    <div className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      사용 안함
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    현재 이 사이트에서는 분석 쿠키를 사용하지 않습니다.
                  </p>
                </div>
                
                {/* 마케팅 쿠키 (현재 사용 안함) */}
                <div className="border border-gray-200 rounded-lg p-4 opacity-60">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">마케팅 쿠키</h3>
                    <div className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      사용 안함
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    현재 이 사이트에서는 마케팅 쿠키를 사용하지 않습니다.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleCustomConsent}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  설정 저장
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default CookieConsent