import { BasicCalculator } from '@/components/calculators/BasicCalculator'

export default function BasicCalculatorPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">드랍/메소 획득 손익분기 계산기</h1>
      <BasicCalculator />
    </div>
  )
} 