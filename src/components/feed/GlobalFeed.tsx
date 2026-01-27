'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { Project } from '@/types'
import FeedCard from './FeedCard'
import CommentDrawer from '../social/CommentDrawer'
import AnimatedLogo_v2 from '@/components/ui/AnimatedLogo_v2'
import { LayoutGrid, List as ListIcon, Loader2 } from 'lucide-react'
import { useStemPreloader } from '@/hooks/useStemPreloader'
import { useProjectsInfinite } from '@/hooks/useProjectsInfinite'

// Hook for window resize to adjust columns
function useWindowWidth() {
    const [width, setWidth] = useState(0)
    // Client-side only
    useState(() => {
        if (typeof window !== 'undefined') {
            setWidth(window.innerWidth)
            const handleResize = () => setWidth(window.innerWidth)
            window.addEventListener('resize', handleResize)
            return () => window.removeEventListener('resize', handleResize)
        }
    })
    return width
}

interface GlobalFeedProps {
    initialProjects: Project[]
}

export default function GlobalFeed({ initialProjects }: GlobalFeedProps) {
    // Active stem mixer - only one can be open at a time
    const [activeMixerId, setActiveMixerId] = useState<string | null>(null)
    // User Profile Data - still fetched client side for auth user (could be optimized later)
    const [userProfile, setUserProfile] = useState<{
        username: string | null,
        avatar_url: string | null,
    } | null>(null)

    const supabase = createClient()

    // Auth profile fetch (Client Side for now)
    useState(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('username, avatar_url')
                    .eq('id', user.id)
                    .single()
                if (data) setUserProfile(data)
            }
        }
        getUser()
    })

    const [filter, setFilter] = useState<'latest' | 'popular'>('latest')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [aiFilter, setAiFilter] = useState<'all' | 'human' | 'ai'>('all')

    // React Query Hook
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading
    } = useProjectsInfinite(initialProjects, { filter, aiFilter })

    // Flatten pages into a single array
    const projects = data?.pages.flat() || initialProjects || []

    // Pagination / Infinite Scroll
    const observer = useRef<IntersectionObserver | null>(null)
    const lastElementRef = useCallback((node: HTMLDivElement) => {
        if (isLoading || isFetchingNextPage) return
        if (observer.current) observer.current.disconnect()

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasNextPage) {
                fetchNextPage()
            }
        })
        if (node) observer.current.observe(node)
    }, [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage])

    // Comment Drawer
    const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false)
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

    // Performance Optimization: Smart Preload
    useStemPreloader({ tracks: projects, currentIndex: 0 })

    // Handle Masonry Columns
    const width = useWindowWidth()
    const getColumnCount = () => {
        if (width >= 1280) return 4 // xl
        if (width >= 1024) return 3 // lg
        if (width >= 640) return 2 // sm
        return 1
    }
    const columns = getColumnCount()

    // Distribute projects into columns for Masonry
    const masonryColumns: Project[][] = Array.from({ length: columns }, () => [])
    projects.forEach((project, index) => {
        masonryColumns[index % columns].push(project)
    })

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
            {/* Header */}
            <div className="flex flex-col gap-6 mb-8 sticky top-0 bg-black/80 backdrop-blur-md z-40 py-4 -mx-4 px-4 border-b border-zinc-900/50">

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* User Info & Navigation */}
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                        {userProfile ? (
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Link href={`/profile/${userProfile.username}`} prefetch={false} className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity group min-w-0">
                                    <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden relative transition-colors shrink-0">
                                        {userProfile.avatar_url ? (
                                            <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold bg-zinc-900">
                                                {userProfile.username?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0 items-center">
                                        <span className="font-bold text-white leading-none group-hover:underline decoration-zinc-500 underline-offset-4 text-xs text-center break-words max-w-[120px]">{userProfile.username || 'User'}</span>
                                    </div>
                                </Link>
                                <div className="h-8 w-px bg-zinc-800 mx-2 shrink-0" />
                                <Link href="/admin" className="shrink-0 hover:opacity-80 transition-opacity mr-6 md:mr-0">
                                    <Image
                                        src="/icons/mypage-icon.png"
                                        alt="My Page"
                                        width={52}
                                        height={52}
                                        className="object-contain brightness-0 invert"
                                    />
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                                    Discovery
                                </h1>
                                <a href="/login" className="text-sm text-zinc-400 hover:text-white underline">Login</a>
                            </div>
                        )}

                        {/* Mobile Logo Position (Right top) */}
                        <div className="md:hidden transform scale-[0.98] origin-right shrink-0">
                            <AnimatedLogo_v2 />
                        </div>
                    </div>

                    {/* Desktop Logo & Filters & View Mode */}
                    <div className="flex flex-col md:flex-row items-end md:items-center gap-4 w-full md:w-auto">

                        {/* Desktop Logo */}
                        <div className="hidden md:block">
                            <AnimatedLogo_v2 />
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">

                            {/* Filter Groups */}
                            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-hide">
                                {/* AI Filter */}
                                <div className="flex bg-zinc-900 rounded-full p-1 border border-zinc-800 shrink-0">
                                    <button
                                        onClick={() => setAiFilter('all')}
                                        className={`px-3 py-1.5 rounded-full text-[11px] md:text-xs font-medium transition-all ${aiFilter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setAiFilter('human')}
                                        className={`px-3 py-1.5 rounded-full text-[11px] md:text-xs font-medium transition-all ${aiFilter === 'human' ? 'bg-zinc-800 text-green-400' : 'text-zinc-500 hover:text-green-400'}`}
                                    >
                                        Human
                                    </button>
                                    <button
                                        onClick={() => setAiFilter('ai')}
                                        className={`px-3 py-1.5 rounded-full text-[11px] md:text-xs font-medium transition-all ${aiFilter === 'ai' ? 'bg-zinc-800 text-purple-400' : 'text-zinc-500 hover:text-purple-400'}`}
                                    >
                                        AI
                                    </button>
                                </div>

                                {/* Sort Filter */}
                                <div className="flex bg-zinc-900 rounded-full p-1 border border-zinc-800 shrink-0">
                                    <button
                                        onClick={() => setFilter('latest')}
                                        className={`px-3 py-1.5 rounded-full text-[11px] md:text-xs font-medium transition-all ${filter === 'latest' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
                                    >
                                        Latest
                                    </button>
                                    <button
                                        onClick={() => setFilter('popular')}
                                        className={`px-3 py-1.5 rounded-full text-[11px] md:text-xs font-medium transition-all ${filter === 'popular' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
                                    >
                                        Popular
                                    </button>
                                </div>
                            </div>

                            {/* View Mode (Hidden on mobile usually, or keep compact) */}
                            <div className="hidden sm:flex bg-zinc-900 rounded-lg p-1 border border-zinc-800 shrink-0">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    <LayoutGrid size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    <ListIcon size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            {
                viewMode === 'list' ? (
                    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
                        {projects.map((project, index) => {
                            // Ref on last element
                            if (projects.length === index + 1) {
                                return <div ref={lastElementRef} key={project.id}><FeedCard project={project} activeMixerId={activeMixerId} onMixerToggle={setActiveMixerId} /></div>
                            }
                            return <FeedCard key={project.id} project={project} activeMixerId={activeMixerId} onMixerToggle={setActiveMixerId} />
                        })}
                    </div>
                ) : (
                    // Masonry Grid
                    <div className="flex gap-6">
                        {masonryColumns.map((colProjects, colIndex) => (
                            <div key={colIndex} className="flex-1 flex flex-col gap-6">
                                {colProjects.map((project, index) => {
                                    // We need to attach the ref to the actual last element in the DOM
                                    // But finding which column has the last element is tricky.
                                    // Actually, we can just attach ref to a dummy element at bottom of container
                                    // OR attach to the last item rendered in the last column?
                                    // Let's simplify: Put a sentinel div below the grid.
                                    return <FeedCard key={project.id} project={project} activeMixerId={activeMixerId} onMixerToggle={setActiveMixerId} />
                                })}
                            </div>
                        ))}
                    </div>
                )
            }

            {/* Loading Indicator / Sentinel */}
            <div ref={lastElementRef} className="py-12 flex justify-center w-full">
                {(isLoading || isFetchingNextPage) && <Loader2 className="animate-spin text-zinc-500" />}
                {!hasNextPage && !isLoading && projects.length > 0 && (
                    <p className="text-zinc-600 text-sm">You've reached the end.</p>
                )}
                {!isLoading && projects.length === 0 && (
                    <p className="text-zinc-500">No projects found.</p>
                )}
            </div>

            <CommentDrawer
                projectId={selectedProjectId}
                isOpen={isCommentDrawerOpen}
                onClose={() => setIsCommentDrawerOpen(false)}
            />
        </div >
    )
}
