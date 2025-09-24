import type { Metadata } from 'next'
import { getAllBlogPosts } from '@/lib/blog'
import { BlogPostList } from '@/components/blog/BlogPostList'

export const metadata: Metadata = {
  title: '블로그 | 메이플 계산기',
  description: '메이플 계산기 개발 과정과 기술적 인사이트를 공유합니다.',
  keywords: ['블로그', '계산기', '개발'],
  openGraph: {
    title: '블로그 | 메이플 계산기',
    description: '메이플 계산기 개발 과정과 기술적 인사이트를 공유합니다.',
    type: 'website',
  },
}

export default function BlogPage() {
  const posts = getAllBlogPosts()

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 헤더 섹션 */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">블로그</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          메이플 계산기 개발 과정에서의 기술적 인사이트와 알고리즘 분석을 공유합니다.
        </p>
      </header>

      {/* 블로그 포스트 목록 */}
      <BlogPostList posts={posts} />
    </div>
  )
}