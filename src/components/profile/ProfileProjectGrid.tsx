'use client'

import { Project } from '@/types'
import Image from 'next/image'
import { useRef, useState } from 'react'
import Link from 'next/link'

interface ProfileProjectGridProps {
    projects: Project[]
}

export default function ProfileProjectGrid({ projects }: ProfileProjectGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 md:gap-4 px-1 md:px-0 w-full max-w-7xl mx-auto">
            {projects.map(project => (
                <ProjectCard key={project.id} project={project} />
            ))}
        </div>
    )
}

function ProjectCard({ project }: { project: Project }) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [isHovering, setIsHovering] = useState(false)

    const handleMouseEnter = () => {
        setIsHovering(true)
        if (audioRef.current) {
            audioRef.current.volume = 0.5
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(() => { }) // Ignore autoplay errors
        }
    }

    const handleMouseLeave = () => {
        setIsHovering(false)
        if (audioRef.current) {
            audioRef.current.pause()
        }
    }

    return (
        <Link href={`/v/${project.id}`} className="block relative aspect-square overflow-hidden group">
            <div
                className="w-full h-full relative transition-transform duration-500 ease-out will-change-transform"
                style={{ transform: isHovering ? 'scale(1.02)' : 'scale(1)' }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <Image
                    src={project.image_url}
                    alt={project.title}
                    fill
                    className="object-cover"
                />

                {/* Hover Overlay */}
                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0'}`}>
                    <h3 className="text-white font-bold text-xl tracking-tight drop-shadow-md px-4 text-center">
                        {project.title}
                    </h3>
                </div>

                <audio ref={audioRef} src={project.audio_url} loop muted={false} />
            </div>
        </Link>
    )
}
