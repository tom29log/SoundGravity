'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Project } from '@/types'
import { ListMusic, Music2 } from 'lucide-react'
import PlaylistDetailModal from './PlaylistDetailModal'

interface Playlist {
    id: string
    title: string
    description: string | null
    created_at: string
}

export default function PlaylistList() {
    const [playlists, setPlaylists] = useState<Playlist[]>([])
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const supabase = createClient()

    const fetchPlaylists = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('playlists')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (data) {
            setPlaylists(data)
        }
    }

    useEffect(() => {
        fetchPlaylists()
    }, [])

    return (
        <div className="space-y-4">
            {playlists.length === 0 ? (
                <div className="text-zinc-500 text-sm text-center py-8 bg-zinc-900/30 rounded-lg border border-zinc-800/50">
                    <ListMusic className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No playlists yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {playlists.map((playlist) => (
                        <div
                            key={playlist.id}
                            onClick={() => {
                                setSelectedPlaylist(playlist)
                                setIsDetailOpen(true)
                            }}
                            className="bg-zinc-900 hover:bg-zinc-800 transition-colors rounded-xl p-4 cursor-pointer border border-zinc-800 flex flex-col gap-3 group"
                        >
                            <div className="w-full aspect-square bg-zinc-950 rounded-lg flex items-center justify-center text-zinc-700 group-hover:text-zinc-500 transition-colors">
                                <Music2 size={32} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-zinc-100 truncate group-hover:text-white">{playlist.title}</h3>
                                <p className="text-xs text-zinc-500 truncate">{playlist.description || 'No description'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedPlaylist && (
                <PlaylistDetailModal
                    isOpen={isDetailOpen}
                    onClose={() => {
                        setIsDetailOpen(false)
                        setSelectedPlaylist(null)
                    }}
                    playlist={selectedPlaylist}
                />
            )}
        </div>
    )
}
