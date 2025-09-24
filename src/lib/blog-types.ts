// 블로그 관련 타입 정의 (클라이언트/서버 공용)
export interface BlogPost {
  slug: string
  title: string
  date: string
  description: string
  tags: string[]
  readingTime: string
  content: string
}

export interface BlogPostMeta {
  slug: string
  title: string
  date: string
  description: string
  tags: string[]
  readingTime: string
}

// 날짜를 한국어 형식으로 포맷팅
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  } catch {
    return dateString
  }
}

// calculateReadingTime 함수는 blog.ts로 이동됨 (서버 사이드 전용)