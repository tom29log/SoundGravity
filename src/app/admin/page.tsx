'use plain'
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProjectList from '@/components/ProjectList'
import UploadForm from '@/components/UploadForm'
import DevicePreview from '@/components/DevicePreview'
import KnobButton from '@/components/ui/KnobButton'
import EditProfileModal from '@/components/profile/EditProfileModal'
import PlaylistList from '@/components/playlist/PlaylistList'

export default function AdminPage() {
    const router = useRouter()
    const supabase = createClient()
    const [profile, setProfile] = useState<{ id: string, username: string | null, avatar_url: string | null, social_links: any, is_pro?: boolean } | null>(null)
    const [user, setUser] = useState<any>(null)
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
    const [isSubscribing, setIsSubscribing] = useState(false)

    // Load Profile
    const getProfile = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            setUser(user)
            const { data } = await supabase
                .from('profiles')
                .select('id, username, avatar_url, social_links, is_pro')
                .eq('id', user.id)
                .single()
            setProfile(data)
        }
    }, [supabase])

    useEffect(() => {
        getProfile()
    }, [getProfile])

    const handleProfileUpdate = (updatedProfile?: any) => {
        if (updatedProfile) {
            setProfile(updatedProfile) // Immediate update
        }
        getProfile() // Background refresh to be safe
    }

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
            // Use upsert to create profile if it doesn't exist
            const { data: updatedProfile, error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    avatar_url: publicUrl,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single()

            if (!error && updatedProfile) {
                setProfile(updatedProfile)
            }
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    // Subscription handlers
    const handleSubscribe = async () => {
        setIsSubscribing(true)
        try {
            const res = await fetch('/api/lemonsqueezy/checkout', { method: 'POST' })
            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                alert('Failed to create checkout session')
            }
        } catch (error) {
            console.error('Checkout error:', error)
            alert('Failed to start checkout')
        } finally {
            setIsSubscribing(false)
        }
    }

    const handleManageSubscription = async () => {
        try {
            const res = await fetch('/api/lemonsqueezy/portal', { method: 'POST' })
            const data = await res.json()
            if (data.url) {
                window.open(data.url, '_blank')
            } else {
                alert('Failed to open subscription portal')
            }
        } catch (error) {
            console.error('Portal error:', error)
            alert('Failed to open portal')
        }
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
                <header className="flex flex-col md:flex-row justify-between items-center border-b border-zinc-800 pb-6 gap-4">
                    <h1 className="text-xl md:text-3xl font-bold self-start md:self-center">Dashboard</h1>
                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
                        <div className="flex items-center gap-3 mr-auto md:mr-0">
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
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm">{profile?.username || 'User'}</span>
                                    {profile?.is_pro && (
                                        <span className="text-[9px] font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-1.5 py-0.5 rounded">
                                            PRO
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsEditProfileOpen(true)}
                                        className="text-xs text-zinc-500 hover:text-white transition-colors text-left"
                                    >
                                        Edit Profile
                                    </button>
                                    {profile?.is_pro ? (
                                        <button
                                            onClick={handleManageSubscription}
                                            className="text-xs text-yellow-500 hover:text-yellow-400 transition-colors"
                                        >
                                            Manage Pro
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSubscribe}
                                            disabled={isSubscribing}
                                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                                        >
                                            {isSubscribing ? 'Loading...' : 'Upgrade to Pro'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <KnobButton href="/" size="md">
                                <span className="leading-none">GO TO<br />FEED</span>
                            </KnobButton>
                            <KnobButton onClick={handleLogout} size="md">
                                <span className="leading-none">SIGN<br />OUT</span>
                            </KnobButton>
                        </div>
                    </div>
                </header>

                {/* Top Section: Playlists (Priority) */}
                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        My Playlists
                        <span className="text-xs font-normal text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">Mixset Ready</span>
                    </h2>
                    <PlaylistList key={`playlist-${refreshKey}`} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Upload Form */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                            <h2 className="text-xl font-semibold mb-4">New Project</h2>
                            <UploadForm onUploadSuccess={handleRefresh} />
                        </div>
                    </div>

                    {/* Right Column: Projects */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Projects Section */}
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

                {/* Bottom Section: Live Preview */}
                {previewId && (
                    <div className="mt-8 p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Live Preview</h2>
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
            </div>

            {user && (
                <EditProfileModal
                    isOpen={isEditProfileOpen}
                    onClose={() => setIsEditProfileOpen(false)}
                    profile={profile || {
                        id: user.id,
                        username: '',
                        social_links: {}
                    }}
                    onUpdate={handleProfileUpdate}
                />
            )}
        </div>
    )
}
