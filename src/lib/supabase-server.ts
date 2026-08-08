import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://arndqdrposydzyllljbv.supabase.co').trim()
const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFybmRxZHJwb3N5ZHp5bGxsamJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMDc3MDgsImV4cCI6MjEwMTU4MzcwOH0.Sylpwo3xGdqfMgj_me2wsC5dgHDbo8n85_8Ot4zJe7s').trim()

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
