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
                setComments((data as unknown) as Comment[] || [])
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
                    const newComment = payload.new as Comment

                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('username, avatar_url')
                        .eq('id', newComment.user_id)
                        .single()

                    const commentWithProfile = {
                        ...newComment,
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

        const { error } = await supabase
            .from('comments')
            .insert({
                project_id: projectId,
                user_id: user.id,
                content,
                meta
            })

        if (error) throw error
    }

    return { comments, loading, addComment }
}
