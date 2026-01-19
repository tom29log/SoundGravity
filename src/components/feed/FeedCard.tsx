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
    const [liked, setLiked] = useState(false)
    const [likeCount, setLikeCount] = useState(0)
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
            <Link href={`/v/${project.id}`} className="block relative rounded-2xl overflow-hidden bg-zinc-900 shadow-lg select-none group/image">
                <div className="relative w-full aspect-square bg-zinc-800">
                    <Image
                        src={project.image_url}
                        alt={project.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover/image:scale-105"
                    />

                    {/* Dark Overlay on Hover */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    {/* Play Button Icon for Affordance */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-300">
                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30">
                            <span className="sr-only">Play</span>
                            <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
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
