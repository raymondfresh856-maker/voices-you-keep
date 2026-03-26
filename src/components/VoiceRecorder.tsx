import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Trash2, Heart } from 'lucide-react';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  maxDurationSeconds: number; // e.g. 60 for free, 300 for plus
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordingComplete, maxDurationSeconds }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= maxDurationSeconds) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, maxDurationSeconds]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setAudioUrl(null);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Ensure permissions are granted.');
    }
  };



  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="voice-recorder glass-panel" style={{ padding: '1.5rem', textAlign: 'center', margin: '1rem 0' }}>
      <h3 style={{ marginBottom: '1rem' }}>Record Your Message</h3>
      
      {!audioUrl && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="timer" style={{ fontSize: '2rem', fontWeight: 'bold', color: isRecording ? 'var(--color-primary)' : 'var(--color-text)' }}>
            {formatTime(recordingTime)} / {formatTime(maxDurationSeconds)}
          </div>
          
          <button 
            type="button"
            onClick={isRecording ? stopRecording : startRecording} 
            className={`btn ${isRecording ? 'btn-outline' : 'btn-primary'}`}
            style={{ width: '80px', height: '80px', borderRadius: '50%', padding: 0 }}
          >
            {isRecording ? <Square size={32} color="red" /> : <Mic size={32} />}
          </button>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {isRecording ? 'Recording...' : 'Tap to Start'}
          </p>
        </div>
      )}

      {audioUrl && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <audio src={audioUrl} controls style={{ width: '100%', maxWidth: '300px' }} />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="button" onClick={() => setAudioUrl(null)} className="btn btn-outline">
              <Trash2 size={18} /> Re-record
            </button>
            <button type="button" className="btn btn-primary">
              <Heart size={18} /> Keep Voice
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
