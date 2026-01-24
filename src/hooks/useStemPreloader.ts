'use client'

import { useEffect, useRef } from 'react'
import * as Tone from 'tone'

interface StemPreloaderProps {
    tracks: { id: string; stems?: Record<string, string> | null }[]
    currentIndex: number
}

// Global cache to persist across re-renders (simple version)
const bufferCache = new Map<string, Tone.ToneAudioBuffer>()

export function useStemPreloader({ tracks, currentIndex }: StemPreloaderProps) {
    const nextTrackLoadRef = useRef<string | null>(null)

    useEffect(() => {
        // Find next track with stems
        const nextIndex = currentIndex + 1
        if (nextIndex >= tracks.length) return

        const nextTrack = tracks[nextIndex]
        if (!nextTrack.stems) return

        // Check if already loading/loaded this track
        if (nextTrackLoadRef.current === nextTrack.id) return

        console.log(`Preloading stems for track: ${nextTrack.id}`)
        nextTrackLoadRef.current = nextTrack.id

        // Preload each stem
        Object.values(nextTrack.stems).forEach((url) => {
            if (bufferCache.has(url)) return

            // Initiate load
            const buffer = new Tone.ToneAudioBuffer(url, () => {
                // Loaded
                console.log(`Preloaded: ${url}`)
            }, (e) => {
                console.warn(`Failed to preload: ${url}`, e)
            })

            bufferCache.set(url, buffer)
        })

    }, [currentIndex, tracks])

    // Cleanup logic? 
    // Buffers take memory. We might want to clear buffers of tracks far behind.
    // For now, simple implementation.
}
