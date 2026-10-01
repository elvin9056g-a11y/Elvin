import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trash2, Send, Loader2, MicOff } from 'lucide-react';
import { uploadChatMediaToSupabase } from '../../lib/supabase';

interface VoiceRecorderBarProps {
  onSendVoice: (mediaUrl: string, durationStr: string, durationSec: number) => void;
  onCancel: () => void;
  isDark?: boolean;
}

// Format seconds to mm:ss
const formatTime = (totalSec: number) => {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// Isolated lightweight timer component to prevent re-rendering the parent bar or chat modals
const IsolatedRecordingTimer = React.memo<{
  startTime: number;
  onTick: (sec: number) => void;
}>(({ startTime, onTick }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      setSeconds(elapsed);
      onTick(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, onTick]);

  return (
    <span className="font-mono text-sm font-semibold tracking-wider">
      {formatTime(seconds)}
    </span>
  );
});

export const VoiceRecorderBar: React.FC<VoiceRecorderBarProps> = ({
  onSendVoice,
  onCancel,
  isDark = true,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);

  // Pure refs for zero re-render overhead during recording
  const durationSecRef = useRef<number>(0);
  const chunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleTick = useCallback((sec: number) => {
    durationSecRef.current = sec;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const startRecording = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMicError('Brauzeriniz səs yazmağı dəstəkləmir.');
        return;
      }

      let stream: MediaStream | null = null;
      try {
        // Raw audio input without DSP filters to prevent CPU load and stuttering
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
      } catch {
        // Fallback to basic audio
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
          if (isMounted) {
            setMicError('Mikrofona icazə verilmədi. Zəhmət olmasa mikrofona icazə verin.');
          }
          return;
        }
      }

      if (!isMounted) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      chunksRef.current = [];
      durationSecRef.current = 0;
      setRecordingStartTime(Date.now());

      try {
        // Default native MediaRecorder without forced mimeType or bitrate
        const recorder = new MediaRecorder(stream);

        // Chunks are stored ONLY in chunksRef, never in React state
        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        // Start without timeslice for continuous unfragmented buffer
        recorder.start();
        mediaRecorderRef.current = recorder;
      } catch {
        setMicError('Səs yazıcısını başlatmaq mümkün olmadı.');
      }
    };

    startRecording();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleStopAndSend = async () => {
    if (isUploading) return;
    setIsUploading(true);

    const totalSec = Math.max(1, durationSecRef.current);
    const durationStr = formatTime(totalSec);

    try {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        await new Promise<void>((resolve) => {
          recorder.onstop = () => resolve();
          recorder.stop();
        });
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      // Explicitly set Blob type to match the recorder's exact mimeType
      const mime = recorder?.mimeType || 'audio/webm';
      const audioBlob = new Blob(chunksRef.current, { type: mime });

      if (audioBlob.size > 0) {
        const uploadedUrl = await uploadChatMediaToSupabase(audioBlob, 'audio');
        onSendVoice(uploadedUrl, durationStr, totalSec);
      } else {
        onCancel();
      }
    } catch (err) {
      console.warn('Səs yükləmə zamanı bildiriş:', err);
      onCancel();
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    onCancel();
  };

  if (micError) {
    return (
      <div
        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl border transition-colors select-none ${
          isDark
            ? 'bg-[#1f2c34] border-red-500/30 text-white'
            : 'bg-red-50 border-red-200 text-red-900'
        }`}
      >
        <div className="flex items-center gap-2 text-xs flex-1 min-w-0">
          <MicOff size={16} className="text-red-500 shrink-0" />
          <span className="font-medium truncate">{micError}</span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-500 hover:bg-red-600 active:scale-95 text-white cursor-pointer transition-colors shrink-0"
        >
          Bağla
        </button>
      </div>
    );
  }

  return (
    <div
      className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-2xl border transition-colors shadow-inner select-none ${
        isDark
          ? 'bg-[#1f2c34] border-white/10 text-white'
          : 'bg-gray-100 border-black/10 text-gray-900'
      }`}
    >
      {/* Discard / Delete recording */}
      <button
        type="button"
        disabled={isUploading}
        onClick={handleCancelRecording}
        className="w-10 h-10 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors shrink-0 disabled:opacity-50"
        title="Səsi ləğv et"
      >
        <Trash2 size={20} />
      </button>

      {/* Recording Indicator & Isolated Timer */}
      <div className="flex-1 flex items-center gap-2.5">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
        {recordingStartTime !== null ? (
          <IsolatedRecordingTimer
            startTime={recordingStartTime}
            onTick={handleTick}
          />
        ) : (
          <span className="font-mono text-sm font-semibold tracking-wider">0:00</span>
        )}
      </div>

      {/* Send Voice Button */}
      <button
        type="button"
        disabled={isUploading}
        onClick={handleStopAndSend}
        className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform shrink-0 disabled:opacity-75"
        title={isUploading ? 'Yüklənir...' : 'Səsi göndər'}
      >
        {isUploading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Send size={18} className="ml-0.5" />
        )}
      </button>
    </div>
  );
};
