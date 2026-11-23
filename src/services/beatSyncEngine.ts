import type { TrackAudioProfile } from '../types/player';

export interface BeatSyncFrame {
  /** Live reactive energy (0..100) for each of the 5 EQ bands: 60Hz, 250Hz, 1KHz, 4KHz, 16KHz */
  bandLevels: [number, number, number, number, number];
  /** Smooth decaying peak-hold markers (0..100) per band */
  bandPeaks: [number, number, number, number, number];
  /** 12-segment Stereo VU levels (0..12) */
  vuLeft: number;
  vuRight: number;
  /** 12-segment Stereo VU peak hold (0..12) */
  vuPeakLeft: number;
  vuPeakRight: number;
  /** Active beat in 4-beat bar (0, 1, 2, 3), or -1 when paused */
  activeBeat: number;
  /** True on transient beat hit (drives crisp pulse lamp) */
  isBeatHit: boolean;
  /** Current effective BPM (studio BPM, tap BPM, or live FFT-detected BPM) */
  effectiveBpm: number;
  /** Whether real Web Audio AnalyserNode FFT capture is active */
  isLiveAudioLocked: boolean;
}

export const DEFAULT_AUDIO_PROFILE: TrackAudioProfile = {
  bpm: 118,
  gainDb: -8,
  energy: 0.72,
  bassWeight: 0.8,
  vocalWeight: 0.74,
  trebleWeight: 0.68,
  groove: 'backbeat',
  source: 'estimated',
};

/**
 * Computes a deterministic, beat-phase-locked 5-band spectrum + stereo VU frame
 * directly from the interpolated song playback timestamp and studio BPM profile.
 */
