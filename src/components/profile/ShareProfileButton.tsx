'use client'

import { Share } from 'lucide-react'

export default function ShareProfileButton() {
    const handleShare = () => {
        const url = window.location.href
        if (navigator.share) {
            navigator.share({
                title: 'Check out this artist on SoundGravity',
                url: url
            }).catch(() => { })
        } else {
            navigator.clipboard.writeText(url)
            alert('Profile link copied!')
        }
    }

    return (
        <button
            onClick={handleShare}
            className="fixed top-6 right-6 z-50 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all hover:rotate-12 active:scale-95 border border-white/10"
            aria-label="Share Profile"
        >
            <Share size={20} />
        </button>
    )
}
