'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface KnobButtonProps {
    onClick?: () => void
    href?: string
    children?: React.ReactNode
    className?: string
    size?: 'sm' | 'md' | 'lg'
}

export default function KnobButton({ onClick, href, children, className = '', size = 'md' }: KnobButtonProps) {
    const router = useRouter()
    const [rotation, setRotation] = useState(-135) // Start at MIN (approx -135deg)
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
        setRotation(135) // Rotate to MAX (approx +135deg)

        // Wait for animation to finish before navigation
        setTimeout(() => {
            if (onClick) onClick()
            if (href) router.push(href)

            // Optional: Reset after navigation (though page might unload)
            setTimeout(() => {
                setIsAnimating(false)
                setRotation(-135)
            }, 500)
        }, 600) // Duration slightly longer than transition
    }

    return (
        <button
            onClick={handleClick}
            className={`relative flex flex-col items-center justify-center group ${className}`}
            style={{ width: pixelSize, height: pixelSize }}
        >
            {/* SVG Knob */}
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 100 100"
                className="w-full h-full overflow-visible"
            >
                {/* Tick Marks (Static) */}
                {Array.from({ length: 25 }).map((_, i) => {
                    const angle = -135 + (i * (270 / 24)) // Spread 270 degrees
                    const isMin = i === 0
                    const isMax = i === 24
                    return (
                        <line
                            key={i}
                            x1="50" y1="50"
                            x2="50" y2="10"
                            transform={`rotate(${angle} 50 50)`}
                            stroke="currentColor"
                            strokeWidth={isMin || isMax ? "3" : "2"}
                            strokeLinecap="round"
                            className="text-white group-hover:text-[#39FF14] transition-colors"
                            strokeDasharray="10 100" // Only show the tip? No, solid line
                            strokeDashoffset="0"
                        />
                    )
                })}

                {/* Labels MIN / MAX */}
                <text x="20" y="90" fontSize="10" textAnchor="middle" fill="currentColor" className="text-white font-mono text-[8px]">MIN</text>
                <text x="80" y="90" fontSize="10" textAnchor="middle" fill="currentColor" className="text-white font-mono text-[8px]">MAX</text>

                {/* Inner Knob Circle (Rotatable) */}
                <g
                    transform={`rotate(${rotation} 50 50)`}
                    style={{ transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)' }}
                >
                    {/* Ring */}
                    <circle cx="50" cy="50" r="30" fill="transparent" stroke="currentColor" strokeWidth="2.5" className="text-white" />

                    {/* Triangle Indicator */}
                    <path d="M 50 25 L 53 32 L 47 32 Z" fill="currentColor" className="text-white" />
                </g>
            </svg>

            {/* Content (Label) - Positioned in center or below? 
                The user image has a clean center.
                Original usage had text passed as children.
                Let's overlay it in the center for now, or below if it's large.
                Given the usage examples ("BACK FEED"), text is often 2 lines. 
                Let's put it in absolute center.
            */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-white/80 font-bold tracking-tighter text-center leading-none mt-1 group-hover:text-[#39FF14] transition-colors mix-blend-difference">
                    {children}
                </div>
            </div>
        </button>
    )
}
