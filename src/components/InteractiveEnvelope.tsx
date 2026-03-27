import React, { useState, useRef, useEffect } from 'react';

interface InteractiveEnvelopeProps {
  occasion: string;
  message: string;
  audioBlobUrl?: string;
}

const InteractiveEnvelope: React.FC<InteractiveEnvelopeProps> = ({ occasion, message, audioBlobUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [particles, setParticles] = useState<{id: number, type: string, x: number, y: number, r: number, delay: number, dx: number, dy: number}[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioBlobUrl) {
      audioRef.current = new Audio(audioBlobUrl);
    }
  }, [audioBlobUrl]);

  const handleOpen = () => {
    if (isOpen) return;
    setIsOpen(true);
    
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.error('Audio auto-play prevented:', e));
    }

    const newParticles = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      type: occasion,
      x: Math.random() * 100,
      y: Math.random() * 100,
      r: Math.random() * 360,
      delay: Math.random() * 0.5,
      dx: (Math.random() - 0.5) * 200,
      dy: -(Math.random() * 250 + 100),
    }));
    setParticles(newParticles);
  };

  const getParticleContent = (type: string) => {
    switch(type.toLowerCase()) {
      case 'birthday': return '🎊';
      case 'christmas': return '🍬';
      case 'graduation': return '🎓';
      case 'new years': return '✨';
      default: return '🎉';
    }
  };

  return (
    <div className="envelope-wrapper" style={{ position: 'relative', width: '320px', height: '400px', margin: '0 auto', perspective: '1000px' }}>
      
      {isOpen && particles.map(p => (
        <div key={p.id} className="particle" style={{
          position: 'absolute',
          left: `${p.x}%`,
          top: `50%`,
          fontSize: '2rem',
          transform: `translate(-50%, -50%) rotate(${p.r}deg)`,
          animation: `explode-${p.id} 1.5s ease-out ${p.delay}s forwards`,
          opacity: 0,
          zIndex: 50
        }}>
          {getParticleContent(p.type)}
        </div>
      ))}

      <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '200px', background: '#d1cdc7', borderBottomLeftRadius: '0.5rem', borderBottomRightRadius: '0.5rem', zIndex: 1 }}></div>
      
      <div 
        className={`card-content ${isOpen ? 'card-open' : ''}`}
        style={{
          position: 'absolute',
          bottom: isOpen ? '100px' : '20px',
          left: '5%',
          width: '90%',
          height: '300px',
          background: 'white',
          borderRadius: '0.5rem',
          padding: '2rem',
          boxShadow: '0 -4px 10px rgba(0,0,0,0.1)',
          zIndex: isOpen ? 10 : 2,
          transition: 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          color: '#333',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        <h2 style={{ fontFamily: "'Dancing Script', cursive", fontSize: '2rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>
          {occasion.charAt(0).toUpperCase() + occasion.slice(1)} Greetings!
        </h2>
        <p style={{ fontSize: '1.1rem', whiteSpace: 'pre-wrap' }}>{message}</p>
        
        <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '0.7rem', color: '#ccc' }}>
          Voices You Keep™
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '200px', background: '#e8e5e1', clipPath: 'polygon(0 0, 50% 50%, 100% 0, 100% 100%, 0 100%)', borderBottomLeftRadius: '0.5rem', borderBottomRightRadius: '0.5rem', zIndex: 3 }}></div>
      
      <div 
        className={`flap ${isOpen ? 'flap-open' : ''}`}
        style={{
          position: 'absolute',
          top: '200px',
          width: '100%',
          height: '150px',
          background: '#dcd8d3',
          clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
          transformOrigin: 'top center',
          transition: 'transform 0.5s ease-in-out',
          zIndex: isOpen ? 0 : 4,
          transform: isOpen ? 'rotateX(180deg)' : 'rotateX(0deg)'
        }}
      ></div>

      {!isOpen && (
        <div 
          onClick={handleOpen}
          style={{ position: 'absolute', inset: 0, zIndex: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div className="btn btn-primary" style={{ animation: 'pulse 2s infinite' }}>Tap to Open</div>
        </div>
      )}
      
      <style>{`
        ${particles.map(p => `
          @keyframes explode-${p.id} {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
            100% { transform: translate(calc(-50% + ${p.dx}px), calc(-50% + ${p.dy}px)) scale(1.5) rotate(360deg); opacity: 0; }
          }
        `).join('')}
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default InteractiveEnvelope;
