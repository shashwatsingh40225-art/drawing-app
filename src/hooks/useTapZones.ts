import { useCallback, useRef } from 'react';

interface TapZoneHandlers {
  onLeftTap?: () => void;
  onCenterTap?: () => void;
  onRightTap?: () => void;
}

/**
 * Zone-based tap navigation: left third of a container = previous, right third = next,
 * middle third = center action (chrome toggle). Built on Pointer Events so one implementation
 * covers mouse and touch alike, mirroring useSwipeGesture's care around not misreading a
 * deliberate gesture — a tap only qualifies if it didn't move far or take long, and a text
 * selection in progress (e.g. in the PDF text layer) always wins over a tap.
 */
export function useTapZones(handlers: TapZoneHandlers, moveThreshold = 10, durationThreshold = 400) {
  const startRef = useRef<{ x: number; y: number; startTime: number } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!e.isPrimary) {
      startRef.current = null;
      return;
    }
    startRef.current = { x: e.clientX, y: e.clientY, startTime: Date.now() };
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const start = startRef.current;
      startRef.current = null;
      if (!start || !e.isPrimary) return;

      const duration = Date.now() - start.startTime;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (duration >= durationThreshold || Math.hypot(dx, dy) >= moveThreshold) return;

      const selection = typeof window !== 'undefined' ? window.getSelection() : null;
      if (selection && selection.toString().trim().length > 0) return;

      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width <= 0) return;
      const fraction = (e.clientX - rect.left) / rect.width;

      if (fraction < 1 / 3) handlers.onLeftTap?.();
      else if (fraction > 2 / 3) handlers.onRightTap?.();
      else handlers.onCenterTap?.();
    },
    [handlers, moveThreshold, durationThreshold]
  );

  return { onPointerDown, onPointerUp };
}
