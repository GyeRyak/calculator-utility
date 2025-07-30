'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'

type NotificationType = 'success' | 'error' | 'info' | 'warning'

interface Notification {
  id: string
  type: NotificationType
  message: string
  duration?: number
}

interface NotificationContextType {
  showNotification: (type: NotificationType, message: string, duration?: number) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const showNotification = useCallback((type: NotificationType, message: string, duration = 3000) => {
    const id = Date.now().toString()
    const notification: Notification = { id, type, message, duration }
    
    setNotifications(prev => [...prev, notification])
    
    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }, duration)
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />
      case 'error':
        return <AlertCircle className="w-5 h-5" />
      case 'warning':
        return <AlertCircle className="w-5 h-5" />
      case 'info':
        return <Info className="w-5 h-5" />
    }
  }

  const getStyles = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return { backgroundColor: '#10b981', color: 'white' }
      case 'error':
        return { backgroundColor: '#ef4444', color: 'white' }
      case 'warning':
        return { backgroundColor: '#f59e0b', color: 'white' }
      case 'info':
        return { backgroundColor: '#3b82f6', color: 'white' }
    }
  }

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      
      {/* 알림 컨테이너 */}
      <div className="fixed bottom-4 right-4 z-[9999] space-y-2" style={{ position: 'fixed', bottom: '1rem', right: '1rem', zIndex: 9999 }}>
        {notifications.map(notification => (
          <div
            key={notification.id}
            className="px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in-bottom"
            style={{ 
              ...getStyles(notification.type),
              minWidth: '300px', 
              maxWidth: '500px',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem'
            }}
          >
            {getIcon(notification.type)}
            <span className="flex-1">{notification.message}</span>
            <button
              onClick={() => removeNotification(notification.id)}
              className="hover:opacity-80 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}