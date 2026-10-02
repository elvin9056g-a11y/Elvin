import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Users,
  Search,
  Check,
  Plus,
  ArrowRight,
  ArrowLeft,
  Camera,
  Shield,
  Lock,
  Sparkles,
} from 'lucide-react';
import { ChatConversation } from './types';
import { Language, UserProfile } from '../../types';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableContacts: ChatConversation[];
  currentUser?: UserProfile | null;
  currentUserName?: string;
  currentLanguage?: Language;
  isDark?: boolean;
  onCreateGroup: (groupData: {
    name: string;
    avatarUrl?: string;
    bio?: string;
    memberIds: string[];
    allowedWriters: 'all' | 'admins' | 'selected';
    allowedWriterIds?: string[];
  }) => void;
}

const PRESET_GROUP_AVATARS = [
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=150&auto=format&fit=crop&q=80',
];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  availableContacts,
  currentUser,
  currentUserName = 'Siz',
  currentLanguage = 'az',
  isDark = true,
  onCreateGroup,
}) => {
  // Wizard steps: 1 = Üzv seçimi, 2 = Qrup məlumatları & İcazələr
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Member Selection
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [searchContactQuery, setSearchContactQuery] = useState('');

  // Step 2: Group Info
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState(PRESET_GROUP_AVATARS[0]);
  const [groupBio, setGroupBio] = useState('');
  const [allowedWriters, setAllowedWriters] = useState<'all' | 'admins' | 'selected'>('all');
  const [selectedWriterIds, setSelectedWriterIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleResetAndClose = () => {
    setStep(1);
    setSelectedMemberIds([]);
    setSearchContactQuery('');
    setGroupName('');
    setGroupBio('');
    setAllowedWriters('all');
    setSelectedWriterIds([]);
    onClose();
  };

  const toggleSelectMember = (contactId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  const toggleWriterId = (contactId: string) => {
    setSelectedWriterIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  // Filter contacts by search query
  const filteredContacts = availableContacts.filter((c) => {
    const q = searchContactQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.userCode && c.userCode.toLowerCase().includes(q))
    );
  });

  const selectedMembersList = availableContacts.filter((c) =>
    selectedMemberIds.includes(c.id)
  );

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    onCreateGroup({
      name: groupName.trim(),
      avatarUrl: groupAvatar,
      bio: groupBio.trim(),
      memberIds: selectedMemberIds,
      allowedWriters,
      allowedWriterIds: allowedWriters === 'selected' ? selectedWriterIds : undefined,
    });

    handleResetAndClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`w-full max-w-md rounded-3xl p-5 shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden ${
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
                <h3 className="text-base font-bold leading-tight">
                  {step === 1 ? 'Qrup Yarat (1/2: Üzvlər)' : 'Qrup Yarat (2/2: Məlumatlar)'}
                </h3>
                <p className="text-xs opacity-60">
                  {step === 1
                    ? `${selectedMemberIds.length} kontakt seçildi`
                    : 'Qrup adı, şəkli və icazələr'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetAndClose}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
            >
              <X size={20} />
            </button>
          </div>

          {/* STEP 1: Üzv Seçimi */}
          {step === 1 && (
            <div className="flex-1 flex flex-col min-h-0 py-3 space-y-3">
              {/* Search contacts */}
              <div
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border shadow-xs ${
                  isDark
                    ? 'bg-white/5 border-white/15 focus-within:border-emerald-400'
                    : 'bg-gray-50 border-gray-200 focus-within:border-emerald-500'
                }`}
              >
                <Search size={16} className="opacity-50 shrink-0" />
                <input
                  type="text"
                  value={searchContactQuery}
                  onChange={(e) => setSearchContactQuery(e.target.value)}
                  placeholder="Kontaktlar arasında axtar..."
                  className="w-full bg-transparent text-xs focus:outline-none placeholder-gray-400"
                />
                {searchContactQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchContactQuery('')}
                    className="opacity-50 hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Selected chips bar */}
              {selectedMembersList.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none shrink-0">
                  {selectedMembersList.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => toggleSelectMember(m.id)}
                      className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 text-[11px] font-semibold cursor-pointer shrink-0 hover:bg-emerald-500/30 transition-colors"
                    >
                      <span className="truncate max-w-[90px]">{m.name}</span>
                      <X size={12} />
                    </div>
                  ))}
                </div>
              )}

              {/* Contact List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {filteredContacts.length === 0 ? (
                  <div className="py-12 text-center text-xs opacity-50">
                    Aktiv kontakt tapılmadı. (Yalnız birbaşa yazışdığınız kontaktlar əlavə edilə bilər)
                  </div>
                ) : (
                  filteredContacts.map((contact) => {
                    const isSelected = selectedMemberIds.includes(contact.id);
                    return (
                      <div
                        key={contact.id}
                        onClick={() => toggleSelectMember(contact.id)}
                        className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          isSelected
                            ? isDark
                              ? 'bg-emerald-500/15 border-emerald-500/50'
                              : 'bg-emerald-50 border-emerald-300'
                            : isDark
                            ? 'bg-white/5 border-white/10 hover:bg-white/10'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {contact.avatarUrl ? (
                            <img
                              src={contact.avatarUrl}
                              alt={contact.name}
                              className="w-9 h-9 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                              {contact.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold truncate leading-tight">
                              {contact.name}
                            </h4>
                            {contact.userCode && (
                              <p className="text-[10px] opacity-60 truncate">
                                ID: {contact.userCode}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* + / Check Icon button */}
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : isDark
                              ? 'bg-white/10 text-white/70 hover:bg-white/20'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {isSelected ? <Check size={14} strokeWidth={3} /> : <Plus size={15} />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Step 1 Footer */}
              <div className="pt-3 border-t border-white/10 dark:border-white/10 border-gray-200 shrink-0 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className={`py-2.5 px-4 rounded-xl text-xs font-semibold border cursor-pointer ${
                    isDark
                      ? 'border-white/15 hover:bg-white/10 text-white/80'
                      : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  Ləğv et
                </button>

                <button
                  type="button"
                  disabled={selectedMemberIds.length === 0}
                  onClick={() => setStep(2)}
                  className="py-2.5 px-5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
                >
                  <span>Növbəti ({selectedMemberIds.length})</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Qrup Məlumatları və İcazələr */}
          {step === 2 && (
            <form onSubmit={handleFinalSubmit} className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
              {/* Group Avatar Selection */}
              <div>
                <label className="block text-xs font-semibold mb-2 opacity-80">
                  Qrup Şəkli:
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md shrink-0">
                    <img src={groupAvatar} alt="Group" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                    {PRESET_GROUP_AVATARS.map((url, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setGroupAvatar(url)}
                        className={`w-10 h-10 rounded-xl overflow-hidden border-2 cursor-pointer transition-transform shrink-0 ${
                          groupAvatar === url
                            ? 'border-emerald-500 scale-105 shadow-sm'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt={`preset-${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Group Name Input */}
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">
                  Qrupun Adı: <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Məs: Dizayn və AI Müzakirələri"
                  className={`w-full p-3 rounded-2xl text-xs border focus:outline-none transition-all ${
                    isDark
                      ? 'bg-white/5 border-white/15 focus:border-emerald-400 placeholder-white/40'
                      : 'bg-gray-50 border-gray-300 focus:border-emerald-500 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Group Bio / Description */}
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">
                  Qrupun Bio-su / Haqqında (istəyə bağlı):
                </label>
                <textarea
                  rows={2}
                  value={groupBio}
                  onChange={(e) => setGroupBio(e.target.value)}
                  placeholder="Qrup qaydaları, müzakirə mövzusu və s."
                  className={`w-full p-3 rounded-2xl text-xs border focus:outline-none transition-all resize-none ${
                    isDark
                      ? 'bg-white/5 border-white/15 focus:border-emerald-400 placeholder-white/40'
                      : 'bg-gray-50 border-gray-300 focus:border-emerald-500 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Automatic Admin Notice */}
              <div
                className={`p-3 rounded-2xl border flex items-center gap-3 ${
                  isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                  <Shield size={18} />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-emerald-500 dark:text-emerald-400 block">
                    İnzibatçı: {currentUserName}
                  </span>
                  <span className="text-[11px] opacity-75">
                    Qrupu yaradan şəxs avtomatik olaraq İnzibatçı (Admin) təyin olunur.
                  </span>
                </div>
              </div>

              {/* Group Messaging Permission Setting */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-emerald-500 dark:text-emerald-400">
                  Kimlər mesaj yaza bilər?
                </label>
                <div className="space-y-1.5">
                  {[
                    {
                      id: 'all',
                      title: 'Hamı',
                      desc: 'Bütün qrup üzvləri sərbəst mesaj yaza bilər',
                    },
                    {
                      id: 'admins',
                      title: 'Yalnız İnzibatçılar',
                      desc: 'Yalnız adminlər mesaj yaza bilər (Kanal rejimi)',
                    },
                    {
                      id: 'selected',
                      title: 'Seçilmiş Şəxslər',
                      desc: 'Yalnız admin və xüsusi icazə verilmiş üzvlər yaza bilər',
                    },
                  ].map((opt) => {
                    const isSelected = allowedWriters === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setAllowedWriters(opt.id as any)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
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

                {/* If 'selected' writer mode is picked, show checkboxes for members */}
                {allowedWriters === 'selected' && (
                  <div className="mt-3 p-3 rounded-2xl border border-white/10 bg-black/10 space-y-2">
                    <p className="text-[11px] font-bold opacity-80">
                      Mesaj yazma icazəsi olan üzvləri seçin:
                    </p>
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {selectedMembersList.map((m) => {
                        const canWrite = selectedWriterIds.includes(m.id);
                        return (
                          <div
                            key={m.id}
                            onClick={() => toggleWriterId(m.id)}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer text-xs"
                          >
                            <span className="truncate">{m.name}</span>
                            <input
                              type="checkbox"
                              checked={canWrite}
                              onChange={() => toggleWriterId(m.id)}
                              className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2 Footer */}
              <div className="pt-3 border-t border-white/10 dark:border-white/10 border-gray-200 shrink-0 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`py-2.5 px-4 rounded-xl text-xs font-semibold border cursor-pointer flex items-center gap-1.5 ${
                    isDark
                      ? 'border-white/15 hover:bg-white/10 text-white/80'
                      : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <ArrowLeft size={14} />
                  <span>Geri</span>
                </button>

                <button
                  type="submit"
                  disabled={!groupName.trim()}
                  className="py-2.5 px-5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
                >
                  <Sparkles size={14} />
                  <span>Qrupu Yarat</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
