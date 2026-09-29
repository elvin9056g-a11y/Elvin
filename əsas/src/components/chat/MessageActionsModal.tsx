import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Edit3, Trash2, X, MessageSquare } from 'lucide-react';
import { ChatMessage } from './types';

interface MessageActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: ChatMessage | null;
  onEdit: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
  onReact?: (message: ChatMessage, emoji: string) => void;
  isDark?: boolean;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏'];

export const MessageActionsModal: React.FC<MessageActionsModalProps> = ({
  isOpen,
  onClose,
  message,
  onEdit,
  onDelete,
  onReact,
  isDark = true,
}) => {
  if (!isOpen || !message) return null;

  const canEdit = Boolean(message.isOutgoing && (message.text || message.type === 'text'));
  const canDelete = Boolean(message.isOutgoing);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs select-none">
        {/* Backdrop click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal / Action Sheet */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`relative z-10 w-full sm:max-w-xs rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 border shadow-2xl flex flex-col gap-3 ${
            isDark
              ? 'bg-[#182229] border-white/15 text-white'
              : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          {/* Header & Preview snippet */}
          <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
            <div className="flex items-center gap-2 truncate">
              <MessageSquare size={16} className="text-emerald-500 shrink-0" />
              <span className="font-bold text-xs uppercase tracking-wider opacity-75">
                Mesaj Seçimləri
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Quick Reaction Emojis */}
          {onReact && (
            <div className="flex items-center justify-between px-1 py-1.5 bg-black/5 dark:bg-white/5 rounded-2xl">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onReact(message, emoji);
                    onClose();
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:scale-125 transition-transform text-lg cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Message snippet preview */}
          <div
            className={`p-2.5 rounded-xl text-xs truncate max-h-16 overflow-hidden ${
              isDark ? 'bg-black/30 text-white/90' : 'bg-gray-100 text-gray-800'
            }`}
          >
            <p className="line-clamp-2 leading-relaxed italic">
              "{message.text || (message.type === 'voice' ? '🎤 Səsli mesaj' : message.type === 'image' ? '📷 Şəkil' : '📎 Fayl')}"
            </p>
          </div>

          {/* Actions List */}
          <div className="space-y-1.5 pt-1">
            {/* 1. Düzəliş et */}
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  onEdit(message);
                  onClose();
                }}
                className={`w-full py-2.5 px-3 rounded-2xl flex items-center gap-3 text-xs font-semibold cursor-pointer transition-colors text-left ${
                  isDark
                    ? 'hover:bg-white/10 text-emerald-400'
                    : 'hover:bg-emerald-50 text-emerald-700'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                  <Edit3 size={17} />
                </div>
                <span>Düzəliş et</span>
              </button>
            )}

            {/* 2. Sil */}
            {canDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(message);
                  onClose();
                }}
                className="w-full py-2.5 px-3 rounded-2xl flex items-center gap-3 text-xs font-semibold text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-500 flex items-center justify-center shrink-0">
                  <Trash2 size={17} />
                </div>
                <span>Sil</span>
              </button>
            )}
          </div>

          {/* Cancel button */}
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-2 rounded-xl text-xs font-semibold text-center border cursor-pointer mt-1 ${
              isDark
                ? 'border-white/10 text-gray-300 hover:bg-white/5'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Ləğv et
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
