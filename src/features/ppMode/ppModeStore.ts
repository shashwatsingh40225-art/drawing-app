import { create } from 'zustand';
import { startPPAudio, stopPPAudio } from './ppAudio';

interface PPModeState {
  active: boolean;
  reducedMotion: boolean;
  runId: number;
  start: () => void;
  end: () => void;
}

export const usePPModeStore = create<PPModeState>((set, get) => ({
  active: false,
  reducedMotion: false,
  runId: 0,

  start: () => {
    if (get().active) return;

    const reducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    set((state) => ({ active: true, reducedMotion, runId: state.runId + 1 }));

    // Called synchronously in the tap's call stack so the browser allows audio.
    startPPAudio(reducedMotion);
  },

  end: () => {
    stopPPAudio();
    set({ active: false });
  },
}));
