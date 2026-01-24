'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import * as Tone from 'tone'
import { Project } from '@/types'

interface UseDeckPlayerProps {
    track: Project | null
    destinationNode: Tone.InputNode | null
}

export function useDeckPlayer({ track, destinationNode }: UseDeckPlayerProps) {
    const playersRef = useRef<Tone.Players | null>(null)
    const playerRef = useRef<Tone.Player | null>(null)

    const [isReady, setIsReady] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [duration, setDuration] = useState(0)

    // Time tracking (Refs only, avoiding state updates during playback loop)
    const startTimeRef = useRef<number>(0)
    const pausedAtRef = useRef<number>(0)
    const rafRef = useRef<number>(0)

    const [playbackRate, setPlaybackRate] = useState(1)

    // Load Track
    useEffect(() => {
        if (!track || !destinationNode) return

        setIsReady(false)
        setIsPlaying(false)
        pausedAtRef.current = 0
        startTimeRef.current = 0

        // Cleanup
        disposePlayers()

        const loadAudio = async () => {
            console.log('[Deck] Loading audio for:', track.title, track.audio_url)
            const hasStems = track.stems && Object.keys(track.stems).length > 0

            if (hasStems) {
                const players = new Tone.Players(track.stems!, () => {
                    console.log('[Deck] Players loaded for', track.title)
                    if (players.loaded) {
                        const anyBuffer = players.player(Object.keys(track.stems!)[0]).buffer
                        setDuration(anyBuffer.duration)
                        setIsReady(true)
                    }
                })
                players.connect(destinationNode)
                playersRef.current = players
            } else {
                try {
                    const player = new Tone.Player({
                        url: track.audio_url,
                        onload: () => {
                            console.log('[Deck] Single Player loaded for', track.title)
                            setDuration(player.buffer.duration)
                            setIsReady(true)
                        },
                        onerror: (err: any) => {
                            console.error('[Deck] Error loading player:', err)
                        }
                    })
                    player.connect(destinationNode)
                    playerRef.current = player
                } catch (e) {
                    console.error('[Deck] Exception creating player:', e)
                }
            }
        }

        loadAudio()

        return () => disposePlayers()
    }, [track, destinationNode])

    const disposePlayers = () => {
        try {
            if (playersRef.current) {
                playersRef.current.dispose()
                playersRef.current = null
            }
            if (playerRef.current) {
                playerRef.current.dispose()
                playerRef.current = null
            }
        } catch (e) {
            console.warn('[Deck] Error disposing player:', e)
        }
        cancelAnimationFrame(rafRef.current)
    }

    // Direct Time Accessor (No State Updates!)
    const getCurrentTime = useCallback(() => {
        if (!isPlaying) return pausedAtRef.current

        const now = Tone.now()
        const elapsed = now - startTimeRef.current
        const totalTime = elapsed * playbackRate + pausedAtRef.current

        // Clamp to duration if valid
        if (duration > 0 && totalTime >= duration) {
            // Auto-Stop check logic could be here, but usually better handled by engine poller
            return duration
        }
        return totalTime
    }, [isPlaying, playbackRate, duration])


    const play = useCallback(async () => {
        if (!isReady) return
        if (isPlaying) return

        await Tone.start()

        const now = Tone.now()
        const offset = pausedAtRef.current

        startTimeRef.current = now

        if (playersRef.current) {
            Object.keys(track?.stems || {}).forEach(key => {
                if (playersRef.current?.has(key)) {
                    const p = playersRef.current.player(key)
                    if (p.loaded) p.start(now, offset)
                }
            })
        } else if (playerRef.current) {
            if (playerRef.current.loaded) {
                playerRef.current.start(now, offset)
            }
        }

        setIsPlaying(true)
    }, [isReady, track, isPlaying])

    const pause = useCallback(() => {
        if (!isPlaying) return

        const now = Tone.now()
        const elapsed = now - startTimeRef.current
        pausedAtRef.current += elapsed

        if (playersRef.current) {
            playersRef.current.stopAll()
        } else if (playerRef.current) {
            playerRef.current.stop()
        }
        setIsPlaying(false)
    }, [isPlaying])

    const stop = useCallback(() => {
        if (playersRef.current) {
            playersRef.current.stopAll()
        } else if (playerRef.current) {
            playerRef.current.stop()
        }
        pausedAtRef.current = 0
        setIsPlaying(false)
    }, [])

    const setRate = useCallback((rate: number) => {
        setPlaybackRate(rate)
        if (playerRef.current) {
            playerRef.current.playbackRate = rate
        }
        if (playersRef.current) {
            Object.keys(track?.stems || {}).forEach(key => {
                if (playersRef.current?.has(key)) {
                    playersRef.current.player(key).playbackRate = rate
                }
            })
        }
    }, [track])

    return useMemo(() => ({
        isReady,
        isPlaying,
        play,
        pause,
        stop,
        duration,
        getCurrentTime, // Expose this!
        setRate
    }), [isReady, isPlaying, play, pause, stop, duration, getCurrentTime, setRate])
}
