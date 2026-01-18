'use client'

import { useState, useEffect } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
    id: number
    message: string
    type: ToastType
}

export const useToast = () => {
    // A simple event-based system or context is better, but for drop-in usage without context 
    // we can use a custom event.
    const showToast = (message: string, type: ToastType = 'info') => {
        const event = new CustomEvent('show-toast', { detail: { message, type } })
        window.dispatchEvent(event)
    }
    return { showToast }
}

export default function ToastContainer() {
    const [toasts, setToasts] = useState<Toast[]>([])

    useEffect(() => {
        const handleToast = (e: Event) => {
            const detail = (e as CustomEvent).detail
            const id = Date.now()
            setToasts(prev => [...prev, { id, ...detail }])

            // Auto dismiss
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id))
            }, 3000)
        }

        window.addEventListener('show-toast', handleToast)
        return () => window.removeEventListener('show-toast', handleToast)
    }, [])

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`min-w-[200px] px-4 py-3 rounded-lg shadow-lg backdrop-blur-md text-sm font-medium animate-in slide-in-from-right-10 fade-in duration-300 ${toast.type === 'error' ? 'bg-red-500/90 text-white' :
                            toast.type === 'success' ? 'bg-green-500/90 text-white' :
                                'bg-zinc-800/90 text-white border border-zinc-700'
                        }`}
                >
                    {toast.message}
                </div>
            ))}
        </div>
    )
}
