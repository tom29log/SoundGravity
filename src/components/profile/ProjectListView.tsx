'use client'

import { useQuery } from '@tanstack/react-query'
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
    initialProjects: Project[]
}

export default function ProjectListView({ profileId, initialProjects }: ProjectListViewProps) {
    // Revert to useQuery with initialData to guaranteed instant render without Suspense fallback
    const { data: projects } = useQuery({
        queryKey: ['projects', profileId],
        queryFn: () => fetchProjects(profileId),
        initialData: initialProjects,
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
