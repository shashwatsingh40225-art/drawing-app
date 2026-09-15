import { useEffect, useRef, useState } from 'react';
import { PP_MODE_ENABLED, PP_NUDGE_SEEN_KEY } from './ppModeConfig';
import { usePPModeStore } from './ppModeStore';

export function PPModeTrigger() {
  const active = usePPModeStore((s) => s.active);
  const start = usePPModeStore((s) => s.start);
  const [pressed, setPressed] = useState(false);
  const [nudgeMounted, setNudgeMounted] = useState(false);
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const [wiggle, setWiggle] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!PP_MODE_ENABLED) return;

    let alreadySeen = false;
    try {
      alreadySeen = sessionStorage.getItem(PP_NUDGE_SEEN_KEY) === 'true';
    } catch {
      // storage access can throw in restricted environments; treat as unseen
    }
    if (alreadySeen) return;

    const showTimer = setTimeout(() => {
      setNudgeMounted(true);
      // Mount first, then flip to visible on the next frame so opacity transitions in.
      requestAnimationFrame(() => setNudgeVisible(true));
      setWiggle(true);
      try {
        sessionStorage.setItem(PP_NUDGE_SEEN_KEY, 'true');
      } catch {
        // ignore storage access errors
      }
    }, 1200);
    const wiggleTimer = setTimeout(() => setWiggle(false), 2100);
    const hideTimer = setTimeout(() => setNudgeVisible(false), 5200);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(wiggleTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!PP_MODE_ENABLED) return null;

  const handleClick = () => {
    if (active) return;
    setPressed(true);
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => setPressed(false), 250);
    start();
  };

  return (
    <span className="pp-trigger-wrap">
      <button
        type="button"
        className={`pp-trigger${pressed ? ' pp-trigger-pressed' : ''}${wiggle ? ' pp-trigger-wiggle' : ''}`}
        onClick={handleClick}
        disabled={active}
        aria-label="PP Mode: tap for a birthday surprise"
        title="PP Mode: tap for a birthday surprise"
      >
        <span className="pp-trigger-ring">
          <img src="/brand/icon-eyeorb.png" alt="" className="pp-trigger-icon" />
        </span>
        <span className="pp-trigger-badge">PP</span>
      </button>
      {nudgeMounted && (
        <span className={`pp-trigger-bubble${nudgeVisible ? ' pp-trigger-bubble-visible' : ''}`}>Tap me!</span>
      )}
    </span>
  );
}
