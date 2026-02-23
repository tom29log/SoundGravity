import { notFound } from 'next/navigation'
import ShareProfileButton from '@/components/profile/ShareProfileButton'
import { Metadata } from 'next'
import ProfileContent from '@/components/profile/ProfileContent'
import Loading from './loading'
import { Suspense } from 'react'
import { getProfile } from '@/utils/data-fetchers'
import { createPublicClient } from '@/lib/supabase-public'

export const revalidate = 60

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

    // 1. Fetch Profile Data
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', decodedUsername)
        .single()

    if (profileError || !profile) {
        console.error('Profile fetch error Server-Side:', profileError)
        notFound()
    }

    // 2. Fetch Total Likes & Projects in Parallel
    const [likesResult, projectsResult] = await Promise.all([
        supabase.rpc('get_user_total_likes', { target_user_id: profile.id }),
        supabase.from('projects')
            .select('id, title, image_url, created_at, views, is_ai_generated, user_id, genre, stems')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
    ])

    const totalLikes = Number(likesResult.data) || 0
    const projects = (projectsResult.data as any) || []

    return (
        <main className="min-h-screen bg-black text-white relative">
            <ShareProfileButton />

            {/* Background Aesthetic - Renders INSTANTLY (0ms Blocking) */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-zinc-800/20 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-zinc-800/20 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            {/* Fully SSR'd Content - No Loading Skeleton on client-side route transitions (Next.js automatically suspends the route until this SSR completes) */}
            <Suspense fallback={<Loading />}>
                <ProfileContent profile={profile} totalLikes={totalLikes} projects={projects} />
            </Suspense>
        </main>
    )
}
