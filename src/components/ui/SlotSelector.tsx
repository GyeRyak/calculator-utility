'use client'

import { RotateCcw } from 'lucide-react'

interface SlotSelectorProps {
  title: string
  description?: string
  selectedSlot: number | null
  onSlotSelect: (slotNumber: number) => void
  onReset: () => void
  hasSlotData: (slotNumber: number) => boolean
  getSlotName: (slotNumber: number) => string
  maxSlots?: number
  className?: string
}

export default function SlotSelector({
  title,
  description,
  selectedSlot,
  onSlotSelect,
  onReset,
  hasSlotData,
  getSlotName,
  maxSlots = 5,
  className = ""
}: SlotSelectorProps) {
  return (
    <div className={`p-3 bg-gray-50 rounded ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <div>
          <div className="text-sm font-medium text-gray-700">{title}</div>
          {description && (
            <div className="text-xs text-gray-500 mt-1">{description}</div>
          )}
        </div>
        <button
          onClick={onReset}
          className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors flex items-center gap-1"
        >
          <RotateCcw className="h-3 w-3" />
          기본값으로 초기화
        </button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: maxSlots }, (_, i) => i + 1).map(slot => (
          <button
            key={slot}
            onClick={() => onSlotSelect(slot)}
            disabled={!hasSlotData(slot)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              selectedSlot === slot
                ? 'bg-green-500 text-white'
                : hasSlotData(slot)
                ? 'bg-gray-200 hover:bg-gray-300'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {getSlotName(slot)}
            {!hasSlotData(slot) && ' (비어있음)'}
          </button>
        ))}
      </div>
    </div>
  )
}