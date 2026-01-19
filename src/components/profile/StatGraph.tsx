'use client'

import { useEffect, useRef } from 'react'

interface StatGraphProps {
    label: string
    value: number
    className?: string
}

export default function StatGraph({ label, value, className = '' }: StatGraphProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Canvas setup
        const dpr = window.devicePixelRatio || 1
        const rect = canvas.getBoundingClientRect()
        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        ctx.scale(dpr, dpr)

        const width = rect.width
        const height = rect.height

        // Clear
        ctx.clearRect(0, 0, width, height)

        // Draw Abstract Representation (Dots)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'

        // Dynamic density based on value (clamped for visual sanity)
        const density = Math.min(value, 200)
        // If value is huge, we just show a "dense cloud"
        // If value is 0, show nothing or faint placeholder

        if (value === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
            ctx.fillRect(0, height / 2 - 1, width, 2) // Faint line
        }

        for (let i = 0; i < density; i++) {
            const x = Math.random() * width
            const y = height / 2 + (Math.random() - 0.5) * (height * 0.6) // Cluster around center
            const size = Math.random() * 2 + 0.5

            ctx.beginPath()
            ctx.arc(x, y, size, 0, Math.PI * 2)
            ctx.fill()
        }

        // Connect some dots for "constellation" effect logic
        // Omitted for simple dot cloud preference

    }, [value])

    return (
        <div className={`flex flex-col items-center group cursor-help ${className}`}>
            {/* Canvas for Visual */}
            <div className="relative w-24 h-12 mb-2">
                <canvas ref={canvasRef} className="w-full h-full" />

                {/* Tooltip on Hover */}
                <div className="absolute inset-x-0 -top-8 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="bg-white/10 backdrop-blur-md px-2 py-1 rounded text-xs text-white font-mono">
                        {value.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Minimal Label */}
            <span className="text-[10px] tracking-widest text-zinc-500 uppercase">{label}</span>
        </div>
    )
}
