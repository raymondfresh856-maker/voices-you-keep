import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import InteractiveEnvelope from '../components/InteractiveEnvelope';
import { Heart } from 'lucide-react';

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
      try {
        const MOCK_STORAGE_KEY = 'vyk_mock_db';
        const data = localStorage.getItem(MOCK_STORAGE_KEY);
        if (data) {
          const db = JSON.parse(data);
          const found = db.cards?.find((c: { id?: string }) => c.id === cardId);
          if (found) {
            setCard({ occasion: found.occasion, message: found.message, audioUrl: found.audioUrl });
            setLoading(false);
            return;
          }
        }
        setError(true);
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--color-bg)' }}>
        <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>Loading your card...</p>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--color-bg)', gap: '1.5rem', padding: '2rem', textAlign: 'center' }}>
        <Heart size={48} color='var(--color-warm)' />
        <h2>Card Not Found</h2>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px' }}>
          This card may have expired or the link is invalid. Ask the sender to share it again.
        </p>
        <Link to='/' className='btn btn-primary'>Visit Voices You Keep</Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--color-bg)', padding: '2rem' }}>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>Someone sent you a voice card!</p>
      <InteractiveEnvelope occasion={card.occasion} message={card.message} audioBlobUrl={card.audioUrl} />
      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem', fontSize: '0.85rem' }}>Made with Voices You Keep</p>
        <Link to='/' className='btn btn-outline' style={{ fontSize: '0.85rem' }}>Create Your Own</Link>
      </div>
    </div>
  );
};

export default ViewCard;
