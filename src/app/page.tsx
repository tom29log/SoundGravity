import { createPublicClient } from '@/lib/supabase-public'
import GlobalFeed from '@/components/feed/GlobalFeed'
import { Project } from '@/types'

export const revalidate = 60 // ISR: Revalidate feed every minute

export default async function Home() {
  const supabase = createPublicClient()

  // Server-side fetch initial data (Default: Latest, All)
  const { data } = await supabase
    .from('projects')
    .select(`
            *,
            profiles (
               username,
               avatar_url
            )
        `)
    .order('created_at', { ascending: false })
    .range(0, 11) // PAGE_SIZE - 1 (First 12 items)

  const initialProjects = (data as unknown) as Project[] || []

  return (
    <main className="min-h-screen bg-black text-white">
      <GlobalFeed initialProjects={initialProjects} />
    </main>
  )
}
