// Web Worker for Audio Visualizer
// Receives frequency data (Uint8Array) and computes visual representation (e.g. simplified bars)

self.onmessage = (e: MessageEvent) => {
    const { frequencyData, config } = e.data
    // config: { barCount, width, height, ... }

    // Example: Downsample 1024 bins to 'barCount' bars
    const { barCount } = config || { barCount: 64 }

    const step = Math.floor(frequencyData.length / barCount)
    const bars: number[] = []

    for (let i = 0; i < barCount; i++) {
        let sum = 0
        for (let j = 0; j < step; j++) {
            sum += frequencyData[i * step + j]
        }
        const average = sum / step
        // Normalize 0-255 to 0-1 or keep as is
        bars.push(average)
    }

    // Send back processed data
    self.postMessage({ bars })
}
