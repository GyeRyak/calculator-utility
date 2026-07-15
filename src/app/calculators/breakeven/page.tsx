import { BreakevenCalculator } from '@/features/hunting/components/BreakevenCalculator'
import { StructuredData } from '@/components/StructuredData'
import { AdSenseUnit } from '@/components/ads/AdSenseUnit'
import type { Metadata } from 'next'

const title = '메이플스토리 드메템 투자 회수·손익분기 계산기 | 메이플 계산기'
const description = '드롭률·메소 획득량 잠재능력 아이템의 구매가와 판매가, 사냥 수익, 재물 획득의 비약과 메소 제한을 반영해 투자금 회수 기간과 손익분기 소재 수를 계산합니다.'

export const metadata: Metadata = {
  title,
  description,
  keywords: '메이플스토리, 드메템, 아드, 메획, 손익분기, 드롭률, 메소 획득량',
  alternates: {
    canonical: 'https://www.maplecalc.com/calculators/breakeven'
  },
  openGraph: {
    title,
    description,
    type: 'website',
    url: 'https://www.maplecalc.com/calculators/breakeven'
  },
}

export default function BreakevenCalculatorPage() {
  return (
    <>
      <StructuredData
        name="드메템 손익분기 계산기"
        description={description}
        url="https://www.maplecalc.com/calculators/breakeven"
        applicationCategory="FinanceApplication"
      />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">드메템 손익분기 계산기</h1>
        <BreakevenCalculator />

        {/* 광고: 계산기 아래, 푸터 위 */}
        <div className="mt-12">
          <AdSenseUnit adSlot="4171882243" />
        </div>
      </div>
    </>
  )
}
