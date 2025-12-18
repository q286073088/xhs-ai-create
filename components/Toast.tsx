'use client'

import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'info' | 'warning' | 'error'
  duration?: number
  onClose: () => void
}

export default function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 触发动画
    setIsVisible(true)

    // 自动关闭
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // 等待消失动画
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 border-green-600 text-white'
      case 'warning':
        return 'bg-orange-500 border-orange-600 text-white'
      case 'error':
        return 'bg-red-500 border-red-600 text-white'
      default:
        return 'bg-blue-500 border-blue-600 text-white'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'error':
        return '❌'
      default:
        return 'ℹ️'
    }
  }

  return (
    <div
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className={`${getToastStyles()} px-6 py-3 rounded-lg shadow-lg border flex items-center gap-3 min-w-[300px] max-w-md`}>
        <span className="text-lg">{getIcon()}</span>
        <span className="font-medium">{message}</span>
      </div>
    </div>
  )
}

// Toast容器组件
interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type?: 'success' | 'info' | 'warning' | 'error' }>
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  )
}

// Toast Hook
export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: 'success' | 'info' | 'warning' | 'error' }>>([])

  const addToast = (message: string, type?: 'success' | 'info' | 'warning' | 'error') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return {
    toasts,
    addToast,
    removeToast,
    success: (message: string) => addToast(message, 'success'),
    info: (message: string) => addToast(message, 'info'),
    warning: (message: string) => addToast(message, 'warning'),
    error: (message: string) => addToast(message, 'error')
  }
}