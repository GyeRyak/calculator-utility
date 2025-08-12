import { CalculatorGrid } from '@/components/CalculatorGrid'
import { Hero } from '@/components/Hero'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '계산 유틸리티',
  description: '사냥 기댓값 계산기를 포함한 다양한 계산 도구',
  openGraph: {
    title: '계산 유틸리티',
    description: '사냥 기댓값 계산기를 포함한 다양한 계산 도구',
    type: 'website',
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