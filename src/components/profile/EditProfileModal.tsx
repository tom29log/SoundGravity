'use client'

import { useState, useRef } from 'react'
import { X, Image as ImageIcon, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface EditProfileModalProps {
    isOpen: boolean
    onClose: () => void
    profile: {
        id: string
        username: string | null
        bio?: string | null
        social_links: any
        artist_type?: string | null
        primary_genre?: string | null
        header_image_url?: string | null
    }
    onUpdate: () => void
}

export default function EditProfileModal({ isOpen, onClose, profile, onUpdate }: EditProfileModalProps) {
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const artistTypes = ['DJ', 'Producer', 'Player', 'Singer', 'Creator', 'Celebrity', 'Other']
    const genres = ['Hip-hop', 'EDM', 'Electronic', 'Pop', 'R&B', 'Lo-fi', 'Jazz', 'Rock', 'Classical', 'Other']

    const [formData, setFormData] = useState({
        username: profile.username || '',
        bio: profile.bio || '',
        instagram: profile.social_links?.instagram || '',
        soundcloud: profile.social_links?.soundcloud || '',
        website: profile.social_links?.website || '',
        artistType: profile.artist_type || '',
        genre: profile.primary_genre || '',
        headerImageUrl: profile.header_image_url || ''
    })

    const [headerImageFile, setHeaderImageFile] = useState<File | null>(null)
    const [headerImagePreview, setHeaderImagePreview] = useState<string | null>(profile.header_image_url || null)
    const headerImageInputRef = useRef<HTMLInputElement>(null)

    if (!isOpen) return null

    const handleHeaderImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                alert('File size too large (Max 10MB)')
                return
            }
            setHeaderImageFile(file)
            setHeaderImagePreview(URL.createObjectURL(file))
        }
    }

    const uploadFile = async (file: File) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `header_${profile.id}_${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${fileName}`

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

            // Upload new image if selected
            if (headerImageFile) {
                headerImageUrl = await uploadFile(headerImageFile)
            }

            const social_links = {
                instagram: formData.instagram,
                soundcloud: formData.soundcloud,
                website: formData.website
            }

            const { error } = await supabase
                .from('profiles')
                .update({
                    username: formData.username,
                    bio: formData.bio,
                    social_links,
                    artist_type: formData.artistType,
                    primary_genre: formData.genre,
                    header_image_url: headerImageUrl
                })
                .eq('id', profile.id)

            if (error) throw error

            onUpdate()
            onClose()
        } catch (error) {
            console.error('Error updating profile:', error)
            alert('Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

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
                                <div className="flex flex-col items-center gap-2 text-zinc-500">
                                    <ImageIcon size={24} />
                                    <span className="text-xs">Click to upload header image</span>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={headerImageInputRef}
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
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                            className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                            placeholder="Display Name"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Artist Type</label>
                            <select
                                value={formData.artistType}
                                onChange={e => setFormData({ ...formData, artistType: e.target.value })}
                                className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors appearance-none"
                            >
                                <option value="" disabled>Select Type</option>
                                {artistTypes.map(type => (
                                    <option key={type} value={type} className="bg-zinc-900">{type}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Main Genre</label>
                            <select
                                value={formData.genre}
                                onChange={e => setFormData({ ...formData, genre: e.target.value })}
                                className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors appearance-none"
                            >
                                <option value="" disabled>Select Genre</option>
                                {genres.map(genre => (
                                    <option key={genre} value={genre} className="bg-zinc-900">{genre}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Bio</label>
                        <input
                            type="text"
                            value={formData.bio}
                            onChange={e => setFormData({ ...formData, bio: e.target.value })}
                            className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                            placeholder="한줄 소개를 입력하세요"
                            maxLength={100}
                        />
                        <p className="text-xs text-zinc-600 mt-1">{formData.bio.length}/100</p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-zinc-800">
                        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Social Links</label>

                        <div className="flex items-center gap-3">
                            <span className="text-zinc-500 text-sm w-24">Instagram</span>
                            <input
                                type="text"
                                value={formData.instagram}
                                onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                                className="flex-1 bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white transition-colors"
                                placeholder="https://instagram.com/..."
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-zinc-500 text-sm w-24">SoundCloud</span>
                            <input
                                type="text"
                                value={formData.soundcloud}
                                onChange={e => setFormData({ ...formData, soundcloud: e.target.value })}
                                className="flex-1 bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white transition-colors"
                                placeholder="https://soundcloud.com/..."
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-zinc-500 text-sm w-24">Website</span>
                            <input
                                type="text"
                                value={formData.website}
                                onChange={e => setFormData({ ...formData, website: e.target.value })}
                                className="flex-1 bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white transition-colors"
                                placeholder="Your personal site..."
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    )
}

