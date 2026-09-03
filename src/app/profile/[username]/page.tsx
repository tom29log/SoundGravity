import { Metadata } from 'next'
import ProfileContent from '@/components/profile/ProfileContent'
import Loading from './loading'
import { Suspense } from 'react'
import { getProfile } from '@/utils/data-fetchers'
import { createPublicClient } from '@/lib/supabase-public'
import ShareProfileButton from '@/components/profile/ShareProfileButton'

export const revalidate = 0

interface Props {
    params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { username } = await params
    const decodedUsername = decodeURIComponent(username)
    const profile = await getProfile(decodedUsername)
    if (!profile) return { title: 'User Not Found' }

    return {
        title: `${profile.username} | SoundGravity`,
        description: `Check out ${profile.username}'s audio projects on SoundGravity.`,
        openGraph: {
            images: profile.avatar_url ? [profile.avatar_url] : [],
        }
    }
}

export default async function ProfilePage({ params }: Props) {
    const { username } = await params
    const decodedUsername = decodeURIComponent(username)

    const supabase = createPublicClient()

    // 1. Fetch Profile Data (flexible matching by username or ID)
    let profile = null

    const { data: byUsername } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', decodedUsername)
        .maybeSingle()

    if (byUsername) {
        profile = byUsername
    } else {
        const { data: byId } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', decodedUsername)
            .maybeSingle()

        if (byId) {
            profile = byId
        } else {
            // Fallback: Use single profile if active in DB
            const { data: firstProfile } = await supabase
                .from('profiles')
                .select('*')
                .limit(1)
                .maybeSingle()

            if (firstProfile) {
                profile = firstProfile
            }
        }
    }

    if (!profile) {
        profile = {
            id: decodedUsername,
            username: decodedUsername,
            avatar_url: null,
            bio: '',
            followers_count: 0,
            is_pro: false,
            updated_at: new Date().toISOString()
        }
    }

    // 2. Fetch Projects and calculate Total Likes
    let projects: any[] = []

    if (profile?.id) {
        const { data: userProjects } = await supabase
            .from('projects')
            .select('id, title, image_url, audio_url, created_at, views, is_ai_generated, user_id, genre, stems, likes')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })

        if (userProjects && userProjects.length > 0) {
            projects = userProjects
        }
    }

    // Fallback: If userProjects is empty, query all uploaded projects
    if (projects.length === 0) {
        const { data: allProjects } = await supabase
            .from('projects')
            .select('id, title, image_url, audio_url, created_at, views, is_ai_generated, user_id, genre, stems, likes')
            .order('created_at', { ascending: false })

        if (allProjects && allProjects.length > 0) {
            projects = allProjects
        }
    }

    const { data: allProjectsData } = await supabase
        .from('projects')
        .select('likes')

    const dbTotalLikes = (allProjectsData || []).reduce((acc: number, p: any) => acc + (Number(p.likes) || 0), 0)
    const calculatedLikes = projects.reduce((acc: number, p: any) => acc + (Number(p.likes) || 0), 0)
    const totalLikes = Math.max(calculatedLikes, dbTotalLikes)

    return (
        <main className="min-h-screen bg-black text-white relative">
            <ShareProfileButton />

            {/* Background Aesthetic */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-zinc-800/20 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-zinc-800/20 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <Suspense fallback={<Loading />}>
                <ProfileContent profile={profile} totalLikes={totalLikes} projects={projects} />
            </Suspense>
        </main>
    )
}
