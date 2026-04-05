import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  maxDurationSeconds: number; // e.g. 60 for free, 300 for plus/pro
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordingComplete, maxDurationSeconds }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up mic stream and timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= maxDurationSeconds - 1) {
            stopRecording();
            return maxDurationSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, maxDurationSeconds]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

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
        // Stop all mic tracks to release the device
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setAudioUrl(null);
    } catch (err) {
      console.error('Microphone error:', err);
      alert('Could not access microphone. Please check your browser permissions and try again.');
    }
  };

  const handleReRecord = () => {
    setAudioUrl(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const pct = Math.min((recordingTime / maxDurationSeconds) * 100, 100);
  const isNearLimit = pct >= 80;

  return (
    <div className="voice-recorder glass-panel" style={{ padding: '1.5rem', textAlign: 'center', margin: '1rem 0' }}>
      <h3 style={{ marginBottom: '1rem' }}>Record Your Message</h3>

      {!audioUrl && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div
            className="timer"
            style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: isRecording
                ? (isNearLimit ? 'var(--color-warm)' : 'var(--color-primary)')
                : 'var(--color-text)',
              transition: 'color 0.3s',
            }}
          >
            {formatTime(recordingTime)} / {formatTime(maxDurationSeconds)}
          </div>

          {/* Progress bar */}
          {isRecording && (
            <div style={{ width: '100%', maxWidth: '260px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: isNearLimit ? 'var(--color-warm)' : 'var(--color-primary)',
                transition: 'width 1s linear, background 0.3s',
                borderRadius: '2px',
              }} />
            </div>
          )}

          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`btn ${isRecording ? 'btn-outline' : 'btn-primary'}`}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              padding: 0,
              boxShadow: isRecording ? '0 0 0 6px rgba(232,82,122,0.2)' : undefined,
            }}
          >
            {isRecording ? <Square size={32} color="#ff6b6b" /> : <Mic size={32} />}
          </button>

          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {isRecording
              ? (isNearLimit ? `Almost at limit — ${formatTime(maxDurationSeconds - recordingTime)} left` : 'Recording… tap to stop')
              : 'Tap to Start Recording'}
          </p>
        </div>
      )}

      {audioUrl && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <p style={{ color: 'var(--color-accent)', fontSize: '0.9rem', margin: 0 }}>✓ Recording complete — {formatTime(recordingTime)}</p>
          <audio src={audioUrl} controls style={{ width: '100%', maxWidth: '320px' }} />
          <button type="button" onClick={handleReRecord} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trash2 size={16} /> Re-record
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
