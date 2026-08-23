import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://arndqdrposydzyllljbv.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFybmRxZHJwb3N5ZHp5bGxsamJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjAwNzcwOCwiZXhwIjoyMTAxNTgzNzA4fQ.m_esVnxPvnR6vWlYMI3ZH-rTcNARsWgQZnHn1Gm2DRA'

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
