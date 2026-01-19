'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface KnobButtonProps {
    onClick?: () => void
    href?: string
    children?: React.ReactNode
    className?: string
    size?: 'sm' | 'md' | 'lg'
}

export default function KnobButton({ onClick, href, children, className = '', size = 'md' }: KnobButtonProps) {
    const router = useRouter()
    const [progress, setProgress] = useState(0) // 0 to 100
    const [isAnimating, setIsAnimating] = useState(false)

    // Sizes (Diameter)
    const pixelSize = {
        sm: 50,
        md: 80,
        lg: 100
    }[size]

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        if (isAnimating) return

        setIsAnimating(true)

        // Animate 0 -> 100
        const duration = 600 // ms
        const startTime = performance.now()

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const newProgress = Math.min((elapsed / duration) * 100, 100)

            setProgress(newProgress)

            if (newProgress < 100) {
                requestAnimationFrame(animate)
            } else {
                // Done
                if (onClick) onClick()
                if (href) router.push(href)

                // Reset later
                setTimeout(() => {
                    setIsAnimating(false)
                    setProgress(0)
                }, 1000)
            }
        }

        requestAnimationFrame(animate)
    }

    return (
        <button
            onClick={handleClick}
            className={`relative flex flex-col items-center justify-center group ${className}`}
            style={{ width: pixelSize, height: pixelSize }}
        >
            {/* Base Layer: Dimmed */}
            <div className="absolute inset-0 opacity-40 invert group-hover:opacity-60 transition-opacity">
                <Image
                    src="/images/logo_dial.png"
                    alt="Knob Base"
                    fill
                    className="object-contain"
                />
            </div>

            {/* Active Layer: Filling Effect */}
            <div
                className="absolute inset-0 invert brightness-100 sepia saturate-[500%] hue-rotate-[90deg] drop-shadow-[0_0_5px_#39FF14]"
                style={{
                    maskImage: `conic-gradient(from 225deg, black 0%, black ${progress * 0.75}%, transparent ${progress * 0.75 + 1}%, transparent 100%)`,
                    WebkitMaskImage: `conic-gradient(from 225deg, black 0%, black ${progress * 0.75}%, transparent ${progress * 0.75 + 1}%, transparent 100%)`
                }}
            >
                <Image
                    src="/images/logo_dial.png"
                    alt="Knob Active"
                    fill
                    className="object-contain"
                />
            </div>

            {/* Content (Label) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="text-white font-bold tracking-tighter text-center leading-none mix-blend-difference">
                    {children}
                </div>
            </div>
        </button>
    )
}
