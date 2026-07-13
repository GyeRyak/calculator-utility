'use client'

import { Heart } from 'lucide-react'
import { useLikes } from '@/hooks/useLikes'

interface LikeButtonProps {
  postSlug: string
}

export function LikeButton({ postSlug }: LikeButtonProps) {
  const { likeCount, isLiked, isLoading, handleLike } = useLikes(postSlug)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
        <span className="text-sm">로딩 중...</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleLike}
      disabled={isLiked}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
        ${isLiked
          ? 'bg-red-50 text-red-600 cursor-not-allowed'
          : 'bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:scale-105'
        }
      `}
    >
      <Heart
        className={`w-5 h-5 transition-all duration-200 ${
          isLiked ? 'fill-current text-red-500' : ''
        }`}
      />
      <span className="text-sm font-medium">
        {isLiked ? '좋아요 완료!' : '좋아요'}
        {likeCount > 0 && ` (${likeCount})`}
      </span>
    </button>
  )
}