import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VoiceRecorder from '../components/VoiceRecorder';
import InteractiveEnvelope from '../components/InteractiveEnvelope';
import { Send, Eye, CalendarClock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbService, storageService } from '../services/backend';

const CreateCard = () => {
  const [occasion, setOccasion] = useState('birthday');
  const [message, setMessage] = useState('Hope you have a wonderful day! 🎂');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('manual');
  const [previewMode, setPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  // Free Tier constraints mock (Set to false so user can test the email feature)
  const isFreeTier = false; 

  const handleRecordingComplete = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setAudioBlob(blob);
    setAudioUrl(url);
  };

  const handleSend = async () => {
    if (!user) {
      alert("Please sign in to save cards.");
      navigate('/auth');
      return;
    }
    
    setIsSaving(true);
    try {
      let finalAudioUrl = '';
      if (audioBlob) {
        finalAudioUrl = await storageService.uploadAudio(audioBlob, `cards/${user.uid}_${Date.now()}.webm`);
      }

      const newCardId = await dbService.saveCard({
        userId: user.uid,
        occasion,
        message,
        audioUrl: finalAudioUrl,
        createdAt: Date.now()
      });
      
      if (deliveryMethod === 'email' && recipientEmail) {
        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientEmail,
              cardId: newCardId,
              senderName: user.displayName || 'Someone',
              occasion
            })
          });
        } catch (err) {
          console.warn("Failed to dispatch email API", err);
        }
      }
      
      alert("Card saved successfully!");
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
      alert("Failed to save card.");
    } finally {
      setIsSaving(false);
    }
  };

  if (previewMode) {
    return (
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', background: 'var(--color-bg)' }}>
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <button onClick={() => setPreviewMode(false)} className="btn btn-outline" disabled={isSaving}>Back to Edit</button>
          <button onClick={handleSend} className="btn btn-primary" disabled={isSaving}>
            <Send size={18} /> {isSaving ? 'Sending...' : 'Send / Schedule'}
          </button>
        </div>
        
        <h2 style={{ marginBottom: '2rem' }}>Card Preview</h2>
        <InteractiveEnvelope occasion={occasion} message={message} audioBlobUrl={audioUrl} />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Create New Card</h2>
        <button onClick={() => setPreviewMode(true)} className="btn btn-primary">
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
            <option value="birthday">Birthday</option>
            <option value="christmas">Christmas</option>
            <option value="graduation">Graduation</option>
            <option value="new years">New Years</option>
            <option value="mother's day">Mother's Day</option>
            <option value="father's day">Father's Day</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Written Message (Emojis supported)</label>
          <textarea 
            rows={4} 
            value={message} 
            onChange={(e) => setMessage(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--color-surface)', color: 'white', border: '1px solid var(--color-surface-light)' }}
          ></textarea>
        </div>

        <VoiceRecorder onRecordingComplete={handleRecordingComplete} maxDurationSeconds={isFreeTier ? 60 : 300} />

        <div className="delivery-options" style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <CalendarClock size={20} /> Delivery Method
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="radio" name="delivery" checked={deliveryMethod === 'manual'} onChange={() => setDeliveryMethod('manual')} /> 
              Send Manually (Dashboard Link)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isFreeTier ? 0.5 : 1 }}>
              <input type="radio" name="delivery" disabled={isFreeTier} checked={deliveryMethod === 'email'} onChange={() => setDeliveryMethod('email')} /> 
              Deliver via Email instantly {isFreeTier && <span style={{ color: 'var(--color-warm)', fontSize: '0.8rem' }}>(Plus/Pro feature)</span>}
            </label>
            
            {deliveryMethod === 'email' && (
              <div style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                <input 
                  type="email" 
                  placeholder="Recipient Email Address" 
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--color-bg)', color: 'white', border: '1px solid var(--color-surface-light)' }} 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCard;
