import { createPublicClient } from '@/lib/supabase-public'
import InteractiveViewer from '@/components/InteractiveViewer'
import ProjectDetailView from '@/components/ProjectDetailView'
import { Metadata } from 'next'

export const revalidate = 0

async function getProject(id: string) {
    const supabase = createPublicClient()

    const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle()

    if (error) {
        console.error("Error fetching project:", error)
    }

    return project
}

type Props = {
    params: Promise<{ id: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    const { id } = await params
    const project = await getProject(id)

    if (!project) return { title: 'Project Not Found' }

    return {
        title: `${project.title} | SoundGravity`,
        description: `Listen to ${project.title} on SoundGravity`,
        openGraph: {
            title: project.title,
            description: 'Interactive Audio Experience',
            images: [project.image_url],
            audio: [project.audio_url],
        },
        twitter: {
            card: 'summary_large_image',
            title: project.title,
            description: 'Interactive Audio Experience',
            images: [project.image_url],
        },
    }
}

export default async function Page({ params, searchParams }: Props) {
    const { id } = await params
    const resolvedSearchParams = await searchParams
    const project = await getProject(id)

    if (!project) {
        return <div className="h-screen bg-black flex items-center justify-center text-white">Project not found</div>
    }

    const autoPlayParam = resolvedSearchParams?.autoPlay
    const autoPlay = autoPlayParam !== 'false'

    return <ProjectDetailView project={project} autoPlay={autoPlay} />
}
