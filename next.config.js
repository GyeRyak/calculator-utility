/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: process.env.NODE_ENV === 'production' ? '/calculator-utility' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/calculator-utility/' : '',
}

module.exports = nextConfig 