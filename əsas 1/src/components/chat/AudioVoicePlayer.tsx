import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Mic } from 'lucide-react';
import { MessageStatusIndicator } from './MessageStatusIndicator';

interface AudioVoicePlayerProps {
  duration?: string;
  durationSec?: number;
  time: string;
  avatarUrl?: string;
  senderName: string;
  mediaUrl?: string;
  isDark?: boolean;
  status?: 'sent' | 'delivered' | 'read';
  isOutgoing?: boolean;
}

export const AudioVoicePlayer: React.FC<AudioVoicePlayerProps> = ({
  duration = '0:06',
  durationSec = 6,
  time,
  avatarUrl,
  senderName,
  mediaUrl,
  isDark,
  status,
  isOutgoing,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (mediaUrl) {
      const audio = new Audio(mediaUrl);
      audio.playbackRate = playbackSpeed;
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentProgress(0);
      };

      audio.ontimeupdate = () => {
        if (audio.duration && audio.duration > 0) {
          setCurrentProgress(audio.currentTime / audio.duration);
        }
      };

      return () => {
        audio.pause();
        audio.src = '';
        audioRef.current = null;
      };
    }
  }, [mediaUrl]);

  // Keep playbackRate in sync when speed changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && !mediaUrl) {
      const stepMs = 100;
      const totalMs = (durationSec * 1000) / playbackSpeed;
      timer = setInterval(() => {
        setCurrentProgress((prev) => {
          if (prev >= 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + stepMs / totalMs;
        });
      }, stepMs);
    }
    return () => clearInterval(timer);
  }, [isPlaying, durationSec, mediaUrl, playbackSpeed]);

  const togglePlay = () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.playbackRate = playbackSpeed;
        if (currentProgress >= 1) {
          audioRef.current.currentTime = 0;
        }
        audioRef.current.play().catch(() => {});
      } else {
        if (currentProgress >= 1) setCurrentProgress(0);
      }
      setIsPlaying(true);
    }
  };

  const handleCycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaybackSpeed((prev) => {
      const next = prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1;
      if (audioRef.current) {
        audioRef.current.playbackRate = next;
      }
      return next;
    });
  };

  // Generate static natural waveform bar heights
  const bars = [
    6, 12, 18, 14, 22, 16, 26, 20, 14, 28, 22, 12, 18, 24, 16, 20, 14, 24,
    18, 12, 16, 10, 14, 8, 12, 6, 8, 4,
  ];

  return (
    <div className="flex items-center gap-2.5 py-1">
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-95 shrink-0 ${
          isDark
            ? 'text-emerald-400 hover:bg-white/10'
            : 'text-emerald-600 hover:bg-black/5'
        }`}
        title={isPlaying ? 'Dayandır' : 'Dinlə'}
      >
        {isPlaying ? (
          <Pause size={22} className="fill-current" />
        ) : (
          <Play size={22} className="fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform & Info */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Animated Waveform */}
        <div className="flex items-center gap-[2.5px] h-8 cursor-pointer select-none">
          {bars.map((height, idx) => {
            const barProgress = idx / bars.length;
            const isPlayed = barProgress <= currentProgress;
            return (
              <div
                key={idx}
                style={{ height: `${height}px` }}
                className={`w-[2.5px] rounded-full transition-all duration-150 ${
                  isPlayed
                    ? 'bg-emerald-500 scale-y-110'
                    : isDark
                    ? 'bg-white/25'
                    : 'bg-black/25'
                }`}
              />
            );
          })}
        </div>

        {/* Duration, Speed multiplier and Time */}
        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
          <div className="flex items-center gap-1.5">
            <span>{duration}</span>
            {/* Speed toggle button: 1x, 1.5x, 2x */}
            <button
              type="button"
              onClick={handleCycleSpeed}
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold transition-all cursor-pointer select-none leading-tight ${
                playbackSpeed !== 1
                  ? 'bg-emerald-500 text-white shadow-2xs'
                  : isDark
                  ? 'bg-white/15 text-white/90 hover:bg-white/25'
                  : 'bg-black/10 text-gray-800 hover:bg-black/15'
              }`}
              title="Oxutma sürəti: 1x, 1.5x, 2x"
            >
              {playbackSpeed}x
            </button>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px]">{time}</span>
            {isOutgoing && status && (
              <MessageStatusIndicator status={status} size={14} />
            )}
          </div>
        </div>
      </div>

      {/* Sender Avatar with Mic Badge */}
      <div className="relative shrink-0 ml-1">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 shadow-sm bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt={senderName} className="w-full h-full object-cover" />
          ) : (
            <span className="font-bold text-xs">{senderName.substring(0, 1)}</span>
          )}
        </div>
        {/* Mic badge */}
        <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-emerald-500 border border-white text-white flex items-center justify-center shadow-xs">
          <Mic size={10} />
        </div>
      </div>
    </div>
  );
};
