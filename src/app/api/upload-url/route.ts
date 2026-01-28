import { createClient } from '@/lib/supabase-server'
import { r2 } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// Optimize for Edge? R2 SDK might need Node runtime, so keeping default (Node.js) for now.
// export const runtime = 'edge' 

export async function POST(request: Request) {
    try {
        // 1. Auth Check
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Parse Request
        const { filename, contentType } = await request.json()

        // 3. Validate
        if (!filename || !contentType) {
            return NextResponse.json({ error: 'Missing filename or contentType' }, { status: 400 })
        }

        // 4. Generate Unique Key
        // Folder structure: stems/{user_id}/{uuid}-{filename}
        const ext = filename.split('.').pop()
        const cleanFileName = filename.replace(/[^a-zA-Z0-9]/g, '_')
        const uniqueKey = `stems/${user.id}/${uuidv4()}-${cleanFileName}.${ext}`

        // 5. Generate Presigned URL
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: uniqueKey,
            ContentType: contentType,
        })

        const signedUrl = await getSignedUrl(r2, command, { expiresIn: 600 }) // 10 minutes

        // 6. Return Data
        // We return the Write URL (signedUrl) and the Read URL (publicUrl)
        // The Frontend will assume success and save the publicUrl to DB.

        const publicUrlBase = process.env.R2_PUBLIC_URL || ''
        // If user hasn't set public URL yet, this will be empty, effectively breaking playback.
        // Ideally we fallback or warn.

        const publicUrl = `${publicUrlBase}/${uniqueKey}`

        return NextResponse.json({
            uploadUrl: signedUrl,
            publicUrl: publicUrl,
            key: uniqueKey
        })

    } catch (error) {
        console.error('R2 URL Generation Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
