import { NextResponse } from 'next/server'

export async function POST() {
    const storeId = process.env.LEMONSQUEEZY_STORE_ID
    const productId = process.env.LEMONSQUEEZY_PRODUCT_ID
    const apiKey = process.env.LEMONSQUEEZY_API_KEY

    return NextResponse.json({
        storeId_exists: !!storeId,
        storeId_val: storeId,
        productId_exists: !!productId,
        productId_val: productId,
        apiKey_exists: !!apiKey,
        apiKey_len: apiKey ? apiKey.length : 0,
        apiKey_start: apiKey ? apiKey.substring(0, 5) : null
    })
}
