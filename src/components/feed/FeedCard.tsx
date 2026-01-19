'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { Project } from '@/types'
import { createClient } from '@/lib/supabase'

interface FeedCardProps {
    project: Project
    onCommentClick?: () => void
}

export default function FeedCard({ project }: FeedCardProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [liked, setLiked] = useState(false)
    const [likeCount, setLikeCount] = useState(0)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const fadeInterval = useRef<NodeJS.Timeout | null>(null)
    const touchTimer = useRef<NodeJS.Timeout | null>(null)
    const supabase = createClient()

    // Fetch initial like status and count
    useEffect(() => {
        const fetchLikeData = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            // 1. Check if user liked this project
            if (user) {
                const { data } = await supabase
                    .from('likes')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('project_id', project.id)
                    .single()

                if (data) setLiked(true)
            }

            // 2. Get total like count
            const { count } = await supabase
                .from('likes')
                .select('*', { count: 'exact', head: true })
                .eq('project_id', project.id)

            if (count !== null) setLikeCount(count)
        }

        fetchLikeData()
    }, [project.id])

    // Initialize audio
    useEffect(() => {
        audioRef.current = new Audio(project.audio_url)
        audioRef.current.loop = true
        audioRef.current.volume = 0

        return () => {
            if (fadeInterval.current) clearInterval(fadeInterval.current)
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
        }
    }, [project.audio_url])

    const fadeAudio = (targetVolume: number) => {
        if (!audioRef.current) return
        if (fadeInterval.current) clearInterval(fadeInterval.current)

        const step = 0.05
        const interval = 50 // ms

        fadeInterval.current = setInterval(() => {
            if (!audioRef.current) return

            const current = audioRef.current.volume
            if (Math.abs(current - targetVolume) < step) {
                audioRef.current.volume = targetVolume
                if (targetVolume === 0) audioRef.current.pause()
                clearInterval(fadeInterval.current!)
                fadeInterval.current = null
            } else {
                audioRef.current.volume = current < targetVolume
                    ? Math.min(1, current + step)
                    : Math.max(0, current - step)
            }
        }, interval)
    }

    const startPlaying = () => {
        if (!audioRef.current) return
        // Always start from beginning
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => { })
        fadeAudio(0.5) // Max volume 0.5 for preview
        setIsPlaying(true)
    }

    const stopPlaying = () => {
        fadeAudio(0)
        setIsPlaying(false)
    }

    const handlePlayToggle = (e: React.MouseEvent | React.TouchEvent) => {
        // Prevent default behavior to avoid double firing on some devices if mixed
        // But for onClick it's fine.
        if (isPlaying) {
            stopPlaying()
        } else {
            startPlaying()
        }
    }

    const handleMouseEnter = () => {
        // Desktop: Keep hover to play behavior if desired, OR sync with click?
        // User said "Unconditionally music play on touch, touch again off".
        // Let's keep hover for desktop as strictly separate bonus, OR disable it to match strictly.
        // Given the request "In feed page... unconditionally touch to play", it implies replacing the behavior.
        // Let's disable hover play to avoid conflict with toggle logic.
        // If we keep hover, hovering might start it, then clicking might stop it? Confusing.
        // Let's Comment out hover logic for now or make it purely visual (scale effect is already bound to isPlaying).
        // Update: User request is specific about "Touch". Let's assume Desktop click is same.
    }

    const handleMouseLeave = () => {
        // If we rely on toggle, leaving shouldn't stop it automatically unless intended.
        // But typical feed behavior: scroll away -> stop?
        // Let's stick to explicit toggle requested.
    }



    const toggleLike = async (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            alert("로그인이 필요합니다.") // TODO: Replace with Toast if available
            return
        }

        const newLiked = !liked
        setLiked(newLiked)
        setLikeCount(prev => newLiked ? prev + 1 : prev - 1)

        if (newLiked) {
            const { error } = await supabase.from('likes').upsert({ user_id: user.id, project_id: project.id }, { onConflict: 'user_id, project_id' })
            if (error) {
                console.error("Like failed:", error)
                // Revert state on error
                setLiked(false)
                setLikeCount(prev => prev - 1)
            }
        } else {
            const { error } = await supabase.from('likes').delete().eq('user_id', user.id).eq('project_id', project.id)
            if (error) {
                console.error("Unlike failed:", error)
                // Revert state on error
                setLiked(true)
                setLikeCount(prev => prev + 1)
            }
        }
    }

    return (
        <div className="group relative break-inside-avoid mb-6">
            {/* 1. Artist Profile Button (Header Overlay) */}
            <Link
                href={project.profiles?.username ? `/profile/${project.profiles.username}` : '#'}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-3 left-3 z-[60] flex items-center gap-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 hover:bg-black/60 hover:border-white/40 transition-all cursor-pointer"
            >
                {project.profiles?.avatar_url ? (
                    <img src={project.profiles.avatar_url} alt="" className="w-5 h-5 rounded-full flex-shrink-0 bg-zinc-800 object-cover" />
                ) : (
                    <div className="w-5 h-5 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center text-[8px] font-bold">
                        {project.profiles?.username?.[0]?.toUpperCase()}
                    </div>
                )}
                <span className="text-[10px] font-medium text-zinc-100 pr-1 max-w-[80px] truncate leading-none pb-px">
                    {project.profiles?.username || 'Artist'}
                </span>
            </Link>

            {/* 2. Project Link (Image) */}
            <Link href={`/v/${project.id}`} className="block relative rounded-2xl overflow-hidden bg-zinc-900 shadow-lg select-none">
                <div
                    className="relative w-full aspect-square bg-zinc-800 cursor-pointer"
                    onClick={handlePlayToggle}
                >
                    <Image
                        src={project.image_url}
                        alt={project.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className={`object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}
                    />

                    {/* Dark Overlay on Hover/Play */}
                    <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 pointer-events-none ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />

                    {/* Visualizer / Play Indicator */}
                    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="flex gap-1 items-end h-8">
                            {[1, 2, 3, 4].map(i => (
                                <div
                                    key={i}
                                    className="w-1.5 bg-white/90 rounded-t-sm animate-pulse"
                                    style={{
                                        height: '100%',
                                        animationDuration: `${0.5 + Math.random() * 0.5}s`
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                {/* AI Badge */}
                {project.is_ai_generated && (
                    <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-purple-500/30">
                        <span className="text-[9px] font-bold text-purple-200">AI</span>
                    </div>
                )}
            </Link>

            {/* 3. Bottom Info (Title & Like) */}
            <div className="mt-2.5 flex items-center justify-between gap-3 px-1">
                <Link href={`/v/${project.id}`} className="block min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-zinc-100 truncate hover:text-white transition-colors">{project.title}</h3>
                </Link>

                <button
                    onClick={toggleLike}
                    className={`flex items-center gap-1.5 transition-colors cursor-pointer group/like ${liked ? 'text-red-500' : 'text-zinc-400 hover:text-white'}`}
                >
                    <Heart size={14} fill={liked ? "currentColor" : "none"} className={`transition-transform duration-200 group-active/like:scale-75 ${liked ? "text-red-500" : ""}`} />
                    <span className="text-xs font-medium">{project.views || likeCount}</span>
                </button>
            </div >
        </div >
    )
}
