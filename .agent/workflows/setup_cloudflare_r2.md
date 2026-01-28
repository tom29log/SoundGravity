---
description: How to set up Cloudflare R2 for zero-egress file storage
---

# Cloudflare R2 Setup Guide

Cloudflare R2 is an S3-compatible object storage service with **zero egress fees**, making it perfect for storing large audio files (WAV stems) without worrying about bandwith limits.

## 1. Create R2 Bucket (Cloudflare Dashboard)
1.  Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/).
2.  Go to **R2** from the sidebar.
3.  Click **"Create Bucket"**.
    -   Name: `soundgravity-stems` (or similar)
    -   Location: `Automatic`
4.  Click **"Create Bucket"**.

## 2. Generate Credentials (API Tokens)
1.  In the R2 dashboard, click **"Manage R2 API Tokens"** (right sidebar).
2.  Click **"Create API Token"**.
3.  Select **"Object Read & Write"** permission.
4.  Apply to **Specific Bucket** (`soundgravity-stems`) or All Buckets.
5.  Click **"Create API Token"**.
6.  **SAVE THESE VALUES IMMEDIATELY** (You won't see them again):
    -   `Access Key ID`
    -   `Secret Access Key`
    -   `Endpoint` (e.g., `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`)

## 3. Enable Public Access (Optional but recommended for read ease)
If you want to read files via a nice URL (e.g., `https://cdn.soundgravity.com/...`):
1.  Go to your Bucket Settings -> **Public Access**.
2.  **Connect Custom Domain**: Enter a subdomain (e.g., `stems.soundgravity.com`) and follow DNS instructions.
3.  OR allow `R2.dev` subdomain (good for testing, but rate limited).

## 4. Install AWS SDK (In Project)
Since R2 is S3-compatible, we use the standard AWS SDK for Node.js.

```bash
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
```

## 5. Environment Variables (.env.local)
Add these to your project:

```env
R2_ACCOUNT_ID=Running_command_to_get_this_later
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=soundgravity-stems
R2_PUBLIC_URL=https://<YOUR_CUSTOM_DOMAIN>
```

## 6. Code Integration Plan
We will need to update `src/app/api/upload/route.ts` (if it exists) or create a new upload handler that writes to R2 instead of Supabase Storage.

**Next Step?**
Once you have the credentials, I can write the code to upload/download from R2 seamlessly.
