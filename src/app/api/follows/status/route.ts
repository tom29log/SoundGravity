import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const profileId = searchParams.get('profileId')

        if (!profileId) return NextResponse.json({ error: 'Missing profileId' }, { status: 400 })

        const supabaseServer = await createServerSupabaseClient()
        const { data: { user } } = await supabaseServer.auth.getUser()

        const adminSupabase = createAdminSupabaseClient()

        let following = false
        if (user) {
            const { data } = await adminSupabase
                .from('follows')
                .select('id')
                .eq('follower_id', user.id)
                .eq('following_id', profileId)
                .maybeSingle()

            if (data) following = true
        }

        const { count } = await adminSupabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', profileId)

        return NextResponse.json({
            following,
            followersCount: count || 0
        })
    } catch (err: any) {
        return NextResponse.json({ following: false, followersCount: 0 })
    }
}
