'use plain'
'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Upload, X, Music, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface UploadFormProps {
    onUploadSuccess: () => void
}

export default function UploadForm({ onUploadSuccess }: UploadFormProps) {
    const [loading, setLoading] = useState(false)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [audioFile, setAudioFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [title, setTitle] = useState('')
    const [targetUrl, setTargetUrl] = useState('')

    const imageInputRef = useRef<HTMLInputElement>(null)
    const audioInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAudioFile(e.target.files[0])
        }
    }

    const uploadFile = async (file: File) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('assets')
            .upload(filePath, file)

        if (uploadError) {
            throw uploadError
        }

        const { data } = supabase.storage.from('assets').getPublicUrl(filePath)
        return data.publicUrl
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!imageFile || !audioFile || !title) {
            alert('Please fill in all required fields')
            return
        }

        setLoading(true)
        try {
            // 1. Upload Image
            const imageUrl = await uploadFile(imageFile)

            // 2. Upload Audio
            const audioUrl = await uploadFile(audioFile)

            // 3. Insert into DB
            const { data: { user } } = await supabase.auth.getUser()

            const { error } = await supabase.from('projects').insert({
                title,
                image_url: imageUrl,
                audio_url: audioUrl,
                target_url: targetUrl || null,
                user_id: user?.id, // Link to current user
            })

            if (error) throw error

            // Reset form
            setTitle('')
            setTargetUrl('')
            setImageFile(null)
            setAudioFile(null)
            setImagePreview(null)
            if (imageInputRef.current) imageInputRef.current.value = ''
            if (audioInputRef.current) audioInputRef.current.value = ''

            onUploadSuccess()
            alert('Project created successfully!')
        } catch (error: any) {
            console.error('Error uploading:', error)
            alert('Error uploading: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const clearImage = () => {
        setImageFile(null)
        setImagePreview(null)
        if (imageInputRef.current) imageInputRef.current.value = ''
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title Input */}
            <div>
                <label className="block text-sm font-medium mb-1">Project Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Summer Vibes"
                    className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-white focus:outline-none"
                    required
                />
            </div>

            {/* Target URL Input */}
            <div>
                <label className="block text-sm font-medium mb-1">Link URL (Optional)</label>
                <input
                    type="url"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-white focus:outline-none"
                />
            </div>

            {/* Image Upload */}
            <div>
                <label className="block text-sm font-medium mb-1">Cover Image</label>
                {!imagePreview ? (
                    <div
                        onClick={() => imageInputRef.current?.click()}
                        className="w-full aspect-video bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/80 transition-colors"
                    >
                        <ImageIcon className="w-8 h-8 text-zinc-500 mb-2" />
                        <span className="text-xs text-zinc-500">Click to upload image</span>
                    </div>
                ) : (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-zinc-700 group">
                        <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                        <button
                            type="button"
                            onClick={clearImage}
                            className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}
                <input
                    type="file"
                    accept="image/*"
                    ref={imageInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                />
            </div>

            {/* Audio Upload */}
            <div>
                <label className="block text-sm font-medium mb-1">Audio File</label>
                <div
                    onClick={() => audioInputRef.current?.click()}
                    className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-between cursor-pointer hover:bg-zinc-800/80 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <Music className="w-5 h-5 text-zinc-400" />
                        <span className="text-sm text-zinc-300 truncate max-w-[200px]">
                            {audioFile ? audioFile.name : 'Select audio file...'}
                        </span>
                    </div>
                    <Upload size={16} className="text-zinc-500" />
                </div>
                <input
                    type="file"
                    accept="audio/*"
                    ref={audioInputRef}
                    onChange={handleAudioChange}
                    className="hidden"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-semibold py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Uploading...' : 'Create Project'}
            </button>
        </form>
    )
}
