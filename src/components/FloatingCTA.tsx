'use plain'
'use client'

import { Share2 } from 'lucide-react'

export default function FloatingCTA({ title, url }: { title: string, url: string }) {
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    url,
                })
            } catch (err) {
                console.error('Error sharing:', err)
            }
        } else {
            // Fallback
            await navigator.clipboard.writeText(url)
            alert('Link copied to clipboard!')
        }
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-[env(safe-area-inset-bottom,20px)] pointer-events-none z-50">
            <div className="flex justify-center pointer-events-auto">
                <button
                    onClick={handleShare}
                    className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-full hover:bg-white/20 transition-all active:scale-95 shadow-lg"
                >
                    <Share2 size={18} />
                    <span className="font-medium">Share Experience</span>
                </button>
            </div>
        </div>
    )
}
