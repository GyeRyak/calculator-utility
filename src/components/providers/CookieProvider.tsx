'use client'

import { useState, useEffect, useCallback } from 'react'
import CookieConsent from '@/components/ui/CookieConsent'
import { getCookieConsent, type CookieConsent as CookieConsentType } from '@/utils/cookies'

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
  }, [])

  const handleConsentChange = useCallback((newConsent: CookieConsentType) => {
    setConsent(newConsent)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <>
      {children}
      <CookieConsent onConsentChange={handleConsentChange} />
    </>
  )
}

export default CookieProvider