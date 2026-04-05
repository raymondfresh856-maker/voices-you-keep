import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import InteractiveEnvelope from '../components/InteractiveEnvelope';
import { Heart, ArrowRight } from 'lucide-react';
import { dbService } from '../services/backend';

interface SharedCard {
  occasion: string;
  message: string;
  audioUrl?: string;
}

const ViewCard = () => {
  const { cardId } = useParams<{ cardId: string }>();
  const [card, setCard] = useState<SharedCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadCard = async () => {
      if (!cardId) { setError(true); setLoading(false); return; }
      try {
        // Try the unified dbService (handles both Firebase and mock)
        const found = await dbService.getCard(cardId);
        if (found) {
          setCard({ occasion: found.occasion, message: found.message, audioUrl: found.audioUrl });
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    loadCard();
  }, [cardId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--color-bg)', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--color-text-muted)' }}>Opening your card…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--color-bg)', gap: '1.5rem', padding: '2rem', textAlign: 'center' }}>
        <Heart size={48} color="var(--color-warm)" />
        <h2>Card Not Found</h2>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px' }}>
          This card may have expired or the link is incorrect. Ask the sender to share it again.
        </p>
        <Link to="/" className="btn btn-primary">Visit Voices You Keep</Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--color-bg)', padding: '2rem' }}>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem', textAlign: 'center' }}>
        ✉️ Someone sent you a voice card — tap to open it!
      </p>

      <InteractiveEnvelope occasion={card.occasion} message={card.message} audioBlobUrl={card.audioUrl} />

      {/* Conversion CTA below the card */}
      <div style={{
        marginTop: '3rem',
        textAlign: 'center',
        maxWidth: '480px',
        padding: '2rem',
        background: 'linear-gradient(135deg,rgba(232,82,122,0.1),rgba(192,132,252,0.1))',
        border: '1px solid rgba(232,82,122,0.2)',
        borderRadius: '1rem',
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>💐</div>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>Want to send one like this?</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: '0 0 1.25rem' }}>
          Create your own voice card for free — no credit card needed. Record your voice, pick an occasion, and share it in minutes.
        </p>
        <Link to="/create" className="btn btn-primary btn-mday" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          🎙️ Create Your Own Free Card <ArrowRight size={16} />
        </Link>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '0.75rem' }}>
          Mother's Day is May 10th · Ready in 2 minutes
        </p>
      </div>
    </div>
  );
};

export default ViewCard;
