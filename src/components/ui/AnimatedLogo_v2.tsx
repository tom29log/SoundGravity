'use client'

import Image from 'next/image'

export default function AnimatedLogo_v2() {
    return (
        <div className="relative w-32 h-32 md:w-48 md:h-48 select-none">
            {/* Final Logo - Clean White Line */}
            <div className="absolute inset-0">
                <Image
                    src="/images/logo_final.png"
                    alt="SoundGravity Logo"
                    fill
                    className="object-contain invert-0" // As requested, just the image clearly
                    priority
                />
            </div>
        </div>
    )
}
