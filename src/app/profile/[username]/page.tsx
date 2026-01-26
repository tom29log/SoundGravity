import { createPublicClient } from '@/lib/supabase-public'
import { notFound } from 'next/navigation'
import ShareProfileButton from '@/components/profile/ShareProfileButton'
import { Metadata } from 'next'
import ProfileView from '@/components/profile/ProfileView'
import ProjectListView from '@/components/profile/ProjectListView'
import ProfileProjectListSkeleton from '@/components/profile/ProfileProjectListSkeleton'
import { Suspense } from 'react'
import { getProfile } from '@/utils/data-fetchers'

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

    // Init Supabase for likes count (Public client, no cookies needed)
    const supabase = createPublicClient()

    // 1. Fetch Profile (Blocking, Fast)
    const profile = await getProfile(decodedUsername)

    if (!profile) {
        notFound()
    }

    // 2. Fetch Total Likes (Blocking, Fast)
    const { count: totalLikes } = await supabase
        .from('likes')
        .select('projects!inner(user_id)', { count: 'exact', head: true })
        .eq('projects.user_id', profile.id)

    // 3. Projects List is NOT fetched here.
    // We let the client component fetch it appropriately to reduce initial HTML size
    // and solve the Safari 10s delay. This is "Hybrid Loading".

    return (
        <main className="min-h-screen bg-black text-white relative">
            <ShareProfileButton />

            {/* Background Aesthetic */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-zinc-800/20 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-zinc-800/20 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <div className="relative z-10 container mx-auto px-4 pb-20">
                {/* Header renders instantly with server data */}
                <ProfileView
                    username={decodedUsername}
                    initialProfile={profile}
                    initialLikes={totalLikes || 0}
                />

                <div className="mt-12">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent mb-12" />

                    {/* List loads via Streaming (Suspense) */}
                    <Suspense fallback={<ProfileProjectListSkeleton />}>
                        <ProjectListView profileId={profile.id} />
                    </Suspense>
                </div>
            </div>
        </main>
    )
}
