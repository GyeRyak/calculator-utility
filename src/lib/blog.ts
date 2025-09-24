import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'
import rehypeStringify from 'rehype-stringify'
import 'katex/dist/katex.min.css'

const postsDirectory = path.join(process.cwd(), 'src/content/blog')

import { BlogPost, BlogPostMeta } from './blog-types'

// 모든 블로그 포스트 메타데이터 가져오기
export function getAllBlogPosts(): BlogPostMeta[] {
  const fileNames = fs.readdirSync(postsDirectory)
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '')
      const fullPath = path.join(postsDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const matterResult = matter(fileContents)

      return {
        slug,
        title: matterResult.data.title || '',
        date: matterResult.data.date || '',
        description: matterResult.data.description || '',
        tags: matterResult.data.tags || [],
        readingTime: calculateReadingTime(matterResult.content),
      }
    })

  // 날짜순 정렬 (최신순)
  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1))
}

// 모든 슬러그 가져오기 (정적 생성용)
export function getAllBlogSlugs() {
  const fileNames = fs.readdirSync(postsDirectory)
  return fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => ({
      slug: fileName.replace(/\.md$/, ''),
    }))
}

// 특정 블로그 포스트 가져오기
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const matterResult = matter(fileContents)

    // 마크다운을 HTML로 변환
    const processedContent = await remark()
      .use(remarkGfm)
      .use(remarkMath)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeKatex, {
        strict: 'warn',
        throwOnError: false,
        trust: true,
        displayMode: false
      })
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(matterResult.content)

    const contentHtml = processedContent.toString()

    return {
      slug,
      title: matterResult.data.title || '',
      date: matterResult.data.date || '',
      description: matterResult.data.description || '',
      tags: matterResult.data.tags || [],
      readingTime: calculateReadingTime(matterResult.content),
      content: contentHtml,
    }
  } catch (error) {
    console.error(`Error loading blog post ${slug}:`, error)
    return null
  }
}

// blog-types.ts에서 import
export { formatDate } from './blog-types'

// 읽는 시간 계산 (한국어 기준 분당 2000자)
export function calculateReadingTime(content: string): string {
  const wordsPerMinute = 2000
  const wordCount = content.length
  const minutes = Math.ceil(wordCount / wordsPerMinute)
  return `${minutes}분 읽기`
}

// 목차 생성 (서버 사이드용 - 필요시 사용)
export function generateTableOfContents(content: string): { id: string; text: string; level: number }[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const toc: { id: string; text: string; level: number }[] = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-가-힣]/g, '')
      .replace(/\s+/g, '-')

    toc.push({ id, text, level })
  }

  return toc
}