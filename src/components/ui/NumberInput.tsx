'use client'

import { useState, useEffect, forwardRef, useRef, useCallback } from 'react'

// 클래스명 병합 유틸리티 함수
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export interface NumberInputProps {
  /** 현재 값 */
  value: number
  /** 값 변경 콜백 */
  onChange: (value: number) => void
  /** 최솟값 (기본값: 0) */
  min?: number
  /** 최댓값 (기본값: Infinity) */
  max?: number
  /** 증감 단위 (기본값: 1) */
  step?: number
  /** 소수점 자릿수 (기본값: 0) */
  precision?: number
  /** 추가 CSS 클래스 */
  className?: string
  /** placeholder 텍스트 */
  placeholder?: string
  /** 비활성화 여부 */
  disabled?: boolean
  /** 읽기 전용 여부 */
  readOnly?: boolean
  /** 버튼 숨김 여부 */
  hideButtons?: boolean
  /** 크기 변형 */
  size?: 'sm' | 'md' | 'lg'
  /** 스타일 변형 */
  variant?: 'default' | 'outline' | 'ghost'
  /** 포커스 시 모든 텍스트 선택 여부 */
  selectAllOnFocus?: boolean
  /** 입력 완료 시 콜백 (Enter 키 또는 blur) */
  onInputComplete?: (value: number) => void
  /** 포커스 콜백 */
  onFocus?: () => void
  /** blur 콜백 */
  onBlur?: () => void
  /** 키 다운 콜백 */
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  /** 접근성을 위한 aria-label */
  'aria-label'?: string
  /** 접근성을 위한 aria-describedby */
  'aria-describedby'?: string
  /** 강제 컴팩트 모드 (세로 버튼 배치) */
  forceCompact?: boolean
  /** 강제 일반 모드 (가로 버튼 배치) */
  forceWide?: boolean
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  precision = 0,
  className,
  placeholder,
  disabled = false,
  readOnly = false,
  hideButtons = false,
  size = 'md',
  variant = 'default',
  selectAllOnFocus = false,
  onInputComplete,
  onFocus,
  onBlur,
  onKeyDown,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  forceCompact = false,
  forceWide = false,
}, ref) => {
  const [inputValue, setInputValue] = useState(() => formatValue(value, precision))
  const [isFocused, setIsFocused] = useState(false)
  const [shouldUseCompact, setShouldUseCompact] = useState(forceCompact)
  const [previousCompactState, setPreviousCompactState] = useState(forceCompact)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  
  // ref 병합 함수
  const setInputRef = useCallback((node: HTMLInputElement | null) => {
    inputRef.current = node
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      ref.current = node
    }
  }, [ref])

  // 값 포맷팅 함수
  function formatValue(val: number, prec: number): string {
    if (prec === 0) {
      return String(val)
    }
    return val.toFixed(prec)
  }

  // 값 파싱 함수
  function parseValue(val: string): number {
    const parsed = Number(val)
    return isNaN(parsed) ? 0 : parsed
  }

  // 값 클램핑 함수
  function clampValue(val: number): number {
    return Math.max(min, Math.min(max, val))
  }

  // props value가 변경될 때 inputValue 동기화
  useEffect(() => {
    if (!isFocused) {
      setInputValue(formatValue(value, precision))
    }
  }, [value, precision, isFocused])

    // 텍스트 길이 기반 레이아웃 감지
  useEffect(() => {
    const measureTextWidth = (text: string) => {
      if (!containerRef.current) return 0
      
      // 임시 측정용 요소 생성
      const measureElement = document.createElement('span')
      measureElement.style.position = 'absolute'
      measureElement.style.visibility = 'hidden'
      measureElement.style.whiteSpace = 'nowrap'
      measureElement.style.pointerEvents = 'none'
      
      // 실제 입력 필드와 동일한 스타일 적용
      const inputElement = containerRef.current.querySelector('input')
      if (inputElement) {
        const computedStyle = window.getComputedStyle(inputElement)
        measureElement.style.fontSize = computedStyle.fontSize
        measureElement.style.fontFamily = computedStyle.fontFamily
        measureElement.style.fontWeight = computedStyle.fontWeight
        measureElement.style.letterSpacing = computedStyle.letterSpacing
      }
      
      measureElement.textContent = text
      document.body.appendChild(measureElement)
      const width = measureElement.offsetWidth
      document.body.removeChild(measureElement)
      
      return width
    }

    const checkLayout = () => {
      if (containerRef.current) {
        // 강제 모드가 설정된 경우 그것을 존중
        if (forceCompact) {
          setShouldUseCompact(true)
          return
        }
        if (forceWide) {
          setShouldUseCompact(false)
          return
        }

        // 텍스트 길이 기반 감지
        const containerWidth = containerRef.current.offsetWidth
        const buttonWidth = size === 'sm' ? 4*4 : size === 'md' ? 5*4 : 6*4 // w-4/5/6 = 16/20/24px (2개)
        
        // 현재 입력값과 placeholder 중 더 긴 것 사용
        const displayText = inputValue || placeholder || "0"
        
        // 실제 텍스트 너비 측정
        const textWidth = measureTextWidth(displayText)
        
        // 여유 공간 계산 (패딩, 포커스 링 등 고려)
        const padding = size === 'sm' ? 8 : size === 'md' ? 8 : 16 // px-1/px-2 등
        const safetyMargin = 16 // 여유 공간
        const requiredTextWidth = textWidth + padding + safetyMargin
        
        const availableTextWidth = containerWidth - buttonWidth
        const shouldBeCompact = availableTextWidth < requiredTextWidth
        
        // 컴팩트 모드 변경 시 포커스 복원 준비
        if (shouldBeCompact !== shouldUseCompact && isFocused && inputRef.current) {
          const currentSelection = {
            start: inputRef.current.selectionStart || 0,
            end: inputRef.current.selectionEnd || 0
          }
          
          // 다음 렌더링 후 포커스 복원
          setTimeout(() => {
            if (inputRef.current && isFocused) {
              inputRef.current.focus()
              // 커서 위치도 정확히 복원
              inputRef.current.setSelectionRange(currentSelection.start, currentSelection.end)
            }
          }, 0)
        }
        
        setShouldUseCompact(shouldBeCompact)
      }
    }

    // 초기 레이아웃 체크 (DOM이 완전히 렌더링된 후)
    setTimeout(checkLayout, 0)
    checkLayout()
    
    const resizeObserver = new ResizeObserver(checkLayout)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [forceCompact, forceWide, size, inputValue, placeholder])

  // 입력값 변경 시 즉시 레이아웃 재확인
  useEffect(() => {
    if (containerRef.current && !forceCompact && !forceWide) {
      const timer = setTimeout(() => {
        if (!containerRef.current) return
        // measureTextWidth 함수를 다시 정의 (스코프 문제 해결)
        const measureTextWidth = (text: string) => {
          if (!containerRef.current) return 0
          
          const measureElement = document.createElement('span')
          measureElement.style.position = 'absolute'
          measureElement.style.visibility = 'hidden'
          measureElement.style.whiteSpace = 'nowrap'
          measureElement.style.pointerEvents = 'none'
          
          const inputElement = containerRef.current.querySelector('input')
          if (inputElement) {
            const computedStyle = window.getComputedStyle(inputElement)
            measureElement.style.fontSize = computedStyle.fontSize
            measureElement.style.fontFamily = computedStyle.fontFamily
            measureElement.style.fontWeight = computedStyle.fontWeight
            measureElement.style.letterSpacing = computedStyle.letterSpacing
          }
          
          measureElement.textContent = text
          document.body.appendChild(measureElement)
          const width = measureElement.offsetWidth
          document.body.removeChild(measureElement)
          
          return width
        }

        const containerWidth = containerRef.current.offsetWidth
        const buttonWidth = size === 'sm' ? 4*4 : size === 'md' ? 5*4 : 6*4
        const displayText = inputValue || placeholder || "0"
        const textWidth = measureTextWidth(displayText)
        const padding = size === 'sm' ? 8 : size === 'md' ? 8 : 16
        const safetyMargin = 16
        const requiredTextWidth = textWidth + padding + safetyMargin
        const availableTextWidth = containerWidth - buttonWidth
        const shouldBeCompact = availableTextWidth < requiredTextWidth
        
        // 컴팩트 모드 변경 시 포커스 복원 준비
        if (shouldBeCompact !== shouldUseCompact && isFocused && inputRef.current) {
          const currentSelection = {
            start: inputRef.current.selectionStart || 0,
            end: inputRef.current.selectionEnd || 0
          }
          
          // 다음 렌더링 후 포커스 복원
          setTimeout(() => {
            if (inputRef.current && isFocused) {
              inputRef.current.focus()
              // 커서 위치도 정확히 복원
              inputRef.current.setSelectionRange(currentSelection.start, currentSelection.end)
            }
          }, 0)
        }
        
        setShouldUseCompact(shouldBeCompact)
      }, 100) // 디바운스
      
      return () => clearTimeout(timer)
    }
  }, [inputValue])

  // 입력값 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    
    // 소숫점이 포함된 입력도 허용 (예: "1.", "0.5", ".5")
    const isValidInput = /^-?\d*\.?\d*$/.test(newValue) || newValue === '' || newValue === '-'
    
    if (!isValidInput) return
    
    setInputValue(newValue)
    
    if (!newValue || newValue === '-' || newValue === '.') {
      onChange(0)
      return
    }
    
    const parsed = parseValue(newValue)
    if (!isNaN(parsed)) {
      const clampedValue = clampValue(parsed)
      onChange(clampedValue)
    }
  }

  // 감소 버튼 핸들러
  const handleDecrease = () => {
    if (disabled || readOnly) return
    const newValue = clampValue(value - step)
    const formattedValue = formatValue(newValue, precision)
    setInputValue(formattedValue)
    onChange(newValue)
    onInputComplete?.(newValue)
  }

  // 증가 버튼 핸들러
  const handleIncrease = () => {
    if (disabled || readOnly) return
    const newValue = clampValue(value + step)
    const formattedValue = formatValue(newValue, precision)
    setInputValue(formattedValue)
    onChange(newValue)
    onInputComplete?.(newValue)
  }

  // 포커스 핸들러
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true)
    if (selectAllOnFocus) {
      e.target.select()
    }
    onFocus?.()
  }

  // blur 핸들러
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    let finalValue = value
    
    if (inputValue && inputValue !== '-' && inputValue !== '.') {
      const parsed = parseValue(inputValue)
      if (!isNaN(parsed)) {
        finalValue = clampValue(parsed)
        if (finalValue !== value) {
          onChange(finalValue)
        }
      }
    }
    
    // precision에 따라 포맷팅하되, precision=0이어도 입력값이 정수가 아니면 소숫점 유지
    let formattedValue: string
    if (precision === 0 && finalValue % 1 === 0) {
      formattedValue = String(Math.round(finalValue))
    } else {
      formattedValue = precision === 0 ? String(finalValue) : finalValue.toFixed(precision)
    }
    
    setInputValue(formattedValue)
    onInputComplete?.(finalValue)
    onBlur?.()
  }

  // 키 다운 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter 키 처리
    if (e.key === 'Enter') {
      e.currentTarget.blur()
      const parsed = parseValue(inputValue)
      if (!isNaN(parsed)) {
        const clampedValue = clampValue(parsed)
        onInputComplete?.(clampedValue)
      }
    }
    
    // 화살표 키 처리
    if (!readOnly && !disabled) {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        handleIncrease()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        handleDecrease()
      }
    }
    
    onKeyDown?.(e)
  }

  // 스타일 클래스 생성
  const getContainerClasses = () => {
    const baseClasses = shouldUseCompact 
      ? "flex items-stretch overflow-hidden relative"
      : "flex items-center overflow-hidden"
    
    const sizeClasses = {
      sm: shouldUseCompact ? "h-8 min-h-8" : "h-7 min-h-7",
      md: shouldUseCompact ? "h-9 min-h-9" : "h-9 min-h-9", 
      lg: shouldUseCompact ? "h-10 min-h-10" : "h-11 min-h-11"
    }
    
    const variantClasses = {
      default: "border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500",
      outline: "border border-gray-300 rounded-md focus-within:ring-1 focus-within:ring-gray-400",
      ghost: "border border-transparent hover:border-gray-300 focus-within:border-gray-400"
    }
    
    const stateClasses = disabled 
      ? "bg-gray-100 opacity-60 cursor-not-allowed" 
      : "bg-white"
    
    return cn(
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      stateClasses,
      className
    )
  }

  const getInputClasses = () => {
    const baseClasses = shouldUseCompact
      ? "w-full text-center border-0 focus:outline-none bg-transparent pr-5"
      : "flex-1 min-w-0 text-center border-0 focus:outline-none bg-transparent"
    
    const getInputSizeClass = () => {
      if (shouldUseCompact) {
        return {
          sm: "px-1 py-0.5 text-xs h-full",
          md: "px-1 py-1 text-sm h-full", 
          lg: "px-2 py-1 text-base h-full"
        }[size]
      }
      
      return {
        sm: "px-1 text-xs",
        md: "px-1 text-sm", 
        lg: "px-2 text-base"
      }[size]
    }
    
    const disabledClasses = disabled ? "cursor-not-allowed" : ""
    
    return cn(
      baseClasses,
      getInputSizeClass(),
      disabledClasses,
      "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    )
  }

  const getButtonClasses = (isDisabled: boolean, isPlus = false) => {
    if (shouldUseCompact) {
      const baseClasses = "absolute flex items-center justify-center transition-colors select-none"
      const positionClasses = isPlus 
        ? "right-0 top-0 h-1/2 w-5" 
        : "right-0 bottom-0 h-1/2 w-5"
      
      const sizeClasses = {
        sm: "text-xs font-bold leading-none",
        md: "text-xs font-bold leading-none",
        lg: "text-sm font-bold leading-none"
      }
      
      const stateClasses = isDisabled
        ? "text-gray-300 cursor-not-allowed"
        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer"
      
      return cn(baseClasses, positionClasses, sizeClasses[size], stateClasses)
    }
    
    const baseClasses = "flex items-center justify-center transition-colors select-none flex-shrink-0"
    
    const sizeClasses = {
      sm: "w-4 min-w-4 text-xs font-bold",
      md: "w-5 min-w-5 text-sm",
      lg: "w-6 min-w-6 text-base"
    }
    
    const stateClasses = isDisabled
      ? "text-gray-300 cursor-not-allowed"
      : "text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer"
    
    return cn(baseClasses, sizeClasses[size], stateClasses)
  }

  const isDecreaseDisabled = disabled || readOnly || value <= min
  const isIncreaseDisabled = disabled || readOnly || value >= max

  if (hideButtons) {
    return (
      <input
        ref={setInputRef}
        type="number"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        min={min}
        max={max}
        step={step}
        className={getInputClasses()}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
      />
    )
  }

  if (shouldUseCompact) {
    return (
      <div ref={containerRef} className={getContainerClasses()}>
        <input
          ref={setInputRef}
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          min={min}
          max={max}
          step={step}
          className={getInputClasses()}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
        />
        <button
          type="button"
          onClick={handleIncrease}
          disabled={isIncreaseDisabled}
          className={getButtonClasses(isIncreaseDisabled, true)}
          tabIndex={-1}
          aria-label="값 증가"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleDecrease}
          disabled={isDecreaseDisabled}
          className={getButtonClasses(isDecreaseDisabled, false)}
          tabIndex={-1}
          aria-label="값 감소"
        >
          −
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={getContainerClasses()}>
      <button
        type="button"
        onClick={handleDecrease}
        disabled={isDecreaseDisabled}
        className={getButtonClasses(isDecreaseDisabled)}
        tabIndex={-1}
        aria-label="값 감소"
      >
        −
      </button>
      <input
        ref={setInputRef}
        type="number"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        min={min}
        max={max}
        step={step}
        className={getInputClasses()}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
      />
      <button
        type="button"
        onClick={handleIncrease}
        disabled={isIncreaseDisabled}
        className={getButtonClasses(isIncreaseDisabled)}
        tabIndex={-1}
        aria-label="값 증가"
      >
        +
      </button>
    </div>
  )
})

NumberInput.displayName = 'NumberInput'

export default NumberInput 