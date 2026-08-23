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
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
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

        // 2. Perform server-side upsert
        const { data: updatedProfile, error: upsertError } = await adminSupabase
            .from('profiles')
            .upsert(payload)
            .select()
            .single()

        if (upsertError) {
            console.error('Profile update upsert error:', upsertError)
            if (upsertError.message.includes('schema cache') || upsertError.message.includes('profiles')) {
                return NextResponse.json({ 
                    error: '수파베이스 DB에 profiles 테이블 생성이 필요합니다. SQL 스크립트를 수파베이스 대시보드에서 1회 실행(Run)해 주세요.', 
                    profile: payload 
                }, { status: 200 })
            }
            return NextResponse.json({ error: upsertError.message, profile: payload }, { status: 200 })
        }

        return NextResponse.json({ success: true, profile: updatedProfile })
    } catch (err: any) {
        console.error('Profile update route exception:', err)
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
    }
}
