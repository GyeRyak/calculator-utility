import { Metadata } from 'next'
import BossChaseCalculator from '@/components/calculators/BossChaseCalculator'
import { StructuredData } from '@/components/StructuredData'
import { AdSenseUnit } from '@/components/ads/AdSenseUnit'

export const metadata: Metadata = {
  title: '보스 물욕템 계산기 | 메이플 계산기',
  description: '메이플스토리 보스 물욕템 드롭 기댓값을 계산합니다. 칠흑, 여명, 광휘 보스 세트와 반지 상자, 연마석 등의 주간/월간 기댓값을 분석할 수 있습니다.',
  keywords: '메이플스토리, 보스, 물욕템, 칠흑, 여명, 광휘, 반지상자, 연마석, 드롭률, 기댓값',
  alternates: {
    canonical: 'https://www.maplecalc.com/calculators/boss-chase'
  },
  openGraph: {
    title: '보스 물욕템 계산기 | 메이플 계산기',
    description: '메이플스토리 보스 물욕템 드롭 기댓값을 계산합니다. 칠흑, 여명, 광휘 보스 세트와 반지 상자, 연마석 등의 주간/월간 기댓값을 분석할 수 있습니다.',
    url: 'https://www.maplecalc.com/calculators/boss-chase',
    siteName: '메이플 계산기',
    type: 'website'
  },
  twitter: {
    card: 'summary',
    title: '보스 물욕템 계산기 | 메이플 계산기',
    description: '메이플스토리 보스 물욕템 드롭 기댓값을 계산합니다.'
  }
}

export default function BossChasePage() {
  return (
    <>
      <StructuredData
        name="보스 물욕템 계산기"
        description="메이플스토리 보스 물욕템 드롭 기댓값을 계산합니다. 칠흑, 여명, 광휘 보스 세트와 반지 상자, 연마석 등의 주간/월간 기댓값을 분석할 수 있습니다."
        url="https://www.maplecalc.com/calculators/boss-chase"
        applicationCategory="UtilitiesApplication"
      />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              보스 물욕템 계산기
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              보스 물욕템의 드롭 기댓값을 계산합니다. 캐릭터별 보스 클리어 리스트를 등록하고
              주간/월간 기댓값을 확인하세요.
            </p>
          </div>

          <BossChaseCalculator />

          {/* 광고: 계산기 아래, 푸터 위 */}
          <div className="mt-12">
            <AdSenseUnit adSlot="2830880416" />
          </div>
        </div>
      </div>
    </>
  )
}