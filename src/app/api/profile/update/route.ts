import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { username, bio, social_links, artist_type, primary_genre, header_image_url } = body

        // 1. Get current logged in user from session
        const supabaseServer = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabaseServer.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const adminSupabase = createAdminSupabaseClient()

        const payload = {
            id: user.id,
            username: (username || user.email?.split('@')[0] || 'User').trim(),
            bio: bio || '',
            social_links: social_links || {},
            artist_type: Array.isArray(artist_type) ? artist_type : [],
            primary_genre: Array.isArray(primary_genre) ? primary_genre : [],
            header_image_url: header_image_url || null,
            updated_at: new Date().toISOString()
        }

        // 2. Perform server-side upsert to guarantee persistence
        const { data: updatedProfile, error: upsertError } = await adminSupabase
            .from('profiles')
            .upsert(payload)
            .select()
            .single()

        if (upsertError) {
            console.error('Profile update upsert error:', upsertError)
            return NextResponse.json({ error: upsertError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, profile: updatedProfile })
    } catch (err: any) {
        console.error('Profile update route exception:', err)
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
    }
}
