'use client'

import { useEffect, useRef, useState } from 'react'

interface AdSenseMultiplexProps {
  adSlot: string
  className?: string
}

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

/**
 * 멀티플렉스 광고 컴포넌트
 * 여러 광고가 자동으로 배치되는 형태
 *
 * 권장 사용처:
 * - 계산기 페이지 하단
 * - 콘텐츠 목록 아래
 */
export function AdSenseMultiplex({ adSlot, className = '' }: AdSenseMultiplexProps) {
  const adRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Intersection Observer로 뷰포트 진입 감지
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true)
          }
        })
      },
      {
        rootMargin: '200px'
      }
    )

    if (adRef.current) {
      observer.observe(adRef.current)
    }

    return () => {
      if (adRef.current) {
        observer.unobserve(adRef.current)
      }
    }
  }, [isVisible])

  // 광고 초기화
  useEffect(() => {
    if (isVisible && !isLoaded) {
      try {
        if (typeof window !== 'undefined' && window.adsbygoogle) {
          ;(window.adsbygoogle = window.adsbygoogle || []).push({})
          setIsLoaded(true)
        }
      } catch (error) {
        console.error('AdSense 광고 로드 실패:', error)
      }
    }
  }, [isVisible, isLoaded])

  return (
    <div className={`my-8 ${className}`}>
      <div
        ref={adRef}
        className="multiplex-container"
        style={{
          minHeight: '250px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {!isVisible && (
          <div className="text-sm text-gray-400">광고 로딩 중...</div>
        )}

        {isVisible && (
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-format="autorelaxed"
            data-ad-client="ca-pub-6146739804286620"
            data-ad-slot={adSlot}
          />
        )}

        <div
          style={{
            position: 'absolute',
            bottom: '4px',
            right: '8px',
            fontSize: '10px',
            color: '#9ca3af',
            backgroundColor: 'rgba(249, 250, 251, 0.8)',
            padding: '2px 6px',
            borderRadius: '4px',
            pointerEvents: 'none'
          }}
        >
          Advertisement
        </div>
      </div>
    </div>
  )
}