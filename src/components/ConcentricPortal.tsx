import React from 'react';

interface ConcentricPortalProps {
  size?: number;
}

export const ConcentricPortal: React.FC<ConcentricPortalProps> = ({ size = 220 }) => {
  return (
    <div 
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
      aria-label="Searching concentric portals"
    >
      {/* Ambient outer glow pulse */}
      <div 
        className="absolute rounded-full animate-pulse-glow"
        style={{
          width: size * 0.9,
          height: size * 0.9,
          background: 'radial-gradient(circle, rgba(214, 51, 122, 0.15) 0%, rgba(46, 21, 51, 0) 70%)',
          pointerEvents: 'none',
        }}
      />

      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 200 200" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        {/* Outer orbital disc — rotating clockwise (ART-12 disc base) */}
        <g className="animate-spin-slow" style={{ transformOrigin: 'center' }}>
          <ellipse 
            cx="100" 
            cy="100" 
            rx="88" 
            ry="48" 
            stroke="var(--color-text-on-dark)" 
            strokeWidth="1.2" 
            strokeDasharray="6 4" 
            opacity="0.35" 
          />
          {/* Orbital nodes / beads */}
          <circle cx="188" cy="100" r="3" fill="var(--color-text-on-dark)" opacity="0.6" />
          <circle cx="12" cy="100" r="3" fill="var(--color-text-on-dark)" opacity="0.6" />
          <circle cx="100" cy="52" r="2.5" fill="var(--color-accent)" opacity="0.8" />
          <circle cx="100" cy="148" r="2.5" fill="var(--color-accent-teal)" opacity="0.8" />
        </g>

        {/* Second intermediate disc — counter-clockwise rotation */}
        <g className="animate-spin-reverse" style={{ transformOrigin: 'center' }}>
          <ellipse 
            cx="100" 
            cy="100" 
            rx="68" 
            ry="36" 
            stroke="var(--color-text-on-dark)" 
            strokeWidth="1.5" 
            opacity="0.55" 
          />
          {/* Hand-drawn hatch marks along the perimeter mimicking ART-12 portal edge */}
          <path d="M 32 100 L 38 103" stroke="var(--color-text-on-dark)" strokeWidth="1" opacity="0.5" />
          <path d="M 168 100 L 162 97" stroke="var(--color-text-on-dark)" strokeWidth="1" opacity="0.5" />
          <path d="M 100 64 L 97 70" stroke="var(--color-text-on-dark)" strokeWidth="1" opacity="0.5" />
          <path d="M 100 136 L 103 130" stroke="var(--color-text-on-dark)" strokeWidth="1" opacity="0.5" />
        </g>

        {/* Inner high-contrast disc */}
        <g className="animate-spin-slow" style={{ transformOrigin: 'center', animationDuration: '14s' }}>
          <ellipse 
            cx="100" 
            cy="100" 
            rx="46" 
            ry="24" 
            stroke="var(--color-text-on-dark)" 
            strokeWidth="1.8" 
            opacity="0.8" 
          />
          {/* Double-offset magenta resonance outline */}
          <ellipse 
            cx="102" 
            cy="102" 
            rx="46" 
            ry="24" 
            stroke="var(--color-accent)" 
            strokeWidth="1.2" 
            opacity="0.65" 
          />
        </g>

        {/* Core focal eye / singularity */}
        <g className="animate-pulse-glow" style={{ transformOrigin: 'center' }}>
          {/* Central portal iris */}
          <ellipse 
            cx="100" 
            cy="100" 
            rx="20" 
            ry="11" 
            fill="#241329" 
            stroke="var(--color-text-on-dark)" 
            strokeWidth="1.8" 
          />
          {/* Magenta pupil core */}
          <circle cx="100" cy="100" r="5" fill="var(--color-accent)" />
          <circle cx="98.5" cy="98.5" r="1.5" fill="#FFFFFF" />
        </g>

        {/* Radiating vertical line of kinship search */}
        <line 
          x1="100" 
          y1="20" 
          x2="100" 
          y2="180" 
          stroke="var(--color-accent)" 
          strokeWidth="1" 
          strokeDasharray="4 3" 
          opacity="0.35" 
        />
      </svg>
    </div>
  );
};
