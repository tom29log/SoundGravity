'use plain'
'use client'

interface DevicePreviewProps {
    url: string
}

export default function DevicePreview({ url }: DevicePreviewProps) {
    // Simple placeholder for now, actual interactive preview would need the viewer page to be ready
    // or use a mock layout here. For now, since Step 2 asked for "Responsive Preview"
    // "Web and Mobile check", let's make a container that looks like a phone next to a web view.

    // Determine valid URL
    const hasUrl = !!url;

    return (
        <div className="flex gap-8 items-start overflow-x-auto pb-4 relative">


            {/* Empty State */}
            {!hasUrl && (
                <div className="absolute inset-0 z-40 bg-zinc-900/90 flex items-center justify-center border border-dashed border-zinc-700 rounded-xl">
                    <span className="text-zinc-500">Select a project to preview</span>
                </div>
            )}

            {/* Mobile Preview */}
            <div className={`flex-shrink-0 space-y-2 ${!hasUrl ? 'opacity-20' : ''}`}>
                <span className="text-sm text-zinc-500 block text-center">Mobile</span>
                <div className="w-[300px] h-[600px] border-4 border-zinc-700 rounded-3xl overflow-hidden bg-black relative shadow-xl">
                    {hasUrl && (
                        <iframe
                            src={url}
                            className="w-full h-full border-0"
                            title="Mobile Preview"
                            loading="lazy"
                        />
                    )}
                </div>
            </div>

            {/* Web Preview (Scaled down) */}
            <div className={`flex-shrink-0 space-y-2 ${!hasUrl ? 'opacity-20' : ''}`}>
                <span className="text-sm text-zinc-500 block text-center">Web</span>
                <div className="w-[640px] h-[360px] border-4 border-zinc-700 rounded-lg overflow-hidden bg-black relative shadow-xl">
                    {hasUrl && (
                        <iframe
                            src={url}
                            className="w-[1280px] h-[720px] border-0 origin-top-left scale-50"
                            title="Web Preview"
                            loading="lazy"
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
