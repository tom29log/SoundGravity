import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const maxDuration = 300 // Keep high timeout just in case

// POST: Start the separation job
export async function POST(request: NextRequest) {
    try {
        const { audioUrl } = await request.json()

        if (!audioUrl) {
            return NextResponse.json(
                { error: 'Audio URL is required' },
                { status: 400 }
            )
        }

        const token = process.env.REPLICATE_API_TOKEN
        if (!token) {
            console.error('REPLICATE_API_TOKEN is missing')
            return NextResponse.json(
                { error: 'Server configuration error: Missing Replicate API Token' },
                { status: 500 }
            )
        }

        // 1. Check User Auth
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
        }

        // 2. Start Replicate Demucs separation job
        const replicate = new Replicate({
            auth: token,
        })

        console.log('Starting Replicate prediction for:', audioUrl)

        // Create a prediction (async)
        const prediction = await replicate.predictions.create({
            version: "25a173108cff36ef9f80f854c162d01df9e6528be175794b81158fa03836d953", // cjwbw/demucs
            input: {
                audio: audioUrl,
                model: "htdemucs"
            }
        })

        if (prediction?.error) {
            return NextResponse.json({ error: prediction.error }, { status: 500 })
        }

        return NextResponse.json({
            processingId: prediction.id,
            status: prediction.status
        })

    } catch (error: any) {
        console.error('Stem separation start error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to start stem separation' },
            { status: 500 }
        )
    }
}

// GET: Check the status of a job
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const predictionId = searchParams.get('id')

        if (!predictionId) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 })
        }

        const token = process.env.REPLICATE_API_TOKEN
        if (!token) {
            return NextResponse.json({ error: 'Missing token' }, { status: 500 })
        }

        const replicate = new Replicate({
            auth: token,
        })

        const prediction = await replicate.predictions.get(predictionId)

        if (prediction?.error) {
            return NextResponse.json({ error: prediction.error }, { status: 500 })
        }

        let stems = null
        if (prediction.status === 'succeeded' && prediction.output) {
            const rawStems = prediction.output as Record<string, string>
            stems = {
                vocal: rawStems.vocals || null,
                drum: rawStems.drums || null,
                bass: rawStems.bass || null,
                synth: rawStems.other || null
            }
        }

        return NextResponse.json({
            status: prediction.status,
            stems: stems,
            logs: prediction.logs
        })

    } catch (error: any) {
        console.error('Stem separation poll error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to check status' },
            { status: 500 }
        )
    }
}
