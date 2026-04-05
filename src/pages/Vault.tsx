import React, { useEffect, useState, useRef } from 'react';
import { UploadCloud, Trash2, Mic, Lock, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { dbService, storageService } from '../services/backend';
import type { CardData } from '../services/backend';

const Vault = () => {
  const { user } = useAuth();
  const { isProTier } = useSubscription();
  const [recordings, setRecordings] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      dbService.getUserCards(user.uid).then(fetchedCards => {
        setRecordings(fetchedCards.filter(c => c.audioUrl && c.occasion === 'vault upload'));
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  const reloadRecordings = async () => {
    if (!user) return;
    const fetchedCards = await dbService.getUserCards(user.uid);
    setRecordings(fetchedCards.filter(c => c.audioUrl && c.occasion === 'vault upload'));
  };

  const processFile = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith('audio/')) {
      alert('Please upload an audio file.');
      return;
    }
    try {
      const url = await storageService.uploadAudio(file, `vault/${user.uid}_${Date.now()}_${file.name}`);
      await dbService.saveCard({
        userId: user.uid,
        occasion: 'vault upload',
        message: file.name,
        audioUrl: url,
        createdAt: Date.now()
      });
      await reloadRecordings();
    } catch (error) {
      console.error(error);
      alert('Failed to upload file. Please try again.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    await processFile(e.target.files[0]);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleDelete = async (rec: CardData) => {
    if (!user || !rec.id) return;
    if (!window.confirm(`Delete "${rec.message}"? This cannot be undone.`)) return;
    setDeletingId(rec.id);
    try {
      if (rec.audioUrl) {
        await storageService.deleteAudio(`vault/${user.uid}_${rec.message}`);
      }
      await dbService.deleteCard(rec.id, user.uid);
      setRecordings(prev => prev.filter(r => r.id !== rec.id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (!user) return;
    const file = e.dataTransfer.files[0];
    if (file) await processFile(file);
  };

  // ── Pro gate ────────────────────────────────────────────────────────────────
  if (!isProTier) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            The Voice Vault
            <span style={{ fontSize: '0.6rem', padding: '0.2rem 0.5rem', background: 'var(--color-primary)', borderRadius: '1rem', textTransform: 'uppercase' }}>Pro</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>Permanently secure the voices of your loved ones.</p>
        </header>

        <div className="glass-panel" style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          border: '2px dashed rgba(138,43,226,0.3)',
          borderRadius: '1.25rem',
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔒</div>
          <Crown size={32} color="var(--color-primary)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '0.75rem' }}>The Voice Vault is a Pro Feature</h3>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
            Upgrade to Pro to permanently archive voicemails, audio recordings, and voice messages
            from the people you love — encrypted, private, and saved forever.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/dashboard/settings" className="btn btn-primary">
              🚀 Upgrade to Pro — $9.99/mo
            </Link>
            <Link to="/dashboard" className="btn btn-outline">
              Back to Dashboard
            </Link>
          </div>
          <p style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Pro includes unlimited storage · Voice Vault · Priority support
          </p>
        </div>
      </div>
    );
  }

  // ── Pro: full vault UI ──────────────────────────────────────────────────────
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            The Voice Vault
            <span style={{ fontSize: '0.6rem', padding: '0.2rem 0.5rem', background: 'var(--color-primary)', borderRadius: '1rem', textTransform: 'uppercase' }}>Pro</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>Permanently secure the voices of your loved ones.</p>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*" style={{ display: 'none' }} />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <UploadCloud size={18} /> Upload Audio
        </button>
      </header>

      <div className="glass-panel privacy-notice" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem', borderLeft: '4px solid var(--color-accent)' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <Lock size={16} color="var(--color-accent)" /> Guaranteed Privacy
        </h4>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
          Files uploaded to the Voice Vault are encrypted and stored permanently. They will <strong>never</strong> be
          analyzed, used for AI voice training, cloned, or shared with third parties.
        </p>
      </div>

      <div className="recordings-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Loading vault…</p>
        ) : recordings.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem 0' }}>
            No recordings yet. Upload your first audio file below.
          </p>
        ) : (
          recordings.map(rec => (
            <div
              key={rec.id}
              className="recording-item glass-panel"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', gap: '1rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                <div style={{ width: '40px', height: '40px', background: 'rgba(138,43,226,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mic size={20} color="var(--color-primary)" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.message}</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    {new Date(rec.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                {rec.audioUrl && (
                  <audio controls src={rec.audioUrl} style={{ height: '32px', maxWidth: '200px' }} />
                )}
                <button
                  className="btn btn-outline"
                  style={{ padding: '0.5rem', borderRadius: '50%', color: '#ff6b6b', borderColor: 'transparent', flexShrink: 0 }}
                  onClick={() => handleDelete(rec)}
                  disabled={deletingId === rec.id}
                  title="Delete recording"
                >
                  {deletingId === rec.id
                    ? <span style={{ fontSize: '0.7rem' }}>…</span>
                    : <Trash2 size={16} />
                  }
                </button>
              </div>
            </div>
          ))
        )}

        {/* Drag & drop zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="recording-item glass-panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            borderStyle: 'dashed',
            cursor: 'pointer',
            opacity: isDragOver ? 1 : 0.7,
            background: isDragOver ? 'rgba(138,43,226,0.1)' : undefined,
            borderColor: isDragOver ? 'var(--color-primary)' : undefined,
            transition: 'all 0.2s',
          }}
        >
          <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UploadCloud size={18} />
            {isDragOver ? 'Drop to upload' : 'Drag & drop a voicemail or audio file here, or click to browse'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Vault;
