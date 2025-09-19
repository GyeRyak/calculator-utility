import LoungeCalculator from '@/components/calculators/LoungeCalculator'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '휴게실 경험치 최적화 계산기',
  description: '아지트 듀오 휴게실 이벤트의 최적 스킬 투자 전략을 Dynamic Programming으로 계산',
  alternates: {
    canonical: 'https://www.maplecalc.com/calculators/lounge'
  },
  openGraph: {
    title: '휴게실 경험치 최적화 계산기 - 메이플 계산기',
    description: '아지트 듀오 휴게실 이벤트의 최적 스킬 투자 전략을 Dynamic Programming으로 계산',
    type: 'website',
    url: 'https://www.maplecalc.com/calculators/lounge',
    images: [
      {
        url: 'https://www.maplecalc.com/og-image.png',
        width: 1200,
        height: 630,
        alt: '휴게실 경험치 최적화 계산기',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '휴게실 경험치 최적화 계산기 - 메이플 계산기',
    description: '아지트 듀오 휴게실 이벤트의 최적 스킬 투자 전략을 Dynamic Programming으로 계산',
    images: ['https://www.maplecalc.com/og-image.png'],
  },
}

export default function LoungePage() {
  return <LoungeCalculator />
}