'use client'

import { useState, useEffect } from 'react'
// import { Toaster } from 'react-hot-toast'
import { BlogPost, formatDate } from '@/lib/blog-types'
// import { CommentSection } from './CommentSection'
import { AdSenseInArticle } from '@/components/ads/AdSenseInArticle'

interface BlogPostContentProps {
  post: BlogPost
}

export function BlogPostContent({ post }: BlogPostContentProps) {
  const [toc, setToc] = useState<{ id: string; text: string; level: number }[]>([])

  useEffect(() => {
    // DOM이 렌더링된 후 목차 생성
    const generateTocFromDOM = () => {
      const headings = document.querySelectorAll('.blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4, .blog-content h5, .blog-content h6')
      const tocItems: { id: string; text: string; level: number }[] = []
      const usedIds = new Set<string>()

      headings.forEach((heading, index) => {
        const text = heading.textContent || ''
        const tagName = heading.tagName.toLowerCase()
        const level = parseInt(tagName.charAt(1))
        let id = text
          .toLowerCase()
          .replace(/[^\w\s-가-힣]/g, '')
          .replace(/\s+/g, '-')

        // 중복 ID 처리: 숫자 접미사 추가
        let uniqueId = id
        let counter = 1
        while (usedIds.has(uniqueId)) {
          uniqueId = `${id}-${counter}`
          counter++
        }
        usedIds.add(uniqueId)

        heading.id = uniqueId
        tocItems.push({ id: uniqueId, text, level })
      })

      setToc(tocItems)
    }

    // DOM 업데이트 후 실행
    setTimeout(generateTocFromDOM, 0)
  }, [post.content])

  return (
    <article className="max-w-4xl mx-auto">
      {/* 블로그 헤더 */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <span>{formatDate(post.date)}</span>
          <span>{post.readingTime}</span>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {post.description && (
          <p className="text-lg text-gray-600 leading-relaxed">
            {post.description}
          </p>
        )}
      </header>

      {/* 목차 */}
      {toc.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">목차</h2>
          <nav>
            <ul className="space-y-2">
              {toc.map((item) => (
                <li key={item.id} style={{ marginLeft: `${(item.level - 1) * 1.5}rem` }}>
                  <button
                    className="text-blue-600 hover:text-blue-800 transition-colors text-left"
                    onClick={() => {
                      const element = document.getElementById(item.id)
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        window.history.pushState(null, '', `#${item.id}`)
                      }
                    }}
                  >
                    {item.text}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      {/* 광고 1: 목차 아래 */}
      <AdSenseInArticle adSlot="8083207095" />

      {/* 블로그 본문 */}
      <div
        className="blog-content prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* 광고 2: 댓글창 위 */}
      <AdSenseInArticle adSlot="2511316219" />

      {/* 댓글 및 피드백 섹션 - 임시 비활성화 */}
      {/* <CommentSection postSlug={post.slug} postTitle={post.title} /> */}

      {/* 하단 네비게이션 */}
      <footer className="mt-12 pt-8 border-t border-gray-200">
        <div className="text-center">
          <a
            href="/blog"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← 블로그 목록으로 돌아가기
          </a>
        </div>
      </footer>

      {/* Toast 알림 - 임시 비활성화 */}
      {/* <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      /> */}
    </article>
  )
}