import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

export async function GET() {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return NextResponse.json({ error: 'Please log in first' }, { status: 401 })
    }

    const adminSupabase = createAdminSupabaseClient()

    // HARDCODED FIX for the user identified in logs
    // Email: googoos1@naver.com (assumed)
    // Customer ID: 7729287

    const { error: updateError } = await adminSupabase
        .from('profiles')
        .update({
            is_pro: true,
            lemonsqueezy_customer_id: '7729287'
        })
        .eq('id', user.id)

    if (updateError) {
        return NextResponse.json({
            error: 'Database update failed',
            details: updateError
        }, { status: 500 })
    }

    return NextResponse.json({
        success: true,
        message: 'Subscription manually linked!',
        user_email: user.email,
        linked_customer_id: '7729287'
    })
}
