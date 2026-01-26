'use client'

import { useStemPlayer } from '@/hooks/useStemPlayer'
import { usePlaylistPlayer } from '@/contexts/PlaylistPlayerContext'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2, Maximize2, Minimize2, Play, Pause } from 'lucide-react'
import { useState, useEffect } from 'react'

interface StemMixerPanelProps {
    isOpen: boolean
    onClose: () => void
    stems: Record<string, string>
    title: string
}

export default function StemMixerPanel({ isOpen, onClose, stems, title }: StemMixerPanelProps) {
    const {
        isReady,
        isPlaying,
        volumes,
        muted,
        solod,
        togglePlay,
        setVolume,
        toggleMute,
        toggleSolo
    } = useStemPlayer(stems)

    const { pause: pauseGlobalPlayer } = usePlaylistPlayer()

    const handlePlayToggle = async () => {
        if (!isPlaying) {
            pauseGlobalPlayer()
            // Increased delay for mobile - allow global player to fully release AudioContext
            await new Promise(resolve => setTimeout(resolve, 150))
            togglePlay()
        } else {
            togglePlay()
        }
    }

    // Close panel logic? Maybe just minimize. 
    // If closed, we might want to stop playback or keep it running?
    // Usually a mixer implies control. If closed, maybe stop?
    // Let's assume closing stops for now to save resources, or we rely on parent to unmount.

    useEffect(() => {
        if (!isOpen && isPlaying) {
            togglePlay()
        }
    }, [isOpen])

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-zinc-950 border-t border-zinc-800"
                >
                    <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                Stem Mixer
                            </h4>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePlayToggle}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
                                >
                                    {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                                </button>

                                <button onClick={onClose} className="p-1 text-zinc-500 hover:text-white">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {!isReady ? (
                            <div className="py-8 flex justify-center">
                                <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-2">
                                {Object.keys(stems).map((stem) => (
                                    <div key={stem} className="bg-zinc-900 rounded-lg p-2 flex flex-col items-center gap-2">
                                        <div className="h-24 w-8 relative bg-zinc-800 rounded-full overflow-hidden group cursor-pointer group">
                                            {/* Vertical Slider Visual */}
                                            <div
                                                className="absolute bottom-0 left-0 w-full bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors"
                                                style={{ height: `${((volumes[stem] ?? 0) + 60) / 66 * 100}%` }}
                                            />
                                            <input
                                                type="range"
                                                min="-60"
                                                max="6"
                                                value={volumes[stem] ?? 0}
                                                onChange={(e) => setVolume(stem, Number(e.target.value))}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                style={{ appearance: 'slider-vertical', WebkitAppearance: 'slider-vertical' } as never}
                                            />
                                        </div>

                                        <span className="text-[10px] font-medium text-zinc-400 uppercase truncate w-full text-center">
                                            {stem}
                                        </span>

                                        <div className="flex flex-col gap-1 w-full">
                                            <button
                                                onClick={() => toggleSolo(stem)}
                                                className={`text-[9px] font-bold py-1 rounded transition-colors ${solod[stem] ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                                                    }`}
                                            >
                                                S
                                            </button>
                                            <button
                                                onClick={() => toggleMute(stem)}
                                                className={`text-[9px] font-bold py-1 rounded transition-colors ${muted[stem] ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                                                    }`}
                                            >
                                                M
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
