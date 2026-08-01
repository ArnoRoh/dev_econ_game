/**
 * An optional, very quiet filtered drone — the low hum of an office, not a
 * soundtrack. Off by default; a caller opts in with `startAmbient()`.
 */
import { getAudioContext, getMasterGain } from './context';

interface AmbientVoice {
    gain: GainNode;
    filter: BiquadFilterNode;
    oscillators: OscillatorNode[];
    lfo: OscillatorNode;
    lfoGain: GainNode;
}

let ambient: AmbientVoice | null = null;

/** Fades in the ambient bed. Safe to call repeatedly; a second call while it's already playing is a no-op. */
export function startAmbient(): void {
    const ctx = getAudioContext();
    const master = getMasterGain();
    if (!ctx || !master || ambient) return;

    const t0 = ctx.currentTime;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 340;
    filter.Q.value = 0.7;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.045, t0 + 3); // a slow fade-in befits a bed, not a cue

    filter.connect(gain);
    gain.connect(master);

    const layers: Array<{ type: OscillatorType; frequency: number; mix: number }> = [
        { type: 'sine', frequency: 55, mix: 0.5 },
        { type: 'sine', frequency: 55.6, mix: 0.5 }, // a hair detuned against the first, so it slowly beats rather than sitting dead static
        { type: 'triangle', frequency: 110.3, mix: 0.22 },
    ];

    const oscillators = layers.map(layer => {
        const osc = ctx.createOscillator();
        osc.type = layer.type;
        osc.frequency.value = layer.frequency;

        const mix = ctx.createGain();
        mix.gain.value = layer.mix;

        osc.connect(mix);
        mix.connect(filter);
        osc.start(t0);
        return osc;
    });

    // A very slow LFO breathing the filter cutoff, so the drone has a pulse instead of sitting flat.
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 40;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start(t0);

    ambient = { gain, filter, oscillators, lfo, lfoGain };
}

/** Fades the ambient bed out and tears it down. Safe to call when nothing is playing. */
export function stopAmbient(): void {
    const ctx = getAudioContext();
    if (!ctx || !ambient) return;

    const { gain, filter, oscillators, lfo, lfoGain } = ambient;
    const t0 = ctx.currentTime;

    gain.gain.cancelScheduledValues(t0);
    gain.gain.setValueAtTime(gain.gain.value, t0);
    gain.gain.linearRampToValueAtTime(0, t0 + 1.5);

    const stopTime = t0 + 1.6;
    [...oscillators, lfo].forEach(osc => osc.stop(stopTime));

    window.setTimeout(() => {
        oscillators.forEach(osc => osc.disconnect());
        lfo.disconnect();
        lfoGain.disconnect();
        filter.disconnect();
        gain.disconnect();
    }, 1700);

    ambient = null;
}

export function isAmbientPlaying(): boolean {
    return ambient !== null;
}
