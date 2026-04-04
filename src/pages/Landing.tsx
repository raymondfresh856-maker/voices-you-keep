import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mic, Heart, Gift, ShieldCheck, Mail, Clock } from 'lucide-react';

const MOTHERS_DAY = new Date('2026-05-10T00:00:00');

const Countdown = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const diff = MOTHERS_DAY.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="countdown-wrapper">
      {(['days', 'hours', 'minutes', 'seconds'] as const).map(unit => (
        <div key={unit} className="countdown-unit">
          <span className="countdown-number">{String(timeLeft[unit]).padStart(2, '0')}</span>
          <span className="countdown-label">{unit}</span>
        </div>
      ))}
    </div>
  );
};

const Landing = () => {
  return (
    <div className="landing-page">
      {/* Mother's Day Banner */}
      <div className="mday-banner">
        💐 Mother's Day is May 10th — Give Mom a voice message she'll treasure forever 💐
      </div>

      <nav className="navbar">
        <div className="logo">
          <span style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '1.5rem' }}>Voices</span>
          <span style={{ color: 'var(--color-secondary)' }}>YouKeep</span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <Link to="/auth" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>Sign In</Link>
        </div>
      </nav>

      <main>
        {/* HERO */}
        <header className="hero hero-mday">
          <div className="hero-mday-bg" aria-hidden="true">
            {['🌸','💐','🌹','🌷','💕','🌸','💐','🌹','🌷','💕','🌸','💐'].map((e, i) => (
              <span
                key={i}
                className="hero-float-emoji"
                style={{ '--delay': `${i * 0.4}s`, '--x': `${8 + i * 7.5}%` } as React.CSSProperties}
              >
                {e}
              </span>
            ))}
          </div>
          <div className="hero-content">
            <div className="mday-pill">🌺 Mother's Day · May 10th, 2026</div>
            <h1>Tell Mom you love her<br/><span className="hero-gradient-text">in your own voice.</span></h1>
            <p className="hero-sub">
              Create a beautiful interactive card with your real voice. She opens the envelope,
              flowers and hearts burst out, and your message plays — a gift she can replay forever.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Countdown to Mother's Day
              </p>
              <Countdown />
            </div>

            <div className="hero-actions">
              <Link to="/auth" className="btn btn-primary btn-large btn-mday">
                🌸 Create Mom's Card — Free
              </Link>
              <a href="#how-it-works" className="btn btn-outline btn-large">See How It Works</a>
            </div>

            <p className="hero-trust">No credit card required &nbsp;·&nbsp; Ready in 2 minutes &nbsp;·&nbsp; Delivered by email</p>
          </div>
        </header>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="how-it-works-section">
          <h2>Three steps to make her cry — the happy kind 😭💕</h2>
          <div className="steps-grid">
            <div className="step-card glass-panel">
              <div className="step-number">1</div>
              <Mic size={36} color="var(--color-primary)" />
              <h3>Record your voice</h3>
              <p>Speak from the heart. Tell her what she means to you — no scripts, no filters, just you.</p>
            </div>
            <div className="step-card glass-panel">
              <div className="step-number">2</div>
              <Gift size={36} color="var(--color-secondary)" />
              <h3>Pick a beautiful template</h3>
              <p>Choose Mother's Day, Birthday, and more — each with a stunning confetti explosion when opened.</p>
            </div>
            <div className="step-card glass-panel">
              <div className="step-number">3</div>
              <Mail size={36} color="var(--color-warm)" />
              <h3>Send or schedule</h3>
              <p>Share a link by text, or schedule email delivery so it lands in her inbox on the morning of May 10th.</p>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="features-section">
          <h2>Why moms love Voices You Keep</h2>
          <div className="feature-grid">
            <div className="feature-card glass-panel">
              <Gift size={32} color="var(--color-secondary)" />
              <h3>Interactive Envelopes</h3>
              <p>She taps to open — the flap lifts, flowers and hearts explode — then your voice fills the room.</p>
            </div>
            <div className="feature-card glass-panel">
              <Mic size={32} color="var(--color-primary)" />
              <h3>Real Voice Messages</h3>
              <p>Not text, not emojis — your actual voice. It plays automatically the moment she opens the card.</p>
            </div>
            <div className="feature-card glass-panel">
              <Heart size={32} color="var(--color-warm)" />
              <h3>The Voice Vault</h3>
              <p>Save precious voicemails from loved ones forever. A gift that only grows more valuable with time.</p>
            </div>
            <div className="feature-card glass-panel">
              <Clock size={32} color="var(--color-accent)" />
              <h3>Scheduled Delivery</h3>
              <p>Set it and forget it. Schedule the card to arrive in her inbox at exactly the right moment on May 10th.</p>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="testimonial-section">
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Moms are crying happy tears 💕</h2>
          <div className="testimonial-strip">
            <div className="testimonial-card glass-panel">
              <p>"My mom called me sobbing — in the best way. She said she played it 10 times."</p>
              <span>— Darnell T.</span>
            </div>
            <div className="testimonial-card glass-panel">
              <p>"So much more personal than a text. The envelope animation made her entire day."</p>
              <span>— Maria S.</span>
            </div>
            <div className="testimonial-card glass-panel">
              <p>"I'm keeping every card my kids send me in the Voice Vault. Forever."</p>
              <span>— Karen M., a very happy mom 🌸</span>
            </div>
          </div>
        </section>

        {/* PRIVACY */}
        <section className="privacy-banner">
          <ShieldCheck size={48} color="var(--color-accent)" />
          <div>
            <h3>Mom's voice stays with you — always.</h3>
            <p>We will <strong>NEVER</strong> share, sell, or use your voice data for AI training. Your family's voices are sacred, and we treat them that way.</p>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="pricing-section">
          <div className="pricing-header">
            <div className="mday-pill" style={{ marginBottom: '1rem' }}>🌸 Perfect Mother's Day Gift</div>
            <h2>Start free — upgrade for the full experience</h2>
            <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
              Give Mom something money can't buy — your voice — starting at $0.
            </p>
          </div>
          <div className="pricing-grid">
            <div className="price-card glass-panel">
              <h3>Free</h3>
              <div className="price">$0</div>
              <ul>
                <li>✓ 2 Greeting Cards/month</li>
                <li>✓ 60-sec voice recording</li>
                <li>✓ Interactive envelope animation</li>
                <li>✓ Share by link</li>
                <li style={{ color: 'var(--color-text-muted)' }}>· Voices You Keep™ Watermark</li>
              </ul>
              <Link to="/auth" className="btn btn-outline">Get Started Free</Link>
            </div>

            <div className="price-card glass-panel popular">
              <div className="badge">💐 Most Popular</div>
              <h3>Plus</h3>
              <div className="price">$4.99<span>/mo</span></div>
              <ul>
                <li>✓ Unlimited Greeting Cards</li>
                <li>✓ 5-minute voice recording</li>
                <li>✓ Full template library</li>
                <li>✓ Scheduled email delivery</li>
                <li>✓ No watermark</li>
              </ul>
              {import.meta.env.VITE_STRIPE_PLUS_LINK ? (
                <a href={import.meta.env.VITE_STRIPE_PLUS_LINK} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-mday">
                  🌸 Choose Plus
                </a>
              ) : (
                <Link to="/auth" className="btn btn-primary btn-mday">Choose Plus</Link>
              )}
            </div>

            <div className="price-card glass-panel">
              <h3>Pro</h3>
              <div className="price">$9.99<span>/mo</span></div>
              <ul>
                <li>✓ Everything in Plus</li>
                <li>✓ <strong>Voice Vault</strong> — save voicemails forever</li>
                <li>✓ <strong>Photo Animation</strong> — animate photos to voice</li>
                <li>✓ Priority support</li>
              </ul>
              {import.meta.env.VITE_STRIPE_PRO_LINK ? (
                <a href={import.meta.env.VITE_STRIPE_PRO_LINK} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  Choose Pro
                </a>
              ) : (
                <Link to="/auth" className="btn btn-primary">Choose Pro</Link>
              )}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="final-cta-section">
          <div className="final-cta-content glass-panel">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💐</div>
            <h2>Don't let Mother's Day pass with just a text.</h2>
            <p>She deserves to hear your voice. Give her something she'll keep forever.</p>
            <Link to="/auth" className="btn btn-primary btn-large btn-mday" style={{ marginTop: '1.5rem' }}>
              🌸 Create Her Card Now — It's Free
            </Link>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '1rem' }}>
              Mother's Day is May 10th · Ready in under 2 minutes
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; 2026 Voices You Keep&#8482;. All Rights Reserved.</p>
        <p className="privacy-note">Privacy First: We never sell or train on your voice data. 🌸</p>
      </footer>
    </div>
  );
};

export default Landing;
