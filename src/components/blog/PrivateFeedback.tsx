'use client'

import { useState } from 'react'
import { Send, Lock, Github, ExternalLink } from 'lucide-react'
import { supabase, isSupabaseEnabled } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface PrivateFeedbackProps {
  postSlug: string
  gitHubCommentUrl?: string | null
}

export function PrivateFeedback({ postSlug, gitHubCommentUrl }: PrivateFeedbackProps) {
  const [content, setContent] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast.error('의견을 입력해주세요')
      return
    }

    if (isPrivate) {
      // 비공개 의견 전달
      if (!isSupabaseEnabled || !supabase) {
        toast.error('비공개 의견 전달 기능이 비활성화되어 있습니다')
        return
      }

      setIsSubmitting(true)

      try {
        const { error } = await supabase
          .from('private_feedback')
          .insert({
            post_slug: postSlug,
            content: content.trim()
          })

        if (error) throw error

        toast.success('비공개 의견이 전달되었습니다. 감사합니다! 🙏')
        setContent('')
        setIsPrivate(false)
      } catch (error) {
        console.error('Failed to submit private feedback:', error)
        toast.error('의견 전달 중 오류가 발생했습니다')
      } finally {
        setIsSubmitting(false)
      }
    } else {
      // GitHub 댓글로 이동
      if (gitHubCommentUrl) {
        // 작성 중인 내용을 임시 저장
        localStorage.setItem(`draft_comment_${postSlug}`, content)
        window.open(gitHubCommentUrl, '_blank')
      } else {
        toast.error('GitHub 댓글 기능이 아직 설정되지 않았습니다')
      }
    }
  }

  // 페이지 로드 시 임시 저장된 내용 복구
  useState(() => {
    const draft = localStorage.getItem(`draft_comment_${postSlug}`)
    if (draft) {
      setContent(draft)
      // 복구 후 임시 저장 내용 삭제
      localStorage.removeItem(`draft_comment_${postSlug}`)
    }
  })

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
        <Send className="w-5 h-5" />
        의견 남기기
      </h4>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 내용 입력 */}
        <div>
          <label htmlFor="feedback-content" className="block text-sm font-medium text-gray-700 mb-2">
            {isPrivate ? '비공개 의견' : '공개 댓글 내용'}
          </label>
          <textarea
            id="feedback-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              isPrivate
                ? '관리자에게만 전달될 비공개 의견을 작성해주세요...'
                : 'GitHub에서 게시될 공개 댓글을 작성해주세요...'
            }
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
            disabled={isSubmitting}
          />
          <div className="flex justify-between items-center mt-1">
            <div className="text-xs text-gray-500">
              {content.length}/1000자
            </div>
            {content.length > 1000 && (
              <div className="text-xs text-red-500">
                글자 수를 초과했습니다
              </div>
            )}
          </div>
        </div>

        {/* 공개/비공개 선택 */}
        <div className="space-y-3">
          {/* 공개 댓글 옵션 */}
          <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="comment-type"
              checked={!isPrivate}
              onChange={() => setIsPrivate(false)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-900">공개 댓글 (추천)</span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mt-1">
                GitHub 계정으로 투명하게 댓글을 남깁니다. 모든 사람이 볼 수 있습니다.
              </p>
            </div>
          </label>

          {/* 비공개 의견 옵션 */}
          <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="comment-type"
              checked={isPrivate}
              onChange={() => setIsPrivate(true)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-orange-600" />
                <span className="font-medium text-gray-900">비공개 의견 전달</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                관리자에게만 전달됩니다. <strong>작성 후에는 확인할 수 없습니다.</strong>
              </p>
            </div>
          </label>
        </div>

        {/* 비공개 의견 경고 */}
        {isPrivate && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-orange-600 mt-0.5" />
              <div className="text-sm">
                <p className="text-orange-800 font-medium">비공개 의견 전달 안내</p>
                <ul className="text-orange-700 mt-1 list-disc list-inside space-y-1">
                  <li>작성 후에는 내용을 확인하거나 수정할 수 없습니다</li>
                  <li>관리자에게만 전달되며, 웹사이트에 공개되지 않습니다</li>
                  <li>답변이 필요한 경우 공개 댓글을 이용해주세요</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 제출 버튼 */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !content.trim() || content.length > 1000}
            className={`
              flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors
              ${isPrivate
                ? 'bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50'
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
              }
            `}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                전송 중...
              </>
            ) : isPrivate ? (
              <>
                <Lock className="w-4 h-4" />
                비공개 의견 전달
              </>
            ) : (
              <>
                <Github className="w-4 h-4" />
                GitHub에서 댓글 작성
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* 도움말 */}
      <div className="text-xs text-gray-500 pt-3 border-t border-gray-100">
        <p>
          <strong>공개 댓글:</strong> GitHub 계정이 필요하며, 투명하고 건설적인 소통이 가능합니다.<br />
          <strong>비공개 의견:</strong> 익명으로 피드백만 전달하고 싶을 때 사용해주세요.
        </p>
      </div>
    </div>
  )
}