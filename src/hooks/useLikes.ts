'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseEnabled } from '@/lib/supabase'
import toast from 'react-hot-toast'

export const useLikes = (postSlug: string) => {
  const [likeCount, setLikeCount] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // localStorage 키
  const localStorageKey = `liked_${postSlug}`

  // 좋아요 수 가져오기
  const fetchLikeCount = useCallback(async () => {
    if (!isSupabaseEnabled || !supabase) {
      setLikeCount(0)
      return
    }

    try {
      const { data, error, count } = await supabase
        .from('likes')
        .select('*', { count: 'exact' })
        .eq('post_slug', postSlug)

      if (error) throw error
      setLikeCount(count || 0)
    } catch (error) {
      console.error('Failed to fetch like count:', error)
      setLikeCount(0)
    }
  }, [postSlug])

  // 초기 로딩
  useEffect(() => {
    const initializeLikes = async () => {
      setIsLoading(true)

      // localStorage에서 좋아요 상태 확인
      const liked = localStorage.getItem(localStorageKey)
      setIsLiked(Boolean(liked))

      // 좋아요 수 가져오기
      await fetchLikeCount()

      setIsLoading(false)
    }

    initializeLikes()
  }, [postSlug, localStorageKey, fetchLikeCount])

  // 좋아요 추가
  const handleLike = useCallback(async () => {
    if (isLiked) {
      toast.error('이미 좋아요를 누르셨습니다')
      return
    }

    if (!isSupabaseEnabled || !supabase) {
      toast.error('좋아요 기능이 비활성화되어 있습니다')
      return
    }

    try {
      // 간단한 fingerprint 생성 (UserAgent 일부)
      const userFingerprint = navigator.userAgent.substring(0, 50)

      const { error } = await supabase
        .from('likes')
        .insert({
          post_slug: postSlug,
          user_fingerprint: userFingerprint
        })

      if (error) {
        // 중복 좋아요 체크 (Supabase에서 에러 발생 시)
        if (error.message?.includes('duplicate') || error.code === '23505') {
          toast.error('이미 좋아요를 누르셨습니다')
          localStorage.setItem(localStorageKey, 'true')
          setIsLiked(true)
          return
        }
        throw error
      }

      // 성공 시 상태 업데이트
      localStorage.setItem(localStorageKey, 'true')
      setIsLiked(true)
      setLikeCount(prev => prev + 1)
      toast.success('좋아요! ❤️')

    } catch (error) {
      console.error('Failed to add like:', error)
      toast.error('좋아요 처리 중 오류가 발생했습니다')
    }
  }, [isLiked, postSlug, localStorageKey])

  return {
    likeCount,
    isLiked,
    isLoading,
    handleLike
  }
}