export function computePhaseLockedBeatFrame(params: {
  smoothTimeSec: number;
  durationSec: number;
  isPlaying: boolean;
  volume: number;
  eqBands: [number, number, number, number, number];
  profile: TrackAudioProfile;
  beatOffsetSec: number;
  prevBands: [number, number, number, number, number];
  prevPeaks: [number, number, number, number, number];
  prevVuPeakL: number;
  prevVuPeakR: number;
}): BeatSyncFrame {
  const {
    smoothTimeSec,
    durationSec,
    isPlaying,
    volume,
    eqBands,
    profile,
    beatOffsetSec,
    prevBands,
    prevPeaks,
    prevVuPeakL,
    prevVuPeakR,
  } = params;

  const bpm = Math.max(60, Math.min(195, profile.bpm || 118));

  if (!isPlaying) {
    const decayedBands = prevBands.map((v) => Math.max(0, v * 0.82)) as [
      number,
      number,
      number,
      number,
      number,
    ];
    const decayedPeaks = prevPeaks.map((v) => Math.max(0, v - 2.2)) as [
      number,
      number,
      number,
      number,
      number,
    ];
    return {
      bandLevels: decayedBands,
      bandPeaks: decayedPeaks,
      vuLeft: Math.round((decayedBands[0] / 100) * 4),
      vuRight: Math.round((decayedBands[2] / 100) * 4),
      vuPeakLeft: Math.max(0, prevVuPeakL - 0.35),
      vuPeakRight: Math.max(0, prevVuPeakR - 0.35),
      activeBeat: -1,
      isBeatHit: false,
      effectiveBpm: Math.round(bpm),
      isLiveAudioLocked: false,
    };
  }

  const volScale = Math.max(0.18, Math.min(1.1, (volume / 100) * 0.92 + 0.14));
  const songPos = Math.max(0, smoothTimeSec - beatOffsetSec);
  const beatsPerSec = bpm / 60;
  const totalBeats = songPos * beatsPerSec;
  const beatIndex = Math.floor(totalBeats);
  const beatFrac = totalBeats - beatIndex; // 0..1 within current quarter-note beat
  const barBeat = ((beatIndex % 4) + 4) % 4; // 0, 1, 2, 3
  const eighthFrac = (totalBeats * 2) % 1;
  const sixteenthFrac = (totalBeats * 4) % 1;

  // Natural musical section dynamics along song timeline (intro -> verse -> chorus -> bridge -> outro)
  const progress = durationSec > 20 ? Math.max(0, Math.min(1, smoothTimeSec / durationSec)) : 0.45;
  let sectionLift = 0.88;
  if (progress < 0.06) {
    // Intro ramp
    sectionLift = 0.56 + (progress / 0.06) * 0.3;
  } else if (progress > 0.91) {
    // Outro taper
    sectionLift = 0.58 + ((1 - progress) / 0.09) * 0.32;
  } else if ((progress >= 0.24 && progress <= 0.44) || (progress >= 0.62 && progress <= 0.86)) {
    // Chorus / Drop lift
    sectionLift = 1.06;
  } else if (progress > 0.48 && progress < 0.58) {
    // Bridge breathe
    sectionLift = 0.8;
  }

  const energy = Math.max(0.4, Math.min(1.05, profile.energy * sectionLift));

  // Groove-specific kick, snare, bassline, vocal, and hi-hat transient envelopes
  let kickStrength = 0;
  let snareStrength = 0;

  if (profile.groove === 'four-on-floor') {
    // Punchy kick on every beat (0, 1, 2, 3), clap on 1 & 3
    kickStrength = barBeat === 0 ? 1.0 : 0.88;
    snareStrength = barBeat === 1 || barBeat === 3 ? 0.94 : 0.18;
  } else if (profile.groove === 'half-time') {
    // Deep sub hit on beat 0 (+ syncopated 2.5), heavy snare on beat 2
    kickStrength = barBeat === 0 ? 1.0 : barBeat === 2 && beatFrac > 0.5 ? 0.68 : 0.25;
    snareStrength = barBeat === 2 ? 0.96 : 0.14;
  } else if (profile.groove === 'ballad') {
    // Gentle swell on beat 0 & 2, soft snare/rim on beat 2 or 3
    kickStrength = barBeat === 0 ? 0.82 : barBeat === 2 ? 0.58 : 0.22;
    snareStrength = barBeat === 3 ? 0.65 : barBeat === 1 ? 0.45 : 0.15;
  } else {
    // Standard pop/rock/indie backbeat: kick on 0 & 2, snare on 1 & 3
    kickStrength = barBeat === 0 ? 1.0 : barBeat === 2 ? 0.86 : 0.22;
    snareStrength = barBeat === 1 || barBeat === 3 ? 0.94 : 0.16;
  }

  // Sharp percussive decay envelopes locked strictly to beat phase
  const kickEnv = kickStrength * Math.exp(-beatFrac * 6.8);
  const snareEnv = snareStrength * Math.exp(-beatFrac * 8.2);
  const eighthHat = Math.exp(-eighthFrac * 9.5);
  const sixteenthShimmer = Math.exp(-sixteenthFrac * 10.5);

  // Melodic/vocal phrase contour synced to 4-bar / 8-bar musical phrasing
  const phraseWave = 0.5 + 0.5 * Math.sin(totalBeats * Math.PI * 0.5 + 0.6);
  const vocalCadence = 0.5 + 0.5 * Math.sin(totalBeats * Math.PI * 1.0 + Math.cos(totalBeats * 0.25));
  const bassGroove = 0.38 + 0.62 * Math.exp(-((totalBeats * 2) % 1) * 4.2);

  // Raw band targets (0..100) BEFORE user EQ fader scaling
  const raw60 = (20 + 78 * kickEnv + 16 * bassGroove) * profile.bassWeight * energy;
  const raw250 = (22 + 46 * kickEnv + 44 * snareEnv + 22 * bassGroove) * ((profile.bassWeight + profile.vocalWeight) * 0.5) * energy;
  const raw1k = (24 + 48 * snareEnv + 34 * vocalCadence + 14 * phraseWave) * profile.vocalWeight * energy;
  const raw4k = (18 + 44 * snareEnv + 28 * eighthHat + 24 * vocalCadence) * ((profile.vocalWeight + profile.trebleWeight) * 0.5) * energy;
  const raw16k = (14 + 46 * eighthHat + 28 * sixteenthShimmer + 18 * snareEnv) * profile.trebleWeight * energy;

  const rawTargets = [raw60, raw250, raw1k, raw4k, raw16k];

  // Apply user's 5-band EQ fader curve + smooth attack/release ballistics
  const nextBands = rawTargets.map((raw, i) => {
    const eqGain = 0.45 + (eqBands[i] / 100) * 0.78;
    const target = Math.max(4, Math.min(100, raw * eqGain * volScale));
    const prev = prevBands[i] || 0;
    // Fast attack on beat transients, snappy musical release
    const alpha = target > prev ? 0.62 : 0.24;
    return prev + (target - prev) * alpha;
  }) as [number, number, number, number, number];

  // Peak hold with crisp gravity decay
  const nextPeaks = nextBands.map((val, i) => {
    const prevPeak = prevPeaks[i] || 0;
    return val >= prevPeak ? val : Math.max(val, prevPeak - 0.85);
  }) as [number, number, number, number, number];

  // Stereo VU meters (Left weighted slightly toward sub/low-mid kick, Right toward snare/vocal/air)
  const rawVuL = ((nextBands[0] * 0.45 + nextBands[1] * 0.35 + nextBands[2] * 0.2) / 100) * 12.6;
  const rawVuR = ((nextBands[1] * 0.2 + nextBands[2] * 0.4 + nextBands[3] * 0.25 + nextBands[4] * 0.15) / 100) * 12.6;

  const vuLeft = Math.max(1, Math.min(12, Math.round(rawVuL)));
  const vuRight = Math.max(1, Math.min(12, Math.round(rawVuR)));
  const vuPeakLeft = vuLeft >= prevVuPeakL ? vuLeft : Math.max(vuLeft, prevVuPeakL - 0.14);
  const vuPeakRight = vuRight >= prevVuPeakR ? vuRight : Math.max(vuRight, prevVuPeakR - 0.14);

  const isBeatHit = beatFrac < 0.18 && (kickStrength >= 0.75 || snareStrength >= 0.75);

  return {
    bandLevels: nextBands,
    bandPeaks: nextPeaks,
    vuLeft,
    vuRight,
    vuPeakLeft,
    vuPeakRight,
    activeBeat: barBeat,
    isBeatHit,
    effectiveBpm: Math.round(bpm),
    isLiveAudioLocked: false,
  };
}

