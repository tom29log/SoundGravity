import Link from 'next/link'
import { ReactNode } from 'react'

interface KnobButtonProps {
    onClick?: () => void
    href?: string
    children: ReactNode
    className?: string
    size?: 'sm' | 'md' | 'lg'
}

export default function KnobButton({ onClick, href, children, className = '', size = 'md' }: KnobButtonProps) {
    // Sizes
    const sizeClasses = {
        sm: 'w-12 h-12 text-[10px]',
        md: 'w-20 h-20 text-xs',
        lg: 'w-24 h-24 text-sm'
    }

    const baseClasses = `
        relative rounded-full flex items-center justify-center text-center font-bold
        bg-gradient-to-br from-zinc-300 via-zinc-100 to-zinc-400
        shadow-[4px_4px_10px_rgba(0,0,0,0.5),-2px_-2px_5px_rgba(255,255,255,0.1)]
        border-2 border-zinc-400
        transition-transform active:scale-95 group
        ${sizeClasses[size]}
        ${className}
    `

    // Inner Face (Brushed Metal look)
    const innerFace = (
        <div className="absolute inset-1 rounded-full bg-[conic-gradient(from_0deg,#e5e7eb,#9ca3af,#e5e7eb,#9ca3af,#e5e7eb)] opacity-80 flex items-center justify-center border border-zinc-500/30">
            {/* Center Indent/Cap */}
            <div className="absolute inset-[15%] rounded-full bg-gradient-to-tl from-zinc-200 to-zinc-50 shadow-inner flex items-center justify-center">
                {/* Content */}
                <div className="text-black/80 drop-shadow-sm font-black tracking-tight leading-none z-10 p-1 flex flex-col items-center justify-center">
                    {children}
                </div>
            </div>

            {/* Ridges (Dashed border simulation or separate elements) */}
            {/* We simulate ridges on the very outer edge container instead */}
        </div>
    )

    // Outer Ridged Ring
    const outerRing = (
        <div className="absolute inset-0 rounded-full border-[3px] border-dashed border-zinc-500/40 opacity-50" />
    )

    const content = (
        <>
            {outerRing}
            {innerFace}
            {/* Highlight/Glint */}
            <div className="absolute top-1 left-2 w-1/3 h-1/3 bg-gradient-to-br from-white to-transparent opacity-60 rounded-full blur-[2px]" />
        </>
    )

    if (href) {
        return (
            <Link href={href} className={baseClasses}>
                {content}
            </Link>
        )
    }

    return (
        <button onClick={onClick} className={baseClasses}>
            {content}
        </button>
    )
}
