'use client'

import { Project } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { Play } from 'lucide-react'

interface ProfileProjectListProps {
    projects: Project[]
}

export default function ProfileProjectList({ projects }: ProfileProjectListProps) {
    return (
        <div className="flex flex-col gap-2 w-full max-w-3xl mx-auto">
            {projects.map(project => (
                <Link
                    key={project.id}
                    href={`/v/${project.id}`}
                    prefetch={true}
                    className="group flex items-center gap-4 p-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-800/60 border border-transparent hover:border-zinc-700/50 transition-all active:scale-[0.99] duration-200"
                >
                    {/* Thumbnail */}
                    <div className="relative w-14 h-14 rounded-lg bg-zinc-800 overflow-hidden shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                        <Image
                            src={project.image_url}
                            alt={project.title}
                            fill
                            sizes="56px"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {/* Play Icon Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play size={20} className="text-white fill-current drop-shadow-md" />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                        <h4 className="font-semibold text-base text-zinc-100 truncate group-hover:text-white transition-colors">
                            {project.title}
                        </h4>

                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            {project.is_ai_generated && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                    AI
                                </span>
                            )}
                            <span className="truncate">
                                {new Date(project.created_at).toLocaleDateString()}
                            </span>
                            {project.views !== undefined && (
                                <>
                                    <span>•</span>
                                    <span>{project.views} plays</span>
                                </>
                            )}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    )
}
