'use client'

import { Share } from 'lucide-react'

interface Props {
    title: string
}

export default function ShareProjectButton({ title }: Props) {
    const handleShare = () => {
        const url = window.location.href
        if (navigator.share) {
            navigator.share({
                title: title,
                text: 'Check out this awesome track on SoundGravity',
                url: url
            }).catch(() => {
                // Ignore AbortError (user closed share sheet)
            })
        } else {
            navigator.clipboard.writeText(url)
            alert('Track link copied to clipboard!')
        }
    }

    return (
        <button
            onClick={handleShare}
            className="pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center border transition-all shadow-lg bg-zinc-900/90 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-500 active:scale-95"
            title="Share Project"
            aria-label="Share Project"
        >
            <Share size={20} />
        </button>
    )
}
