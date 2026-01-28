'use client'

import { Smartphone } from 'lucide-react'

export default function MobilePortraitLock() {
    return (
        <div className="portrait-lock fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center text-center p-8 hidden">
            <style jsx>{`
                @media screen and (orientation: landscape) and (max-height: 600px) {
                    .portrait-lock {
                        display: flex !important;
                    }
                }
            `}</style>

            <div className="animate-bounce mb-8">
                <Smartphone className="w-16 h-16 text-white rotate-90" strokeWidth={1.5} />
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">
                Please Rotate Device
            </h2>

            <p className="text-zinc-400 text-sm max-w-xs leading-relaxed">
                We support <span className="text-white font-semibold">Portrait Mode</span> only for the best immersive experience.
            </p>
        </div>
    )
}
