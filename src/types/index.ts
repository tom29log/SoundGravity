export interface Profile {
    id: string
    username: string | null
    avatar_url: string | null
    bio?: string | null
    followers_count: number
    updated_at: string
    social_links?: {
        instagram?: string
        soundcloud?: string
        twitter?: string
        website?: string
        followers_count?: number
        [key: string]: string | number | undefined
    } | null
}

export interface Project {
    id: string
    title: string
    image_url: string
    audio_url: string
    target_url: string | null
    user_id: string
    created_at: string
    views: number
    genre: string | null
    is_ai_generated?: boolean
    ai_tool_used?: string | null
    copyright_confirmed?: boolean
    profiles?: Profile // Joined data
}

export interface Like {
    user_id: string
    project_id: string
    created_at: string
}

export interface Comment {
    id: string
    user_id: string
    project_id: string
    content: string
    created_at: string
    meta?: {
        timestamp?: number // percentage or seconds
        x?: number
        y?: number
        audioState?: {
            pan: number
            frequency: number
        }
        filter?: string // placeholder for future filter params
    }
    profiles?: Profile // Joined data
}
