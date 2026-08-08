'use client'

import { useEffect } from 'react'

export default function ServiceWorkerUnregister() {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // 1. Unregister old service workers
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                    for (const registration of registrations) {
                        console.log('Unregistering Service Worker:', registration)
                        registration.unregister()
                    }
                })
            }

            // 2. Clear old browser Caches
            if ('caches' in window) {
                caches.keys().then((names) => {
                    names.forEach((name) => {
                        console.log('Deleting Cache:', name)
                        caches.delete(name)
                    })
                })
            }

            // 3. Automatically purge old deleted Supabase project keys from localStorage & sessionStorage
            try {
                const keysToRemove: string[] = []
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i)
                    if (key && (key.includes('jgzistwf') || key.startsWith('sb-jgzistwf'))) {
                        keysToRemove.push(key)
                    }
                }
                keysToRemove.forEach(k => localStorage.removeItem(k))

                const sessionKeysToRemove: string[] = []
                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i)
                    if (key && (key.includes('jgzistwf') || key.startsWith('sb-jgzistwf'))) {
                        sessionKeysToRemove.push(key)
                    }
                }
                sessionKeysToRemove.forEach(k => sessionStorage.removeItem(k))
            } catch (e) {
                console.error('LocalStorage cleanup error:', e)
            }
        }
    }, [])

    return null
}
