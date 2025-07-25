# NumberInput 컴포넌트

재사용 가능한 숫자 입력 컴포넌트입니다. 스핀 버튼 문제를 해결하고 더 나은 UX를 제공합니다.

## 기능

- ✅ 커스텀 증가/감소 버튼 (-/+)
- ✅ 직접 숫자 입력 가능
- ✅ 범위 제한 (min/max)
- ✅ 키보드 지원 (화살표 키, Enter)
- ✅ 접근성 지원 (aria-labels)
- ✅ 다양한 크기와 스타일 변형
- ✅ TypeScript 완전 지원

## 기본 사용법

```tsx
import NumberInput from '@/components/ui/NumberInput'

function MyComponent() {
  const [value, setValue] = useState(0)

  return (
    <NumberInput
      value={value}
      onChange={setValue}
      min={0}
      max={100}
    />
  )
}
```

## Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | - | **필수** 현재 값 |
| `onChange` | `(value: number) => void` | - | **필수** 값 변경 콜백 |
| `min` | `number` | `0` | 최솟값 |
| `max` | `number` | `Infinity` | 최댓값 |
| `step` | `number` | `1` | 증감 단위 |
| `precision` | `number` | `0` | 소수점 자릿수 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 크기 |
| `variant` | `'default' \| 'outline' \| 'ghost'` | `'default'` | 스타일 변형 |
| `className` | `string` | - | 추가 CSS 클래스 |
| `placeholder` | `string` | - | placeholder 텍스트 |
| `disabled` | `boolean` | `false` | 비활성화 여부 |
| `readOnly` | `boolean` | `false` | 읽기 전용 여부 |
| `hideButtons` | `boolean` | `false` | 버튼 숨김 여부 |
| `selectAllOnFocus` | `boolean` | `false` | 포커스 시 전체 선택 |
| `onInputComplete` | `(value: number) => void` | - | 입력 완료 콜백 |
| `onFocus` | `() => void` | - | 포커스 콜백 |
| `onBlur` | `() => void` | - | blur 콜백 |
| `onKeyDown` | `(e: KeyboardEvent) => void` | - | 키 다운 콜백 |

## 사용 예시

### 기본 예시
```tsx
<NumberInput
  value={count}
  onChange={setCount}
  min={0}
  max={10}
/>
```

### 소수점 지원
```tsx
<NumberInput
  value={price}
  onChange={setPrice}
  min={0}
  step={0.1}
  precision={2}
  placeholder="가격 입력"
/>
```

### 크기 변형
```tsx
{/* 작은 크기 */}
<NumberInput size="sm" value={value} onChange={setValue} className="w-16" />

{/* 중간 크기 (기본) */}
<NumberInput size="md" value={value} onChange={setValue} className="w-24" />

{/* 큰 크기 */}
<NumberInput size="lg" value={value} onChange={setValue} className="w-32" />
```

### 적응형 레이아웃
```tsx
{/* 기본 - 자동으로 너비에 따라 레이아웃 변경 */}
<NumberInput 
  value={value} 
  onChange={setValue} 
  className="w-12" 
/>

{/* 강제 컴팩트 모드 */}
<NumberInput 
  forceCompact 
  value={value} 
  onChange={setValue} 
/>

{/* 강제 일반 모드 */}
<NumberInput 
  forceWide 
  value={value} 
  onChange={setValue} 
/>
```

## 레이아웃 모드

### 일반 모드 (충분한 너비)
```
┌─────────────────────┐
│ [-] [입력필드] [+] │
└─────────────────────┘
```

### 컴팩트 모드 (좁은 너비)
```
┌───────────┐
│ 입력필드  │+│
│          │-│
└───────────┘
```
*더 낮은 높이로 컴팩트하게*

컴팩트 모드는 다음 조건에서 활성화됩니다:
- **자동 감지** (기본): 실제 텍스트 길이 기준으로 공간이 부족할 때
- **강제 모드**: `forceCompact=true` 또는 `forceWide=true`로 설정했을 때

**자동 감지 방식**:
1. 현재 입력값(또는 placeholder)의 실제 텍스트 너비 측정
2. 버튼 2개 너비 + 패딩 + 여유 공간 계산
3. 사용 가능한 텍스트 영역 < 필요한 텍스트 영역이면 컴팩트 모드

**장점**: 고정 임계값 대신 실제 콘텐츠에 따라 동적으로 결정

### 스타일 변형
```tsx
{/* 기본 스타일 */}
<NumberInput variant="default" value={value} onChange={setValue} />

{/* 아웃라인 스타일 */}
<NumberInput variant="outline" value={value} onChange={setValue} />

{/* 고스트 스타일 */}
<NumberInput variant="ghost" value={value} onChange={setValue} />
```

### 버튼 없는 입력
```tsx
<NumberInput
  hideButtons
  value={value}
  onChange={setValue}
  className="text-center"
/>
```

### 접근성 지원
```tsx
<NumberInput
  value={level}
  onChange={setLevel}
  min={1}
  max={30}
  aria-label="캐릭터 레벨"
  aria-describedby="level-description"
/>
```

### 입력 완료 감지
```tsx
<NumberInput
  value={quantity}
  onChange={setQuantity}
  onInputComplete={(finalValue) => {
    console.log('입력 완료:', finalValue)
    // API 호출 등
  }}
/>
```

### 키보드 이벤트 처리
```tsx
<NumberInput
  value={value}
  onChange={setValue}
  onKeyDown={(e) => {
    if (e.key === 'Escape') {
      e.currentTarget.blur()
    }
  }}
/>
```

## 키보드 단축키

- `↑` / `↓`: 값 증가/감소
- `Enter`: 입력 완료 및 포커스 해제
- `Escape`: 포커스 해제 (커스텀 핸들러에서 구현)

## 스타일 커스터마이징

컴포넌트는 Tailwind CSS 클래스를 사용하며, `className` prop을 통해 추가 스타일을 적용할 수 있습니다.

```tsx
<NumberInput
  value={value}
  onChange={setValue}
  className="w-20 font-bold text-blue-600"
  variant="outline"
/>
```

## 접근성

- ARIA 레이블 지원
- 키보드 네비게이션 완전 지원
- 스크린 리더 호환
- 포커스 관리 최적화 