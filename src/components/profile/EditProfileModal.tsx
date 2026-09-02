'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Upload } from 'lucide-react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase'

interface EditProfileModalProps {
    isOpen: boolean
    onClose: () => void
    profile: Profile | null
    onUpdate: (updatedProfile: Profile) => void
}

const ensureArray = (value: any): string[] => {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return []
        }
    }
    return []
}

export default function EditProfileModal({ isOpen, onClose, profile, onUpdate }: EditProfileModalProps) {
    const supabase = createClient()
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        username: profile?.username || '',
        bio: profile?.bio || '',
        instagram: profile?.social_links?.instagram || '',
        soundcloud: profile?.social_links?.soundcloud || '',
        website: profile?.social_links?.website || '',
        artistType: ensureArray(profile?.artist_type),
        genre: ensureArray(profile?.primary_genre),
        headerImageUrl: profile?.header_image_url || ''
    })

    const [avatarImageFile, setAvatarImageFile] = useState<File | null>(null)
    const [avatarImagePreview, setAvatarImagePreview] = useState<string | null>(profile?.avatar_url || null)
    const avatarImageInputRef = useRef<HTMLInputElement>(null)

    const [headerImageFile, setHeaderImageFile] = useState<File | null>(null)
    const [headerImagePreview, setHeaderImagePreview] = useState<string | null>(profile?.header_image_url || null)
    const headerImageInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen) {
            setFormData({
                username: profile?.username || '',
                bio: profile?.bio || '',
                instagram: profile?.social_links?.instagram || '',
                soundcloud: profile?.social_links?.soundcloud || '',
                website: profile?.social_links?.website || '',
                artistType: ensureArray(profile?.artist_type),
                genre: ensureArray(profile?.primary_genre),
                headerImageUrl: profile?.header_image_url || ''
            })
            setAvatarImagePreview(profile?.avatar_url || null)
            setHeaderImagePreview(profile?.header_image_url || null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    if (!isOpen) return null

    const handleAvatarImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (file.size > 10 * 1024 * 1024) {
                alert('File size too large (Max 10MB)')
                return
            }
            setAvatarImageFile(file)
            setAvatarImagePreview(URL.createObjectURL(file))
        }
    }

    const handleHeaderImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (file.size > 10 * 1024 * 1024) {
                alert('File size too large (Max 10MB)')
                return
            }
            setHeaderImageFile(file)
            setHeaderImagePreview(URL.createObjectURL(file))
        }
    }

    const uploadFile = async (file: File) => {
        try {
            const res = await fetch('/api/upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type || 'image/jpeg'
                })
            })
            if (res.ok) {
                const { uploadUrl, publicUrl } = await res.json()
                const upload = await fetch(uploadUrl, {
                    method: 'PUT',
                    body: file,
                    headers: { 'Content-Type': file.type || 'image/jpeg' }
                })
                if (upload.ok) return publicUrl
            }
        } catch (r2Error) {
            console.warn('R2 upload failed in EditProfileModal, fallback to Supabase:', r2Error)
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `headers/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('assets')
            .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('assets').getPublicUrl(filePath)
        return data.publicUrl
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            let headerImageUrl = formData.headerImageUrl
            let avatarUrl = profile?.avatar_url || ''

            if (avatarImageFile) {
                avatarUrl = await uploadFile(avatarImageFile)
            }

            if (headerImageFile) {
                headerImageUrl = await uploadFile(headerImageFile)
            }

            const social_links = {
                instagram: formData.instagram,
                soundcloud: formData.soundcloud,
                website: formData.website
            }

            const payload = {
                username: formData.username,
                bio: formData.bio,
                avatar_url: avatarUrl,
                social_links,
                artist_type: formData.artistType,
                primary_genre: formData.genre,
                header_image_url: headerImageUrl,
            }

            const res = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const resData = await res.json()

            if (res.ok && resData.profile) {
                onUpdate(resData.profile)
                onClose()
                window.location.href = `/profile/${encodeURIComponent(resData.profile.username)}`
            } else {
                alert(resData.error || 'Failed to save profile changes')
            }
        } catch (error: any) {
            console.error('Error updating profile exception:', error)
            alert('Failed to save profile changes')
        } finally {
            setLoading(false)
        }
    }

    const currentArtistTypes = ensureArray(formData.artistType)
    const currentGenres = ensureArray(formData.genre)

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div 
                className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold mb-6 text-white">Edit Profile</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Avatar Image Upload */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Profile Avatar Picture</label>
                        <div className="flex items-center gap-4">
                            <div
                                onClick={() => avatarImageInputRef.current?.click()}
                                className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-dashed border-zinc-700 flex items-center justify-center cursor-pointer hover:border-zinc-500 hover:bg-zinc-800/80 transition-all relative overflow-hidden group flex-shrink-0"
                            >
                                {avatarImagePreview ? (
                                    <>
                                        <img src={avatarImagePreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Upload size={16} className="text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center text-zinc-400">
                                        <Upload size={16} className="mx-auto opacity-50" />
                                    </div>
                                )}
                                <input
                                    ref={avatarImageInputRef}
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleAvatarImageChange}
                                />
                            </div>
                            <div className="text-xs text-zinc-400">
                                <p className="font-semibold text-white">Upload Avatar</p>
                                <p className="text-[11px] text-zinc-500">JPG, PNG or WEBP (Max 10MB)</p>
                            </div>
                        </div>
                    </div>

                    {/* Header Image Upload */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Header Image</label>
                        <div
                            onClick={() => headerImageInputRef.current?.click()}
                            className="w-full h-32 bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-zinc-500 hover:bg-zinc-800/80 transition-all relative overflow-hidden group"
                        >
                            {headerImagePreview ? (
                                <>
                                    <img src={headerImagePreview} alt="Header Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="bg-black/60 rounded-full p-2 text-white">
                                            <Upload size={20} />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-zinc-400">
                                    <Upload size={24} className="mx-auto mb-2 opacity-50" />
                                    <span className="text-xs">Click to upload header image</span>
                                </div>
                            )}
                            <input
                                ref={headerImageInputRef}
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleHeaderImageChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Username</label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Bio</label>
                        <textarea
                            value={formData.bio}
                            onChange={e => setFormData({ ...formData, bio: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 h-20 resize-none"
                            placeholder="Tell us about yourself..."
                        />
                    </div>

                    {/* Artist Type & Genre Selection */}
                    <div className="space-y-3 pt-2 border-t border-zinc-800">
                        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Artist Types</label>
                        <div className="flex flex-wrap gap-2">
                            {['Producer', 'Vocalist', 'DJ', 'Instrumentalist', 'Sound Engineer'].map(type => {
                                const isSelected = currentArtistTypes.includes(type)
                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => {
                                            const updated = isSelected
                                                ? currentArtistTypes.filter(t => t !== type)
                                                : [...currentArtistTypes, type]
                                            setFormData({ ...formData, artistType: updated })
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-xs transition-colors ${isSelected ? 'bg-white text-black font-semibold' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                                    >
                                        {type}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Genres</label>
                        <div className="flex flex-wrap gap-2">
                            {['Electronic', 'Hip Hop', 'Pop', 'Rock', 'R&B', 'Ambient', 'House', 'Techno'].map(genre => {
                                const isSelected = currentGenres.includes(genre)
                                return (
                                    <button
                                        key={genre}
                                        type="button"
                                        onClick={() => {
                                            const updated = isSelected
                                                ? currentGenres.filter(g => g !== genre)
                                                : [...currentGenres, genre]
                                            setFormData({ ...formData, genre: updated })
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-xs transition-colors ${isSelected ? 'bg-white text-black font-semibold' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                                    >
                                        {genre}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Social Links */}
                    <div className="space-y-2 pt-2 border-t border-zinc-800">
                        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Social Links</label>
                        <input
                            type="text"
                            placeholder="Instagram Username"
                            value={formData.instagram}
                            onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                        />
                        <input
                            type="text"
                            placeholder="SoundCloud URL"
                            value={formData.soundcloud}
                            onChange={e => setFormData({ ...formData, soundcloud: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                        />
                        <input
                            type="text"
                            placeholder="Website URL"
                            value={formData.website}
                            onChange={e => setFormData({ ...formData, website: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
