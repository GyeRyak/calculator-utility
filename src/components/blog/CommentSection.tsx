'use client'

import { useState } from 'react'
import { MessageCircle, Heart } from 'lucide-react'
import { LikeButton } from './LikeButton'
import { GitHubComments } from './GitHubComments'
import { PrivateFeedback } from './PrivateFeedback'
import { useGitHubComments } from '@/hooks/useGitHubComments'

interface CommentSectionProps {
  postSlug: string
  postTitle: string
}

type TabType = 'comments' | 'feedback'

export function CommentSection({ postSlug, postTitle }: CommentSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('comments')
  const { getCommentUrl } = useGitHubComments(postSlug, postTitle)

  return (
    <div className="mt-16 pt-8 border-t border-gray-200">
      {/* 좋아요 섹션 */}
      <div className="mb-8">
        <LikeButton postSlug={postSlug} />
      </div>

      {/* 댓글/피드백 섹션 */}
      <div className="space-y-6">
        {/* 탭 헤더 */}
        <div className="flex items-center border-b border-gray-200">
          <button
            onClick={() => setActiveTab('comments')}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === 'comments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <MessageCircle className="w-4 h-4" />
            댓글 보기
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === 'feedback'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <Heart className="w-4 h-4" />
            의견 남기기
          </button>
        </div>

        {/* 탭 내용 */}
        <div className="min-h-[400px]">
          {activeTab === 'comments' ? (
            <div className="space-y-6">
              <div className="text-sm text-gray-600 bg-blue-50 rounded-lg p-4">
                <p className="mb-2">
                  <strong>💬 공개 댓글 시스템</strong>
                </p>
                <p>
                  GitHub 계정으로 투명하게 댓글을 남기고 소통할 수 있습니다.
                  모든 댓글은 GitHub Issues에서 관리되어 투명하고 안전합니다.
                </p>
              </div>

              <GitHubComments
                postSlug={postSlug}
                postTitle={postTitle}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-sm text-gray-600 bg-orange-50 rounded-lg p-4">
                <p className="mb-2">
                  <strong>💝 의견 전달</strong>
                </p>
                <p>
                  공개적으로 댓글을 남기거나, 관리자에게만 비공개로 의견을 전달할 수 있습니다.
                  비공개 의견은 작성 후 확인할 수 없으니 참고해주세요.
                </p>
              </div>

              <PrivateFeedback
                postSlug={postSlug}
                gitHubCommentUrl={getCommentUrl()}
              />
            </div>
          )}
        </div>
      </div>

      {/* 하단 안내 */}
      <div className="mt-12 pt-6 border-t border-gray-100">
        <div className="text-xs text-gray-500 space-y-2">
          <p className="flex items-center gap-2">
            <MessageCircle className="w-3 h-3" />
            <strong>댓글:</strong> GitHub 계정으로 공개 댓글 작성 (모든 사람이 볼 수 있음)
          </p>
          <p className="flex items-center gap-2">
            <Heart className="w-3 h-3" />
            <strong>의견 전달:</strong> 공개 댓글 또는 관리자에게만 전달되는 비공개 의견
          </p>
        </div>
      </div>
    </div>
  )
}