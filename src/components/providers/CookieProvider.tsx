'use client'

import { useState, useEffect, useCallback } from 'react'
import CookieConsent from '@/components/ui/CookieConsent'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import {
  COOKIE_CONSENT_CHANGE_EVENT,
  clearAnalyticsCookies,
  getCookieConsent,
  type CookieConsent as CookieConsentType,
} from '@/utils/cookies'

interface CookieProviderProps {
  children: React.ReactNode
}

export function CookieProvider({ children }: CookieProviderProps) {
  const [consent, setConsent] = useState<CookieConsentType | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const existingConsent = getCookieConsent()
    setConsent(existingConsent)
    if (!existingConsent?.analytics) clearAnalyticsCookies()

    const handleConsentChange = (event: Event) => {
      setConsent((event as CustomEvent<CookieConsentType>).detail)
    }
    window.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, handleConsentChange)
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGE_EVENT, handleConsentChange)
  }, [])

  const handleConsentChange = useCallback((newConsent: CookieConsentType) => {
    setConsent(newConsent)
  }, [])

  useEffect(() => {
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: consent?.analytics ? 'granted' : 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      })
    }
  }, [consent?.analytics])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <>
      {consent?.analytics && <GoogleAnalytics />}
      {children}
      <CookieConsent onConsentChange={handleConsentChange} />
    </>
  )
}

export default CookieProvider
