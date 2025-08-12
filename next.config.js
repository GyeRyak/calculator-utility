/** @type {import('next').NextConfig} */
const nextConfig = {
  // 개발 모드에서는 static export 비활성화
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    trailingSlash: true,
    // 커스텀 도메인 사용으로 basePath 및 assetPrefix 제거
  }),
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig 