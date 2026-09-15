export const PP_MODE_ENABLED = true;

export const PP_DURATION_MS = 10000;

export const PP_MESSAGE_LINE_1 = 'Happy Birthday';
export const PP_MESSAGE_LINE_2 = 'Priyansh';

export const PP_SEED = 15092026;

export const PP_NUDGE_SEEN_KEY = 'kin_pp_nudge_seen';

/** [base, tint] pairs assigned cyclically to snakes. */
export const PP_SNAKE_COLOR_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['#D6337A', '#F7A8C9'],
  ['#2E8B72', '#9EE0C9'],
  ['#B4531F', '#F2B48A'],
  ['#C99A2E', '#F3DC8F'],
  ['#7CFC6A', '#D4FFC9'],
  ['#FF2D95', '#FFC2E0'],
  ['#7B4FA0', '#D9C2EE'],
];

export const PP_SNAKE_COUNT_DESKTOP = 34;
export const PP_SNAKE_COUNT_MOBILE = 20;
export const PP_SNAKE_SIZE_DESKTOP: readonly [number, number] = [26, 40];
export const PP_SNAKE_SIZE_MOBILE: readonly [number, number] = [18, 28];

export interface PPStickerSpec {
  id: string;
  src: string;
  framed: boolean;
  desktop: { width: number };
  mobile: { width: number };
  baseRotationDeg: number;
  personalityClass: string;
  /** Exit direction (nearest edge), used by the shared pp-sticker-exit keyframe. */
  exitDx: string;
  exitDy: string;
}

export const PP_STICKERS: PPStickerSpec[] = [
  {
    id: 's1',
    src: '/brand/illustrations/art-09-card.png',
    framed: false,
    desktop: { width: 200 },
    mobile: { width: 110 },
    baseRotationDeg: 0,
    personalityClass: 'pp-personality-boing',
    exitDx: '-40vw',
    exitDy: '40vh',
  },
  {
    id: 's2',
    src: '/brand/illustrations/art-01-card.png',
    framed: true,
    desktop: { width: 170 },
    mobile: { width: 96 },
    baseRotationDeg: 6,
    personalityClass: 'pp-personality-dapper',
    exitDx: '40vw',
    exitDy: '40vh',
  },
  {
    id: 's3',
    src: '/brand/illustrations/art-04-card.jpg',
    framed: true,
    desktop: { width: 150 },
    mobile: { width: 90 },
    baseRotationDeg: -5,
    personalityClass: 'pp-personality-swing',
    exitDx: '-40vw',
    exitDy: '-40vh',
  },
  {
    id: 's4',
    src: '/brand/illustrations/art-03-card.png',
    framed: true,
    desktop: { width: 220 },
    mobile: { width: 140 },
    baseRotationDeg: 4,
    personalityClass: 'pp-personality-flap',
    exitDx: '40vw',
    exitDy: '-40vh',
  },
  {
    id: 's5',
    src: '/brand/illustrations/art-07-card.png',
    framed: true,
    desktop: { width: 150 },
    mobile: { width: 0 },
    baseRotationDeg: 0,
    personalityClass: 'pp-personality-peek-left',
    exitDx: '-50vw',
    exitDy: '0vh',
  },
  {
    id: 's6',
    src: '/brand/illustrations/art-19-card.png',
    framed: true,
    desktop: { width: 150 },
    mobile: { width: 0 },
    baseRotationDeg: 0,
    personalityClass: 'pp-personality-peek-right',
    exitDx: '50vw',
    exitDy: '0vh',
  },
  {
    id: 's7',
    src: '/brand/illustrations/art-20-card.png',
    framed: true,
    desktop: { width: 130 },
    mobile: { width: 0 },
    baseRotationDeg: 0,
    personalityClass: 'pp-personality-shimmy',
    exitDx: '-40vw',
    exitDy: '20vh',
  },
];

/** Confetti pieces: eye-orb vs claw in a 3:1 ratio. */
export const PP_CONFETTI_ASSETS: readonly string[] = [
  '/brand/icon-eyeorb.png',
  '/brand/icon-eyeorb.png',
  '/brand/icon-eyeorb.png',
  '/brand/icon-claw.png',
];

export const PP_CONFETTI_COUNT_DESKTOP = 24;
export const PP_CONFETTI_COUNT_MOBILE = 14;
