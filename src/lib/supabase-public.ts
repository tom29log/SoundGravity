import { createClient } from '@supabase/supabase-js'

// Client specifically for server-side fetching of PUBLIC data (no cookies/auth needed)
// avoiding the overhead of Next.js cookies() and dynamic rendering opt-in
export const createPublicClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
