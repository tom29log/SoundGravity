'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Comment } from '@/types'

interface CommentDrawerProps {
    projectId: string | null
    isOpen: boolean
    onClose: () => void
}

export default function CommentDrawer({ projectId, isOpen, onClose }: CommentDrawerProps) {
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const supabase = createClient()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen && projectId) {
            fetchComments(projectId)
        }
    }, [isOpen, projectId])

    const fetchComments = async (pid: string) => {
        setLoading(true)
        const { data, error } = await supabase
            .from('comments')
            .select(`
                *,
                profiles (
                    username,
                    avatar_url
                )
            `)
            .eq('project_id', pid)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching comments:', error)
        } else {
            setComments((data as unknown) as Comment[] || [])
            setTimeout(scrollToBottom, 100)
        }
        setLoading(false)
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim() || !projectId) return

        setSubmitting(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            alert('Please login to comment')
            setSubmitting(false)
            return
        }

        const { error } = await supabase
            .from('comments')
            .insert({
                project_id: projectId,
                user_id: user.id,
                content: newComment.trim()
            })

        if (error) {
            console.error('Error posting comment:', error)
            alert('Failed to post comment')
        } else {
            setNewComment('')
            fetchComments(projectId)
        }
        setSubmitting(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="relative w-full max-w-lg mx-auto bg-zinc-900 border-t border-zinc-800 rounded-t-2xl shadow-2xl pointer-events-auto flex flex-col h-[70vh] sm:h-[600px] transition-transform duration-300 transform translate-y-0">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <h3 className="font-semibold text-lg">Comments</h3>
                    <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-full">
                        <X size={20} className="text-zinc-500" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="text-center text-zinc-500 py-8">Loading...</div>
                    ) : comments.length === 0 ? (
                        <div className="text-center text-zinc-500 py-8">No comments yet. Be the first!</div>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden">
                                    {/* Avatar placeholder if no image */}
                                    {comment.profiles?.avatar_url ? (
                                        <img src={comment.profiles.avatar_url} alt="Av" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400">
                                            {comment.profiles?.username?.[0]?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-semibold text-sm text-zinc-200">{comment.profiles?.username || 'Unknown'}</span>
                                        <span className="text-xs text-zinc-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-zinc-300 mt-0.5">{comment.content}</p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-800 bg-zinc-900">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 bg-zinc-800 border-none rounded-full px-4 py-2.5 text-sm focus:ring-1 focus:ring-white placeholder:text-zinc-500"
                        />
                        <button
                            type="submit"
                            disabled={submitting || !newComment.trim()}
                            className="p-2.5 bg-white text-black rounded-full hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
