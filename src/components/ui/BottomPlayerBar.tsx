'use client'

import { usePlaylistPlayer } from '@/contexts/PlaylistPlayerContext'
import { Play, Pause, SkipForward, Disc, Activity, Square, FastForward, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

export default function BottomPlayerBar() {

    const {
        trackA,
        trackB,
        activeDeck,
        isPlaying,
        play,
        pause,
        next,
        stop,
        autoMixMode,
        toggleAutoMixMode,
        mixingState,
        deckA,
        deckB,
        clear
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
            </div>

            <div className="max-w-screen-2xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-2 md:gap-6">

                {/* 1. Top/Left: Track Info - On mobile, show current track info at the top */}
                <div className="flex items-center justify-between w-full md:w-1/3 min-w-0">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                        {currentTrack ? (
                            <>
                                {/* Artwork */}
                                <div className={`relative w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-zinc-900 shadow-lg flex-shrink-0 group ${isPlaying ? 'animate-spin-slow' : ''}`}>
                                    <Image src={currentTrack.image_url} alt={currentTrack.title} fill className="object-cover" />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors rounded-full" />
                                    {/* Center Hole for Vinyl Look */}
                                    <div className="absolute inset-0 m-auto w-3 h-3 bg-black rounded-full shadow-inner" />
                                </div>

                                {/* Text Info */}
                                <div className="flex flex-col min-w-0 justify-center flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-white truncate leading-tight hover:underline cursor-pointer">
                                            {currentTrack.title}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-zinc-400 truncate leading-tight hover:text-zinc-300 cursor-pointer">
                                            {currentTrack.profiles?.username}
                                        </span>
                                        {/* BPM Badge */}
                                        <span className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded border border-blue-500/20">
                                            {currentTrack.bpm ? `${Math.round(currentTrack.bpm)} BPM` : 'No BPM'}
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-3 opacity-50">
                                <div className="w-10 h-10 rounded-full bg-zinc-900" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-zinc-700">Loading...</span>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Close Button on Mobile (Moved from right) */}
                    <button
                        onClick={clear}
                        className="md:hidden p-2 text-zinc-600 hover:text-red-400 transition-colors ml-2 bg-zinc-900 rounded-full"
                        title="Close Player"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 2. Center: Playback Controls & Mixer Elements */}
                <div className="flex flex-col items-center justify-center w-full md:flex-1 gap-2">
                    <div className="flex items-center justify-between w-full md:justify-center md:gap-8 bg-zinc-900/50 md:bg-transparent rounded-2xl px-4 py-2 md:p-0">

                        {/* Mixset Toggle */}
                        <div className="flex flex-col items-center gap-1">
                            <button
                                onClick={toggleAutoMixMode}
                                className={`p-2.5 rounded-full transition-all duration-300 border
                                ${autoMixMode
                                        ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] border-blue-400'
                                        : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:bg-zinc-800'}`}
                                title={autoMixMode ? "Auto-Mix ON" : "Auto-Mix OFF"}
                            >
                                <Activity size={16} />
                            </button>
                            <span className={`text-[9px] font-medium leading-none ${autoMixMode ? 'text-blue-400' : 'text-zinc-600'} hidden md:block`}>
                                Auto-Mix
                            </span>
                        </div>

                        {/* Main Controls */}
                        <div className="flex items-center gap-4 md:gap-6 bg-zinc-900 md:bg-transparent rounded-full px-2 py-1 md:p-0 shadow-inner md:shadow-none border border-zinc-800/50 md:border-0">
                            {/* Stop */}
                            <button
                                onClick={stop}
                                className="p-2 text-zinc-500 hover:text-white transition-colors"
                                title="Stop and Go to Beginning"
                            >
                                <Square size={16} fill="currentColor" />
                            </button>

                            {/* Play/Pause (Mixer Jog Wheel Style) */}
                            <button
                                onClick={isPlaying ? pause : play}
                                className="relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_4px_15px_rgba(0,0,0,0.5)] border-2 border-zinc-800 group"
                                disabled={!currentTrack}
                            >
                                <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-zinc-900 to-zinc-800 shadow-inner" />
                                <div className={`relative z-10 ${isPlaying ? 'text-blue-400' : 'text-white group-hover:text-blue-300'} transition-colors`}>
                                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                                </div>
                                {/* LED Ring Indicator */}
                                {isPlaying && (
                                    <div className="absolute inset-0 rounded-full border-2 border-blue-500/50 animate-pulse-slow" />
                                )}
                            </button>

                            {/* Next */}
                            <button
                                onClick={async () => {
                                    if (typeof window !== 'undefined') {
                                        const Tone = await import('tone')
                                        if (Tone.context.state !== 'running') {
                                            await Tone.start()
                                        }
                                    }
                                    next()
                                }}
                                className="p-2 text-zinc-500 hover:text-white transition-colors hover:scale-105"
                                disabled={!nextTrack}
                            >
                                <SkipForward size={24} fill="currentColor" />
                            </button>
                        </div>

                        {/* Time Display for Mobile (Moved into control band) */}
                        <div className="flex flex-col items-end md:hidden">
                            <span className="text-xs font-mono font-medium tracking-wider text-blue-400">
                                {currentTrack ? formatTime(currentDeck.currentTime) : '00:00:00'}
                            </span>
                            {/* Status Separator */}
                            {mixingState !== 'idle' && (
                                <span className={`text-[9px] font-bold tracking-widest ${mixingState === 'mixing' ? 'text-yellow-500 animate-pulse' : 'text-blue-500'}`}>
                                    {mixingState === 'mixing' ? 'MIXING' : 'CUEING'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Right: Next Track & Display (Hidden on very small screens, displayed normally on MD) */}
                <div className="hidden md:flex items-center justify-end w-1/3 gap-4 min-w-0">
                    {/* Time Display for Desktop */}
                    <div className="flex flex-col items-end mr-4 border-r border-zinc-800 pr-4">
                        <span className="text-sm font-mono font-medium tracking-wider text-blue-400">
                            {currentTrack ? formatTime(currentDeck.currentTime) : '00:00:00'}
                        </span>
                        {mixingState !== 'idle' && (
                            <span className={`text-[10px] font-bold tracking-widest mt-1 ${mixingState === 'mixing' ? 'text-yellow-500 animate-pulse' : 'text-blue-500'}`}>
                                {mixingState === 'mixing' ? 'MIXING' : 'CUEING'}
                            </span>
                        )}
                    </div>

                    {nextTrack ? (
                        <div className="flex items-center gap-3 group cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
                            <div className="flex flex-col items-end min-w-0">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Next Up</span>
                                <span className="text-xs font-medium text-zinc-300 truncate max-w-[120px]">{nextTrack.title}</span>
                            </div>
                            <div className="relative w-10 h-10 rounded-full bg-zinc-800 overflow-hidden shadow-inner flex-shrink-0">
                                <Image src={nextTrack.image_url} alt="" fill className="object-cover grayscale group-hover:grayscale-0 transition-all" />
                                <div className="absolute inset-0 m-auto w-2 h-2 bg-black rounded-full shadow-inner" />
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs text-zinc-700 font-mono text-right">No Next Track</div>
                    )}

                    {/* Close Button on Desktop */}
                    <button
                        onClick={clear}
                        className="p-2 ml-2 text-zinc-600 hover:text-red-400 transition-colors bg-zinc-900 rounded-full hover:bg-zinc-800"
                        title="Close Player"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}
