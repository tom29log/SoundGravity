import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

export const maxDuration = 300 // 5 minutes timeout for long running separation

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

        const replicate = new Replicate({
            auth: token,
        })

        console.log('Using Replicate for stem separation:', audioUrl)

        // Using cjwbw/demucs model (htdemucs)
        // This is a popular deployment of Demucs on Replicate
        const output = await replicate.run(
            "cjwbw/demucs:25a173108cff36ef9f80f854c162d01df9e6528be175794b81158fa03836d953",
            {
                input: {
                    audio: audioUrl,
                    model: "htdemucs" // default model
                }
            }
        )

        console.log('Replicate output:', output)

        // cjwbw/demucs returns a JSON object like:
        // {
        //   "bass": "https://...",
        //   "drums": "https://...",
        //   "other": "https://...",
        //   "vocals": "https://..."
        // }
        // We need to map this to our frontend expectation: vocal, drum, bass, synth
        // "other" usually maps to synth/accompaniment in 4-stem context if not explicitly defined

        if (!output || typeof output !== 'object') {
            throw new Error('Invalid response from Replicate')
        }

        const rawStems = output as Record<string, string>

        const stems = {
            vocal: rawStems.vocals || null,
            drum: rawStems.drums || null,
            bass: rawStems.bass || null,
            synth: rawStems.other || null // Mapping 'other' to 'synth' for our app
        }

        return NextResponse.json(stems)

    } catch (error: any) {
        console.error('Stem separation error:', error)
        return NextResponse.json(
            { error: error.message || 'Stem separation failed' },
            { status: 500 }
        )
    }
}
