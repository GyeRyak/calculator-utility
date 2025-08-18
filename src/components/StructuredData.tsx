interface StructuredDataProps {
  name: string
  description: string
  url: string
  applicationCategory: 'FinanceApplication' | 'UtilitiesApplication'
}

export function StructuredData({ name, description, url, applicationCategory }: StructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description,
    url,
    applicationCategory,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW'
    },
    operatingSystem: 'Web Browser',
    browserRequirements: 'JavaScript enabled',
    applicationSubCategory: 'Calculator',
    featureList: [
      '실시간 계산',
      '설정 저장 및 불러오기',
      '결과 공유'
    ],
    inLanguage: 'ko-KR',
    isAccessibleForFree: true
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}