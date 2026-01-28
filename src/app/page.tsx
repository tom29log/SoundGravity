import { createClient } from '@supabase/supabase-js'
import GlobalFeed from '@/components/feed/GlobalFeed'
import { Project } from '@/types'

export const revalidate = 60 // ISR: Revalidate feed every minute

export default async function Home() {
  // OPTIMIZATION: Use raw client for public feed data to ensure pure Static Generation (ISR)
  // and avoid any cookie/header dependency that might trigger dynamic rendering or cold starts.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Server-side fetch initial data (Default: Latest, All)
  const { data } = await supabase
    .from('projects')
    .select(`
            *,
            profiles:profiles!projects_user_id_fkey_profiles (
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
