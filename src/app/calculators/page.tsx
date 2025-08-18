import { CalculatorGrid } from '@/components/CalculatorGrid'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '계산기 목록',
  description: '메이플스토리 사냥, 보스, 드롭률 계산기 모음',
  alternates: {
    canonical: 'https://www.maplecalc.com/calculators'
  },
  openGraph: {
    title: '계산기 목록 - 메이플 계산기',
    description: '메이플스토리 사냥, 보스, 드롭률 계산기 모음',
    type: 'website',
    url: 'https://www.maplecalc.com/calculators'
  },
}

export default function CalculatorsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">계산기 목록</h1>
      <CalculatorGrid />
    </div>
  )
}