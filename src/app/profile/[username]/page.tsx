
import { notFound } from 'next/navigation'
import ShareProfileButton from '@/components/profile/ShareProfileButton'
import { Metadata } from 'next'
import ProfileContent from '@/components/profile/ProfileContent'
import Loading from './loading'
import { Suspense } from 'react'
import { getProfile } from '@/utils/data-fetchers'

export const revalidate = 60

interface Props {
    params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { username } = await params
    const decodedUsername = decodeURIComponent(username)
    // DIAGNOSTIC: Commenting out blocking DB call to fix TTFB 10s delay
    // const profile = await getProfile(decodedUsername)
    // if (!profile) return { title: 'User Not Found' }

    return {
        title: `${decodedUsername} | SoundGravity`,
        description: `Check out ${decodedUsername}'s audio projects on SoundGravity.`,
        // openGraph: {
        //     images: profile.avatar_url ? [profile.avatar_url] : [],
        // }
    }
}

export default async function ProfilePage({ params }: Props) {
    const { username } = await params
    const decodedUsername = decodeURIComponent(username)

    return (
        <main className="min-h-screen bg-black text-white relative">
            <ShareProfileButton />

            {/* Background Aesthetic - Renders INSTANTLY (0ms Blocking) */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-zinc-800/20 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-zinc-800/20 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            {/* Content Streams in */}
            <Suspense fallback={<Loading />}>
                <ProfileContent username={decodedUsername} />
            </Suspense>
        </main>
    )
}
