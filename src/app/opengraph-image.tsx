import { ImageResponse } from 'next/og'
import { join } from 'path'
import { readFileSync } from 'fs'

export const runtime = 'nodejs'

export const alt = 'SoundGravity'
export const size = {
    width: 1200,
    height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
    // Read the logo file from public directory
    const logoPath = join(process.cwd(), 'public', 'og_logo.png')
    const logoData = readFileSync(logoPath)

    return new ImageResponse(
        (
            <div
                style={{
                    background: 'black',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={logoData.buffer as any}
                    alt="SoundGravity Logo"
                    width="400"
                    height="400"
                    style={{
                        objectFit: 'contain'
                    }}
                />
            </div>
        ),
        {
            ...size,
        }
    )
}
