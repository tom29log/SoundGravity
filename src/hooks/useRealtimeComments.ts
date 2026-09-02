'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Comment, Profile } from '@/types'

export function useRealtimeComments(projectId: string) {
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchComments = async () => {
            try {
                // 1. Try relational query
                const { data: relationalData, error } = await supabase
                    .from('comments')
                    .select(`
                        *,
                        profiles (
                            username,
                            avatar_url
                        )
                    `)
                    .eq('project_id', projectId)
                    .order('created_at', { ascending: true })

                if (!error && relationalData && relationalData.length > 0) {
                    const formatted = relationalData.map((c: any) => ({
                        ...c,
                        meta: { timestamp: c.timestamp_seconds ?? c.meta?.timestamp }
                    }))
                    setComments(formatted as Comment[])
                    setLoading(false)
                    return
                }

                // 2. Fallback query if FK relationship is pending in PostgREST
                const { data: rawComments } = await supabase
                    .from('comments')
                    .select('*')
                    .eq('project_id', projectId)
                    .order('created_at', { ascending: true })

                if (rawComments && rawComments.length > 0) {
                    const userIds = Array.from(new Set(rawComments.map(c => c.user_id).filter(Boolean)))
                    let profileMap: Record<string, any> = {}

                    if (userIds.length > 0) {
                        const { data: profiles } = await supabase
                            .from('profiles')
                            .select('id, username, avatar_url')
                            .in('id', userIds)

                        if (profiles) {
                            profiles.forEach(p => {
                                profileMap[p.id] = p
                            })
                        }
                    }

                    const formatted = rawComments.map((c: any) => ({
                        ...c,
                        meta: { timestamp: c.timestamp_seconds ?? c.meta?.timestamp },
                        profiles: profileMap[c.user_id] || { username: 'User', avatar_url: null }
                    }))

                    setComments(formatted as Comment[])
                } else {
                    setComments([])
                }
            } catch (err) {
                console.error('Error fetching comments:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchComments()

        const channel = supabase
            .channel(`comments:${projectId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'comments',
                    filter: `project_id=eq.${projectId}`
                },
                async (payload) => {
                    const newComment = payload.new as any

                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('username, avatar_url')
                        .eq('id', newComment.user_id)
                        .maybeSingle()

                    const commentWithProfile = {
                        ...newComment,
                        meta: { timestamp: newComment.timestamp_seconds ?? newComment.meta?.timestamp },
                        profiles: profile as Profile
                    }

                    setComments(prev => {
                        // Prevent duplicate if already added optimistically
                        if (prev.some(c => c.id === newComment.id)) return prev
                        return [...prev, commentWithProfile]
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [projectId, supabase])

    const addComment = async (content: string, meta: any = {}) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not logged in')

        const timestamp_seconds = meta?.timestamp !== undefined ? Number(meta.timestamp) : 0

        const payload: any = {
            project_id: projectId,
            user_id: user.id,
            content,
            timestamp_seconds
        }

        const { data: insertedComment, error } = await supabase
            .from('comments')
            .insert(payload)
            .select('*')
            .maybeSingle()

        if (error) {
            console.error('Error inserting comment:', error)
            throw error
        }

        // Fetch user profile for instant display
        const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', user.id)
            .maybeSingle()

        const optimisticComment: Comment = {
            id: insertedComment?.id || Math.random().toString(),
            project_id: projectId,
            user_id: user.id,
            content,
            created_at: new Date().toISOString(),
            meta: { timestamp: timestamp_seconds },
            profiles: profile || { username: user.email?.split('@')[0] || 'User', avatar_url: null }
        } as any

        setComments(prev => {
            if (prev.some(c => c.id === optimisticComment.id)) return prev
            return [...prev, optimisticComment]
        })
    }

    return { comments, loading, addComment }
}
