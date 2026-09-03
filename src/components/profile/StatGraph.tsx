'use client'

interface StatGraphProps {
    label: string
    value: number
    className?: string
}

export default function StatGraph({ label, value, className = '' }: StatGraphProps) {
    const numericValue = Number(value) || 0

    return (
        <div className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 min-w-[95px] backdrop-blur-sm ${className}`}>
            <span className="text-base font-semibold text-white font-mono tracking-tight text-center">
                {numericValue.toLocaleString()}
            </span>
            <span className="text-[9px] tracking-widest text-zinc-400 font-mono uppercase font-medium mt-0.5">{label}</span>
        </div>
    )
}
