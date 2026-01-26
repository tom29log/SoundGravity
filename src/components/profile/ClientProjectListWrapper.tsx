'use client'

import dynamic from 'next/dynamic'
import ProfileProjectListSkeleton from '@/components/profile/ProfileProjectListSkeleton'

const ProjectListView = dynamic(() => import('@/components/profile/ProjectListView'), {
    ssr: false,
    loading: () => <ProfileProjectListSkeleton />
})

interface Props {
    profileId: string
}

export default function ClientProjectListWrapper({ profileId }: Props) {
    return <ProjectListView profileId={profileId} />
}
