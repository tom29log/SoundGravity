'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface EditProfileModalProps {
    isOpen: boolean
    onClose: () => void
    profile: {
        id: string
        username: string | null
        bio?: string | null
        social_links?: any
        artist_type?: any
        primary_genre?: any
        header_image_url?: string | null
    }
    onUpdate: (updatedProfile?: any) => void
}

const ensureArray = (val: any): string[] => {
    if (Array.isArray(val)) return val.map(v => String(v))
    if (typeof val === 'string' && val.trim()) return [val.trim()]
    return []
}

export default function EditProfileModal({ isOpen, onClose, profile, onUpdate }: EditProfileModalProps) {
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const artistTypes = ['DJ', 'Producer', 'Player', 'Singer', 'Creator', 'Celebrity', 'Other']
    const genres = ['Hip-Hop', 'House', 'EDM', 'Electronic', 'Pop', 'R&B', 'Lo-fi', 'Jazz', 'Rock', 'Classical', 'CCM', 'Drum & Bass', 'Other']

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

    const [headerImageFile, setHeaderImageFile] = useState<File | null>(null)
    const [headerImagePreview, setHeaderImagePreview] = useState<string | null>(profile?.header_image_url || null)
    const headerImageInputRef = useRef<HTMLInputElement>(null)

    // Sync state only when modal opens
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
            setHeaderImagePreview(profile?.header_image_url || null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    if (!isOpen) return null

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold mb-6 text-white">Edit Profile</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                        {headerImagePreview && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setHeaderImageFile(null)
                                    setHeaderImagePreview(null)
                                    setFormData(prev => ({ ...prev, headerImageUrl: '' }))
                                    if (headerImageInputRef.current) headerImageInputRef.current.value = ''
                                }}
                                className="text-xs text-red-500 mt-2 hover:underline"
                            >
                                Remove Header Image
                            </button>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Username</label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={e => {
                                const val = e.target.value
                                setFormData(prev => ({ ...prev, username: val }))
                            }}
                            className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                            placeholder="Display Name"
                        />
                    </div>

                    {/* Multi-Select for Artist Type */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
                            Artist Type (Max 2)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {artistTypes.map(type => {
                                const isSelected = currentArtistTypes.includes(type)
                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => {
                                            const isSel = currentArtistTypes.includes(type)
                                            let updated: string[] = []
                                            if (isSel) {
                                                updated = currentArtistTypes.filter(t => t !== type)
                                            } else {
                                                if (currentArtistTypes.length >= 2) return
                                                updated = [...currentArtistTypes, type]
                                            }
                                            setFormData(prev => ({ ...prev, artistType: updated }))
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isSelected
                                            ? 'bg-white text-black font-bold'
                                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Multi-Select for Genre */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
                            Main Genre (Max 2)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {genres.map(genre => {
                                const isSelected = currentGenres.includes(genre)
                                return (
                                    <button
                                        key={genre}
                                        type="button"
                                        onClick={() => {
                                            const isSel = currentGenres.includes(genre)
                                            let updated: string[] = []
                                            if (isSel) {
                                                updated = currentGenres.filter(g => g !== genre)
                                            } else {
                                                if (currentGenres.length >= 2) return
                                                updated = [...currentGenres, genre]
                                            }
                                            setFormData(prev => ({ ...prev, genre: updated }))
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isSelected
                                            ? 'bg-white text-black font-bold'
                                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                            }`}
                                    >
                                        {genre}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Bio</label>
                        <textarea
                            value={formData.bio}
                            onChange={e => {
                                const val = e.target.value
                                setFormData(prev => ({ ...prev, bio: val }))
                            }}
                            rows={3}
                            maxLength={100}
                            className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors resize-none"
                            placeholder="한줄 소개를 입력하세요"
                        />
                        <span className="text-[10px] text-zinc-500 float-right mt-1">{formData.bio.length}/100</span>
                    </div>

                    <div className="pt-4 border-t border-zinc-800">
                        <label className="block text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">Social Links</label>
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={formData.instagram}
                                onChange={e => {
                                    const val = e.target.value
                                    setFormData(prev => ({ ...prev, instagram: val }))
                                }}
                                className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white transition-colors"
                                placeholder="Instagram Username (e.g. soundgravity)"
                            />
                            <input
                                type="text"
                                value={formData.soundcloud}
                                onChange={e => {
                                    const val = e.target.value
                                    setFormData(prev => ({ ...prev, soundcloud: val }))
                                }}
                                className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white transition-colors"
                                placeholder="SoundCloud Profile URL"
                            />
                            <input
                                type="text"
                                value={formData.website}
                                onChange={e => {
                                    const val = e.target.value
                                    setFormData(prev => ({ ...prev, website: val }))
                                }}
                                className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white transition-colors"
                                placeholder="Personal Website URL"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-white text-black font-medium text-sm rounded-full hover:bg-zinc-200 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
