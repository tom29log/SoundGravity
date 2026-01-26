'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import ProfileHeader from './ProfileHeader'

// Separate fetch function
async function fetchProfile(username: string) {
    const supabase = createClient()
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()
    return data
}

async function fetchTotalLikes(profileId: string) {
    const supabase = createClient()
    const { count } = await supabase
        .from('likes')
        .select('projects!inner(user_id)', { count: 'exact', head: true })
        .eq('projects.user_id', profileId)
    return count || 0
}

interface ProfileViewProps {
    username: string
}

export default function ProfileView({ username }: ProfileViewProps) {
    // 1. Profile Query
    const { data: profile } = useQuery({
        queryKey: ['profile', username],
        queryFn: () => fetchProfile(username),
        staleTime: 60 * 1000,
    })

    // 2. Likes Query (Dependent on Profile)
    const { data: totalLikes } = useQuery({
        queryKey: ['profile', 'likes', profile?.id],
        queryFn: () => fetchTotalLikes(profile!.id),
        enabled: !!profile?.id,
        staleTime: 60 * 1000,
    })

    if (!profile) return null // Should be handled by Hydration/InitialData

    return <ProfileHeader profile={profile} totalLikes={totalLikes || 0} />
}
