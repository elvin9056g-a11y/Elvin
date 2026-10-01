import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Users,
  Shield,
  Lock,
  Check,
  UserCheck,
  Plus,
  Trash2,
} from 'lucide-react';
import { ChatConversation } from './types';
import { UserProfile } from '../../types';

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: ChatConversation | null;
  currentUser?: UserProfile | null;
  allContacts: ChatConversation[];
  isDark?: boolean;
  onUpdateGroup: (updated: ChatConversation) => void;
}

export const GroupSettingsModal: React.FC<GroupSettingsModalProps> = ({
  isOpen,
  onClose,
  group,
  currentUser,
  allContacts,
  isDark = true,
  onUpdateGroup,
}) => {
  if (!isOpen || !group) return null;

  const myId = currentUser?.id || 'me';
  const isAdmin = group.admins?.includes(myId) || group.creatorId === myId;

  const [allowedWriters, setAllowedWriters] = useState<'all' | 'admins' | 'selected'>(
    group.allowedWriters || 'all'
  );
  const [allowedWriterIds, setAllowedWriterIds] = useState<string[]>(
    group.allowedWriterIds || []
  );

  const handleSavePermissions = () => {
    const updated: ChatConversation = {
      ...group,
      allowedWriters,
      allowedWriterIds: allowedWriters === 'selected' ? allowedWriterIds : undefined,
    };
    onUpdateGroup(updated);
    onClose();
  };

  const toggleWriter = (memberId: string) => {
    setAllowedWriterIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  // Find contact names for member IDs
  const memberDetails = (group.members || []).map((mId) => {
    if (mId === myId) {
      return {
        id: myId,
        name: `${currentUser?.firstName || 'Siz'} ${currentUser?.lastName || ''}`.trim() || 'Siz',
        avatarUrl: currentUser?.avatarUrl,
        isAdmin: true,
      };
    }
    const contact = allContacts.find((c) => c.id === mId);
    return {
      id: mId,
      name: contact?.name || 'Üzv',
      avatarUrl: contact?.avatarUrl,
      isAdmin: Boolean(group.admins?.includes(mId) || group.creatorId === mId),
    };
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`w-full max-w-md rounded-3xl p-5 shadow-2xl border flex flex-col max-h-[85vh] overflow-hidden ${
            isDark
              ? 'bg-[#182229] border-white/15 text-white'
              : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 dark:border-white/10 border-gray-200 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                <Users size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold leading-tight">{group.name}</h3>
                <p className="text-xs opacity-60">Qrup məlumatı və ayarları</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
            {/* Bio / Description */}
            {group.bio && (
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[11px] font-bold opacity-60 mb-0.5">Haqqında / Bio:</p>
                <p className="text-xs leading-relaxed">{group.bio}</p>
              </div>
            )}

            {/* Messaging Permissions ("Kimlər mesaj yaza bilər?") */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                  Kimlər mesaj yaza bilər?
                </label>
                {!isAdmin && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold">
                    Yalnız İnzibatçı dəyişə bilər
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                {[
                  {
                    id: 'all',
                    title: 'Hamı',
                    desc: 'Bütün qrup üzvləri sərbəst yaza bilər',
                  },
                  {
                    id: 'admins',
                    title: 'Yalnız İnzibatçılar',
                    desc: 'Yalnız adminlər mesaj göndərə bilər (Kanal rejimi)',
                  },
                  {
                    id: 'selected',
                    title: 'Seçilmiş Şəxslər',
                    desc: 'Yalnız admin və icazə verilmiş üzvlər yaza bilər',
                  },
                ].map((opt) => {
                  const isSelected = allowedWriters === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        if (isAdmin) setAllowedWriters(opt.id as any);
                      }}
                      className={`p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                        !isAdmin ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        isSelected
                          ? isDark
                            ? 'bg-emerald-500/15 border-emerald-500/50 shadow-sm'
                            : 'bg-emerald-50 border-emerald-400 shadow-sm'
                          : isDark
                          ? 'bg-white/5 border-white/10 hover:bg-white/10'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-gray-400 opacity-60'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-xs font-bold leading-tight ${
                            isSelected ? 'text-emerald-500 dark:text-emerald-400' : ''
                          }`}
                        >
                          {opt.title}
                        </div>
                        <div className="text-[11px] opacity-70 leading-normal mt-0.5">
                          {opt.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected writers checklist */}
              {allowedWriters === 'selected' && (
                <div className="p-3 rounded-2xl border border-white/10 bg-black/10 space-y-2">
                  <p className="text-[11px] font-bold opacity-80">
                    Mesaj yazma icazəsi olan şəxslər:
                  </p>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {memberDetails.map((m) => {
                      if (m.isAdmin) return null; // Admin already has access
                      const canWrite = allowedWriterIds.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            if (isAdmin) toggleWriter(m.id);
                          }}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs ${
                            isAdmin ? 'hover:bg-white/5 cursor-pointer' : 'opacity-70'
                          }`}
                        >
                          <span className="truncate">{m.name}</span>
                          <input
                            type="checkbox"
                            disabled={!isAdmin}
                            checked={canWrite}
                            onChange={() => {
                              if (isAdmin) toggleWriter(m.id);
                            }}
                            className="accent-emerald-500 w-4 h-4 rounded"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Member List */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-70">
                Qrup Üzvləri ({memberDetails.length}):
              </label>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {memberDetails.map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {m.avatarUrl ? (
                        <img
                          src={m.avatarUrl}
                          alt={m.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-semibold block truncate leading-tight">
                          {m.name}
                        </span>
                        {m.id === myId && (
                          <span className="text-[10px] opacity-60">Siz</span>
                        )}
                      </div>
                    </div>

                    {m.isAdmin && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center gap-1 shrink-0">
                        <Shield size={11} />
                        <span>İnzibatçı</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-white/10 dark:border-white/10 border-gray-200 shrink-0 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`py-2 px-4 rounded-xl text-xs font-semibold border cursor-pointer ${
                isDark
                  ? 'border-white/15 hover:bg-white/10 text-white/80'
                  : 'border-gray-300 hover:bg-gray-100 text-gray-700'
              }`}
            >
              Bağla
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={handleSavePermissions}
                className="py-2 px-5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white cursor-pointer shadow-md transition-all"
              >
                Yadda saxla
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
