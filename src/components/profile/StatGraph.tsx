'use client'

interface StatGraphProps {
    label: string
    value: number
    className?: string
}

export default function StatGraph({ label, value, className = '' }: StatGraphProps) {
    const numericValue = Number(value) || 0

    return (
        <div className={`flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 min-w-[110px] shadow-lg ${className}`}>
            <span className="text-2xl font-extrabold text-white mb-1 font-mono tracking-tight text-center drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
                {numericValue.toLocaleString()}
            </span>
            <span className="text-[10px] tracking-widest text-zinc-400 font-mono uppercase font-semibold">{label}</span>
        </div>
    )
}
