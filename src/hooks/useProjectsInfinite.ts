import { useInfiniteQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { Project } from '@/types'

const PAGE_SIZE = 12

export function useProjectsInfinite(
    initialData?: Project[],
    filters: { filter: 'latest' | 'popular', aiFilter: 'all' | 'human' | 'ai' } = { filter: 'latest', aiFilter: 'all' }
) {
    const supabase = createClient()

    return useInfiniteQuery({
        queryKey: ['projects', 'infinite', filters],
        queryFn: async ({ pageParam = 0 }) => {
            const from = pageParam * PAGE_SIZE
            const to = from + PAGE_SIZE - 1

            let query = supabase
                .from('projects')
                .select(`
                *,
                profiles:profiles!projects_user_id_fkey_profiles (
                   username,
                   avatar_url
                )
            `)
                .range(from, to)
                .eq('is_hidden', false) // Exclude hidden projects

            // Apply filters
            if (filters.aiFilter === 'human') {
                query = query.eq('is_ai_generated', false)
            } else if (filters.aiFilter === 'ai') {
                query = query.eq('is_ai_generated', true)
            }

            if (filters.filter === 'latest') {
                query = query.order('created_at', { ascending: false })
            } else {
                query = query.order('views', { ascending: false }).order('created_at', { ascending: false })
            }

            const { data, error } = await query
            if (error) throw error
            return (data as unknown) as Project[]
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.length < PAGE_SIZE) return undefined
            return allPages.length
        },
        initialData: initialData ? { pages: [initialData], pageParams: [0] } : undefined,
        staleTime: 60 * 1000, // 1 minute
    })
}
