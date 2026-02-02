import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import crypto from 'crypto'

export async function POST(request: Request) {
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET

    // If secret isn't set, we can't verify, so fail securely (or just log if dev)
    if (!secret) {
        console.error('LEMONSQUEEZY_WEBHOOK_SECRET is not set');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    try {
        // 1. Get raw body for signature verification
        const rawBody = await request.text()

        // 2. Verify Signature
        const signature = request.headers.get('x-signature') || ''
        const hmac = crypto.createHmac('sha256', secret)
        const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8')
        const signatureBuffer = Buffer.from(signature, 'utf8')

        if (digest.length !== signatureBuffer.length || !crypto.timingSafeEqual(digest, signatureBuffer)) {
            console.error('Invalid Webhook Signature')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        // 3. Parse Payload
        const payload = JSON.parse(rawBody)
        const eventName = payload.meta.event_name

        // Extract user_id from "custom_data" (passed during checkout)
        // Lemon Squeezy passes custom_data in meta for some events, or inside attributes for others.
        // Usually checkout_data inside meta or attributes.
        const userId = payload.meta.custom_data?.user_id || payload.data.attributes.checkout_data?.custom?.user_id

        console.log(`[Webhook] Event: ${eventName}, User: ${userId}`)

        if (!userId) {
            console.log('[Webhook] No user_id found in payload, ignoring.')
            return NextResponse.json({ message: 'No user_id, ignored' })
        }

        // 4. Handle Specific Events
        // We care about 'order_created' (one-time) or 'subscription_created'/'subscription_updated' (subs)
        if (['order_created', 'subscription_created', 'subscription_updated', 'subscription_payment_success'].includes(eventName)) {

            const status = payload.data.attributes.status // e.g. 'paid', 'active'
            const isActive = status === 'paid' || status === 'active' || status === 'on_trial'

            if (isActive) {
                const supabase = await createServerSupabaseClient()

                // Update user to PRO
                const { error } = await supabase
                    .from('profiles')
                    .update({ is_pro: true })
                    .eq('id', userId)

                if (error) {
                    console.error('[Webhook] DB Update Failed:', error)
                    return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
                }
                console.log(`[Webhook] Success! User ${userId} upgraded to PRO.`)
            } else {
                console.log(`[Webhook] Status is '${status}', not upgrading user.`)
                // Optionally handle 'expired' or 'cancelled' to remove PRO status
                if (status === 'expired' || status === 'cancelled') {
                    const supabase = await createServerSupabaseClient()
                    await supabase.from('profiles').update({ is_pro: false }).eq('id', userId)
                    console.log(`[Webhook] User ${userId} downgraded due to status '${status}'.`)
                }
            }
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('[Webhook] Processing Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
