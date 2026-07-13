'use client'

import { useState } from 'react'
import { ExternalLink, MessageCircle, RefreshCw, Github, Settings } from 'lucide-react'
import { useGitHubComments } from '@/hooks/useGitHubComments'
import { formatDate } from '@/lib/blog-types'

interface GitHubCommentsProps {
  postSlug: string
  postTitle: string
}

export function GitHubComments({ postSlug, postTitle }: GitHubCommentsProps) {
  const {
    comments,
    isLoading,
    error,
    issueNumber,
    hasIssue,
    commentCount,
    setManualIssueNumber,
    refreshComments,
    getCommentUrl,
    getNewIssueUrl
  } = useGitHubComments(postSlug, postTitle)

  const [showIssueSetup, setShowIssueSetup] = useState(false)
  const [manualIssueNumber, setManualIssueNumberInput] = useState('')

  const handleManualSetup = () => {
    const issueNum = parseInt(manualIssueNumber, 10)
    if (issueNum && issueNum > 0) {
      setManualIssueNumber(issueNum)
      setShowIssueSetup(false)
      setManualIssueNumberInput('')
    }
  }

  // Issue가 없는 경우
  if (!hasIssue) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="text-center space-y-4">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-semibold text-gray-700">아직 댓글 Issue가 생성되지 않았습니다</h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            이 포스트의 댓글을 활성화하려면 GitHub에서 Issue를 생성해주세요.
            생성 후 Issue 번호를 입력하여 연결할 수 있습니다.
          </p>

          <div className="flex flex-col gap-3 items-center">
            {/* GitHub Issue 생성 버튼 */}
            <a
              href={getNewIssueUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Github className="w-4 h-4" />
              GitHub에서 Issue 생성하기
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* 수동 설정 버튼 */}
            <button
              onClick={() => setShowIssueSetup(!showIssueSetup)}
              className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
            >
              <Settings className="w-4 h-4" />
              Issue 번호 직접 입력
            </button>

            {/* 수동 입력 폼 */}
            {showIssueSetup && (
              <div className="mt-4 p-4 bg-white rounded-lg border space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  GitHub Issue 번호
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={manualIssueNumber}
                    onChange={(e) => setManualIssueNumberInput(e.target.value)}
                    placeholder="예: 123"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleManualSetup}
                    disabled={!manualIssueNumber}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    연결
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  GitHub에서 Issue를 생성한 후 해당 Issue의 번호를 입력해주세요.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          공개 댓글 {commentCount > 0 && `(${commentCount})`}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshComments}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 에러 상태 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* 댓글 작성 버튼 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-800 mb-3">
          GitHub 계정으로 투명하게 댓글을 남겨보세요!
        </p>
        <a
          href={getCommentUrl() || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Github className="w-4 h-4" />
          GitHub에서 댓글 작성하기
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* 댓글 목록 */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              {/* 사용자 아바타 */}
              <img
                src={comment.user.avatar_url}
                alt={comment.user.login}
                className="w-10 h-10 rounded-full"
              />

              {/* 댓글 내용 */}
              <div className="flex-1 space-y-2">
                {/* 사용자 정보 */}
                <div className="flex items-center gap-2 text-sm">
                  <a
                    href={comment.user.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-600 hover:text-blue-800"
                  >
                    {comment.user.login}
                  </a>
                  <span className="text-gray-500">•</span>
                  <time className="text-gray-500">
                    {formatDate(comment.created_at)}
                  </time>
                  {comment.created_at !== comment.updated_at && (
                    <span className="text-gray-400 text-xs">(수정됨)</span>
                  )}
                </div>

                {/* 댓글 본문 */}
                <div className="prose prose-sm max-w-none">
                  <div
                    className="whitespace-pre-wrap text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: comment.body.replace(/\n/g, '<br>')
                    }}
                  />
                </div>

                {/* GitHub 링크 */}
                <a
                  href={comment.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  <ExternalLink className="w-3 h-3" />
                  GitHub에서 보기
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p>아직 댓글이 없습니다.</p>
          <p className="text-sm">첫 댓글을 남겨보세요!</p>
        </div>
      )}

      {/* Issue 정보 */}
      {issueNumber && (
        <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
          <p>
            이 댓글들은{' '}
            <a
              href={`https://github.com/${process.env.NEXT_PUBLIC_GITHUB_OWNER}/${process.env.NEXT_PUBLIC_GITHUB_REPO}/issues/${issueNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              GitHub Issue #{issueNumber}
            </a>
            에서 관리됩니다.
          </p>
        </div>
      )}
    </div>
  )
}