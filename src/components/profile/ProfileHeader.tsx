'use client'

import { Profile } from '@/types'
import { Instagram, Music, Globe } from 'lucide-react' // Lucide icons for social
import Image from 'next/image'
import Link from 'next/link'
import StatGraph from './StatGraph'

interface ProfileHeaderProps {
    profile: Profile
    totalLikes: number
}

export default function ProfileHeader({ profile, totalLikes }: ProfileHeaderProps) {
    const socialLinks = profile.social_links || {}
    const hasAnySocialLink = socialLinks.instagram || socialLinks.soundcloud || socialLinks.website

    return (
        <div className="flex flex-col items-center justify-center space-y-6 py-12 relative">
            {/* Back to Feed Button - Top Left */}
            <Link
                href="/"
                className="absolute top-4 left-0 md:left-4 flex items-center gap-2 group opacity-70 hover:opacity-100 transition-opacity"
            >
                <Image
                    src="/icons/turntable-icon.png"
                    alt="Back to Feed"
                    width={28}
                    height={28}
                    className="object-contain"
                />
            </Link>

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

            {/* Bio */}
            {profile.bio && (
                <p className="text-zinc-400 text-sm md:text-base max-w-md text-center leading-relaxed">
                    {profile.bio}
                </p>
            )}

            {/* Social Links - Simple Icons */}
            {hasAnySocialLink && (
                <div className="flex items-center gap-6 mt-2">
                    {socialLinks.instagram && (
                        <a
                            href={socialLinks.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-pink-500 transition-colors"
                            title="Instagram"
                        >
                            <Instagram size={24} />
                        </a>
                    )}
                    {socialLinks.soundcloud && (
                        <a
                            href={socialLinks.soundcloud}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-[#ff7700] transition-colors"
                            title="SoundCloud"
                        >
                            <Music size={24} />
                        </a>
                    )}
                    {socialLinks.website && (
                        <a
                            href={socialLinks.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-white transition-colors"
                            title="Website"
                        >
                            <Globe size={24} />
                        </a>
                    )}
                </div>
            )}

            {/* Stats Graph */}
            <div className="flex items-center gap-12 mt-4">
                <StatGraph label="FOLLOWERS" value={profile.followers_count || 0} />
                <StatGraph label="LIKES" value={totalLikes} />
            </div>
        </div>
    )
}

