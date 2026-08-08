import dns from 'node:dns'
try { dns.setDefaultResultOrder('ipv4first') } catch {}

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { email, password, username } = await request.json()

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
        }

        const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://arndqdrposydzyllljbv.supabase.co').trim()
        const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
        const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

        if (!serviceKey) {
            return NextResponse.json({ error: 'Server configuration error: Service key missing' }, { status: 500 })
        }

        // 1. Create user via Supabase Auth Admin REST API (Auto Confirms Email)
        const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`
            },
            body: JSON.stringify({
                email,
                password,
                email_confirm: true,
                user_metadata: { username }
            })
        })

        const authData = await authRes.json()

        if (!authRes.ok) {
            const errMsg = authData.msg || authData.message || authData.error_description || 'Signup failed'
            return NextResponse.json({ error: errMsg }, { status: authRes.status })
        }

        // 2. Upsert profile into public.profiles
        if (authData?.id) {
            await fetch(`${supabaseUrl}/rest/v1/profiles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': serviceKey,
                    'Authorization': `Bearer ${serviceKey}`,
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify({
                    id: authData.id,
                    username: username || email.split('@')[0],
                    avatar_url: null
                })
            })
        }

        // 3. Log user in and set session cookies
        const cookieStore = await cookies()
        const response = NextResponse.json({ success: true, user: authData })

        const supabase = createServerClient(
            supabaseUrl,
            anonKey,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options)
                            response.cookies.set(name, value, options)
                        })
                    },
                },
            }
        )

        await supabase.auth.signInWithPassword({ email, password })

        return response
    } catch (err: any) {
        console.error('Signup API error:', err)
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
    }
}
