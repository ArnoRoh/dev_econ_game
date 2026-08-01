/**
 * Owns the single shared AudioContext and its master gain. Every cue and the
 * ambient bed route through the master gain so volume and mute apply
 * uniformly. Persists to localStorage under the same `dev_econ_*` namespace
 * the rest of the game's local storage uses (see `src/saveGame.ts`).
 */

const VOLUME_KEY = 'dev_econ_audio_volume';
const MUTED_KEY = 'dev_econ_audio_muted';
const DEFAULT_VOLUME = 0.7;

function readStoredVolume(): number {
    try {
        const raw = localStorage.getItem(VOLUME_KEY);
        if (raw === null) return DEFAULT_VOLUME;
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : DEFAULT_VOLUME;
    } catch {
        return DEFAULT_VOLUME;
    }
}

function readStoredMuted(): boolean {
    try {
        return localStorage.getItem(MUTED_KEY) === '1';
    } catch {
        return false;
    }
}

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let volume = readStoredVolume();
let muted = readStoredMuted();

function applyGain(): void {
    if (!audioCtx || !masterGain) return;
    const target = muted ? 0 : volume;
    // A short ramp rather than a hard jump, so dragging the slider doesn't click.
    masterGain.gain.setTargetAtTime(target, audioCtx.currentTime, 0.01);
}

/**
 * Lazily creates the shared AudioContext. Browsers refuse to start audio
 * before a user gesture, so this must only ever be called from inside a
 * click handler — the title screen's Continue / New Republic buttons are
 * where the game calls it. Safe to call again later; it just resumes a
 * suspended context.
 */
export function initAudio(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!audioCtx) {
        const Ctor =
            window.AudioContext ??
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return null; // No Web Audio support: the game stays silent rather than throwing.

        audioCtx = new Ctor();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = muted ? 0 : volume;
        masterGain.connect(audioCtx.destination);
    }

    if (audioCtx.state === 'suspended') {
        void audioCtx.resume();
    }

    return audioCtx;
}

/** The shared context, or null if `initAudio` hasn't run yet (no gesture received). */
export function getAudioContext(): AudioContext | null {
    return audioCtx;
}

/** The shared master gain every cue and the ambient bed connect to. */
export function getMasterGain(): GainNode | null {
    return masterGain;
}

export function setVolume(next: number): void {
    volume = Math.min(1, Math.max(0, next));
    try {
        localStorage.setItem(VOLUME_KEY, String(volume));
    } catch {
        /* storage unavailable (e.g. private browsing); the setting still holds for this session */
    }
    applyGain();
}

export function getVolume(): number {
    return volume;
}

export function setMuted(next: boolean): void {
    muted = next;
    try {
        localStorage.setItem(MUTED_KEY, muted ? '1' : '0');
    } catch {
        /* storage unavailable; the setting still holds for this session */
    }
    applyGain();
}

export function isMuted(): boolean {
    return muted;
}
