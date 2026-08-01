/**
 * One-shot UI cues. Every cue is synthesised on the fly — short oscillator
 * voices and filtered noise transients through the shared master gain — and
 * finishes in well under a second. The palette this is chasing is a quiet
 * ministry office in 1962: wood, paper, rubber stamps, a low bell. Nothing
 * shrill, nothing arcade.
 */
import { getAudioContext, getMasterGain } from './context';
import { createNoiseBuffer, layeredOscillators, noiseBurst, scheduleEnvelope, stopVoice } from './synthUtils';

export type CueName = 'select' | 'confirm' | 'page' | 'invest' | 'chime' | 'warn' | 'year';

/** A soft wooden click — picking a proposal up off the table. */
function playSelect(ctx: AudioContext, destination: AudioNode): void {
    const t0 = ctx.currentTime;

    noiseBurst(ctx, destination, {
        startTime: t0,
        duration: 0.05,
        filterType: 'bandpass',
        frequency: 2200,
        q: 2.4,
        peak: 0.32,
        attack: 0.001,
        decay: 0.045,
    });

    // A faint body under the click, an octave down, so it reads as wood rather than glass.
    noiseBurst(ctx, destination, {
        startTime: t0,
        duration: 0.07,
        filterType: 'bandpass',
        frequency: 950,
        q: 3,
        peak: 0.13,
        attack: 0.001,
        decay: 0.06,
    });
}

/** A rubber-stamp thud — the moment an action is actually spent. */
function playConfirm(ctx: AudioContext, destination: AudioNode): void {
    const t0 = ctx.currentTime;

    // The strike: a short, hard transient standing in for stamp meeting paper.
    noiseBurst(ctx, destination, {
        startTime: t0,
        duration: 0.03,
        filterType: 'lowpass',
        frequency: 1300,
        q: 0.7,
        peak: 0.48,
        attack: 0.001,
        decay: 0.025,
    });

    // The body: a low, detuned thump that gives the stamp its weight.
    const voice = layeredOscillators(
        ctx,
        destination,
        [
            { type: 'sine', frequency: 92, gain: 1 },
            { type: 'triangle', frequency: 92 * 1.008, detune: 4, gain: 0.6 },
            { type: 'sine', frequency: 46, gain: 0.5 }, // an octave down, felt more than heard
        ],
        t0,
    );
    const end = scheduleEnvelope(voice.gain.gain, t0, {
        attack: 0.004,
        decay: 0.11,
        sustainLevel: 0.25,
        sustainTime: 0.02,
        release: 0.16,
        peak: 0.85,
    });
    stopVoice(ctx, voice, end);

    // A soft, low-passed settling of paper under the stamp.
    noiseBurst(ctx, destination, {
        startTime: t0 + 0.01,
        duration: 0.12,
        filterType: 'lowpass',
        frequency: 500,
        q: 0.5,
        peak: 0.12,
        attack: 0.01,
        decay: 0.11,
    });
}

