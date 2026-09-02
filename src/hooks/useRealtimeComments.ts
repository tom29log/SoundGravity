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
            const { data, error } = await supabase
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

            if (error) {
                console.error('Error fetching comments:', error)
            } else {
                const formatted = (data || []).map((c: any) => ({
                    ...c,
                    meta: { timestamp: c.timestamp_seconds ?? c.meta?.timestamp }
                }))
                setComments(formatted as Comment[])
            }
            setLoading(false)
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

                    setComments(prev => [...prev, commentWithProfile])
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

        const { error } = await supabase
            .from('comments')
            .insert(payload)

        if (error) {
            console.error('Error inserting comment:', error)
            throw error
        }
    }

    return { comments, loading, addComment }
}
