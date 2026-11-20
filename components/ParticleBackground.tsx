'use client';

import { useEffect, useState } from 'react';

type GlowPosition = {
  top: string;
  left: string;
};

function createRandomPositions(): GlowPosition[] {
  return Array.from({ length: 3 }, () => ({
    top: `${Math.round(8 + Math.random() * 72)}%`,
    left: `${Math.round(8 + Math.random() * 72)}%`,
  }));
}

export default function ParticleBackground() {
  const [positions, setPositions] = useState<GlowPosition[]>([]);

  useEffect(() => {
    setPositions(createRandomPositions());

    const interval = window.setInterval(() => {
      setPositions(createRandomPositions());
    }, 8500);

    return () => window.clearInterval(interval);
  }, []);

  if (positions.length !== 3) {
    return <div className="absolute inset-0 overflow-hidden pointer-events-none" />;
  }

  const transition = 'top 8s ease-in-out, left 8s ease-in-out';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="particle-glow absolute w-32 h-32 rounded-full opacity-20 blur-3xl"
        style={{
          background: 'var(--accent)',
          ...positions[0],
          transition,
          animation: 'pulse 4s ease-in-out infinite',
        }}
      />
      <div
        className="particle-glow absolute w-40 h-40 rounded-full opacity-15 blur-3xl"
        style={{
          background: '#06b6d4',
          ...positions[1],
          transition,
          animation: 'pulse 5s ease-in-out infinite 1s',
        }}
      />
      <div
        className="particle-glow absolute w-24 h-24 rounded-full opacity-20 blur-2xl"
        style={{
          background: '#a855f7',
          ...positions[2],
          transition,
          animation: 'purple-pulse 3s ease-in-out infinite 0.5s',
        }}
      />
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.2); opacity: 0.25; }
        }

        @keyframes purple-pulse {
          0%, 100% { transform: scale(1); opacity: 0.12; }
          50% { transform: scale(1.2); opacity: 0.3; }
        }

        
      `}</style>
    </div>
  );
}
