/**
 * The game's procedural soundscape. Nothing here loads a file — every cue and
 * the ambient bed are synthesised from oscillators and noise buffers at
 * runtime. See `context.ts` for the AudioContext lifecycle, `cues.ts` for the
 * one-shot UI sounds, `ambient.ts` for the optional drone, and `synthUtils.ts`
 * for the shared envelope/noise/oscillator helpers they're built from.
 */
export { initAudio, setVolume, getVolume, setMuted, isMuted } from './context';
export { playCue } from './cues';
export type { CueName } from './cues';
export { startAmbient, stopAmbient, isAmbientPlaying } from './ambient';
