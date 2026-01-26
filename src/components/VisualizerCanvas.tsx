'use client'

import { useEffect, useRef } from 'react'
import * as Tone from 'tone'

interface VisualizerCanvasProps {
    width?: number
    height?: number
    color?: string
}

export default function VisualizerCanvas({ width = 300, height = 100, color = '#3b82f6' }: VisualizerCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const workerRef = useRef<Worker | null>(null)
    const analyserRef = useRef<Tone.Analyser | null>(null)
    const animationFrameRef = useRef<number>(0)

    useEffect(() => {
        // Initialize Worker
        // Note: In Next.js, worker paths can be tricky. Using new Worker(new URL('../workers/visualizer.worker.ts', import.meta.url)) pattern often works.
        workerRef.current = new Worker(new URL('../workers/visualizer.worker.ts', import.meta.url))

        workerRef.current.onmessage = (e) => {
            const { bars } = e.data
            draw(bars)
        }

        // Initialize Analyser
        // We assume Tone.Destination or a specific source. 
        // For global visualizer, we can connect to Destination.
        // Tone.Destination is the master output.
        analyserRef.current = new Tone.Analyser('fft', 256)
        Tone.Destination.connect(analyserRef.current)

        return () => {
            workerRef.current?.terminate()
            analyserRef.current?.dispose()
            cancelAnimationFrame(animationFrameRef.current)

            // Explicitly clear canvas to release GPU memory/context if possible
            const ctx = canvasRef.current?.getContext('2d')
            if (ctx && width && height) {
                ctx.clearRect(0, 0, width, height)
            }
        }
    }, [])

    useEffect(() => {
        const loop = () => {
            if (analyserRef.current && workerRef.current) {
                const data = analyserRef.current.getValue()
                // data is Float32Array for 'fft' usually in Tone? 
                // Tone.Analyser with 'fft' returns Float32Array in dB usually.
                // Let's use 'waveform' or 'fft' with normal array?
                // Tone.Analyser getValue() returns TypedArray.

                // For simplicity mapping, let's cast to whatever worker expects.
                // If it's Float32Array (- Infinity to 0 dB), we might want to normalize.
                // Or use 'byteFrequencyData' from native node if possible, but Tone wraps it.
                // Let's send the raw buffer.

                workerRef.current.postMessage({
                    frequencyData: data,
                    config: { barCount: 32 }
                })
            }
            // Limit to 30fps or 60fps? Analyser updates are fast.
            animationFrameRef.current = requestAnimationFrame(loop)
        }
        loop()
        return () => cancelAnimationFrame(animationFrameRef.current)
    }, [])

    const draw = (bars: number[]) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.clearRect(0, 0, width, height)
        ctx.fillStyle = color

        const barWidth = width / bars.length

        bars.forEach((value, i) => {
            // Value processing: input might be -100 to 0 (dB) if FFT
            // If waveform, -1 to 1.
            // Let's assume standard normalization for visualizer:
            // If dB: map -100..-30 to 0..height

            let h = 0
            if (value < -100) h = 0
            else if (value > 0) h = height // unexpected for standard dB
            else {
                // Map -100 to 0 -> 0 to height
                h = ((value + 100) / 100) * height
            }

            const x = i * barWidth
            const y = height - h

            ctx.fillRect(x, y, barWidth - 1, h)
        })
    }

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-full h-full rounded-lg bg-black/20"
        />
    )
}
