import { BasicCalculator } from '@/features/hunting/components/BasicCalculator'
import { StructuredData } from '@/components/StructuredData'
import { AdSenseUnit } from '@/components/ads/AdSenseUnit'
import type { Metadata } from 'next'

const title = '메이플스토리 사냥 메소·드롭 아이템 기댓값 계산기 | 메이플 계산기'
const description = '캐릭터·몬스터 레벨, 메소 획득량과 아이템 드롭률, 재물 획득의 비약, 솔 에르다 조각과 심볼 가격을 반영해 시간당 사냥 수익과 예상 드롭 수량을 계산합니다.'

export const metadata: Metadata = {
  title,
  description,
  keywords: '메이플스토리, 사냥, 기댓값, 메소, 드롭률, 아이템 드롭, 시간당 수익, 솔 에르다 조각, 코어 젬스톤, 심볼',
  alternates: {
    canonical: 'https://www.maplecalc.com/calculators/basic'
  },
  openGraph: {
    title,
    description,
    type: 'website',
    url: 'https://www.maplecalc.com/calculators/basic'
  },
}

export default function BasicCalculatorPage() {
  return (
    <>
      <StructuredData
        name="메이플 사냥 기댓값 계산기"
        description={description}
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
