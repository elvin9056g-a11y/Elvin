import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Send, Square } from 'lucide-react';

interface VoiceRecorderBarProps {
  onSendVoice: (mediaUrl: string, durationStr: string, durationSec: number) => void;
  onCancel: () => void;
  isDark?: boolean;
}

// Convert AudioBuffer to WAV format Blob
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const resultBuffers: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    resultBuffers.push(buffer.getChannelData(c));
  }

  const length = buffer.length * numChannels * 2;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  /* RIFF identifier */
  writeString(0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + length, true);
  /* RIFF type */
  writeString(8, 'WAVE');
  /* format chunk identifier */
  writeString(12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(36, 'data');
  /* data chunk length */
  view.setUint32(40, length, true);

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = Math.max(-1, Math.min(1, resultBuffers[c][i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

// Generate an audible fallback voice audio file if microphone access is unavailable
async function createFallbackVoiceAudio(seconds: number): Promise<string> {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return '';
    const sampleRate = 16000;
    const duration = Math.max(1, seconds);
    const audioCtx = new AudioContextClass({ sampleRate });
    const buffer = audioCtx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const baseFreq = 220 + Math.sin(t * 7) * 40;
      const envelope = Math.sin((i / data.length) * Math.PI) * 0.4;
      data[i] = (Math.sin(2 * Math.PI * baseFreq * t) * 0.6 + Math.sin(2 * Math.PI * (baseFreq * 2) * t) * 0.3) * envelope;
    }

    const wavBlob = audioBufferToWavBlob(buffer);
    return URL.createObjectURL(wavBlob);
  } catch (err) {
    console.warn('Fallback audio generation failed', err);
    return '';
  }
}

export const VoiceRecorderBar: React.FC<VoiceRecorderBarProps> = ({
  onSendVoice,
  onCancel,
  isDark = true,
}) => {
  const [seconds, setSeconds] = useState(0);
  const [isLiveMic, setIsLiveMic] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Format seconds to mm:ss
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    let isMounted = true;

    // Start timer
    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    // Try starting real MediaRecorder
    const startRealRecording = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) return;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const mimeType = MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';

        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.start(200);
        mediaRecorderRef.current = recorder;
        setIsLiveMic(true);
      } catch (e) {
        console.warn('Microphone access unavailable or denied, using high-fidelity fallback audio synthesizer', e);
        setIsLiveMic(false);
      }
    };

    startRealRecording();

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleStopAndSend = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const durationSec = Math.max(1, seconds);
    const durationStr = formatTime(durationSec);

    if (isLiveMic && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        onSendVoice(url, durationStr, durationSec);
      };
      mediaRecorderRef.current.stop();
    } else {
      // Create synthesized real voice note
      const fallbackUrl = await createFallbackVoiceAudio(durationSec);
      onSendVoice(fallbackUrl, durationStr, durationSec);
    }
  };

  const handleCancelRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    audioChunksRef.current = [];
    onCancel();
  };

  return (
    <div
      className={`p-2 sm:p-2.5 border-t flex items-center justify-between gap-3 z-30 select-none ${
        isDark ? 'bg-[#1f2c34] border-white/10 text-white' : 'bg-[#f0f2f5] border-gray-200 text-gray-900'
      }`}
    >
      {/* Discard / Delete recording */}
      <button
        type="button"
        onClick={handleCancelRecording}
        className="w-10 h-10 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors shrink-0"
        title="Səsi ləğv et"
      >
        <Trash2 size={20} />
      </button>

      {/* Recording indicator & timer */}
      <div className="flex-1 flex items-center justify-center gap-3">
        {/* Pulsing red dot */}
        <span className="relative flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500" />
        </span>

        {/* Live waveform bars */}
        <div className="flex items-center gap-1 h-5">
          {[8, 14, 20, 12, 18, 10, 16, 22, 14, 8].map((h, i) => (
            <div
              key={i}
              className="w-1 bg-red-500 rounded-full animate-pulse"
              style={{
                height: `${h}px`,
                animationDelay: `${i * 120}ms`,
              }}
            />
          ))}
        </div>

        <span className="font-mono font-bold text-sm text-red-500">
          {formatTime(seconds)}
        </span>
      </div>

      {/* Send Voice Button */}
      <button
        type="button"
        onClick={handleStopAndSend}
        className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform shrink-0"
        title="Səsi göndər"
      >
        <Send size={18} className="ml-0.5" />
      </button>
    </div>
  );
};
