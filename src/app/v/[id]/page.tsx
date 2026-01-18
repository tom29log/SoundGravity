import { createClient } from '@/lib/supabase'
import InteractiveViewer from '@/components/InteractiveViewer'
import { Metadata } from 'next'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Helper to create server client just for fetching data
// We can use createBrowserClient logic or just a simple fetch if public,
// but let's stick to consistent supabase pattern.
// Note: We need a server-side client creator.

async function getProject(id: string) {
    const cookieStore = await cookies()

    // Create a temporary client for fetching public data
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    // No-op for read-only
                },
            },
        }
    )

    const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

    return project
}

type Props = {
    params: Promise<{ id: string }>
}

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    // read route params
    const { id } = await params

    // fetch data
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

export default async function Page({ params }: Props) {
    const { id } = await params
    const project = await getProject(id)

    if (!project) {
        return <div className="h-screen bg-black flex items-center justify-center text-white">Project not found</div>
    }

    return <InteractiveViewer project={project} />
}
