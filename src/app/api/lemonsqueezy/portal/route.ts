import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST() {
    const supabase = await createServerSupabaseClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's customer ID from profiles
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('lemonsqueezy_customer_id')
        .eq('id', user.id)
        .single()

    if (profileError || !profile?.lemonsqueezy_customer_id) {
        return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    const apiKey = process.env.LEMONSQUEEZY_API_KEY

    if (!apiKey) {
        console.error('Missing LemonSqueezy API key')
        return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 })
    }

    try {
        // Get customer portal URL from LemonSqueezy
        const response = await fetch(
            `https://api.lemonsqueezy.com/v1/customers/${profile.lemonsqueezy_customer_id}`,
            {
                headers: {
                    'Accept': 'application/vnd.api+json',
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        )

        if (!response.ok) {
            const errorData = await response.json()
            console.error('LemonSqueezy API error:', errorData)
            return NextResponse.json({ error: 'Failed to get portal URL' }, { status: 500 })
        }

        const data = await response.json()
        const portalUrl = data.data.attributes.urls?.customer_portal

        if (!portalUrl) {
            return NextResponse.json({ error: 'Portal URL not available' }, { status: 404 })
        }

        return NextResponse.json({ url: portalUrl })
    } catch (error) {
        console.error('Portal URL fetch error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
