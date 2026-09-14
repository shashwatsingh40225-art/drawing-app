import React from 'react';

interface PigmentBloomProps {
  children: React.ReactNode;
  delay?: number;
}

export const PigmentBloom: React.FC<PigmentBloomProps> = ({ children, delay = 0 }) => (
  <div
    className="pigment-bloom"
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);
