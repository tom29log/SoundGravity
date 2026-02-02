import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST() {
    const supabase = await createServerSupabaseClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const storeId = process.env.LEMONSQUEEZY_STORE_ID
    const productId = process.env.LEMONSQUEEZY_PRODUCT_ID
    const apiKey = process.env.LEMONSQUEEZY_API_KEY

    // Console logs for server-side debugging if needed
    console.log('--- Lemon Squeezy Checkout Request ---')
    console.log('User:', user.id)

    if (!storeId || !productId || !apiKey) {
        console.error('Missing Lemon Squeezy environment variables')
        return NextResponse.json({ error: 'Missing Lemon Squeezy configuration' }, { status: 500 })
    }

    try {
        const payload = {
            data: {
                type: 'checkouts',
                attributes: {
                    checkout_data: {
                        custom: {
                            user_id: user.id
                        }
                    },
                    product_options: {
                        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin?success=true`,
                    }
                },
                relationships: {
                    store: {
                        data: {
                            type: 'stores',
                            id: storeId.toString()
                        }
                    },
                    variant: {
                        data: {
                            type: 'variants',
                            id: productId.toString()
                        }
                    }
                }
            }
        }

        const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Lemon Squeezy API Error:', JSON.stringify(data, null, 2))
            return NextResponse.json({ error: data.errors?.[0]?.detail || 'Failed to create checkout session' }, { status: response.status })
        }

        console.log('Checkout created successfully URL:', data.data.attributes.url)
        return NextResponse.json({ url: data.data.attributes.url })
    } catch (error) {
        console.error('Checkout creation error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
