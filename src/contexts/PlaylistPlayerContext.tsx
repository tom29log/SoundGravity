'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { Project } from '@/types'

interface DeckState {
    track: Project | null
    isPlaying: boolean
    volume: number
    progress: number
    currentTime: number
    duration: number
}

interface PlaylistPlayerContextType {
    // Queue
    queue: Project[]
    currentIndex: number
    addToQueue: (tracks: Project[]) => void
    playPlaylist: (tracks: Project[], startIndex?: number) => void

    // Decks
    trackA: Project | null
    trackB: Project | null
    deckA: DeckState
    deckB: DeckState
    activeDeck: 'A' | 'B'

    // Playback
    isPlaying: boolean
    play: () => void
    pause: () => void
    next: () => void
    previous: () => void

    // Mixer
    isMixing: boolean
    transitionProgress: number

    // Sync
    updateDeckMetrics: (deck: 'A' | 'B', metrics: { currentTime: number, duration: number }) => void
    stopSignal: number
    stop: () => void
    clear: () => void

    // Auto-Mix & DJ State
    autoMixMode: boolean
    toggleAutoMixMode: () => void
    masterBpm: number
    setMasterBpm: (bpm: number) => void
    mixingState: 'idle' | 'cueing' | 'mixing'
    setMixingState: (state: 'idle' | 'cueing' | 'mixing') => void

    // Calculated Playback Rates (for BPM Sync)
    deckAPlaybackRate: number
    deckBPlaybackRate: number
}

const PlaylistPlayerContext = createContext<PlaylistPlayerContextType | null>(null)

export function PlaylistPlayerProvider({ children }: { children: ReactNode }) {
    // State
    const [queue, setQueue] = useState<Project[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)

    const [trackA, setTrackA] = useState<Project | null>(null)
    const [trackB, setTrackB] = useState<Project | null>(null)
    const [activeDeck, setActiveDeck] = useState<'A' | 'B'>('A')

    const [isPlaying, setIsPlaying] = useState(false)
    const [isMixing, setIsMixing] = useState(false)
    const [transitionProgress, setTransitionProgress] = useState(0)

    // DJ Mode State
    const [autoMixMode, setAutoMixMode] = useState(false)
    const [masterBpm, setMasterBpm] = useState(124)
    const [mixingState, setMixingState] = useState<'idle' | 'cueing' | 'mixing'>('idle')

    // Dynamic Playback Rates
    // Simple logic: if autoMixMode is on, rate = masterBpm / trackBpm
    // Ideally calculated in effect
    const [deckAPlaybackRate, setDeckARate] = useState(1)
    const [deckBPlaybackRate, setDeckBRate] = useState(1)

    // Actions
    const playPlaylist = useCallback((tracks: Project[], startIndex = 0) => {
        setQueue(tracks)
        setCurrentIndex(startIndex)

        // Reset Decks
        setActiveDeck('A')
        setTrackA(tracks[startIndex])
        setTrackB(tracks[startIndex + 1] || null)

        setIsPlaying(true)
    }, [])

    const addToQueue = useCallback((tracks: Project[]) => {
        setQueue(prev => [...prev, ...tracks])
    }, [])

    // Sync
    const [stopSignal, setStopSignal] = useState(0)
    const [deckAMetrics, setDeckAMetrics] = useState({ currentTime: 0, duration: 0 })
    const [deckBMetrics, setDeckBMetrics] = useState({ currentTime: 0, duration: 0 })

    const updateDeckMetrics = useCallback((deck: 'A' | 'B', metrics: { currentTime: number, duration: number }) => {
        if (deck === 'A') setDeckAMetrics(metrics)
        else setDeckBMetrics(metrics)
    }, [])

    const play = useCallback(() => setIsPlaying(true), [])
    const pause = useCallback(() => setIsPlaying(false), [])

    const stop = useCallback(() => {
        setIsPlaying(false)
        setStopSignal(prev => prev + 1)
    }, [])

    const clear = useCallback(() => {
        setIsPlaying(false)
        setTrackA(null)
        setTrackB(null)
        setQueue([])
        setCurrentIndex(0)
        setStopSignal(prev => prev + 1)
    }, [])

    const next = useCallback(() => {
        const nextIndex = currentIndex + 1
        if (nextIndex >= queue.length) return // End of queue

        setCurrentIndex(nextIndex)

        // Toggle Active Deck
        const newActive = activeDeck === 'A' ? 'B' : 'A'
        setActiveDeck(newActive)

        // Load next track into the NOW inactive deck (ready for next mix)
        const nextNextIndex = nextIndex + 1
        const nextTrack = queue[nextNextIndex] || null

        if (newActive === 'A') {
            // A became active (was B). B was playing index.
            // Wait, if A became active, it means we just transitioned TO A. 
            // So A is playing `nextIndex`.
            // We need to prep B with `nextIndex + 1`.
            setTrackB(nextTrack)
        } else {
            // B became active. A needs prep.
            setTrackA(nextTrack)
        }
    }, [currentIndex, queue, activeDeck])

    // Better: Refactor next/prev to useReducer in future. For now, just fix the crash.
    // The main crash cause is updateDeckMetrics missing.

    // Fix next/prev later interactively if needed. 
    // Just adding updateDeckMetrics.

    // Exposed Deck Objects with Metrics merged
    const deckA = {
        track: trackA,
        isPlaying: isPlaying && activeDeck === 'A',
        volume: 0,
        progress: deckAMetrics.duration > 0 ? deckAMetrics.currentTime / deckAMetrics.duration : 0,
        currentTime: deckAMetrics.currentTime,
        duration: deckAMetrics.duration
    }
    const deckB = {
        track: trackB,
        isPlaying: isPlaying && activeDeck === 'B',
        volume: 0,
        progress: deckBMetrics.duration > 0 ? deckBMetrics.currentTime / deckBMetrics.duration : 0,
        currentTime: deckBMetrics.currentTime,
        duration: deckBMetrics.duration
    }

    return (
        <PlaylistPlayerContext.Provider value={{
            queue,
            currentIndex,
            addToQueue,
            playPlaylist,
            trackA,
            trackB,
            deckA,
            deckB,
            activeDeck,
            isPlaying,
            play,
            pause,
            stop,
            clear,
            next,
            previous: () => { },
            isMixing,
            transitionProgress,
            updateDeckMetrics,
            stopSignal,
            autoMixMode,
            toggleAutoMixMode: () => setAutoMixMode(prev => !prev),
            masterBpm,
            setMasterBpm,
            mixingState,
            setMixingState,
            deckAPlaybackRate,
            deckBPlaybackRate
        }}>
            {children}
        </PlaylistPlayerContext.Provider>
    )
}

export function usePlaylistPlayer() {
    const context = useContext(PlaylistPlayerContext)
    if (!context) throw new Error('usePlaylistPlayer must be used within PlaylistPlayerProvider')
    return context
}
