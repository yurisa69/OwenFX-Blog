'use client';

export default function ParticleBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="particle-background-glow absolute h-32 w-32 rounded-full opacity-20 blur-3xl" style={{ background: 'var(--accent)', top: '10%', left: '20%' }} />
      <div className="particle-background-glow absolute h-40 w-40 rounded-full opacity-15 blur-3xl" style={{ background: '#06b6d4', top: '30%', right: '15%' }} />
      <div className="particle-background-glow absolute h-24 w-24 rounded-full opacity-20 blur-2xl" style={{ background: '#a855f7', bottom: '20%', left: '40%' }} />
    </div>
  );
}
