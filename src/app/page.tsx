import { CalculatorGrid } from '@/components/CalculatorGrid'
import { Hero } from '@/components/Hero'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '메이플 계산기 | 사냥, 손익분기, 보스 기댓값 계산기',
  description: '메이플스토리 유저를 위한 종합 계산기. 사냥 기댓값, 드메템 손익분기, 보스 물욕템 드롭 기댓값 등 다양한 계산을 웹에서 간편하게 이용하세요.',
  keywords: '메이플스토리, 계산기, 사냥, 손익분기, 보스, 드롭률, 메획, 기댓값, maple, calculator',
  alternates: {
    canonical: 'https://www.maplecalc.com'
  },
  openGraph: {
    title: '메이플 계산기 | 사냥, 손익분기, 보스 기댓값 계산기',
    description: '메이플스토리 유저를 위한 종합 계산기. 사냥 기댓값, 드메템 손익분기, 보스 물욕템 드롭 기댓값 등 다양한 계산을 웹에서 간편하게 이용하세요.',
    type: 'website',
    url: 'https://www.maplecalc.com'
  },
  twitter: {
    card: 'summary',
    title: '메이플 계산기 | 사냥, 손익분기, 보스 기댓값 계산기',
    description: '메이플스토리 유저를 위한 종합 계산기. 사냥 기댓값, 드메템 손익분기, 보스 물욕템 드롭 기댓값 등 다양한 계산을 웹에서 간편하게 이용하세요.'
  }
}

export default function HomePage() {
  return (
    <div className="space-y-8">
      <Hero />
      <CalculatorGrid />
    </div>
  )
} 