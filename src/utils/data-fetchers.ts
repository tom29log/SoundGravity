import { cache } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const getProfile = cache(async (username: string) => {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()
    return data
})
