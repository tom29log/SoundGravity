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

    if (!storeId || !productId || !apiKey) {
        console.error('Missing LemonSqueezy configuration')
        return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 })
    }

    try {
        // Create checkout session via LemonSqueezy API
        const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                data: {
                    type: 'checkouts',
                    attributes: {
                        checkout_data: {
                            custom: {
                                user_id: user.id
                            },
                            email: user.email
                        },
                        product_options: {
                            redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin?subscription=success`
                        }
                    },
                    relationships: {
                        store: {
                            data: {
                                type: 'stores',
                                id: storeId
                            }
                        },
                        variant: {
                            data: {
                                type: 'variants',
                                id: productId
                            }
                        }
                    }
                }
            })
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('LemonSqueezy API error:', errorData)
            return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
        }

        const data = await response.json()
        const checkoutUrl = data.data.attributes.url

        return NextResponse.json({ url: checkoutUrl })
    } catch (error) {
        console.error('Checkout creation error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
