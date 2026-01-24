'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import * as Tone from 'tone'

interface StemPlayerState {
    isReady: boolean
    isPlaying: boolean
    currentTime: number
    duration: number
    volumes: Record<string, number>
    muted: Record<string, boolean>
    solod: Record<string, boolean>
}

interface UseStemPlayerReturn extends StemPlayerState {
    togglePlay: () => void
    seek: (time: number) => void
    setVolume: (stem: string, volume: number) => void
    toggleMute: (stem: string) => void
    toggleSolo: (stem: string) => void
}

export function useStemPlayer(stems: Record<string, string>): UseStemPlayerReturn {
    // Use individual players instead of Tone.Players
    const playersRef = useRef<Record<string, Tone.Player>>({})
    const channelNodesRef = useRef<Record<string, Tone.Channel>>({})

    // State
    const [isReady, setIsReady] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)

    const [volumes, setVolumes] = useState<Record<string, number>>({})
    const [muted, setMuted] = useState<Record<string, boolean>>({})
    const [solod, setSolod] = useState<Record<string, boolean>>({})

    const animationFrameRef = useRef<number>(0)
    const startTimeRef = useRef<number>(0)
    const pausedAtRef = useRef<number>(0)

    // Initialize initial state for stems
    useEffect(() => {
        const initialVolumes: Record<string, number> = {}
        const initialMuted: Record<string, boolean> = {}
        const initialSolod: Record<string, boolean> = {}

        Object.keys(stems).forEach(stem => {
            initialVolumes[stem] = 0 // 0 dB
            initialMuted[stem] = false
            initialSolod[stem] = false
        })

        setVolumes(initialVolumes)
        setMuted(initialMuted)
        setSolod(initialSolod)
    }, [stems])

    // Setup individual players
    useEffect(() => {
        let mounted = true
        const stemKeys = Object.keys(stems)

        console.log('🎵 Setting up stem players for:', stemKeys)

        const setupPlayers = async () => {
            // Cleanup previous
            Object.values(playersRef.current).forEach(p => p.dispose())
            Object.values(channelNodesRef.current).forEach(c => c.dispose())
            playersRef.current = {}
            channelNodesRef.current = {}

            // Create channels
            const channels: Record<string, Tone.Channel> = {}
            stemKeys.forEach(key => {
                channels[key] = new Tone.Channel(0, 0).toDestination()
            })
            channelNodesRef.current = channels

            // Load each stem individually
            const loadPromises = stemKeys.map(async (key) => {
                const url = stems[key]
                console.log(`Loading ${key} from ${url.substring(0, 50)}...`)

                try {
                    const player = new Tone.Player({
                        url: url,
                        onload: () => {
                            console.log(`✅ Loaded: ${key}`)
                        },
                        onerror: (err) => {
                            console.error(`❌ Error loading ${key}:`, err)
                        }
                    })

                    // Wait for buffer to load
                    await Tone.loaded()

                    player.connect(channels[key])
                    playersRef.current[key] = player

                    return player.buffer?.duration || 0
                } catch (err) {
                    console.error(`❌ Failed to load ${key}:`, err)
                    return 0
                }
            })

            try {
                const durations = await Promise.all(loadPromises)
                const maxDuration = Math.max(...durations.filter(d => d > 0))

                if (!mounted) return

                if (maxDuration > 0) {
                    setDuration(maxDuration)
                    setIsReady(true)
                    console.log('✅ All stems ready! Duration:', maxDuration)
                } else {
                    console.error('❌ No stems loaded successfully')
                }
            } catch (err) {
                console.error('❌ Error loading stems:', err)
            }
        }

        setupPlayers()

        return () => {
            mounted = false
            Object.values(playersRef.current).forEach(p => p.dispose())
            Object.values(channelNodesRef.current).forEach(c => c.dispose())
        }
    }, [stems])

    // Playback Control
    const togglePlay = useCallback(async () => {
        if (!isReady) return

        if (Tone.context.state === 'suspended') {
            await Tone.context.resume()
        }
        await Tone.start()

        if (isPlaying) {
            // Pause
            Object.values(playersRef.current).forEach(player => {
                if (player.state === 'started') {
                    player.stop()
                }
            })
            pausedAtRef.current = currentTime
            setIsPlaying(false)
        } else {
            // Play
            const startOffset = pausedAtRef.current
            startTimeRef.current = Tone.now() - startOffset

            Object.values(playersRef.current).forEach(player => {
                if (player.buffer?.loaded) {
                    player.start(Tone.now(), startOffset)
                }
            })
            setIsPlaying(true)
        }
    }, [isReady, isPlaying, currentTime])

    // Seek
    const seek = useCallback((time: number) => {
        if (!isReady) return
        const targetTime = Math.max(0, Math.min(time, duration))

        pausedAtRef.current = targetTime
        setCurrentTime(targetTime)

        if (isPlaying) {
            // Stop and restart at new position
            Object.values(playersRef.current).forEach(player => {
                if (player.state === 'started') {
                    player.stop()
                }
            })

            startTimeRef.current = Tone.now() - targetTime
            Object.values(playersRef.current).forEach(player => {
                if (player.buffer?.loaded) {
                    player.start(Tone.now(), targetTime)
                }
            })
        }
    }, [isReady, isPlaying, duration])

    // Volume Control
    const setVolume = useCallback((stem: string, volume: number) => {
        const channel = channelNodesRef.current[stem]
        if (channel) {
            channel.volume.value = volume
            setVolumes(prev => ({ ...prev, [stem]: volume }))
        }
    }, [])

    // Solo/Mute Logic
    const updateSoloMuteState = useCallback((
        newMuted: Record<string, boolean>,
        newSolod: Record<string, boolean>
    ) => {
        const hasSolo = Object.values(newSolod).some(v => v)

        Object.keys(stems).forEach(stem => {
            const channel = channelNodesRef.current[stem]
            if (!channel) return

            if (hasSolo) {
                channel.mute = !newSolod[stem]
            } else {
                channel.mute = newMuted[stem]
            }
        })
    }, [stems])

    const toggleMute = useCallback((stem: string) => {
        setMuted(prev => {
            const next = { ...prev, [stem]: !prev[stem] }
            updateSoloMuteState(next, solod)
            return next
        })
    }, [solod, updateSoloMuteState])

    const toggleSolo = useCallback((stem: string) => {
        setSolod(prev => {
            const next = { ...prev, [stem]: !prev[stem] }
            updateSoloMuteState(muted, next)
            return next
        })
    }, [muted, updateSoloMuteState])

    // Time Sync Loop
    useEffect(() => {
        if (!isPlaying) {
            cancelAnimationFrame(animationFrameRef.current)
            return
        }

        const loop = () => {
            const elapsed = Tone.now() - startTimeRef.current
            setCurrentTime(elapsed)

            if (duration > 0 && elapsed >= duration) {
                // Stop all players
                Object.values(playersRef.current).forEach(player => {
                    if (player.state === 'started') {
                        player.stop()
                    }
                })
                setIsPlaying(false)
                setCurrentTime(0)
                pausedAtRef.current = 0
            } else {
                animationFrameRef.current = requestAnimationFrame(loop)
            }
        }

        loop()

        return () => cancelAnimationFrame(animationFrameRef.current)
    }, [isPlaying, duration])

    return {
        isReady,
        isPlaying,
        currentTime,
        duration,
        volumes,
        muted,
        solod,
        togglePlay,
        seek,
        setVolume,
        toggleMute,
        toggleSolo
    }
}
