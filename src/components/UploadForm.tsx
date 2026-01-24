'use plain'
'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Upload, X, Music, Image as ImageIcon, Sparkles, Loader2, Check } from 'lucide-react'
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

    // New validation states
    const [copyrightConfirmed, setCopyrightConfirmed] = useState(false)
    const [isAiGenerated, setIsAiGenerated] = useState(false)
    const [aiTool, setAiTool] = useState('')

    const imageInputRef = useRef<HTMLInputElement>(null)
    const audioInputRef = useRef<HTMLInputElement>(null)

    // Stems State (File-based for manual upload)
    const [stems, setStems] = useState<{ [key: string]: File | null }>({
        vocal: null,
        drum: null,
        bass: null,
        synth: null,
    })
    // Stems URLs (for auto-separated stems)
    const [stemUrls, setStemUrls] = useState<{ [key: string]: string | null }>({
        vocal: null,
        drum: null,
        bass: null,
        synth: null,
    })
    const [isSeparating, setIsSeparating] = useState(false)
    const [separationStatus, setSeparationStatus] = useState('')
    const stemInputRefs = {
        vocal: useRef<HTMLInputElement>(null),
        drum: useRef<HTMLInputElement>(null),
        bass: useRef<HTMLInputElement>(null),
        synth: useRef<HTMLInputElement>(null),
    }
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
            const file = e.target.files[0]
            if (file.size > 50 * 1024 * 1024) {
                alert('File size exceeds the 50MB limit.')
                if (audioInputRef.current) audioInputRef.current.value = ''
                return
            }
            setAudioFile(file)
        }
    }

    const handleStemChange = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (file.size > 20 * 1024 * 1024) {
                alert('Stem file size limit is 20MB.')
                if (stemInputRefs[type as keyof typeof stemInputRefs].current) {
                    stemInputRefs[type as keyof typeof stemInputRefs].current!.value = ''
                }
                return
            }
            setStems(prev => ({ ...prev, [type]: file }))
            // Clear any URL-based stem for this type
            setStemUrls(prev => ({ ...prev, [type]: null }))
        }
    }

    // Auto Stem Separation
    const handleStemSeparation = async () => {
        if (!audioFile) {
            alert('Please upload master audio first')
            return
        }

        setIsSeparating(true)
        setSeparationStatus('Uploading audio...')

        try {
            // 1. Upload master audio first to get URL
            const audioUrl = await uploadFile(audioFile)

            setSeparationStatus('Separating stems (1-2 min)...')

            // 2. Call stem separation API
            const response = await fetch('/api/stems/separate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioUrl }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Stem separation failed')
            }

            const separatedStems = await response.json()

            setSeparationStatus('Uploading stems to storage...')

            // 3.5 Upload separated stems to Supabase Storage (since local URLs won't work in production)
            const uploadedStemUrls: { [key: string]: string | null } = {
                vocal: null,
                drum: null,
                bass: null,
                synth: null,
            }

            for (const [stemType, localUrl] of Object.entries(separatedStems)) {
                if (localUrl && typeof localUrl === 'string') {
                    try {
                        console.log(`Fetching ${stemType} from ${localUrl}`)
                        // Fetch the stem file from local server
                        const stemResponse = await fetch(localUrl)
                        if (!stemResponse.ok) {
                            console.error(`Failed to fetch ${stemType}: ${stemResponse.status}`)
                            continue
                        }
                        const stemBlob = await stemResponse.blob()
                        console.log(`${stemType} blob size: ${stemBlob.size}`)
                        const stemFile = new File([stemBlob], `${stemType}.mp3`, { type: 'audio/mpeg' })

                        // Upload to Supabase
                        const fileExt = 'mp3'
                        const fileName = `stems_${Date.now()}_${stemType}.${fileExt}`

                        console.log(`Uploading ${stemType} to Supabase as ${fileName}`)
                        const { error: uploadError } = await supabase.storage
                            .from('assets')
                            .upload(fileName, stemFile)

                        if (uploadError) {
                            console.error(`Failed to upload ${stemType}:`, uploadError)
                        } else {
                            const { data } = supabase.storage.from('assets').getPublicUrl(fileName)
                            uploadedStemUrls[stemType as keyof typeof uploadedStemUrls] = data.publicUrl
                            console.log(`${stemType} uploaded successfully: ${data.publicUrl}`)
                        }
                    } catch (err) {
                        console.error(`Failed to upload ${stemType} stem:`, err)
                    }
                }
            }

            // 4. Set the stem URLs (now pointing to Supabase)
            setStemUrls(uploadedStemUrls)

            // Clear file-based stems since we now have URLs
            setStems({ vocal: null, drum: null, bass: null, synth: null })

            setSeparationStatus('Stems ready!')
        } catch (error: any) {
            console.error('Stem separation error:', error)
            alert('Stem separation failed: ' + error.message)
            setSeparationStatus('')
        } finally {
            setIsSeparating(false)
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

        if (!copyrightConfirmed) {
            alert('Please confirm the copyright declaration.')
            return
        }

        setLoading(true)
        try {
            // 1. Upload Image
            const imageUrl = await uploadFile(imageFile)

            // 2. Upload Audio
            // 2. Upload Audio
            const audioUrl = await uploadFile(audioFile)

            // 2.5 Upload Stems (if any) or use pre-separated URLs
            let uploadedStems: Record<string, string> | null = null

            // Check for URL-based stems first (from auto separation)
            const urlBasedStems = Object.entries(stemUrls).filter(([_, url]) => url !== null)
            if (urlBasedStems.length > 0) {
                uploadedStems = {}
                for (const [type, url] of urlBasedStems) {
                    if (url) uploadedStems[type] = url
                }
            }

            // Then check for file-based stems (manual upload)
            const stemsToUpload = Object.entries(stems).filter(([_, file]) => file !== null)
            if (stemsToUpload.length > 0) {
                if (!uploadedStems) uploadedStems = {}
                for (const [type, file] of stemsToUpload) {
                    if (file) {
                        try {
                            const url = await uploadFile(file)
                            uploadedStems[type] = url
                        } catch (err) {
                            console.error(`Failed to upload ${type} stem`, err)
                        }
                    }
                }
            }

            // 3. Insert into DB
            const { data: { user } } = await supabase.auth.getUser()

            const { error } = await supabase.from('projects').insert({
                title,
                image_url: imageUrl,
                audio_url: audioUrl,
                stems: uploadedStems, // Add stems data
                target_url: targetUrl || null,
                user_id: user?.id,
                is_ai_generated: isAiGenerated,
                ai_tool_used: isAiGenerated ? aiTool : null,
                copyright_confirmed: copyrightConfirmed
            })

            if (error) throw error

            // Reset form
            setTitle('')
            setTargetUrl('')
            setImageFile(null)
            setAudioFile(null)
            setImagePreview(null)
            setCopyrightConfirmed(false)
            setIsAiGenerated(false)
            setAiTool('')
            setStemUrls({ vocal: null, drum: null, bass: null, synth: null })
            setSeparationStatus('')

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
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Input */}
            <div>
                <label className="block text-sm font-medium mb-1 text-zinc-300">Project Title <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Summer Vibes"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm focus:ring-1 focus:ring-white focus:outline-none transition-colors"
                    required
                />
            </div>

            {/* Target URL Input */}
            <div>
                <label className="block text-sm font-medium mb-1 text-zinc-300">Link URL (Optional)</label>
                <input
                    type="url"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm focus:ring-1 focus:ring-white focus:outline-none transition-colors"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-300">Cover Image <span className="text-red-500">*</span></label>
                    {!imagePreview ? (
                        <div
                            onClick={() => imageInputRef.current?.click()}
                            className="w-full aspect-video bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/80 hover:border-zinc-500 transition-all group"
                        >
                            <ImageIcon className="w-8 h-8 text-zinc-500 group-hover:text-zinc-400 mb-2 transition-colors" />
                            <span className="text-xs text-zinc-500 group-hover:text-zinc-400">Click to upload image</span>
                        </div>
                    ) : (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-zinc-700 group">
                            <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                            <button
                                type="button"
                                onClick={clearImage}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80"
                            >
                                <X size={14} />
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
                    <label className="block text-sm font-medium mb-1 text-zinc-300">Master Audio <span className="text-red-500">*</span></label>
                    <div
                        onClick={() => audioInputRef.current?.click()}
                        className={`w-full h-[calc(100%-1.6rem)] min-h-[140px] p-4 bg-zinc-800 border border-zinc-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/80 hover:border-zinc-500 transition-all gap-3 ${audioFile ? 'border-green-500/30 bg-green-500/5' : ''}`}
                    >
                        {audioFile ? (
                            <>
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <Music className="w-5 h-5 text-green-500" />
                                </div>
                                <span className="text-sm text-green-400 font-medium truncate max-w-[200px] text-center">
                                    {audioFile.name}
                                </span>
                                <span className="text-xs text-zinc-500">Click to change</span>
                            </>
                        ) : (
                            <>
                                <Music className="w-8 h-8 text-zinc-500" />
                                <span className="text-xs text-zinc-500">Select master file...</span>
                            </>
                        )}
                        <input
                            type="file"
                            accept="audio/*"
                            ref={audioInputRef}
                            onChange={handleAudioChange}
                            className="hidden"
                        />
                    </div>
                </div>
            </div>

            {/* Stems Upload Section (Optional) */}
            <div className="border border-zinc-800 bg-zinc-900/30 rounded-lg p-5">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-white">Stems (Optional)</h3>
                    {audioFile && (
                        <button
                            type="button"
                            onClick={handleStemSeparation}
                            disabled={isSeparating}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-zinc-700 disabled:to-zinc-700 rounded-lg text-xs font-medium transition-all"
                        >
                            {isSeparating ? (
                                <>
                                    <Loader2 size={12} className="animate-spin" />
                                    {separationStatus}
                                </>
                            ) : separationStatus === 'Stems ready!' ? (
                                <>
                                    <Check size={12} />
                                    Stems Ready
                                </>
                            ) : (
                                <>
                                    <Sparkles size={12} />
                                    Auto Separate Stems
                                </>
                            )}
                        </button>
                    )}
                </div>
                <p className="text-xs text-zinc-500 mb-2">
                    {audioFile
                        ? 'Click "Auto Separate Stems" to split your track, or upload manually below.'
                        : 'Upload master audio first to enable auto stem separation.'
                    }
                </p>
                {audioFile && !separationStatus && (
                    <p className="text-[11px] text-amber-500/80 mb-4 flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        AI 스템 분리에는 약 2~5분이 소요됩니다 (무료 서비스)
                    </p>
                )}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {['vocal', 'drum', 'bass', 'synth'].map((type) => (
                        <div key={type} className="relative">
                            <input
                                type="file"
                                accept="audio/*"
                                ref={stemInputRefs[type as keyof typeof stemInputRefs]}
                                onChange={(e) => handleStemChange(type, e)}
                                className="hidden"
                            />
                            <div
                                onClick={() => !stemUrls[type] && stemInputRefs[type as keyof typeof stemInputRefs].current?.click()}
                                className={`h-24 border border-zinc-700 rounded-md flex flex-col items-center justify-center transition-colors ${stemUrls[type] ? 'bg-green-500/10 border-green-500/30 cursor-default' : stems[type] ? 'bg-blue-500/10 border-blue-500/30 cursor-pointer hover:bg-zinc-800' : 'bg-zinc-800/50 cursor-pointer hover:bg-zinc-800'}`}
                            >
                                <span className="text-xs font-semibold capitalize text-zinc-400 mb-1">{type}</span>
                                {stemUrls[type] ? (
                                    <div className="flex flex-col items-center">
                                        <Check size={14} className="text-green-500 mb-1" />
                                        <span className="text-[10px] text-green-400">Auto-separated</span>
                                    </div>
                                ) : stems[type] ? (
                                    <span className="text-[10px] text-blue-400 px-2 truncate w-full text-center">
                                        {stems[type]!.name}
                                    </span>
                                ) : (
                                    <Upload size={14} className="text-zinc-600" />
                                )}
                            </div>
                            {(stems[type] || stemUrls[type]) && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setStems(prev => ({ ...prev, [type]: null }))
                                        setStemUrls(prev => ({ ...prev, [type]: null }))
                                        if (stemInputRefs[type as keyof typeof stemInputRefs].current) {
                                            stemInputRefs[type as keyof typeof stemInputRefs].current!.value = ''
                                        }
                                    }}
                                    className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-500/80 rounded-full text-white transition-colors"
                                >
                                    <X size={10} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* AI & Copyright Section - Grouped with a border */}
            <div className="border border-zinc-800 bg-zinc-900/50 rounded-lg p-5 space-y-5">
                {/* AI Declaration Toggle */}
                <div className="space-y-3">
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="block text-sm font-medium text-white">AI Creation Tool Usage</span>
                            <span className="text-xs text-zinc-500">Did you use AI tools (e.g. Udio, Suno) to create this track?</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={isAiGenerated}
                                onChange={(e) => setIsAiGenerated(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {/* Conditional Input for AI Tools */}
                    {isAiGenerated && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                            <label className="block text-xs font-medium mb-1.5 text-blue-400">Which AI tools did you use?</label>
                            <input
                                type="text"
                                value={aiTool}
                                onChange={(e) => setAiTool(e.target.value)}
                                placeholder="e.g., Udio, Suno, Ableton AI..."
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder:text-zinc-600 transition-all"
                            />
                        </div>
                    )}
                </div>

                <div className="h-px bg-zinc-800/50"></div>

                {/* Copyright Checkbox */}
                <div className="flex items-start gap-3">
                    <div className="flex items-center h-5">
                        <input
                            id="copyright"
                            type="checkbox"
                            checked={copyrightConfirmed}
                            onChange={(e) => setCopyrightConfirmed(e.target.checked)}
                            className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-900"
                            required
                        />
                    </div>
                    <label htmlFor="copyright" className="text-sm text-zinc-300 cursor-pointer select-none">
                        <span className="font-medium text-white">Copyright Confirmation</span>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            I confirm that I created this original work and have the right to distribute it.
                            I understand that I am responsible for any copyright violations.
                        </p>
                    </label>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-bold py-3.5 rounded-lg hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-white/5"
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        Uploading...
                    </span>
                ) : 'Create Project'}
            </button>
        </form>
    )
}
