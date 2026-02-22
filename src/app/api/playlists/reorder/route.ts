import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { playlistId, tracks } = await request.json()

        if (!playlistId || !tracks || !Array.isArray(tracks)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
        }

        // Verify the user owns the playlist
        const { data: playlist, error: playlistError } = await supabase
            .from('playlists')
            .select('id')
            .eq('id', playlistId)
            .eq('user_id', user.id)
            .single()

        if (playlistError || !playlist) {
            return NextResponse.json({ error: 'Playlist not found or unauthorized' }, { status: 403 })
        }

        // Prepare bulk update array
        const updates = tracks.map((trackId: string, index: number) => ({
            playlist_id: playlistId,
            track_id: trackId,
            position: index
        }))

        // Perform bulk upsert. 
        // Supabase infers the PK (playlist_id, track_id) to update existing rows.
        const { error: updateError } = await supabase
            .from('playlist_tracks')
            .upsert(updates)

        if (updateError) {
            console.error('Reorder update error:', updateError)
            return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Playlist reorder error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
