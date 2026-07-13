'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getIssueNumber,
  setIssueNumber,
  getGitHubComments,
  getGitHubCommentUrl,
  getCreateIssueUrl,
  type GitHubComment
} from '@/lib/github'

export const useGitHubComments = (postSlug: string, postTitle: string) => {
  const [comments, setComments] = useState<GitHubComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [issueNumber, setIssueNumberState] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 댓글 불러오기
  const fetchComments = useCallback(async (issueNum: number) => {
    try {
      setError(null)
      const commentsData = await getGitHubComments(issueNum)
      setComments(commentsData)
    } catch (err) {
      console.error('Failed to fetch comments:', err)
      setError('댓글을 불러오는 중 오류가 발생했습니다')
      setComments([])
    }
  }, [])

  // 초기화
  useEffect(() => {
    const initializeComments = async () => {
      setIsLoading(true)

      // 기존 Issue 번호 확인
      const existingIssueNumber = getIssueNumber(postSlug)

      if (existingIssueNumber) {
        setIssueNumberState(existingIssueNumber)
        await fetchComments(existingIssueNumber)
      } else {
        // Issue가 없으면 빈 상태로 유지
        setComments([])
      }

      setIsLoading(false)
    }

    initializeComments()
  }, [postSlug, fetchComments])

  // Issue 번호 수동 설정 (관리자가 Issue 생성 후 호출)
  const setManualIssueNumber = useCallback(async (issueNum: number) => {
    setIssueNumber(postSlug, issueNum)
    setIssueNumberState(issueNum)
    await fetchComments(issueNum)
  }, [postSlug, fetchComments])

  // 댓글 새로고침
  const refreshComments = useCallback(async () => {
    if (issueNumber) {
      await fetchComments(issueNumber)
    }
  }, [issueNumber, fetchComments])

  // GitHub에서 댓글 작성하기 위한 URL
  const getCommentUrl = useCallback(() => {
    if (issueNumber) {
      return getGitHubCommentUrl(issueNumber)
    }
    return null
  }, [issueNumber])

  // 새 Issue 생성 URL
  const getNewIssueUrl = useCallback(() => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : ''
    return getCreateIssueUrl(postSlug, postTitle, currentUrl)
  }, [postSlug, postTitle])

  return {
    comments,
    isLoading,
    error,
    issueNumber,
    hasIssue: Boolean(issueNumber),
    commentCount: comments.length,
    setManualIssueNumber,
    refreshComments,
    getCommentUrl,
    getNewIssueUrl
  }
}