'use client'

import { AlertCircle } from 'lucide-react'

interface UnsavedChangesModalProps {
  isOpen: boolean
  onCancel: () => void
  onSaveAndSwitch: () => void
  onSwitchWithoutSaving: () => void
}

export default function UnsavedChangesModal({
  isOpen,
  onCancel,
  onSaveAndSwitch,
  onSwitchWithoutSaving
}: UnsavedChangesModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">저장되지 않은 변경사항</h3>
        </div>
        <p className="text-gray-600 mb-6">
          현재 슬롯에 저장되지 않은 변경사항이 있습니다. 다른 슬롯으로 이동하시겠습니까?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onSwitchWithoutSaving}
            className="px-4 py-2 text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
          >
            저장하지 않고 이동
          </button>
          <button
            onClick={onSaveAndSwitch}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            저장 후 이동
          </button>
        </div>
      </div>
    </div>
  )
}