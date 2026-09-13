import React from 'react';

interface FeatherDividerProps {
  className?: string;
  inverted?: boolean;
}

export const FeatherDivider: React.FC<FeatherDividerProps> = ({ className = '', inverted = false }) => {
  const strokeColor = inverted ? 'var(--color-text-on-dark)' : 'var(--color-border)';
  const accentColor = 'var(--color-secondary)';

  return (
    <div className={`feather-divider-container flex items-center justify-center my-6 ${className}`} role="separator">
      <svg 
        width="100%" 
        height="16" 
        viewBox="0 0 400 16" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{ maxWidth: '640px', height: '16px' }}
      >
        {/* Tapering feather stem line */}
        <path 
          d="M 20 8 Q 120 7, 200 8 T 380 8" 
          stroke={strokeColor} 
          strokeWidth="1.2" 
          strokeLinecap="round" 
        />
        {/* Subtle secondary offset misregistration line */}
        <path 
          d="M 80 9 Q 150 10, 220 9" 
          stroke={accentColor} 
          strokeWidth="0.8" 
          opacity="0.4" 
          strokeLinecap="round" 
        />
        {/* Center feather quill barb notch */}
        <path 
          d="M 194 5 L 200 8 L 206 5" 
          stroke={strokeColor} 
          strokeWidth="1.2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        <circle cx="200" cy="8" r="2" fill={accentColor} opacity="0.7" />
      </svg>
    </div>
  );
};
