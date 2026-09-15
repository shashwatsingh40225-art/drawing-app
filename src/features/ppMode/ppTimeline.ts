import { PP_DURATION_MS } from './ppModeConfig';

/**
 * Pure timeline data for the PP Mode run. No DOM/browser APIs here — this file
 * is unit-tested directly in Node (scripts/tests/ppTimeline.test.mjs).
 */

// ---- Normal variant phase constants (ms from tap) ----------------------

export const PP_PHASES = {
  EYE_PRESS_START: 0,
  EYE_PRESS_END: 250,

  BACKDROP_START: 0,
  BACKDROP_END: 2000,

  SNAKE_SWARM_START: 0,
  SNAKE_SWARM_END: 2400,
  SNAKE_START_DELAY_MIN: 0,
  SNAKE_START_DELAY_MAX: 900,
  SNAKE_TRAVEL_DUR_MIN: 1500,
  SNAKE_TRAVEL_DUR_MAX: 2300,

  SNAKE_FLING_START: 2400,
  SNAKE_FLING_END: 3000,

  SWARM_DONE: 3200,

  LIGHT_CORE_GROW_START: 2200,
  LIGHT_CORE_GROW_END: 2900,
  LIGHT_CORE_PULSE_END: 9200,
  LIGHT_CORE_PULSE_LOOP_MS: 2000,

  LIGHT_RAYS_START: 2500,
  LIGHT_RAYS_FADE_END: 3000,
  LIGHT_RAYS_END: 9200,
  LIGHT_RAYS_ROTATE_MS: 14000,

  FLASH_START: 2500,
  FLASH_PEAK: 2700,
  FLASH_END: 3100,

  RINGS_START: 2200,
  RINGS_END: 9200,
  RINGS_ROTATE_MS: 40000,

  MASK_ENTER_START: 2800,
  MASK_ENTER_MID: 3500,
  MASK_ENTER_END: 4000,

  MASK_GLOW_START: 3500,
  MASK_GLOW_END: 9200,
  MASK_GLOW_LOOP_MS: 1600,

  MASK_FLOAT_START: 4000,
  MASK_FLOAT_END: 9200,
  MASK_FLOAT_LOOP_MS: 3000,

  MASK_SHINE_START: 4000,
  MASK_SHINE_END: 9200,
  MASK_SHINE_LOOP_MS: 2000,
  MASK_SHINE_SWEEP_MS: 700,

  HIGHLIGHTER_START: 3500,
  HIGHLIGHTER_END: 3900,

  LETTERS_POP_START: 3600,
  LETTERS_POP_END: 4700,
  LETTERS_POP_STAGGER_MS: 45,

  LETTERS_LOOP_START: 4700,
  LETTERS_LOOP_END: 9200,
  LETTERS_WAVE_LOOP_MS: 1200,
  LETTERS_WAVE_STAGGER_MS: 60,
  LETTERS_COLOR_LOOP_MS: 3000,
  LETTERS_COLOR_STAGGER_MS: 120,

  STICKERS_ENTER_START: 4200,
  STICKERS_ENTER_END: 5400,
  STICKERS_LOOP_END: 9200,

  CONFETTI_1_START: 4400,
  CONFETTI_1_END: 6200,

  ICONS_ENTER_START: 5000,
  ICONS_ENTER_END: 5900,
  ICONS_LOOP_END: 9200,
  ICONS_ENTER_STAGGER_MS: 150,
  ICONS_HOP_LOOP_MS: 450,
  ICONS_HOP_STAGGER_MS: 90,

  ORBIT_SNAKES_START: 5500,
  ORBIT_SNAKES_END: 9200,
  ORBIT_ROTATE_MS: 6000,

  CONFETTI_2_START: 6800,
  CONFETTI_2_END: 8600,

  EXIT_START: 9200,
  EXIT_CAST_END: 9600,

  EXIT_MASK_START: 9400,
  EXIT_MASK_END: 9900,

  EXIT_BACKDROP_START: 9500,
  EXIT_BACKDROP_END: 10000,

  AFTERPARTY_START: 9300,
  AFTERPARTY_END: 10000,

  DURATION: PP_DURATION_MS,
} as const;

