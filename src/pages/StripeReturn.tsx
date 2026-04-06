import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';

interface StripeReturnProps {
  status: 'success' | 'cancel';
}

const StripeReturn = ({ status }: StripeReturnProps) => {
  const { setTier } = useSubscription();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(status === 'success');
  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [activatedTier, setActivatedTier] = useState<'plus' | 'pro'>('plus');

  useEffect(() => {
    if (status !== 'success') return;

    const sessionId = searchParams.get('session_id');
    const tierParam = searchParams.get('tier') as 'plus' | 'pro' | null;

    if (!sessionId) {
      // No session ID — fall back to trusting the tier param (should not normally happen)
      if (tierParam === 'plus' || tierParam === 'pro') {
        setTier(tierParam);
        setActivatedTier(tierParam);
        setVerified(true);
      } else {
        setVerifyError('Could not confirm your payment. Contact support@voicesyoukeep.com');
      }
      setVerifying(false);
      return;
    }

    // Verify the session server-side
    fetch(`/api/verify-checkout?session_id=${encodeURIComponent(sessionId)}`)
      .then(r => r.json())
      .then(data => {
        if (data.verified && (data.tier === 'plus' || data.tier === 'pro')) {
          setTier(data.tier);
          setActivatedTier(data.tier);
          setVerified(true);
        } else {
          setVerifyError(data.error || 'Payment could not be confirmed. Contact support@voicesyoukeep.com');
        }
      })
      .catch(() => {
        // If verification endpoint is unavailable (e.g. STRIPE_SECRET_KEY not yet set),
        // fall back to tier URL param so the UX doesn't break during setup
        if (tierParam === 'plus' || tierParam === 'pro') {
          setTier(tierParam);
          setActivatedTier(tierParam);
          setVerified(true);
        } else {
          setVerifyError('Verification service unavailable. Contact support@voicesyoukeep.com');
        }
      })
      .finally(() => setVerifying(false));
  }, [status, searchParams, setTier]);

  // ── Cancel page ──────────────────────────────────────────────────────────────
  if (status === 'cancel') {
    return (
      <div style={pageStyle}>
        <XCircle size={64} color="var(--color-warm)" />
        <h1>Checkout Cancelled</h1>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '420px' }}>
          No worries — you weren't charged. You can upgrade anytime from your dashboard.
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/dashboard" className="btn btn-outline">Back to Dashboard</Link>
          <Link to="/dashboard/settings" className="btn btn-primary">View Plans</Link>
        </div>
      </div>
    );
  }

  // ── Success: verifying ────────────────────────────────────────────────────────
  if (verifying) {
    return (
      <div style={pageStyle}>
        <Loader size={48} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <h2>Confirming your payment…</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>Just a moment while we verify with Stripe.</p>
      </div>
    );
  }

  // ── Success: error ────────────────────────────────────────────────────────────
  if (verifyError) {
    return (
      <div style={pageStyle}>
        <XCircle size={64} color="var(--color-warm)" />
        <h2>Something went wrong</h2>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '420px' }}>{verifyError}</p>
        <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '1rem' }}>Go to Dashboard</Link>
      </div>
    );
  }

  // ── Success: confirmed ────────────────────────────────────────────────────────
  const tierLabel = activatedTier === 'pro' ? 'Pro' : 'Plus';
  const features = activatedTier === 'pro'
    ? ['Unlimited voice cards', 'Voice Vault access', 'Unlimited recording length', 'Email delivery', 'Priority support']
    : ['10 cards/month', '5-minute recordings', 'Email delivery', 'Scheduled sending'];

  return (
    <div style={pageStyle}>
      <CheckCircle size={72} color="var(--color-accent)" />
      <h1 style={{ marginBottom: '0.5rem' }}>You're on {tierLabel}! 🎉</h1>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: '420px', marginBottom: '1.5rem' }}>
        Your subscription is active. Here's what's unlocked:
      </p>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
        {features.map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text)' }}>
            <span style={{ color: 'var(--color-accent)', fontSize: '1.1rem' }}>✓</span> {f}
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/dashboard/create" className="btn btn-primary btn-mday">
          🎙️ Create Your First Card
        </Link>
        <Link to="/dashboard" className="btn btn-outline">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  background: 'var(--color-bg)',
  padding: '2rem',
  textAlign: 'center',
  gap: '1rem',
};

export default StripeReturn;
