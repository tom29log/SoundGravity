import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { username, bio, avatar_url, social_links, artist_type, primary_genre, header_image_url } = body

        // 1. Get current logged in user from session
        const supabaseServer = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabaseServer.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
        }

        const adminSupabase = createAdminSupabaseClient()

        // Fetch existing profile to preserve unchanged fields during partial updates
        const { data: existingProfile } = await adminSupabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()

        const payload = {
            id: user.id,
            username: (username || existingProfile?.username || user.email?.split('@')[0] || 'User').trim(),
            avatar_url: avatar_url !== undefined ? avatar_url : (existingProfile?.avatar_url || null),
            bio: bio !== undefined ? bio : (existingProfile?.bio || ''),
            social_links: social_links !== undefined ? social_links : (existingProfile?.social_links || {}),
            artist_type: artist_type !== undefined ? (Array.isArray(artist_type) ? artist_type : []) : (existingProfile?.artist_type || []),
            primary_genre: primary_genre !== undefined ? (Array.isArray(primary_genre) ? primary_genre : []) : (existingProfile?.primary_genre || []),
            header_image_url: header_image_url !== undefined ? header_image_url : (existingProfile?.header_image_url || null),
            updated_at: new Date().toISOString()
        }

        // 2. Perform server-side upsert
        const { data: updatedProfile, error: upsertError } = await adminSupabase
            .from('profiles')
            .upsert(payload)
            .select()
            .single()

        if (upsertError) {
            console.error('Profile update upsert error:', upsertError)
            return NextResponse.json({ error: upsertError.message, profile: payload }, { status: 200 })
        }

        return NextResponse.json({ success: true, profile: updatedProfile })
    } catch (err: any) {
        console.error('Profile update route exception:', err)
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
    }
}
