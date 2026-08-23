import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const SUPABASE_URL = 'https://vkqrnkmavdleekczllpe.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcXJua21hdmRsZWVrY3psbHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MzI4MDYsImV4cCI6MjEwMzAwODgwNn0.FCXVmFuzcZbiX1uIGaaQwkecwFNPA6J9-WkJ19pz3LU'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const cookieStore = await cookies()
        const response = NextResponse.redirect(`${origin}${next}`)

        const supabase = createServerClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY,
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

        try {
            const { error } = await supabase.auth.exchangeCodeForSession(code)
            if (!error) {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('id', user.id)
                        .maybeSingle()

                    if (!profile) {
                        await supabase.from('profiles').insert({
                            id: user.id,
                            username: user.user_metadata.full_name || user.user_metadata.name || user.email?.split('@')[0] || 'User',
                            avatar_url: user.user_metadata.avatar_url || user.user_metadata.picture,
                        })
                    }
                }
                return response
            }
        } catch (e) {
            console.error('OAuth Callback Exception:', e)
        }
    }

    // Default fallback redirect to home feed instead of non-existent 404 page
    return NextResponse.redirect(`${origin}/`)
}
