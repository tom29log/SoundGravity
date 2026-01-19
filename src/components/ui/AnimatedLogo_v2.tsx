'use client'

import Image from 'next/image'

export default function AnimatedLogo_v2() {
    return (
        <div className="relative w-32 h-32 md:w-48 md:h-48 select-none">
            {/* Static Logo - High Contrast */}
            <div className="absolute inset-0 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                <Image
                    src="/images/logo_knob_v2.png"
                    alt="SoundGravity Logo"
                    fill
                    className="object-contain invert brightness-200 contrast-125"
                    priority
                />
            </div>
        </div>
    )
}
