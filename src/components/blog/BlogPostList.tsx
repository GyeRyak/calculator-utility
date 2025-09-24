import { BlogPostMeta } from '@/lib/blog-types'
import { BlogPostCard } from './BlogPostCard'

interface BlogPostListProps {
  posts: BlogPostMeta[]
}

export function BlogPostList({ posts }: BlogPostListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">아직 블로그 포스트가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <BlogPostCard key={post.slug} post={post} />
      ))}
    </div>
  )
}