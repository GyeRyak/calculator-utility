'use client'

import { AdSenseUnit } from './AdSenseUnit'

interface AdSenseBannerProps {
  adSlot: string
  className?: string
}

/**
 * 배너형 광고 컴포넌트
 * 메인 페이지 등에서 가로로 긴 배너 형태로 표시
 *
 * 권장 사용처:
 * - 메인 페이지 Hero 섹션 아래
 * - 페이지 상단/하단
 */
export function AdSenseBanner({ adSlot, className = '' }: AdSenseBannerProps) {
  return (
    <div className={`my-8 ${className}`}>
      <AdSenseUnit
        adSlot={adSlot}
        adFormat="horizontal"
        fullWidthResponsive={true}
        showLabel={true}
        style={{
          minHeight: '90px', // 배너 표준 높이
          maxHeight: '250px'
        }}
        className="shadow-sm"
      />
    </div>
  )
}