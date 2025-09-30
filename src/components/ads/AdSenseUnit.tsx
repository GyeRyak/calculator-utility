'use client'

import { useEffect, useRef, useState } from 'react'

interface AdSenseUnitProps {
  adSlot?: string
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal'
  adLayout?: string
  fullWidthResponsive?: boolean
  style?: React.CSSProperties
  className?: string
  showLabel?: boolean
}

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

/**
 * Google AdSense 광고 단위 기본 컴포넌트
 *
 * CLS(Cumulative Layout Shift) 방지를 위해:
 * 1. 광고 컨테이너에 미리 고정된 높이 할당
 * 2. Intersection Observer로 뷰포트 진입 시에만 광고 로드
 * 3. 광고 로드 전 skeleton placeholder 표시
 */
export function AdSenseUnit({
  adSlot,
  adFormat = 'auto',
  adLayout,
  fullWidthResponsive = true,
  style,
  className = '',
  showLabel = true
}: AdSenseUnitProps) {
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
        rootMargin: '200px' // 200px 전에 미리 로드 시작
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

  // 광고 초기화 (뷰포트 진입 시에만)
  useEffect(() => {
    if (isVisible && !isLoaded) {
      try {
        // AdSense 스크립트가 로드되었는지 확인
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
    <div className={className}>
      <style jsx>{`
        .adsense-container:not(:has(.adsbygoogle)) {
          display: none;
        }
      `}</style>
      <div
        ref={adRef}
        className="adsense-container"
        style={{
          minHeight: '250px', // CLS 방지: 최소 높이 확보
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
          ...style
        }}
      >
        {!isVisible && (
          <div className="text-sm text-gray-400">광고 로딩 중...</div>
        )}

        {isVisible && (
          <ins
            className="adsbygoogle"
            style={{
              display: 'block',
              width: '100%',
              height: '100%'
            }}
            data-ad-client="ca-pub-6146739804286620"
            data-ad-slot={adSlot || '2858800572'}
            data-ad-format={adFormat}
            data-ad-layout={adLayout}
            data-full-width-responsive={fullWidthResponsive.toString()}
          />
        )}

        {showLabel && (
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
        )}
      </div>
    </div>
  )
}