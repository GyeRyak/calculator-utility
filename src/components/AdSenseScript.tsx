'use client'

import Script from 'next/script'

/**
 * AdSense 스크립트 로딩 컴포넌트
 *
 * next/script의 afterInteractive 전략 사용:
 * - 페이지 초기 렌더링 완료 후 스크립트 로드
 * - FCP(First Contentful Paint) 및 LCP(Largest Contentful Paint)에 영향 최소화
 * - 페이지 인터랙티브해진 후 비동기 로드
 */
export function AdSenseScript() {
  return (
    <Script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6146739804286620"
      crossOrigin="anonymous"
      strategy="afterInteractive"
      onLoad={() => {
        console.log('AdSense 스크립트 로드 완료')
      }}
      onError={(e) => {
        console.error('AdSense 스크립트 로드 실패:', e)
      }}
    />
  )
}