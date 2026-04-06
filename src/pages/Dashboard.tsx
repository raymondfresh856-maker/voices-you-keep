import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Heart, Settings, PlusCircle, LogOut, CreditCard, ExternalLink, Copy, Check, Trash2, Share2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { dbService } from '../services/backend';
import type { CardData } from '../services/backend';

import CreateCard from './CreateCard';
import Vault from './Vault';

// ── Auth Guard ────────────────────────────────────────────────────────────────
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--color-bg)', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  if (!user) return null;
  return <>{children}</>;
};

// ── Card Share Button ─────────────────────────────────────────────────────────
const ShareButton = ({ cardId }: { cardId: string }) => {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/card/${cardId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="btn btn-outline"
      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
      title="Copy shareable link"
    >
      {copied ? <Check size={14} color="var(--color-accent)" /> : <Copy size={14} />}
      {copied ? 'Copied!' : 'Copy Link'}
    </button>
  );
};

// ── Dashboard Home ────────────────────────────────────────────────────────────
const DashboardHome = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCards = () => {
    if (user) {
      dbService.getUserCards(user.uid).then(fetchedCards => {
        // Filter out vault uploads from the main card grid
        setCards(fetchedCards.filter(c => c.occasion !== 'vault upload'));
        setLoading(false);
      });
    }
  };

  useEffect(() => { loadCards(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (cardId: string) => {
    if (!user || !cardId) return;
    if (!window.confirm('Delete this card? This cannot be undone.')) return;
    setDeletingId(cardId);
    try {
      await dbService.deleteCard(cardId, user.uid);
      setCards(prev => prev.filter(c => c.id !== cardId));
    } catch (e) {
      console.error(e);
      alert('Failed to delete card.');
    } finally {
      setDeletingId(null);
    }
  };

  const occasionEmoji: Record<string, string> = {
    "mother's day": '💐', "father's day": '🏆', birthday: '🎂',
    christmas: '🎄', graduation: '🎓', 'new years': '🥂',
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>
          Welcome back, {user?.displayName || 'friend'} 👋
        </h1>
        <Link to="/dashboard/create" className="btn btn-primary btn-mday" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlusCircle size={18} /> Create New Card
        </Link>
      </div>

      {/* Quick action cards */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <Link to="/dashboard/create" className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center', textDecoration: 'none', transition: 'transform 0.2s', border: '1px solid rgba(232,82,122,0.2)' }}
          onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseOut={e => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg,rgba(232,82,122,0.2),rgba(192,132,252,0.2))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PlusCircle size={32} color="var(--color-mday-pink)" />
          </div>
          <h3 style={{ margin: 0 }}>Create Voice Card</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>Record your voice and create a beautiful animated card.</p>
        </Link>

        <Link to="/dashboard/vault" className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center', textDecoration: 'none', transition: 'transform 0.2s' }}
          onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseOut={e => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <div style={{ width: '64px', height: '64px', background: 'rgba(255,179,71,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={32} color="var(--color-warm)" />
          </div>
          <h3 style={{ margin: 0 }}>Voice Vault <span style={{ fontSize: '0.6rem', padding: '0.2rem 0.4rem', background: 'var(--color-primary)', borderRadius: '0.5rem', textTransform: 'uppercase', verticalAlign: 'middle' }}>Pro</span></h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>Permanently preserve voicemails and recordings from loved ones.</p>
        </Link>
      </div>

      {/* Mother's Day nudge banner */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(232,82,122,0.1),rgba(192,132,252,0.1))',
        border: '1px solid rgba(232,82,122,0.2)',
        borderRadius: '0.75rem', padding: '1rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2.5rem'
      }}>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          💐 <strong>Mother's Day is May 10th</strong> — Create Mom's card now, it only takes 2 minutes.
        </p>
        <Link to="/dashboard/create" className="btn btn-primary btn-mday" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
          Make Her Card
        </Link>
      </div>

      {/* Card list */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ margin: 0 }}>Your Cards {!loading && cards.length > 0 && <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>({cards.length})</span>}</h2>
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-panel" style={{ width: '300px', height: '160px', opacity: 0.4, borderRadius: '0.75rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
          <style>{`@keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.6} }`}</style>
        </div>
      ) : cards.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {cards.map(card => (
            <div key={card.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {occasionEmoji[card.occasion?.toLowerCase()] || '🎉'} {card.occasion} Card
                  </h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: 0 }}>
                    {new Date(card.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => card.id && handleDelete(card.id)}
                  disabled={deletingId === card.id}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,107,107,0.6)', cursor: 'pointer', padding: '0.25rem', flexShrink: 0 }}
                  title="Delete card"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                "{card.message}"
              </p>

              {card.audioUrl && (
                <audio controls src={card.audioUrl} style={{ width: '100%', height: '32px' }} />
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                {card.id && <ShareButton cardId={card.id} />}
                {card.id && (
                  <Link
                    to={`/card/${card.id}`}
                    target="_blank"
                    className="btn btn-outline"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Share2 size={14} /> Preview
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎙️</div>
          <h3 style={{ marginBottom: '0.75rem' }}>No cards yet</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
            Your first voice card takes less than 2 minutes. Record your voice, pick an occasion, and share the link.
          </p>
          <Link to="/dashboard/create" className="btn btn-primary btn-mday">
            🌸 Create Your First Card
          </Link>
        </div>
      )}
    </div>
  );
};

// ── Settings Page ─────────────────────────────────────────────────────────────
const SettingsPage = () => {
  const { user } = useAuth();
  const { tier, tierLabel, tierPrice, isFreeTier } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState<'plus' | 'pro' | null>(null);
  const [checkoutError, setCheckoutError] = useState('');

  const startCheckout = async (selectedTier: 'plus' | 'pro') => {
    if (!user) return;
    setCheckoutLoading(selectedTier);
    setCheckoutError('');
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedTier,
          userId: user.uid,
          userEmail: user.email || '',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Could not start checkout. Please try again.');
      }
      // Redirect to Stripe Checkout (same tab)
      window.location.href = data.url;
    } catch (err: any) {
      setCheckoutError(err.message || 'Something went wrong. Please try again.');
      setCheckoutLoading(null);
    }
  };

  const STRIPE_PORTAL = 'https://billing.stripe.com/p/login/test_00g00000000000000000'; // replaced at runtime via env if needed

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Account Settings</h2>

      {/* Account info */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem', maxWidth: '600px', marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Account</h3>
        <p style={{ color: 'var(--color-text-muted)', margin: '0 0 0.5rem', fontSize: '0.9rem' }}>
          <strong style={{ color: 'var(--color-text)' }}>Name:</strong> {user?.displayName || '—'}
        </p>
        <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' }}>
          <strong style={{ color: 'var(--color-text)' }}>Email:</strong> {user?.email || '—'}
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', maxWidth: '600px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
          <CreditCard size={20} /> Subscription
        </h3>
        <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Secure billing via Stripe. Cancel anytime.
        </p>

        {/* Current plan badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.08)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          <div>
            <strong>Current Plan: {tierLabel}</strong>
            {tier !== 'free' && (
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-accent)', marginTop: '0.25rem' }}>✓ Active</span>
            )}
            {tier === 'free' && (
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                2 cards/month · 60s recordings · Manual sharing only
              </span>
            )}
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: tier === 'free' ? 'var(--color-text-muted)' : 'var(--color-accent)' }}>
            {tierPrice}
          </span>
        </div>

        {checkoutError && (
          <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#ff6b6b' }}>
            ⚠️ {checkoutError}
          </div>
        )}

        {isFreeTier ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Plan comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Plus card */}
              <div style={{ background: 'linear-gradient(135deg, rgba(138,43,226,0.12), rgba(192,132,252,0.08))', border: '1px solid rgba(138,43,226,0.25)', borderRadius: '0.75rem', padding: '1.25rem' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Plus</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>$4.99<span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--color-text-muted)' }}>/mo</span></div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem', fontSize: '0.825rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li>✓ Email delivery</li>
                  <li>✓ 5-min recordings</li>
                  <li>✓ 10 cards/month</li>
                  <li>✓ Scheduled sending</li>
                </ul>
                <button
                  onClick={() => startCheckout('plus')}
                  disabled={checkoutLoading !== null}
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '0.85rem', padding: '0.6rem' }}
                >
                  {checkoutLoading === 'plus' ? 'Redirecting…' : 'Upgrade to Plus'}
                </button>
              </div>

              {/* Pro card */}
              <div style={{ background: 'linear-gradient(135deg, rgba(232,82,122,0.12), rgba(255,183,77,0.08))', border: '1px solid rgba(232,82,122,0.3)', borderRadius: '0.75rem', padding: '1.25rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-10px', right: '12px', background: 'var(--color-warm)', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '1rem', textTransform: 'uppercase' }}>
                  Best Value
                </div>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Pro</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-secondary)', marginBottom: '0.75rem' }}>$9.99<span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--color-text-muted)' }}>/mo</span></div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem', fontSize: '0.825rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li>✓ Everything in Plus</li>
                  <li>✓ Unlimited cards</li>
                  <li>✓ Voice Vault</li>
                  <li>✓ Priority support</li>
                </ul>
                <button
                  onClick={() => startCheckout('pro')}
                  disabled={checkoutLoading !== null}
                  className="btn btn-primary btn-mday"
                  style={{ width: '100%', fontSize: '0.85rem', padding: '0.6rem' }}
                >
                  {checkoutLoading === 'pro' ? 'Redirecting…' : 'Upgrade to Pro'}
                </button>
              </div>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0', textAlign: 'center' }}>
              🔒 Secured by Stripe. Cancel anytime — no questions asked.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Your {tierLabel} subscription is active. Use the Stripe portal to update payment info, view invoices, or cancel.
            </p>
            <a
              href={STRIPE_PORTAL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ display: 'inline-flex', gap: '0.5rem', alignSelf: 'flex-start' }}
            >
              Manage Billing in Stripe <ExternalLink size={14} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Dashboard Shell ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const { logout } = useAuth();
  const { tierLabel } = useSubscription();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <AuthGuard>
      <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh' }}>
        <aside className="sidebar glass-panel" style={{ width: '240px', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid rgba(255,255,255,0.08)', borderRadius: 0, flexShrink: 0 }}>
          <div>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <div className="logo" style={{ padding: '0 0.5rem', marginBottom: '2rem' }}>
                <span style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>Voices</span>
                <span style={{ color: 'var(--color-secondary)' }}>YouKeep</span>
                <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{tierLabel} Plan</span>
              </div>
            </Link>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <Link to="/dashboard" className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none', background: 'rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                Overview
              </Link>
              <Link to="/dashboard/create" className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none', fontSize: '0.9rem' }}>
                <PlusCircle size={16} /> Create Card
              </Link>
              <Link to="/dashboard/vault" className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none', fontSize: '0.9rem' }}>
                <Heart size={16} /> Voice Vault
              </Link>
              <Link to="/dashboard/settings" className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none', fontSize: '0.9rem' }}>
                <Settings size={16} /> Settings
              </Link>
            </nav>
          </div>
          <button onClick={handleLogout} className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none', color: 'rgba(255,107,107,0.8)', width: '100%', fontSize: '0.9rem' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </aside>

        <main style={{ flex: 1, background: 'var(--color-bg)', overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/create" element={<CreateCard />} />
            <Route path="/vault" element={<Vault />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </AuthGuard>
  );
};

export default Dashboard;
