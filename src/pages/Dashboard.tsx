import React, { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Heart, Settings, PlusCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/backend';
import type { CardData } from '../services/backend';

import CreateCard from './CreateCard';
import Vault from './Vault';

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
          <h3>The Voice Vault (Pro)</h3>
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

const Dashboard = () => {
  return (
    <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh' }}>
      <aside className="sidebar glass-panel" style={{ width: '250px', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '2rem', borderRight: '1px solid rgba(255,255,255,0.1)', borderRadius: 0 }}>
        <div className="logo" style={{ padding: '0 1rem' }}>
          <span style={{color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '1.2rem'}}>Voices</span>
          <span style={{color: 'var(--color-secondary)'}}>YouKeep</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link to="/dashboard" className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none', background: 'rgba(255,255,255,0.05)' }}>
            Overview
          </Link>
          <Link to="/dashboard/create" className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none' }}>
            <PlusCircle size={18} /> Create Card
          </Link>
          <Link to="/dashboard/vault" className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none' }}>
            <Heart size={18} /> Voice Vault
          </Link>
          <Link to="/dashboard/settings" className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none' }}>
            <Settings size={18} /> Settings / Stripe
          </Link>
        </nav>
      </aside>
      
      <main style={{ flex: 1, background: 'var(--color-bg)' }}>
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/create" element={<CreateCard />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/settings" element={
            <div style={{padding:'2rem'}}>
              <h2>Account Settings</h2>
              <div className="glass-panel" style={{padding: '2rem', marginTop: '2rem', maxWidth: '600px'}}>
                <h3>Subscription (Stripe)</h3>
                <p style={{marginBottom: '1rem'}}>Manage your billing via our secure Stripe integration.</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'white', color: 'black', borderRadius: '0.5rem' }}>
                  <strong>Current Plan: Plus</strong>
                  <span>$4.99/mo</span>
                </div>
                <a href={import.meta.env.VITE_STRIPE_CUSTOMER_PORTAL || '#'} target="_blank" rel="noreferrer" className="btn btn-primary" style={{marginTop: '1rem', display: 'inline-block'}}>
                  Manage Subscription in Stripe
                </a>
              </div>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;
