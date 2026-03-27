import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';

interface StripeReturnProps {
  status: 'success' | 'cancel';
}

const StripeReturn = ({ status }: StripeReturnProps) => {
  const { setTier } = useSubscription();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (status === 'success') {
      const tierParam = searchParams.get('tier');
      if (tierParam === 'plus' || tierParam === 'pro') {
        setTier(tierParam);
      } else {
        setTier('plus');
      }
    }
  }, [status, searchParams, setTier]);

  if (status === 'success') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--color-bg)', padding: '2rem', textAlign: 'center', gap: '1.5rem' }}>
        <CheckCircle size={64} color="var(--color-accent)" />
        <h1>Payment Successful!</h1>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '450px' }}>
          Your subscription is now active. You have full access to unlimited cards, email delivery, and all premium features.
        </p>
        <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--color-bg)', padding: '2rem', textAlign: 'center', gap: '1.5rem' }}>
      <XCircle size={64} color="var(--color-warm)" />
      <h1>Checkout Cancelled</h1>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: '450px' }}>
        No worries - you weren't charged. You can upgrade anytime from your dashboard settings.
      </p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <Link to="/dashboard" className="btn btn-outline">Back to Dashboard</Link>
        <Link to="/#pricing" className="btn btn-primary">View Plans</Link>
      </div>
    </div>
  );
};

export default StripeReturn;
