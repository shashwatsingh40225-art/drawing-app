import { PP_DURATION_MS } from './ppModeConfig';
import { PP_AUDIO_TIMING, buildJingleSchedule } from './ppTimeline';

/**
 * Kept as a module-level variable rather than zustand state — AudioContext instances
 * aren't serializable/comparable state, and this is write-only side-channel audio.
 */
let ctx: AudioContext | null = null;
let stopTimer: ReturnType<typeof setTimeout> | null = null;

function getAudioContextClass(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

function scheduleHiss(context: AudioContext, masterGain: GainNode, startSec: number, endSec: number) {
  const duration = endSec - startSec;
  const sampleRate = context.sampleRate;
  const buffer = context.createBuffer(1, Math.max(1, Math.ceil(sampleRate * duration)), sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const noise = context.createBufferSource();
  noise.buffer = buffer;

  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1;
  filter.frequency.setValueAtTime(2500, context.currentTime + startSec);
  filter.frequency.linearRampToValueAtTime(6000, context.currentTime + endSec);

  const gain = context.createGain();
  gain.gain.setValueAtTime(0, context.currentTime + startSec);
  gain.gain.linearRampToValueAtTime(0.08, context.currentTime + startSec + duration * 0.4);
  gain.gain.linearRampToValueAtTime(0, context.currentTime + endSec);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  noise.start(context.currentTime + startSec);
  noise.stop(context.currentTime + endSec);
}

function scheduleChime(context: AudioContext, masterGain: GainNode, atSec: number) {
  for (const freq of [1318.5, 1975.5]) {
    const osc = context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.18, context.currentTime + atSec);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + atSec + 0.8);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(context.currentTime + atSec);
    osc.stop(context.currentTime + atSec + 0.8);
  }
}

function scheduleJingle(context: AudioContext, masterGain: GainNode, startSec: number, beatSec: number) {
  const notes = buildJingleSchedule(startSec, beatSec);
  const attack = 0.005;

  for (const { freq, start, duration } of notes) {
    const releaseStart = duration * 0.9;
    const t0 = context.currentTime + start;

    const square = context.createOscillator();
    square.type = 'square';
    square.frequency.value = freq;
    const squareGain = context.createGain();
    squareGain.gain.setValueAtTime(0, t0);
    squareGain.gain.linearRampToValueAtTime(0.16, t0 + attack);
    squareGain.gain.setValueAtTime(0.16, t0 + releaseStart);
    squareGain.gain.linearRampToValueAtTime(0, t0 + duration);
    square.connect(squareGain);
    squareGain.connect(masterGain);
    square.start(t0);
    square.stop(t0 + duration);

    const triangle = context.createOscillator();
    triangle.type = 'triangle';
    triangle.frequency.value = freq / 2;
    const triGain = context.createGain();
    triGain.gain.setValueAtTime(0, t0);
    triGain.gain.linearRampToValueAtTime(0.06, t0 + attack);
    triGain.gain.setValueAtTime(0.06, t0 + releaseStart);
    triGain.gain.linearRampToValueAtTime(0, t0 + duration);
    triangle.connect(triGain);
    triGain.connect(masterGain);
    triangle.start(t0);
    triangle.stop(t0 + duration);
  }
}

/** Must be called synchronously from the tap's own event handler so the browser allows audio. */
export function startPPAudio(reducedMotion: boolean): void {
  const AudioContextClass = getAudioContextClass();
  if (!AudioContextClass) return;

  try {
    const context = new AudioContextClass();
    ctx = context;
    context.resume().catch(() => {});

    const masterGain = context.createGain();
    masterGain.gain.value = 0.22;
    masterGain.connect(context.destination);

    if (reducedMotion) {
      scheduleChime(context, masterGain, PP_AUDIO_TIMING.RM_CHIME_SEC);
      scheduleJingle(context, masterGain, PP_AUDIO_TIMING.RM_START_SEC, PP_AUDIO_TIMING.RM_BEAT_SEC);
    } else {
      scheduleHiss(context, masterGain, PP_AUDIO_TIMING.NORMAL_HISS_START_SEC, PP_AUDIO_TIMING.NORMAL_HISS_END_SEC);
      scheduleChime(context, masterGain, PP_AUDIO_TIMING.NORMAL_CHIME_SEC);
      scheduleJingle(context, masterGain, PP_AUDIO_TIMING.NORMAL_START_SEC, PP_AUDIO_TIMING.NORMAL_BEAT_SEC);
    }

    if (stopTimer) clearTimeout(stopTimer);
    stopTimer = setTimeout(() => stopPPAudio(), PP_DURATION_MS);
  } catch {
    ctx = null;
  }
}

export function stopPPAudio(): void {
  if (stopTimer) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }
  if (ctx) {
    const current = ctx;
    ctx = null;
    current.close().catch(() => {});
  }
}
