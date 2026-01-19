'use client'

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

    // Sizes (Diameter)
    const pixelSize = {
        sm: 50,
        md: 80,
        lg: 100
    }[size]

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        if (onClick) onClick()
        if (href) router.push(href)
    }

    return (
        <button
            onClick={handleClick}
            className={`
                relative flex items-center justify-center rounded-[22px]
                border-[1.5px] border-white/20
                bg-white/5 backdrop-blur-md
                hover:bg-white/10 hover:border-white/50 hover:scale-105
                shadow-[0_8px_32px_rgba(0,0,0,0.3)]
                transition-all duration-300 ease-out
                active:scale-95
                ${className}
            `}
            style={{ width: pixelSize, height: pixelSize }}
        >
            {/* Glossy Reflection (Top) */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-[20px] pointer-events-none" />

            {/* Content (Label) */}
            <div className="text-white font-medium text-center leading-tight text-[10px] md:text-xs tracking-wider z-10 drop-shadow-md">
                {children}
            </div>
        </button>
    )
}
