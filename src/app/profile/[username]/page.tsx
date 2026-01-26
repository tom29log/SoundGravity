import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ProfileHeader from '@/components/profile/ProfileHeader'
import ProfileProjectList from '@/components/profile/ProfileProjectList'
import ShareProfileButton from '@/components/profile/ShareProfileButton'
import { Metadata } from 'next'

export const revalidate = 60 // Revalidate every minute

interface Props {
    params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const supabase = await createServerSupabaseClient()
    const { username } = await params
    const decodedUsername = decodeURIComponent(username)
    const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('username', decodedUsername)
        .single()

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
    const supabase = await createServerSupabaseClient()
    const { username } = await params
    const decodedUsername = decodeURIComponent(username)

    // 1. Fetch Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', decodedUsername)
        .single()

    if (!profile) {
        notFound()
    }

    // 2. Fetch Projects and Likes in Parallel
    const [projectsResult, likesResult] = await Promise.all([
        // A. Fetch Projects
        supabase
            .from('projects')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false }),

        // B. Fetch Total Likes (Optimized: Join directly via projects)
        supabase
            .from('likes')
            // Inner join with projects to filter by user_id
            .select('projects!inner(user_id)', { count: 'exact', head: true })
            .eq('projects.user_id', profile.id)
    ])

    const projects = projectsResult.data
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
                <ProfileHeader profile={profile} totalLikes={totalLikes} />

                <div className="mt-12">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent mb-12" />
                    {projects && projects.length > 0 ? (
                        <ProfileProjectList projects={projects} />
                    ) : (
                        <div className="text-center text-zinc-600 py-20 font-light">
                            No published projects yet.
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
