import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Users,
  Shield,
  Check,
  Camera,
  Edit2,
  Trash2,
  UserPlus,
  UserX,
  LogOut,
  AlertTriangle,
  Loader2,
  Search,
} from 'lucide-react';
import { ChatConversation, ChatMessage } from './types';
import { UserProfile } from '../../types';
import { ImageCropperModal } from '../home/ImageCropperModal';
import { uploadChatMediaToSupabase } from '../../lib/supabase';

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: ChatConversation | null;
  currentUser?: UserProfile | null;
  allContacts: ChatConversation[];
  dbUsers?: UserProfile[];
  isDark?: boolean;
  onUpdateGroup: (updated: ChatConversation) => void;
  onLeaveGroup?: (groupId: string) => void;
  onDeleteGroup?: (groupId: string) => void;
  onAddMemberToGroup?: (groupId: string, user: { id: string; name: string; avatarUrl?: string }) => void;
  onRemoveMemberFromGroup?: (groupId: string, memberId: string, memberName: string) => void;
}

function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export const GroupSettingsModal: React.FC<GroupSettingsModalProps> = ({
  isOpen,
  onClose,
  group,
  currentUser,
  allContacts,
  dbUsers = [],
  isDark = true,
  onUpdateGroup,
  onLeaveGroup,
  onDeleteGroup,
  onAddMemberToGroup,
  onRemoveMemberFromGroup,
}) => {
  if (!isOpen || !group) return null;

  const myId = currentUser?.id || 'me';
  const isAdmin = Boolean(group.admins?.includes(myId) || group.creatorId === myId);

  // Group Name & Bio state
  const [name, setName] = useState(group.name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [bio, setBio] = useState(group.bio || '');
  const [isEditingBio, setIsEditingBio] = useState(false);

  // Permission state
  const [allowedWriters, setAllowedWriters] = useState<'all' | 'admins' | 'selected'>(
    group.allowedWriters || 'all'
  );
  const [allowedWriterIds, setAllowedWriterIds] = useState<string[]>(
    group.allowedWriterIds || []
  );

  // Avatar & Cropper State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Member Action Modal (Transfer Admin or Remove Member)
  const [selectedMemberAction, setSelectedMemberAction] = useState<{
    id: string;
    name: string;
    isAdmin: boolean;
  } | null>(null);

  // Add Member Modal State
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState('');

  // Confirmation Modals State
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync state whenever group changes or modal opens
  useEffect(() => {
    if (group) {
      setName(group.name || '');
      setIsEditingName(false);
      setBio(group.bio || '');
      setIsEditingBio(false);
      setAllowedWriters(group.allowedWriters || 'all');
      setAllowedWriterIds(group.allowedWriterIds || []);
      setSelectedMemberAction(null);
      setIsAddMemberOpen(false);
      setConfirmLeave(false);
      setConfirmDelete(false);
    }
  }, [group, isOpen]);

  // Gallery photo selection handler
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImageToCrop(result);
        setIsCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Crop complete: upload & update
  const handleCropComplete = async (croppedDataUrl: string) => {
    setIsCropperOpen(false);
    setIsUploadingAvatar(true);

    let avatarUrl = croppedDataUrl;
    try {
      const blob = dataURLtoBlob(croppedDataUrl);
      const uploadedUrl = await uploadChatMediaToSupabase(blob, 'images', 'jpg');
      if (uploadedUrl) {
        avatarUrl = uploadedUrl;
      }
    } catch (err) {
      console.warn('Avatar upload fallback to dataURL:', err);
    } finally {
      setIsUploadingAvatar(false);
    }

    const updated: ChatConversation = {
      ...group,
      avatarUrl,
    };
    onUpdateGroup(updated);
  };

  // Delete Group Avatar (Şəkli sil)
  const handleDeleteAvatar = () => {
    const updated: ChatConversation = {
      ...group,
      avatarUrl: undefined,
    };
    onUpdateGroup(updated);
  };

  // Toggle writer permission for selected individuals
  const toggleWriter = (memberId: string) => {
    setAllowedWriterIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  // Save All Changes (Name, Bio, Allowed Writers)
  const handleSaveAll = () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    let newMessages = group.messages;

    // Check if name changed -> add system message
    if (name.trim() && name.trim() !== group.name) {
      const sysMsg: ChatMessage = {
        id: `sys_${Date.now()}_rename`,
        senderId: myId,
        senderName: 'Sistem',
        text: `Qrupun adı "${name.trim()}" olaraq dəyişdirildi`,
        time: timeStr,
        isOutgoing: false,
        isSystem: true,
        type: 'system',
      };
      newMessages = [...newMessages, sysMsg];
    }

    const updated: ChatConversation = {
      ...group,
      name: name.trim() || group.name,
      bio: bio.trim(),
      allowedWriters,
      allowedWriterIds: allowedWriters === 'selected' ? allowedWriterIds : undefined,
      messages: newMessages,
    };
    onUpdateGroup(updated);
    setIsEditingName(false);
    setIsEditingBio(false);
    onClose();
  };

  // Transfer Admin (İnzibatçı et)
  const handleMakeAdmin = (targetId: string, targetName: string) => {
    const currentAdmins = group.admins || [];
    const newAdmins = currentAdmins.includes(targetId) ? currentAdmins : [...currentAdmins, targetId];

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const sysMsg: ChatMessage = {
      id: `sys_${Date.now()}_admin`,
      senderId: myId,
      senderName: 'Sistem',
      text: `${targetName} qrupun yeni İnzibatçısı oldu`,
      time: timeStr,
      isOutgoing: false,
      isSystem: true,
      type: 'system',
    };

    const updated: ChatConversation = {
      ...group,
      admins: newAdmins,
      messages: [...group.messages, sysMsg],
    };
    onUpdateGroup(updated);
    setSelectedMemberAction(null);
  };

  // Remove Member (Qrupdan çıxar)
  const handleRemoveMember = (targetId: string, targetName: string) => {
    if (onRemoveMemberFromGroup) {
      onRemoveMemberFromGroup(group.id, targetId, targetName);
    } else {
      const newMembers = (group.members || []).filter((id) => id !== targetId);
      const newAdmins = (group.admins || []).filter((id) => id !== targetId);
      const newRemoved = [...(group.removedMembers || []), targetId];

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const sysMsg: ChatMessage = {
        id: `sys_${Date.now()}_remove`,
        senderId: myId,
        senderName: 'Sistem',
        text: `${targetName} qrupdan çıxarıldı`,
        time: timeStr,
        isOutgoing: false,
        isSystem: true,
        type: 'system',
      };

      const updated: ChatConversation = {
        ...group,
        members: newMembers,
        admins: newAdmins,
        removedMembers: newRemoved,
        messages: [...group.messages, sysMsg],
      };
      onUpdateGroup(updated);
    }
    setSelectedMemberAction(null);
  };

  // Add Member to Group
  const handleSelectUserToAdd = (user: { id: string; name: string; avatarUrl?: string }) => {
    if (onAddMemberToGroup) {
      onAddMemberToGroup(group.id, user);
    } else {
      const currentMembers = group.members || [];
      if (currentMembers.includes(user.id)) return;

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const sysMsg: ChatMessage = {
        id: `sys_${Date.now()}_add`,
        senderId: myId,
        senderName: 'Sistem',
        text: `${user.name} qrupa əlavə edildi`,
        time: timeStr,
        isOutgoing: false,
        isSystem: true,
        type: 'system',
      };

      const updated: ChatConversation = {
        ...group,
        members: [...currentMembers, user.id],
        removedMembers: (group.removedMembers || []).filter((id) => id !== user.id),
        messages: [...group.messages, sysMsg],
      };
      onUpdateGroup(updated);
    }
    setIsAddMemberOpen(false);
  };

  // Leave Group
  const handleLeave = () => {
    if (onLeaveGroup) {
      onLeaveGroup(group.id);
    } else {
      const newMembers = (group.members || []).filter((id) => id !== myId);
      const newAdmins = (group.admins || []).filter((id) => id !== myId);
      const newRemoved = [...(group.removedMembers || []), myId];

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const myName = `${currentUser?.firstName || 'İstifadəçi'} ${currentUser?.lastName || ''}`.trim();
      const sysMsg: ChatMessage = {
        id: `sys_${Date.now()}_leave`,
        senderId: myId,
        senderName: 'Sistem',
        text: `${myName} qrupdan çıxdı`,
        time: timeStr,
        isOutgoing: false,
        isSystem: true,
        type: 'system',
      };

      const updated: ChatConversation = {
        ...group,
        members: newMembers,
        admins: newAdmins,
        removedMembers: newRemoved,
        messages: [...group.messages, sysMsg],
      };
      onUpdateGroup(updated);
    }
    onClose();
  };

  // Member details list
  const memberDetails = (group.members || []).map((mId) => {
    if (mId === myId) {
      return {
        id: myId,
        name: `${currentUser?.firstName || 'Siz'} ${currentUser?.lastName || ''}`.trim() || 'Siz',
        avatarUrl: currentUser?.avatarUrl,
        isAdmin: Boolean(group.admins?.includes(myId) || group.creatorId === myId),
        isMe: true,
      };
    }
    const contact = allContacts.find((c) => c.id === mId);
    const dbUser = dbUsers.find((u) => u.id === mId);
    return {
      id: mId,
      name: contact?.name || `${dbUser?.firstName || 'Üzv'} ${dbUser?.lastName || ''}`.trim() || 'Üzv',
      avatarUrl: contact?.avatarUrl || dbUser?.avatarUrl,
      isAdmin: Boolean(group.admins?.includes(mId) || group.creatorId === mId),
      isMe: false,
    };
  });

  // Filter candidates to add
  const availableToAdd = [
    ...allContacts.filter((c) => c.category === 'direct' && !(group.members || []).includes(c.id)),
    ...dbUsers
      .filter((u) => u.id !== myId && !(group.members || []).includes(u.id))
      .map((u) => ({
        id: u.id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'İstifadəçi',
        avatarUrl: u.avatarUrl,
        userCode: u.userCode,
      })),
  ].filter((u, index, self) => index === self.findIndex((t) => t.id === u.id))
   .filter((u) =>
     !searchUserQuery ||
     u.name.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
     (u.userCode && u.userCode.includes(searchUserQuery))
   );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`w-full max-w-md rounded-3xl p-5 shadow-2xl border flex flex-col max-h-[88vh] overflow-hidden ${
            isDark
              ? 'bg-[#182229] border-white/15 text-white'
              : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          {/* Header with Group Avatar (Gallery Cropper & Delete Photo) */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 dark:border-white/10 border-gray-200 shrink-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative shrink-0">
                <div
                  onClick={() => {
                    if (isAdmin) fileInputRef.current?.click();
                  }}
                  className={`relative w-13 h-13 rounded-2xl overflow-hidden border border-emerald-500/40 flex items-center justify-center bg-emerald-500/15 ${
                    isAdmin ? 'cursor-pointer group' : ''
                  }`}
                  title={isAdmin ? 'Qrup şəklini dəyiş (Qalereya)' : group.name}
                >
                  {group.avatarUrl ? (
                    <img src={group.avatarUrl} alt={group.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users size={26} className="text-emerald-500 opacity-80" />
                  )}

                  {isAdmin && (
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      {isUploadingAvatar ? (
                        <Loader2 size={16} className="animate-spin text-emerald-400" />
                      ) : (
                        <Camera size={16} />
                      )}
                    </div>
                  )}
                </div>

                {/* Şəkli sil düyməsi (Yalnız şəkil olduqda və admin olduqda) */}
                {isAdmin && group.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    className="absolute -bottom-1 -right-1 p-1 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-all cursor-pointer ring-1 ring-black"
                    title="Qrup şəklini sil"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>

              {/* Group Name & Edit Name */}
              <div className="min-w-0 flex-1">
                {isEditingName && isAdmin ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full p-1.5 rounded-lg text-sm font-bold border focus:outline-none ${
                        isDark ? 'bg-black/30 border-emerald-500 text-white' : 'bg-gray-100 border-emerald-500'
                      }`}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="p-1 rounded-lg bg-emerald-600 text-white text-xs font-bold shrink-0"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-bold leading-tight truncate">{name}</h3>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setIsEditingName(true)}
                        className="opacity-60 hover:opacity-100 p-0.5 rounded text-emerald-400 cursor-pointer"
                        title="Adı dəyiş"
                      >
                        <Edit2 size={12} />
                      </button>
                    )}
                  </div>
                )}
                <p className="text-xs opacity-65 mt-0.5">{memberDetails.length} üzv</p>
              </div>

              {/* Hidden file input for native gallery selection only */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer opacity-70 hover:opacity-100 transition-opacity ml-2 shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content: ONLY Bio, Member List, and Group Controls */}
          <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
            {/* 1. BLOK: Qrupun Bio-su (Açıqlaması) */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                  Qrupun Bio-su / Haqqında
                </span>
                {isAdmin && !isEditingBio && (
                  <button
                    type="button"
                    onClick={() => setIsEditingBio(true)}
                    className="p-1 rounded-lg hover:bg-white/10 text-emerald-500 hover:text-emerald-400 cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                  >
                    <Edit2 size={12} />
                    <span>Düzəliş et</span>
                  </button>
                )}
              </div>

              {isEditingBio ? (
                <div className="space-y-2 mt-1">
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Qrup haqqında məlumat və qaydalar..."
                    className={`w-full p-2.5 rounded-xl text-xs border focus:outline-none transition-all resize-none ${
                      isDark
                        ? 'bg-black/20 border-white/20 focus:border-emerald-400 text-white'
                        : 'bg-white border-gray-300 focus:border-emerald-500 text-gray-900'
                    }`}
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setBio(group.bio || '');
                        setIsEditingBio(false);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold opacity-70 hover:opacity-100"
                    >
                      Ləğv et
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingBio(false)}
                      className="px-3 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      Tamam
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs leading-relaxed opacity-85">
                  {bio.trim() || 'Qrup üçün heç bir açıqlama qeyd edilməyib.'}
                </p>
              )}
            </div>

            {/* 2. BLOK: Üzvlərin Siyahısı (+ İstifadəçi Əlavə Et ONLY FOR ADMIN) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                  Qrup Üzvləri ({memberDetails.length})
                </label>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsAddMemberOpen(true)}
                    className="py-1 px-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <UserPlus size={14} />
                    <span>İstifadəçi əlavə et</span>
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {memberDetails.map((m) => {
                  const canManage = isAdmin && !m.isMe;

                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        if (canManage) {
                          setSelectedMemberAction(m);
                        }
                      }}
                      className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs ${
                        isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'
                      } ${canManage ? 'cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/10' : ''}`}
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
                          {m.isMe && (
                            <span className="text-[10px] opacity-60">Siz</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {m.isAdmin && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center gap-1 border border-emerald-500/30">
                            <Shield size={10} />
                            <span>İnzibatçı</span>
                          </span>
                        )}
                        {canManage && (
                          <span className="text-[11px] text-emerald-500 font-medium hover:underline">
                            İdarə et
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Admin-only Messaging Permissions Setting ("Kimlər mesaj yaza bilər?") */}
            {isAdmin && (
              <div className="pt-2 border-t border-white/10 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                  Kimlər mesaj yaza bilər?
                </label>

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
                        onClick={() => setAllowedWriters(opt.id as any)}
                        className={`p-2.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                          isSelected
                            ? isDark
                              ? 'bg-emerald-500/15 border-emerald-500/50'
                              : 'bg-emerald-50 border-emerald-400'
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
                          <div className={`text-xs font-bold leading-tight ${isSelected ? 'text-emerald-500' : ''}`}>
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
                  <div className="p-3 rounded-2xl border border-white/10 bg-black/10 space-y-2 mt-2">
                    <p className="text-[11px] font-bold opacity-80">
                      Mesaj yazma icazəsi olan şəxslər:
                    </p>
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {memberDetails.map((m) => {
                        if (m.isAdmin) return null; // Admins can always write
                        const canWrite = allowedWriterIds.includes(m.id);
                        return (
                          <div
                            key={m.id}
                            onClick={() => toggleWriter(m.id)}
                            className="flex items-center justify-between p-2 rounded-xl text-xs hover:bg-white/5 cursor-pointer transition-colors"
                          >
                            <span className="truncate">{m.name}</span>
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                canWrite
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-gray-400 opacity-70'
                              }`}
                            >
                              {canWrite && <Check size={12} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Qrupdan Çıx / Qrupu Sil Düymələri (Bottom Danger Actions) */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <button
                type="button"
                onClick={() => setConfirmLeave(true)}
                className="w-full py-2.5 px-4 rounded-2xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <LogOut size={15} />
                <span>Qrupdan Çıx</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="w-full py-2.5 px-4 rounded-2xl border border-red-600 bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors"
                >
                  <Trash2 size={15} />
                  <span>Qrupu Sil</span>
                </button>
              )}
            </div>
          </div>

          {/* Footer Actions */}
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
                onClick={handleSaveAll}
                className="py-2 px-5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white cursor-pointer shadow-md transition-all"
              >
                Yadda saxla
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Member Management Action Modal: Transfer Admin or Remove */}
      {selectedMemberAction && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl space-y-4 ${
              isDark ? 'bg-[#1e2a30] border-white/20 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm leading-tight">{selectedMemberAction.name}</h4>
              <button
                type="button"
                onClick={() => setSelectedMemberAction(null)}
                className="p-1 rounded-full opacity-70 hover:opacity-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              {!selectedMemberAction.isAdmin && (
                <button
                  type="button"
                  onClick={() =>
                    handleMakeAdmin(selectedMemberAction.id, selectedMemberAction.name)
                  }
                  className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Shield size={16} />
                  <span>İnzibatçı et (Transfer Admin)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  handleRemoveMember(selectedMemberAction.id, selectedMemberAction.name)
                }
                className="w-full py-2.5 px-3.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
              >
                <UserX size={16} />
                <span>Qrupdan çıxar (Remove)</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Member Modal (İstifadəçi Əlavə Et) */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl space-y-4 max-h-[80vh] flex flex-col ${
              isDark ? 'bg-[#1e2a30] border-white/20 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-emerald-400" />
                <h4 className="font-bold text-sm leading-tight">İstifadəçi Əlavə Et</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMemberOpen(false)}
                className="p-1 rounded-full opacity-70 hover:opacity-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="relative shrink-0">
              <Search size={14} className="absolute left-3 top-3 opacity-60" />
              <input
                type="text"
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                placeholder="Ad və ya ID ilə axtarış..."
                className={`w-full pl-8 pr-3 py-2 rounded-xl text-xs border focus:outline-none ${
                  isDark ? 'bg-black/30 border-white/15 text-white' : 'bg-gray-100 border-gray-300'
                }`}
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {availableToAdd.length === 0 ? (
                <p className="text-xs opacity-60 text-center py-6">Əlavə ediləcək istifadəçi tapılmadı</p>
              ) : (
                availableToAdd.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleSelectUserToAdd(u)}
                    className="p-2.5 rounded-xl border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 cursor-pointer flex items-center justify-between gap-2.5 transition-all text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium truncate">{u.name}</span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-bold">Əlavə et</span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Confirm Leave Modal */}
      {confirmLeave && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl space-y-4 text-center ${
              isDark ? 'bg-[#1e2a30] border-white/20 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <LogOut size={24} />
            </div>
            <h4 className="font-bold text-sm">Qrupdan çıxmaq istəyirsiniz?</h4>
            <p className="text-xs opacity-75">
              Çıxdıqdan sonra siz artıq bu qrupun mesajlarını oxuya və ya yaza bilməyəcəksiniz.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmLeave(false)}
                className="py-2 px-4 rounded-xl text-xs font-semibold border border-white/20"
              >
                Ləğv et
              </button>
              <button
                type="button"
                onClick={handleLeave}
                className="py-2 px-5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                Çıx
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Confirm Delete Group Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl space-y-4 text-center ${
              isDark ? 'bg-[#1e2a30] border-white/20 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h4 className="font-bold text-sm">Qrupu silmək istəyirsiniz?</h4>
            <p className="text-xs opacity-75">
              Bu əməliyyat geri qaytarılmır. Bütün üzvlər üçün qrup və söhbət silinəcəkdir.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="py-2 px-4 rounded-xl text-xs font-semibold border border-white/20"
              >
                Ləğv et
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteGroup?.(group.id);
                  onClose();
                }}
                className="py-2 px-5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                Qrupu Sil
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Image Cropper Modal for Group Photo */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        imageSrc={imageToCrop}
        onClose={() => setIsCropperOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </AnimatePresence>
  );
};
