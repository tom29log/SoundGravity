import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { profileId, desiredState } = await request.json()
        if (!profileId) return NextResponse.json({ error: 'Missing profileId' }, { status: 400 })

        const supabaseServer = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabaseServer.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
        }

        if (user.id === profileId) {
            return NextResponse.json({ error: '자기 자신은 팔로우할 수 없습니다.' }, { status: 400 })
        }

        const adminSupabase = createAdminSupabaseClient()

        // 1. Check existing follow status
        const { data: existingFollow, error: followErr } = await adminSupabase
            .from('follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', profileId)
            .maybeSingle()

        const shouldFollow = desiredState !== undefined ? Boolean(desiredState) : !existingFollow

        if (shouldFollow) {
            if (!existingFollow) {
                await adminSupabase
                    .from('follows')
                    .insert({ follower_id: user.id, following_id: profileId })
            }
        } else {
            if (existingFollow) {
                await adminSupabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', user.id)
                    .eq('following_id', profileId)
            }
        }

        // 2. Count actual followers for target profile
        const { count: actualFollowersCount } = await adminSupabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', profileId)

        const finalFollowersCount = actualFollowersCount || 0

        // 3. Update profiles table followers_count
        await adminSupabase
            .from('profiles')
            .update({ followers_count: finalFollowersCount })
            .eq('id', profileId)

        return NextResponse.json({
            following: shouldFollow,
            followersCount: finalFollowersCount
        })

    } catch (err: any) {
        console.error('Error toggling follow:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
