import { BasicCalculator } from '@/components/calculators/BasicCalculator'
import { StructuredData } from '@/components/StructuredData'
import { AdSenseUnit } from '@/components/ads/AdSenseUnit'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '메이플 사냥 기댓값 계산기',
  description: '메이플스토리 사냥 시 시간당 메소 수익과 솔 에르다 조각 등 드롭 아이템 가치 기댓값 계산',
  keywords: '메이플스토리, 사냥, 기댓값, 메소, 드롭률, 아이템 드롭, 시간당 수익, 솔 에르다 조각, 코어 젬스톤, 심볼',
  alternates: {
    canonical: 'https://www.maplecalc.com/calculators/basic'
  },
  openGraph: {
    title: '메이플 사냥 기댓값 계산기',
    description: '메이플스토리 사냥 시 시간당 메소 수익과 솔 에르다 조각 등 드롭 아이템 가치 기댓값 계산',
    type: 'website',
    url: 'https://www.maplecalc.com/calculators/basic'
  },
}

export default function BasicCalculatorPage() {
  return (
    <>
      <StructuredData
        name="메이플 사냥 기댓값 계산기"
        description="메이플스토리 사냥 시 시간당 메소 수익과 솔 에르다 조각 등 드롭 아이템 가치 기댓값 계산"
        url="https://www.maplecalc.com/calculators/basic"
        applicationCategory="UtilitiesApplication"
      />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">메이플 사냥 기댓값 계산기</h1>
        <BasicCalculator />

        {/* 광고: 계산기 아래, 푸터 위 */}
        <div className="mt-12">
          <AdSenseUnit adSlot="4143962086" />
        </div>
      </div>
    </>
  )
} 