export default function DebugPage() {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">Debug Test Page</h1>
                <p className="text-zinc-400">If this page loads instantly, the issue is likely in ProfileContent.</p>
                <p className="text-zinc-500 mt-2">Time: {new Date().toISOString()}</p>
            </div>
        </div>
    )
}
