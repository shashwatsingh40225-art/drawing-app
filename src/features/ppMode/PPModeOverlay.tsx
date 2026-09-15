import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Home, Palette, BookOpen, UploadCloud, Archive, Star } from 'lucide-react';
import {
  PP_MODE_ENABLED,
  PP_MESSAGE_LINE_1,
  PP_MESSAGE_LINE_2,
  PP_SEED,
  PP_SNAKE_COLOR_PAIRS,
  PP_SNAKE_COUNT_DESKTOP,
  PP_SNAKE_COUNT_MOBILE,
  PP_SNAKE_SIZE_DESKTOP,
  PP_SNAKE_SIZE_MOBILE,
  PP_STICKERS,
  PP_CONFETTI_ASSETS,
  PP_CONFETTI_COUNT_DESKTOP,
  PP_CONFETTI_COUNT_MOBILE,
} from './ppModeConfig';
import { PP_PHASES, PP_RM_PHASES } from './ppTimeline';
import { mulberry32, createRange } from './seededRandom';
import { Snake, type SnakeSpec } from './Snake';
import './ppMode.css';
import { usePPModeStore } from './ppModeStore';

const LIVING_ICONS = [Home, Palette, BookOpen, UploadCloud, Archive, Star];

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 640);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
}

interface SwarmSnakeSpec extends SnakeSpec {
  startLeftVw: number;
  startTopVh: number;
}

function buildSwarmSnakes(seed: number, count: number, sizeRange: readonly [number, number]): SwarmSnakeSpec[] {
  const rand = mulberry32(seed);
  const range = createRange(rand);
  const specs: SwarmSnakeSpec[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + range(-0.2, 0.2);
    const startLeftVw = 50 + Math.cos(angle) * 65;
    const startTopVh = 50 + Math.sin(angle) * 65;

    const crossesFully = rand() < 0.25;
    const targetLeftVw = crossesFully ? 50 - Math.cos(angle) * range(45, 60) : range(10, 90);
    const targetTopVh = crossesFully ? 50 - Math.sin(angle) * range(45, 60) : range(10, 90);

    const dxVw = targetLeftVw - startLeftVw;
    const dyVh = targetTopVh - startTopVh;
    const rotationDeg = (Math.atan2(dyVh, dxVw) * 180) / Math.PI;

    const fdx = targetLeftVw - 50;
    const fdy = targetTopVh - 50;
    const flen = Math.hypot(fdx, fdy) || 1;

    specs.push({
      key: `swarm-${i}`,
      mode: 'swarm',
      baseSize: range(sizeRange[0], sizeRange[1]),
      colorIndex: i % PP_SNAKE_COLOR_PAIRS.length,
      startLeftVw,
      startTopVh,
      dx: `${dxVw.toFixed(2)}vw`,
      dy: `${dyVh.toFixed(2)}vh`,
      rotationDeg,
      delayMs: range(0, 900),
      durationMs: range(1500, 2300),
      flingNx: fdx / flen,
      flingNy: fdy / flen,
      tongueDelayMs: range(0, 900),
    });
  }
  return specs;
}

function buildOrbitSnakes(seed: number): SnakeSpec[] {
  const rand = mulberry32(seed);
  const specs: SnakeSpec[] = [];
  for (let i = 0; i < 6; i++) {
    specs.push({
      key: `orbit-${i}`,
      mode: 'orbit',
      baseSize: 14,
      colorIndex: (i + 3) % PP_SNAKE_COLOR_PAIRS.length,
      tongueDelayMs: rand() * 900,
    });
  }
  return specs;
}

interface ConfettiPiece {
  key: string;
  asset: string;
  size: number;
  angleDeg: number;
  distanceVmin: number;
  fallVh: number;
  rotateDeg: number;
  delayMs: number;
}

