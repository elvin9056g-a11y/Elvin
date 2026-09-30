import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  Radio,
  Users,
} from 'lucide-react';

interface VoiceHangoutPanelProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  participants: { id: string; name: string; avatarUrl?: string }[];
  isDark?: boolean;
}

export const VoiceHangoutPanel: React.FC<VoiceHangoutPanelProps> = ({
  isOpen,
  onClose,
  groupName,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  participants,
  isDark = true,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0.4);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Initialize Microphone stream if allowed
  useEffect(() => {
    if (!isOpen) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      return;
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          mediaStreamRef.current = stream;
        })
        .catch((err) => {
          console.warn('Microphone permission info:', err);
        });
    }

    // Voice activity interval simulation/animation
    const interval = setInterval(() => {
      if (!isMuted) {
        setIsSpeaking(Math.random() > 0.35);
        setAudioLevel(0.2 + Math.random() * 0.7);
      } else {
        setIsSpeaking(false);
        setAudioLevel(0);
      }
    }, 450);

    return () => {
      clearInterval(interval);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [isOpen, isMuted]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !next;
      });
    }
  };

  if (!isOpen) return null;

  // Active voice participants: current user + other participants
  const allInRoom = [
    {
      id: currentUserId,
      name: `${currentUserName} (Siz)`,
      avatarUrl: currentUserAvatar,
      isMe: true,
      isMuted,
      isSpeaking: !isMuted && isSpeaking,
    },
    ...participants
      .filter((p) => p.id !== currentUserId)
      .slice(0, 5)
      .map((p, idx) => ({
        id: p.id,
        name: p.name,
        avatarUrl: p.avatarUrl,
        isMe: false,
        isMuted: idx % 3 === 2,
        isSpeaking: idx % 2 === 0,
      })),
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        transition={{ duration: 0.25 }}
        className={`w-full border-b shrink-0 shadow-lg px-4 py-3 z-30 transition-colors ${
          isDark
            ? 'bg-[#111b21] border-emerald-500/30 text-white'
            : 'bg-emerald-50/90 border-emerald-200 text-gray-900'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Room info & visual wave */}
          <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center relative shrink-0">
              <Radio size={18} className="animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs truncate">{groupName}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  Səsli Otaq
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] opacity-70 mt-0.5">
                <Users size={12} />
                <span>{allInRoom.length} nəfər qoşulub</span>
              </div>
            </div>

            {/* Audio wave indicator */}
            {!isMuted && (
              <div className="flex items-center gap-0.5 h-5 px-2">
                {[0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.7].map((height, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scaleY: isSpeaking ? [0.3, height, 0.4] : 0.2,
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.4 + i * 0.08,
                      ease: 'easeInOut',
                    }}
                    className="w-1 bg-emerald-400 rounded-full h-full origin-bottom"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Participants preview avatars */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-xs py-1">
            {allInRoom.map((user) => (
              <div
                key={user.id}
                className="relative group cursor-pointer"
                title={`${user.name} ${user.isSpeaking ? '(Danışır)' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all flex items-center justify-center text-xs font-bold ${
                    user.isSpeaking
                      ? 'border-emerald-400 ring-2 ring-emerald-400/50 scale-105'
                      : 'border-white/20'
                  } ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                {user.isMuted && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white flex items-center justify-center ring-1 ring-black">
                    <MicOff size={8} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Mute/Unmute Mic */}
            <button
              type="button"
              onClick={toggleMute}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                isMuted
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
              title={isMuted ? 'Mikrofonu aç' : 'Mikrofonu bağla'}
            >
              {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
              <span className="hidden sm:inline">{isMuted ? 'Bağlı' : 'Açıq'}</span>
            </button>

            {/* Leave Voice Room */}
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
              title="Səsli söhbətdən ayrıl"
            >
              <PhoneOff size={14} />
              <span>Ayrıl</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
