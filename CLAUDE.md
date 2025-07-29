# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language Preference
- Use Korean for all responses and code comments
- Keep technical terms and code keywords in English
- 한국어로 답변 및 코드 주석 작성 (기술 용어는 영어 유지)

## Development Commands

- **Development server**: `npm run dev` - Runs Next.js development server on http://localhost:3000
- **Build for production**: `npm run build` or `npm run export` - Creates optimized production build with static export
- **Start production server**: `npm run start` - Runs production server
- **Lint code**: `npm run lint` - Runs ESLint with Next.js configuration
- **Deploy to GitHub Pages**: `npm run deploy` - Builds and deploys to GitHub Pages (requires gh-pages setup)

## Architecture Overview

This is a Next.js 14 application using App Router for building calculator utilities. Key architectural patterns:

### Project Structure
- **App Router**: All pages are in `src/app/` using the Next.js App Router pattern
- **Component Organization**: 
  - `src/components/layout/` - Layout components like Navbar
  - `src/components/calculators/` - Calculator-specific components
  - `src/components/ui/` - Reusable UI components
- **Utilities**: `src/utils/` contains calculation logic separated from components
- **Static Export**: Configured for static hosting on GitHub Pages with `output: 'export'`

### Key Technical Details
- **TypeScript**: Strict mode enabled with path aliases (`@/*` maps to `./src/*`)
- **Styling**: Tailwind CSS for all styling
- **Icons**: Lucide React for icon components
- **Deployment**: Static export optimized for GitHub Pages with dynamic base path support via `BASE_PATH` environment variable
- **Korean Language**: The app is primarily in Korean (calculator utilities for Korean gaming community)

### Current Features
- Drop/Meso acquisition break-even calculator (`src/utils/dropCalculations.ts`)
- Responsive design optimized for both mobile and desktop
- All calculations performed client-side for privacy

### Important Configuration
- **next.config.js**: Configured for static export with dynamic base path for GitHub Pages deployment
- **No Testing Framework**: The project doesn't include tests currently
- **ESLint**: Configured with Next.js and TypeScript rules