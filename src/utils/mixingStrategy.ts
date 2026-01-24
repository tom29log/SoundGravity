import { Project } from '@/types'

export type MixingStrategy = 'STEM_TO_STEM' | 'STEREO_TO_STEREO' | 'HYBRID'

export function selectMixingStrategy(currentTrack: Project | null, nextTrack: Project | null): MixingStrategy {
    if (!currentTrack || !nextTrack) return 'STEREO_TO_STEREO'

    const currentHasStems = currentTrack.stems && Object.keys(currentTrack.stems).length > 0
    const nextHasStems = nextTrack.stems && Object.keys(nextTrack.stems).length > 0

    if (currentHasStems && nextHasStems) {
        return 'STEM_TO_STEM'
    } else if (!currentHasStems && !nextHasStems) {
        return 'STEREO_TO_STEREO'
    } else {
        return 'HYBRID'
    }
}

export function calculatePlaybackRate(masterBpm: number, trackBpm: number | undefined): number {
    if (!trackBpm || trackBpm === 0) return 1
    // Range protection: limit to +/- 50%
    const rate = masterBpm / trackBpm
    if (rate < 0.5 || rate > 1.5) return 1
    return rate
}