function buildConfettiBurst(seed: number, count: number): ConfettiPiece[] {
  const rand = mulberry32(seed);
  const range = createRange(rand);
  const pieces: ConfettiPiece[] = [];
  for (let i = 0; i < count; i++) {
    pieces.push({
      key: `c-${seed}-${i}`,
      asset: PP_CONFETTI_ASSETS[Math.floor(rand() * PP_CONFETTI_ASSETS.length)],
      size: range(28, 56),
      angleDeg: range(0, 360),
      distanceVmin: range(30, 48),
      fallVh: range(10, 20),
      rotateDeg: range(360, 720) * (rand() < 0.5 ? -1 : 1),
      delayMs: range(0, 150),
    });
  }
  return pieces;
}

function Letters({ text, startIndex, className }: { text: string; startIndex: number; className: string }) {
  return (
    <span className={className} aria-hidden="true">
      {text.split('').map((ch, i) => (
        <span
          key={i}
          className={ch === ' ' ? 'pp-letter pp-letter-space' : 'pp-letter'}
          style={{ '--pp-letter-index': startIndex + i } as React.CSSProperties}
        >
          <span className="pp-letter-inner">{ch}</span>
        </span>
      ))}
    </span>
  );
}

function OverlayContent({ reducedMotion, onDone }: { reducedMotion: boolean; onDone: () => void }) {
  const isMobile = useIsMobile();
  const [swarmDone, setSwarmDone] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timers: ReturnType<typeof setTimeout>[] = [];
    if (!reducedMotion) {
      timers.push(setTimeout(() => setSwarmDone(true), PP_PHASES.SWARM_DONE));
      timers.push(
        setTimeout(() => document.body.classList.add('pp-afterparty'), PP_PHASES.AFTERPARTY_START + 100)
      );
    }
    const duration = reducedMotion ? PP_RM_PHASES.DURATION : PP_PHASES.DURATION;
    timers.push(setTimeout(onDone, duration));

    return () => {
      timers.forEach(clearTimeout);
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove('pp-afterparty');
    };
  }, [reducedMotion, onDone]);

  const swarmSnakes = useMemo(
    () => (reducedMotion ? [] : buildSwarmSnakes(PP_SEED, isMobile ? PP_SNAKE_COUNT_MOBILE : PP_SNAKE_COUNT_DESKTOP, isMobile ? PP_SNAKE_SIZE_MOBILE : PP_SNAKE_SIZE_DESKTOP)),
    [reducedMotion, isMobile]
  );
  const orbitSnakes = useMemo(() => (reducedMotion ? [] : buildOrbitSnakes(PP_SEED + 1)), [reducedMotion]);
  const confetti1 = useMemo(
    () => (reducedMotion ? [] : buildConfettiBurst(PP_SEED + 2, isMobile ? PP_CONFETTI_COUNT_MOBILE : PP_CONFETTI_COUNT_DESKTOP)),
    [reducedMotion, isMobile]
  );
  const confetti2 = useMemo(
    () => (reducedMotion ? [] : buildConfettiBurst(PP_SEED + 3, isMobile ? PP_CONFETTI_COUNT_MOBILE : PP_CONFETTI_COUNT_DESKTOP)),
    [reducedMotion, isMobile]
  );

  const line1StartIndex = 0;
  const line2StartIndex = PP_MESSAGE_LINE_1.length;

  if (reducedMotion) {
    return <ReducedMotionScene />;
  }

  return (
    <div className="pp-stage">
      <div className="pp-backdrop" />
      <div className="pp-rings" />
      <div className="pp-rays" />
      <div className="pp-core-outer">
        <div className="pp-core-inner" />
      </div>
      <div className="pp-flash" />

      {!swarmDone && (
        <div className="pp-swarm">
          {swarmSnakes.map((spec) => (
            <div
              key={spec.key}
              className="pp-snake-slot"
              style={{ left: `${spec.startLeftVw}vw`, top: `${spec.startTopVh}vh` }}
            >
              <Snake spec={spec} />
            </div>
          ))}
        </div>
      )}

      <div className="pp-orbit-wrap">
        <div className="pp-orbit-ring">
          {orbitSnakes.map((spec, i) => (
            <div
              key={spec.key}
              className="pp-orbit-slot"
              style={{ '--pp-orbit-angle': `${(i / orbitSnakes.length) * 360}deg` } as React.CSSProperties}
            >
              <Snake spec={spec} />
            </div>
          ))}
        </div>
      </div>

      <div className="pp-center-column">
        <div className="pp-mask-block">
          <div className="pp-mask-lifecycle">
            <div className="pp-mask-float">
              <img className="pp-mask-glow" src="/pp/mask.png" alt="" aria-hidden="true" />
              <img className="pp-mask-img" src="/pp/mask.png" alt="Ceremonial mask" />
              <div className="pp-mask-shine" />
            </div>
          </div>
        </div>

        <div className="pp-message-block">
          <div className="pp-message-lifecycle">
            <div className="pp-message-line pp-message-line-1">
              <Letters text={PP_MESSAGE_LINE_1} startIndex={line1StartIndex} className="pp-letters" />
            </div>
            <div className="pp-message-line pp-message-line-2">
              <span className="pp-highlighter" />
              <Letters text={PP_MESSAGE_LINE_2} startIndex={line2StartIndex} className="pp-letters pp-letters-line2" />
            </div>
            <span className="pp-sr-only">
              {PP_MESSAGE_LINE_1} {PP_MESSAGE_LINE_2}
            </span>
          </div>
        </div>
      </div>

      <div className="pp-cast">
        {PP_STICKERS.map((sticker, stickerIndex) => (
          <div
            key={sticker.id}
            className={`pp-sticker-lifecycle pp-sticker-pos-${sticker.id}${sticker.framed ? ' pp-sticker-framed' : ' pp-sticker-cutout'}`}
            style={
              {
                '--pp-exit-dx': sticker.exitDx,
                '--pp-exit-dy': sticker.exitDy,
                '--pp-sticker-index': stickerIndex,
              } as React.CSSProperties
            }
          >
            <div className={`pp-sticker-loop ${sticker.personalityClass}`}>
              <img
                src={sticker.src}
                alt=""
                aria-hidden="true"
                className="pp-sticker-img"
                style={{
                  width: isMobile ? sticker.mobile.width : sticker.desktop.width,
                  transform: `rotate(${sticker.baseRotationDeg}deg)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pp-icons-row">
        {LIVING_ICONS.slice(0, isMobile ? 4 : LIVING_ICONS.length).map((Icon, i) => (
          <div key={i} className="pp-icon-lifecycle" style={{ '--pp-icon-index': i } as React.CSSProperties}>
            <div className="pp-icon-loop" style={{ '--pp-icon-index': i } as React.CSSProperties}>
              <div className="pp-icon-badge">
                <Icon className="pp-icon-glyph" />
                <span className="pp-googly pp-googly-l">
                  <span className="pp-googly-pupil" />
                </span>
                <span className="pp-googly pp-googly-r">
                  <span className="pp-googly-pupil" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pp-confetti-layer">
        {confetti1.map((piece) => (
          <ConfettiImg key={piece.key} piece={piece} burstStartMs={PP_PHASES.CONFETTI_1_START} />
        ))}
        {confetti2.map((piece) => (
          <ConfettiImg key={piece.key} piece={piece} burstStartMs={PP_PHASES.CONFETTI_2_START} />
        ))}
      </div>
    </div>
  );
}

function ConfettiImg({ piece, burstStartMs }: { piece: ConfettiPiece; burstStartMs: number }) {
  const rad = (piece.angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad) * piece.distanceVmin;
  const dy = Math.sin(rad) * piece.distanceVmin + piece.fallVh;
  return (
    <img
      src={piece.asset}
      alt=""
      aria-hidden="true"
      className="pp-confetti-piece"
      style={
        {
          width: piece.size,
          height: piece.size,
          '--pp-confetti-dx': `${dx.toFixed(2)}vmin`,
          '--pp-confetti-dy': `${dy.toFixed(2)}vh`,
          '--pp-confetti-rot': `${piece.rotateDeg.toFixed(0)}deg`,
          animationDelay: `${burstStartMs + piece.delayMs}ms`,
        } as React.CSSProperties
      }
    />
  );
}

/**
 * The global prefers-reduced-motion rule (src/index.css) forces every CSS animation to
 * its end state in one frame, so this variant is driven by JS state-class toggles +
 * CSS transitions instead — the one deliberate exception to the "no per-frame JS" rule.
 */
function ReducedMotionScene() {
  const [stage, setStage] = useState(-1);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setStage(0));
    const timers = [
      setTimeout(() => setStage(1), PP_RM_PHASES.REVEAL_START),
      setTimeout(() => setStage(2), PP_RM_PHASES.CAST_START),
      setTimeout(() => setStage(3), PP_RM_PHASES.OUT_START),
    ];
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, []);

  const out = stage >= 3 ? ' pp-rm-out' : '';
  const inCls = `pp-rm-transition${stage >= 0 ? ' pp-rm-visible' : ''}${out}`;
  const revealCls = `pp-rm-transition${stage >= 1 ? ' pp-rm-visible' : ''}${out}`;
  const castCls = `pp-rm-transition${stage >= 2 ? ' pp-rm-visible' : ''}${out}`;

  return (
    <div className="pp-stage pp-rm-stage">
      <div className={`pp-rm-backdrop ${inCls}`} />
      <div className={`pp-rm-core ${revealCls}`} />

      <div className="pp-center-column">
        <div className={`pp-mask-block ${revealCls}`}>
          <img className="pp-mask-glow pp-mask-glow-static" src="/pp/mask.png" alt="" aria-hidden="true" />
          <img className="pp-mask-img" src="/pp/mask.png" alt="Ceremonial mask" />
        </div>

        <div className={`pp-message-block ${revealCls}`}>
          <div className="pp-message-line pp-message-line-1">{PP_MESSAGE_LINE_1}</div>
          <div className="pp-message-line pp-message-line-2">
            <span className="pp-highlighter pp-highlighter-static" />
            {PP_MESSAGE_LINE_2}
          </div>
        </div>
      </div>

      <div className={`pp-cast ${castCls}`}>
        {PP_STICKERS.slice(0, 4).map((sticker) => (
          <div key={sticker.id} className={`pp-sticker-pos-${sticker.id}${sticker.framed ? ' pp-sticker-framed' : ' pp-sticker-cutout'}`}>
            <img src={sticker.src} alt="" aria-hidden="true" className="pp-sticker-img" style={{ width: sticker.desktop.width }} />
          </div>
        ))}
      </div>

      <div className={`pp-icons-row ${castCls}`}>
        {LIVING_ICONS.map((Icon, i) => (
          <div key={i} className="pp-icon-badge">
            <Icon className="pp-icon-glyph" />
            <span className="pp-googly pp-googly-l">
              <span className="pp-googly-pupil" />
            </span>
            <span className="pp-googly pp-googly-r">
              <span className="pp-googly-pupil" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PPModeOverlay() {
  const active = usePPModeStore((s) => s.active);
  const reducedMotion = usePPModeStore((s) => s.reducedMotion);
  const runId = usePPModeStore((s) => s.runId);
  const end = usePPModeStore((s) => s.end);

  if (!PP_MODE_ENABLED || !active) return null;

  return createPortal(
    <div
      data-pp-overlay
      role="dialog"
      aria-modal="true"
      aria-label="Happy Birthday Priyansh"
      className={reducedMotion ? 'pp-overlay-root pp-overlay-root-rm' : 'pp-overlay-root'}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <OverlayContent key={runId} reducedMotion={reducedMotion} onDone={end} />
    </div>,
    document.body
  );
}
