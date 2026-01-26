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
    initialProfile: any // Type this properly if possible, but 'any' avoids strict type mismatch with Supabase generated types for now
    initialLikes: number
}

export default function ProfileView({ username, initialProfile, initialLikes }: ProfileViewProps) {
    // 1. Profile Query (Initialize with Server Data)
    const { data: profile } = useQuery({
        queryKey: ['profile', username],
        queryFn: () => fetchProfile(username),
        initialData: initialProfile,
        staleTime: 60 * 1000,
    })

    // 2. Likes Query (Initialize with Server Data)
    const { data: totalLikes } = useQuery({
        queryKey: ['profile', 'likes', profile?.id],
        queryFn: () => fetchTotalLikes(profile!.id),
        initialData: initialLikes,
        enabled: !!profile?.id,
        staleTime: 60 * 1000,
    })

    if (!profile) return null

    return <ProfileHeader profile={profile} totalLikes={totalLikes || 0} />
}
