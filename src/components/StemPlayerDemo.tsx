'use client'

import { useStemPlayer } from '@/hooks/useStemPlayer'
import { Play, Pause, Volume2, VolumeX, Headphones } from 'lucide-react'

// Demo stems (using short free samples or URLs)
// In a real scenario, these would come from the uploaded project data
const DEMO_STEMS = {
    vocal: 'https://tonejs.github.io/audio/berklee/gong_1.mp3', // Placeholder: Gong as Vocal
    drum: 'https://tonejs.github.io/audio/drum-samples/CR78/kick.mp3', // Kick as Drum
    bass: 'https://tonejs.github.io/audio/berklee/gitar_1.mp3', // Guitar as Bass
    synth: 'https://tonejs.github.io/audio/berklee/choir_1.mp3' // Choir as Synth
}

export default function StemPlayerDemo() {
    const {
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
    } = useStemPlayer(DEMO_STEMS)

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-zinc-100 max-w-2xl mx-auto mt-10">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Headphones className="text-blue-500" />
                Stem Player Demo
            </h2>

            {/* Main Controls */}
            <div className="flex flex-col gap-4 mb-8 bg-zinc-950 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                    <button
                        onClick={togglePlay}
                        disabled={!isReady}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isReady
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40'
                                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                            }`}
                    >
                        {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
                    </button>

                    <div className="text-right">
                        <div className="text-2xl font-mono font-bold text-blue-400">
                            {formatTime(currentTime)}
                        </div>
                        <div className="text-xs text-zinc-500">
                            / {formatTime(duration)}
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full h-2 bg-zinc-800 rounded-full cursor-pointer group"
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const percent = (e.clientX - rect.left) / rect.width
                        seek(percent * duration)
                    }}
                >
                    <div
                        className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-100"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm"
                        style={{ left: `${(currentTime / duration) * 100}%` }}
                    />
                </div>
            </div>

            {/* Mixer */}
            {!isReady ? (
                <div className="text-center py-10 text-zinc-500 animate-pulse">
                    Loading stems...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(DEMO_STEMS).map((stem) => (
                        <div key={stem} className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-medium capitalize text-zinc-300">{stem}</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => toggleSolo(stem)}
                                        className={`px-2 py-0.5 text-xs font-bold rounded border ${solod[stem]
                                                ? 'bg-yellow-500 border-yellow-500 text-black'
                                                : 'bg-transparent border-zinc-600 text-zinc-500 hover:border-yellow-500/50 hover:text-yellow-500'
                                            }`}
                                    >
                                        S
                                    </button>
                                    <button
                                        onClick={() => toggleMute(stem)}
                                        className={`px-2 py-0.5 text-xs font-bold rounded border ${muted[stem]
                                                ? 'bg-red-500/20 border-red-500 text-red-500'
                                                : 'bg-transparent border-zinc-600 text-zinc-500 hover:border-red-500/50 hover:text-red-500'
                                            }`}
                                    >
                                        M
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Volume2 size={16} className="text-zinc-500" />
                                <input
                                    type="range"
                                    min="-60"
                                    max="6"
                                    value={volumes[stem] ?? 0}
                                    onChange={(e) => setVolume(stem, Number(e.target.value))}
                                    className="flex-1 w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-zinc-400 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-white"
                                />
                                <span className="text-xs text-zinc-500 w-8 text-right">
                                    {Math.round(volumes[stem] ?? 0)}dB
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