/** A paper turn, for the newspaper landing on the desk. */
function playPage(ctx: AudioContext, destination: AudioNode): void {
    const t0 = ctx.currentTime;
    const duration = 0.36;

    const source = ctx.createBufferSource();
    source.buffer = createNoiseBuffer(ctx, duration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.8;
    filter.frequency.setValueAtTime(4200, t0);
    filter.frequency.exponentialRampToValueAtTime(1100, t0 + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.2, t0 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.09, t0 + duration * 0.55);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    const stopTime = t0 + duration + 0.02;
    source.start(t0);
    source.stop(stopTime);
    source.onended = () => {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
    };

    // A second, quieter sweep slightly offset gives the rustle texture instead of one flat swoosh.
    noiseBurst(ctx, destination, {
        startTime: t0 + 0.05,
        duration: 0.2,
        filterType: 'highpass',
        frequency: 2600,
        q: 0.6,
        peak: 0.07,
        attack: 0.02,
        decay: 0.18,
    });
}

/** A low construction thump — a province taking on investment. */
function playInvest(ctx: AudioContext, destination: AudioNode): void {
    const t0 = ctx.currentTime;

    const voice = layeredOscillators(
        ctx,
        destination,
        [
            { type: 'sine', frequency: 64, gain: 1 },
            { type: 'sine', frequency: 64 * 1.015, detune: -6, gain: 0.55 },
            { type: 'triangle', frequency: 32, gain: 0.4 }, // sub octave, the ground shifting
        ],
        t0,
    );
    const end = scheduleEnvelope(voice.gain.gain, t0, {
        attack: 0.012,
        decay: 0.16,
        sustainLevel: 0.3,
        sustainTime: 0.03,
        release: 0.26,
        peak: 0.75,
    });
    stopVoice(ctx, voice, end);

    noiseBurst(ctx, destination, {
        startTime: t0,
        duration: 0.09,
        filterType: 'lowpass',
        frequency: 350,
        q: 0.6,
        peak: 0.18,
        attack: 0.004,
        decay: 0.08,
    });
}

/** A warm, understated bell — an achievement earned. Deliberately not bright. */
function playChime(ctx: AudioContext, destination: AudioNode): void {
    const t0 = ctx.currentTime;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 3200;
    filter.Q.value = 0.4;
    filter.connect(destination);

    const voice = layeredOscillators(
        ctx,
        filter,
        [
            { type: 'sine', frequency: 392, gain: 1 }, // G4, the root
            { type: 'sine', frequency: 392 * 1.5, detune: 3, gain: 0.5 }, // the fifth above
            { type: 'triangle', frequency: 392 * 2, detune: -4, gain: 0.24 }, // octave, softened
        ],
        t0,
    );
    const end = scheduleEnvelope(voice.gain.gain, t0, {
        attack: 0.005,
        decay: 0.1,
        sustainLevel: 0.4,
        sustainTime: 0.06,
        release: 0.35,
        peak: 0.5,
    });
    stopVoice(ctx, voice, end, [filter]);
}

/** Something bad landed — a low, unresolved knock rather than an alarm. */
function playWarn(ctx: AudioContext, destination: AudioNode): void {
    const t0 = ctx.currentTime;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.Q.value = 0.6;
    filter.connect(destination);

    const voice = layeredOscillators(
        ctx,
        filter,
        [
            { type: 'sawtooth', frequency: 98, gain: 0.7 },
            { type: 'sawtooth', frequency: 98 * 1.06, detune: -8, gain: 0.55 }, // a hair sharp — deliberately unresolved
            { type: 'sine', frequency: 49, gain: 0.5 },
        ],
        t0,
    );
    const end = scheduleEnvelope(voice.gain.gain, t0, {
        attack: 0.006,
        decay: 0.1,
        sustainLevel: 0.35,
        sustainTime: 0.05,
        release: 0.2,
        peak: 0.65,
    });
    stopVoice(ctx, voice, end, [filter]);

    noiseBurst(ctx, destination, {
        startTime: t0,
        duration: 0.04,
        filterType: 'lowpass',
        frequency: 700,
        q: 0.5,
        peak: 0.22,
        attack: 0.001,
        decay: 0.035,
    });
}

/** A low bell tolling the new year — the most consequential cue, held right up to the budget. */
function playYear(ctx: AudioContext, destination: AudioNode): void {
    const t0 = ctx.currentTime;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2200;
    filter.Q.value = 0.3;
    filter.connect(destination);

    const fundamental = 130.8; // C3 — an institutional toll, not a chime
    const voice = layeredOscillators(
        ctx,
        filter,
        [
            { type: 'sine', frequency: fundamental, gain: 1 },
            { type: 'sine', frequency: fundamental * 2.4, detune: 3, gain: 0.26 }, // inharmonic partial, a bell's character
            { type: 'sine', frequency: fundamental * 3.9, detune: -5, gain: 0.13 },
            { type: 'triangle', frequency: fundamental / 2, gain: 0.32 }, // felt as much as heard
        ],
        t0,
    );
    const end = scheduleEnvelope(voice.gain.gain, t0, {
        attack: 0.008,
        decay: 0.14,
        sustainLevel: 0.3,
        sustainTime: 0.05,
        release: 0.39,
        peak: 0.7,
    });
    stopVoice(ctx, voice, end, [filter]);
}

const CUES: Record<CueName, (ctx: AudioContext, destination: AudioNode) => void> = {
    select: playSelect,
    confirm: playConfirm,
    page: playPage,
    invest: playInvest,
    chime: playChime,
    warn: playWarn,
    year: playYear,
};

/**
 * Plays a one-shot UI cue. A no-op (never throws) if `initAudio` hasn't run
 * yet — the game should never crash a turn over a browser withholding audio
 * before a gesture.
 */
export function playCue(name: CueName): void {
    const ctx = getAudioContext();
    const destination = getMasterGain();
    if (!ctx || !destination) return;
    CUES[name](ctx, destination);
}
