import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://arndqdrposydzyllljbv.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFybmRxZHJwb3N5ZHp5bGxsamJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMDc3MDgsImV4cCI6MjEwMTU4MzcwOH0.Sylpwo3xGdqfMgj_me2wsC5dgHDbo8n85_8Ot4zJe7s'

// Client specifically for server-side fetching of PUBLIC data (no cookies/auth needed)
export const createPublicClient = () => {
    return createSupabaseClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    )
}
