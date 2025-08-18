import { BreakevenCalculator } from '@/components/calculators/BreakevenCalculator'
import { StructuredData } from '@/components/StructuredData'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '드메템 손익분기 계산기',
  description: '메이플스토리 드롭률/메소 획득량 증가 아이템 구매 손익분기점 계산',
  keywords: '메이플스토리, 드메템, 아드, 메획, 손익분기, 드롭률, 메소 획득량',
  alternates: {
    canonical: 'https://www.maplecalc.com/calculators/breakeven'
  },
  openGraph: {
    title: '드메템 손익분기 계산기',
    description: '메이플스토리 드롭률/메소 획득량 증가 아이템 구매 손익분기점 계산',
    type: 'website',
    url: 'https://www.maplecalc.com/calculators/breakeven'
  },
}

export default function BreakevenCalculatorPage() {
  return (
    <>
      <StructuredData 
        name="드메템 손익분기 계산기"
        description="메이플스토리 드롭률/메소 획득량 증가 아이템 구매 손익분기점 계산"
        url="https://www.maplecalc.com/calculators/breakeven"
        applicationCategory="FinanceApplication"
      />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">드메템 손익분기 계산기</h1>
        <BreakevenCalculator />
      </div>
    </>
  )
}