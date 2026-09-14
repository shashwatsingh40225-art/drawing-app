import React, { useRef, useEffect } from 'react';

interface InkDrawOnProps {
  children: React.ReactNode;
  delay?: number;
}

export const InkDrawOn: React.FC<InkDrawOnProps> = ({ children, delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const paths = ref.current.querySelectorAll('path, line, polyline');
    paths.forEach((el) => {
      const length = (el as SVGGeometryElement).getTotalLength?.() || 1000;
      (el as HTMLElement).style.setProperty('--path-length', String(length));
      (el as HTMLElement).style.animationDelay = `${delay}ms`;
    });
  }, [delay]);

  return (
    <div ref={ref} className="ink-draw-on">
      {children}
    </div>
  );
};
