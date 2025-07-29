'use client'

interface RadioOption {
  value: string
  label: string
  description?: string
}

interface RadioGroupProps {
  options: RadioOption[]
  value: string
  onChange: (value: string) => void
  name?: string
  className?: string
  orientation?: 'vertical' | 'horizontal'
}

export function RadioGroup({ 
  options, 
  value, 
  onChange,
  name = 'radio-group',
  className = '',
  orientation = 'vertical'
}: RadioGroupProps) {
  return (
    <div className={`
      ${orientation === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-2'}
      ${className}
    `}>
      {options.map((option) => (
        <label 
          key={option.value}
          className={`
            flex items-center space-x-3 cursor-pointer
            p-2 rounded-lg border transition-all
            ${value === option.value 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            className="
              w-4 h-4 text-blue-600 
              focus:ring-blue-500 focus:ring-2
              border-gray-300
            "
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-700">
              {option.label}
            </span>
            {option.description && (
              <p className="text-xs text-gray-500 mt-0.5">
                {option.description}
              </p>
            )}
          </div>
        </label>
      ))}
    </div>
  )
}