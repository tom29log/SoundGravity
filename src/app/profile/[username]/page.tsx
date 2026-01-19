import { createClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import ProfileHeader from '@/components/profile/ProfileHeader'
import ProfileProjectGrid from '@/components/profile/ProfileProjectGrid'
import ShareProfileButton from '@/components/profile/ShareProfileButton'
import { Metadata } from 'next'

export const revalidate = 60 // Revalidate every minute

interface Props {
    params: { username: string }
}

// Generate Metadata for SEO/Sharing
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const supabase = createClient()
    const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('username', params.username)
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
    const supabase = createClient()
    const { username } = params

    // 1. Fetch Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

    if (!profile) {
        notFound()
    }

    // 2. Fetch Projects
    // We also need to know the 'type' of access, but for now Public is fine.
    // Assuming 'projects' table RLS allows public select.
    const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

    // 3. Calculate Total Likes
    // This is a bit heavy if many projects, but fine for MVP.
    // Better way: Join projects with likes count.
    // For now: Fetch all likes for these projects.
    // Optimization: Add a DB function or view later.
    let totalLikes = 0
    if (projects && projects.length > 0) {
        const projectIds = projects.map(p => p.id)
        const { count } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .in('project_id', projectIds)

        totalLikes = count || 0
    }

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
                        <ProfileProjectGrid projects={projects} />
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
