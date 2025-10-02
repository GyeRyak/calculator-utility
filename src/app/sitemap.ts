import { MetadataRoute } from 'next'
import { getAllBlogSlugs } from '@/lib/blog'
import { readdirSync, statSync } from 'fs'
import { join } from 'path'

// app/calculators 디렉토리에서 모든 계산기 경로 자동 탐색
function getAllCalculatorPaths(): string[] {
  const calculatorsDir = join(process.cwd(), 'src', 'app', 'calculators')

  try {
    const entries = readdirSync(calculatorsDir)

    return entries.filter(entry => {
      const fullPath = join(calculatorsDir, entry)
      const isDirectory = statSync(fullPath).isDirectory()

      // 디렉토리이고 page.tsx 또는 page.ts 파일이 있는지 확인
      if (isDirectory) {
        try {
          const dirContents = readdirSync(fullPath)
          return dirContents.some(file => file === 'page.tsx' || file === 'page.ts')
        } catch {
          return false
        }
      }
      return false
    })
  } catch (error) {
    console.error('Failed to read calculators directory:', error)
    return []
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://www.maplecalc.com'
    : 'http://localhost:3000'

  // 정적 페이지들
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/calculators`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ]

  // 계산기 페이지들 자동 탐색
  const calculatorPaths = getAllCalculatorPaths()
  const calculatorPages = calculatorPaths.map(path => ({
    url: `${baseUrl}/calculators/${path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  // 블로그 포스트 페이지들
  const blogSlugs = getAllBlogSlugs()
  const blogPages = blogSlugs.map(({ slug }) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...calculatorPages, ...blogPages]
}