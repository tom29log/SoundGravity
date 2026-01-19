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
    const analyserNodeRef = useRef<AnalyserNode | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const animationFrameRef = useRef<number | null>(null)

    // Current Audio State Tracker (for Pin Capture)
    const audioState = useRef<AudioState>({ pan: 0, frequency: 20000 })

    // Visualizer Drawer
    const drawVisualizer = () => {
        if (!canvasRef.current || !analyserNodeRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const analyser = analyserNodeRef.current

        if (!ctx) return

        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        const draw = () => {
            animationFrameRef.current = requestAnimationFrame(draw)
            analyser.getByteFrequencyData(dataArray)

            const width = canvas.width
            const height = canvas.height

            ctx.clearRect(0, 0, width, height)

            const barWidth = (width / bufferLength) * 2.5
            let barHeight
            let x = 0

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2 // Scale down

                // Color calculation based on height/frequency
                const r = barHeight + (25 * (i / bufferLength))
                const g = 250 * (i / bufferLength)
                const b = 50

                ctx.fillStyle = `rgb(${r},${g},${b})`
                // Draw bars at the bottom
                ctx.fillRect(x, height - barHeight, barWidth, barHeight)

                x += barWidth + 1
            }
        }
        draw()
    }

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

        // Cleanup function for visualizer
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
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

            // Create Nodes
            const source = audioContextRef.current.createMediaElementSource(audio)
            const filter = audioContextRef.current.createBiquadFilter()
            const panner = audioContextRef.current.createStereoPanner()
            const analyser = audioContextRef.current.createAnalyser()
            const gain = audioContextRef.current.createGain()

            // Configure Nodes
            filter.type = 'lowpass'
            filter.frequency.value = 20000
            filter.Q.value = 1

            analyser.fftSize = 256 // Resolution of visualizer

            // Connect Graph: Source -> Filter -> Panner -> Analyser -> Gain -> Dest
            source.connect(filter)
            filter.connect(panner)
            panner.connect(analyser)
            analyser.connect(gain)
            gain.connect(audioContextRef.current.destination)

            // Store Refs
            audioSourceRef.current = source
            pannerNodeRef.current = panner
            filterNodeRef.current = filter
            analyserNodeRef.current = analyser
            gainNodeRef.current = gain
        }
    }

    const togglePlay = async (fromStart = false) => {
        if (!audioRef.current) return
        ensureAudioContext()

        if (isPlaying && !fromStart) {
            // Pause (Stop)
            audioRef.current.pause()

            // Note: Removed context.suspend() to avoid click/pop noises on resume
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
            setIsPlaying(false)
        } else {
            // Play (Restart)
            // Ensure context is running (usually it is if we don't suspend, but check mostly for initial interaction)

            // "다시 화면터치시 첨부터 플레이" -> Restart
            audioRef.current.currentTime = 0

            // Anti-pop: Clear gain ramp and fade-in quickly
            if (gainNodeRef.current && audioContextRef.current) {
                const now = audioContextRef.current.currentTime
                const gain = gainNodeRef.current.gain
                gain.cancelScheduledValues(now)
                gain.setValueAtTime(0, now)
                gain.linearRampToValueAtTime(1, now + 0.02) // 20ms quick fade-in to prevent click
            }

            audioRef.current.play().catch(e => console.error("Play failed", e))
            // Start Visualizer
            drawVisualizer()
            setIsPlaying(true)
        }
    }

    // Auto-play on enter
    useEffect(() => {
        // Attempt auto-play
        const timer = setTimeout(() => {
            if (!isPlaying) {
                togglePlay(true) // Force start
            }
        }, 500) // Small delay to ensure DOM/AudioContext readiness
        return () => clearTimeout(timer)
    }, [])

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

        if (state.pan !== undefined) pannerNodeRef.current.pan.setTargetAtTime(state.pan, audioContextRef.current.currentTime, 0.5)
        if (state.frequency !== undefined) filterNodeRef.current.frequency.setTargetAtTime(state.frequency, audioContextRef.current.currentTime, 0.5)
    }

    const handleCanvasClick = (e: React.MouseEvent) => {
        // If Pin Mode is ON, create a pin
        if (pinMode && onPinCreate) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); // Use currentTarget for the container
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;

            // Capture current audio state
            onPinCreate(x, y, audioState.current)
        } else {
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
            </div>

            {/* Visualizer Layer (Bottom Overlay) */}
            <div className="absolute inset-x-0 bottom-0 h-32 z-10 pointer-events-none opacity-80 mix-blend-screen">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                    width={1000}
                    height={200}
                />
            </div>

            {/* Pins Layer (Only Visible if FileMode is TRUE) */}
            {pinMode && comments.map((comment) => {
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
                                e.stopPropagation()
                                if (isActive) {
                                    setActivePinId(null)
                                } else {
                                    setActivePinId(comment.id)
                                }
                                if (audioState) restoreAudioState(audioState)
                            }}
                        />

                        {/* Tooltip */}
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
                    <div className="flex flex-col gap-1 mt-2">
                        <h1 className="text-white font-bold text-3xl drop-shadow-lg mix-blend-difference">{project.title}</h1>
                    </div>
                    <div className="flex flex-col items-end gap-3 z-50">
                        {/* Back Feed Button with Squircle Backdrop */}
                        <KnobButton
                            href="/"
                            size="md"
                            className="group !bg-black/40 !backdrop-blur-md !border-white/20 hover:!bg-black/60 shadow-lg"
                        >
                            <span className="leading-none text-[9px]">BACK<br />FEED</span>
                        </KnobButton>

                        {project.target_url && (
                            <a
                                href={project.target_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs hover:bg-black/60 transition-colors border border-white/20 shadow-lg"
                            >
                                Visit Link ↗
                            </a>
                        )}
                    </div>
                </div>

                {/* Center CTA - Play Button REMOVED (Invisible Touch Area covers whole screen) */}

                {/* Pin Mode Indicator */}
                {pinMode && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="px-6 py-3 bg-black/80 border border-[#39FF14] rounded-full text-[#39FF14] font-mono animate-bounce shadow-[0_0_15px_#39FF14]">
                            PIN MODE ON
                        </div>
                    </div>
                )}

                {/* Audio Control Map (Guide) - Bottom Left */}
                {!pinMode && (
                    <div className="absolute bottom-8 left-6 text-[10px] text-white/50 pointer-events-none select-none">
                        <div className="relative w-24 h-24 border-l border-b border-white/30">
                            {/* Y Axis Label */}
                            <div className="absolute -left-5 top-0 flex flex-col items-center h-full justify-between py-1">
                                <span>High</span>
                                <span className="rotate-[-90deg] origin-center text-[8px] tracking-widest opacity-70">FILTER</span>
                                <span>Low</span>
                            </div>

                            {/* X Axis Label */}
                            <div className="absolute -bottom-5 left-0 w-full flex justify-between px-1">
                                <span>L</span>
                                <span className="text-[8px] tracking-widest opacity-70">PAN</span>
                                <span>R</span>
                            </div>

                            {/* Touch Indicator - Center Dot */}
                            {isInteracting && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-full h-full border border-dashed border-white/10 rounded-full animate-pulse" />
                                </div>
                            )}

                            {/* Guide Arrows */}
                            <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100">
                                <path d="M50 95 L50 5" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
                                <path d="M5 50 L95 50" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
                            </svg>
                        </div>
                    </div>
                )}

                {/* Bottom Control (Stop) REMOVED */}
            </div>

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
