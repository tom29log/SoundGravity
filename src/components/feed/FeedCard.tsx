'use client'

import PlaylistSelector from '../PlaylistSelector'
import { PlusCircle } from 'lucide-react'
import { usePlaylistPlayer } from '@/contexts/PlaylistPlayerContext'
import dynamic from 'next/dynamic'

const StemMixerPanel = dynamic(() => import('./StemMixerPanel'), {
    ssr: false,
    loading: () => null
})

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { Project } from '@/types'
import { createClient } from '@/lib/supabase'

interface FeedCardProps {
    project: Project
    onCommentClick?: () => void
    activeMixerId?: string | null
    onMixerToggle?: (id: string | null) => void
}

export default function FeedCard({ project, activeMixerId, onMixerToggle }: FeedCardProps) {
    const [liked, setLiked] = useState(false)
    const [likeCount, setLikeCount] = useState(0)

    const [showPlaylistSelector, setShowPlaylistSelector] = useState(false)

    // Use external control if available, otherwise use internal state
    const showMixer = activeMixerId === project.id

    const supabase = createClient()
    const { pause: pauseGlobalPlayer } = usePlaylistPlayer()

    const toggleLike = async (e: React.MouseEvent) => {
        // ... existing toggleLike code ...
    }

    // Debug: Log stems data
    console.log('🎵 FeedCard stems check:', {
        title: project.title,
        stems: project.stems,
        stemsType: typeof project.stems,
        stemsKeys: project.stems ? Object.keys(project.stems) : 'null',
        hasRealStems: project.stems && Object.keys(project.stems).length > 0
    })

    // Check if project has real stems
    const hasRealStems = project.stems && Object.keys(project.stems).length > 0
    const safeStems = hasRealStems ? project.stems : null
    const hasStems = hasRealStems

    const handleStemModeToggle = () => {
        if (onMixerToggle) {
            // Toggle: if this mixer is open, close it; otherwise open this one (and close others)
            onMixerToggle(showMixer ? null : project.id)
            if (!showMixer) {
                pauseGlobalPlayer()
            }
        }
    }

    return (
        <div className="group relative break-inside-avoid mb-6">
            {/* 1. Artist Profile Button (Header Overlay) */}
            <Link
                href={project.profiles?.username ? `/profile/${project.profiles.username}` : '#'}
                prefetch={false}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-3 left-3 z-[60] flex items-center gap-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 hover:bg-black/60 hover:border-white/40 transition-all cursor-pointer"
            >
                {/* ... existing profile image code ... */}
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
            <div className="relative rounded-2xl overflow-hidden bg-zinc-900 shadow-lg select-none group/image transition-transform active:scale-[0.98] duration-200">
                <Link href={`/v/${project.id}`} prefetch={false} className="block relative w-full aspect-square bg-zinc-800">
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
                </Link>
                {/* AI Badge */}
                {project.is_ai_generated && (
                    <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-purple-500/30">
                        <span className="text-[9px] font-bold text-purple-200">AI</span>
                    </div>
                )}

                {/* Mixer Panel - Only mount when actually open to avoid loading all stems at once */}
                {hasStems && showMixer && (
                    <StemMixerPanel
                        isOpen={true}
                        onClose={() => onMixerToggle?.(null)}
                        stems={safeStems!}
                        title={project.title}
                    />
                )}
            </div>

            {/* 3. Bottom Info (Title & Like) */}
            <div className="mt-3 flex items-center justify-between gap-3 px-1">
                <div className="flex flex-col min-w-0 flex-1">
                    <Link href={`/v/${project.id}`} prefetch={false} className="block">
                        <h3 className="font-semibold text-base text-zinc-100 truncate hover:text-white transition-colors tracking-tight">{project.title}</h3>
                    </Link>
                    <div className="flex items-center gap-3 mt-1.5">
                        {/* Stem Mode Toggle */}
                        {hasStems && (
                            <button
                                onClick={handleStemModeToggle}
                                className={`text-xs font-medium flex items-center gap-1.5 transition-colors ${showMixer ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                <div className="flex gap-[3px] items-end h-3">
                                    <div className={`w-[2px] bg-current rounded-full ${showMixer ? 'h-3 animate-[dance_0.5s_ease-in-out_infinite]' : 'h-2'}`} />
                                    <div className={`w-[2px] bg-current rounded-full ${showMixer ? 'h-2 animate-[dance_0.6s_ease-in-out_infinite]' : 'h-3'}`} />
                                    <div className={`w-[2px] bg-current rounded-full ${showMixer ? 'h-3 animate-[dance_0.4s_ease-in-out_infinite]' : 'h-1.5'}`} />
                                </div>
                                Stem Mode
                            </button>
                        )}

                        {/* Add to Playlist Button */}
                        <button
                            onClick={() => setShowPlaylistSelector(true)}
                            className="text-xs font-medium text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5"
                        >
                            <PlusCircle size={14} />
                            Add to List
                        </button>
                    </div>
                </div>

                <button
                    onClick={toggleLike}
                    className={`flex items-center gap-1.5 transition-colors cursor-pointer group/like ${liked ? 'text-red-500' : 'text-zinc-400 hover:text-white'}`}
                >
                    <Heart size={14} fill={liked ? "currentColor" : "none"} className={`transition-transform duration-200 group-active/like:scale-75 ${liked ? "text-red-500" : ""}`} />
                    <span className="text-xs font-medium">{project.views || likeCount}</span>
                </button>
            </div >

            <PlaylistSelector
                trackId={project.id}
                isOpen={showPlaylistSelector}
                onClose={() => setShowPlaylistSelector(false)}
            />
        </div >
    )
}
