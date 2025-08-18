import { CalculatorGrid } from '@/components/CalculatorGrid'
import { Hero } from '@/components/Hero'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '메이플 계산기',
  description: '메이플스토리 사냥, 보스, 드롭률 계산기',
  alternates: {
    canonical: 'https://www.maplecalc.com'
  },
  openGraph: {
    title: '메이플 계산기',
    description: '메이플스토리 사냥, 보스, 드롭률 계산기',
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