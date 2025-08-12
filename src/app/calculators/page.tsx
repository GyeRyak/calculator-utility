import { CalculatorGrid } from '@/components/CalculatorGrid'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '계산기 목록',
  description: '다양한 사냥 및 게임 관련 계산 도구 모음',
  openGraph: {
    title: '계산기 목록',
    description: '다양한 사냥 및 게임 관련 계산 도구 모음',
    type: 'website',
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