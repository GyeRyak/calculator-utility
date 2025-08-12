import { BasicCalculator } from '@/components/calculators/BasicCalculator'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '사냥 기댓값 계산기',
  description: '아이템 드롭률과 메소 획득량을 고려한 사냥 기댓값 계산기',
  openGraph: {
    title: '사냥 기댓값 계산기',
    description: '아이템 드롭률과 메소 획득량을 고려한 사냥 기댓값 계산기',
    type: 'website',
  },
}

export default function BasicCalculatorPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">사냥 기댓값 계산기</h1>
      <BasicCalculator />
    </div>
  )
} 