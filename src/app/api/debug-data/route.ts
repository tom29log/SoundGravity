import { createPublicClient } from '@/lib/supabase-public'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = createPublicClient()

    // Test 1: projects table
    const { data: projects, error: projErr } = await supabase
        .from('projects')
        .select('id, title, likes, user_id')
        .limit(5)

    // Test 2: likes table
    const { data: likes, count: likeCount, error: likesErr } = await supabase
        .from('likes')
        .select('*', { count: 'exact' })
        .limit(5)

    // Test 3: playlist_tracks table
    const { data: playlistTracks, error: ptErr } = await supabase
        .from('playlist_tracks')
        .select('*')
        .limit(5)

    // Test 4: playlists table
    const { data: playlists, error: plErr } = await supabase
        .from('playlists')
        .select('id, title, user_id')
        .limit(5)

    return NextResponse.json({
        projects: { data: projects, error: projErr?.message },
        likes: { data: likes, count: likeCount, error: likesErr?.message },
        playlistTracks: { data: playlistTracks, error: ptErr?.message },
        playlists: { data: playlists, error: plErr?.message },
    })
}
