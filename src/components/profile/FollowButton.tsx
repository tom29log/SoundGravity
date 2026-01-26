'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface FollowButtonProps {
    profileId: string
    followerCount?: number
}

export default function FollowButton({ profileId, followerCount }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isOwnProfile, setIsOwnProfile] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        const checkFollowStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                if (user.id === profileId) {
                    setIsOwnProfile(true)
                } else {
                    const { data } = await supabase
                        .from('follows')
                        .select('*')
                        .eq('follower_id', user.id)
                        .eq('following_id', profileId)
                        .single()

                    if (data) setIsFollowing(true)
                }
            }
        }
        checkFollowStatus()
    }, [profileId])

    const handleFollow = async () => {
        if (loading) return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            alert('로그인이 필요합니다.')
            return
        }

        // Optimistic Update
        const newStatus = !isFollowing
        setIsFollowing(newStatus)
        setLoading(true)

        try {
            if (newStatus) {
                // Follow
                const { error } = await supabase.from('follows').insert({
                    follower_id: user.id,
                    following_id: profileId
                })
                if (error) throw error
            } else {
                // Unfollow
                const { error } = await supabase.from('follows').delete()
                    .eq('follower_id', user.id)
                    .eq('following_id', profileId)
                if (error) throw error
            }
        } catch (error) {
            console.error('Follow error:', error)
            // Rollback
            setIsFollowing(!newStatus)
            alert('팔로우 처리에 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }

    if (isOwnProfile) return null

    return (
        <button
            onClick={handleFollow}
            disabled={loading}
            className={`px-6 py-1.5 rounded-full text-xs font-bold tracking-widest transition-all shadow-lg ${isFollowing
                ? 'bg-zinc-800/80 backdrop-blur-sm text-zinc-400 border border-zinc-700 hover:border-red-500/50 hover:text-red-400'
                : 'bg-white text-black hover:scale-105 hover:shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                }`}
        >
            {loading ? '...' : (isFollowing ? 'FOLLOWING' : 'FOLLOW')}
        </button>
    )
}
