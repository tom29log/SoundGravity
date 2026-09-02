import { useInfiniteQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { Project } from '@/types'

const PAGE_SIZE = 12

export function useProjectsInfinite(
    initialData?: Project[],
    filters: { filter: 'latest' | 'popular', aiFilter: 'all' | 'human' | 'ai', genre?: string | null } = { filter: 'latest', aiFilter: 'all' }
) {
    const supabase = createClient()

    return useInfiniteQuery({
        queryKey: ['projects', 'infinite', filters],
        queryFn: async ({ pageParam = 0 }) => {
            const from = pageParam * PAGE_SIZE
            const to = from + PAGE_SIZE - 1

            // 1. Try relational query
            let query = supabase
                .from('projects')
                .select('*, profiles(username, avatar_url)')
                .range(from, to)

            if (filters.aiFilter === 'human') {
                query = query.eq('is_ai_generated', false)
            } else if (filters.aiFilter === 'ai') {
                query = query.eq('is_ai_generated', true)
            }

            if (filters.genre) {
                query = query.eq('genre', filters.genre)
            }

            if (filters.filter === 'latest') {
                query = query.order('created_at', { ascending: false })
            } else {
                query = query.order('plays', { ascending: false }).order('created_at', { ascending: false })
            }

            const { data: relationalData, error } = await query

            if (!error && relationalData && relationalData.length > 0) {
                return relationalData as unknown as Project[]
            }

            // 2. Fallback query if FK relationship is pending in PostgREST
            let fallbackQuery = supabase
                .from('projects')
                .select('*')
                .range(from, to)

            if (filters.genre) {
                fallbackQuery = fallbackQuery.eq('genre', filters.genre)
            }

            if (filters.filter === 'latest') {
                fallbackQuery = fallbackQuery.order('created_at', { ascending: false })
            } else {
                fallbackQuery = fallbackQuery.order('plays', { ascending: false }).order('created_at', { ascending: false })
            }

            const { data: rawProjects } = await fallbackQuery
            if (!rawProjects || rawProjects.length === 0) return []

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

            return rawProjects.map(p => ({
                ...p,
                profiles: profileMap[p.user_id] || { username: 'Artist', avatar_url: null }
            })) as unknown as Project[]
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.length < PAGE_SIZE) return undefined
            return allPages.length
        },
        initialData: initialData ? { pages: [initialData], pageParams: [0] } : undefined,
        staleTime: 10 * 1000,
    })
}
