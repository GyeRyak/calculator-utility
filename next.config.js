/** @type {import('next').NextConfig} */
const nextConfig = {
  // 개발 모드에서는 static export 비활성화
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    trailingSlash: true,
    basePath: '/calculator-utility',
  }),
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig 