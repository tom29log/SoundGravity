import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const hmac = crypto.createHmac('sha256', secret)
    const digest = hmac.update(payload).digest('hex')

    // Handle case where lengths are different
    if (signature.length !== digest.length) {
        return false
    }

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

export async function POST(request: NextRequest) {
    const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!webhookSecret || !supabaseUrl || !supabaseServiceKey) {
        console.error('Missing required environment variables')
        return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    // Create admin client inside function to avoid build-time errors
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Get raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('x-signature') || ''

    // Verify signature
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.error('Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(rawBody)
    const eventName = payload.meta?.event_name
    const customData = payload.meta?.custom_data || {}
    const userId = customData.user_id

    console.log('LemonSqueezy webhook received:', eventName, 'for user:', userId)

    if (!userId) {
        console.error('No user_id in webhook custom data')
        return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    const subscriptionId = payload.data?.id?.toString()
    const customerId = payload.data?.attributes?.customer_id?.toString()

    try {
        switch (eventName) {
            case 'subscription_created':
            case 'subscription_resumed':
            case 'subscription_updated': {
                const status = payload.data?.attributes?.status
                const isPro = status === 'active' || status === 'on_trial'

                await supabaseAdmin
                    .from('profiles')
                    .update({
                        is_pro: isPro,
                        subscription_id: subscriptionId,
                        lemonsqueezy_customer_id: customerId
                    })
                    .eq('id', userId)

                console.log(`Updated user ${userId}: is_pro = ${isPro}`)
                break
            }

            case 'subscription_cancelled':
            case 'subscription_expired':
            case 'subscription_paused': {
                await supabaseAdmin
                    .from('profiles')
                    .update({
                        is_pro: false
                    })
                    .eq('id', userId)

                console.log(`User ${userId} subscription ended`)
                break
            }

            default:
                console.log('Unhandled event:', eventName)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('Webhook processing error:', error)
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
    }
}

