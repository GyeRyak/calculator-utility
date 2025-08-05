import React, { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import NumberInput from './NumberInput'
import { SOL_ERDA_FRAGMENT_ID } from '../../utils/huntingExpectationCalculations'

export interface DropItem {
  id: string
  name: string
  price: number // 만 메소 단위
  dropRate?: number // 일반 아이템 드롭률 (선택적)
  directUse?: boolean // 직접 사용 여부 (선택적)
}

export interface DropItemInputProps {
  items: DropItem[]
  onItemsChange: (items: DropItem[]) => void
  showDropRate?: boolean // 일반 아이템 드롭률 표시 여부
  title: string
  placeholder?: string
}

const DropItemInput: React.FC<DropItemInputProps> = ({ 
  items, 
  onItemsChange, 
  showDropRate = false,
  title,
  placeholder = "아이템 이름"
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const addItem = () => {
    const newItem: DropItem = {
      id: Date.now().toString(),
      name: '',
      price: 0,
      dropRate: 0,
      directUse: false
    }
    onItemsChange([...items, newItem])
  }

  const updateItem = (id: string, field: keyof DropItem, value: string | number | boolean) => {
    onItemsChange(
      items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  const removeItem = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {title}
        </button>
        {isExpanded && (
          <button
            onClick={addItem}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-3 h-3" />
            추가
          </button>
        )}
      </div>
      
      {isExpanded && (
        items.length === 0 ? (
          <p className="text-xs text-gray-500 italic">아이템을 추가해주세요</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto" style={{ paddingRight: '8px' }}>
            {/* 솔 에르다 조각을 최상단에, 나머지는 그 아래에 표시 */}
            {[
              ...items.filter(item => item.id === SOL_ERDA_FRAGMENT_ID),
              ...items.filter(item => item.id !== SOL_ERDA_FRAGMENT_ID)
            ].map(item => (
            <div key={item.id} className="p-2 bg-gray-50 rounded border border-gray-200">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-1.5">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                    placeholder={placeholder}
                    readOnly={item.id === SOL_ERDA_FRAGMENT_ID}
                    className={`w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      item.id === SOL_ERDA_FRAGMENT_ID ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  />
                  
                  <div className="space-y-1.5 min-w-0">
                    {/* 가격과 직접 사용 체크박스 (한 줄) */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 min-w-0">
                        <label className="text-xs text-gray-600">가격:</label>
                        <NumberInput
                          value={item.price}
                          onChange={(value) => updateItem(item.id, 'price', value)}
                          min={0}
                          step={10}
                          className="w-20"
                          placeholder="0"
                          size="sm"
                        />
                        <span className="text-xs text-gray-600">만</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={item.directUse || false}
                          onChange={(e) => updateItem(item.id, 'directUse', e.target.checked)}
                          className="rounded"
                          title="체크 시 수수료 0%로 계산됩니다"
                        />
                        <label 
                          className="text-xs text-gray-600 cursor-help"
                          title="체크 시 수수료 0%로 계산됩니다"
                        >
                          탈세
                        </label>
                      </div>
                    </div>
                    
                    {/* 확률 (다음 줄) */}
                    {showDropRate && (
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-gray-600">확률:</label>
                        <NumberInput
                          value={item.dropRate || 0}
                          onChange={(value) => updateItem(item.id, 'dropRate', value)}
                          min={0}
                          max={100}
                          step={0.01}
                          className="w-24"
                          placeholder="0"
                          size="sm"
                        />
                        <span className="text-xs text-gray-600">%</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {item.id !== SOL_ERDA_FRAGMENT_ID && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

export default DropItemInput