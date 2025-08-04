'use client'

import { Save, Trash2, Edit2 } from 'lucide-react'

interface SlotHeaderProps {
  currentSlot: number
  maxSlots: number
  slotNames: { [key: number]: string }
  tempSlotName: string
  isEditingSlotName: boolean
  hasSlotData: (slot: number) => boolean
  onSlotSwitch: (slot: number) => void
  onSlotNameChange: (name: string) => void
  onSlotNameEdit: (editing: boolean) => void
  onSave: () => void
  onReset: () => void
}

export default function SlotHeader({
  currentSlot,
  maxSlots,
  slotNames,
  tempSlotName,
  isEditingSlotName,
  hasSlotData,
  onSlotSwitch,
  onSlotNameChange,
  onSlotNameEdit,
  onSave,
  onReset
}: SlotHeaderProps) {
  return (
    <div className="mb-4 border-b pb-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* 슬롯 버튼들 */}
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-700 mr-2">저장 슬롯:</h3>
          <div className="flex gap-2">
            {Array.from({ length: maxSlots }, (_, i) => i + 1).map(slot => (
              <div key={slot} className="relative">
                <button
                  onClick={() => onSlotSwitch(slot)}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                    currentSlot === slot
                      ? 'bg-blue-500 text-white shadow-md'
                      : hasSlotData(slot)
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-400 border border-gray-200'
                  }`}
                >
                  {slot}
                </button>
                {/* 슬롯 이름 표시 */}
                {slotNames[slot] && slotNames[slot] !== `슬롯 ${slot}` && (
                  <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap">
                    {slotNames[slot]}
                  </div>
                )}
                {/* 저장된 데이터 표시 */}
                {hasSlotData(slot) && currentSlot !== slot && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" title="저장된 데이터 있음" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 슬롯 이름 및 액션 버튼 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">현재 슬롯:</span>
            {isEditingSlotName ? (
              <input
                type="text"
                value={tempSlotName}
                onChange={(e) => onSlotNameChange(e.target.value)}
                onBlur={() => {
                  onSave()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSave()
                  } else if (e.key === 'Escape') {
                    onSlotNameEdit(false)
                    onSlotNameChange(slotNames[currentSlot])
                  }
                }}
                className="px-3 py-1 text-sm border rounded-md w-32 font-medium"
                autoFocus
              />
            ) : (
              <button
                onClick={() => onSlotNameEdit(true)}
                className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1"
              >
                {tempSlotName || slotNames[currentSlot]}
                <Edit2 className="h-3 w-3" />
              </button>
            )}
          </div>
          
          {/* 저장/초기화 버튼 */}
          <div className="flex gap-1">
            <button
              onClick={onSave}
              className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center gap-1"
              title="현재 설정 저장"
            >
              <Save className="h-3.5 w-3.5" />
              저장
            </button>
            <button
              onClick={onReset}
              className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center gap-1"
              title="현재 슬롯 초기화"
            >
              <Trash2 className="h-3.5 w-3.5" />
              초기화
            </button>
          </div>
        </div>
      </div>
      
      {/* 슬롯 이름들이 있을 경우 추가 여백 */}
      {Object.values(slotNames).some(name => name && name !== `슬롯 ${1}` && name !== `슬롯 ${2}` && name !== `슬롯 ${3}`) && (
        <div className="h-4"></div>
      )}
    </div>
  )
}