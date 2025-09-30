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
  const containerRef = useRef<HTMLDivElement>(null)
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

  // 광고 차단 감지 및 컨테이너 숨김
  useEffect(() => {
    if (!isLoaded || !adRef.current || !containerRef.current) return

    const checkAdBlocked = () => {
      const insElement = adRef.current?.querySelector('.adsbygoogle')
      if (!insElement) {
        // ins 요소가 제거되었으면 광고 차단으로 판단
        if (containerRef.current) {
          containerRef.current.style.display = 'none'
        }
      }
    }

    // 광고 로드 시도 후 1초 뒤 체크
    const timer = setTimeout(checkAdBlocked, 1000)
    return () => clearTimeout(timer)
  }, [isLoaded])

  return (
    <div ref={containerRef} className={`my-8 ${className}`}>
      <div
        ref={adRef}
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
            style={{ display: 'block', textAlign: 'center' }}
            data-ad-layout="in-article"
            data-ad-format="fluid"
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