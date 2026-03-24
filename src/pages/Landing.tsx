import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, Heart, Gift, Shield, Star, ShieldCheck } from 'lucide-react';

const Landing = () => {
  return (
    <div className="landing-page">
      <nav className="navbar">
        <div className="logo">
          <span style={{color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '1.5rem'}}>Voices</span>
          <span style={{color: 'var(--color-secondary)'}}>YouKeep</span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <Link to="/auth" className="btn btn-primary" style={{padding: '0.5rem 1rem'}}>Sign In</Link>
        </div>
      </nav>

      <main>
        <header className="hero">
          <div className="hero-content">
            <h1>Preserve their voice.<br/>Gift an experience.</h1>
            <p>Create interactive digital greeting cards powered by your voice. Keep the voices of loved ones safe forever with our Voice Vault.</p>
            <div className="hero-actions">
              <Link to="/auth" className="btn btn-primary btn-large">Start Creating Free</Link>
            </div>
          </div>
        </header>

        <section id="features" className="features-section">
          <h2>Why Voices You Keep?</h2>
          <div className="feature-grid">
            <div className="feature-card glass-panel">
              <Gift size={32} color="var(--color-secondary)" />
              <h3>Interactive Interactive Envelopes</h3>
              <p>Drag the card out to reveal themed particle explosions—confetti, candy canes, and more!</p>
            </div>
            <div className="feature-card glass-panel">
              <Mic size={32} color="var(--color-primary)" />
              <h3>Voice Messages</h3>
              <p>Speak from the heart. Audio auto-plays when the immersive greeting card is opened.</p>
            </div>
            <div className="feature-card glass-panel">
              <Heart size={32} color="var(--color-warm)" />
              <h3>The Voice Vault</h3>
              <p>Upload precious voicemails of loved ones to preserve them permanently and securely.</p>
            </div>
          </div>
        </section>

        <section className="privacy-banner">
          <ShieldCheck size={48} color="var(--color-accent)" />
          <div>
            <h3>Your Voice is 100% Secure</h3>
            <p>We believe in privacy. We will NEVER share your voice data for AI training, marketing, or any third-party commercial use. Your loved ones' voices stay securely with you.</p>
          </div>
        </section>

        <section id="pricing" className="pricing-section">
          <h2>Choose Your Tier</h2>
          <div className="pricing-grid">
            <div className="price-card glass-panel">
              <h3>Free</h3>
              <div className="price">$0</div>
              <ul>
                <li>2 Greeting Cards per month</li>
                <li>60 second voice recording limit</li>
                <li>Limited dynamic templates</li>
                <li>Manual sending</li>
                <li>Voices You Keep™ Watermark</li>
              </ul>
              <Link to="/auth" className="btn btn-outline">Current Plan</Link>
            </div>
            
            <div className="price-card glass-panel popular">
              <div className="badge">Most Popular</div>
              <h3>Plus</h3>
              <div className="price">$4.99<span>/mo</span></div>
              <ul>
                <li>Unlimited Greeting Cards</li>
                <li>5 minute voice recording</li>
                <li>Full template library access</li>
                <li>Scheduled delivery via Email</li>
                <li>Remove Watermark</li>
              </ul>
              <Link to="/auth" className="btn btn-primary">Choose Plus</Link>
            </div>

            <div className="price-card glass-panel">
              <h3>Pro</h3>
              <div className="price">$9.99<span>/mo</span></div>
              <ul>
                <li>All Plus Features</li>
                <li><strong>The Voice Vault:</strong> Securely save older voicemails</li>
                <li><strong>Photo Animation:</strong> Animate photos to recorded voices</li>
              </ul>
              <Link to="/auth" className="btn btn-primary">Choose Pro</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; 2026 Voices You Keep™. All Rights Reserved.</p>
        <p className="privacy-note">Privacy First: We never sell or train on your voice data.</p>
      </footer>
    </div>
  );
};

export default Landing;
