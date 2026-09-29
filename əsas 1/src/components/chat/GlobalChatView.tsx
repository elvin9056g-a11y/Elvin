import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  ArrowLeft,
  X,
  Smartphone,
  Monitor,
  Laptop,
  Terminal,
  Apple,
  Send,
  Paperclip,
  Mic,
  ChevronRight,
  UserPlus,
  Users,
  Check,
  Download,
  MapPin,
  FileText,
  MessageSquare,
  Smile,
  Edit3,
  Trash2,
} from 'lucide-react';
import {
  GlobalCategory,
  GlobalSubcategory,
  ChatMessage,
  SubcategoryId,
  MainCategoryId,
} from './types';
import {
  GLOBAL_CATEGORIES,
  INITIAL_SUBCATEGORY_MESSAGES,
} from './globalChatData';
import { renderBrandSubcategoryIcon } from './BrandOfficialIcons';
import { ChatFluidBackground } from './ChatFluidBackground';
import { AudioVoicePlayer } from './AudioVoicePlayer';
import { WhatsAppEmojiPicker } from './WhatsAppEmojiPicker';
import { VoiceRecorderBar } from './VoiceRecorderBar';
import { MessageActionsModal } from './MessageActionsModal';
import { Language, UserProfile } from '../../types';
import {
  supabase,
  isUuid,
  fetchGlobalMessagesFromDb,
  fetchGlobalMessageById,
  sendGlobalMessageToDb,
  deleteGlobalMessageFromDb,
  updateGlobalMessageReactions,
  mapGlobalMessageRowToChatMessage,
} from '../../lib/supabase';

interface GlobalChatViewProps {
  currentLanguage: Language;
  currentUser?: UserProfile | null;
  currentUserName: string;
  isDark: boolean;
  onClose: () => void;
  onOpenAttachSheet: (target: 'global') => void;
  onOpenVoiceRecorder: (target: 'global') => void;
  // External pending messages (e.g. from camera editor or attachment sheet)
  pendingOutgoingMessage?: ChatMessage | null;
  onClearPendingMessage?: () => void;
  // Navigation back to personal chat
  onSwitchToPersonal: () => void;
  onOpenAddUser: () => void;
  // Open home-page glassmorphism user profile modal (readOnly, with send request)
  onOpenUserProfile?: (user: UserProfile) => void;
}

// Simple hash code generator for realistic 8-digit user IDs
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
};

