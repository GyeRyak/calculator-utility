'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

export function useAdSense() {
  const containerRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible || initializedRef.current) return

    try {
      if (window.adsbygoogle) {
        window.adsbygoogle.push({})
        initializedRef.current = true
      }
    } catch (error) {
      console.error('AdSense 광고 로드 실패:', error)
    }
  }, [isVisible])

  return { containerRef, isVisible }
}
