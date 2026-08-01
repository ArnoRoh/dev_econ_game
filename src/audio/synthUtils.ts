/**
 * Small, dependency-free building blocks for the cue and ambient synths. Every
 * sound in this game is generated at runtime from oscillators and noise
 * buffers — there are no audio assets to load, and nothing here should ever
 * need one.
 */

/** A short buffer of white noise, the raw material for paper rustles and stamp transients. */
export function createNoiseBuffer(ctx: AudioContext, durationSeconds: number): AudioBuffer {
    const length = Math.max(1, Math.round(ctx.sampleRate * durationSeconds));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
}

export interface NoiseBurstOptions {
    /** When the burst begins, in `ctx.currentTime` seconds. */
    startTime: number;
    /** Length of the underlying noise buffer, in seconds. */
    duration: number;
    filterType: BiquadFilterType;
    frequency: number;
    q?: number;
    /** Peak linear gain (0..1-ish; cues stay well under 1 so layers can stack). */
    peak: number;
    /** Rise time to peak, in seconds. */
    attack?: number;
    /** Fall time from peak back to silence, in seconds. Defaults to filling the buffer. */
    decay?: number;
}

/**
 * A single filtered burst of noise: a wooden click, a stamp's impact, a page's
 * rustle. Self-contained — it tears itself down once the sound has finished.
 */
export function noiseBurst(ctx: AudioContext, destination: AudioNode, options: NoiseBurstOptions): void {
    const { startTime, duration, filterType, frequency, q = 1, peak, attack = 0.002 } = options;
    const decay = options.decay ?? Math.max(0.01, duration - attack);

    const source = ctx.createBufferSource();
    source.buffer = createNoiseBuffer(ctx, duration);

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = frequency;
    filter.Q.value = q;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), startTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + attack + decay);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    const stopTime = startTime + attack + decay + 0.05;
    source.start(startTime);
    source.stop(stopTime);
    source.onended = () => {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
    };
}

export interface EnvelopeStages {
    /** Rise time to peak, in seconds. */
    attack: number;
    /** Fall time from peak to the sustain level, in seconds. */
    decay: number;
    /** Sustain level as a fraction of peak (0..1). */
    sustainLevel: number;
    /** How long to hold at the sustain level, in seconds. */
    sustainTime: number;
    /** Fall time from sustain back to silence, in seconds. */
    release: number;
    /** Peak linear gain. */
    peak: number;
}

/** Schedules a standard attack/decay/sustain/release envelope onto a gain param. Returns the time it finishes. */
export function scheduleEnvelope(param: AudioParam, t0: number, stages: EnvelopeStages): number {
    const { attack, decay, sustainLevel, sustainTime, release, peak } = stages;
    const sustainPeak = Math.max(peak * sustainLevel, 0.0001);

    param.cancelScheduledValues(t0);
    param.setValueAtTime(0.0001, t0);
    param.exponentialRampToValueAtTime(Math.max(peak, 0.0001), t0 + attack);
    param.exponentialRampToValueAtTime(sustainPeak, t0 + attack + decay);
    param.setValueAtTime(sustainPeak, t0 + attack + decay + sustainTime);
    param.exponentialRampToValueAtTime(0.0001, t0 + attack + decay + sustainTime + release);

    return t0 + attack + decay + sustainTime + release;
}

export interface OscillatorLayer {
    type: OscillatorType;
    /** Frequency in Hz. */
    frequency: number;
    /** Detune in cents, layered on top of `frequency`. */
    detune?: number;
    /** This layer's mix level relative to the others (not a final gain). */
    gain?: number;
}

export interface LayeredVoice {
    /** The shared envelope gain every layer feeds into. */
    gain: GainNode;
    oscillators: OscillatorNode[];
}

/**
 * A small stack of slightly detuned oscillators sharing one envelope gain —
 * the layering that keeps a tone from reading as a bare, single-frequency
 * beep. Each oscillator starts immediately at `t0`; pair with
 * `scheduleEnvelope` on the returned gain and `stopVoice` to finish it.
 */
export function layeredOscillators(
    ctx: AudioContext,
    destination: AudioNode,
    layers: OscillatorLayer[],
    t0: number,
): LayeredVoice {
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    gain.connect(destination);

    const oscillators = layers.map(layer => {
        const osc = ctx.createOscillator();
        osc.type = layer.type;
        osc.frequency.value = layer.frequency;
        osc.detune.value = layer.detune ?? 0;

        const mix = ctx.createGain();
        mix.gain.value = layer.gain ?? 1;

        osc.connect(mix);
        mix.connect(gain);
        osc.start(t0);
        osc.onended = () => {
            osc.disconnect();
            mix.disconnect();
        };

        return osc;
    });

    return { gain, oscillators };
}

/**
 * Stops every oscillator in a voice at `stopTime` and, shortly after, drops
 * its shared gain (and any extra shaping nodes, e.g. a filter) from the
 * graph. The individual oscillators disconnect themselves on `ended`.
 */
export function stopVoice(
    ctx: AudioContext,
    voice: LayeredVoice,
    stopTime: number,
    extraNodes: AudioNode[] = [],
): void {
    voice.oscillators.forEach(osc => osc.stop(stopTime));

    const delayMs = Math.max(0, (stopTime - ctx.currentTime + 0.1) * 1000);
    window.setTimeout(() => {
        voice.gain.disconnect();
        extraNodes.forEach(node => node.disconnect());
    }, delayMs);
}
