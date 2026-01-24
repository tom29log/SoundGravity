import { NextRequest, NextResponse } from 'next/server'

// Local Python Demucs server for stem separation
const DEMUCS_SERVER_URL = process.env.DEMUCS_SERVER_URL || 'http://localhost:5001'

export async function POST(request: NextRequest) {
    try {
        const { audioUrl } = await request.json()

        if (!audioUrl) {
            return NextResponse.json(
                { error: 'Audio URL is required' },
                { status: 400 }
            )
        }

        console.log('Calling local Demucs server for:', audioUrl)

        // Call local Python Demucs server
        const response = await fetch(`${DEMUCS_SERVER_URL}/separate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ audioUrl }),
        })

        if (!response.ok) {
            const error = await response.json()
            console.error('Demucs server error:', error)
            return NextResponse.json(
                { error: error.error || 'Stem separation failed' },
                { status: 500 }
            )
        }

        const stems = await response.json()
        console.log('Stems received:', stems)

        return NextResponse.json(stems)

    } catch (error: any) {
        console.error('Stem separation error:', error)

        // Check if the local server is running
        if (error.cause?.code === 'ECONNREFUSED') {
            return NextResponse.json(
                { error: 'Demucs server not running. Start it with: python scripts/demucs_server.py' },
                { status: 503 }
            )
        }

        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
