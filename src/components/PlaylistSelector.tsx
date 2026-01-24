'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { X, Plus, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Playlist {
    id: string
    title: string
    user_id: string
}

interface PlaylistSelectorProps {
    trackId: string
    isOpen: boolean
    onClose: () => void
}

export default function PlaylistSelector({ trackId, isOpen, onClose }: PlaylistSelectorProps) {
    const [playlists, setPlaylists] = useState<Playlist[]>([])
    const [loading, setLoading] = useState(false)
    const [newPlaylistTitle, setNewPlaylistTitle] = useState('')
    const [creating, setCreating] = useState(false)
    const [addedInfo, setAddedInfo] = useState<string | null>(null)

    const supabase = createClient()

    useEffect(() => {
        if (isOpen) {
            fetchPlaylists()
        }
    }, [isOpen])

    const fetchPlaylists = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data } = await supabase
                .from('playlists')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (data) setPlaylists(data)
        }
        setLoading(false)
    }

    const createPlaylist = async () => {
        if (!newPlaylistTitle.trim()) return

        setCreating(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data, error } = await supabase
                .from('playlists')
                .insert({
                    title: newPlaylistTitle,
                    user_id: user.id
                })
                .select()
                .single()

            if (data && !error) {
                setPlaylists([data, ...playlists])
                setNewPlaylistTitle('')
                // Automatically add track to new playlist
                addToPlaylist(data.id)
            }
        }
        setCreating(false)
    }

    const addToPlaylist = async (playlistId: string) => {
        const { error } = await supabase
            .from('playlist_tracks')
            .insert({
                playlist_id: playlistId,
                track_id: trackId
            })
        // Ignore conflict if already exists (assuming conflict constraint on unique pair)
        // If not, we might duplicate, so let's handle error or use upsert if constraint exists
        // Or better, check first or use ON CONFLICT DO NOTHING

        if (!error || error.code === '23505') { // 23505 is unique violation code in Postgres
            setAddedInfo(playlistId)
            setTimeout(() => {
                setAddedInfo(null)
                onClose()
            }, 1000)
        } else {
            alert('Failed to add to playlist: ' + error.message)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ y: 20, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 20, opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl relative"
                        >
                            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                                <h3 className="font-bold text-white">Add to Playlist</h3>
                                <button onClick={onClose} className="text-zinc-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                                {loading && (
                                    <div className="text-center py-8 text-zinc-500 text-sm">Loading playlists...</div>
                                )}

                                {!loading && playlists.length === 0 && (
                                    <div className="text-center py-8 text-zinc-500 text-sm">No playlists found. Create one!</div>
                                )}

                                {playlists.map((playlist) => (
                                    <button
                                        key={playlist.id}
                                        onClick={() => addToPlaylist(playlist.id)}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800 transition-colors group text-left"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium text-zinc-200 group-hover:text-white">{playlist.title}</span>
                                        </div>
                                        {addedInfo === playlist.id && (
                                            <div className="bg-green-500/20 text-green-500 p-1 rounded-full">
                                                <Check size={16} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Create New Section */}
                            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                                <div className="flex gap-2">
                                    <input
                                        value={newPlaylistTitle}
                                        onChange={(e) => setNewPlaylistTitle(e.target.value)}
                                        placeholder="New playlist name..."
                                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
                                        onKeyDown={(e) => e.key === 'Enter' && createPlaylist()}
                                    />
                                    <button
                                        onClick={createPlaylist}
                                        disabled={!newPlaylistTitle.trim() || creating}
                                        className="bg-white text-black p-2 rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {creating ? (
                                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                        ) : (
                                            <Plus size={20} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
