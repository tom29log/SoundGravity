import dns from 'node:dns'
try { dns.setDefaultResultOrder('ipv4first') } catch {}

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
        }

        const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://arndqdrposydzyllljbv.supabase.co').trim()
        const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

        const cookieStore = await cookies()
        const response = NextResponse.json({ success: true })

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

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return response
    } catch (err: any) {
        console.error('Login API error:', err)
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
    }
}
