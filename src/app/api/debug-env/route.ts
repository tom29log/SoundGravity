import { NextResponse } from 'next/server'

async function handler() {
    const storeId = process.env.LEMONSQUEEZY_STORE_ID
    const productId = process.env.LEMONSQUEEZY_PRODUCT_ID
    const apiKey = process.env.LEMONSQUEEZY_API_KEY

    return NextResponse.json({
        env: process.env.NODE_ENV,
        storeId_exists: !!storeId,
        storeId_val: storeId ? 'EXISTS' : 'MISSING',
        productId_exists: !!productId,
        productId_val: productId ? 'EXISTS' : 'MISSING',
        apiKey_exists: !!apiKey,
        apiKey_len: apiKey ? apiKey.length : 0,
        apiKey_start: apiKey ? apiKey.substring(0, 5) : null
    })
}

export async function GET() { return handler(); }
export async function POST() { return handler(); }
