export default function ProfileProjectListSkeleton() {
    return (
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
    )
}
