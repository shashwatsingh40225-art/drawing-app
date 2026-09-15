import { useRef, useCallback } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export function useSwipeGesture(handlers: SwipeHandlers, threshold = 50) {
  const startRef = useRef<{ x: number; y: number; startTime: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    // Enforce single-touch tracking: ignore if multi-touch (e.g. pinch-to-zoom)
    if (e.touches.length !== 1) {
      startRef.current = null;
      return;
    }
    const touch = e.touches[0];
    startRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      startTime: Date.now(),
    };
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    // If a second finger touches down mid-gesture, abort swipe
    if (e.touches.length > 1) {
      startRef.current = null;
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!startRef.current) return;

    // Abort if another touch is still active
    if (e.touches.length > 0) {
      startRef.current = null;
      return;
    }

    // Abort if gesture exceeds 350ms (deliberate drag, pan, or text selection)
    const duration = Date.now() - startRef.current.startTime;
    if (duration >= 350) {
      startRef.current = null;
      return;
    }

    // Abort if user was selecting text in PDF text layer
    const selection = typeof window !== 'undefined' ? window.getSelection() : null;
    if (selection && selection.toString().trim().length > 0) {
      startRef.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    const dx = touch.clientX - startRef.current.x;
    const dy = touch.clientY - startRef.current.y;
    startRef.current = null;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
      if (dx > 0) handlers.onSwipeRight?.();
      else handlers.onSwipeLeft?.();
    } else if (Math.abs(dy) > threshold) {
      if (dy > 0) handlers.onSwipeDown?.();
      else handlers.onSwipeUp?.();
    }
  }, [handlers, threshold]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
