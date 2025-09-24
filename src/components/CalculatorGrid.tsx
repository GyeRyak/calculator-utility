import Link from 'next/link'
import { Calculator, Settings, Plus, Wrench, Cog, Zap, TrendingUp, Crown, Coffee, Sparkles } from 'lucide-react'

const calculatorCategories = [
  {
    id: 'hunting-expectation',
    title: '사냥 기댓값 계산기',
    description: '아이템 드롭률과 메소 획득량을 고려한 사냥 기댓값 계산',
    icon: Calculator,
    href: '/calculators/basic',
    color: 'bg-blue-500',
    available: true
  },
  {
    id: 'breakeven',
    title: '손익분기 계산기',
    description: '아드/메획 증가 아이템 구매 시 투자 회수 기간 계산',
    icon: TrendingUp,
    href: '/calculators/breakeven',
    color: 'bg-green-500',
    available: true
  },
  {
    id: 'boss-chase',
    title: '보스 물욕템 계산기',
    description: '보스 물욕템의 드롭 기댓값을 계산하여 주간/월간 수익 분석',
    icon: Crown,
    href: '/calculators/boss-chase',
    color: 'bg-purple-500',
    available: true
  },
  {
    id: 'lounge-optimizer',
    title: '휴게실 경험치 최적화 계산기',
    description: '아지트 듀오 휴게실 이벤트의 최적 스킬 투자 전략 계산',
    icon: Coffee,
    href: '/calculators/lounge',
    color: 'bg-orange-500',
    available: true
  },
  {
    id: 'origami-event',
    title: '록 스타 돌의 정령! 확률 계산기',
    description: '알파벳 색종이 이벤트 달성 확률 계산 - 보유 자산과 구매 계획에 따른 성공 확률 분석',
    icon: Sparkles,
    href: '/calculators/origami',
    color: 'bg-pink-500',
    available: true
  },
  {
    id: 'calculator6',
    title: '계산기 6',
    description: '개발 예정',
    icon: Zap,
    href: null,
    color: 'bg-indigo-500',
    available: false
  }
]

export function CalculatorGrid() {
  return (
    <div className="py-8">
      <h2 className="text-3xl font-bold text-center mb-8">계산기 종류</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {calculatorCategories.map((category) => {
          const IconComponent = category.icon
          
          if (category.available && category.href) {
            // 활성화된 계산기
            return (
              <Link key={category.id} href={category.href}>
                <div className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center mb-4">
                    <div className={`${category.color} p-3 rounded-lg mr-4`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold">{category.title}</h3>
                  </div>
                  <p className="text-gray-600">{category.description}</p>
                </div>
              </Link>
            )
          } else {
            // 비활성화된 계산기
            return (
              <div key={category.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6 opacity-60 cursor-not-allowed">
                <div className="flex items-center mb-4">
                  <div className={`${category.color} opacity-50 p-3 rounded-lg mr-4`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-500">{category.title}</h3>
                </div>
                <p className="text-gray-400">{category.description}</p>
                <div className="mt-3">
                  <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                    🚧 개발 예정
                  </span>
                </div>
              </div>
            )
          }
        })}
      </div>
    </div>
  )
} 