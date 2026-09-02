import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const projectId = searchParams.get('projectId')
        if (!projectId) return NextResponse.json({ liked: false, likesCount: 0 })

        const supabaseServer = await createServerSupabaseClient()
        const { data: { user } } = await supabaseServer.auth.getUser()

        const adminSupabase = createAdminSupabaseClient()

        // Get total likes count from projects table
        const { data: proj } = await adminSupabase
            .from('projects')
            .select('likes')
            .eq('id', projectId)
            .maybeSingle()

        const likesCount = proj?.likes || 0

        if (!user) {
            return NextResponse.json({ liked: false, likesCount })
        }

        // Check if user liked this project
        const { data: existingLike } = await adminSupabase
            .from('likes')
            .select('id')
            .eq('project_id', projectId)
            .eq('user_id', user.id)
            .maybeSingle()

        return NextResponse.json({ liked: !!existingLike, likesCount })
    } catch (err: any) {
        return NextResponse.json({ liked: false, likesCount: 0 })
    }
}
