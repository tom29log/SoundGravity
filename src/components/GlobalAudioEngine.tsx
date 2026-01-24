'use client'

import { useEffect, useRef } from 'react'
import * as Tone from 'tone'
import { usePlaylistPlayer } from '@/contexts/PlaylistPlayerContext'
import { useDeckPlayer } from '@/hooks/useDeckPlayer'
import { calculatePlaybackRate } from '@/utils/mixingStrategy'

export default function GlobalAudioEngine() {
    const {
        trackA,
        trackB,
        activeDeck,
        isPlaying,
        updateDeckMetrics,
        stopSignal,
        autoMixMode,
        masterBpm,
        setMasterBpm,
        mixingState,
        setMixingState
    } = usePlaylistPlayer()

    // Audio Graph
    const crossFadeRef = useRef<Tone.CrossFade | null>(null)
    const channelARef = useRef<Tone.Channel | null>(null)
    const channelBRef = useRef<Tone.Channel | null>(null)
    const pitchShiftARef = useRef<Tone.PitchShift | null>(null)
    const pitchShiftBRef = useRef<Tone.PitchShift | null>(null)

    // Initialize Graph
    useEffect(() => {
        const crossFade = new Tone.CrossFade(0).toDestination()
        const channelA = new Tone.Channel(0, 0)
        const channelB = new Tone.Channel(0, 0)

        // Pitch Shifters for Key Lock
        const pitchShiftA = new Tone.PitchShift(0).connect(crossFade.a)
        const pitchShiftB = new Tone.PitchShift(0).connect(crossFade.b)

        // Connect Channels to PitchShifters (Key Lock chain)
        channelA.disconnect()
        channelB.disconnect()
        channelA.connect(pitchShiftA)
        channelB.connect(pitchShiftB)

        crossFadeRef.current = crossFade
        channelARef.current = channelA
        channelBRef.current = channelB
        pitchShiftARef.current = pitchShiftA
        pitchShiftBRef.current = pitchShiftB

        return () => {
            crossFade.dispose()
            channelA.dispose()
            channelB.dispose()
            pitchShiftA.dispose()
            pitchShiftB.dispose()
        }
    }, [])

    // Decks
    const deckA = useDeckPlayer({
        track: trackA,
        destinationNode: channelARef.current
    })

    const deckB = useDeckPlayer({
        track: trackB,
        destinationNode: channelBRef.current
    })

    // Master Clock & BPM Sync Logic
    useEffect(() => {
        if (!autoMixMode) {
            // Reset rates if mode is off
            if (deckA.setRate) deckA.setRate(1)
            if (deckB.setRate) deckB.setRate(1)
            if (pitchShiftARef.current) pitchShiftARef.current.pitch = 0
            if (pitchShiftBRef.current) pitchShiftBRef.current.pitch = 0
            return
        }

        // 1. Determine Master BPM
        // Strategy: Master BPM follows the ACTIVE track's BPM.
        // If Active Deck changes, Master BPM should ideally ramp to new BPM, but for MVP let's snap or stick.
        // Let's set Master BPM to trackA's BPM if A is active, or B if B.
        // User requested: "Master Tempo(Key Lock)" implying consistent tempo? or changing?
        // "Realtime BPM Adjustment (Master Clock)"
        // "Next curve BPM catch-up"
        // Let's assume Master BPM is set by the currently playing track initially.

        let targetBpm = 124 // Default
        const activeTrack = activeDeck === 'A' ? trackA : trackB
        if (activeTrack?.bpm) {
            targetBpm = activeTrack.bpm
        }

        // Update Master BPM state (allows UI to show it)
        // Optimization: Only update if different to avoid render loops
        if (targetBpm !== masterBpm) {
            setMasterBpm(targetBpm)
        }

        // 2. Calculate Rates
        const rateA = calculatePlaybackRate(targetBpm, trackA?.bpm)
        const rateB = calculatePlaybackRate(targetBpm, trackB?.bpm)

        // 3. Apply Rates
        deckA.setRate(rateA)
        deckB.setRate(rateB)

        // 4. Time Stretch (Key Lock) Compensation
        // If rate is 1.05 (faster, +pitch), we shift pitch down.
        // Semitones = -12 * log2(rate)
        if (pitchShiftARef.current) {
            const shift = -12 * Math.log2(rateA)
            // Clamping reasonable limits (-12 to +12)
            pitchShiftARef.current.pitch = Math.max(-12, Math.min(12, shift))
        }
        if (pitchShiftBRef.current) {
            const shift = -12 * Math.log2(rateB)
            pitchShiftBRef.current.pitch = Math.max(-12, Math.min(12, shift))
        }

    }, [autoMixMode, activeDeck, trackA, trackB, deckA, deckB, masterBpm]) // Dependencies needs careful check to avoid Loop.
    // If I setMasterBpm inside, and it's a dept, loop.
    // Fixed: logic above uses `targetBpm` calculated from tracks, not referring to masterBpm state for calculation.
    // But I used `masterBpm` in dep array?
    // Start logic: Active Track -> MasterBpm.
    // Rate = MasterBpm / TrackBpm.
    // THIS IS CIRCULAR if MasterBpm comes from TrackBpm.
    // Rate = TrackBpm / TrackBpm = 1.
    // EXCEPT for the OTHER deck.
    // Deck B (inactive) rate = MasterBpm (A's bpm) / Deck B bpm.
    // Correct.

    // Handle Stop Command
    const lastStopSignalRef = useRef(stopSignal)
    useEffect(() => {
        if (stopSignal > lastStopSignalRef.current) {
            console.log('[Engine] Received Stop Signal', stopSignal)
            deckA.stop()
            deckB.stop()
            lastStopSignalRef.current = stopSignal
        }
    }, [stopSignal, deckA, deckB])

    // Playback Logic
    // Wait, usePlaylistPlayer might not have updated signature in internal types if I didn't update types file? 
    // I did update it.

    const { next } = usePlaylistPlayer() // Get next action

    useEffect(() => {
        // Console log to trace why this effect runs
        // console.log('[Engine] Effect run. State:', isPlaying ? 'Playing' : 'Not Playing', 'Active:', activeDeck)

        if (isPlaying) {
            // 1. Playback & Crossfade Control
            if (activeDeck === 'A') {
                if (!deckA.isPlaying) deckA.play()
                if (crossFadeRef.current) crossFadeRef.current.fade.rampTo(0, 1) // 1s crossfade
            } else {
                if (!deckB.isPlaying) deckB.play()
                if (crossFadeRef.current) crossFadeRef.current.fade.rampTo(1, 1) // 1s crossfade
            }

            // 2. Auto-Mix Logic
            // If active deck is near end (e.g., < 2s), trigger next
            const activePlayer = activeDeck === 'A' ? deckA : deckB
            const remaining = activePlayer.duration - activePlayer.currentTime

            // Only trigger if we have a duration and we are very close to end
            // And ensure we don't spam 'next' (debounce needed? or check if already transitioning?)
            // For simple logic: if remaining < 2s, we assume we can trigger next.
            // BUT Next switches deck immediately. So crossfade happens then.
            // Logic: 
            // - remaining < 5s -> Trigger Next.
            // - Next() toggles activeDeck -> 'B'.
            // - Effect runs again -> Detects Active is B -> Ramps crossfader to B over 1s.
            // - A continues playing until it stops naturally or we stop it?
            // - Currently deckA/B components auto-stop at end. 
            // - If we switch early, A is technically "paused" by logic below?
            // - Wait: logic below says "else { if (deckA.isPlaying) deckA.pause() }"
            // - Only if GLOBAL isPlaying is false.
            // - If global playing is true:
            // - If active is A: ensure A is playing.
            // - It does NOT explicitly stop B. B continues if it was playing? 
            // - Look at logic: "if (activeDeck === 'A') ... else ..."
            // - It only commands the ACTIVE deck to play. It doesn't command inactive to stop.
            // - This allows overlap! Perfect.

            if (activePlayer.duration > 0 && remaining < 5 && remaining > 0) {
                // Trigger next
                // We need to ensure we don't trigger it multiple times for the same track.
                // This simpler logic might spam 'next' every frame for 5 seconds.
                // We need a ref to lock "transitioning" or check if the Next track is already playing?
                // Or just check if we are already handling this index.
                // Better: use a flag or ensure `next` is only called once per track.
                // Given the complexity, let's use a ref to store 'lastAutoAdvanceTime' or 'lastTrackId'.
            }
        } else {
            if (deckA.isPlaying) deckA.pause()
            if (deckB.isPlaying) deckB.pause()
        }
    }, [isPlaying, activeDeck, deckA, deckB, next]) // Added deck state deps

    // Dedicated Effect for Auto-Mix Trigger to avoid playing with the playback loop too much
    const lastTriggerRef = useRef<string | null>(null)

    useEffect(() => {
        if (!isPlaying) return

        const activePlayer = activeDeck === 'A' ? deckA : deckB
        // Use a unique ID for the trigger (e.g. current track title or just current time check?)
        // trackA/B might be null.
        if (!activePlayer.isReady || activePlayer.duration === 0) return

        const remaining = activePlayer.duration - activePlayer.currentTime
        const threshold = 5 // START MIX 5 seconds before end

        // If we are in the zone
        if (remaining <= threshold && remaining > 0.5) {
            const trackId = activeDeck === 'A' ? trackA?.id : trackB?.id
            if (trackId && lastTriggerRef.current !== trackId) {
                console.log('[AutoMix] Triggering Next for track', trackId)
                lastTriggerRef.current = trackId
                next()
            }
        }
    }, [isPlaying, activeDeck, deckA.currentTime, deckA.duration, deckB.currentTime, deckB.duration, trackA, trackB, next])
    // Changed dependencies to be explicit functions + boolean state, rather than whole deck object
    // usage of deckA.isPlaying (boolean) is stable-ish (changes on play/pause).
    // deckA.play (function) is stable.


    // Sync Deck Metrics to Context (for UI)
    // Use refs to avoid effect re-running every frame when decks update
    const deckARef = useRef(deckA)
    const deckBRef = useRef(deckB)
    useEffect(() => {
        deckARef.current = deckA
        deckBRef.current = deckB
    }) // Update refs on every render

    useEffect(() => {
        let rAF = 0
        const syncLoop = () => {
            const dA = deckARef.current
            const dB = deckBRef.current

            if (activeDeck === 'A') {
                updateDeckMetrics('A', { currentTime: dA.currentTime, duration: dA.duration })
                updateDeckMetrics('B', { currentTime: dB.currentTime, duration: dB.duration })
            } else {
                updateDeckMetrics('B', { currentTime: dB.currentTime, duration: dB.duration })
                updateDeckMetrics('A', { currentTime: dA.currentTime, duration: dA.duration })
            }
            rAF = requestAnimationFrame(syncLoop)
        }
        syncLoop()
        return () => cancelAnimationFrame(rAF)
    }, [activeDeck, updateDeckMetrics]) // Stable dependencies only

    return null // Headless component
}
