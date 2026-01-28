'use client'

import { useState, useEffect } from 'react'
import { createClient as createRawClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import ProfileHeader from '@/components/profile/ProfileHeader'
import ProjectListView from '@/components/profile/ProjectListView'
import { Profile } from '@/types'

interface Props {
    username: string
}

export default function ProfileContent({ username }: Props) {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [totalLikes, setTotalLikes] = useState<number>(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            // OPTIMIZATION: Use raw client WITHOUT session persistence
            // This prevents the 8s delay caused by checking local storage/auth session on mobile
            const supabase = createRawClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    auth: {
                        persistSession: false, // Critical: Disable session restoration
                        autoRefreshToken: false,
                        detectSessionInUrl: false
                    }
                }
            )

            // 1. Fetch Profile
            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', username)
                .single()

            if (error || !profileData) {
                console.error('Profile fetch error:', error)
                notFound() // This will trigger the nearest error boundary or 404 page
                return
            }

            // 2. Fetch Total Likes (Optimized via RPC)
            const { data: totalLikesData } = await supabase
                .rpc('get_user_total_likes', { target_user_id: profileData.id })

            setProfile(profileData)
            setTotalLikes(Number(totalLikesData) || 0)
            setLoading(false)
        }

        fetchData()
    }, [username])

    if (loading) {
        return (
            <div className="relative z-10 container mx-auto px-4 pb-20">
                {/* Simplified Header Skeleton */}
                <div className="pt-24 flex flex-col items-center">
                    {/* Avatar */}
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-zinc-900 animate-pulse border-2 border-zinc-800" />

                    {/* Username */}
                    <div className="mt-6 h-10 w-48 bg-zinc-900 animate-pulse rounded-lg" />

                    {/* Tags */}
                    <div className="flex gap-2 mt-4">
                        <div className="h-6 w-16 bg-zinc-900 animate-pulse rounded-full" />
                        <div className="h-6 w-20 bg-zinc-900 animate-pulse rounded-full" />
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-12 mt-8">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-4 bg-zinc-900 animate-pulse rounded" />
                            <div className="w-8 h-8 bg-zinc-900 animate-pulse rounded-full" />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-4 bg-zinc-900 animate-pulse rounded" />
                            <div className="w-8 h-8 bg-zinc-900 animate-pulse rounded-full" />
                        </div>
                    </div>
                </div>

                <div className="mt-12">
                    <div className="w-full h-px bg-zinc-800 mb-12" />
                    {/* List Skeleton */}
                    <div className="flex flex-col gap-2 max-w-3xl mx-auto w-full">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-zinc-900/40 border border-transparent h-20">
                                <div className="w-14 h-14 rounded-lg bg-zinc-900 animate-pulse shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-1/3 bg-zinc-900 animate-pulse rounded" />
                                    <div className="h-3 w-1/4 bg-zinc-800 animate-pulse rounded opacity-50" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (!profile) return null // Should be handled by notFound()

    return (
        <div className="relative z-10 container mx-auto px-4 pb-20">
            {/* Header renders after profile data is ready */}
            <ProfileHeader
                profile={profile}
                totalLikes={totalLikes}
            />

            <div className="mt-12">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent mb-12" />

                {/* List loads via Streaming (Suspense) - Nested Suspense */}
                <ProjectListView profileId={profile.id} />
            </div>
        </div>
    )
}
