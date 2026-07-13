'use client'

import { useState, useEffect } from 'react'
import { Cookie } from 'lucide-react'
import { 
  getCookieConsent,
  setCookieConsent,
  COOKIE_CONSENT_CHANGE_EVENT,
  DEFAULT_COOKIE_CONSENT,
  type CookieConsent as CookieConsentType 
} from '@/utils/cookies'

interface CookieConsentProps {
  onConsentChange?: (consent: CookieConsentType) => void
}

export function CookieConsent({ onConsentChange }: CookieConsentProps) {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // 기존 동의 정보 확인
    const existingConsent = getCookieConsent()
    if (!existingConsent) {
      setShowBanner(true)
    } else {
      onConsentChange?.(existingConsent)
    }
  }, [onConsentChange])

  useEffect(() => {
    const hideBannerAfterConsent = () => setShowBanner(false)
    window.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, hideBannerAfterConsent)
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGE_EVENT, hideBannerAfterConsent)
  }, [])

  const handleAcceptAll = () => {
    const newConsent: CookieConsentType = {
      necessary: true,
      functional: true,
      analytics: true,
      detailedAnalytics: true,
      marketing: false,
      consentDate: new Date().toISOString()
    }
    
    setCookieConsent(newConsent)
    setShowBanner(false)
    onConsentChange?.(newConsent)
  }

  const handleAcceptNecessary = () => {
    const newConsent: CookieConsentType = {
      ...DEFAULT_COOKIE_CONSENT,
      consentDate: new Date().toISOString()
    }
    
    setCookieConsent(newConsent)
    setShowBanner(false)
    onConsentChange?.(newConsent)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 p-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-start gap-3">
          <Cookie className="mt-0.5 h-6 w-6 flex-shrink-0 text-blue-600" />
          <div className="flex-1">
            <h3 className="mb-1 font-semibold text-gray-900">데이터 사용 동의</h3>
            <p className="text-sm text-gray-600">
              허용 시 설정 저장과 Google Analytics 기본 통계 및 구간화된 제품 개선 데이터를 사용합니다.
              이름·연락처, 정확한 입력값·결과, 사용자 입력 문자열과 슬롯 내용은 전송하지 않습니다.
            </p>
            <p className="mt-1 text-xs text-gray-500">
              우측 상단 데이터 설정을 통해 언제든지 수정 가능합니다.
            </p>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            onClick={handleAcceptNecessary}
            className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            허용하지 않음
          </button>
          <button
            onClick={handleAcceptAll}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
          >
            모두 허용
          </button>
        </div>
      </div>
    </div>
  )
}

export default CookieConsent
