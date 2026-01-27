'use plain'
'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Play, Pause } from 'lucide-react'
import FloatingCTA from '@/components/FloatingCTA'
import KnobButton from '@/components/ui/KnobButton'
import { getGlobalAudioContext } from '@/lib/audio-context'

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
    hpFrequency?: number
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
    const lowPassFilterRef = useRef<BiquadFilterNode | null>(null)
    const highPassFilterRef = useRef<BiquadFilterNode | null>(null)
    const analyserNodeRef = useRef<AnalyserNode | null>(null)
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

        // Cleanup function for visualizer
        return () => {
            // DO NOT close the global context. Just disconnect nodes.
            if (gainNodeRef.current) gainNodeRef.current.disconnect()
            if (analyserNodeRef.current) analyserNodeRef.current.disconnect()
            if (pannerNodeRef.current) pannerNodeRef.current.disconnect()
            if (lowPassFilterRef.current) lowPassFilterRef.current.disconnect()
            if (highPassFilterRef.current) highPassFilterRef.current.disconnect()
            if (audioSourceRef.current) audioSourceRef.current.disconnect()

            // Clear Refs
            audioContextRef.current = null
            gainNodeRef.current = null
            analyserNodeRef.current = null
            pannerNodeRef.current = null
            lowPassFilterRef.current = null
            highPassFilterRef.current = null
            audioSourceRef.current = null
        }
    }, [project])

    const ensureAudioContext = async () => {
        if (!audioContextRef.current) {
            // Use Singleton Context instead of creating a new one
            const context = await getGlobalAudioContext()
            audioContextRef.current = context

            const audio = audioRef.current!
            audio.crossOrigin = "anonymous"

            try {
                // Check if source node already exists for this element to prevent "can only be connected to one node" error
                // In a singleton world, reusing the same <audio> element with the same context might throw if we try to createMediaElementSource again.
                // However, InteractiveViewer mounts/unmounts. The <audio> tag is new each time.
                // So createMediaElementSource is safe provided the <audio> element is fresh.

                // Create Nodes
                const source = context.createMediaElementSource(audio)
                const lowPass = context.createBiquadFilter()
                const highPass = context.createBiquadFilter()
                const panner = context.createStereoPanner()
                const analyser = context.createAnalyser()
                const gain = context.createGain()

                // Configure Nodes
                lowPass.type = 'lowpass'
                lowPass.frequency.value = 20000
                lowPass.Q.value = 1

                highPass.type = 'highpass'
                highPass.frequency.value = 0
                highPass.Q.value = 1

                analyser.fftSize = 256

                // Connect Graph: Source -> HP -> LP -> Panner -> Analyser -> Gain -> Dest
                source.connect(highPass)
                highPass.connect(lowPass)
                lowPass.connect(panner)
                panner.connect(analyser)
                analyser.connect(gain)
                gain.connect(context.destination)

                // Store Refs
                audioSourceRef.current = source
                pannerNodeRef.current = panner
                lowPassFilterRef.current = lowPass
                highPassFilterRef.current = highPass
                analyserNodeRef.current = analyser
                gainNodeRef.current = gain
            } catch (error) {
                console.error("Audio Graph Setup Error (Singleton):", error)
            }
        }
    }

    const togglePlay = async (fromStart = false) => {
        if (!audioRef.current) return
        await ensureAudioContext()

        if (isPlaying && !fromStart) {
            // Pause (Stop)
            audioRef.current.pause()

            // Note: Removed context.suspend() to avoid click/pop noises on resume
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
        if (pinMode || !audioContextRef.current || !pannerNodeRef.current || !lowPassFilterRef.current || !highPassFilterRef.current) return

        const width = window.innerWidth
        const height = window.innerHeight

        const xRatio = clientX / width
        const yRatio = clientY / height

        // X-axis: Panning (Deadzone Center 20% -> 0.4 to 0.6)
        let panValue = 0
        if (xRatio < 0.4) {
            // Map 0...0.4 to -1...0
            panValue = (xRatio / 0.4) - 1
        } else if (xRatio > 0.6) {
            // Map 0.6...1 to 0...1
            panValue = (xRatio - 0.6) / 0.4
        }
        // Clamp logic
        panValue = Math.max(-1, Math.min(1, panValue))

        pannerNodeRef.current.pan.setTargetAtTime(panValue, audioContextRef.current.currentTime, 0.1)

        // Y-axis: Bi-directional Filter
        // Deadzone: 0.3 to 0.7 (Center +/- 20%)

        let lpFreq = 20000
        let hpFreq = 0

        const minLpFreq = 100
        const maxHpFreq = 2000 // Cap HPF at 2kHz to avoid killing all sound

        if (yRatio < 0.35) {
            // UP: High Pass (Remove Bass)
            // 0.35 -> 0 (Min HPF) ... 0.0 (Max HPF)
            const ratio = (0.35 - yRatio) / 0.35
            hpFreq = ratio * maxHpFreq
        } else if (yRatio > 0.55) {
            // DOWN: Low Pass (Remove Treble)
            // 0.55 -> 20kHz ... 1.0 -> 100Hz
            const ratio = (yRatio - 0.55) / 0.45
            lpFreq = 20000 - (ratio * (20000 - minLpFreq))
        }

        lowPassFilterRef.current.frequency.setTargetAtTime(lpFreq, audioContextRef.current.currentTime, 0.1)
        highPassFilterRef.current.frequency.setTargetAtTime(hpFreq, audioContextRef.current.currentTime, 0.1)

        // Update State Tracker
        // @ts-ignore
        audioState.current = { pan: panValue, frequency: lpFreq, hpFrequency: hpFreq }
    }

    const restoreAudioState = (state: any) => {
        if (!audioContextRef.current || !pannerNodeRef.current || !lowPassFilterRef.current || !highPassFilterRef.current) return

        if (state.pan !== undefined) pannerNodeRef.current.pan.setTargetAtTime(state.pan, audioContextRef.current.currentTime, 0.5)
        if (state.frequency !== undefined) lowPassFilterRef.current.frequency.setTargetAtTime(state.frequency, audioContextRef.current.currentTime, 0.5)
        if (state.hpFrequency !== undefined) highPassFilterRef.current.frequency.setTargetAtTime(state.hpFrequency, audioContextRef.current.currentTime, 0.5)
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
                    <div className="absolute bottom-8 left-12 text-[10px] text-white/50 pointer-events-none select-none">
                        <div className="relative w-24 h-24 border-l border-b border-white/30">
                            {/* Y-Axis Label (FILTER) */}
                            <div className="absolute -left-9 top-0 flex flex-col items-center h-full justify-between py-0 pointer-events-none select-none">
                                <span className="text-zinc-300 text-[10px] whitespace-nowrap">Low pass</span>
                                <span className="text-zinc-400 text-[10px] tracking-widest -rotate-90 whitespace-nowrap">FILTER</span>
                                <span className="text-zinc-300 text-[10px] whitespace-nowrap">Hi-pass</span>
                            </div>

                            <div className="absolute -bottom-5 left-0 w-full flex justify-between px-0 pointer-events-none select-none">
                                <span className="text-zinc-300 text-sm">L</span>
                                <span className="text-zinc-400 text-[10px] tracking-widest">PAN</span>
                                <span className="text-zinc-300 text-sm">R</span>
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
        </div >
    )
}
