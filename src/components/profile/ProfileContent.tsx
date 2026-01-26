import { createPublicClient } from '@/lib/supabase-public'
import { notFound } from 'next/navigation'
import ProfileHeader from '@/components/profile/ProfileHeader'
import ProjectListView from '@/components/profile/ProjectListView'
import ProfileProjectListSkeleton from '@/components/profile/ProfileProjectListSkeleton'
import { Suspense } from 'react'
import { getProfile } from '@/utils/data-fetchers'

interface Props {
    username: string
}

export default async function ProfileContent({ username }: Props) {
    // 1. Fetch Profile (Blocking execution of this component, but not the whole page shell)
    const profile = await getProfile(username)

    if (!profile) {
        notFound()
    }

    // 2. Fetch Total Likes (Blocking)
    const supabase = createPublicClient()
    const { count: totalLikes } = await supabase
        .from('likes')
        .select('projects!inner(user_id)', { count: 'exact', head: true })
        .eq('projects.user_id', profile.id)

    return (
        <div className="relative z-10 container mx-auto px-4 pb-20">
            {/* Header renders after profile data is ready */}
            <ProfileHeader
                profile={profile}
                totalLikes={totalLikes || 0}
            />

            <div className="mt-12">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent mb-12" />

                {/* List loads via Streaming (Suspense) - Nested Suspense */}
                <Suspense fallback={<ProfileProjectListSkeleton />}>
                    <ProjectListView profileId={profile.id} />
                </Suspense>
            </div>
        </div>
    )
}
