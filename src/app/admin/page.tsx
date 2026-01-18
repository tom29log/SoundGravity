'use plain'
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import ProjectList from '@/components/ProjectList'
import UploadForm from '@/components/UploadForm'
import DevicePreview from '@/components/DevicePreview'

export default function AdminPage() {
    const router = useRouter()
    const supabase = createClient()
    const [profile, setProfile] = useState<{ username: string | null, avatar_url: string | null } | null>(null)

    // Load Profile
    useEffect(() => {
        const getProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('username, avatar_url')
                    .eq('id', user.id)
                    .single()
                setProfile(data)
            }
        }
        getProfile()
    }, [])

    // Upload Avatar
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        const file = e.target.files[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file)

        if (uploadError) {
            alert('Error uploading avatar')
            return
        }

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath)

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
            setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const [refreshKey, setRefreshKey] = useState(0)
    const [previewId, setPreviewId] = useState<string | null>(null)

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1)
    }

    const handleProjectSelect = (id: string) => {
        setPreviewId(id)
    }

    // Construct preview URL
    // In dev: localhost:3000/v/id, In prod: domain/v/id
    // We can use relative for iframe if on same domain
    const previewUrl = previewId ? `/v/${previewId}` : ''

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex justify-between items-center border-b border-zinc-800 pb-6">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-800 cursor-pointer group flex items-center justify-center border border-zinc-700">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-lg font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors">
                                        {profile?.username ? profile.username.charAt(0).toUpperCase() : 'U'}
                                    </span>
                                )}
                                {/* Invisible File Input Overlay */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                    onChange={handleAvatarUpload}
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] transition-opacity z-10 pointer-events-none">
                                    Edit
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-sm">{profile?.username || 'User'}</span>
                                <span className="text-xs text-zinc-500">Artist</span>
                            </div>
                        </div>
                        <div className="h-8 w-px bg-zinc-800 mx-2" />
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm transition-colors text-zinc-400 hover:text-white"
                        >
                            Sign Out
                        </button>
                    </div>
                </header>

                {previewId && (
                    <div className="mb-8 p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-semibold">Live Preview</h2>
                                <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400 font-mono border border-zinc-700">
                                    ID: {previewId}
                                </span>
                            </div>
                            <a
                                href={previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-400 hover:text-blue-300 underline"
                            >
                                Open in New Tab ↗
                            </a>
                        </div>
                        <DevicePreview url={previewUrl} />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Upload Form */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                            <h2 className="text-xl font-semibold mb-4">New Project</h2>
                            <UploadForm onUploadSuccess={handleRefresh} />
                        </div>
                    </div>

                    {/* Right Column: Project List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                            <h2 className="text-xl font-semibold mb-4">Your Projects (Click to Preview)</h2>
                            <ProjectList
                                key={refreshKey}
                                onSelect={handleProjectSelect}
                                selectedId={previewId}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
