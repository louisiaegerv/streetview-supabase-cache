import { useState, useCallback } from 'react'

export interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
}

export function useToast() {
  const [toast, setToast] = useState<ToastProps | null>(null)

  const showToast = useCallback((message: string, type: ToastProps['type'] = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  return { toast, showToast }
}