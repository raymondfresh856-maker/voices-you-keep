import React, { useState, useRef, useEffect } from 'react';

interface InteractiveEnvelopeProps {
  occasion: string;
  message: string;
  audioBlobUrl?: string;
}

interface Particle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  r: number;
  delay: number;
  dx: number;
  dy: number;
  scale: number;
  duration: number;
  wave: number;
}

const InteractiveEnvelope: React.FC<InteractiveEnvelopeProps> = ({ occasion, message, audioBlobUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [rainParticles, setRainParticles] = useState<{ id: number; emoji: string; x: number; delay: number; size: number }[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioBlobUrl) {
      audioRef.current = new Audio(audioBlobUrl);
    }
  }, [audioBlobUrl]);

  const getParticleEmojis = (type: string): string[] => {
    switch (type.toLowerCase()) {
      case 'birthday':
        return ['🎊','🎉','🎈','🎁','⭐','🌟','✨','🥳','🎂','💫'];
      case 'christmas':
        return ['🎄','⭐','🍬','🎁','❄️','🌟','🦌','🎅','✨','🔔'];
      case 'graduation':
        return ['🎓','📜','⭐','🌟','🏆','🎊','💫','✨','🥂','🎉'];
      case 'new years':
        return ['✨','🎆','🎇','🥂','⭐','💫','🌟','🎊','🍾','🎉'];
      case "mother's day":
      case 'mothers day':
      case 'mothers-day':
        return ['💐','🌸','🌹','🌷','💕','🥰','❤️','🌺','💗','✨'];
      case "father's day":
      case 'fathers day':
      case 'fathers-day':
        return ['🏆','⭐','🎉','💪','🔥','🌟','👑','🥂','🎊','💫'];
      default:
        return ['🎉','🎊','✨','⭐','💫','🌟','🎈','💥','🎁','🥳'];
    }
  };

  const handleOpen = () => {
    if (isOpen) return;
    setIsOpen(true);

    if (audioRef.current) {
      audioRef.current.play().catch(e => console.error('Audio auto-play prevented:', e));
    }

    const emojis = getParticleEmojis(occasion);
    const generated: Particle[] = [];

    /* Wave 1 — explosive radial burst from center (90 particles) */
    for (let i = 0; i < 90; i++) {
      const angle = (i / 90) * Math.PI * 2;
      const speed = 180 + Math.random() * 320;
      generated.push({
        id: i,
        emoji: emojis[i % emojis.length],
        x: 42 + Math.random() * 16,
        y: 50,
        r: Math.random() * 360,
        delay: Math.random() * 0.15,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed - 120,
        scale: 0.8 + Math.random() * 1.6,
        duration: 1.4 + Math.random() * 0.8,
        wave: 0,
      });
    }

    /* Wave 2 — upward fan from envelope opening (40 particles) */
    for (let i = 0; i < 40; i++) {
      const spread = ((i / 40) - 0.5) * 2;
      generated.push({
        id: 90 + i,
        emoji: emojis[(i + 3) % emojis.length],
        x: 50,
        y: 50,
        r: Math.random() * 360,
        delay: 0.1 + Math.random() * 0.3,
        dx: spread * 280,
        dy: -(200 + Math.random() * 280),
        scale: 0.6 + Math.random() * 1.2,
        duration: 1.6 + Math.random() * 0.7,
        wave: 0,
      });
    }

    setParticles(generated);

    /* Rain shower — separate state (30 emojis fall from above) */
    const rain = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      emoji: emojis[i % emojis.length],
      x: Math.random() * 100,
      delay: 0.5 + Math.random() * 2.0,
      size: 1.2 + Math.random() * 1.4,
    }));
    setRainParticles(rain);
    setTimeout(() => setRainParticles([]), 4000);
  };

  const isMothersDay = occasion.toLowerCase().includes('mother');

  return (
    <div
      className="envelope-wrapper"
      style={{ position: 'relative', width: '320px', height: '400px', margin: '0 auto', perspective: '1000px' }}
    >
      {/* ── Burst Particles ── */}
      {isOpen && particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${1.5 + p.scale}rem`,
            transform: 'translate(-50%, -50%)',
            animation: `burst-${p.id} ${p.duration}s ease-out ${p.delay}s both`,
            opacity: 0,
            zIndex: 55,
            pointerEvents: 'none',
            willChange: 'transform, opacity',
          }}
        >
          {p.emoji}
        </div>
      ))}

      {/* ── Rain Shower ── */}
      {rainParticles.map(r => (
        <div
          key={`rain-${r.id}`}
          style={{
            position: 'absolute',
            left: `${r.x}%`,
            top: '-2rem',
            fontSize: `${r.size}rem`,
            animation: `rain-drop 1.8s linear ${r.delay}s forwards`,
            opacity: 0,
            zIndex: 52,
            pointerEvents: 'none',
          }}
        >
          {r.emoji}
        </div>
      ))}

      {/* ── Envelope body ── */}
      <div style={{
        position: 'absolute', bottom: 0, width: '100%', height: '200px',
        background: '#d1cdc7', borderBottomLeftRadius: '0.5rem', borderBottomRightRadius: '0.5rem', zIndex: 1
      }} />

      {/* ── Card content ── */}
      <div
        style={{
          position: 'absolute',
          bottom: isOpen ? '100px' : '20px',
          left: '5%',
          width: '90%',
          height: '300px',
          background: isMothersDay
            ? 'linear-gradient(160deg, #fff 70%, #ffe0ef)'
            : 'white',
          borderRadius: '0.5rem',
          padding: '2rem',
          boxShadow: isOpen
            ? (isMothersDay
                ? '0 -8px 32px rgba(232,82,122,0.3), 0 -4px 12px rgba(0,0,0,0.1)'
                : '0 -8px 24px rgba(138,43,226,0.2), 0 -4px 10px rgba(0,0,0,0.1)')
            : '0 -4px 10px rgba(0,0,0,0.1)',
          zIndex: isOpen ? 10 : 2,
          transition: 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          color: '#333',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <h2 style={{
          fontFamily: "'Dancing Script', cursive",
          fontSize: '1.9rem',
          marginBottom: '1rem',
          color: isMothersDay ? '#e8527a' : 'var(--color-primary)',
          lineHeight: 1.2,
        }}>
          {isMothersDay
            ? "💐 Happy Mother's Day! 💐"
            : `${occasion.charAt(0).toUpperCase() + occasion.slice(1)} Greetings!`}
        </h2>
        <p style={{ fontSize: '1.05rem', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{message}</p>
        <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '0.65rem', color: '#ccc' }}>
          Voices You Keep™
        </div>
      </div>

      {/* ── Envelope front bottom triangle ── */}
      <div style={{
        position: 'absolute', bottom: 0, width: '100%', height: '200px',
        background: '#e8e5e1',
        clipPath: 'polygon(0 0, 50% 50%, 100% 0, 100% 100%, 0 100%)',
        borderBottomLeftRadius: '0.5rem', borderBottomRightRadius: '0.5rem', zIndex: 3
      }} />

      {/* ── Flap ── */}
      <div style={{
        position: 'absolute',
        top: '200px',
        width: '100%',
        height: '150px',
        background: '#dcd8d3',
        clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
        transformOrigin: 'top center',
        transition: 'transform 0.6s ease-in-out',
        zIndex: isOpen ? 0 : 4,
        transform: isOpen ? 'rotateX(180deg)' : 'rotateX(0deg)',
      }} />

      {/* ── Tap to open ── */}
      {!isOpen && (
        <div
          onClick={handleOpen}
          style={{
            position: 'absolute', inset: 0, zIndex: 20, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div className="btn btn-primary" style={{ animation: 'tap-pulse 2s infinite' }}>
            ✉️ Tap to Open
          </div>
        </div>
      )}

      {/* ── Inline keyframes ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');

        ${particles.map(p => `
          @keyframes burst-${p.id} {
            0%   { transform: translate(-50%, -50%) scale(0.2) rotate(${p.r}deg); opacity: 1; }
            25%  { opacity: 1; }
            100% { transform: translate(calc(-50% + ${p.dx}px), calc(-50% + ${p.dy}px)) scale(${(p.scale + 0.4).toFixed(2)}) rotate(${p.r + 540}deg); opacity: 0; }
          }
        `).join('')}

        @keyframes rain-drop {
          0%   { transform: translateY(0) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(500px) rotate(180deg); opacity: 0; }
        }

        @keyframes tap-pulse {
          0%   { transform: scale(1);    box-shadow: 0 4px 14px rgba(138,43,226,0.4); }
          50%  { transform: scale(1.08); box-shadow: 0 8px 28px rgba(138,43,226,0.65); }
          100% { transform: scale(1);    box-shadow: 0 4px 14px rgba(138,43,226,0.4); }
        }
      `}</style>
    </div>
  );
};

export default InteractiveEnvelope;