/**
 * Real-Time Web Audio FFT Beat & 5-Band Spectrum Analyzer.
 * Captures live tab audio (via getDisplayMedia) or microphone audio (fallback)
 * to drive exact sample-accurate equalizer movement and bass-onset beat detection.
 */
export class LiveAudioBeatAnalyzer {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private freqData: Uint8Array<ArrayBuffer> | null = null;

  // Spectral-flux bass onset beat detector state
  private bassHistory: number[] = [];
  private lastBeatMs = 0;
  private beatIntervals: number[] = [];
  private beatCounter = 0;
  private detectedBpm = 0;
  private mode: 'tab' | 'mic' | null = null;

  public isActive(): boolean {
    return Boolean(this.analyser && this.stream && this.stream.getAudioTracks().some((t) => t.readyState === 'live'));
  }

  public getMode(): 'tab' | 'mic' | null {
    return this.isActive() ? this.mode : null;
  }

  public async start(preferTabAudio = true): Promise<{ ok: boolean; mode?: 'tab' | 'mic'; error?: string }> {
    this.stop();

    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      return { ok: false, error: 'Live audio capture is unavailable in this browser.' };
    }

    let capturedStream: MediaStream | null = null;
    let mode: 'tab' | 'mic' = 'tab';

    if (preferTabAudio && typeof navigator.mediaDevices.getDisplayMedia === 'function') {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          } as MediaTrackConstraints,
          video: true,
        });
        // Immediately stop the video track so only clean tab audio remains active
        displayStream.getVideoTracks().forEach((vt) => vt.stop());

        if (displayStream.getAudioTracks().length > 0) {
          capturedStream = displayStream;
          mode = 'tab';
        } else {
          displayStream.getTracks().forEach((t) => t.stop());
        }
      } catch {
        // User cancelled tab picker or browser blocked display audio — fall back to mic if desired
      }
    }

    if (!capturedStream && typeof navigator.mediaDevices.getUserMedia === 'function') {
      try {
        capturedStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
        mode = 'mic';
      } catch {
        return { ok: false, error: 'Audio capture permission was cancelled.' };
      }
    }

    if (!capturedStream || capturedStream.getAudioTracks().length === 0) {
      return { ok: false, error: 'No audio track was shared. Tick "Share tab audio" in the prompt.' };
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new AudioCtx();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      const source = ctx.createMediaStreamSource(capturedStream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.66;
      source.connect(analyser);

      // Auto-cleanup if the user clicks "Stop sharing" in the browser chrome
      capturedStream.getAudioTracks().forEach((track) => {
        track.onended = () => this.stop();
      });

      this.audioCtx = ctx;
      this.analyser = analyser;
      this.sourceNode = source;
      this.stream = capturedStream;
      this.freqData = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
      this.bassHistory = [];
      this.beatIntervals = [];
      this.beatCounter = 0;
      this.detectedBpm = 0;
      this.mode = mode;

      return { ok: true, mode };
    } catch {
      capturedStream.getTracks().forEach((t) => t.stop());
      return { ok: false, error: 'Failed to initialize real-time audio analyzer.' };
    }
  }

  public stop(): void {
    try {
      this.sourceNode?.disconnect();
    } catch {}
    try {
      this.stream?.getTracks().forEach((t) => t.stop());
    } catch {}
    try {
      if (this.audioCtx && this.audioCtx.state !== 'closed') {
        this.audioCtx.close().catch(() => {});
      }
    } catch {}
    this.audioCtx = null;
    this.analyser = null;
    this.sourceNode = null;
    this.stream = null;
    this.freqData = null;
    this.mode = null;
  }

  public sampleFrame(params: {
    eqBands: [number, number, number, number, number];
    fallbackBpm: number;
    prevBands: [number, number, number, number, number];
    prevPeaks: [number, number, number, number, number];
    prevVuPeakL: number;
    prevVuPeakR: number;
  }): BeatSyncFrame | null {
    if (!this.isActive() || !this.analyser || !this.freqData || !this.audioCtx) {
      return null;
    }

    this.analyser.getByteFrequencyData(this.freqData);
    const sampleRate = this.audioCtx.sampleRate || 48000;
    const binHz = sampleRate / this.analyser.fftSize;
    const maxBin = this.freqData.length - 1;

    const avgRange = (lowHz: number, highHz: number): number => {
      const start = Math.max(0, Math.floor(lowHz / binHz));
      const end = Math.min(maxBin, Math.max(start, Math.ceil(highHz / binHz)));
      let sum = 0;
      let peak = 0;
      for (let i = start; i <= end; i++) {
        const v = this.freqData![i];
        sum += v;
        if (v > peak) peak = v;
      }
      const mean = sum / Math.max(1, end - start + 1);
      // Blend RMS mean with local bin peak for punchy musical response
      return ((mean * 0.65 + peak * 0.35) / 255) * 100;
    };

    const rawBands: [number, number, number, number, number] = [
      avgRange(25, 115),     // 60Hz Sub-bass / Kick
      avgRange(115, 480),    // 250Hz Bass / Warmth
      avgRange(480, 2000),   // 1KHz Vocals / Snare
      avgRange(2000, 7500),  // 4KHz Presence / Clarity
      avgRange(7500, 18000), // 16KHz Hi-hats / Air
    ];

    const nextBands = rawBands.map((raw, i) => {
      const eqGain = 0.55 + (params.eqBands[i] / 100) * 0.72;
      const boost = i === 4 ? 1.38 : i === 3 ? 1.18 : 1.05;
      const target = Math.max(0, Math.min(100, raw * eqGain * boost));
      const prev = params.prevBands[i] || 0;
      const alpha = target > prev ? 0.75 : 0.32;
      return prev + (target - prev) * alpha;
    }) as [number, number, number, number, number];

    const nextPeaks = nextBands.map((val, i) => {
      const prevPeak = params.prevPeaks[i] || 0;
      return val >= prevPeak ? val : Math.max(val, prevPeak - 0.9);
    }) as [number, number, number, number, number];

    // Real-time Bass Onset Detection (Kick / Downbeat Detector)
    const bassEnergy = rawBands[0] * 0.72 + rawBands[1] * 0.28;
    this.bassHistory.push(bassEnergy);
    if (this.bassHistory.length > 42) this.bassHistory.shift();

    const avgBass =
      this.bassHistory.reduce((acc, v) => acc + v, 0) / Math.max(1, this.bassHistory.length);
    const now = performance.now();
    let isBeatHit = false;

    if (bassEnergy > 22 && bassEnergy > avgBass * 1.28 && now - this.lastBeatMs > 230) {
      isBeatHit = true;
      const interval = now - this.lastBeatMs;
      if (this.lastBeatMs > 0 && interval >= 280 && interval <= 1150) {
        this.beatIntervals.push(interval);
        if (this.beatIntervals.length > 10) this.beatIntervals.shift();
        const avgInt =
          this.beatIntervals.reduce((a, b) => a + b, 0) / this.beatIntervals.length;
        const instantBpm = 60000 / avgInt;
        if (instantBpm >= 62 && instantBpm <= 190) {
          this.detectedBpm = Math.round(instantBpm);
        }
      }
      this.lastBeatMs = now;
      this.beatCounter = (this.beatCounter + 1) % 4;
    } else if (now - this.lastBeatMs < 110) {
      isBeatHit = true;
    }

    const vuLeft = Math.max(
      0,
      Math.min(12, Math.round(((nextBands[0] * 0.45 + nextBands[1] * 0.35 + nextBands[2] * 0.2) / 100) * 12.5))
    );
    const vuRight = Math.max(
      0,
      Math.min(12, Math.round(((nextBands[1] * 0.2 + nextBands[2] * 0.4 + nextBands[3] * 0.25 + nextBands[4] * 0.15) / 100) * 12.5))
    );

    const vuPeakLeft = vuLeft >= params.prevVuPeakL ? vuLeft : Math.max(vuLeft, params.prevVuPeakL - 0.16);
    const vuPeakRight = vuRight >= params.prevVuPeakR ? vuRight : Math.max(vuRight, params.prevVuPeakR - 0.16);

    return {
      bandLevels: nextBands,
      bandPeaks: nextPeaks,
      vuLeft,
      vuRight,
      vuPeakLeft,
      vuPeakRight,
      activeBeat: bassEnergy > 5 || vuLeft > 1 ? this.beatCounter : -1,
      isBeatHit,
      effectiveBpm: this.detectedBpm || Math.round(params.fallbackBpm || 118),
      isLiveAudioLocked: true,
    };
  }
}
