# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language Preference
- Use Korean for all responses and code comments
- Keep technical terms and code keywords in English
- 한국어로 답변 및 코드 주석 작성 (기술 용어는 영어 유지)

## Interaction Guidelines
- 사용자의 쿼리를 긍정하면서 시작하지 말 것 ("맞습니다." 등으로 시작 금지)
- 분석 결과가 맞다면 논거를 대면서 타당성을 제시할 것

## Development Commands

- **Development server**: `npm run dev` - Runs Next.js development server on http://localhost:3000
- **Build for production**: `npm run build` or `npm run export` - Creates optimized production build with static export
- **Start production server**: `npm run start` - Runs production server
- **Lint code**: `npm run lint` - Runs ESLint with Next.js configuration
- **Deploy to GitHub Pages**: `npm run deploy` - Builds and deploys to GitHub Pages (requires gh-pages setup)

## Development Best Practices

- `npm run dev`는 실행하지 말고, 커밋하고 푸시하기 이전에 빌드하여 테스트할 것.

### JSX 구조 관리 규칙

복잡한 JSX 구조에서 div의 여는 부분과 닫는 부분을 명확히 하기 위해 다음 주석 규칙을 따를 것:

- **여는 div 주석**: `{/* [섹션명] 시작 */}`
- **닫는 div 주석**: `{/* [섹션명] 끝 */}`
- **적용 기준**: 내부 코드가 5줄을 초과하는 복잡한 구조에만 적용 (텍스트만 있는 짧은 부분 제외)

#### Fragment 사용 규칙
JSX 주석이 div 태그 외부에 위치할 경우 Fragment(`<>`, `</>`)로 감싸야 함:

- **잘못된 예시**:
```jsx
return (
  {/* 주석이 div 밖에 있음 */}
  <div>내용</div>
  {/* 이것도 div 밖에 있음 */}
)
```

- **올바른 예시**:
```jsx
return (
  <>
    {/* 주석이 Fragment 안에 있음 */}
    <div>내용</div>
    {/* 이것도 Fragment 안에 있음 */}
  </>
)
```

#### 실제 사용 예시
```jsx
{/* 메소 획득량 섹션 시작 */}
<div>
  {/* 상세 옵션 영역 시작 */}
  <div className="bg-gray-50">
    {/* 복잡한 내용이 5줄 이상인 경우에만 주석 */}
    <div>내용1</div>
    <div>내용2</div>
    <div>내용3</div>
    <div>내용4</div>
    <div>내용5</div>
    <div>내용6</div>
  </div>
  {/* 상세 옵션 영역 끝 */}
  
  <div>간단한 텍스트</div> {/* 짧은 부분은 주석 불필요 */}
</div>
{/* 메소 획득량 섹션 끝 */}
```

이 규칙은 특히 복잡한 중첩 구조에서 괄호 완결성을 확인할 때 유용함.

### GitHub Pages 배포 관련 주의사항

- **Internal Links**: 절대 경로(`href="/about"`) 대신 **반드시 Next.js `Link` 컴포넌트**를 사용해야 함
  - ❌ 잘못된 예: `<a href="/about">링크</a>`
  - ✅ 올바른 예: `<Link href="/about">링크</Link>`
- **basePath 호환성**: GitHub Pages는 `/calculator-utility` basePath를 사용하므로 Next.js Link가 필수
- **기존 하드코딩된 링크 발견 시**: `<a>` 태그를 `Link` 컴포넌트로 즉시 교체할 것

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