export default function ProfileLoading() {
    return (
        <main className="min-h-screen bg-black text-white relative">
            {/* Background Aesthetic */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-zinc-800/20 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-zinc-800/20 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <div className="relative z-10 container mx-auto px-4 pb-20">
                {/* Header Skeleton */}
                <div className="pt-24 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-zinc-800 animate-pulse border-2 border-zinc-700" />
                    <div className="mt-4 h-8 w-48 bg-zinc-800 animate-pulse rounded" />
                    <div className="mt-2 h-4 w-32 bg-zinc-800 animate-pulse rounded opacity-50" />

                    {/* Stats Skeleton */}
                    <div className="flex items-center gap-8 mt-8">
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-8 h-6 bg-zinc-800 animate-pulse rounded" />
                            <div className="w-12 h-3 bg-zinc-800 animate-pulse rounded opacity-50" />
                        </div>
                        <div className="h-8 w-px bg-zinc-800" />
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-8 h-6 bg-zinc-800 animate-pulse rounded" />
                            <div className="w-12 h-3 bg-zinc-800 animate-pulse rounded opacity-50" />
                        </div>
                    </div>
                </div>

                <div className="mt-12">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent mb-12" />

                    {/* Projects List Skeleton */}
                    <div className="flex flex-col gap-2 max-w-3xl mx-auto w-full">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-zinc-900/40 border border-transparent">
                                {/* Thumbnail Skeleton */}
                                <div className="w-14 h-14 rounded-lg bg-zinc-800 animate-pulse shrink-0" />

                                {/* Info Skeleton */}
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-1/3 bg-zinc-800 animate-pulse rounded" />
                                    <div className="h-3 w-1/4 bg-zinc-800 animate-pulse rounded opacity-50" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    )
}
