'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function AnimatedLogo_v2() {
    const [progress, setProgress] = useState(0)

    // Breathing Animation Loop
    useEffect(() => {
        let direction = 1
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    direction = -1
                    return 99
                }
                if (prev <= 0) {
                    direction = 1
                    return 1
                }
                return prev + (direction * 1.5) // Speed
            })
        }, 30)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="relative w-32 h-32 md:w-48 md:h-48 select-none">
            {/* Base Layer: Dimmed / Inactive */}
            <div className="absolute inset-0 opacity-30 invert">
                <Image
                    src="/images/logo_dial.png"
                    alt="Logo Base"
                    fill
                    className="object-contain"
                />
            </div>

            {/* Active Layer: Colored & Masked */}
            <div
                className="absolute inset-0 invert brightness-100 sepia saturate-[500%] hue-rotate-[90deg] drop-shadow-[0_0_10px_#39FF14]"
                style={{
                    // Gradient mask to simulate dial filling
                    // We map progress 0-100 to angle 0-270 (approx, assuming dial shape)
                    maskImage: `conic-gradient(from 225deg, black 0%, black ${progress * 0.75}%, transparent ${progress * 0.75 + 1}%, transparent 100%)`,
                    WebkitMaskImage: `conic-gradient(from 225deg, black 0%, black ${progress * 0.75}%, transparent ${progress * 0.75 + 1}%, transparent 100%)`
                }}
            >
                <Image
                    src="/images/logo_dial.png"
                    alt="Logo Active"
                    fill
                    className="object-contain"
                />
            </div>
        </div>
    )
}
