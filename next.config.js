/** @type {import('next').NextConfig} */

// GitHub Actions 워크플로우에서 전달된 BASE_PATH를 사용합니다.
// 이 값이 없으면(로컬 개발 등) 빈 문자열이 사용됩니다.
const basePath = process.env.BASE_PATH || '';

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // basePath는 후행 슬래시가 없어야 합니다.
  basePath: basePath,
  // assetPrefix는 basePath가 있을 경우 후행 슬래시를 추가해야 합니다.
  assetPrefix: basePath ? `${basePath}/` : '',
}

module.exports = nextConfig 