import { CalculatorGrid } from '@/components/CalculatorGrid'
import { Hero } from '@/components/Hero'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '메이플 계산기',
  description: '메이플스토리 사냥, 보스, 드롭률, 아지트 듀오 휴게실 이벤트 최적화 계산기',
  keywords: ['메이플스토리', '메이플', '계산기', '사냥 기댓값', '드롭률', '메소 획득량', '손익분기', '보스 물욕템', '아지트 이벤트', '아지트 듀오', '아지트 휴게실', '휴게실 최적화', '메이플 아지트'],
  alternates: {
    canonical: 'https://www.maplecalc.com'
  },
  openGraph: {
    title: '메이플 계산기',
    description: '메이플스토리 사냥, 보스, 드롭률, 아지트 듀오 휴게실 이벤트 최적화 계산기',
    type: 'website',
    url: 'https://www.maplecalc.com'
  },
}

export default function HomePage() {
  return (
    <div className="space-y-8">
      <Hero />
      <CalculatorGrid />
    </div>
  )
} 