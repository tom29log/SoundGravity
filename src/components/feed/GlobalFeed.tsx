'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
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

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth)
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

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
        is_pro?: boolean
    } | null>(null)

    const supabase = createClient()

    // Auth profile fetch (Client Side for now)
    const [loadingAuth, setLoadingAuth] = useState(true)

    useEffect(() => {
        const getUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user) {
                    const { data } = await supabase
                        .from('profiles')
                        .select('username, avatar_url, is_pro')
                        .eq('id', session.user.id)
                        .maybeSingle()

                    setUserProfile({
                        username: data?.username || session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                        avatar_url: data?.avatar_url || session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null,
                        is_pro: data?.is_pro || false
                    })
                }
            } catch (e) {
                // Ignore auth errors
            } finally {
                setLoadingAuth(false)
            }
        }
        getUser()
    }, [])

    const [filter, setFilter] = useState<'latest' | 'popular'>('latest')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [aiFilter, setAiFilter] = useState<'all' | 'human' | 'ai'>('all')
    const [genreFilter, setGenreFilter] = useState<string>('')

    // React Query Hook
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading
    } = useProjectsInfinite(
        // Only use initial projects if no filters are applied, otherwise we might show mixed data
        filter === 'latest' && aiFilter === 'all' && genreFilter === '' ? initialProjects : undefined,
        { filter, aiFilter, genre: genreFilter || null }
    )

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
    // [BANDWIDTH OPTIMIZATION] Disabled to save egress costs (19GB spike).
    // Only load audio when user explicitly plays.
    // useStemPreloader({ tracks: projects, currentIndex: 0 })

    // Handle Masonry Columns
    const width = useWindowWidth()
    const getColumnCount = () => {
        if (width >= 1280) return 4 // xl
        if (width >= 1024) return 3 // lg
        if (width >= 640) return 2 // sm
        return 2 // 2 columns for mobile
    }
    const columns = getColumnCount()

    // Distribute projects into columns for Masonry
    const masonryColumns: Project[][] = Array.from({ length: columns }, () => [])
    projects.forEach((project, index) => {
        masonryColumns[index % columns].push(project)
    })

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-24">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:gap-6 mb-4 sm:mb-8 sticky top-0 bg-black/80 backdrop-blur-md z-[100] py-2.5 sm:py-4 -mx-3 sm:-mx-4 px-3 sm:px-4 border-b border-zinc-900/50">

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
                    {/* User Info & Navigation */}
                    <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto justify-between md:justify-start">
                        {loadingAuth ? (
                            // Auth Loading Skeleton
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-zinc-800 animate-pulse" />
                                <div className="flex flex-col gap-2">
                                    <div className="h-4 w-20 bg-zinc-800 animate-pulse rounded" />
                                </div>
                            </div>
                        ) : userProfile ? (
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                <Link href={`/profile/${userProfile.username}`} prefetch={false} className="flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity group min-w-0 pt-1 sm:pt-0">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-zinc-800 overflow-hidden relative transition-colors shrink-0 shadow-sm">
                                        {userProfile.avatar_url ? (
                                            <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold bg-zinc-900 text-xs sm:text-base">
                                                {userProfile.username?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0 items-center">
                                        <span className="font-bold text-white leading-tight group-hover:underline decoration-zinc-500 underline-offset-4 text-[9.5px] sm:text-xs text-center break-words max-w-[80px] sm:max-w-[120px] line-clamp-2">{userProfile.username || 'User'}</span>
                                    </div>
                                </Link>
                                <div className="h-8 w-px bg-zinc-800 mx-2 sm:mx-3 shrink-0" />
                                <Link href="/admin" className="shrink-0 hover:opacity-80 transition-opacity mr-3 md:mr-0">
                                    <Image
                                        src="/icons/dashboard-icon-new.png"
                                        alt="My Page"
                                        width={44}
                                        height={44}
                                        className="object-contain w-11 h-11 sm:w-[60px] sm:h-[60px]"
                                    />
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                                    Discovery
                                </h1>
                                <a href="/login" className="text-xs sm:text-sm text-zinc-400 hover:text-white underline">Login</a>
                            </div>
                        )}

                        {/* Mobile Logo Position (Right top) */}
                        <div className="md:hidden transform scale-[0.85] sm:scale-[0.98] origin-right shrink-0">
                            <AnimatedLogo_v2 />
                        </div>
                    </div>

                    {/* Desktop Logo & Filters & View Mode */}
                    <div className="flex flex-col md:flex-row items-end md:items-center gap-3 sm:gap-4 w-full md:w-auto">

                        {/* Desktop Logo */}
                        <div className="hidden md:block">
                            <AnimatedLogo_v2 />
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto justify-between md:justify-end">

                            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-hide">
                                {/* AI Filter */}
                                <div className="flex bg-zinc-900 rounded-full p-0.5 sm:p-1 border border-zinc-800 shrink-0">
                                    <button
                                        onClick={() => setAiFilter('all')}
                                        className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-medium transition-all ${aiFilter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
                                        title="All"
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setAiFilter('human')}
                                        className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-medium transition-all ${aiFilter === 'human' ? 'bg-zinc-800 text-green-400' : 'text-zinc-500 hover:text-green-400'}`}
                                        title="Human"
                                    >
                                        <span className="sm:hidden">H</span>
                                        <span className="hidden sm:inline">Human</span>
                                    </button>
                                    <button
                                        onClick={() => setAiFilter('ai')}
                                        className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-medium transition-all ${aiFilter === 'ai' ? 'bg-zinc-800 text-purple-400' : 'text-zinc-500 hover:text-purple-400'}`}
                                        title="AI"
                                    >
                                        AI
                                    </button>
                                </div>

                                {/* Sort Filter */}
                                <div className="flex bg-zinc-900 rounded-full p-0.5 sm:p-1 border border-zinc-800 shrink-0">
                                    <button
                                        onClick={() => setFilter('latest')}
                                        className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium transition-all ${filter === 'latest' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
                                    >
                                        Latest
                                    </button>
                                    <button
                                        onClick={() => setFilter('popular')}
                                        className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium transition-all ${filter === 'popular' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
                                    >
                                        Popular
                                    </button>
                                </div>

                                {/* Genre Filter */}
                                <div className="flex bg-zinc-900 rounded-full border border-zinc-800 shrink-0 overflow-hidden">
                                    <select
                                        value={genreFilter}
                                        onChange={(e) => setGenreFilter(e.target.value)}
                                        className="bg-transparent text-[10px] sm:text-xs font-medium text-white px-2.5 sm:px-3 py-1.5 outline-none cursor-pointer appearance-none text-center"
                                        style={{ WebkitAppearance: 'none' }}
                                    >
                                        <option value="" className="bg-zinc-900">All kind</option>
                                        <option value="K-Pop" className="bg-zinc-900">K-Pop</option>
                                        <option value="Hip-Hop" className="bg-zinc-900">Hip-Hop</option>
                                        <option value="Lo-Fi" className="bg-zinc-900">Lo-Fi</option>
                                        <option value="Techno" className="bg-zinc-900">Techno</option>
                                        <option value="House" className="bg-zinc-900">House</option>
                                        <option value="EDM" className="bg-zinc-900">EDM</option>
                                        <option value="Rock" className="bg-zinc-900">Rock</option>
                                        <option value="Indie" className="bg-zinc-900">Indie</option>
                                        <option value="Pop" className="bg-zinc-900">Pop</option>
                                        <option value="Reggae" className="bg-zinc-900">Reggae</option>
                                        <option value="CCM" className="bg-zinc-900">CCM</option>
                                        <option value="Drum & Bass" className="bg-zinc-900">Drum & Bass</option>
                                    </select>
                                </div>
                            </div>

                            {/* View Mode (Supported on both Mobile & Desktop) */}
                            <div className="flex bg-zinc-900 rounded-lg p-0.5 sm:p-1 border border-zinc-800 shrink-0">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 sm:p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    title="Grid View"
                                >
                                    <LayoutGrid size={16} className="sm:w-[18px] sm:h-[18px]" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 sm:p-2 rounded-md transition-colors ${viewMode === 'list' ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    title="List View"
                                >
                                    <ListIcon size={16} className="sm:w-[18px] sm:h-[18px]" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            {
                viewMode === 'list' ? (
                    <div className="flex flex-col gap-4 sm:gap-8 max-w-md sm:max-w-2xl mx-auto">
                        {projects.map((project) => (
                            <FeedCard key={project.id} project={project} activeMixerId={activeMixerId} onMixerToggle={setActiveMixerId} isPro={userProfile?.is_pro} />
                        ))}
                    </div>
                ) : (
                    // Masonry Grid
                    <div className="flex gap-3 sm:gap-6 overflow-hidden">
                        {masonryColumns.map((colProjects, colIndex) => (
                            <div key={colIndex} className="flex-1 min-w-0 flex flex-col gap-3 sm:gap-6">
                                {colProjects.map((project) => (
                                    <FeedCard key={project.id} project={project} activeMixerId={activeMixerId} onMixerToggle={setActiveMixerId} isPro={userProfile?.is_pro} />
                                ))}
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
