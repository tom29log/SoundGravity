import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const SUPABASE_URL = 'https://vkqrnkmavdleekczllpe.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcXJua21hdmRsZWVrY3psbHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MzI4MDYsImV4cCI6MjEwMzAwODgwNn0.FCXVmFuzcZbiX1uIGaaQwkecwFNPA6J9-WkJ19pz3LU'

// 서버 컴포넌트용 (Server Components, Route Handlers, Server Actions)
export const createServerSupabaseClient = async () => {
    const cookieStore = await cookies()

    return createServerClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Server Component에서는 쿠키 설정이 불가능 - 무시
                    }
                },
            },
        }
    )
}

// Alias for backward compatibility
export const createClient = createServerSupabaseClient
