import { CalculatorGrid } from '@/components/CalculatorGrid'
import { Hero } from '@/components/Hero'

export default function HomePage() {
  return (
    <div className="space-y-8">
      <Hero />
      <CalculatorGrid />
    </div>
  )
} 