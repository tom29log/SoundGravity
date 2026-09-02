import { createClient } from '@/lib/supabase-server'
import { r2 } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'soundgravity-stems'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-e56c72c443144d21b0254b7ee1dad006.r2.dev'

export async function POST(request: Request) {
    try {
        // 1. Auth Check (allow logged in users or fallback to system upload)
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const userId = user?.id || 'public-upload'

        // 2. Parse Request
        const { filename, contentType } = await request.json()

        // 3. Validate
        if (!filename || !contentType) {
            return NextResponse.json({ error: 'Missing filename or contentType' }, { status: 400 })
        }

        // 4. Generate Unique Key
        const ext = filename.split('.').pop()
        const cleanFileName = filename.replace(/[^a-zA-Z0-9]/g, '_')
        const uniqueKey = `stems/${userId}/${uuidv4()}-${cleanFileName}.${ext}`

        // 5. Generate Presigned URL
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: uniqueKey,
            ContentType: contentType,
        })

        const signedUrl = await getSignedUrl(r2, command, { expiresIn: 600 })

        const publicUrl = `${R2_PUBLIC_URL}/${uniqueKey}`

        return NextResponse.json({
            uploadUrl: signedUrl,
            publicUrl: publicUrl,
            key: uniqueKey
        })

    } catch (error: any) {
        console.error('R2 URL Generation Error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
