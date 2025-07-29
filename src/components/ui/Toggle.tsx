'use client'

import { useState, useEffect } from 'react'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Toggle({ 
  checked, 
  onChange, 
  disabled = false,
  className = '',
  size = 'md'
}: ToggleProps) {
  const [isChecked, setIsChecked] = useState(checked)

  useEffect(() => {
    setIsChecked(checked)
  }, [checked])

  const handleToggle = () => {
    if (!disabled) {
      const newChecked = !isChecked
      setIsChecked(newChecked)
      onChange(newChecked)
    }
  }

  const sizeClasses = {
    sm: {
      track: 'w-8 h-4',
      thumb: 'w-3 h-3',
      translate: 'translate-x-4'
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-5'
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translate: 'translate-x-7'
    }
  }

  const { track, thumb, translate } = sizeClasses[size]

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      onClick={handleToggle}
      disabled={disabled}
      className={`
        relative inline-flex items-center
        ${track}
        rounded-full
        transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${isChecked ? 'bg-blue-600' : 'bg-gray-300'}
        ${className}
      `}
    >
      <span
        className={`
          ${thumb}
          pointer-events-none
          inline-block
          rounded-full
          bg-white
          shadow
          transform
          ring-0
          transition duration-200 ease-in-out
          ${isChecked ? translate : 'translate-x-0'}
        `}
      />
    </button>
  )
}