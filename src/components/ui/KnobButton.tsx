'use client'

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

    // Sizes (Diameter)
    const pixelSize = {
        sm: 50,
        md: 80,
        lg: 100
    }[size]

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()

        // Immediate Interaction
        if (onClick) onClick()
        if (href) router.push(href)
    }

    return (
        <button
            onClick={handleClick}
            className={`
                relative flex flex-col items-center justify-center group 
                transition-transform active:scale-95 duration-75 ease-out
                ${className}
            `}
            style={{ width: pixelSize, height: pixelSize }}
        >
            {/* Static Image Base */}
            <div className="absolute inset-0 opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                <Image
                    src="/images/logo_knob_v2.png"
                    alt="Knob"
                    fill
                    className="object-contain invert brightness-150"
                />
            </div>

            {/* Content (Label) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="text-white font-bold tracking-tighter text-center leading-none mix-blend-difference drop-shadow-md">
                    {children}
                </div>
            </div>
        </button>
    )
}
