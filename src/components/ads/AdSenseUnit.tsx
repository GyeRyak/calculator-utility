'use client'

import { useAdSense } from '@/hooks/useAdSense'

interface AdSenseUnitProps {
  adSlot?: string
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal'
  adLayout?: string
  fullWidthResponsive?: boolean
  style?: React.CSSProperties
  className?: string
  showLabel?: boolean
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
  const { containerRef, isVisible } = useAdSense()

  return (
    <div className={className}>
      <div
        ref={containerRef}
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
