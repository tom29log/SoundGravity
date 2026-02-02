'use client'

import { useStemPlayer } from '@/hooks/useStemPlayer'
import { usePlaylistPlayer } from '@/contexts/PlaylistPlayerContext'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2, Maximize2, Minimize2, Play, Pause, Download, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import JSZip from 'jszip'

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
    const [isDownloading, setIsDownloading] = useState(false)

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

    const handleDownloadStems = async () => {
        if (isDownloading) return;
        setIsDownloading(true);

        try {
            const zip = new JSZip();
            const folder = zip.folder(`${title.replace(/[^a-z0-9]/gi, '_')}_stems`);

            // Fetch all stems in parallel
            const fetchPromises = Object.entries(stems).map(async ([name, url]) => {
                const response = await fetch(url);
                const blob = await response.blob();
                folder?.file(`${name}.mp3`, blob);
            });

            await Promise.all(fetchPromises);

            // Generate zip
            const content = await zip.generateAsync({ type: 'blob' });

            // Trigger download
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `${title}_stems.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        } catch (error) {
            console.error('Failed to download stems:', error);
            alert('Failed to download stems. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

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
                                    onClick={handleDownloadStems}
                                    disabled={!isReady || isDownloading}
                                    className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Download Stems"
                                >
                                    {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                </button>
                                <div className="h-4 w-px bg-zinc-800 mx-1"></div>
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

