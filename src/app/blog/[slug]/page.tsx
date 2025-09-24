import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllBlogSlugs, getBlogPost } from '@/lib/blog'
import { BlogPostContent } from '@/components/blog/BlogPostContent'

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

// 정적 경로 생성
export async function generateStaticParams() {
  const slugs = getAllBlogSlugs()
  return slugs
}

// 메타데이터 생성
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await getBlogPost(params.slug)

  if (!post) {
    return {
      title: '포스트를 찾을 수 없음',
    }
  }

  return {
    title: `${post.title} | 메이플 계산기 블로그`,
    description: post.description,
    keywords: post.tags.join(', '),
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      tags: post.tags,
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getBlogPost(params.slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <BlogPostContent post={post} />
    </div>
  )
}