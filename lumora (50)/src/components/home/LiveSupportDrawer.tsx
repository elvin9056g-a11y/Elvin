import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Send,
  Image as ImageIcon,
  Headphones,
  CheckCheck,
  Trash2,
  Maximize2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { SupportMessage, Translations } from '../../types';
import { translations } from '../../data/translations';

interface LiveSupportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  t?: Translations;
}

export const LiveSupportDrawer: React.FC<LiveSupportDrawerProps> = ({
  isOpen,
  onClose,
  userName = 'İstifadəçi',
  t,
}) => {
  const { isDark } = useTheme();
  const supportT = t?.support || translations.az.support;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial message: localized welcome
  const [messages, setMessages] = useState<SupportMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'support',
      text: supportT.greetingMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewEnlarged, setPreviewEnlarged] = useState<string | null>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('Şəklin həcmi 8 MB-dan çox olmamalıdır.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    const userMsg: SupportMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: inputText.trim() || undefined,
      imageUrl: selectedImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setSelectedImage(null);

    // Courtesy automated response from Live Support team
    setTimeout(() => {
      const replyMsg: SupportMessage = {
        id: 'reply_' + Date.now(),
        sender: 'support',
        text: 'Mesajınız qəbul edildi. Operatorumuz dərhal sizinlə əlaqə saxlayır, zəhmət olmasa gözləyin.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, replyMsg]);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`relative z-10 w-full sm:max-w-[420px] h-[92vh] sm:h-[620px] flex flex-col rounded-t-[32px] sm:rounded-[32px] border overflow-hidden shadow-2xl transition-all ${
          isDark
            ? 'bg-[#13141a]/95 border-white/20 text-white'
            : 'bg-white/95 border-gray-200 text-gray-900 shadow-xl'
        }`}
        style={{
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Support Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between select-none ${
            isDark
              ? 'bg-[#181a24]/90 border-white/10'
              : 'bg-gray-50/90 border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md">
                <Headphones size={20} />
              </div>
              {/* Online Green Pulsing Indicator */}
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#13141a]"></span>
              </span>
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide text-gray-950 dark:text-white">
                {supportT.drawerTitle}
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span>{supportT.onlineStatus}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Bağla"
            className={`w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${
              isDark
                ? 'border-white/10 hover:bg-white/10 text-white/70'
                : 'border-gray-200 hover:bg-gray-100 text-gray-700'
            }`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[75%] rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-md text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-br-none'
                    : isDark
                    ? 'bg-white/10 border border-white/10 text-white/90 rounded-bl-none'
                    : 'bg-gray-100 border border-gray-200 text-gray-900 rounded-bl-none'
                }`}
              >
                {/* Optional Attached Image */}
                {msg.imageUrl && (
                  <div className="relative mb-1.5 rounded-lg sm:rounded-xl overflow-hidden group cursor-pointer max-w-[190px]">
                    <img
                      src={msg.imageUrl}
                      alt="Göndərilən şəkil"
                      className="w-full max-h-40 object-cover rounded-lg sm:rounded-xl"
                      onClick={() => setPreviewEnlarged(msg.imageUrl || null)}
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs gap-1 font-semibold">
                      <Maximize2 size={16} />
                    </div>
                  </div>
                )}

                {/* Text */}
                {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                {/* Timestamp */}
                <div
                  className={`mt-1 text-[10px] text-right flex items-center justify-end gap-1 ${
                    msg.sender === 'user' ? 'text-white/80' : isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'user' && <CheckCheck size={12} />}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Image Attachment Preview Bar */}
        {selectedImage && (
          <div
            className={`px-4 py-2 border-t flex items-center justify-between ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <img
                src={selectedImage}
                alt="Seçilmiş şəkil"
                className="w-10 h-10 object-cover rounded-lg border border-emerald-500/40"
              />
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                {supportT.uploadImage}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="p-1 text-red-500 hover:text-red-600 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}

        {/* Input Bar: Message + Image upload only */}
        <form
          onSubmit={handleSendMessage}
          className={`p-3 border-t flex items-center gap-2 select-none ${
            isDark ? 'bg-[#181a24] border-white/10' : 'bg-white border-gray-200'
          }`}
        >
          {/* Hidden File Input for Images only */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />

          {/* Photo attach button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title={supportT.uploadImage}
            aria-label={supportT.uploadImage}
            className={`p-2.5 rounded-full border transition-all cursor-pointer ${
              selectedImage
                ? 'bg-emerald-500 text-black border-emerald-500'
                : isDark
                ? 'bg-white/10 hover:bg-white/15 border-white/15 text-white/80'
                : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700'
            }`}
          >
            <ImageIcon size={18} />
          </button>

          {/* Text input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={supportT.placeholder}
            className={`flex-1 px-4 py-2.5 rounded-full text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-400 transition-all ${
              isDark
                ? 'bg-white/5 border-white/15 text-white placeholder-white/40'
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() && !selectedImage}
            aria-label={supportT.sendBtn}
            className="p-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold shadow-md cursor-pointer transition-all active:scale-95"
          >
            <Send size={16} />
          </button>
        </form>

        {/* Modal preview for enlarged images */}
        <AnimatePresence>
          {previewEnlarged && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewEnlarged(null)}
              className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
            >
              <img
                src={previewEnlarged}
                alt="Böyüdülmüş şəkil"
                className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
