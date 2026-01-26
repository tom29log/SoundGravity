import Image from 'next/image'

export default function Loading() {
    return (
        <main className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16 animate-pulse">
                    <Image
                        src="/logo-icon.png"
                        alt="Loading..."
                        fill
                        className="object-contain opacity-80"
                    />
                </div>
                <div className="flex gap-1 justify-center">
                    <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                </div>
            </div>
        </main>
    )
}
