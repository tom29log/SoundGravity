'use client'

import { useState } from 'react'
import InteractiveViewer from '@/components/InteractiveViewer'
import RealtimeComments from '@/components/social/RealtimeComments'
import ToastContainer, { useToast } from '@/components/ui/Toast'
import { Project } from '@/types'
import { useRealtimeComments } from '@/hooks/useRealtimeComments'
import { MapPin } from 'lucide-react'

export default function ProjectDetailView({ project }: { project: Project }) {
    const [currentTime, setCurrentTime] = useState(0)
    const [pinMode, setPinMode] = useState(false)
    const { comments, loading, addComment } = useRealtimeComments(project.id)
    const { showToast } = useToast()

    const handlePinCreate = async (x: number, y: number, audioState: any) => {
        // When pin is created, we want to prompt user for comment.
        // Simplest UX: Open Comments panel with pre-filled Meta?
        // Or show a small popup dialog?
        // Let's use `window.prompt` for MVP rapid prototype, or just force open the panel.

        const content = window.prompt("Leave a pin comment:")
        if (content) {
            try {
                await addComment(content, { x, y, audioState, timestamp: currentTime })
                showToast("Pin dropped!", "success")
                setPinMode(false) // Exit pin mode
            } catch (e: any) {
                showToast(e.message === 'User not logged in' ? 'Please login to pin' : "Failed to pin", 'error')
            }
        }
    }

    return (
        <div className="relative min-h-screen bg-black">
            <InteractiveViewer
                project={project}
                onTimeUpdate={setCurrentTime}
                pinMode={pinMode}
                comments={comments}
                onPinCreate={handlePinCreate}
            />

            {/* Toast Notification Container */}
            <ToastContainer />

            {/* UI Controls Layer */}
            <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-4 items-end pointer-events-none">

                {/* Pin Mode Toggle */}
                <button
                    onClick={() => setPinMode(!pinMode)}
                    className={`pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center border transition-all shadow-lg ${pinMode ? 'bg-[#39FF14] border-[#39FF14] text-black animate-pulse' : 'bg-zinc-900/90 border-zinc-700 text-zinc-400 hover:text-white'}`}
                    title="Toggle Pin Mode"
                >
                    <MapPin size={20} fill={pinMode ? "currentColor" : "none"} />
                </button>

                {/* Comments Panel Toggle */}
                <div className="pointer-events-auto">
                    <ToggleableComments
                        comments={comments}
                        loading={loading}
                        onAddComment={addComment}
                        currentTime={currentTime}
                    />
                </div>
            </div>

            {/* Disclaimer & AI Info (Bottom Left) */}
            <div className="absolute bottom-4 left-4 z-30 pointer-events-none text-[10px] text-zinc-600 font-mono space-y-1">
                {project.is_ai_generated && (
                    <div className="text-purple-400/70 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                        <span className="font-bold">AI COLLAB</span>
                        <span className="text-zinc-500">|</span>
                        <span>Used: {project.ai_tool_used || 'Unknown Tool'}</span>
                    </div>
                )}
                <div className="opacity-70">
                    © Content responsibility lies with the creator.
                </div>
            </div>
        </div>
    )
}

function ToggleableComments(props: any) {
    const [isOpen, setIsOpen] = useState(false)

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700 text-white px-5 py-3 rounded-full text-sm font-bold hover:bg-zinc-800 transition-colors shadow-lg flex items-center gap-2 font-mono group"
            >
                <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse group-hover:shadow-[0_0_8px_#39FF14] transition-shadow" />
                <span>SIGNAL</span>
            </button>
        )
    }

    return (
        <div className="relative animate-in slide-in-from-bottom-10 fade-in duration-300 w-full max-w-md sm:w-[400px]">
            <button
                onClick={() => setIsOpen(false)}
                className="absolute -top-3 -right-3 z-50 bg-black text-[#39FF14] p-1.5 rounded-full border border-[#39FF14] hover:bg-zinc-900 shadow-sm transition-colors"
                title="Close"
            >
                ✕
            </button>
            <RealtimeComments {...props} />
        </div>
    )
}
