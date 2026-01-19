'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { Project } from '@/types'
import FeedCard from './FeedCard'
import CommentDrawer from '../social/CommentDrawer'
import KnobButton from '@/components/ui/KnobButton'
import AnimatedLogo_v2 from '@/components/ui/AnimatedLogo_v2'
import { LayoutGrid, List as ListIcon, Loader2 } from 'lucide-react'

// Hook for window resize to adjust columns
function useWindowWidth() {
    const [width, setWidth] = useState(0)
    useEffect(() => {
        if (typeof window === 'undefined') return
        setWidth(window.innerWidth)
        const handleResize = () => setWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])
    return width
}

export default function GlobalFeed() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    // User Profile Data
    const [userProfile, setUserProfile] = useState<{
        username: string | null,
        avatar_url: string | null,
        artist_type?: string | null,
        primary_genre?: string | null
    } | null>(null)

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('username, avatar_url, artist_type, primary_genre')
                    .eq('id', user.id)
                    .single()
                if (data) setUserProfile(data)
            }
        }
        getUser()
    }, [])
    const [filter, setFilter] = useState<'latest' | 'popular'>('latest')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [aiFilter, setAiFilter] = useState<'all' | 'human' | 'ai'>('all')

    // Pagination / Infinite Scroll
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const observer = useRef<IntersectionObserver | null>(null)
    const lastElementRef = useCallback((node: HTMLDivElement) => {
        if (loading) return
        if (observer.current) observer.current.disconnect()

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1)
            }
        })
        if (node) observer.current.observe(node)
    }, [loading, hasMore])

    // Comment Drawer
    const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false)
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

    const supabase = createClient()
    const PAGE_SIZE = 12

    const fetchProjects = async (isLoadMore = false) => {
        setLoading(true)
        const from = page * PAGE_SIZE
        const to = from + PAGE_SIZE - 1

        let query = supabase
            .from('projects')
            .select(`
                *,
                profiles:profiles!projects_user_id_fkey_profiles (
                   username,
                   avatar_url
                )
            `)
            .range(from, to)

        // Apply AI Filter
        if (aiFilter === 'human') {
            query = query.eq('is_ai_generated', false)
        } else if (aiFilter === 'ai') {
            query = query.eq('is_ai_generated', true)
        }

        if (filter === 'latest') {
            query = query.order('created_at', { ascending: false })
        } else {
            query = query.order('views', { ascending: false }).order('created_at', { ascending: false })
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching feed:', error)
        } else {
            const newProjects = (data as unknown) as Project[] || []

            if (newProjects.length < PAGE_SIZE) {
                setHasMore(false)
            }

            if (isLoadMore) {
                setProjects(prev => [...prev, ...newProjects])
            } else {
                setProjects(newProjects)
            }
        }
        setLoading(false)
    }

    // Initial fetch and filter change
    useEffect(() => {
        setPage(0)
        setHasMore(true)
        setProjects([]) // clear current
    }, [filter, aiFilter])

    // Fetch on page change (includes initial 0)
    useEffect(() => {
        const isLoadMore = page > 0
        fetchProjects(isLoadMore)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, filter, aiFilter])

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
                            <div className="flex items-center gap-3">
                                <Link href={`/profile/${userProfile.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-700 overflow-hidden relative group-hover:border-white transition-colors">
                                        {userProfile.avatar_url ? (
                                            <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold bg-zinc-900">
                                                {userProfile.username?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-white leading-none group-hover:underline decoration-zinc-500 underline-offset-4">{userProfile.username || 'User'}</span>
                                        {(userProfile.artist_type || userProfile.primary_genre) ? (
                                            <div className="flex items-center gap-1.5 mt-1">
                                                {userProfile.artist_type && (
                                                    <span className="text-[10px] uppercase font-bold text-black bg-white px-1.5 py-0.5 rounded-full leading-none">
                                                        {userProfile.artist_type}
                                                    </span>
                                                )}
                                                {userProfile.primary_genre && (
                                                    <span className="text-[10px] text-zinc-400 font-medium leading-none border border-zinc-800 px-1.5 py-0.5 rounded-full">
                                                        {userProfile.primary_genre}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-zinc-500 font-mono mt-0.5">ONLINE</span>
                                        )}
                                    </div>
                                </Link>
                                <div className="h-8 w-px bg-zinc-800 mx-2" />
                                <Link href="/admin" className="shrink-0 hover:opacity-80 transition-opacity">
                                    <Image
                                        src="/icons/mypage-icon.png"
                                        alt="My Page"
                                        width={40}
                                        height={40}
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
                        <div className="md:hidden">
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
            {viewMode === 'list' ? (
                <div className="flex flex-col gap-8 max-w-2xl mx-auto">
                    {projects.map((project, index) => {
                        // Ref on last element
                        if (projects.length === index + 1) {
                            return <div ref={lastElementRef} key={project.id}><FeedCard project={project} /></div>
                        }
                        return <FeedCard key={project.id} project={project} />
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
                                return <FeedCard key={project.id} project={project} />
                            })}
                        </div>
                    ))}
                </div>
            )}

            {/* Loading Indicator / Sentinel */}
            <div ref={lastElementRef} className="py-12 flex justify-center w-full">
                {loading && <Loader2 className="animate-spin text-zinc-500" />}
                {!loading && !hasMore && projects.length > 0 && (
                    <p className="text-zinc-600 text-sm">You've reached the end.</p>
                )}
                {!loading && projects.length === 0 && (
                    <p className="text-zinc-500">No projects found.</p>
                )}
            </div>

            <CommentDrawer
                projectId={selectedProjectId}
                isOpen={isCommentDrawerOpen}
                onClose={() => setIsCommentDrawerOpen(false)}
            />
        </div>
    )
}
