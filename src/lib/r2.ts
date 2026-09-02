import { S3Client } from '@aws-sdk/client-s3'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || 'cc718759e4b9e759ec389ef23fa3f842'
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || 'cbae45d908eb786989ff6751c15f5cbe'
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '6e031b88fb88fba9ffe38005c6b20f0679d1555bfdcf5298c638005066ed9cd4'

// Cloudflare R2 Configuration
export const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
})
