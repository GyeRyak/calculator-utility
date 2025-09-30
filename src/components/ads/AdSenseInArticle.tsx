'use client'

import { useEffect, useRef, useState } from 'react'

interface AdSenseInArticleProps {
  adSlot: string
  className?: string
}

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

/**
 * 인피드/본문형 광고 컴포넌트
 * 블로그 글이나 콘텐츠 사이에 자연스럽게 삽입
 *
 * 권장 사용처:
 * - 블로그 본문 중간
 * - 목차 아래
 * - 댓글 섹션 위
 */
export function AdSenseInArticle({ adSlot, className = '' }: AdSenseInArticleProps) {
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
        className="ad-container"
        style={{
          minHeight: '200px',
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
            data-ad-format="horizontal"
            data-ad-client="ca-pub-6146739804286620"
            data-ad-slot={adSlot}
            data-full-width-responsive="true"
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