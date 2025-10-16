import Link from 'next/link'
import { Calculator, Settings, Plus, Wrench, Cog, Zap, TrendingUp, Crown, Coffee, Sparkles, Award } from 'lucide-react'

const activeCalculators = [
  {
    id: 'hunting-expectation',
    title: '사냥 기댓값 계산기',
    description: '아이템 드롭률과 메소 획득량을 고려한 사냥 기댓값 계산',
    icon: Calculator,
    href: '/calculators/basic',
    color: 'bg-blue-500',
  },
  {
    id: 'breakeven',
    title: '손익분기 계산기',
    description: '아드/메획 증가 아이템 구매 시 투자 회수 기간 계산',
    icon: TrendingUp,
    href: '/calculators/breakeven',
    color: 'bg-green-500',
  },
  {
    id: 'boss-chase',
    title: '보스 물욕템 계산기',
    description: '보스 물욕템의 드롭 기댓값을 계산하여 주간/월간 수익 분석',
    icon: Crown,
    href: '/calculators/boss-chase',
    color: 'bg-purple-500',
  },
  {
    id: 'lounge-optimizer',
    title: '휴게실 경험치 최적화 계산기',
    description: '아지트 듀오 휴게실 이벤트의 최적 스킬 투자 전략 계산',
    icon: Coffee,
    href: '/calculators/lounge',
    color: 'bg-orange-500',
  },
  {
    id: 'origami-event',
    title: '록 스타 돌의 정령! 확률 계산기',
    description: '알파벳 색종이 이벤트 달성 확률 계산 - 보유 자산과 구매 계획에 따른 성공 확률 분석',
    icon: Sparkles,
    href: '/calculators/origami',
    color: 'bg-pink-500',
  }
]

const endedEventCalculators = [
  {
    id: 'hangeul-medal',
    title: '한글날 훈장 행사 계산기',
    description: '한글날 훈장 행사 재설정 비용 계산 - 원하는 조합 완성까지의 예상 비용과 확률 분포 분석',
    icon: Award,
    href: '/calculators/hangeul-medal',
    color: 'bg-indigo-500',
  }
]

export function CalculatorGrid() {
  return (
    <div className="py-8 space-y-12">
      {/* 활성 계산기 섹션 */}
      <div>
        <h2 className="text-3xl font-bold text-center mb-8">계산기 종류</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeCalculators.map((calculator) => {
            const IconComponent = calculator.icon
            return (
              <Link key={calculator.id} href={calculator.href}>
                <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center mb-4">
                    <div className={`${calculator.color} p-3 rounded-lg mr-4`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold dark:text-gray-100">{calculator.title}</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{calculator.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* 종료된 이벤트 섹션 */}
      {endedEventCalculators.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-500 dark:text-gray-400">
            종료된 이벤트 계산기
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {endedEventCalculators.map((calculator) => {
              const IconComponent = calculator.icon
              return (
                <Link key={calculator.id} href={calculator.href}>
                  <div className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer relative">
                    <div className="flex items-center mb-4">
                      <div className={`${calculator.color} opacity-70 p-3 rounded-lg mr-4`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">{calculator.title}</h3>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">{calculator.description}</p>
                    <div className="mt-3">
                      <span className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                        ⏸️ 종료된 이벤트
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
} 