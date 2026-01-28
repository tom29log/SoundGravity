'use client'

import { useEffect } from 'react'

export default function ServiceWorkerUnregister() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                for (const registration of registrations) {
                    console.log('Unregistering Service Worker:', registration)
                    registration.unregister()
                }
            })

            // Optional: Clear Caches if you suspect cache corruption
            // Careful: This deletes ALL caches for the origin
            if ('caches' in window) {
                caches.keys().then((names) => {
                    names.forEach((name) => {
                        console.log('Deleting Cache:', name)
                        caches.delete(name)
                    })
                })
            }
        }
    }, [])

    return null
}
