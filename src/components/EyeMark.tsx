import React from 'react';

interface EyeMarkProps {
  size?: number;
  className?: string;
  withPulse?: boolean;
}

export const EyeMark: React.FC<EyeMarkProps> = ({ size = 32, className = '', withPulse = false }) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center ${withPulse ? 'animate-pulse-glow' : ''} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        {/* Double-outline chromatic offset ghost (magenta, offset 2px) */}
        <ellipse 
          cx="26" 
          cy="26" 
          rx="19" 
          ry="13" 
          stroke="var(--color-accent)" 
          strokeWidth="1.5" 
          opacity="0.55" 
        />

        {/* Outer eye contour (deep plum ink) */}
        <path 
          d="M 5 24 C 12 12, 36 12, 43 24 C 36 36, 12 36, 5 24 Z" 
          fill="var(--color-surface-elevated)" 
          stroke="var(--color-primary)" 
          strokeWidth="2.2" 
          strokeLinejoin="round" 
        />

        {/* Sclera & delicate sketch hatching */}
        <path d="M 9 22 C 14 17, 20 16, 24 16" stroke="rgba(180, 83, 31, 0.4)" strokeWidth="1" strokeLinecap="round" />
        <path d="M 12 28 C 16 31, 20 31, 24 31" stroke="rgba(180, 83, 31, 0.3)" strokeWidth="1" strokeLinecap="round" />

        {/* Iris (emerald teal) */}
        <circle 
          cx="24" 
          cy="24" 
          r="8.5" 
          fill="var(--color-accent-teal)" 
          stroke="var(--color-primary)" 
          strokeWidth="1.5" 
        />

        {/* Concentric inner iris striations (amber/gold) */}
        <circle cx="24" cy="24" r="6" fill="none" stroke="#C99A2E" strokeWidth="1" strokeDasharray="2 1.5" />

        {/* Pupil (deep plum) */}
        <circle cx="24" cy="24" r="4" fill="var(--color-primary-dark)" />

        {/* Pupil reflection highlight */}
        <circle cx="22" cy="21.5" r="1.5" fill="#FFFFFF" />

        {/* Spiked lash / antennae detail referencing ART-03 / ART-05 */}
        <path d="M 24 9 L 24 5" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 34 12 L 37 8" stroke="var(--color-secondary)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 14 12 L 11 8" stroke="var(--color-secondary)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
};
