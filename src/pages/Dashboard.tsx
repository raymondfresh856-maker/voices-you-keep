import React, { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Heart, Settings, PlusCircle, LogOut, CreditCard, ExternalLink, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { dbService } from '../services/backend';
import type { CardData } from '../services/backend';

import CreateCard from './CreateCard';
import Vault from './Vault';

const STRIPE_PRO_LINK = 'https://buy.stripe.com/fZu00j9cF73k4zI4a57ss02';
const STRIPE_PRO_PLUS_LINK = 'https://buy.stripe.com/fZudR9ewZ5Zggiq0XT7ss03';

const DashboardHome = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      dbService.getUserCards(user.uid).then(fetchedCards => {
        setCards(fetchedCards);
        setLoading(false);
      });
    } else {
      setTimeout(() => setLoading(false), 0);
    }
  }, [user]);

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>Welcome to Voices You Keep, {user?.displayName || 'Guest'}</h1>
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <Link to="/dashboard/create" className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
          <PlusCircle size={48} color="var(--color-primary)" />
          <h3>Create New Card</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Record a message and pick an interactive template.</p>
        </Link>
        <Link to="/dashboard/vault" className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
          <Heart size={48} color="var(--color-warm)" />
          <h3>The Voice Vault (Pro Plus)</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Upload and permanently save voicemails from loved ones.</p>
        </Link>
      </div>
      <h2 style={{ marginBottom: '1.5rem' }}>Your Created Cards</h2>
      {loading ? (
        <p>Loading cards...</p>
      ) : cards.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {cards.map(card => (
            <div key={card.id} className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ textTransform: 'capitalize', marginBottom: '0.5rem' }}>{card.occasion} Card</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>{new Date(card.createdAt).toLocaleDateString()}</p>
              <p style={{ marginBottom: '1rem', fontStyle: 'italic' }}>"{card.message}"</p>
              {card.audioUrl && (
                <audio controls src={card.audioUrl} style={{ width: '100%', height: '32px' }} />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>You haven't created any cards yet.</p>
        </div>
      )}
    </div>
  );
};

const SettingsPage = () => {
  const { tier, tierLabel, tierPrice, isFreeTier, isProTier, isProPlusTier } = useSubscription();

  return (
    <div style={{padding:'2rem'}}>
      <h2>Account Settings</h2>
      <div className="glass-panel" style={{padding: '2rem', marginTop: '2rem', maxWidth: '600px'}}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CreditCard size={20} /> Subscription
        </h3>
        <p style={{marginBottom: '1rem', color: 'var(--color-text-muted)'}}>Manage your plan and billing below.</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          <div>
            <strong>Current Plan: {tierLabel}</strong>
            {tier !== 'free' && <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-accent)', marginTop: '0.25rem' }}>Active</span>}
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{tierPrice}</span>
        </div>
        {isFreeTier && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Upgrade to unlock unlimited cards, email delivery, and the Voice Vault.</p>
            <a href={STRIPE_PRO_LINK} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', gap: '0.5rem' }}>
              Upgrade to Pro — $14.99/mo <ExternalLink size={14} />
            </a>
            <a href={STRIPE_PRO_PLUS_LINK} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: 'inline-flex', gap: '0.5rem' }}>
              <Star size={14} /> Go Pro Plus Lifetime — $27.99 once <ExternalLink size={14} />
            </a>
          </div>
        )}
        {isProTier && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Upgrade to Pro Plus for lifetime access and the Voice Vault — no more monthly charges.</p>
            <a href={STRIPE_PRO_PLUS_LINK} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', gap: '0.5rem' }}>
              <Star size={14} /> Upgrade to Pro Plus Lifetime — $27.99 <ExternalLink size={14} />
            </a>
          </div>
        )}
        {isProPlusTier && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'rgba(255,215,0,0.1)', borderRadius: '0.5rem', border: '1px solid rgba(255,215,0,0.3)' }}>
            <Star size={20} color="gold" fill="gold" />
            <p style={{ margin: 0, fontSize: '0.95rem' }}>You have lifetime access. Thank you for your support!</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { logout } = useAuth();
  const { tierLabel } = useSubscription();

  return (
    <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh' }}>
      <aside className="sidebar glass-panel" style={{ width: '250px', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid rgba(255,255,255,0.1)', borderRadius: 0 }}>
        <div>
          <div className="logo" style={{ padding: '0 1rem', marginBottom: '2rem' }}>
            <span style={{color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '1.2rem'}}>Voices</span>
            <span style={{color: 'var(--color-secondary)'}}>YouKeep</span>
            <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', paddingLeft: '0.1rem' }}>{tierLabel} Plan</span>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link to="/dashboard" className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none', background: 'rgba(255,255,255,0.05)' }}>Overview</Link>
            <Link to="/dashboard/create" className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none' }}><PlusCircle size={18} /> Create Card</Link>
            <Link to="/dashboard/vault" className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none' }}><Heart size={18} /> Voice Vault</Link>
            <Link to="/dashboard/settings" className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none' }}><Settings size={18} /> Settings / Billing</Link>
          </nav>
        </div>
        <button onClick={logout} className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none', color: '#ff6b6b', width: '100%' }}>
          <LogOut size={18} /> Sign Out
        </button>
      </aside>
      <main style={{ flex: 1, background: 'var(--color-bg)' }}>
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/create" element={<CreateCard />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;
