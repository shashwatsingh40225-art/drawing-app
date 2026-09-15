import { useMemo } from 'react';
import { PP_SNAKE_COLOR_PAIRS } from './ppModeConfig';

const SEGMENT_COUNT = 9;

export interface SnakeSpec {
  key: string;
  baseSize: number;
  colorIndex: number;
  mode: 'swarm' | 'orbit';
  /** swarm mode: travel distance in viewport units, e.g. "42vw" */
  dx?: string;
  dy?: string;
  rotationDeg?: number;
  delayMs?: number;
  durationMs?: number;
  /** swarm mode: normalized (unitless) outward fling direction, scaled by 120vmax in CSS */
  flingNx?: number;
  flingNy?: number;
  tongueDelayMs?: number;
}

/** A cute cartoon snake built from tapered circle segments. Reused for both the swarm and the orbit ring. */
export function Snake({ spec }: { spec: SnakeSpec }) {
  const [base, tint] = PP_SNAKE_COLOR_PAIRS[spec.colorIndex % PP_SNAKE_COLOR_PAIRS.length];

  const segments = useMemo(() => {
    return Array.from({ length: SEGMENT_COUNT }, (_, i) => {
      const t = i / (SEGMENT_COUNT - 1);
      const scale = i === 0 ? 1.3 : 1 - t * 0.45;
      return {
        size: spec.baseSize * scale,
        color: i % 2 === 0 ? base : tint,
        delayMs: -i * 70,
        isHead: i === 0,
      };
    });
  }, [spec.baseSize, base, tint]);

  const body = (
    <div className="pp-snake-body">
      {segments.map((seg, i) => (
        <div
          key={i}
          className={seg.isHead ? 'pp-snake-segment pp-snake-head' : 'pp-snake-segment'}
          style={
            {
              width: seg.size,
              height: seg.size,
              backgroundColor: seg.color,
              zIndex: SEGMENT_COUNT - i,
              '--pp-seg-delay': `${seg.delayMs}ms`,
            } as React.CSSProperties
          }
        >
          {seg.isHead && (
            <>
              <span className="pp-snake-eye pp-snake-eye-l">
                <span className="pp-snake-pupil" />
              </span>
              <span className="pp-snake-eye pp-snake-eye-r">
                <span className="pp-snake-pupil" />
              </span>
              <span className="pp-snake-cheek pp-snake-cheek-l" />
              <span className="pp-snake-cheek pp-snake-cheek-r" />
              <span
                className="pp-snake-tongue"
                style={{ '--pp-tongue-delay': `${spec.tongueDelayMs ?? 0}ms` } as React.CSSProperties}
              />
            </>
          )}
        </div>
      ))}
    </div>
  );

  if (spec.mode === 'orbit') {
    return <div className="pp-snake-orbit-member">{body}</div>;
  }

  return (
    <div
      className="pp-snake-travel"
      style={
        {
          '--pp-dx': spec.dx,
          '--pp-dy': spec.dy,
          '--pp-rot': `${spec.rotationDeg ?? 0}deg`,
          '--pp-delay': `${spec.delayMs ?? 0}ms`,
          '--pp-dur': `${spec.durationMs ?? 1800}ms`,
        } as React.CSSProperties
      }
    >
      <div
        className="pp-snake-fling"
        style={
          {
            '--pp-fling-nx': spec.flingNx ?? 0,
            '--pp-fling-ny': spec.flingNy ?? 0,
          } as React.CSSProperties
        }
      >
        {body}
      </div>
    </div>
  );
}
