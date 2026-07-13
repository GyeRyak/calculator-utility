'use client'

import { useAdSense } from '@/hooks/useAdSense'

interface AdSenseMultiplexProps {
  adSlot: string
  className?: string
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
  const { containerRef, isVisible } = useAdSense()

  return (
    <div className={`my-8 ${className}`}>
      <div
        ref={containerRef}
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
