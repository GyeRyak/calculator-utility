import LoungeCalculator from '@/features/events/lounge/components/LoungeCalculator'
import { AdSenseUnit } from '@/components/ads/AdSenseUnit'
import type { Metadata } from 'next'

const title = '메이플스토리 아지트 듀오 휴게실 경험치 최적화 계산기 | 메이플 계산기'
const description = '메이플스토리 아지트 듀오 휴게실 이벤트의 주차별 포인트, 남은 시간과 스킬 레벨을 반영해 Dynamic Programming으로 경험치가 최대가 되는 투자 순서와 효율을 계산합니다.'

export const metadata: Metadata = {
  title,
  description,
  keywords: ['메이플스토리', '아지트 이벤트', '아지트 듀오', '아지트 휴게실', '휴게실 최적화', '메이플 아지트', '장기 휴식', '역동적 휴식', '간식 충전', '경험치 최적화', '스킬 투자', '휴게실 경험치', '휴게실 스킬트리', '스킬트리 최적화', '메이플 스킬', '휴게실 계산기', '아지트 계산기', '경험치 계산', '메이플 이벤트'],
  alternates: {
    canonical: 'https://www.maplecalc.com/calculators/lounge'
  },
  openGraph: {
    title,
    description,
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
    title,
    description,
    images: ['https://www.maplecalc.com/og-image.png'],
  },
}

export default function LoungePage() {
  return (
    <>
      <LoungeCalculator />

      {/* 광고: 계산기 아래, 푸터 위 */}
      <div className="max-w-6xl mx-auto mt-12 px-4">
        <AdSenseUnit adSlot="1517798748" />
      </div>
    </>
  )
}