/** Milestones in the order the overlay lifecycle fires them — used to sanity-check ordering. */
export const PP_LIFECYCLE_MS = [
  PP_PHASES.SWARM_DONE,
  PP_PHASES.EXIT_START,
  PP_PHASES.AFTERPARTY_START,
  PP_PHASES.EXIT_MASK_START,
  PP_PHASES.EXIT_BACKDROP_START,
  PP_PHASES.DURATION,
] as const;

// ---- Reduced-motion variant phase constants (ms from tap) --------------

export const PP_RM_PHASES = {
  IN_START: 0,
  IN_DUR: 600,

  REVEAL_START: 700,
  REVEAL_DUR: 800,

  CAST_START: 1500,
  CAST_DUR: 600,

  OUT_START: 9200,
  OUT_DUR: 800,

  DURATION: PP_DURATION_MS,
} as const;

export const PP_RM_LIFECYCLE_MS = [
  PP_RM_PHASES.IN_START,
  PP_RM_PHASES.REVEAL_START,
  PP_RM_PHASES.CAST_START,
  PP_RM_PHASES.OUT_START,
  PP_RM_PHASES.DURATION,
] as const;

// ---- Audio timing --------------------------------------------------------

export const PP_AUDIO_TIMING = {
  NORMAL_START_SEC: 2.9,
  NORMAL_BEAT_SEC: 0.25,
  NORMAL_CHIME_SEC: 2.7,
  NORMAL_HISS_START_SEC: 0,
  NORMAL_HISS_END_SEC: 1.2,

  RM_START_SEC: 1.2,
  RM_BEAT_SEC: 0.25,
  RM_CHIME_SEC: 0.7,
} as const;

// ---- "Happy Birthday" jingle data ---------------------------------------

const NOTE_FREQ: Record<string, number> = {
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
};

/** "Happy Birthday" in C major, phrased as sung: 25 notes / 26 beats total. */
const HAPPY_BIRTHDAY_NOTES: ReadonlyArray<{ note: string; beats: number }> = [
  // Phrase 1 — "Happy birthday to you"
  { note: 'G4', beats: 0.75 },
  { note: 'G4', beats: 0.25 },
  { note: 'A4', beats: 1 },
  { note: 'G4', beats: 1 },
  { note: 'C5', beats: 1 },
  { note: 'B4', beats: 2 },
  // Phrase 2 — "Happy birthday to you"
  { note: 'G4', beats: 0.75 },
  { note: 'G4', beats: 0.25 },
  { note: 'A4', beats: 1 },
  { note: 'G4', beats: 1 },
  { note: 'D5', beats: 1 },
  { note: 'C5', beats: 2 },
  // Phrase 3 — "Happy birthday dear Priyansh"
  { note: 'G4', beats: 0.75 },
  { note: 'G4', beats: 0.25 },
  { note: 'G5', beats: 1 },
  { note: 'E5', beats: 1 },
  { note: 'C5', beats: 1 },
  { note: 'B4', beats: 1 },
  { note: 'A4', beats: 2 },
  // Phrase 4 — "Happy birthday to you"
  { note: 'F5', beats: 0.75 },
  { note: 'F5', beats: 0.25 },
  { note: 'E5', beats: 1 },
  { note: 'C5', beats: 1 },
  { note: 'D5', beats: 1 },
  { note: 'C5', beats: 3 },
];

export interface JingleNote {
  freq: number;
  start: number;
  duration: number;
}

/** Builds the note schedule relative to an AudioContext's currentTime. Pure — no AudioContext use. */
export function buildJingleSchedule(startSec: number, beatSec: number): JingleNote[] {
  const schedule: JingleNote[] = [];
  let t = startSec;
  for (const { note, beats } of HAPPY_BIRTHDAY_NOTES) {
    const duration = beats * beatSec;
    schedule.push({ freq: NOTE_FREQ[note], start: t, duration });
    t += duration;
  }
  return schedule;
}
