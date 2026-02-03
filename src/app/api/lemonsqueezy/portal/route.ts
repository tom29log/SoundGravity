import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

export async function POST() {
    const supabase = await createServerSupabaseClient()

    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = process.env.LEMONSQUEEZY_API_KEY
    if (!apiKey) {
        return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    // 2. Try to get customer ID from DB
    const { data: profile } = await supabase
        .from('profiles')
        .select('lemonsqueezy_customer_id')
        .eq('id', user.id)
        .single()

    let customerId = profile?.lemonsqueezy_customer_id

    // 3. Fallback: If no ID in DB, search by Email on Lemon Squeezy
    if (!customerId && user.email) {
        console.log(`[Portal] Searching customer by email: ${user.email}`)
        try {
            const searchRes = await fetch(
                `https://api.lemonsqueezy.com/v1/customers?filter[email]=${user.email}`,
                {
                    headers: {
                        'Accept': 'application/vnd.api+json',
                        'Authorization': `Bearer ${apiKey}`
                    }
                }
            )
            const searchData = await searchRes.json()
            if (searchData.data && searchData.data.length > 0) {
                // Found the customer!
                customerId = searchData.data[0].id
                console.log(`[Portal] Found Customer ID: ${customerId}`)

                // Self-Healing: Try to save it to DB (ignore error if column doesn't exist yet)
                const adminSupabase = createAdminSupabaseClient()
                await adminSupabase
                    .from('profiles')
                    .update({ lemonsqueezy_customer_id: customerId })
                    .eq('id', user.id)
                    .catch(e => console.warn('Failed to save customer_id (column might be missing)', e))
            }
        } catch (e) {
            console.error('[Portal] Customer lookup failed:', e)
        }
    }

    if (!customerId) {
        return NextResponse.json({ error: 'No subscription found for this user.' }, { status: 404 })
    }

    try {
        // 4. Get Customer Portal URL
        // Endpoint: /v1/customers/:id -> attributes.urls.customer_portal
        const response = await fetch(
            `https://api.lemonsqueezy.com/v1/customers/${customerId}`,
            {
                headers: {
                    'Accept': 'application/vnd.api+json',
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        )

        const data = await response.json()
        const portalUrl = data.data?.attributes?.urls?.customer_portal

        if (!portalUrl) {
            console.error('[Portal] Start failed:', JSON.stringify(data))
            return NextResponse.json({
                error: 'Failed to generate portal link',
                details: data,
                customerId: customerId
            }, { status: 500 })
        }

        return NextResponse.json({ url: portalUrl })
    } catch (error) {
        console.error('[Portal] Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
