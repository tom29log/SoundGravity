import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_URL = 'https://arndqdrposydzyllljbv.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFybmRxZHJwb3N5ZHp5bGxsamJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMDc3MDgsImV4cCI6MjEwMTU4MzcwOH0.Sylpwo3xGdqfMgj_me2wsC5dgHDbo8n85_8Ot4zJe7s'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Skip blocking auth check for Root, Profile, Login and API paths
    const { pathname } = request.nextUrl
    if (pathname === '/' || pathname.startsWith('/profile') || pathname.startsWith('/login') || pathname.startsWith('/api')) {
        return response
    }

    try {
        await supabase.auth.getUser()
    } catch {
        // Prevent middleware crash
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|profile|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
