'use client'

import NumberInput from './NumberInput'

interface RadioOption {
  value: string
  label: string
  hasInput?: boolean
  inputProps?: {
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    placeholder?: string
    suffix?: string
  }
}

interface RadioGroupWithInputProps {
  options: RadioOption[]
  value: string
  onChange: (value: string) => void
  name?: string
  className?: string
  orientation?: 'vertical' | 'horizontal'
}

export function RadioGroupWithInput({ 
  options, 
  value, 
  onChange,
  name = 'radio-group',
  className = '',
  orientation = 'horizontal'
}: RadioGroupWithInputProps) {
  return (
    <div className={`
      ${orientation === 'horizontal' ? 'flex flex-wrap items-center gap-4' : 'space-y-2'}
      ${className}
    `}>
      {options.map((option) => (
        <div key={option.value} className="flex items-center space-x-2">
          <input
            type="radio"
            id={`${name}-${option.value}`}
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
          />
          <label 
            htmlFor={`${name}-${option.value}`}
            className="text-sm text-gray-700 cursor-pointer"
          >
            {option.label}
          </label>
          {option.hasInput && option.inputProps && (
            <>
              <NumberInput
                value={option.inputProps.value}
                onChange={option.inputProps.onChange}
                min={option.inputProps.min}
                max={option.inputProps.max}
                className="w-20"
                placeholder={option.inputProps.placeholder}
              />
              {option.inputProps.suffix && (
                <span className="text-sm text-gray-500">{option.inputProps.suffix}</span>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  )
}