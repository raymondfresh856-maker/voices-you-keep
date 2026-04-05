import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import VoiceRecorder from '../components/VoiceRecorder';
import InteractiveEnvelope from '../components/InteractiveEnvelope';
import { Send, Eye, CalendarClock, ArrowLeft, ShieldAlert, X, Copy, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { dbService, storageService, authService } from '../services/backend';

// ─── Inline Auth Modal ────────────────────────────────────────────────────────
interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(false); // default to sign-up since they're new
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // If auth succeeds externally (e.g. Google SSO), close and notify parent
  const prevUser = useRef(user);
  useEffect(() => {
    if (!prevUser.current && user) {
      onSuccess();
    }
    prevUser.current = user;
  }, [user, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await authService.login(email, password);
      } else {
        await authService.register(email, password, name);
      }
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      await authService.loginGoogle();
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '2rem', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        {/* Card preview summary */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(232,82,122,0.15), rgba(192,132,252,0.15))',
          border: '1px solid rgba(232,82,122,0.3)',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1.5rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
          <p style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Your card is ready!</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Create a free account (or sign in) to save and share it.
          </p>
        </div>

        <h3 style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          {isLogin ? 'Sign in to save your card' : 'Create your free account'}
        </h3>

        {error && (
          <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-surface-light)', background: 'var(--color-bg)', color: 'white', boxSizing: 'border-box' }}
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-surface-light)', background: 'var(--color-bg)', color: 'white', boxSizing: 'border-box' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-surface-light)', background: 'var(--color-bg)', color: 'white', boxSizing: 'border-box' }}
          />
          <button
            type="submit"
            className="btn btn-primary btn-mday"
            disabled={loading}
            style={{ marginTop: '0.25rem' }}
          >
            {loading ? 'Please wait…' : isLogin ? 'Sign In & Save Card' : 'Create Account & Save Card'}
          </button>
        </form>

        <div style={{ margin: '1rem 0', textAlign: 'center', position: 'relative' }}>
          <span style={{ background: 'var(--color-surface)', padding: '0 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', position: 'relative', zIndex: 1 }}>or</span>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--color-surface-light)' }} />
        </div>

        <button onClick={handleGoogle} className="btn btn-outline" disabled={loading} style={{ width: '100%', display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '1rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>

        <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: 'rgba(144,238,144,0.08)', borderRadius: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
          <ShieldAlert color="var(--color-accent)" size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
            <strong>100% Secure.</strong> Your voice is never shared for AI training or marketing.
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── CreateCard ───────────────────────────────────────────────────────────────
interface CreateCardProps {
  isPublic?: boolean; // true when rendered at /create directly (no dashboard sidebar)
}

const CreateCard: React.FC<CreateCardProps> = ({ isPublic = false }) => {
  const [occasion, setOccasion] = useState("mother's day");
  const [message, setMessage] = useState('Happy Mother\'s Day! I love you so much. 💕');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('manual');
  const [previewMode, setPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedCardId, setSavedCardId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);

  const { user } = useAuth();
  const { isFreeTier } = useSubscription();
  const navigate = useNavigate();

  const shareUrl = savedCardId ? `${window.location.origin}/card/${savedCardId}` : '';

  const copyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback: select a text input
      const input = document.getElementById('share-link-input') as HTMLInputElement | null;
      if (input) { input.select(); document.execCommand('copy'); }
    }
  };

  const handleRecordingComplete = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setAudioBlob(blob);
    setAudioUrl(url);
  };

  const performSave = useCallback(async (currentUser: NonNullable<typeof user>) => {
    setIsSaving(true);
    setSaveError('');
    try {
      let finalAudioUrl = '';
      if (audioBlob) {
        finalAudioUrl = await storageService.uploadAudio(
          audioBlob,
          `cards/${currentUser.uid}_${Date.now()}.webm`
        );
      }

      const newCardId = await dbService.saveCard({
        userId: currentUser.uid,
        occasion,
        message,
        audioUrl: finalAudioUrl,
        createdAt: Date.now(),
      });

      if (deliveryMethod === 'email' && recipientEmail) {
        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientEmail,
              cardId: newCardId,
              senderName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Someone',
              occasion,
            }),
          });
        } catch (err) {
          console.warn('Email dispatch failed:', err);
        }
      }

      // Show share link instead of immediately navigating away
      setSavedCardId(newCardId);
      setPreviewMode(false); // return to edit/share view
    } catch (e) {
      console.error(e);
      setSaveError('Failed to save your card. Please try again.');
    } finally {
      setIsSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob, occasion, message, deliveryMethod, recipientEmail]);

  // After signing in via the modal, auto-complete the pending save
  useEffect(() => {
    if (user && pendingSave) {
      setPendingSave(false);
      setShowAuthModal(false);
      performSave(user);
    }
  }, [user, pendingSave, performSave]);

  const handleSend = () => {
    if (!user) {
      setPendingSave(true);
      setShowAuthModal(true);
      return;
    }
    performSave(user);
  };

  const handleAuthSuccess = () => {
    // pendingSave + user state change in useEffect above handles the rest
    // but if user is already set by the time we get here, fire directly
    if (user) {
      setPendingSave(false);
      setShowAuthModal(false);
      performSave(user);
    }
    // else wait for useEffect to detect the new user
  };

  // ── Preview mode ──────────────────────────────────────────────────────────
  if (previewMode) {
    return (
      <>
        {showAuthModal && (
          <AuthModal
            onClose={() => { setShowAuthModal(false); setPendingSave(false); }}
            onSuccess={handleAuthSuccess}
          />
        )}
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', background: 'var(--color-bg)' }}>
          <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <button onClick={() => setPreviewMode(false)} className="btn btn-outline" disabled={isSaving}>
              <ArrowLeft size={16} /> Back to Edit
            </button>
            <button onClick={handleSend} className="btn btn-primary btn-mday" disabled={isSaving}>
              <Send size={18} />
              {isSaving ? 'Saving…' : user ? 'Save & Share' : 'Save Card (Free)'}
            </button>
          </div>

          {!user && (
            <div style={{
              width: '100%', maxWidth: '800px',
              background: 'linear-gradient(135deg, rgba(232,82,122,0.12), rgba(192,132,252,0.12))',
              border: '1px solid rgba(232,82,122,0.25)',
              borderRadius: '0.75rem',
              padding: '0.875rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                💌 Love your card? <strong>Save it free</strong> — no credit card needed.
              </p>
              <button onClick={() => { setPendingSave(true); setShowAuthModal(true); }} className="btn btn-primary btn-mday" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
                Create Free Account
              </button>
            </div>
          )}

          <h2 style={{ marginBottom: '1.5rem' }}>Your Card Preview</h2>
          <InteractiveEnvelope occasion={occasion} message={message} audioBlobUrl={audioUrl} />
        </div>
      </>
    );
  }

  // ── Edit mode ─────────────────────────────────────────────────────────────
  return (
    <>
      {showAuthModal && (
        <AuthModal
          onClose={() => { setShowAuthModal(false); setPendingSave(false); }}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* Minimal top bar when accessed publicly (not inside dashboard) */}
      {isPublic && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 2rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'var(--color-surface)',
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}>
            <span style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '1.25rem' }}>Voices</span>
            <span style={{ color: 'var(--color-secondary)' }}>YouKeep</span>
          </Link>
          {user ? (
            <Link to="/dashboard" className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
              Dashboard
            </Link>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
              Sign In
            </button>
          )}
        </div>
      )}

      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>

        {/* ── Success / share banner ── */}
        {savedCardId && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(64,224,208,0.12), rgba(138,43,226,0.12))',
            border: '1px solid rgba(64,224,208,0.35)',
            borderRadius: '1rem',
            padding: '1.5rem 1.75rem',
            marginBottom: '1.75rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🎉</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Card saved! Share it now.</h3>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Copy the link below and send it to {recipientEmail || 'whoever you want'}. They'll see the envelope and hear your voice.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                id="share-link-input"
                readOnly
                value={shareUrl}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '0.6rem 0.875rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(64,224,208,0.3)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--color-text)',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                }}
                onFocus={e => e.target.select()}
              />
              <button
                onClick={copyShareLink}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem' }}
              >
                {copiedLink ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy Link</>}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}
              >
                View Dashboard <ArrowRight size={14} />
              </button>
              <button
                onClick={() => { setSavedCardId(null); setAudioBlob(null); setAudioUrl(undefined); setMessage("Happy Mother's Day! I love you so much. 💕"); setRecipientEmail(''); }}
                className="btn btn-outline"
                style={{ fontSize: '0.875rem' }}
              >
                + Make Another Card
              </button>
            </div>
          </div>
        )}

        {/* Save error */}
        {saveError && (
          <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#ff6b6b', fontSize: '0.875rem' }}>
            ⚠️ {saveError}
          </div>
        )}

        {/* Guest banner */}
        {!user && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(232,82,122,0.1), rgba(192,132,252,0.1))',
            border: '1px solid rgba(232,82,122,0.2)',
            borderRadius: '0.75rem',
            padding: '0.875rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: '1.25rem' }}>🎁</span>
            <p style={{ margin: 0, fontSize: '0.9rem', flex: 1 }}>
              <strong>No sign-in needed to start.</strong> Record your voice, pick an occasion, preview your card — sign in only when you're ready to save.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2>Create Your Voice Card</h2>
          <button
            onClick={() => setPreviewMode(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Eye size={18} /> Preview Card
          </button>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Occasion</label>
            <select
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--color-surface)', color: 'white', border: '1px solid var(--color-surface-light)' }}
            >
              <option value="mother's day">Mother's Day 💐</option>
              <option value="birthday">Birthday 🎂</option>
              <option value="graduation">Graduation 🎓</option>
              <option value="father's day">Father's Day 🏆</option>
              <option value="christmas">Christmas 🎄</option>
              <option value="new years">New Years 🥂</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Written Message</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write something from the heart…"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--color-surface)', color: 'white', border: '1px solid var(--color-surface-light)', resize: 'vertical' }}
            />
          </div>

          <VoiceRecorder onRecordingComplete={handleRecordingComplete} maxDurationSeconds={isFreeTier ? 60 : 300} />

          <div className="delivery-options" style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <CalendarClock size={20} /> Delivery Method
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="radio" name="delivery" checked={deliveryMethod === 'manual'} onChange={() => setDeliveryMethod('manual')} />
                Send Manually (share the link from your dashboard)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isFreeTier ? 0.5 : 1 }}>
                <input type="radio" name="delivery" disabled={isFreeTier} checked={deliveryMethod === 'email'} onChange={() => setDeliveryMethod('email')} />
                Deliver via Email instantly
                {isFreeTier && <span style={{ color: 'var(--color-warm)', fontSize: '0.8rem' }}>(Plus/Pro feature)</span>}
              </label>

              {deliveryMethod === 'email' && (
                <div style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <input
                    type="email"
                    placeholder="Recipient's email address"
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--color-bg)', color: 'white', border: '1px solid var(--color-surface-light)' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom action bar */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button onClick={() => setPreviewMode(true)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Eye size={16} /> Preview First
          </button>
          <button onClick={handleSend} className="btn btn-primary btn-mday" disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={16} />
            {isSaving ? 'Saving…' : user ? 'Save & Share' : 'Save Card — It\'s Free'}
          </button>
        </div>
      </div>
    </>
  );
};

export default CreateCard;
