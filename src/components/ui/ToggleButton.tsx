'use client'

interface ToggleButtonProps {
  options: {
    value: string
    label: string
  }[]
  value: string
  onChange: (value: string) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ToggleButton({ 
  options, 
  value, 
  onChange,
  className = '',
  size = 'md'
}: ToggleButtonProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }

  return (
    <div className={`inline-flex rounded-md shadow-sm ${className}`} role="group">
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`
            ${sizeClasses[size]}
            font-medium
            transition-colors duration-150
            ${index === 0 ? 'rounded-l-md' : ''}
            ${index === options.length - 1 ? 'rounded-r-md' : ''}
            ${index !== 0 ? '-ml-px' : ''}
            ${value === option.value 
              ? 'bg-blue-600 text-white border-blue-600 z-10' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }
            border
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}