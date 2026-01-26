import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ShareProfileButton from '@/components/profile/ShareProfileButton'
import { Metadata } from 'next'
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import ProfileView from '@/components/profile/ProfileView'
import ProjectListView from '@/components/profile/ProjectListView'

export const revalidate = 60

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

    const queryClient = new QueryClient()

    // 1. Fetch & Prefetch Profile (Server Side)
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', decodedUsername)
        .single()

    if (!profile) {
        notFound()
    }

    // Prefetch Profile to QueryClient
    await queryClient.prefetchQuery({
        queryKey: ['profile', decodedUsername],
        queryFn: () => profile,
    })

    // 2. Prefetch Projects & Likes (Parallel)
    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: ['projects', profile.id],
            queryFn: async () => {
                const { data } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('user_id', profile.id)
                    .order('created_at', { ascending: false })
                return (data as any) || []
            }
        }),
        queryClient.prefetchQuery({
            queryKey: ['profile', 'likes', profile.id],
            queryFn: async () => {
                const { count } = await supabase
                    .from('likes')
                    .select('projects!inner(user_id)', { count: 'exact', head: true })
                    .eq('projects.user_id', profile.id)
                return count || 0
            }
        })
    ])

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <main className="min-h-screen bg-black text-white relative">
                <ShareProfileButton />

                {/* Background Aesthetic */}
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-zinc-800/20 blur-[120px] rounded-full mix-blend-screen" />
                    <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-zinc-800/20 blur-[120px] rounded-full mix-blend-screen" />
                </div>

                <div className="relative z-10 container mx-auto px-4 pb-20">
                    <ProfileView username={decodedUsername} />

                    <div className="mt-12">
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent mb-12" />
                        <ProjectListView profileId={profile.id} />
                    </div>
                </div>
            </main>
        </HydrationBoundary>
    )
}
