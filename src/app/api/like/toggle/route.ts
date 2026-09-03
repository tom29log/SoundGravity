import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { projectId, desiredState } = await request.json()
        if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

        const supabaseServer = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabaseServer.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
        }

        const adminSupabase = createAdminSupabaseClient()

        // Check existing like
        const { data: existingLike, error: likeError } = await adminSupabase
            .from('likes')
            .select('id')
            .eq('project_id', projectId)
            .eq('user_id', user.id)
            .maybeSingle()

        // If likes table doesn't exist in Supabase DB (PGRST205)
        if (likeError && (likeError.message.includes('likes') || likeError.code === 'PGRST205')) {
            const { data: proj } = await adminSupabase
                .from('projects')
                .select('likes')
                .eq('id', projectId)
                .maybeSingle()

            const currentLikes = proj?.likes || 0
            const shouldLike = desiredState !== undefined ? Boolean(desiredState) : true
            const newCount = shouldLike ? currentLikes + 1 : Math.max(0, currentLikes - 1)

            await adminSupabase
                .from('projects')
                .update({ likes: newCount })
                .eq('id', projectId)

            return NextResponse.json({ liked: shouldLike, likesCount: newCount })
        }

        let isLiked = false
        const shouldLike = desiredState !== undefined ? Boolean(desiredState) : !existingLike

        if (shouldLike) {
            if (!existingLike) {
                await adminSupabase
                    .from('likes')
                    .insert({ project_id: projectId, user_id: user.id })
            }
            isLiked = true
        } else {
            if (existingLike) {
                await adminSupabase
                    .from('likes')
                    .delete()
                    .eq('project_id', projectId)
                    .eq('user_id', user.id)
            }
            isLiked = false
        }

        // Get total count
        const { count } = await adminSupabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId)

        const finalCount = count || 0

        // Sync with projects table
        await adminSupabase
            .from('projects')
            .update({ likes: finalCount })
            .eq('id', projectId)

        return NextResponse.json({ liked: isLiked, likesCount: finalCount })
    } catch (err: any) {
        console.error('Error toggling like:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
