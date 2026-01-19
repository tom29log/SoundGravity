'use client'

import { Profile } from '@/types'
import { Instagram, Music, Globe } from 'lucide-react' // Lucide icons for social
import Image from 'next/image'
import StatGraph from './StatGraph'

interface ProfileHeaderProps {
    profile: Profile
    totalLikes: number
}

export default function ProfileHeader({ profile, totalLikes }: ProfileHeaderProps) {
    const socialLinks = profile.social_links || {}

    return (
        <div className="flex flex-col items-center justify-center space-y-8 py-12">
            {/* Avatar - Large Circle */}
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border border-zinc-800 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
                {profile.avatar_url ? (
                    <Image
                        src={profile.avatar_url}
                        alt={profile.username || 'Artist'}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-4xl font-thin text-zinc-600">
                        {profile.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                )}
            </div>

            {/* Username */}
            <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white">
                {profile.username || 'Unknown Artist'}
            </h1>

            {/* Social Links */}
            <div className="flex items-center gap-6 text-zinc-400">
                {socialLinks.instagram && (
                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                        <Instagram size={20} />
                    </a>
                )}
                {socialLinks.soundcloud && (
                    <a href={socialLinks.soundcloud} target="_blank" rel="noopener noreferrer" className="hover:text-[#ff7700] transition-colors">
                        <Music size={20} />
                    </a>
                )}
                {/* Fallback for generic links */}
                {/* Add more icons as needed */}
            </div>

            {/* Stats Graph */}
            <div className="flex items-center gap-12 mt-8">
                <StatGraph label="FOLLOWERS" value={profile.followers_count || 0} />
                <StatGraph label="LIKES" value={totalLikes} />
            </div>
        </div>
    )
}
