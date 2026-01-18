'use client'

import { useState, useRef, useEffect } from 'react'
import { Comment } from '@/types'
import { useToast } from '@/components/ui/Toast'
import { Send, Clock } from 'lucide-react'

// Props updated to receive comments and add function
interface RealtimeCommentsProps {
    comments: Comment[]
    loading: boolean
    onAddComment: (content: string, meta: any) => Promise<void>
    currentAudioTime?: number
}

export default function RealtimeComments({ comments, loading, onAddComment, currentAudioTime }: RealtimeCommentsProps) {
    const [newComment, setNewComment] = useState('')
    const [includeTimestamp, setIncludeTimestamp] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const { showToast } = useToast()

    // Scroll to bottom on new comments
    useEffect(() => {
        if (comments.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [comments])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim()) return

        // Meta data
        const meta = includeTimestamp && currentAudioTime !== undefined
            ? { timestamp: currentAudioTime }
            : {}

        try {
            await onAddComment(newComment.trim(), meta)
            setNewComment('')
            setIncludeTimestamp(false)
        } catch (error: any) {
            console.error(error)
            showToast(error.message === 'User not logged in' ? 'Please login to comment' : 'Failed to post comment', 'error')
        }
    }

    // Helper to format timestamp
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="flex flex-col h-[500px] bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/80">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    Live Comments <span className="text-[#39FF14] text-xs font-mono animate-pulse">● SIGNAL</span>
                </h3>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="text-center text-zinc-500 py-10 font-mono text-xs">INITIALIZING...</div>
                ) : comments.length === 0 ? (
                    <div className="text-center text-zinc-500 py-10">No signals detected.</div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300 group">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0 overflow-hidden border border-zinc-700">
                                {comment.profiles?.avatar_url ? (
                                    <img src={comment.profiles.avatar_url} alt="Av" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400">
                                        {comment.profiles?.username?.[0]?.toUpperCase() || '?'}
                                    </div>
                                )}
                            </div>
                            <div className="max-w-[80%]">
                                <div className="flex items-baseline gap-2">
                                    <span className="font-semibold text-sm text-[#39FF14]/80 font-mono">{comment.profiles?.username || 'Unknown'}</span>
                                    {comment.meta?.timestamp !== undefined && (
                                        <span className="text-[10px] text-zinc-500 font-mono border border-zinc-800 px-1 rounded">
                                            {formatTime(comment.meta.timestamp)}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-zinc-300 mt-1 leading-relaxed break-words font-light">{comment.content}</p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input - Footer */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-zinc-800 bg-black/60">
                <div className="flex flex-col gap-2">
                    {/* Timestamp Toggle */}
                    {currentAudioTime !== undefined && (
                        <div className="flex items-center gap-2 px-1">
                            <button
                                type="button"
                                onClick={() => setIncludeTimestamp(!includeTimestamp)}
                                className={`text-[10px] font-mono flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${includeTimestamp ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30' : 'text-zinc-500 border border-transparent hover:border-zinc-700'}`}
                            >
                                <Clock size={10} />
                                {includeTimestamp ? `REC ${formatTime(currentAudioTime)}` : 'MARK TIME'}
                            </button>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder=" transmite signal..."
                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#39FF14]/50 focus:ring-1 focus:ring-[#39FF14]/20 placeholder:text-zinc-600 text-white font-mono transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="px-4 bg-zinc-800 text-[#39FF14] rounded-md hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-mono text-xs border border-zinc-700"
                        >
                            SEND
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
