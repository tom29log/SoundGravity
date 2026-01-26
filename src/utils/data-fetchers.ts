import { cache } from 'react'
import { createPublicClient } from '@/lib/supabase-public'

export const getProfile = cache(async (username: string) => {
    const supabase = createPublicClient()
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()
    return data
})
