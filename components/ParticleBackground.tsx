'use client';

export default function ParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute w-32 h-32 rounded-full opacity-20 blur-3xl" style={{ background: 'var(--accent)', top: '10%', left: '20%' }} />
      <div className="absolute w-40 h-40 rounded-full opacity-15 blur-3xl" style={{ background: '#06b6d4', top: '30%', right: '15%' }} />
      <div className="absolute w-24 h-24 rounded-full opacity-20 blur-2xl" style={{ background: '#a855f7', bottom: '20%', left: '40%' }} />
          </div>
  );
}
