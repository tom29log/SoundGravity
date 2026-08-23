import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vkqrnkmavdleekczllpe.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcXJua21hdmRsZWVrY3psbHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MzI4MDYsImV4cCI6MjEwMzAwODgwNn0.FCXVmFuzcZbiX1uIGaaQwkecwFNPA6J9-WkJ19pz3LU'

export const createAdminSupabaseClient = () => {
    return createSupabaseClient(
        SUPABASE_URL,
        SERVICE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
