import * as Tone from 'tone'

/**
 * Singleton AudioContext Manager
 * 
 * iOS Safari enforces a strict limit on the number of active AudioContexts (typically 4-6).
 * Creating a new AudioContext per component will quickly exhaust this limit, causing the tab to crash or hang.
 * 
 * This utility ensures we always use the SINGLE global AudioContext provided by Tone.js (or a robust fallback),
 * and handles the "resume on user interaction" requirement centrally.
 */

export const getGlobalAudioContext = async (): Promise<AudioContext> => {
    // 1. Ensure Tone.js context is started
    if (Tone.context.state !== 'running') {
        try {
            await Tone.start()
        } catch (e) {
            console.warn('Tone.start() failed (likely no user interaction yet)', e)
        }
    }

    // 2. Return the raw AudioContext from Tone
    // Tone.context is a ToneContext, usually wrapping the native AudioContext.
    // We access the raw context via .rawContext (or it behaves like one).
    // Safest is to use Tone.context.rawContext as AudioContext
    return Tone.context.rawContext as AudioContext
}

/**
 * Helper to safely close/suspend context (if ever needed explicitly, usually we just let it run)
 */
export const suspendGlobalAudioContext = async () => {
    if (Tone.context.state === 'running') {
        await Tone.context.suspend()
    }
}
