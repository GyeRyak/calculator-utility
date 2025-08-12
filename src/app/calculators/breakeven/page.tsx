import { BreakevenCalculator } from '@/components/calculators/BreakevenCalculator'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '아이템 드롭률/메소 획득량 증가 손익분기 계산기',
  description: '아이템 드롭률과 메소 획득량 증가 아이템 구매 시 손익분기점 계산',
  openGraph: {
    title: '아이템 드롭률/메소 획득량 증가 손익분기 계산기',
    description: '아이템 드롭률과 메소 획득량 증가 아이템 구매 시 손익분기점 계산',
    type: 'website',
  },
}

export default function BreakevenCalculatorPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">아이템 드롭률/메소 획득량 증가 손익분기 계산기</h1>
      <BreakevenCalculator />
    </div>
  )
}