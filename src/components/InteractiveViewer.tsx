'use plain'
'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Play, Pause } from 'lucide-react'
import FloatingCTA from '@/components/FloatingCTA'

interface Project {
    id: string
    title: string
    image_url: string
    audio_url: string
    target_url: string | null
}

export default function InteractiveViewer({ project }: { project: Project }) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isInteracting, setIsInteracting] = useState(false)

    // Audio Context Refs
    const audioContextRef = useRef<AudioContext | null>(null)
    const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null)
    const gainNodeRef = useRef<GainNode | null>(null)
    const pannerNodeRef = useRef<StereoPannerNode | null>(null)
    const filterNodeRef = useRef<BiquadFilterNode | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

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

                // Connect graph: Source -> Filter -> Panner -> Gain -> Dest
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

        return () => {
            // Cleanup if needed
            // Note: closing context in useEffect cleanup might break hot reload or navigation if component remounts
            // Just let it persist or close if page unmounts entirely
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close()
                audioContextRef.current = null
            }
        }
    }, [project])

    const togglePlay = async () => {
        if (!audioRef.current) return

        if (!audioContextRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext
            audioContextRef.current = new AudioContext()

            // Re-setup nodes if they don't exist
            const audio = audioRef.current
            audio.crossOrigin = "anonymous"
            const source = audioContextRef.current.createMediaElementSource(audio)
            const filter = audioContextRef.current.createBiquadFilter()
            const panner = audioContextRef.current.createStereoPanner()
            const gain = audioContextRef.current.createGain()

            filter.type = 'lowpass'
            filter.frequency.value = 20000

            source.connect(filter)
            filter.connect(panner)
            panner.connect(gain)
            gain.connect(audioContextRef.current.destination)

            audioSourceRef.current = source
            pannerNodeRef.current = panner
            filterNodeRef.current = filter
        }

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
        if (!audioContextRef.current || !pannerNodeRef.current || !filterNodeRef.current) return

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
    }

    const onMouseMove = (e: React.MouseEvent) => {
        handleInteraction(e.clientX, e.clientY)
    }

    const onTouchMove = (e: React.TouchEvent) => {
        handleInteraction(e.touches[0].clientX, e.touches[0].clientY)
    }

    return (
        <div
            className="relative w-screen h-screen overflow-hidden bg-black select-none touch-none"
            onMouseMove={onMouseMove}
            onTouchMove={onTouchMove}
            onTouchStart={() => setIsInteracting(true)}
            onTouchEnd={() => setIsInteracting(false)}
            onMouseDown={() => setIsInteracting(true)}
            onMouseUp={() => setIsInteracting(false)}
            onClick={(e) => {
                // Ignore clicks on buttons/links
                if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).tagName === 'A') return
                togglePlay()
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
            <div className={`absolute inset-0 transition-transform duration-100 ease-linear ${isInteracting ? 'scale-110' : 'scale-100'}`}>
                <Image
                    src={project.image_url}
                    alt={project.title}
                    fill
                    className={`object-cover ${isInteracting ? 'animate-pulse-fast' : ''}`}
                    style={{
                        objectPosition: 'center',
                        filter: isInteracting ? 'contrast(1.2) brightness(1.1) hue-rotate(5deg)' : 'none',
                        transition: 'filter 0.2s ease'
                    }}
                    priority
                />

                {isInteracting && (
                    <div className="absolute inset-0 bg-red-500/10 mix-blend-color-dodge translate-x-1" />
                )}
                {isInteracting && (
                    <div className="absolute inset-0 bg-blue-500/10 mix-blend-color-dodge -translate-x-1" />
                )}
            </div>

            {/* Overlay UI */}
            <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 pointer-events-none">
                {/* Top Info */}
                <div className="flex justify-between items-start pointer-events-auto">
                    <h1 className="text-white font-bold text-xl drop-shadow-lg mix-blend-difference">{project.title}</h1>
                    {project.target_url && (
                        <a
                            href={project.target_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm hover:bg-white/40 transition-colors"
                        >
                            Visit Link
                        </a>
                    )}
                </div>

                {/* Center CTA - Play Button */}
                {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                        <button
                            onClick={togglePlay}
                            className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center hover:scale-110 transition-transform group"
                        >
                            <Play className="w-8 h-8 text-white ml-1 group-hover:text-black transition-colors" fill="currentColor" />
                        </button>
                    </div>
                )}

                {/* Bottom Control (Stop/Info) */}
                {isPlaying && (
                    <div className="self-center pointer-events-auto mb-16">
                        <button onClick={togglePlay} className="p-4 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
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
