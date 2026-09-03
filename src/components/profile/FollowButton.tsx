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
                    try {
                        const res = await fetch(`/api/follows/status?profileId=${profileId}`)
                        if (res.ok) {
                            const data = await res.json()
                            if (data.following !== undefined) {
                                setIsFollowing(data.following)
                            }
                        }
                    } catch (err) {
                        console.error('Error checking follow status:', err)
                    }
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
        const nextStatus = !isFollowing
        setIsFollowing(nextStatus)
        setLoading(true)

        try {
            const res = await fetch('/api/follows/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId, desiredState: nextStatus })
            })

            const data = await res.json()

            if (res.status === 401) {
                setIsFollowing(!nextStatus)
                alert('로그인이 필요합니다.')
                return
            }

            if (!res.ok) {
                throw new Error(data.error || 'Failed to toggle follow')
            }

            if (data.following !== undefined) {
                setIsFollowing(data.following)
            }
        } catch (error: any) {
            console.error('Follow error:', error)
            // Rollback
            setIsFollowing(!nextStatus)
            alert('팔로우 처리에 실패했습니다: ' + (error.message || '알 수 없는 오류'))
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
