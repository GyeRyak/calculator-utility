const GITHUB_OWNER = process.env.NEXT_PUBLIC_GITHUB_OWNER!
const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_REPO!
const GITHUB_API_URL = 'https://api.github.com'

export interface GitHubComment {
  id: number
  body: string
  user: {
    login: string
    avatar_url: string
    html_url: string
  }
  created_at: string
  updated_at: string
  html_url: string
}

export interface GitHubIssue {
  number: number
  title: string
  body: string
  html_url: string
  comments_url: string
}

// Issue 매핑을 위한 localStorage 키
const ISSUE_MAPPING_KEY = 'blog-issue-mapping'

// 포스트 슬러그에 대응하는 Issue 번호 가져오기
export const getIssueNumber = (postSlug: string): number | null => {
  if (typeof window === 'undefined') return null

  const mapping = localStorage.getItem(ISSUE_MAPPING_KEY)
  if (!mapping) return null

  try {
    const parsed = JSON.parse(mapping)
    return parsed[postSlug] || null
  } catch {
    return null
  }
}

// Issue 번호를 localStorage에 저장
export const setIssueNumber = (postSlug: string, issueNumber: number): void => {
  if (typeof window === 'undefined') return

  const mapping = localStorage.getItem(ISSUE_MAPPING_KEY) || '{}'
  try {
    const parsed = JSON.parse(mapping)
    parsed[postSlug] = issueNumber
    localStorage.setItem(ISSUE_MAPPING_KEY, JSON.stringify(parsed))
  } catch {
    localStorage.setItem(ISSUE_MAPPING_KEY, JSON.stringify({ [postSlug]: issueNumber }))
  }
}

// GitHub API로 댓글 목록 가져오기
export const getGitHubComments = async (issueNumber: number): Promise<GitHubComment[]> => {
  try {
    const response = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber}/comments`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'calculator-utility-blog'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error('Failed to fetch GitHub comments:', error)
    return []
  }
}

// GitHub Issue 정보 가져오기
export const getGitHubIssue = async (issueNumber: number): Promise<GitHubIssue | null> => {
  try {
    const response = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'calculator-utility-blog'
        }
      }
    )

    if (!response.ok) {
      return null
    }

    return response.json()
  } catch (error) {
    console.error('Failed to fetch GitHub issue:', error)
    return null
  }
}

// GitHub에서 댓글 작성하기 위한 URL 생성
export const getGitHubCommentUrl = (issueNumber: number): string => {
  return `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber}#new_comment_field`
}

// 새 Issue 생성을 위한 URL 생성
export const getCreateIssueUrl = (postSlug: string, postTitle: string, postUrl: string): string => {
  const title = encodeURIComponent(`[Blog Comments] ${postTitle}`)
  const body = encodeURIComponent(`이 Issue는 블로그 포스트 "${postTitle}"의 댓글을 위한 공간입니다.\n\n포스트 링크: ${postUrl}\n\n자유롭게 댓글을 남겨주세요! 💬`)
  const labels = 'blog-comments'

  return `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/new?title=${title}&body=${body}&labels=${labels}`
}