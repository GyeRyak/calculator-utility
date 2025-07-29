import { CalculatorGrid } from '@/components/CalculatorGrid'

export default function CalculatorsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">계산기 목록</h1>
      <CalculatorGrid />
    </div>
  )
}