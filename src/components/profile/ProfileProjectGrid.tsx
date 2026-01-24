'use client'

import { Project } from '@/types'
import Image from 'next/image'
import { useRef, useState } from 'react'

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
    const [isPlaying, setIsPlaying] = useState(false)
    const [isHovering, setIsHovering] = useState(false)

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault() // 페이지 이동 방지

        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause()
                setIsPlaying(false)
            } else {
                audioRef.current.volume = 0.5
                audioRef.current.currentTime = 0
                audioRef.current.play().catch(() => { })
                setIsPlaying(true)
            }
        }
    }

    const handleMouseEnter = () => {
        setIsHovering(true)
    }

    const handleMouseLeave = () => {
        setIsHovering(false)
    }

    return (
        <div
            className="block relative aspect-square overflow-hidden group cursor-pointer"
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div
                className="w-full h-full relative transition-transform duration-500 ease-out will-change-transform"
                style={{ transform: isHovering ? 'scale(1.02)' : 'scale(1)' }}
            >
                <Image
                    src={project.image_url}
                    alt={project.title}
                    fill
                    className="object-cover"
                />

                {/* Overlay */}
                <div className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-center transition-opacity duration-300 ${isHovering || isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                    {/* Play/Stop Icon */}
                    <div className="mb-2">
                        {isPlaying ? (
                            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <rect x="6" y="4" width="4" height="16" rx="1" />
                                <rect x="14" y="4" width="4" height="16" rx="1" />
                            </svg>
                        ) : (
                            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                    </div>
                    <h3 className="text-white font-bold text-xl tracking-tight drop-shadow-md px-4 text-center">
                        {project.title}
                    </h3>
                </div>

                <audio ref={audioRef} src={project.audio_url} loop muted={false} />
            </div>
        </div>
    )
}
