'use plain'
'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Play, Pause } from 'lucide-react'
import FloatingCTA from '@/components/FloatingCTA'
import KnobButton from '@/components/ui/KnobButton'

interface Project {
    id: string
    title: string
    image_url: string
    audio_url: string
    target_url: string | null
}

interface AudioState {
    pan: number
    frequency: number
}

interface InteractiveViewerProps {
    project: Project
    onTimeUpdate?: (time: number) => void
    // New Props
    pinMode?: boolean
    comments?: Comment[]
    onPinCreate?: (x: number, y: number, audioState: AudioState) => void
}

import { Comment } from '@/types' // Need to ensure Comment type is imported

export default function InteractiveViewer({ project, onTimeUpdate, pinMode = false, comments = [], onPinCreate }: InteractiveViewerProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isInteracting, setIsInteracting] = useState(false)
    const [activePinId, setActivePinId] = useState<string | null>(null)

    // Audio Context Refs
    const audioContextRef = useRef<AudioContext | null>(null)
    const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null)
    const gainNodeRef = useRef<GainNode | null>(null)
    const pannerNodeRef = useRef<StereoPannerNode | null>(null)
    const filterNodeRef = useRef<BiquadFilterNode | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Current Audio State Tracker (for Pin Capture)
    const audioState = useRef<AudioState>({ pan: 0, frequency: 20000 })

    // Time Update Handler
    useEffect(() => {
        const audio = audioRef.current
        if (!audio || !onTimeUpdate) return

        const handleTimeUpdate = () => {
            onTimeUpdate(audio.currentTime)
        }

        audio.addEventListener('timeupdate', handleTimeUpdate)
        return () => audio.removeEventListener('timeupdate', handleTimeUpdate)
    }, [onTimeUpdate])

    // Initialize Audio Logic
    useEffect(() => {
        if (!audioRef.current) return

        const initAudio = () => {
            if (!audioContextRef.current) {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext
                audioContextRef.current = new AudioContext()

                const audio = audioRef.current!
                audio.crossOrigin = "anonymous"

                const source = audioContextRef.current.createMediaElementSource(audio)
                const gain = audioContextRef.current.createGain()
                const panner = audioContextRef.current.createStereoPanner()
                const filter = audioContextRef.current.createBiquadFilter()

                // Filter setup
                filter.type = 'lowpass'
                filter.frequency.value = 20000 // Start open
                filter.Q.value = 1

                // Connect graph
                source.connect(filter)
                filter.connect(panner)
                panner.connect(gain)
                gain.connect(audioContextRef.current.destination)

                audioSourceRef.current = source
                gainNodeRef.current = gain
                pannerNodeRef.current = panner
                filterNodeRef.current = filter
            }
        }

        // We init on user interaction usually, but let's try to init eagerly if allowed, 
        // or just wait for play.
        // Actually, initAudio inside useEffect might run before user interaction -> warning.
        // Better to init on Play.

        return () => {
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close()
                audioContextRef.current = null
            }
        }
    }, [project])

    const ensureAudioContext = () => {
        if (!audioContextRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext
            audioContextRef.current = new AudioContext()

            const audio = audioRef.current!
            audio.crossOrigin = "anonymous"
            const source = audioContextRef.current.createMediaElementSource(audio)
            const filter = audioContextRef.current.createBiquadFilter()
            const panner = audioContextRef.current.createStereoPanner()
            const gain = audioContextRef.current.createGain()

            filter.type = 'lowpass'
            filter.frequency.value = 20000
            filter.Q.value = 1

            source.connect(filter)
            filter.connect(panner)
            panner.connect(gain)
            gain.connect(audioContextRef.current.destination)

            audioSourceRef.current = source
            pannerNodeRef.current = panner
            filterNodeRef.current = filter
            gainNodeRef.current = gain
        }
    }

    const togglePlay = async () => {
        if (!audioRef.current) return
        ensureAudioContext()

        if (audioContextRef.current?.state === 'suspended') {
            await audioContextRef.current.resume()
        }

        if (isPlaying) {
            audioRef.current.pause()
        } else {
            audioRef.current.play().catch(e => console.error("Play failed", e))
        }
        setIsPlaying(!isPlaying)
    }

    const handleInteraction = (clientX: number, clientY: number) => {
        // Block interaction if in Pin Mode or not ready
        if (pinMode || !audioContextRef.current || !pannerNodeRef.current || !filterNodeRef.current) return

        const width = window.innerWidth
        const height = window.innerHeight

        // X-axis: Panning (-1 Left to +1 Right)
        const panValue = (clientX / width) * 2 - 1
        pannerNodeRef.current.pan.setTargetAtTime(panValue, audioContextRef.current.currentTime, 0.1)

        // Y-axis: Filter Frequency
        const minFreq = 100
        const maxFreq = 20000
        const yRatio = clientY / height
        const frequency = maxFreq - (yRatio * (maxFreq - minFreq))
        filterNodeRef.current.frequency.setTargetAtTime(frequency, audioContextRef.current.currentTime, 0.1)

        // Update State Tracker
        audioState.current = { pan: panValue, frequency }
    }

    const restoreAudioState = (state: AudioState) => {
        if (!audioContextRef.current || !pannerNodeRef.current || !filterNodeRef.current) return

        pannerNodeRef.current.pan.setTargetAtTime(state.pan, audioContextRef.current.currentTime, 0.5)
        filterNodeRef.current.frequency.setTargetAtTime(state.frequency, audioContextRef.current.currentTime, 0.5)

        // Visual feedback? 
        // We might want to animate the view to match, but that's complex without canvas/webgl.
    }

    const handleCanvasClick = (e: React.MouseEvent) => {
        // If Pin Mode is ON, create a pin
        if (pinMode && onPinCreate) {
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;

            // Capture current audio state
            onPinCreate(x, y, audioState.current)
        } else {
            // Normal mode: Toggle Play
            // But we already have onClick handler.. lets move it here.
            if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).tagName === 'A') return
            togglePlay()
        }
    }

    const onMouseMove = (e: React.MouseEvent) => {
        handleInteraction(e.clientX, e.clientY)
    }

    const onTouchMove = (e: React.TouchEvent) => {
        handleInteraction(e.touches[0].clientX, e.touches[0].clientY)
    }

    return (
        <div
            className={`relative w-screen h-screen overflow-hidden bg-black select-none touch-none ${pinMode ? 'cursor-crosshair' : 'cursor-default'}`}
            onMouseMove={onMouseMove}
            onTouchMove={onTouchMove}
            onTouchStart={() => !pinMode && setIsInteracting(true)}
            onTouchEnd={() => setIsInteracting(false)}
            onMouseDown={() => !pinMode && setIsInteracting(true)}
            onMouseUp={() => setIsInteracting(false)}
            onClick={(e) => {
                // Clear active pin if clicking elsewhere
                if (!pinMode && activePinId) setActivePinId(null)
                handleCanvasClick(e)
            }}
        >
            <audio
                ref={audioRef}
                src={project.audio_url}
                loop
                playsInline
                crossOrigin="anonymous"
            />

            {/* Background Image with Effects */}
            <div className={`absolute inset-0 transition-transform duration-100 ease-linear ${isInteracting && !pinMode ? 'scale-110' : 'scale-100'}`}>
                <Image
                    src={project.image_url}
                    alt={project.title}
                    fill
                    className={`object-cover ${isInteracting && !pinMode ? 'animate-pulse-fast' : ''}`}
                    style={{
                        objectPosition: 'center',
                        filter: isInteracting && !pinMode ? 'contrast(1.2) brightness(1.1) hue-rotate(5deg)' : (pinMode ? 'grayscale(0.5)' : 'none'),
                        transition: 'filter 0.3s ease'
                    }}
                    priority
                />

                {isInteracting && !pinMode && (
                    <>
                        <div className="absolute inset-0 bg-red-500/10 mix-blend-color-dodge translate-x-1" />
                        <div className="absolute inset-0 bg-blue-500/10 mix-blend-color-dodge -translate-x-1" />
                    </>
                )}
            </div>

            {/* Pins Layer */}
            {comments.map((comment) => {
                const x = comment.meta?.x
                const y = comment.meta?.y
                const audioState = comment.meta?.audioState
                const isActive = activePinId === comment.id

                if (x === undefined || y === undefined) return null

                return (
                    <div
                        key={comment.id}
                        className="absolute z-30 group"
                        style={{ left: `${x}%`, top: `${y}%` }}
                    >
                        {/* Pin Point */}
                        <div
                            className="w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-[#39FF14] bg-[#39FF14]/20 shadow-[0_0_10px_#39FF14] cursor-pointer hover:scale-125 transition-transform animate-pulse"
                            onClick={(e) => {
                                e.stopPropagation() // Prevent creating new pin / toggling play
                                // Toggle active state (for mobile)
                                if (isActive) {
                                    setActivePinId(null)
                                } else {
                                    setActivePinId(comment.id)
                                }

                                if (audioState) restoreAudioState(audioState)
                            }}
                        />

                        {/* Tooltip - Visible on Hover OR if Active (Click/Tap) */}
                        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 transition-opacity pointer-events-none ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            <div className="bg-black/80 backdrop-blur-md border border-[#39FF14]/50 rounded p-2 text-xs text-white">
                                <p className="font-bold text-[#39FF14] mb-1">{comment.profiles?.username}</p>
                                <p>{comment.content}</p>
                            </div>
                        </div>
                    </div>
                )
            })}

            {/* Overlay UI */}
            <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 pointer-events-none">
                {/* Top Info */}
                <div className="flex justify-between items-start pointer-events-auto w-full">
                    {/* Left: Title */}
                    <div className="flex flex-col gap-1 mt-2">
                        <h1 className="text-white font-bold text-3xl drop-shadow-lg mix-blend-difference">{project.title}</h1>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col items-end gap-3">
                        <KnobButton href="/" size="md" className="shadow-lg group">
                            <span className="group-hover:-translate-x-1 transition-transform text-lg mb-0.5">←</span>
                            <span className="leading-none text-[9px]">BACK<br />FEED</span>
                        </KnobButton>

                        {project.target_url && (
                            <a
                                href={project.target_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white/80 text-xs hover:bg-white/20 transition-colors"
                            >
                                Visit Link ↗
                            </a>
                        )}
                    </div>
                </div>

                {/* Center CTA - Play Button (Only show if not playing AND not pin mode) */}
                {!isPlaying && !pinMode && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                        <button
                            onClick={(e) => { e.stopPropagation(); togglePlay() }}
                            className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center hover:scale-110 transition-transform group"
                        >
                            <Play className="w-8 h-8 text-white ml-1 group-hover:text-black transition-colors" fill="currentColor" />
                        </button>
                    </div>
                )}

                {/* Pin Mode Indicator */}
                {pinMode && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="px-6 py-3 bg-black/80 border border-[#39FF14] rounded-full text-[#39FF14] font-mono animate-bounce">
                            CLICK TO PIN
                        </div>
                    </div>
                )}

                {/* Bottom Control (Stop/Info) */}
                {isPlaying && !pinMode && (
                    <div className="self-center pointer-events-auto mb-16">
                        <button onClick={(e) => { e.stopPropagation(); togglePlay() }} className="p-4 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
                            <Pause size={24} />
                        </button>
                    </div>
                )}
            </div>

            {/* Floating CTA */}
            <FloatingCTA title={project.title} url={typeof window !== 'undefined' ? window.location.href : ''} />

            <style jsx global>{`
        @keyframes pulse-fast {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; transform: skewX(-2deg); }
        }
        .animate-pulse-fast {
          animation: pulse-fast 0.2s infinite;
        }
      `}</style>
        </div>
    )
}
