import { CalculatorGrid } from '@/components/CalculatorGrid'
import { Hero } from '@/components/Hero'
import { AdSenseBanner } from '@/components/ads/AdSenseBanner'
import type { Metadata } from 'next'

const title = '메이플 계산기'
const description = '메이플스토리 사냥, 보스, 아이템 드롭률과 메소 획득량 계산기'

export const metadata: Metadata = {
  title,
  description,
  keywords: ['메이플스토리', '메이플', '계산기', '사냥 기댓값', '드롭률', '메소 획득량', '손익분기', '보스 물욕템'],
  alternates: {
    canonical: 'https://www.maplecalc.com'
  },
  openGraph: {
    title,
    description,
    type: 'website',
    url: 'https://www.maplecalc.com'
  },
}

export default function HomePage() {
  return (
    <div className="space-y-8">
      <Hero />

      {/* 광고: Hero 아래, 계산기 그리드 위 */}
      <AdSenseBanner adSlot="1483700226" />

      <CalculatorGrid />
    </div>
  )
}
