import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { X, Play, Music, Trash2, Disc } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import * as Tone from 'tone'
import { Project } from '@/types'
import { usePlaylistPlayer } from '@/contexts/PlaylistPlayerContext'
import BottomPlayerBar from '@/components/ui/BottomPlayerBar'


interface Playlist {
    id: string
    title: string
    description: string | null
    created_at: string
}

interface PlaylistDetailModalProps {
    isOpen: boolean
    onClose: () => void
    playlist: Playlist
}

export default function PlaylistDetailModal({ isOpen, onClose, playlist }: PlaylistDetailModalProps) {
    const [tracks, setTracks] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const { playPlaylist, isPlaying, play, pause, stop, clear, activeDeck, deckA, deckB, autoMixMode } = usePlaylistPlayer()
    const isMixsetMode = autoMixMode

    useEffect(() => {
        if (isOpen && playlist) {
            fetchTracks()
        }
    }, [isOpen, playlist])

    const fetchTracks = async () => {
        setLoading(true)
        // Join playlist_tracks with projects
        const { data, error } = await supabase
            .from('playlist_tracks')
            .select(`
                track_id,
                project:projects!playlist_tracks_track_id_fkey (
                    *,
                    profiles:profiles!projects_user_id_fkey_profiles (
                        username,
                        avatar_url
                    )
                )
            `)
            .eq('playlist_id', playlist.id)
            .order('added_at', { ascending: false })

        if (error) {
            console.error('Error fetching tracks:', error)
        } else {
            // Flatten the structure
            const fetchedTracks = data.map((item: any) => item.project)
            setTracks(fetchedTracks)
        }
        setLoading(false)
    }

    const removeTrack = async (trackId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm('Remove this track from playlist?')) return

        const { error } = await supabase
            .from('playlist_tracks')
            .delete()
            .match({ playlist_id: playlist.id, track_id: trackId })

        if (!error) {
            setTracks(prev => prev.filter(t => t.id !== trackId))
        }
    }

    const handleClose = () => {
        // Stop and clear when closing the modal
        stop()
        clear() // Ensure player is cleared
        onClose()
    }

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose()
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [onClose, stop]) // Added dependencies

    const handlePlayTrack = async (index: number) => {
        await Tone.start()

        const selectedTrack = tracks[index]
        if (!selectedTrack) return

        // If clicking the current track
        const isCurrentTrack = activeDeck === 'A' ? deckA.track?.id === selectedTrack.id : deckB.track?.id === selectedTrack.id

        if (isCurrentTrack && isPlaying) {
            pause()
        } else if (isCurrentTrack && !isPlaying) {
            play()
        } else {
            // New track
            playPlaylist(tracks, index)
        }
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                                    {playlist.title}
                                </h2>

                                <button
                                    onClick={handleClose}
                                    className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex items-center gap-3 text-xs font-mono text-zinc-600 uppercase tracking-widest pl-1">
                                <span>{tracks.length} Tracks</span>
                            </div>
                            <p className="text-sm text-zinc-500">{playlist.description}</p>
                        </div>
                    </div>

                    {/* Track List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {loading ? (
                            <div className="py-12 text-center text-zinc-500">Loading tracks...</div>
                        ) : tracks.length === 0 ? (
                            <div className="py-12 text-center text-zinc-500 flex flex-col items-center gap-2">
                                <Music className="w-8 h-8 opacity-20" />
                                <p>No tracks in this playlist yet.</p>
                            </div>
                        ) : (
                            tracks.map((track, index) => (
                                <div
                                    key={track.id}
                                    onClick={() => handlePlayTrack(index)}
                                    className="group flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-800/50 cursor-pointer"
                                >
                                    {/* Cover */}
                                    <div className="relative w-12 h-12 rounded bg-zinc-800 overflow-hidden shrink-0">
                                        <Image
                                            src={track.image_url}
                                            alt={track.title}
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Play size={16} className="text-white fill-current" />
                                        </div>
                                    </div>

                                    {/* Info */}
                                    {isMixsetMode && index < tracks.length - 1 && (
                                        <div className="absolute left-[23px] top-[48px] h-[30px] w-0.5 bg-gradient-to-b from-blue-500/50 to-transparent z-0 pointer-events-none" />
                                    )}
                                    <div className="flex-1 min-w-0 z-10">
                                        <h4 className="text-sm font-semibold truncate text-zinc-200 group-hover:text-blue-400 transition-colors">
                                            {track.title}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-zinc-500 truncate">
                                                {track.profiles?.username || 'Unknown Artist'}
                                            </span>
                                            {track.is_ai_generated && (
                                                <span className="px-1 py-0.5 rounded text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                    AI
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <button
                                        onClick={(e) => removeTrack(track.id, e)}
                                        className="p-2 text-zinc-500 hover:text-red-400 opacity-100 transition-colors"
                                        title="Remove from playlist"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
                <BottomPlayerBar />
            </div>
        </AnimatePresence>
    )
}
