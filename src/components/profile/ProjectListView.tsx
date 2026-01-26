'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import ProfileProjectList from './ProfileProjectList'
import { Project } from '@/types'

async function fetchProjects(profileId: string) {
    const supabase = createClient()
    const { data } = await supabase
        .from('projects')
        .select('id, title, image_url, created_at, views, is_ai_generated, user_id')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false })

    return (data as unknown) as Project[] || []
}

interface ProjectListViewProps {
    profileId: string
}

export default function ProjectListView({ profileId }: ProjectListViewProps) {
    // Use useSuspenseQuery to trigger parent Suspense boundary
    const { data: projects } = useSuspenseQuery({
        queryKey: ['projects', profileId],
        queryFn: () => fetchProjects(profileId),
        staleTime: 60 * 1000
    })

    if (!projects || projects.length === 0) {
        return (
            <div className="text-center text-zinc-600 py-20 font-light">
                No published projects yet.
            </div>
        )
    }

    return <ProfileProjectList projects={projects} />
}
