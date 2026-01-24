'use client'

import { useEffect, useState } from 'react'

export default function StemTestPage() {
    const [status, setStatus] = useState('Loading...')
    const [logs, setLogs] = useState<string[]>([])

    const addLog = (msg: string) => {
        console.log(msg)
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`])
    }

    useEffect(() => {
        const testStemLoading = async () => {
            const stemUrl = 'https://jgzistwfzvfiikqsygpt.supabase.co/storage/v1/object/public/assets/stems_1769296478668_bass.mp3'

            addLog('1. Testing fetch...')

            try {
                // Test 1: Simple fetch
                const response = await fetch(stemUrl)
                addLog(`2. Fetch response: ${response.status} ${response.statusText}`)

                if (!response.ok) {
                    addLog('❌ Fetch failed!')
                    setStatus('Fetch failed')
                    return
                }

                addLog('3. Fetch OK! Testing audio decoding...')

                // Test 2: Audio decoding with Web Audio API
                const arrayBuffer = await response.arrayBuffer()
                addLog(`4. Downloaded ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`)

                const audioContext = new AudioContext()
                addLog('5. AudioContext created')

                await audioContext.decodeAudioData(arrayBuffer)
                addLog('✅ Audio decoded successfully!')

                setStatus('All tests passed! ✅')

            } catch (error: any) {
                addLog(`❌ Error: ${error.message}`)
                setStatus(`Error: ${error.message}`)
            }
        }

        testStemLoading()
    }, [])

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <h1 className="text-2xl font-bold mb-4">Stem Loading Test</h1>
            <div className="mb-4">
                <span className="font-bold">Status: </span>
                <span className={status.includes('✅') ? 'text-green-500' : status.includes('Error') ? 'text-red-500' : 'text-yellow-500'}>
                    {status}
                </span>
            </div>
            <div className="bg-zinc-900 p-4 rounded-lg">
                <h2 className="font-bold mb-2">Logs:</h2>
                {logs.map((log, i) => (
                    <div key={i} className={`text-sm font-mono ${log.includes('✅') ? 'text-green-400' : log.includes('❌') ? 'text-red-400' : 'text-zinc-300'}`}>
                        {log}
                    </div>
                ))}
            </div>
        </div>
    )
}
