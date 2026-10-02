import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Bell,
  Upload,
  Search,
  Check,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Users,
  User,
  Image as ImageIcon,
  Send,
  Trash2,
  Sparkles,
} from 'lucide-react';
import {
  supabase,
  uploadNotificationIconToSupabase,
  sendNotificationToDb,
  searchProfiles,
} from '../../lib/supabase';
import { UserProfile } from '../../types';

interface NotificationSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSent: () => void;
}

export const NotificationSendModal: React.FC<NotificationSendModalProps> = ({
  isOpen,
  onClose,
  onSent,
}) => {
  // Form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [iconUrl, setIconUrl] = useState<string>('');
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string>('');
  const [uploadingIcon, setUploadingIcon] = useState(false);

  // Recipient selection (Bütün İstifadəçilərə vs Müəyyən İstifadəçi)
  const [recipientType, setRecipientType] = useState<'all' | 'specific'>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState<UserProfile[]>([]);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userSearchRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status & Feedback
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setContent('');
      setIconUrl('');
      setIconFile(null);
      setIconPreview('');
      setRecipientType('all');
      setSelectedUser(null);
      setUserSearchQuery('');
      setUserSearchResults([]);
      setIsUserDropdownOpen(false);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  // Click outside listener for user search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userSearchRef.current && !userSearchRef.current.contains(e.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search profiles when typing
  useEffect(() => {
    if (!userSearchQuery.trim()) {
      setUserSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const results = await searchProfiles(userSearchQuery);
        setUserSearchResults(results);
        setIsUserDropdownOpen(true);
      } catch (err) {
        console.warn('Search profiles error:', err);
      } finally {
        setSearchingUsers(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  // Handle icon file selection and instant upload to Supabase Storage ('notification_icons')
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview immediately
    const localUrl = URL.createObjectURL(file);
    setIconPreview(localUrl);
    setIconFile(file);
    setUploadingIcon(true);
    setErrorMsg(null);

    try {
      const publicUrl = await uploadNotificationIconToSupabase(file);
      setIconUrl(publicUrl);
    } catch (err: any) {
      console.error('Error uploading notification icon:', err);
      setErrorMsg('İkon şəkli yüklənərkən xəta baş verdi: ' + (err?.message || ''));
    } finally {
      setUploadingIcon(false);
      // Reset input value so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveIcon = () => {
    setIconUrl('');
    setIconPreview('');
    setIconFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Quick title emoji helpers
  const titlePresets = ['🔥 Xüsusi Endirim', '📢 Yeni Məlumat', '🎁 Hədiyyə Kampaniyası', '⚡ Super Təklif', '🔔 Bildiriş'];

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMsg('Zəhmət olmasa bildirişin başlığını daxil edin.');
      return;
    }

    const cleanContent = content.trim();
    if (!cleanContent) {
      setErrorMsg('Zəhmət olmasa bildirişin ətraflı mətnini daxil edin.');
      return;
    }

    // Determine target user_id
    const targetUserId = recipientType === 'specific' && selectedUser?.id ? selectedUser.id : null;
    if (recipientType === 'specific' && !targetUserId) {
      setErrorMsg('Zəhmət olmasa bildirişi göndərmək üçün istifadəçi seçin və ya "Bütün İstifadəçilərə" qeyd edin.');
      return;
    }

    // If icon is still uploading, wait
    if (uploadingIcon) {
      setErrorMsg('İkon şəkli hələ yüklənir, zəhmət olmasa bir neçə saniyə gözləyin.');
      return;
    }

    setSending(true);
    try {
      const res = await sendNotificationToDb({
        title: cleanTitle,
        content: cleanContent,
        icon_url: iconUrl || null,
        user_id: targetUserId,
      });

      if (!res.success) {
        throw new Error(res.error || 'Bildiriş göndərilərkən xəta baş verdi.');
      }

      setSuccessMsg('Bildiriş uğurla göndərildi!');
      setTimeout(() => {
        onSent();
        onClose();
      }, 900);
    } catch (err: any) {
      console.error('Submit notification error:', err);
      setErrorMsg(err?.message || 'Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-xl my-8 bg-[#11131a] border border-white/15 rounded-[28px] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Yeni Bildiriş Göndər</span>
              </h3>
              <p className="text-xs text-gray-400">
                İstifadəçilərə fərdi və ya ümumi sistem bildirişi göndərin
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Bağla"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Error / Success Feedback */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. İKON (FILE INPUT) - Qalereyadan şəkil seçmək üçün */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon size={14} className="text-cyan-400" />
                <span>Bildiriş İkonu (Şəkil)</span>
              </span>
              <span className="text-[11px] font-normal text-gray-500">Könüllü</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="notification-icon-upload"
            />

            {iconPreview || iconUrl ? (
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-cyan-500/40 bg-black/40 shrink-0 flex items-center justify-center">
                  <img
                    src={iconPreview || iconUrl}
                    alt="İkon"
                    className="w-full h-full object-cover"
                  />
                  {uploadingIcon && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <RefreshCw size={16} className="animate-spin text-cyan-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">
                      {iconFile ? iconFile.name : 'Yüklənmiş İkon'}
                    </span>
                    {uploadingIcon ? (
                      <span className="text-[10px] text-cyan-400 animate-pulse font-mono">
                        Yüklənir...
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-bold">
                        <Check size={11} />
                        <span>Storage-də saxlanıldı</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Bildiriş kartında bu ikon aydın şəkildə görünəcək.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Dəyiş
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveIcon}
                    className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                    title="Sil"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group border-2 border-dashed border-white/15 hover:border-cyan-500/50 rounded-2xl p-4 text-center cursor-pointer transition-all hover:bg-cyan-500/[0.03]"
              >
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-cyan-500/15 text-gray-400 group-hover:text-cyan-400 flex items-center justify-center transition-colors">
                    <Upload size={18} />
                  </div>
                  <span className="text-xs font-bold text-gray-200 group-hover:text-cyan-300 transition-colors">
                    Qalereyadan Şəkil Seç
                  </span>
                  <span className="text-[10px] text-gray-500">
                    PNG, JPG və ya WebP formatında ikon faylı (Sadəcə seçin, avtomatik Supabase Storage-ə yüklənəcək)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. BAŞLIQ (TEXT INPUT) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
              <span>Bildirişin Başlığı</span>
              <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="məs: 🔥 Xüsusi Endirim Kampaniyası"
              className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all"
            />

            {/* Quick title suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                <Sparkles size={10} className="text-cyan-400" />
                <span>Nümunələr:</span>
              </span>
              {titlePresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTitle(preset)}
                  className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-cyan-500/15 hover:text-cyan-300 text-gray-400 text-[10px] transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* 3. MAHİYYƏT (TEXTAREA - HÜNDÜR QUTU) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
              <span>Mahiyyət (Ətraflı Mətn)</span>
              <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Bildirişin ətraflı məzmununu buraya qeyd edin... (məs: Bütün kateqoriyalardakı seçilmiş məhsullara 30% endirim tətbiq edildi. Fürsətdən yararlanmağa tələsin!)"
              className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs sm:text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all leading-relaxed resize-y min-h-[120px]"
            />
          </div>

          {/* 4. KİMƏ (USER SEARCH/SELECT) */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users size={14} className="text-cyan-400" />
                <span>Kimə Göndərilsin?</span>
              </span>
            </label>

            {/* Recipient Type Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/[0.03] border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setRecipientType('all');
                  setSelectedUser(null);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  recipientType === 'all'
                    ? 'bg-cyan-500 text-gray-950 shadow-md shadow-cyan-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Users size={14} />
                <span>Bütün İstifadəçilərə</span>
              </button>

              <button
                type="button"
                onClick={() => setRecipientType('specific')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  recipientType === 'specific'
                    ? 'bg-cyan-500 text-gray-950 shadow-md shadow-cyan-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <User size={14} />
                <span>Müəyyən İstifadəçiyə</span>
              </button>
            </div>

            {/* User Search & Selection Field if 'specific' */}
            {recipientType === 'specific' && (
              <div ref={userSearchRef} className="relative space-y-2 pt-1">
                {selectedUser ? (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                        {selectedUser.avatarUrl ? (
                          <img
                            src={selectedUser.avatarUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{selectedUser.firstName[0]}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">
                            {selectedUser.firstName} {selectedUser.lastName || ''}
                          </span>
                          {selectedUser.userCode && (
                            <span className="font-mono text-[10px] text-purple-300 bg-purple-500/20 px-1.5 py-0.2 rounded border border-purple-500/30">
                              #{selectedUser.userCode}
                            </span>
                          )}
                        </div>
                        {selectedUser.email && (
                          <p className="text-[10px] text-gray-400 truncate">{selectedUser.email}</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                      title="Dəyiş"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      onFocus={() => {
                        if (userSearchResults.length > 0) setIsUserDropdownOpen(true);
                      }}
                      placeholder="İstifadəçi adı, soyadı, e-poçt və ya #kodu ilə axtarın..."
                      className="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all"
                    />
                    {searchingUsers && (
                      <RefreshCw
                        size={13}
                        className="animate-spin text-cyan-400 absolute right-3 top-1/2 -translate-y-1/2"
                      />
                    )}

                    {/* Search Dropdown */}
                    <AnimatePresence>
                      {isUserDropdownOpen && userSearchResults.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute top-full left-0 right-0 mt-1.5 bg-[#171a24] border border-white/15 rounded-2xl shadow-2xl max-h-52 overflow-y-auto z-20 py-1"
                        >
                          {userSearchResults.map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                setSelectedUser(u);
                                setIsUserDropdownOpen(false);
                                setUserSearchQuery('');
                              }}
                              className="w-full px-3.5 py-2 hover:bg-white/5 flex items-center justify-between text-left transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                                  {u.avatarUrl ? (
                                    <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{u.firstName[0]}</span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-white truncate">
                                    {u.firstName} {u.lastName || ''}
                                  </p>
                                  <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                                </div>
                              </div>

                              {u.userCode && (
                                <span className="font-mono text-[10px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
                                  #{u.userCode}
                                </span>
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Ləğv et
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={sending || uploadingIcon}
            className="px-6 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-gray-950 font-black text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer"
          >
            {sending ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Göndərilir...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Bildirişi Göndər</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
