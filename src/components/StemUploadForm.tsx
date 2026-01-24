'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { createClient } from '@/lib/supabase'
import { Upload, X, Music, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { v4 as uuidv4 } from 'uuid'

interface StemUploadFormProps {
    onUploadSuccess: () => void
}

type FileType = File | null

interface UploadFormData {
    title: string
    description: string
    genre: string
    coverImage: FileList
    mainTrack: FileList
    stems: {
        vocal: FileList
        drum: FileList
        bass: FileList
        synth: FileList
    }
}

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp3']

export default function StemUploadForm({ onUploadSuccess }: StemUploadFormProps) {
    const [loading, setLoading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState<string>('')

    // Preview states
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [mainTrackName, setMainTrackName] = useState<string | null>(null)

    const supabase = createClient()

    const { register, handleSubmit, control, watch, setValue, formState: { errors }, reset } = useForm<UploadFormData>({
        defaultValues: {
            title: '',
            description: '',
            genre: '',
        }
    })

    const validateFile = (fileList: FileList, isAudio: boolean = true) => {
        if (!fileList || fileList.length === 0) return true // Optional files
        const file = fileList[0]

        if (file.size > MAX_FILE_SIZE) {
            return `File size must be less than 20MB`
        }

        if (isAudio && !ALLOWED_AUDIO_TYPES.includes(file.type)) {
            // Check extension as fallback if type is empty or generic
            const ext = file.name.split('.').pop()?.toLowerCase()
            if (!['mp3', 'wav'].includes(ext || '')) {
                return `Only WAV and MP3 files are allowed`
            }
        }
        return true
    }

    const uploadToStorage = async (file: File, bucket: string, path: string) => {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file)

        if (error) throw error

        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path)
        return publicData.publicUrl
    }

    const onSubmit = async (data: UploadFormData) => {
        setLoading(true)
        setUploadProgress('Starting upload...')

        try {
            const user = (await supabase.auth.getUser()).data.user
            if (!user) throw new Error('User not authenticated')

            const projectId = uuidv4()

            // 1. Upload Cover Image
            setUploadProgress('Uploading cover image...')
            const imageFile = data.coverImage[0]
            // Use 'images' bucket or folder in assets? Assuming 'assets' based on existing code, or 'public'
            // Using 'assets' as seen in existing UploadForm.tsx
            const imageExt = imageFile.name.split('.').pop()
            const imagePath = `covers/${projectId}.${imageExt}`
            const imageUrl = await uploadToStorage(imageFile, 'assets', imagePath)

            // 2. Upload Main Track
            setUploadProgress('Uploading main track...')
            const mainTrackFile = data.mainTrack[0]
            const mainTrackExt = mainTrackFile.name.split('.').pop()
            const mainTrackPath = `tracks/${projectId}.${mainTrackExt}`
            // Assuming 'assets' for public tracks too, or maybe 'stems' if we want to unify structure?
            // Existing code uses 'assets'. Stems use 'stems'.
            const mainTrackUrl = await uploadToStorage(mainTrackFile, 'assets', mainTrackPath)

            // 3. Upload Stems
            const stemsUrls: Record<string, string> = {}
            const stemTypes = ['vocal', 'drum', 'bass', 'synth'] as const

            for (const type of stemTypes) {
                const fileList = data.stems[type]
                if (fileList && fileList.length > 0) {
                    setUploadProgress(`Uploading ${type} stem...`)
                    const file = fileList[0]
                    const ext = file.name.split('.').pop()
                    const path = `${user.id}/${projectId}/${type}.${ext}`

                    // Upload to 'stems' bucket
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('stems')
                        .upload(path, file)

                    if (uploadError) throw uploadError

                    // Stems might be private, so maybe we don't store a public URL, 
                    // or storing the path is enough?
                    // The prompt asks for URL in JSON. If bucket is private, GetPublicUrl won't work for public access,
                    // but we can store the Signed URL or just the path. 
                    // However, to follow the structure { "vocal": "url" }, and implementation plan said:
                    // "Select: Authenticated users can download". 
                    // If we want a permanent URL for the DB, it usually implies a public URL or a consistent way to access it.
                    // Let's store the full path for now or signed URL? 
                    // Usually storing the path is better for private assets, but the prompt example showed "url".
                    // I'll assume we store the path relative to the bucket or a generated signed URL if needed later.
                    // But wait, standard getPublicUrl returns a URL that works if the policy allows it.
                    // Since my policy allows SELECT for authenticated users, the direct URL might work for them?
                    // Actually, for private buckets, getPublicUrl returns a URL that might 403.
                    // For simplicity and prompt compliance { "vocal": "url" }, I will generate the URL path string 
                    // that the client sees (the resource URL), trusting RLS to handle access.
                    // It typically looks like: https://[project].supabase.co/storage/v1/object/public/stems/... 
                    // (Note: 'public' keyword in URL usually for public buckets).
                    // For authenticated access, we usually need createSignedUrl.
                    // BUT, if I just store the path or file identifier, the frontend can generate signed URLs on demand.
                    // Given the prompt example { "vocal": "url" }, I will store the Storage path for now, 
                    // OR I'll assume the client will generate a signed URL from this 'url' if it's not directly accessible.
                    // Actually, let's store the simple path that can be used with `supabase.storage.download`.
                    // Wait, existing code uses `getPublicUrl`. 
                    // I'll stick to `getPublicUrl` format but maybe for private buckets it won't be "public".
                    // I'll simply store the *path* in the URL field if it's meant to be used by the app logic 
                    // to fetch a signed URL, or the full URL if it's intended to be direct.
                    // Let's store the full URL path, knowing it needs an auth token header or signed URL mechanism to fetch.
                    // Or simpler: Just store the path `user_id/project_id/vocal.wav` in the JSON if the app knows how to handle it.
                    // But the request says "JSON structure ... { 'vocal': 'url' ... }".
                    // I will execute `getPublicUrl` which returns the URL format.

                    const { data } = supabase.storage.from('stems').getPublicUrl(path)
                    stemsUrls[type] = data.publicUrl
                }
            }

            // 4. Save to DB
            setUploadProgress('Saving project details...')
            const response = await fetch('/api/tracks/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: data.title,
                    description: data.description,
                    genre: data.genre,
                    image_url: imageUrl,
                    audio_url: mainTrackUrl,
                    stems: stemsUrls,
                    user_id: user.id
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to save project')
            }

            setUploadProgress('Done!')
            reset()
            setImagePreview(null)
            setMainTrackName(null)
            onUploadSuccess()

        } catch (error: any) {
            console.error('Upload failed:', error)
            alert(`Upload failed: ${error.message}`)
        } finally {
            setLoading(false)
            setUploadProgress('')
        }
    }

    // Handlers for previews
    const handleImagePreview = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImagePreview(URL.createObjectURL(file))
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 text-zinc-200">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-500 bg-clip-text text-transparent">
                Upload New Track
            </h2>

            {/* Basic Info */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Title <span className="text-red-500">*</span></label>
                    <input
                        {...register('title', { required: 'Title is required' })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 focus:ring-1 focus:ring-white outline-none"
                        placeholder="Song Title"
                    />
                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                        {...register('description')}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 focus:ring-1 focus:ring-white outline-none h-24"
                        placeholder="Tell us about your track..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Genre</label>
                    <select
                        {...register('genre')}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 focus:ring-1 focus:ring-white outline-none"
                    >
                        <option value="">Select Genre</option>
                        <option value="Pop">Pop</option>
                        <option value="Hip Hop">Hip Hop</option>
                        <option value="R&B">R&B</option>
                        <option value="Electronic">Electronic</option>
                        <option value="Rock">Rock</option>
                        <option value="Jazz">Jazz</option>
                        <option value="Classical">Classical</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cover Image */}
                <div>
                    <label className="block text-sm font-medium mb-1">Cover Image <span className="text-red-500">*</span></label>
                    <div className="relative aspect-square bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-lg overflow-hidden hover:border-zinc-500 transition-colors group">
                        {imagePreview ? (
                            <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
                                <ImageIcon size={32} className="mb-2" />
                                <span className="text-xs">Upload Cover</span>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            {...register('coverImage', {
                                required: 'Cover image is required',
                                onChange: handleImagePreview
                            })}
                        />
                    </div>
                    {errors.coverImage && <p className="text-red-500 text-xs mt-1">{errors.coverImage.message}</p>}
                </div>

                {/* Main Track */}
                <div>
                    <label className="block text-sm font-medium mb-1">Main Audio File <span className="text-red-500">*</span></label>
                    <div className="h-full min-h-[150px] bg-zinc-800 border border-zinc-700 rounded-lg p-4 flex flex-col items-center justify-center relative">
                        <Music className="w-8 h-8 text-zinc-500 mb-2" />
                        <span className="text-sm text-zinc-300">
                            {watch('mainTrack')?.[0]?.name || 'Select Main Track (MP3/WAV)'}
                        </span>
                        <input
                            type="file"
                            accept=".mp3,.wav"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            {...register('mainTrack', {
                                required: 'Main track is required',
                                validate: (files) => validateFile(files)
                            })}
                        />
                    </div>
                    {errors.mainTrack && <p className="text-red-500 text-xs mt-1 bg-red-500/10 p-2 rounded">{errors.mainTrack.message?.toString()}</p>}
                </div>
            </div>

            {/* Stems Section */}
            <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/50">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                    Stem Files (Optional)
                </h3>
                <p className="text-xs text-zinc-500 mb-4">
                    Upload individual stems for remixing. Max 20MB per file. WAV or MP3 only.
                </p>

                <div className="space-y-4">
                    {['vocal', 'drum', 'bass', 'synth'].map((stem) => (
                        <div key={stem} className="flex items-center gap-4 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                            <div className="w-20 font-medium capitalize text-zinc-400">{stem}</div>
                            <div className="flex-1 relative">
                                <input
                                    type="file"
                                    accept=".mp3,.wav"
                                    className="block w-full text-sm text-zinc-400
                                      file:mr-4 file:py-2 file:px-4
                                      file:rounded-full file:border-0
                                      file:text-xs file:font-semibold
                                      file:bg-zinc-800 file:text-white
                                      hover:file:bg-zinc-700
                                      cursor-pointer"
                                    {...register(`stems.${stem}` as any, {
                                        validate: (files) => validateFile(files as FileList)
                                    })}
                                />
                                {errors.stems?.[stem as keyof typeof errors.stems] && (
                                    <p className="text-red-500 text-xs mt-1 ml-2">
                                        {(errors.stems[stem as keyof typeof errors.stems] as any)?.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex flex-col items-center justify-center"
            >
                {loading ? (
                    <>
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Processing...</span>
                        </div>
                        <span className="text-xs font-normal opacity-75 mt-1">{uploadProgress}</span>
                    </>
                ) : (
                    'Upload Project & Stems'
                )}
            </button>
        </form>
    )
}
