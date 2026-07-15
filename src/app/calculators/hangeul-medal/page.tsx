import type { Metadata } from 'next';
import HangeulTitleCalculator from '@/features/events/hangeul-medal/components/HangeulTitleCalculator';
import { StructuredData } from '@/components/StructuredData';
import { AdSenseUnit } from '@/components/ads/AdSenseUnit';

const title = '메이플스토리 한글날 훈장 조합·재설정 비용 계산기 | 메이플 계산기';
const description = '메이플스토리 한글날 훈장 이벤트에서 원하는 세 단어 조합을 검색·지정하고, 슬롯 잠금 상태에 따른 한글의 기운 재설정 비용과 달성 확률 분포·백분위를 계산합니다.';

export const metadata: Metadata = {
  title,
  description,
  keywords: '메이플스토리, 단풍이야기, 한글날, 훈장, 재설정, 한글의 기운, 확률 계산, 시뮬레이터, 시뮬레이션, 무작위 생성, 랜덤 생성, 훈장 조합, 훈장 뽑기',
  alternates: {
    canonical: 'https://www.maplecalc.com/calculators/hangeul-medal'
  },
  openGraph: {
    title,
    description,
    type: 'website',
    url: 'https://www.maplecalc.com/calculators/hangeul-medal',
    images: [
      {
        url: 'https://www.maplecalc.com/og-image.png',
        width: 1200,
        height: 630,
        alt: '한글날 훈장 이벤트 계산기',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['https://www.maplecalc.com/og-image.png'],
  },
};

export default function HangeulTitlePage() {
  return (
    <>
      <StructuredData
        name="한글날 훈장 행사 계산기"
        description={description}
        url="https://www.maplecalc.com/calculators/hangeul-medal"
        applicationCategory="UtilitiesApplication"
      />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <HangeulTitleCalculator />

          {/* 광고: 계산기 아래, 푸터 위 */}
          <div className="mt-12">
            <AdSenseUnit adSlot="5346197262" />
          </div>
        </div>
      </main>
    </>
  );
}
