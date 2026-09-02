import { createPublicClient } from '@/lib/supabase-public'
import GlobalFeed from '@/components/feed/GlobalFeed'
import { Project } from '@/types'

export const revalidate = 0 // Disable ISR cache during active setup to reflect uploads instantly

export default async function Home() {
  const supabase = createPublicClient()

  let initialProjects: Project[] = []

  try {
    // 1. Try relational query
    const { data: relationalData, error } = await supabase
      .from('projects')
      .select('*, profiles(username, avatar_url)')
      .order('created_at', { ascending: false })
      .range(0, 11)

    if (!error && relationalData && relationalData.length > 0) {
      initialProjects = relationalData as unknown as Project[]
    } else {
      // 2. Fallback query if FK relationship is pending in PostgREST
      const { data: rawProjects } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .range(0, 11)

      if (rawProjects && rawProjects.length > 0) {
        const userIds = Array.from(new Set(rawProjects.map(p => p.user_id).filter(Boolean)))
        let profileMap: Record<string, any> = {}

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', userIds)

          if (profiles) {
            profiles.forEach(p => {
              profileMap[p.id] = p
            })
          }
        }

        initialProjects = rawProjects.map(p => ({
          ...p,
          profiles: profileMap[p.user_id] || { username: 'Artist', avatar_url: null }
        })) as unknown as Project[]
      }
    }
  } catch (err) {
    console.error('Home page feed fetch error:', err)
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <GlobalFeed initialProjects={initialProjects} />
    </main>
  )
}
