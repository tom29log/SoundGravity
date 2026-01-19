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
        audioRef.current.play().catch(() => { })
        fadeAudio(0.5) // Max volume 0.5 for preview
        setIsPlaying(true)
    }

    const stopPlaying = () => {
        fadeAudio(0)
        setIsPlaying(false)
    }

    const handleMouseEnter = () => {
        // Desktop: Hover to play
        if (window.matchMedia('(hover: hover)').matches) {
            startPlaying()
        }
    }

    const handleMouseLeave = () => {
        if (touchTimer.current) clearTimeout(touchTimer.current)
        stopPlaying()
    }

    // Mobile: Long press logic
    const handleTouchStart = () => {
        touchTimer.current = setTimeout(() => {
            startPlaying()
        }, 800) // 0.8s effectively feels like "hold"
    }

    const handleTouchEnd = () => {
        if (touchTimer.current) clearTimeout(touchTimer.current)
        stopPlaying()
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
            <Link href={`/v/${project.id}`} className="block">
                <div
                    className="relative rounded-2xl overflow-hidden bg-zinc-900 shadow-lg"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                >
                    {/* Image with Aspect Ratio */}
                    <div className="relative w-full aspect-square bg-zinc-800">
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

                    {/* Minimalist Info (Appear on Hover or Always Visible?) 
                        User asked for "visual elements at bottom of each card".
                        Pinterest usually has info BELOW the rounded image.
                    */}
                </div>
            </Link>

            {/* Info Section Below Image */}
            <div className="mt-2 text-white relative z-50">
                <h3 className="font-semibold text-sm truncate leading-tight">{project.title}</h3>
                <div className="flex items-center justify-between mt-1 text-xs text-zinc-400">
                    <Link
                        href={project.profiles?.username ? `/profile/${project.profiles.username}` : '#'}
                        onClick={(e) => e.stopPropagation()}
                        className="relative z-50 flex items-center gap-1.5 overflow-hidden hover:text-white transition-colors cursor-pointer group/author"
                    >
                        {project.profiles?.avatar_url ? (
                            <img src={project.profiles.avatar_url} alt="" className="w-4 h-4 rounded-full flex-shrink-0 bg-zinc-800" />
                        ) : (
                            <div className="w-4 h-4 rounded-full bg-zinc-800 flex-shrink-0" />
                        )}
                        <span className="truncate">
                            {project.profiles?.username || 'Artist'}
                        </span>
                    </Link>

                    <button
                        onClick={toggleLike}
                        className={`flex items-center gap-1 hover:text-white transition-colors cursor-pointer ${liked ? 'text-red-500' : ''}`}
                    >
                        <Heart size={12} fill={liked ? "currentColor" : "none"} className={liked ? "text-red-500" : ""} />
                        <span>{project.views || likeCount}</span> {/* Showing views or likes as requested 'likes count' */}
                    </button>
                </div>
            </div>
        </div>
    )
}