export const GlobalChatView: React.FC<GlobalChatViewProps> = ({
  currentLanguage,
  currentUser,
  currentUserName,
  isDark,
  onClose,
  onOpenAttachSheet,
  onOpenVoiceRecorder,
  pendingOutgoingMessage,
  onClearPendingMessage,
  onSwitchToPersonal,
  onOpenAddUser,
  onOpenUserProfile,
}) => {
  // Active Main Category: 'mobile' | 'desktop'
  const [activeCategoryId, setActiveCategoryId] = useState<MainCategoryId>('mobile');

  // Left-to-right drawer state (phone screen half width)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Active Subcategory Chat (e.g. iPhone, Android, Windows, macOS, Linux)
  const [activeSubcategory, setActiveSubcategory] = useState<GlobalSubcategory | null>(null);

  // Replying to a specific message via swipe
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Real messages loaded from public.global_messages
  const [dbMessages, setDbMessages] = useState<ChatMessage[]>([]);

  // Purge any old mock data from localStorage on mount & load from DB
  useEffect(() => {
    try {
      const keys: SubcategoryId[] = ['iphone', 'android', 'windows', 'macos', 'linux'];
      keys.forEach((k) => {
        const saved = localStorage.getItem(`lumora_global_chat_${k}`);
        if (saved && (saved.includes('user_aylin') || saved.includes('iph_1') || saved.includes('and_1'))) {
          localStorage.removeItem(`lumora_global_chat_${k}`);
        }
      });
    } catch (e) {}

    // Initial fetch from public.global_messages (order by created_at asc)
    fetchGlobalMessagesFromDb(currentUser?.id).then((msgs) => {
      setDbMessages(msgs);
    });

    // Supabase Realtime subscription on public.global_messages
    const channelId = `global_messages_${currentUser?.id || 'guest'}_${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'global_messages' },
        async (payload) => {
          const row = payload.new;
          if (!row || !row.id) return;

          // Əgər payload.new içində profil məlumatları çatmırsa, id-yə görə join edib çək
          let newMsg: ChatMessage;
          if (!row.profiles || !row.profiles.first_name) {
            const fetched = await fetchGlobalMessageById(row.id, currentUser?.id);
            newMsg = fetched || mapGlobalMessageRowToChatMessage(row, currentUser?.id);
          } else {
            newMsg = mapGlobalMessageRowToChatMessage(row, currentUser?.id);
          }

          setDbMessages((prev) => {
            const tempIdx = prev.findIndex(
              (m) =>
                (m.id.startsWith('temp_') && m.text === newMsg.text && m.senderId === newMsg.senderId) ||
                m.id === newMsg.id
            );
            if (tempIdx >= 0) {
              const next = [...prev];
              next[tempIdx] = newMsg;
              return next;
            }
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Avtomatik Sürüşdürmə: Yeni mesaj gələn kimi ən aşağıya sürüşdür
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'global_messages' },
        (payload) => {
          const updated = mapGlobalMessageRowToChatMessage(payload.new, currentUser?.id);
          setDbMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'global_messages' },
        (payload) => {
          const deletedId = String(payload.old?.id);
          setDbMessages((prev) => prev.filter((m) => m.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);


  // Handle message reaction (like, heart, laugh, etc.)
  const handleReactMessage = (msg: ChatMessage, emoji: string) => {
    const existing = { ...(msg.reactions || {}) };
    existing[emoji] = (existing[emoji] || 0) + 1;
    setDbMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, reactions: existing } : m))
    );
    updateGlobalMessageReactions(msg.id, existing).catch((e) => console.warn(e));
  };

  // Messages dictionary per subcategory stored in state & localStorage
  const [categoryMessages, setCategoryMessages] = useState<Record<SubcategoryId, ChatMessage[]>>(() => {
    const initial: Record<SubcategoryId, ChatMessage[]> = { ...INITIAL_SUBCATEGORY_MESSAGES };
    try {
      const keys: SubcategoryId[] = ['iphone', 'android', 'windows', 'macos', 'linux'];
      keys.forEach((k) => {
        const saved = localStorage.getItem(`lumora_global_chat_${k}`);
        if (saved) {
          initial[k] = JSON.parse(saved);
        }
      });
    } catch (e) {
      console.warn('Error loading global subcategory chats from storage', e);
    }
    return initial;
  });

  // Chat message input text
  const [inputText, setInputText] = useState('');

  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // In-line voice recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  // Message long-press & edit/delete state
  const [selectedMessageForAction, setSelectedMessageForAction] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll anchor
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  // Current active main category object
  const activeCategory = GLOBAL_CATEGORIES.find((c) => c.id === activeCategoryId) || GLOBAL_CATEGORIES[0];

  // Auto-scroll when messages change or subcategory changes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeSubcategory) {
      scrollToBottom();
    }
  }, [activeSubcategory, dbMessages, categoryMessages]);


  // Handle incoming media from parent (e.g. attachment sheet or audio/files)
  useEffect(() => {
    if (pendingOutgoingMessage && activeSubcategory) {
      const subId = activeSubcategory.id;
      setCategoryMessages((prev) => {
        const updatedList = [...(prev[subId] || []), pendingOutgoingMessage];
        try {
          localStorage.setItem(`lumora_global_chat_${subId}`, JSON.stringify(updatedList));
        } catch (e) {
          console.warn('Failed to save to localStorage', e);
        }
        return {
          ...prev,
          [subId]: updatedList,
        };
      });

      // Insert directly into public.global_messages
      const senderId = currentUser?.id || 'me';
      const senderName = currentUserName || (currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : 'İstifadəçi');
      const senderAvatar = currentUser?.avatarUrl || '';
      const senderRole = currentUser?.profession || activeSubcategory.name;

      sendGlobalMessageToDb({
        sender_id: senderId,
        sender_name: senderName,
        sender_avatar: senderAvatar,
        sender_role: senderRole,
        text: pendingOutgoingMessage.text || '',
        image_url: pendingOutgoingMessage.type === 'image' ? pendingOutgoingMessage.mediaUrl : undefined,
        audio_url: pendingOutgoingMessage.type === 'voice' ? pendingOutgoingMessage.mediaUrl : undefined,
        file_url: pendingOutgoingMessage.type === 'file' ? (pendingOutgoingMessage.mediaUrl || pendingOutgoingMessage.fileInfo?.fileUrl) : undefined,
        file_name: pendingOutgoingMessage.fileInfo?.name,
      }).catch((e) => console.warn('sendGlobalMessage error:', e));

      if (onClearPendingMessage) {
        onClearPendingMessage();
      }
    }
  }, [pendingOutgoingMessage, activeSubcategory, onClearPendingMessage, currentUser, currentUserName]);

  // Edit message handler
  const handleStartEditMessage = (msg: ChatMessage) => {
    setEditingMessage(msg);
    setInputText(msg.text || '');
    setShowEmojiPicker(false);
  };

  // Delete message handler
  const handleDeleteMessage = (msg: ChatMessage) => {
    if (!activeSubcategory) return;
    const subId = activeSubcategory.id;
    setCategoryMessages((prev) => {
      const updatedList = (prev[subId] || []).filter((m) => m.id !== msg.id);
      try {
        localStorage.setItem(`lumora_global_chat_${subId}`, JSON.stringify(updatedList));
      } catch (e) {
        console.warn('Failed to save message', e);
      }
      return {
        ...prev,
        [subId]: updatedList,
      };
    });
    setDbMessages((prev) => prev.filter((m) => m.id !== msg.id));
    deleteGlobalMessageFromDb(msg.id).catch((e) => console.warn(e));

    if (editingMessage?.id === msg.id) {
      setEditingMessage(null);
      setInputText('');
    }
  };

  // Voice message sender
  const handleSendVoiceNote = (mediaUrl: string, durationStr: string, durationSec: number) => {
    if (!activeSubcategory) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const voiceMsg: ChatMessage = {
      id: `gmsg_voice_${Date.now()}`,
      senderId: currentUser?.id || 'me',
      senderName: currentUserName || 'Siz',
      isOutgoing: true,
      type: 'voice',
      mediaUrl,
      voiceDuration: durationStr,
      voiceDurationSec: durationSec,
      time: timeStr,
      status: 'sent',
    };

    const subId = activeSubcategory.id;
    setCategoryMessages((prev) => {
      const updatedList = [...(prev[subId] || []), voiceMsg];
      try {
        localStorage.setItem(`lumora_global_chat_${subId}`, JSON.stringify(updatedList));
      } catch (e) {
        console.warn('Failed to save voice note', e);
      }
      return {
        ...prev,
        [subId]: updatedList,
      };
    });
    setDbMessages((prev) => [...prev, voiceMsg]);
    setTimeout(() => scrollToBottom(), 50);

    const senderId = currentUser?.id || 'me';
    const senderName = currentUserName || (currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : 'İstifadəçi');
    const senderAvatar = currentUser?.avatarUrl || '';
    const senderRole = currentUser?.profession || activeSubcategory.name;

    sendGlobalMessageToDb({
      sender_id: senderId,
      sender_name: senderName,
      sender_avatar: senderAvatar,
      sender_role: senderRole,
      audio_url: mediaUrl,
      text: '',
    }).catch((e) => console.warn('sendGlobalMessage voice error:', e));

    setIsRecordingVoice(false);
  };

  // Send or update text message
  const handleSendMessage = () => {
    const trimmed = inputText.trim();
    if (!trimmed || !activeSubcategory) return;

    const subId = activeSubcategory.id;

    // Handle Edit Mode
    if (editingMessage) {
      setCategoryMessages((prev) => {
        const updatedList = (prev[subId] || []).map((m) =>
          m.id === editingMessage.id ? { ...m, text: trimmed, isEdited: true } : m
        );
        try {
          localStorage.setItem(`lumora_global_chat_${subId}`, JSON.stringify(updatedList));
        } catch (e) {
          console.warn('Failed to save message', e);
        }
        return {
          ...prev,
          [subId]: updatedList,
        };
      });
      setEditingMessage(null);
      setInputText('');
      setShowEmojiPicker(false);
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    if (!currentUser?.id || !isUuid(currentUser.id)) {
      console.warn('currentUser.id is not a valid UUID:', currentUser?.id);
      return;
    }

    const senderId = currentUser.id;
    const senderName =
      (currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() : '') ||
      currentUserName ||
      'İstifadəçi';
    const senderAvatar = currentUser.avatarUrl || '';
    const senderRole = currentUser.profession || activeSubcategory.name;

    const tempId = `temp_${Date.now()}`;
    const newMsg: ChatMessage = {
      id: tempId,
      senderId,
      senderName,
      senderAvatar,
      isOutgoing: true,
      text: trimmed,
      time: timeStr,
      status: 'sent',
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            text:
              replyingTo.text ||
              (replyingTo.type === 'voice'
                ? '🎤 Səsli mesaj'
                : replyingTo.type === 'image'
                ? '📷 Şəkil'
                : replyingTo.type === 'video'
                ? '🎥 Video'
                : '📎 Fayl'),
          }
        : undefined,
    };

    setDbMessages((prev) => [...prev, newMsg]);
    setTimeout(() => scrollToBottom(), 50);

    sendGlobalMessageToDb({
      sender_id: senderId,
      sender_name: senderName,
      sender_avatar: senderAvatar,
      sender_role: senderRole,
      text: trimmed,
      reply_to_id: (replyingTo?.id && isUuid(replyingTo.id)) ? replyingTo.id : undefined,
    })
      .then((createdRow) => {
        if (createdRow) {
          const realMsg = mapGlobalMessageRowToChatMessage(createdRow, senderId);
          setDbMessages((prev) =>
            prev.map((m) => (m.id === tempId ? realMsg : m))
          );
          setTimeout(() => scrollToBottom(), 50);
        }
      })
      .catch((e) => console.warn('sendGlobalMessage error:', e));

    setInputText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
  };


  // Helper icon renderer for main categories
  const renderCategoryIcon = (iconName: string, size = 22, className = '') => {
    switch (iconName) {
      case 'Smartphone':
        return <Smartphone size={size} className={className} />;
      case 'Monitor':
        return <Monitor size={size} className={className} />;
      case 'Laptop':
        return <Laptop size={size} className={className} />;
      case 'Terminal':
        return <Terminal size={size} className={className} />;
      case 'Apple':
        return <Apple size={size} className={className} />;
      default:
        return <Smartphone size={size} className={className} />;
    }
  };

  // User profile click handler
  const handleOpenSenderProfile = (msg: ChatMessage) => {
    if (!onOpenUserProfile) return;
    const name = msg.senderName || 'İstifadəçi';
    const parts = name.split(' ');
    const firstName = parts[0] || name;
    const lastName = parts.slice(1).join(' ') || '';
    const cleanHandle = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const userCode = (Math.abs(hashString(name)) % 90000000 + 10000000).toString();

    const profile: UserProfile = {
      id: msg.senderId || `usr_${userCode}`,
      firstName,
      lastName,
      username: `@${cleanHandle || 'user'}`,
      userCode,
      balance: 0,
      profession: 'Lumora İcma Üzvü',
      experience: '2 il',
      avatarUrl: msg.senderAvatar,
      tags: ['Qlobal Çat', activeSubcategory?.name || 'İcma', 'Lumora'],
    };

    onOpenUserProfile(profile);
  };

  // Translation helpers
  const labels = {
    az: {
      categories: 'Kateqoriyalar',
      mobile: 'Mobile',
      desktop: 'Desktop',
      globalChat: 'Qlobal Çat',
      chooseSubcategory: 'İcma müzakirələrinə qoşulmaq üçün alt kateqoriyanı seçin',
      members: 'üzv',
      online: 'onlayn',
      messagesCount: 'mesaj',
      inputPlaceholder: 'İcma ilə müzakirə et...',
      send: 'Göndər',
      today: 'Bugün',
      personal: 'Şəxsi',
      global: 'Qlobal',
      addUser: 'İstifadəçi əlavə et',
      replyingTo: (name: string) => `${name} üçün cavab`,
    },
    en: {
      categories: 'Categories',
      mobile: 'Mobile',
      desktop: 'Desktop',
      globalChat: 'Global Chat',
      chooseSubcategory: 'Select a subcategory to join community discussions',
      members: 'members',
      online: 'online',
      messagesCount: 'messages',
      inputPlaceholder: 'Discuss with community...',
      send: 'Send',
      today: 'Today',
      personal: 'Personal',
      global: 'Global',
      addUser: 'Add User',
      replyingTo: (name: string) => `Replying to ${name}`,
    },
    ru: {
      categories: 'Категории',
      mobile: 'Mobile',
      desktop: 'Desktop',
      globalChat: 'Глобальный Чат',
      chooseSubcategory: 'Выберите подкатегорию для участия в обсуждениях',
      members: 'участников',
      online: 'в сети',
      messagesCount: 'сообщ.',
      inputPlaceholder: 'Написать в сообщество...',
      send: 'Отправить',
      today: 'Сегодня',
      personal: 'Личные',
      global: 'Глобальный',
      addUser: 'Добавить пользователя',
      replyingTo: (name: string) => `Ответ для ${name}`,
    },
    tr: {
      categories: 'Kategoriler',
      mobile: 'Mobile',
      desktop: 'Desktop',
      globalChat: 'Küresel Sohbet',
      chooseSubcategory: 'Topluluk tartışmalarına katılmak için bir alt kategori seçin',
      members: 'üye',
      online: 'çevrimiçi',
      messagesCount: 'mesaj',
      inputPlaceholder: 'Toplulukla tartışın...',
      send: 'Gönder',
      today: 'Bugün',
      personal: 'Kişisel',
      global: 'Küresel',
      addUser: 'Kullanıcı Ekle',
      replyingTo: (name: string) => `${name} kişisine yanıt`,
    },
  }[currentLanguage] || {
    categories: 'Kateqoriyalar',
    mobile: 'Mobile',
    desktop: 'Desktop',
    globalChat: 'Qlobal Çat',
    chooseSubcategory: 'İcma müzakirələrinə qoşulmaq üçün alt kateqoriyanı seçin',
    members: 'üzv',
    online: 'onlayn',
    messagesCount: 'mesaj',
    inputPlaceholder: 'İcma ilə müzakirə et...',
    send: 'Göndər',
    today: 'Bugün',
    personal: 'Şəxsi',
    global: 'Qlobal',
    addUser: 'İstifadəçi əlavə et',
    replyingTo: (name: string) => `${name} üçün cavab`,
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden select-none">
      {/* ======================================================== */}
      {/* 1. LEFT-TO-RIGHT CATEGORY DRAWER (HALF PHONE SCREEN)     */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop overlay covering the other half */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs z-40 cursor-pointer"
            />

            {/* Left Drawer taking half of screen width (w-1/2) */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className={`absolute top-0 bottom-0 left-0 w-1/2 min-w-[175px] max-w-[280px] z-50 flex flex-col border-r shadow-2xl ${
                isDark
                  ? 'bg-[#182229] border-white/10 text-white'
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              {/* Drawer Header */}
              <div
                className={`p-3.5 border-b flex items-center justify-between ${
                  isDark ? 'border-white/10 bg-[#121b22]' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-xs sm:text-sm tracking-wide">
                    {labels.categories}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-colors"
                  aria-label="Bağla"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Main Categories list: Mobile & Desktop ONLY per user requirement */}
              <div className="p-3 space-y-2.5 flex-1 overflow-y-auto">
                {GLOBAL_CATEGORIES.map((cat) => {
                  const isSelected = activeCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setActiveCategoryId(cat.id);
                        setActiveSubcategory(null); // Return to subcategory selector
                        setIsDrawerOpen(false); // Close drawer immediately on selection
                      }}
                      className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer group ${
                        isSelected
                          ? isDark
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold shadow-sm'
                            : 'bg-emerald-50 border border-emerald-400/50 text-emerald-700 font-bold shadow-sm'
                          : isDark
                          ? 'bg-white/5 hover:bg-white/10 border border-white/5 text-gray-200'
                          : 'bg-gray-100 hover:bg-gray-200/80 border border-gray-200 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : isDark
                              ? 'bg-white/10 text-gray-300 group-hover:text-white'
                              : 'bg-white text-gray-700 shadow-2xs group-hover:text-gray-900'
                          }`}
                        >
                          {renderCategoryIcon(cat.iconName, 17)}
                        </div>
                        <span className="text-xs sm:text-sm tracking-tight">{cat.name}</span>
                      </div>

                      <ChevronRight
                        size={15}
                        className={`transition-transform group-hover:translate-x-0.5 ${
                          isSelected ? 'text-emerald-500' : 'opacity-40'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Drawer Footer */}
              <div
                className={`p-3 border-t text-[10px] text-center opacity-60 leading-tight ${
                  isDark ? 'border-white/10' : 'border-gray-200'
                }`}
              >
                Global Community Chat
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 2. MAIN HEADER (3-lines Menu on Left, Title, Back)       */}
      {/* ======================================================== */}
      <div
        className={`px-3 py-2.5 flex items-center justify-between border-b z-20 transition-colors ${
          isDark ? 'border-white/10 bg-[#121b22]' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex items-center gap-2">
          {/* If inside subcategory chat, show Back Arrow */}
          {activeSubcategory ? (
            <button
              type="button"
              onClick={() => {
                setActiveSubcategory(null);
                setReplyingTo(null);
              }}
              className="p-1.5 -ml-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-gray-800 dark:text-gray-200 transition-colors"
              title="Geri"
            >
              <ArrowLeft size={22} />
            </button>
          ) : (
            /* 3-lines Hamburger Menu button opens left drawer */
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 -ml-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-gray-800 dark:text-gray-200 transition-colors active:scale-95"
              title="Kateqoriyalar"
            >
              <Menu size={22} />
            </button>
          )}

          {/* Header Title & Subtitle */}
          <div className="flex flex-col">
            <h2 className="font-bold text-sm sm:text-base leading-tight flex items-center gap-1.5 text-gray-950 dark:text-white">
              {activeSubcategory ? (
                <>
                  <span className="inline-flex items-center gap-1.5">
                    {renderBrandSubcategoryIcon(activeSubcategory.id, 17)}
                    <span className="truncate">{activeSubcategory.name}</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-emerald-500/15 text-emerald-500">
                    {labels.global}
                  </span>
                </>
              ) : (
                <>
                  <span>{activeCategory.name}</span>
                  <span className="text-[11px] font-normal opacity-60">
                    ({labels.globalChat})
                  </span>
                </>
              )}
            </h2>
            <span className="text-[11px] opacity-65 leading-tight flex items-center gap-1 mt-0.5">
              {activeSubcategory ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  <span>
                    {activeSubcategory.memberCount} {labels.members} • {activeSubcategory.onlineCount} {labels.online}
                  </span>
                </>
              ) : (
                <span>
                  {activeCategory.subcategories.length} alt kateqoriya • {labels.categories}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Right Action: NO 3-DOTS MENU PER REQUIREMENT! Only close button or drawer toggle */}
        <div className="flex items-center gap-1">
          {activeSubcategory && (
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 cursor-pointer transition-colors"
              title={labels.categories}
            >
              <Menu size={20} />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 cursor-pointer transition-colors"
            title="Bağla"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. BODY VIEW: SUBCATEGORY SELECTION vs CHAT STREAM       */}
      {/* ======================================================== */}
      {!activeSubcategory ? (
        /* VIEW A: SUBCATEGORIES LIST FOR SELECTED MAIN CATEGORY */
        /* CRITICAL: Active Category Block stays FIXED (SABIT) during scrolling */
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Sabit (Fixed) Active Category Header Banner */}
          <div
            className={`p-3.5 sm:p-4 shrink-0 border-b backdrop-blur-md z-20 ${
              isDark
                ? 'bg-[#121b22]/95 border-white/10'
                : 'bg-white/95 border-gray-200'
            }`}
          >
            <div
              className={`p-3.5 sm:p-4 rounded-2xl border shadow-sm relative overflow-hidden ${
                isDark
                  ? 'bg-gradient-to-br from-[#182229] to-[#1f2c34] border-white/10'
                  : 'bg-gradient-to-br from-emerald-50/80 via-white to-sky-50/80 border-emerald-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                    {renderCategoryIcon(activeCategory.iconName, 22)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg tracking-tight text-gray-950 dark:text-white">
                      {activeCategory.name}
                    </h3>
                    <p className="text-[11px] opacity-70 leading-tight">
                      {activeCategory.subtitle}
                    </p>
                  </div>
                </div>

                {/* 3-lines category switch button */}
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-all flex items-center gap-1.5 cursor-pointer text-gray-800 dark:text-gray-200 shrink-0"
                >
                  <Menu size={14} />
                  <span>{labels.categories}</span>
                </button>
              </div>

              <p className="text-xs opacity-75 mt-2 leading-relaxed">
                {labels.chooseSubcategory}
              </p>
            </div>
          </div>

          {/* Scrollable Subcategories List */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 pb-28">
            {activeCategory.subcategories.map((sub, idx) => {
              const msgCount = (categoryMessages[sub.id] || []).length;

              return (
                <motion.button
                  key={sub.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveSubcategory(sub)}
                  className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left flex items-center justify-between shadow-xs hover:shadow-md transition-all cursor-pointer group ${
                    isDark
                      ? 'bg-[#182229]/90 hover:bg-[#1f2c34] border-white/10'
                      : 'bg-white hover:bg-gray-50 border-gray-200/90'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Official Brand Icon */}
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: `${sub.accentColor}20`,
                        color: sub.accentColor,
                      }}
                    >
                      {renderBrandSubcategoryIcon(sub.id, 26)}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm sm:text-base text-gray-950 dark:text-white">
                          {idx + 1}. {sub.name}
                        </span>

                        {/* Total messages count inside subcategory */}
                        <span className="text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <MessageSquare size={11} />
                          <span>
                            {msgCount} {labels.messagesCount}
                          </span>
                        </span>

                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/15 text-emerald-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {sub.onlineCount} {labels.online}
                        </span>
                      </div>

                      <p className="text-xs opacity-65 truncate mt-1">
                        {sub.description}
                      </p>

                      <div className="flex items-center gap-3 mt-1.5 text-[11px] opacity-60">
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {sub.memberCount} {labels.members}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-500 dark:text-emerald-400 font-semibold">
                          Canlı müzakirə
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center ml-2 shrink-0 transition-all">
                    <ChevronRight size={18} />
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Bottom Floating Navigation Dock */}
          <div className="absolute bottom-3 inset-x-0 flex items-center justify-center pointer-events-none z-30">
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                boxShadow:
                  'inset 0 1px 0 0 rgba(255, 255, 255, 0.3), 0 10px 30px rgba(0, 0, 0, 0.25)',
              }}
              className="pointer-events-auto px-4 py-2 rounded-full flex items-center gap-4 sm:gap-6 transition-all"
            >
              {/* Left: Şəxsi yazışmalar */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={onSwitchToPersonal}
                  className={`w-20 sm:w-24 py-2.5 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                    isDark
                      ? 'text-gray-300 hover:text-white hover:bg-white/10'
                      : 'text-gray-700 hover:text-gray-950 hover:bg-white/80'
                  }`}
                  title={labels.personal}
                >
                  <Smartphone size={20} className="hidden sm:inline mr-1" />
                  <span className="text-xs font-bold">{labels.personal}</span>
                </button>
              </div>

              {/* Middle: İstifadəçi tap və əlavə et (ID & Username Search) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={onOpenAddUser}
                  className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all shadow-lg active:scale-95 ${
                    isDark
                      ? 'bg-[#252f38] text-white border-2 border-pink-400/40 shadow-[0_0_15px_rgba(244,114,182,0.3)]'
                      : 'bg-white text-gray-900 border-2 border-pink-400/50 shadow-[0_0_15px_rgba(244,114,182,0.25)]'
                  }`}
                  title={labels.addUser}
                >
                  <UserPlus size={22} className="text-pink-500 dark:text-pink-400" />
                </button>
              </div>

              {/* Right: Qlobal çat (ACTIVE) */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  className={`w-20 sm:w-24 py-2.5 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                    isDark
                      ? 'bg-white/20 text-white shadow-xs'
                      : 'bg-white/80 text-gray-950 shadow-xs'
                  }`}
                  title={labels.global}
                >
                  <span className="text-xs font-bold">{labels.global}</span>
                </button>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shadow-xs" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW B: ACTIVE GROUP CHAT FOR SELECTED SUBCATEGORY (NO 3-DOTS MENU!) */
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Fluid live background */}
          <ChatFluidBackground isDark={isDark} />

          {/* Subcategory Chat Messages Stream */}
          <div
            ref={chatScrollContainerRef}
            className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 relative z-10"
          >
            {/* Today banner */}
            <div className="text-center py-1">
              <span
                className={`text-[11px] px-3 py-1 rounded-full border shadow-2xs backdrop-blur-md ${
                  isDark
                    ? 'bg-black/40 border-white/10 text-white/80'
                    : 'bg-white/80 border-gray-200 text-gray-800'
                }`}
              >
                {labels.today}
              </span>
            </div>

            {/* Messages from public.global_messages */}
            {(() => {
              if (dbMessages.length === 0) {
                return (
                  <div className="text-center py-16 px-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-2">
                      <MessageSquare size={22} />
                    </div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Bu qlobal çatda hələ mesaj yoxdur.
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                      İlk mesajı siz göndərərək müzakirəyə başlayın!
                    </p>
                  </div>
                );
              }

              return dbMessages.map((msg) => {
                const isMe = msg.isOutgoing || (currentUser?.id ? msg.senderId === currentUser.id : false);
                return (
                <div
                  key={msg.id}
                  className={`flex flex-col relative z-10 ${
                    isMe ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Swipe-to-Reply Motion Wrapper with touch/drag support (NO ARROW ICON) */}
                  <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.35}
                    onDragEnd={(_e, info) => {
                      if (info.offset.x > 40 || info.offset.x < -40) {
                        setReplyingTo(msg);
                        if (typeof window !== 'undefined' && window.navigator?.vibrate) {
                          window.navigator.vibrate(20);
                        }
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setSelectedMessageForAction(msg);
                    }}
                    onTouchStart={() => {
                      longPressTimerRef.current = setTimeout(() => {
                        setSelectedMessageForAction(msg);
                        if (typeof window !== 'undefined' && window.navigator?.vibrate) {
                          window.navigator.vibrate(30);
                        }
                      }, 450);
                    }}
                    onTouchMove={() => {
                      if (longPressTimerRef.current) {
                        clearTimeout(longPressTimerRef.current);
                        longPressTimerRef.current = null;
                      }
                    }}
                    onTouchEnd={() => {
                      if (longPressTimerRef.current) {
                        clearTimeout(longPressTimerRef.current);
                        longPressTimerRef.current = null;
                      }
                    }}
                    onMouseDown={() => {
                      longPressTimerRef.current = setTimeout(() => {
                        setSelectedMessageForAction(msg);
                      }, 450);
                    }}
                    onMouseMove={() => {
                      if (longPressTimerRef.current) {
                        clearTimeout(longPressTimerRef.current);
                        longPressTimerRef.current = null;
                      }
                    }}
                    onMouseUp={() => {
                      if (longPressTimerRef.current) {
                        clearTimeout(longPressTimerRef.current);
                        longPressTimerRef.current = null;
                      }
                    }}
                    className={`max-w-[76%] sm:max-w-[65%] rounded-2xl p-2.5 sm:p-3 shadow-md backdrop-blur-md transition-all cursor-grab active:cursor-grabbing select-none ${
                      isMe
                        ? isDark
                          ? 'bg-[#005c4b]/90 text-white rounded-tr-xs border border-white/10'
                          : 'bg-[#d9fdd3] text-gray-900 rounded-tr-xs border border-emerald-500/20'
                        : isDark
                        ? 'bg-[#1e293b]/90 text-white rounded-tl-xs border border-white/10'
                        : 'bg-white text-gray-900 rounded-tl-xs border border-gray-200/70'
                    }`}
                  >
                    {/* Sender info: Avatar and Name (clickable to open profile) */}
                    <div
                      onClick={() => handleOpenSenderProfile(msg)}
                      className={`flex items-center gap-1.5 mb-1 cursor-pointer group/sender hover:opacity-85 transition-opacity ${
                        isMe ? 'justify-end' : 'justify-start'
                      }`}
                      title="Profilə bax"
                    >
                      {msg.senderAvatar ? (
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          className="w-4 h-4 rounded-full object-cover ring-1 ring-white/30 shrink-0"
                        />
                      ) : (
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-2xs shrink-0"
                          style={{
                            backgroundColor: isMe
                              ? '#10b981'
                              : msg.senderColor || '#0284c7',
                          }}
                        >
                          {(isMe ? 'S' : msg.senderName).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span
                        className="font-bold text-[11px] leading-none group-hover/sender:underline truncate"
                        style={{
                          color: isMe
                            ? isDark
                              ? '#34d399'
                              : '#059669'
                            : msg.senderColor || '#0284c7',
                        }}
                      >
                        {isMe ? 'Siz' : msg.senderName}
                      </span>
                    </div>

                    {/* Quoted Message / Reply Preview Box */}
                    {msg.replyTo && (
                      <div
                        className={`mb-1 p-1.5 rounded-md border-l-2 text-[10px] select-none ${
                          isDark
                            ? 'bg-black/25 border-emerald-400 text-white/90'
                            : 'bg-black/5 border-emerald-600 text-gray-800'
                        }`}
                      >
                        <div className="font-bold text-[9px] text-emerald-500 dark:text-emerald-400">
                          {msg.replyTo.senderName}
                        </div>
                        <div className="truncate opacity-80 mt-0.5">
                          {msg.replyTo.text}
                        </div>
                      </div>
                    )}

                    {/* Image Attachment */}
                    {msg.type === 'image' && msg.mediaUrl && (
                      <div className="mb-1.5 rounded-xl overflow-hidden max-h-64">
                        <img
                          src={msg.mediaUrl}
                          alt="Media"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Voice Note */}
                    {msg.type === 'voice' && (
                      <div className="my-1">
                        <AudioVoicePlayer
                          duration={msg.voiceDuration || '0:06'}
                          durationSec={msg.voiceDurationSec || 6}
                          time={msg.time}
                          senderName={msg.senderName}
                          isOutgoing={isMe}
                          isDark={isDark}
                          status={msg.status}
                        />
                      </div>
                    )}

                    {/* Location Message */}
                    {msg.type === 'location' && msg.locationInfo && (
                      <div className="my-1 rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
                        <div className="h-20 bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                          <MapPin size={24} />
                        </div>
                        <div className="p-1.5 text-[11px] bg-black/5 dark:bg-white/5">
                          <p className="font-bold truncate">{msg.locationInfo.title}</p>
                          <p className="text-[10px] opacity-70 truncate">{msg.locationInfo.address}</p>
                        </div>
                      </div>
                    )}

                    {/* File Attachment */}
                    {msg.type === 'file' && msg.fileInfo && (
                      <div className="my-1 p-2 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileText size={18} className="text-emerald-500 shrink-0" />
                          <span className="truncate">{msg.fileInfo.name}</span>
                        </div>
                        {msg.fileInfo.fileUrl && (
                          <a
                            href={msg.fileInfo.fileUrl}
                            download={msg.fileInfo.name}
                            className="p-1 rounded text-emerald-500 hover:bg-black/10"
                            title="Faylı yüklə"
                          >
                            <Download size={14} />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Message text */}
                    {msg.text && (
                      <p className="text-xs sm:text-[13px] leading-relaxed break-words whitespace-pre-wrap">
                        {msg.text}
                      </p>
                    )}

                    {/* Reactions display */}
                    {msg.reactions && Object.entries(msg.reactions).some(([_, count]) => count > 0) && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {Object.entries(msg.reactions).map(([emoji, count]) => {
                          if (!count || count <= 0) return null;
                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReactMessage(msg, emoji);
                              }}
                              className="px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-[10px] flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                            >
                              <span>{emoji}</span>
                              <span className="font-semibold">{count}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Timestamp & status with edit indicator */}
                    <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-70">
                      {msg.isEdited && (
                        <span className="text-[9px] opacity-70 italic">(düzəliş edildi)</span>
                      )}
                      <span>{msg.time}</span>
                      {isMe && (
                        <Check size={11} className="text-emerald-400 dark:text-emerald-300" />
                      )}
                    </div>
                  </motion.div>
                </div>
              );
            });
          })()}
          <div ref={messagesEndRef} />
          </div>

          {/* Edit Message Indicator Bar */}
          {editingMessage && (
            <div
              className={`px-3.5 py-1.5 border-t flex items-center justify-between text-xs backdrop-blur-md z-20 ${
                isDark
                  ? 'bg-[#182229] border-white/10 text-white'
                  : 'bg-emerald-50 border-emerald-200 text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2 truncate min-w-0">
                <Edit3 size={15} className="text-emerald-500 shrink-0" />
                <span className="font-bold text-[11px] text-emerald-500">Düzəliş edilir:</span>
                <span className="text-[11px] opacity-75 truncate italic">"{editingMessage.text}"</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingMessage(null);
                  setInputText('');
                }}
                className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer text-gray-500 hover:text-white shrink-0"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Reply Preview Bar above input */}
          {replyingTo && (
            <div
              className={`px-3.5 py-1.5 border-t flex items-center justify-between text-xs backdrop-blur-md z-20 ${
                isDark
                  ? 'bg-[#182229] border-white/10 text-white'
                  : 'bg-white border-gray-200 text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate min-w-0">
                <div className="w-1 h-7 rounded-full bg-emerald-500 shrink-0" />
                <div className="truncate">
                  <p className="font-bold text-[11px] text-emerald-500 leading-tight">
                    {labels.replyingTo(replyingTo.senderName)}
                  </p>
                  <p className="text-[10px] opacity-70 truncate mt-0.5">
                    {replyingTo.text ||
                      (replyingTo.type === 'voice'
                        ? '🎤 Səsli mesaj'
                        : replyingTo.type === 'image'
                        ? '📷 Şəkil'
                        : '📎 Fayl')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Voice Recording In-line Bar OR Standard Input Bar */}
          {isRecordingVoice ? (
            <VoiceRecorderBar
              onSendVoice={handleSendVoiceNote}
              onCancel={() => setIsRecordingVoice(false)}
              isDark={isDark}
            />
          ) : (
            <div
              className={`p-2 sm:p-2.5 border-t flex items-center gap-1.5 sm:gap-2 z-20 ${
                isDark ? 'bg-[#1f2c34] border-white/10' : 'bg-[#f0f2f5] border-gray-200'
              }`}
            >
              {/* Input Pill Container */}
              <div
                className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-full border ${
                  isDark
                    ? 'bg-[#2a3942] border-white/10 text-white'
                    : 'bg-white border-gray-300 text-gray-900 shadow-2xs'
                }`}
              >
                {/* Emoji button */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className="text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer transition-colors shrink-0 p-0.5"
                  title="Smayliklər"
                >
                  <Smile size={20} />
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={labels.inputPlaceholder}
                  className="flex-1 bg-transparent text-xs sm:text-[13px] focus:outline-none placeholder-gray-400"
                />

                {/* Attach File/Media Sheet trigger */}
                <button
                  type="button"
                  onClick={() => onOpenAttachSheet('global')}
                  className="text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer transition-colors shrink-0 p-0.5"
                  title="Fayl və Media"
                >
                  <Paperclip size={20} />
                </button>
              </div>

              {/* Send or Voice Note button */}
              {inputText.trim() ? (
                <button
                  type="button"
                  onClick={handleSendMessage}
                  className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform active:scale-95 shrink-0"
                  title={editingMessage ? 'Düzəlişi yadda saxla' : 'Göndər'}
                >
                  <Send size={18} className="ml-0.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsRecordingVoice(true)}
                  className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform active:scale-95 shrink-0"
                  title="Səsli mesaj yaz"
                >
                  <Mic size={18} />
                </button>
              )}
            </div>
          )}

          {/* WhatsApp Emoji Picker */}
          {showEmojiPicker && (
            <div className="z-30 border-t border-black/10 dark:border-white/10">
              <WhatsAppEmojiPicker
                onSelectEmoji={(emoji) => setInputText((prev) => prev + emoji)}
                onBackspace={() => setInputText((prev) => prev.slice(0, -1))}
                isDark={isDark}
              />
            </div>
          )}

          {/* Message Context Actions Modal (Düzəliş et & Sil & Reaksiyalar) */}
          <MessageActionsModal
            isOpen={Boolean(selectedMessageForAction)}
            onClose={() => setSelectedMessageForAction(null)}
            message={selectedMessageForAction}
            onEdit={handleStartEditMessage}
            onDelete={handleDeleteMessage}
            onReact={handleReactMessage}
            isDark={isDark}
          />
        </div>
      )}
    </div>
  );
};
