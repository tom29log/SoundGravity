import { Profile } from '@/types'
import { Instagram, Globe } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import StatGraph from './StatGraph'
import FollowButton from './FollowButton'

interface ProfileHeaderProps {
    profile: Profile
    totalLikes: number
}

export default function ProfileHeader({ profile, totalLikes }: ProfileHeaderProps) {
    // Server Component: Render basic JSX without state/effects
    const socialLinks = profile.social_links || {}

    return (
        <div className="flex flex-col items-center justify-center space-y-6 py-20 relative overflow-hidden w-full min-h-[50vh]">
            {/* Header Background Image */}
            {profile.header_image_url && (
                <div className="absolute inset-0 z-0">
                    <Image
                        src={profile.header_image_url}
                        alt="Header Background"
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
                </div>
            )}

            {/* Back to Feed Button - Top Left */}
            <Link
                href="/"
                className="absolute top-4 left-4 md:left-8 flex items-center gap-2 group opacity-80 hover:opacity-100 transition-opacity z-50"
            >
                <Image
                    src="/icons/turntable-icon.png"
                    alt="Back to Feed"
                    width={52}
                    height={52}
                    className="object-contain drop-shadow-md"
                />
            </Link>

            {/* Main Content Wrapper */}
            <div className="relative z-10 flex flex-col items-center space-y-6 w-full px-4">
                {/* Avatar - Large Circle */}
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-zinc-800/80 shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-black">
                    {profile.avatar_url ? (
                        <Image
                            src={profile.avatar_url}
                            alt={profile.username || 'Artist'}
                            fill
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-4xl font-thin text-zinc-600">
                            {profile.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                    )}
                </div>

                {/* Username & Follow Button */}
                <div className="flex flex-col items-center gap-3">
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white drop-shadow-lg text-center">
                        {profile.username || 'Unknown Artist'}
                    </h1>

                    {/* Artist Type & Genre Tags */}
                    <div className="flex flex-wrap items-center justify-center gap-2 max-w-sm px-4">
                        {/* Render Artist Types */}
                        {Array.isArray(profile.artist_type) && profile.artist_type.map((type, i) => (
                            <span key={`at-${i}`} className="text-[10px] md:text-xs uppercase font-bold text-black bg-white px-2 py-1 rounded-full leading-none shadow-sm">
                                {type}
                            </span>
                        ))}
                        {/* Fallback for single string legacy data (optional safety) */}
                        {typeof profile.artist_type === 'string' && (
                            <span className="text-[10px] md:text-xs uppercase font-bold text-black bg-white px-2 py-1 rounded-full leading-none shadow-sm">
                                {profile.artist_type}
                            </span>
                        )}

                        {/* Render Genres */}
                        {Array.isArray(profile.primary_genre) && profile.primary_genre.map((genre, i) => (
                            <span key={`pg-${i}`} className="text-[10px] md:text-xs text-zinc-300 font-medium leading-none border border-zinc-700 px-2 py-1 rounded-full shadow-sm bg-black/40 backdrop-blur-sm">
                                {genre}
                            </span>
                        ))}
                        {/* Fallback for single string legacy data */}
                        {typeof profile.primary_genre === 'string' && (
                            <span className="text-[10px] md:text-xs text-zinc-300 font-medium leading-none border border-zinc-700 px-2 py-1 rounded-full shadow-sm bg-black/40 backdrop-blur-sm">
                                {profile.primary_genre}
                            </span>
                        )}
                    </div>

                    <FollowButton profileId={profile.id} />
                </div>

                {/* Bio */}
                {profile.bio && (
                    <p className="text-zinc-200 text-sm md:text-base max-w-md text-center leading-relaxed drop-shadow-md font-medium">
                        {profile.bio}
                    </p>
                )}

                {/* Social Links - Always Show 3 Icons */}
                <div className="flex items-center gap-8 mt-4 bg-black/20 backdrop-blur-md px-6 py-3 rounded-full border border-white/5">
                    {/* Instagram */}
                    {socialLinks.instagram ? (
                        <a
                            href={socialLinks.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white hover:opacity-70 transition-opacity"
                            title="Instagram"
                        >
                            <Instagram size={24} />
                        </a>
                    ) : (
                        <div className="text-zinc-600 cursor-not-allowed" title="Instagram not linked">
                            <Instagram size={24} />
                        </div>
                    )}

                    {/* SoundCloud (Custom Icon) */}
                    {socialLinks.soundcloud ? (
                        <a
                            href={socialLinks.soundcloud}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:opacity-70 transition-opacity"
                            title="SoundCloud"
                        >
                            <Image
                                src="/icons/soundcloud.png"
                                alt="SoundCloud"
                                width={28}
                                height={28}
                                className="object-contain brightness-0 invert"
                            />
                        </a>
                    ) : (
                        <div className="opacity-30 cursor-not-allowed" title="SoundCloud not linked">
                            <Image
                                src="/icons/soundcloud.png"
                                alt="SoundCloud"
                                width={28}
                                height={28}
                                className="object-contain brightness-0 invert"
                            />
                        </div>
                    )}

                    {/* Website */}
                    {socialLinks.website ? (
                        <a
                            href={socialLinks.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white hover:opacity-70 transition-opacity"
                            title="Website"
                        >
                            <Globe size={24} />
                        </a>
                    ) : (
                        <div className="text-zinc-600 cursor-not-allowed" title="Website not linked">
                            <Globe size={24} />
                        </div>
                    )}
                </div>

                {/* Stats Graph */}
                <div className="flex items-center gap-12 mt-4">
                    <StatGraph label="FOLLOWERS" value={profile.followers_count || 0} />
                    <StatGraph label="LIKES" value={totalLikes} />
                </div>
            </div>
        </div>
    )
}

