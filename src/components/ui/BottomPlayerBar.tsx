'use client'

import { usePlaylistPlayer } from '@/contexts/PlaylistPlayerContext'
import { Play, Pause, SkipForward, Disc, Activity, Square, FastForward } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export default function BottomPlayerBar() {
    const {
        trackA,
        trackB,
        activeDeck,
        isPlaying,
        play,
        pause,
        next,
        autoMixMode,
        toggleAutoMixMode,
        mixingState,
        deckA,
        deckB,
        masterBpm
    } = usePlaylistPlayer()

    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    if (!mounted) return null

    // Always show bar if there is at least one track loaded, or simply always show it?
    // User requested "Simplification" and "Alignment".

    // Hide if no tracks are loaded
    if (!trackA && !trackB) return null

    const currentTrack = activeDeck === 'A' ? trackA : trackB
    const nextTrack = activeDeck === 'A' ? trackB : trackA
    const currentDeck = activeDeck === 'A' ? deckA : deckB

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "00:00:00"
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = Math.floor(seconds % 60)
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[200] bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 shadow-2xl pb-safe">
            {/* Progress Bar (Top of Bar) */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-900 cursor-pointer group">
                <div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-100 ease-linear"
                    style={{ width: `${(currentDeck?.progress || 0) * 100}%` }}
                />
                {/* Hover effect could go here */}
            </div>

            <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between gap-6">

                {/* 1. Left: Track Info */}
                <div className="flex items-center gap-4 w-1/3 min-w-0">
                    {currentTrack ? (
                        <>
                            {/* Artwork */}
                            <div className={`relative w-12 h-12 rounded-md overflow-hidden bg-zinc-900 shadow-lg flex-shrink-0 group ${isPlaying ? 'animate-pulse-slow' : ''}`}>
                                <img src={currentTrack.image_url} alt={currentTrack.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                            </div>

                            {/* Text Info */}
                            <div className="flex flex-col min-w-0 justify-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-white truncate leading-tight hover:underline cursor-pointer">
                                        {currentTrack.title}
                                    </span>
                                    {/* BPM Badge (if DJ Mode) */}
                                    <span className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                                        {currentTrack.bpm ? `${Math.round(currentTrack.bpm)} BPM` : 'No BPM'}
                                    </span>
                                </div>
                                <span className="text-xs text-zinc-400 truncate leading-tight hover:text-zinc-300 cursor-pointer">
                                    {currentTrack.profiles?.username}
                                </span>
                            </div>
                        </>
                    ) : (
                        // Should not happen due to check above, but keep as fallback just in case or for smooth transitions if adapted later
                        <div className="flex items-center gap-3 opacity-50">
                            <div className="w-12 h-12 rounded-md bg-zinc-900" />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-zinc-700">Loading...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Center: Playback Controls */}
                <div className="flex flex-col items-center justify-center flex-1 gap-2">
                    <div className="flex items-center gap-6">
                        {/* Mixset Toggle (Small) */}
                        <button
                            onClick={toggleAutoMixMode}
                            className={`p-2 rounded-full transition-all duration-300
                            ${autoMixMode
                                    ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
                            title={autoMixMode ? "DJ Mode ON" : "DJ Mode OFF"}
                        >
                            <Activity size={16} />
                        </button>

                        {/* Main Controls */}
                        <div className="flex items-center gap-4">
                            {/* Stop */}
                            {autoMixMode && (
                                <button
                                    onClick={() => { pause(); /* stop logic */ }}
                                    className="p-2 text-zinc-400 hover:text-white transition-colors"
                                >
                                    <Square size={16} fill="currentColor" />
                                </button>
                            )}

                            {/* Play/Pause */}
                            <button
                                onClick={isPlaying ? pause : play}
                                className="w-12 h-12 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg"
                                disabled={!currentTrack}
                            >
                                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                            </button>

                            {/* Next */}
                            <button
                                onClick={next}
                                className="p-2 text-zinc-400 hover:text-white transition-colors hover:scale-105"
                                disabled={!nextTrack}
                            >
                                <SkipForward size={24} fill="currentColor" />
                            </button>
                        </div>

                        {/* Spacer to balance center */}
                        <div className="w-8" />
                    </div>

                    {/* Clock & Status */}
                    <div className="flex items-center gap-3 text-xs font-mono font-medium tracking-wider text-zinc-500">
                        <span>{currentTrack ? formatTime(currentDeck.currentTime) : '00:00:00'}</span>
                        {/* Status Separator */}
                        {mixingState !== 'idle' && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                <span className={`${mixingState === 'mixing' ? 'text-yellow-500 animate-pulse' : 'text-blue-500'}`}>
                                    {mixingState === 'mixing' ? 'MIXING' : 'CUEING'}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* 3. Right: Next Track / Volume / Tools */}
                <div className="flex items-center justify-end w-1/3 gap-4 min-w-0">
                    {nextTrack ? (
                        <div className="flex items-center gap-3 group cursor-pointer opacity-60 hover:opacity-100 transition-opacity">
                            <div className="flex flex-col items-end min-w-0">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Next Up</span>
                                <span className="text-xs font-medium text-zinc-300 truncate max-w-[120px]">{nextTrack.title}</span>
                            </div>
                            <div className="active-deck-b w-10 h-10 rounded bg-zinc-800 overflow-hidden shadow-inner flex-shrink-0">
                                <img src={nextTrack.image_url} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs text-zinc-700 font-mono text-right">No Next Track</div>
                    )}
                </div>
            </div>
        </div>
    )
}
