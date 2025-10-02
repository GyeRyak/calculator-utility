import type { Metadata } from 'next';
import HangeulTitleCalculator from '@/components/calculators/HangeulTitleCalculator';
import { StructuredData } from '@/components/StructuredData';
import { AdSenseUnit } from '@/components/ads/AdSenseUnit';

export const metadata: Metadata = {
  title: '한글날 훈장 행사 계산기 | 단풍 계산기',
  description: '메이플스토리 한글날 훈장 시뮬레이터 및 계산기 - 훈장 조합을 무작위로 생성하거나 검색을 통해 지정할 수 있고, 재설정 비용의 확률 분포를 계산합니다.',
  keywords: '메이플스토리, 단풍이야기, 한글날, 훈장, 재설정, 한글의 기운, 확률 계산, 시뮬레이터, 시뮬레이션, 무작위 생성, 랜덤 생성, 훈장 조합, 훈장 뽑기',
  alternates: {
    canonical: 'https://www.maplecalc.com/calculators/hangeul-medal'
  },
  openGraph: {
    title: '한글날 훈장 행사 시뮬레이터 및 계산기 | 메이플 계산기',
    description: '한글날 훈장 조합을 무작위로 생성하거나 검색하여 지정하고, 재설정 비용의 확률 분포를 계산하는 시뮬레이터',
    type: 'website',
    url: 'https://www.maplecalc.com/calculators/hangeul-medal',
    images: [
      {
        url: 'https://www.maplecalc.com/og-image.png',
        width: 1200,
        height: 630,
        alt: '한글날 훈장 행사 계산기',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '한글날 훈장 행사 시뮬레이터 및 계산기 - 메이플 계산기',
    description: '훈장 조합을 무작위로 생성하거나 검색하여 지정하고, 재설정 비용의 확률 분포를 계산합니다.',
    images: ['https://www.maplecalc.com/og-image.png'],
  },
};

export default function HangeulTitlePage() {
  return (
    <>
      <StructuredData
        name="한글날 훈장 행사 계산기"
        description="메이플스토리 한글날 훈장 시뮬레이터 및 계산기 - 훈장 조합을 무작위로 생성하거나 검색을 통해 지정할 수 있고, 재설정 비용의 확률 분포를 계산합니다."
        url="https://www.maplecalc.com/calculators/hangeul-medal"
        applicationCategory="UtilitiesApplication"
      />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <HangeulTitleCalculator />

          {/* 광고: 계산기 아래, 푸터 위 */}
          <div className="mt-12">
            <AdSenseUnit adSlot="2796781897" />
          </div>
        </div>
      </main>
    </>
  );
}