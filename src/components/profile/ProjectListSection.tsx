import { createServerSupabaseClient } from '@/lib/supabase-server'
import ProfileProjectList from './ProfileProjectList'
import { Project } from '@/types'

interface ProjectListSectionProps {
    profileId: string
    onTotalLikesCalculated?: (count: number) => void // Server Components can't pass data up easily without client wrappers, so we just render totals here or handle it differently?
    // Wait, TotalLikes is displayed in the Header.
    // If we move fetching here, the Header won't know the likes count immediately.
    // OPTION 1: Fetch Likes in Page (fast enough?) and only parallelize Projects?
    // OPTION 2: Fetch Likes here and display them here? No, design has them in Header.
    // OPTION 3: Keep Likes in Page. likes count query is fast index scan. Projects list is the heavy one.
}

// Decision: Fetch Likes in Page (it's fast). Fetch Projects here (heavy list).
// Actually, parallel fetching in Page was fast too.
// The main benefit of Suspense logic is rendering the Header *before* the list arrives.
// So we can clean up Page to fetch Profile -> Render Header (with 0 likes or loading state?) -> Suspense -> List.

// However, Likes are usually fast.
// Let's try to keep Likes in `page.tsx` for simpler passing to Header.
// And only offset `projects` fetching to this component.

export default async function ProjectListSection({ profileId }: { profileId: string }) {
    const supabase = await createServerSupabaseClient()

    // Artificial delay to demonstrate streaming (optional, remove in prod)
    // await new Promise(resolve => setTimeout(resolve, 500))

    const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false })

    const projects = (data as unknown) as Project[] || []

    if (projects.length === 0) {
        return (
            <div className="text-center text-zinc-600 py-20 font-light">
                No published projects yet.
            </div>
        )
    }

    return <ProfileProjectList projects={projects} />
}
