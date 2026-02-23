import ProfileHeader from '@/components/profile/ProfileHeader'
import ProjectListView from '@/components/profile/ProjectListView'
import { Profile, Project } from '@/types'

interface Props {
    profile: Profile
    totalLikes: number
    projects: Project[]
}

export default function ProfileContent({ profile, totalLikes, projects }: Props) {
    return (
        <div className="relative z-10 container mx-auto px-4 pb-20">
            {/* Header renders with pre-fetched profile data */}
            <ProfileHeader
                profile={profile}
                totalLikes={totalLikes}
            />

            <div className="mt-12">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent mb-12" />

                {/* List loads via ServerProps */}
                <ProjectListView projects={projects} />
            </div>
        </div>
    )
}
