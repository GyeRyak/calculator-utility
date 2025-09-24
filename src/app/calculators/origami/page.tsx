import type { Metadata } from 'next';
import OrigamiCalculator from '@/components/calculators/OrigamiCalculator';

export const metadata: Metadata = {
  title: '록 스타 돌의 정령! 계산기 | 메이플 계산기',
  description: '메이플스토리 "록 스타 돌의 정령!" 알파벳 색종이 이벤트에서 효율적으로 목표를 달성하기 위한 최적의 색종이 사용 전략을 제공합니다. 정확한 확률 분포 계산과 백분위 분석으로 필요한 색종이 개수를 정밀하게 예측할 수 있습니다.',
  keywords: '메이플스토리, 록 스타 돌의 정령, 색종이 이벤트, 알파벳 이벤트, 알록달록 색종이, 확률 계산기, 이벤트 계산기',
  openGraph: {
    title: '록 스타 돌의 정령! 계산기 | 메이플 계산기',
    description: '"록 스타 돌의 정령!" 알파벳 색종이 이벤트 최적화 전략 계산기 - 정확한 확률 분포로 필요한 색종이 개수 예측',
    url: '/origami',
  },
};

export default function OrigamiPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            록 스타 돌의 정령!
          </h1>
          <h2 className="text-xl text-gray-700 mb-4">
            알파벳 색종이 이벤트 계산기
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            메이플스토리 &ldquo;록 스타 돌의 정령!&rdquo; 알파벳 색종이 이벤트에서 효율적으로 목표를 달성하기 위한 최적의 색종이 사용 전략을 제공합니다.
            정확한 확률 분포 계산과 백분위 분석으로 필요한 색종이 개수를 정밀하게 예측할 수 있습니다.
          </p>
        </div>

        <OrigamiCalculator />
      </div>
    </main>
  );
}