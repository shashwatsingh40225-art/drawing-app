/**
 * Kin Visual Refresh — Design Token System
 * 
 * Defines visual "worlds", motion timing presets, and design tokens.
 * Components read from this token file rather than hardcoding colors.
 */

export type OutlineTreatment = 'double' | 'single-hand-drawn' | 'glow' | 'single';
export type TexturePreset = 'none' | 'ruled-paper' | 'parchment';
export type MotionPreset = 'flutter' | 'wobble' | 'drift-slow' | 'line-reveal';

export interface WorldToken {
  bg: string;
  accent: string;
  secondaryAccent: string;
  outline: OutlineTreatment;
  texture: TexturePreset;
  motion: MotionPreset;
  // Accessible text and surface pairings guaranteeing WCAG AA contrast (minimum 4.5:1)
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderSubtle: string;
}

export type WorldKey = 'magentaCreature' | 'inkStudy' | 'chalkNocturne' | 'crossHatch';

export const worlds: Record<WorldKey, WorldToken> = {
  magentaCreature: {
    bg: '#F5E9DC',
    accent: '#FF2D95',
    secondaryAccent: '#7CFC6A',
    outline: 'double',
    texture: 'none',
    motion: 'flutter',
    textPrimary: '#281721',
    textSecondary: '#6B4F5E',
    textMuted: '#8C6E7E',
    surface: '#FAF2E9',
    surfaceElevated: '#FFFFFF',
    border: '#E8D5C4',
    borderSubtle: '#F0E2D5',
  },
  inkStudy: {
    bg: '#F0E6D2',
    accent: '#8B4A2B',
    secondaryAccent: '#A85C2B',
    outline: 'single-hand-drawn',
    texture: 'ruled-paper',
    motion: 'wobble',
    textPrimary: '#231710',
    textSecondary: '#6B5B4D',
    textMuted: '#857361',
    surface: '#F8F1E3',
    surfaceElevated: '#FFFFFF',
    border: '#D9CBB5',
    borderSubtle: '#E8DEC9',
  },
  chalkNocturne: {
    bg: '#2B1E33',
    accent: '#FF4081',
    secondaryAccent: '#DC143C',
    outline: 'glow',
    texture: 'none',
    motion: 'drift-slow',
    textPrimary: '#FBF5F8',
    textSecondary: '#D1BAC8',
    textMuted: '#9E8595',
    surface: '#382842',
    surfaceElevated: '#453252',
    border: '#533C61',
    borderSubtle: '#432E50',
  },
  crossHatch: {
    bg: '#EDE6D6',
    accent: '#1A1A1A',
    secondaryAccent: '#000000',
    outline: 'single',
    texture: 'parchment',
    motion: 'line-reveal',
    textPrimary: '#141414',
    textSecondary: '#4A4742',
    textMuted: '#706B62',
    surface: '#F6F1E5',
    surfaceElevated: '#FFFFFF',
    border: '#CDC4B1',
    borderSubtle: '#DCD4C3',
  },
};

/**
 * Global Motion Timing Constants
 */
export const motionTiming = {
  /** 150–250ms, spring easing, for taps/toggles/saves */
  microInteraction: {
    durationMs: 200,
    duration: '200ms',
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    css: '200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  /** 400–700ms, spring/wobble easing, for opening a book, navigating between major screens */
  screenTransition: {
    durationMs: 500,
    duration: '500ms',
    easing: 'cubic-bezier(0.25, 1.4, 0.5, 1)',
    css: '500ms cubic-bezier(0.25, 1.4, 0.5, 1)',
  },
} as const;

/**
 * Generates CSS custom properties dictionary for a given world
 */
export function getWorldCssVariables(worldKey: WorldKey): Record<string, string> {
  const world = worlds[worldKey];
  return {
    '--world-bg': world.bg,
    '--world-accent': world.accent,
    '--world-secondary-accent': world.secondaryAccent,
    '--world-text-primary': world.textPrimary,
    '--world-text-secondary': world.textSecondary,
    '--world-text-muted': world.textMuted,
    '--world-surface': world.surface,
    '--world-surface-elevated': world.surfaceElevated,
    '--world-border': world.border,
    '--world-border-subtle': world.borderSubtle,
  };
}
