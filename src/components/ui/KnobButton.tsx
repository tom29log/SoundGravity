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
                relative flex items-center justify-center rounded-full
                border-[1.5px] border-white/80
                bg-black/20 backdrop-blur-sm
                hover:bg-white/10 hover:border-white
                transition-all duration-200
                active:scale-95
                ${className}
            `}
            style={{ width: pixelSize, height: pixelSize }}
        >
            {/* Content (Label) */}
            <div className="text-white font-medium text-center leading-tight text-[10px] md:text-xs tracking-wider">
                {children}
            </div>
        </button>
    )
}
