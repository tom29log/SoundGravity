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
        setPendingPlay(false) // Reset intent on track change
        pausedAtRef.current = 0
        startTimeRef.current = 0

        // Cleanup
        disposePlayers()

        const loadAudio = async () => {
            console.log('[Deck] Loading audio for:', track.title)

            const hasStems = track.stems && Object.keys(track.stems).length > 0

            // Validation
            if (!hasStems && !track.audio_url) {
                console.error('[Deck] Track has no audio URL or stems:', track.title)
                // Could emit error state here if we added one
                return
            }

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
                    // Start loading immediately
                    const player = new Tone.Player({
                        url: track.audio_url!,
                        onload: () => {
                            console.log('[Deck] Single Player loaded for', track.title)
                            setDuration(player.buffer.duration)
                            setIsReady(true)
                        },
                        onerror: (err: any) => {
                            console.error('[Deck] Error loading player for track:', track.title, err)
                            // Potential: Retry logic or cleanup
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


    // Ensure AudioContext is active (critical for iOS Safari)
    const ensureAudioContext = useCallback(async () => {
        try {
            await Tone.start()
            if (Tone.context.state === 'suspended') {
                await Tone.context.resume()
            }
            // Small delay for mobile context stabilization
            await new Promise(resolve => setTimeout(resolve, 50))
            return Tone.context.state === 'running'
        } catch (err) {
            console.error('[Deck] Failed to activate AudioContext:', err)
            return false
        }
    }, [])

    // Intelligent Playback Queue
    const [pendingPlay, setPendingPlay] = useState(false)

    // Watch for Ready state to execute pending play
    useEffect(() => {
        if (isReady && pendingPlay) {
            console.log('[Deck] Ready now, executing pending play')
            play()
        }
    }, [isReady, pendingPlay])

    const play = useCallback(async () => {
        // Always capture intent
        setPendingPlay(true)

        if (!isReady) {
            console.log('[Deck] Not ready, queuing play intent')
            return
        }

        // Force resume context (critical for mobile)
        const contextReady = await ensureAudioContext()
        if (!contextReady) {
            console.error('[Deck] AudioContext not running, cannot play')
            return
        }

        const now = Tone.now()
        const offset = pausedAtRef.current

        startTimeRef.current = now

        if (playersRef.current) {
            Object.keys(track?.stems || {}).forEach(key => {
                if (playersRef.current?.has(key)) {
                    const p = playersRef.current.player(key)
                    if (p.loaded) {
                        try {
                            // Ensure stopped before starting to avoid overlap if called rapidly
                            if (p.state === 'started') p.stop()
                            p.start(now, offset)
                        } catch (err) {
                            console.error(`[Deck] Error starting stem ${key}:`, err)
                        }
                    }
                }
            })
        } else if (playerRef.current) {
            if (playerRef.current.loaded) {
                try {
                    // Start
                    if (playerRef.current.state === 'started') playerRef.current.stop()
                    playerRef.current.start(now, offset)
                } catch (err) {
                    console.error('[Deck] Error starting player:', err)
                }
            }
        }

        setIsPlaying(true)
    }, [isReady, track, ensureAudioContext]) // Removed isPlaying dependency to allow forced re-trigger if needed

    const pause = useCallback(() => {
        setPendingPlay(false) // Cancel intent
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
        setPendingPlay(false) // Cancel intent
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
