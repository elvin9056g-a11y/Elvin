import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';

interface WhatsAppAudioPlayerProps {
  src: string;
  isOutgoing?: boolean;
  isDark?: boolean;
  fallbackDuration?: string; // e.g. "0:12"
  durationSec?: number;      // e.g. 12
}

export const WhatsAppAudioPlayer: React.FC<WhatsAppAudioPlayerProps> = ({
  src,
  isOutgoing = false,
  isDark = true,
  fallbackDuration,
  durationSec,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isDraggingRef = useRef(false);
  const isPlayingRef = useRef(false);

  // Helper to get duration in seconds from props
  const getKnownDuration = useCallback(() => {
    if (typeof durationSec === 'number' && durationSec > 0 && isFinite(durationSec)) {
      return durationSec;
    }
    if (fallbackDuration && fallbackDuration.includes(':')) {
      const [m, s] = fallbackDuration.split(':').map(Number);
      if (!isNaN(m) && !isNaN(s) && (m > 0 || s > 0)) return m * 60 + s;
    }
    if (fallbackDuration && !isNaN(Number(fallbackDuration)) && Number(fallbackDuration) > 0) {
      return Number(fallbackDuration);
    }
    return 0;
  }, [durationSec, fallbackDuration]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number>(getKnownDuration);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);

  // Format seconds to m:ss
  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0 || !isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Sync duration whenever props update
  useEffect(() => {
    const known = getKnownDuration();
    if (known > 0) {
      setDuration(known);
    }
  }, [getKnownDuration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      const known = getKnownDuration();
      const d = audio.duration;

      // Priority 1: Use exact timer duration recorded from device
      if (known > 0) {
        setDuration(known);
      } else if (d > 0 && isFinite(d) && d !== Infinity) {
        setDuration(d);
      } else if (d === Infinity || isNaN(d)) {
        // Priority 2: WebM Infinity bypass
        audio.currentTime = 1e101;
        const fixWebMDuration = () => {
          audio.removeEventListener('timeupdate', fixWebMDuration);
          if (audio.duration && isFinite(audio.duration) && audio.duration > 0 && audio.duration !== Infinity) {
            setDuration(audio.duration);
          } else if (known > 0) {
            setDuration(known);
          }
          if (!isPlayingRef.current) {
            audio.currentTime = 0;
            setCurrentTime(0);
          }
        };

        audio.addEventListener('timeupdate', fixWebMDuration, { once: true });
        setTimeout(() => {
          if (!isPlayingRef.current && audio.currentTime > 1000) {
            audio.currentTime = 0;
            setCurrentTime(0);
          }
        }, 150);
      }
    };

    const handleDurationChange = () => {
      const known = getKnownDuration();
      if (known > 0) {
        setDuration(known);
      } else if (audio.duration && isFinite(audio.duration) && audio.duration > 0 && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      if (!isDraggingRef.current) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (audio) audio.currentTime = 0;
    };

    const handlePlay = () => {
      setIsPlaying(true);
      audio.playbackRate = speed;
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [getKnownDuration, speed]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.playbackRate = speed;
      audio.play().catch((err) => console.warn('Audio play error:', err));
    }
  };

  // Immediate live seeking when user scrubs
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement> | React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const newTime = parseFloat(target.value);
    if (!isNaN(newTime)) {
      setCurrentTime(newTime);
      if (audioRef.current) {
        audioRef.current.currentTime = newTime;
      }
    }
  };

  const handleSeekStart = () => {
    isDraggingRef.current = true;
  };

  const handleSeekEnd = (e: React.SyntheticEvent<HTMLInputElement>) => {
    isDraggingRef.current = false;
    const target = e.target as HTMLInputElement;
    const newTime = parseFloat(target.value);
    if (!isNaN(newTime) && audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSpeed: 1 | 1.5 | 2 = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const effectiveDuration = duration > 0 ? duration : 1;
  const progressPercent = Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100));

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl select-none w-full max-w-[260px] sm:max-w-[280px] my-1 transition-all ${
        isOutgoing
          ? isDark
            ? 'bg-emerald-950/40 text-emerald-100 border border-emerald-500/20'
            : 'bg-emerald-700/10 text-emerald-900 border border-emerald-600/15'
          : isDark
          ? 'bg-black/30 text-white/90 border border-white/10'
          : 'bg-black/5 text-gray-900 border border-black/10'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Left: Play/Pause button */}
      <button
        type="button"
        onClick={togglePlay}
        className="w-9 h-9 rounded-full flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white transition-all shadow-xs cursor-pointer shrink-0"
        title={isPlaying ? 'Dayandır' : 'Oxut'}
      >
        {isPlaying ? (
          <Pause size={17} className="fill-white" />
        ) : (
          <Play size={17} className="ml-0.5 fill-white" />
        )}
      </button>

      {/* Center: Progress bar & Time display */}
      <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
        <input
          type="range"
          min={0}
          max={effectiveDuration}
          step={0.05}
          value={currentTime}
          onChange={handleSeek}
          onInput={handleSeek}
          onMouseDown={handleSeekStart}
          onMouseUp={handleSeekEnd}
          onTouchStart={handleSeekStart}
          onTouchEnd={handleSeekEnd}
          style={{
            background: isDark
              ? `linear-gradient(to right, #10b981 ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%)`
              : `linear-gradient(to right, #059669 ${progressPercent}%, rgba(0,0,0,0.15) ${progressPercent}%)`,
          }}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-emerald-500 dark:accent-emerald-400"
        />
        <div className="flex items-center justify-between text-[10px] font-mono opacity-80 px-0.5 leading-none">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Playback Rate (Speed: 1x -> 1.5x -> 2x) */}
      <button
        type="button"
        onClick={toggleSpeed}
        className={`px-2 py-1 rounded-full text-[11px] font-bold tracking-tight cursor-pointer shrink-0 transition-transform active:scale-90 border ${
          isOutgoing
            ? isDark
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
              : 'bg-emerald-600/15 text-emerald-800 border-emerald-600/25 hover:bg-emerald-600/25'
            : isDark
            ? 'bg-white/10 text-white border-white/15 hover:bg-white/20'
            : 'bg-black/10 text-gray-800 border-black/15 hover:bg-black/15'
        }`}
        title="Oxutma sürəti"
      >
        {speed}x
      </button>
    </div>
  );
};
