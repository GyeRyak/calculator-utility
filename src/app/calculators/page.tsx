import { CalculatorGrid } from '@/components/CalculatorGrid'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '모든 메이플 계산기 | 사냥, 손익분기, 보스',
  description: '사냥 기댓값 계산기, 드메템 손익분기 계산기, 보스 물욕템 계산기 등 메이플스토리에 필요한 모든 계산기들을 모아보세요.',
  keywords: '메이플스토리, 계산기, 모음, 사냥, 손익분기, 보스, 드롭률, 메획, 기댓값, maple, calculator',
  alternates: {
    canonical: 'https://www.maplecalc.com/calculators'
  },
  openGraph: {
    title: '모든 메이플 계산기 | 메이플 계산기',
    description: '사냥 기댓값 계산기, 드메템 손익분기 계산기, 보스 물욕템 계산기 등 메이플스토리에 필요한 모든 계산기들을 모아보세요.',
    type: 'website',
    url: 'https://www.maplecalc.com/calculators'
  },
  twitter: {
    card: 'summary',
    title: '모든 메이플 계산기 | 메이플 계산기',
    description: '사냥 기댓값 계산기, 드메템 손익분기 계산기, 보스 물욕템 계산기 등 메이플스토리에 필요한 모든 계산기들을 모아보세요.'
  }
}

export default function CalculatorsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">계산기 목록</h1>
      <CalculatorGrid />
    </div>
  )
}