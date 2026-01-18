'use plain'
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Trash2, ExternalLink } from 'lucide-react'
import Image from 'next/image'

interface Project {
    id: string
    title: string
    image_url: string
    target_url: string | null
    created_at: string
}

interface ProjectListProps {
    onSelect?: (id: string) => void
    selectedId?: string | null
}

export default function ProjectList({ onSelect, selectedId }: ProjectListProps) {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchProjects = async () => {
        const { data: { user } } = await supabase.auth.getUser()

        let query = supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false })

        if (user) {
            query = query.eq('user_id', user.id)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching projects:', error)
        } else {
            setProjects(data || [])
            // Auto-select first project if none selected
            if (data && data.length > 0 && !selectedId && onSelect) {
                onSelect(data[0].id)
            }
        }
        setLoading(false)
    }

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent selection when deleting
        if (!confirm('Are you sure you want to delete this project?')) return

        // 1. Delete files from storage
        // Extract paths from URLs if needed, assuming standard simple filename storage for now
        // Actually typically URL is public URL, easier to just delete row and potential orphaned files later
        // Or parse path properly. Simplest is just delete DB row for MVP if paths tricky.
        // Let's try to delete DB row first.

        // Better practice: delete storage items first?
        // Let's just delete the DB row for now to keep it simple and safe.

        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting project:', error)
            alert('Failed to delete project')
        } else {
            fetchProjects()
        }
    }

    useEffect(() => {
        fetchProjects()
    }, [])

    if (loading) return <div className="text-zinc-500">Loading projects...</div>
    if (projects.length === 0) return <div className="text-zinc-500">No projects found. Create one!</div>

    return (
        <div className="space-y-4">
            {projects.map((project) => (
                <div
                    key={project.id}
                    onClick={() => onSelect?.(project.id)}
                    className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${selectedId === project.id
                        ? 'bg-zinc-800 border-white'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                        }`}
                >
                    <div className="relative w-16 h-16 bg-zinc-800 rounded-md overflow-hidden flex-shrink-0">
                        <Image
                            src={project.image_url}
                            alt={project.title}
                            fill
                            className="object-cover"
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{project.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                            <span>{new Date(project.created_at).toLocaleDateString()}</span>
                            {project.target_url && (
                                <a
                                    href={project.target_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1 hover:text-white"
                                >
                                    <ExternalLink size={12} />
                                    Link
                                </a>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={(e) => handleDelete(project.id, e)}
                        className="p-2 text-zinc-500 hover:text-red-500 hover:bg-zinc-800 rounded-full transition-colors"
                        title="Delete Project"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ))}
        </div>
    )
}
