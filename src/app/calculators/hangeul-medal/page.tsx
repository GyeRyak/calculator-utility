import type { Metadata } from 'next';
import HangeulTitleCalculator from '@/components/calculators/HangeulTitleCalculator';
import { AdSenseUnit } from '@/components/ads/AdSenseUnit';

export const metadata: Metadata = {
  title: '한글날 훈장 행사 계산기 | 단풍 계산기',
  description: '메이플스토리 한글날 훈장 이벤트에서 원하는 훈장 조합을 완성하기 위한 재설정 비용을 계산합니다.',
  keywords: '메이플스토리, 단풍이야기, 한글날, 훈장, 재설정, 한글의 기운, 확률 계산',
  openGraph: {
    title: '한글날 훈장 행사 계산기 | 메이플 계산기',
    description: '한글날 훈장 이벤트 내 훈장 조합 시뮬레이션 및 재설정 비용 확률 분포 계산',
    url: '/calculators/hangeul-medal',
  },
};

export default function HangeulTitlePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <HangeulTitleCalculator />

        {/* 광고: 계산기 아래, 푸터 위 */}
        <div className="mt-12">
          <AdSenseUnit adSlot="2796781897" />
        </div>
      </div>
    </main>
  );
}