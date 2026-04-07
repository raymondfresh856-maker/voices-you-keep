import React, { useEffect, useState, useRef } from 'react';
import { UploadCloud, Trash2, Mic, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbService, storageService } from '../services/backend';
import type { CardData } from '../services/backend';

const Vault = () => {
  const { user } = useAuth();
  const [recordings, setRecordings] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      dbService.getUserCards(user.uid).then(fetchedCards => {
        setRecordings(fetchedCards.filter(c => c.audioUrl));
        setLoading(false);
      });
    } else {
      setTimeout(() => setLoading(false), 0);
    }
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    const file = e.target.files[0];
    try {
      const url = await storageService.uploadAudio(file, `vault/${user.uid}_${Date.now()}_${file.name}`);
      await dbService.saveCard({
        userId: user.uid,
        occasion: 'vault upload',
        message: file.name,
        audioUrl: url,
        createdAt: Date.now()
      });
      dbService.getUserCards(user.uid).then(fetchedCards => {
        setRecordings(fetchedCards.filter(c => c.audioUrl));
      });
    } catch (error) {
      console.error(error);
      alert("Failed to upload file");
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             The Voice Vault 
             <span style={{ fontSize: '0.6rem', padding: '0.2rem 0.5rem', background: 'var(--color-primary)', borderRadius: '1rem', textTransform: 'uppercase' }}>Pro Plus</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>Permanently secure the voices of your loved ones.</p>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*" style={{display: 'none'}} />
        <button onClick={() => fileInputRef.current?.click()} className="btn btn-primary"><UploadCloud size={18} /> Upload Audio</button>
      </header>

      <div className="glass-panel privacy-notice" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid var(--color-accent)' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Lock size={18} color="var(--color-accent)"/> Guaranteed Privacy
        </h4>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: 0 }}>
          Files uploaded to the Voice Vault are encrypted and stored permanently. They will <strong>never</strong> be analyzed, used for AI voice training, cloned, or shared with third parties.
        </p>
      </div>

      <div className="recordings-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? <p>Loading vault...</p> : recordings.map(rec => (
          <div key={rec.id} className="recording-item glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(138,43,226,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mic size={20} color="var(--color-primary)" />
              </div>
              <div>
                <h4 style={{ margin: 0 }}>{rec.occasion === 'vault upload' ? rec.message : `${rec.occasion} Card`}</h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{new Date(rec.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {rec.audioUrl && (
                <audio controls src={rec.audioUrl} style={{ height: '32px', maxWidth: '200px' }} />
              )}
              <button className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '50%', color: '#ff6b6b', borderColor: 'transparent' }}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
        <div onClick={() => fileInputRef.current?.click()} className="recording-item glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', borderStyle: 'dashed', cursor: 'pointer', opacity: 0.7 }}>
          <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UploadCloud size={18} /> Drag & drop a Voicemail or Audio file here
          </p>
        </div>
      </div>
    </div>
  );
};

export default Vault;
