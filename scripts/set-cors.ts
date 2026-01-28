import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3'
import fs from 'fs'
import path from 'path'

// Load envs manually
const envPath = path.resolve(process.cwd(), '.env.local')
const envFile = fs.readFileSync(envPath, 'utf8')
const envVars = Object.fromEntries(
    envFile.split('\n').filter(Boolean).map(line => {
        if (line.trim().startsWith('#')) return []
        const [key, ...values] = line.split('=')
        if (!key) return []
        return [key.trim(), values.join('=').trim().replace(/^["']|["']$/g, '')]
    }).filter(entry => entry.length === 2)
)

const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${envVars.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: envVars.R2_ACCESS_KEY_ID,
        secretAccessKey: envVars.R2_SECRET_ACCESS_KEY,
    },
})

async function setCors() {
    console.log('Setting CORS policy for:', envVars.R2_BUCKET_NAME)
    try {
        const command = new PutBucketCorsCommand({
            Bucket: envVars.R2_BUCKET_NAME,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedHeaders: ['*'],
                        AllowedMethods: ['PUT', 'GET', 'HEAD', 'POST'],
                        AllowedOrigins: ['*'],
                        ExposeHeaders: ['ETag'],
                        MaxAgeSeconds: 3000,
                    },
                ],
            },
        })

        await r2.send(command)
        console.log('✅ CORS policy applied successfully!')
    } catch (error) {
        console.error('❌ Error setting CORS:', error)
    }
}

setCors()
