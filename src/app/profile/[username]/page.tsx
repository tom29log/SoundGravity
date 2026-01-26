import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ShareProfileButton from '@/components/profile/ShareProfileButton'
import { Metadata } from 'next'
import ProfileView from '@/components/profile/ProfileView'
import ProjectListView from '@/components/profile/ProjectListView'
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

    // 0. Init Supabase for list fetching
    const supabase = await createServerSupabaseClient()

    // 1. Fetch Profile (Cached request)
    const profile = await getProfile(decodedUsername)

    if (!profile) {
        notFound()
    }

    // 2. Fetch Projects & Likes directly (Parallel)
    // We fetch these on the server and pass them as props to avoid any client-side hydration gaps.
    const [projectsResult, likesResult] = await Promise.all([
        supabase
            .from('projects')
            .select('id, title, image_url, created_at, views, is_ai_generated, user_id')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false }),

        supabase
            .from('likes')
            .select('projects!inner(user_id)', { count: 'exact', head: true })
            .eq('projects.user_id', profile.id)
    ])

    const projects = (projectsResult.data as any) || []
    const totalLikes = likesResult.count || 0

    return (
        <main className="min-h-screen bg-black text-white relative">
            <ShareProfileButton />

            {/* Background Aesthetic */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-zinc-800/20 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-zinc-800/20 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <div className="relative z-10 container mx-auto px-4 pb-20">
                <ProfileView
                    username={decodedUsername}
                    initialProfile={profile}
                    initialLikes={totalLikes}
                />

                <div className="mt-12">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent mb-12" />

                    <ProjectListView
                        profileId={profile.id}
                        initialProjects={projects}
                    />
                </div>
            </div>
        </main>
    )
}
