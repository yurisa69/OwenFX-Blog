'use client';

export default function ParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute w-32 h-32 rounded-full opacity-20 blur-3xl" style={{ background: 'var(--accent)', top: '10%', left: '20%', animation: 'pulse 4s ease-in-out infinite' }} />
      <div className="absolute w-40 h-40 rounded-full opacity-15 blur-3xl" style={{ background: 'var(--accent3)', top: '30%', right: '15%', animation: 'pulse 5s ease-in-out infinite 1s' }} />
      <div className="absolute w-24 h-24 rounded-full opacity-20 blur-2xl" style={{ background: '#a855f7', bottom: '20%', left: '40%', animation: 'pulse 3.5s ease-in-out infinite 0.5s' }} />
      <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.15; } 50% { transform: scale(1.2); opacity: 0.25; } }`}</style>
    </div>
  );
}
