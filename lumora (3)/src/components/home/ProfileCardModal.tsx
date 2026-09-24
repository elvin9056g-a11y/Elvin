import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Edit3,
  Copy,
  Check,
  X,
  Save,
  User,
  Crop,
  Camera,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import { UserProfile, Translations } from '../../types';
import natureCoverUrl from '../../assets/nature_cover.jpg';
import { ImageCropperModal } from './ImageCropperModal';
import { translations } from '../../data/translations';

interface ProfileCardModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProfile?: (updated: Partial<UserProfile>) => void;
  t?: Translations;
  readOnly?: boolean;
  onStartChat?: () => void;
}

export const ProfileCardModal: React.FC<ProfileCardModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdateProfile,
  t,
  readOnly = false,
  onStartChat,
}) => {
  const profileT = t?.profile || translations.az.profile;
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form states for editing
  const [editFirstName, setEditFirstName] = useState(user.firstName || 'Elvin');
  const [editLastName, setEditLastName] = useState(user.lastName || 'Səmədov');
  const [editProfession, setEditProfession] = useState(user.profession || profileT.profession);
  const [editExperience, setEditExperience] = useState(user.experience || '1 ' + profileT.experience);
  const [editAvatarUrl, setEditAvatarUrl] = useState(user.avatarUrl || '');
  const [rawAvatarUrl, setRawAvatarUrl] = useState<string>(user.avatarUrl || '');
  const [editTag1, setEditTag1] = useState(user.tags?.[0] || profileT.tag1);
  const [editTag2, setEditTag2] = useState(user.tags?.[1] || profileT.tag2);
  const [editTag3, setEditTag3] = useState(user.tags?.[2] || profileT.tag3);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Gallery & Image Cropper states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');

  // Handle image selected directly from device gallery / camera
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setRawAvatarUrl(result);
        setImageToCrop(result);
        setIsCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Open cropper with existing picture (sürüşdürmə, yaxınlaşdırma və çevirmə üçün)
  const handleOpenManualCropper = () => {
    const targetSrc = rawAvatarUrl || editAvatarUrl || user.avatarUrl;
    if (targetSrc) {
      setImageToCrop(targetSrc);
      setIsCropperOpen(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  // When cropper finishes adjusting photo
  const handleCropComplete = (croppedDataUrl: string) => {
    setEditAvatarUrl(croppedDataUrl);
    // Persist immediately if on view mode
    if (!isEditing) {
      onUpdateProfile?.({ avatarUrl: croppedDataUrl });
    }
  };

  if (!isOpen) return null;

  const currentTags =
    user.tags && user.tags.length > 0
      ? user.tags
      : ['Qrafik dizayn', 'Motion dizayn', 'Logo dizayn'];

  const userDisplayId =
    user.userCode ||
    (user.id ? user.id.replace(/\D/g, '').substring(0, 8) || '12345678' : '12345678');

  const displayAvatar = isEditing ? editAvatarUrl : user.avatarUrl;

  const handleCopyId = () => {
    navigator.clipboard.writeText(userDisplayId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedTags = [editTag1.trim(), editTag2.trim(), editTag3.trim()].filter(Boolean);
    onUpdateProfile?.({
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      profession: editProfession.trim(),
      experience: editExperience.trim(),
      avatarUrl: editAvatarUrl.trim() || undefined,
      tags: updatedTags.length > 0 ? updatedTags : ['Qrafik dizayn', 'Motion dizayn', 'Logo dizayn'],
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditing(false);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md select-none">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Hidden file input for device gallery upload across all modes */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileSelect}
        className="hidden"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="relative z-10 w-full max-w-[370px] sm:max-w-[390px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dynamic Vibrant Gradient Orbs behind Card for True Glassmorphism Refraction */}
        <div className="absolute -inset-10 pointer-events-none overflow-visible -z-10">
          <motion.div
            animate={{
              x: [-15, 20, -10, -15],
              y: [-10, 15, -20, -10],
              scale: [1, 1.15, 0.95, 1],
            }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-8 -left-8 w-60 h-60 rounded-full bg-gradient-to-tr from-cyan-500/60 via-teal-400/50 to-blue-600/60 blur-[45px]"
          />
          <motion.div
            animate={{
              x: [15, -20, 10, 15],
              y: [10, -15, 20, 10],
              scale: [1, 0.9, 1.2, 1],
            }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/4 -right-10 w-64 h-64 rounded-full bg-gradient-to-br from-purple-600/60 via-pink-500/50 to-indigo-500/60 blur-[48px]"
          />
          <motion.div
            animate={{
              x: [-10, 15, -20, -10],
              y: [15, -10, 15, 15],
              scale: [1, 1.1, 0.92, 1],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-8 left-4 w-60 h-60 rounded-full bg-gradient-to-tr from-emerald-500/55 via-teal-300/45 to-green-600/50 blur-[45px]"
          />
        </div>

        <AnimatePresence mode="wait">
          {!isEditing ? (
            /* ================================================================ */
            /* 1. TRUE GLASSMORPHISM PROFILE CARD (VIEW MODE)                   */
            /* ================================================================ */
            <motion.div
              key="view-card"
              initial={{ opacity: 0, rotateY: -10 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 10 }}
              transition={{ duration: 0.28 }}
              className="relative overflow-hidden rounded-[20px] text-white transition-all duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                boxShadow:
                  '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 1px 0 rgba(255, 255, 255, 0.35)',
              }}
            >
              {/* Top specular sheen reflection line */}
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none z-30" />

              {/* Top Nature Section */}
              <div className="relative h-36 w-full overflow-hidden rounded-t-[20px]">
                <motion.div
                  className="absolute inset-0 w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${natureCoverUrl})` }}
                  animate={{
                    scale: [1, 1.06, 1],
                    x: [0, -6, 0],
                    y: [0, 4, 0],
                  }}
                  transition={{
                    duration: 16,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut',
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 pointer-events-none" />

                {/* Edit Button at Top-Right (Hidden if readOnly) */}
                {!readOnly && (
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setIsEditing(true)}
                    aria-label={profileT.editBtn}
                    className="absolute top-3.5 right-3.5 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 border border-white/35 backdrop-blur-xl text-white flex items-center justify-center cursor-pointer shadow-md transition-colors"
                    title={profileT.editBtn}
                  >
                    <Edit3 size={16} />
                  </motion.button>
                )}

                {/* Close Button at Top-Left */}
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={onClose}
                  aria-label={profileT.cancelBtn}
                  className="absolute top-3.5 left-3.5 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 border border-white/35 backdrop-blur-xl text-white flex items-center justify-center cursor-pointer shadow-md transition-colors"
                  title={profileT.cancelBtn}
                >
                  <X size={16} />
                </motion.button>
              </div>

              {/* Center Profile Picture (Original Pure Glass Design) */}
              <div className="relative -mt-14 flex justify-center z-20">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full border-2 border-white/60 overflow-hidden flex items-center justify-center shadow-[0_12px_28px_rgba(0,0,0,0.35)] bg-black/40 backdrop-blur-md">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/20 text-white">
                        <User size={46} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Glowing frosted glass outer ring */}
                  <div className="absolute -inset-1 rounded-full border border-white/40 pointer-events-none" />
                </div>
              </div>

              {/* Lower True Glass Body */}
              <div className="px-6 pt-3 pb-5 text-center relative z-20">
                {/* User Name */}
                <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
                  {user.firstName} {user.lastName}
                </h2>

                {/* Profession */}
                <div className="flex items-center justify-center gap-2 mt-1 mb-3.5">
                  <div className="h-[1px] w-6 bg-white/40" />
                  <span className="text-xs font-semibold tracking-wide text-white/90 drop-shadow-sm">
                    {user.profession || 'Dizayner'}
                  </span>
                  <div className="h-[1px] w-6 bg-white/40" />
                </div>

                {/* 3 Tag Chips */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                  {currentTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 rounded-[12px] text-[11px] font-medium tracking-wide text-white transition-all hover:scale-105 shadow-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.12)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.22)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Bottom Stats Row: Experience | ID with Copy Button */}
                <div className="pt-3 border-t border-white/20 flex items-center justify-around text-center">
                  <div className="flex-1">
                    <div className="text-base font-bold tracking-tight text-white drop-shadow-sm">
                      {user.experience || ('1 ' + profileT.experience)}
                    </div>
                    <div className="text-[11px] font-medium mt-0.5 text-white/70">
                      {profileT.experience}
                    </div>
                  </div>

                  <div className="h-7 w-[1px] bg-white/25" />

                  <div className="flex-1 flex items-center justify-center gap-1.5">
                    <span className="text-xs font-semibold text-white/90 drop-shadow-sm">
                      {profileT.idLabel}: {userDisplayId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      aria-label={profileT.copyId}
                      className={`p-1.5 rounded-[10px] border transition-all cursor-pointer ${
                        copied
                          ? 'bg-emerald-500/40 text-emerald-200 border-emerald-400/50 shadow-sm'
                          : 'bg-white/15 hover:bg-white/25 border-white/30 text-amber-300 hover:text-amber-200 shadow-sm'
                      }`}
                      title={copied ? profileT.copied : profileT.copyId}
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

                {/* Optional Action Button (e.g. "Mesaj göndər" when opened from Chat) */}
                {onStartChat && (
                  <div className="mt-4 pt-1">
                    <button
                      type="button"
                      onClick={onStartChat}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageSquare size={16} />
                      <span>Mesaj göndər</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* ================================================================ */
            /* 2. TRUE GLASSMORPHISM EDIT FORM (EDIT MODE)                      */
            /* ================================================================ */
            <motion.div
              key="edit-card"
              initial={{ opacity: 0, rotateY: 10 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -10 }}
              transition={{ duration: 0.28 }}
              className="relative overflow-hidden rounded-[20px] p-5 sm:p-6 text-white transition-all duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                boxShadow:
                  '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 1px 0 rgba(255, 255, 255, 0.35)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b mb-3 border-white/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-[10px] bg-emerald-500/25 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                    <Edit3 size={16} />
                  </div>
                  <h3 className="font-bold text-sm tracking-tight text-white">{profileT.editTitle}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-7 h-7 rounded-full border border-white/25 hover:bg-white/15 flex items-center justify-center text-white/80 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {saveSuccess && (
                <div className="mb-3 p-2.5 rounded-[12px] bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-xs text-center flex items-center justify-center gap-2">
                  <Check size={14} />
                  <span>{profileT.successSaved}</span>
                </div>
              )}

              <form
                onSubmit={handleSaveProfile}
                className="space-y-3 max-h-[65vh] overflow-y-auto pr-1"
              >
                {/* 1. CENTERED PROFILE PHOTO SELECTION & ADJUST SECTION */}
                <div className="p-3.5 rounded-[18px] border border-white/20 bg-white/5 flex flex-col items-center justify-center text-center space-y-2.5">
                  <div className="relative">
                    {/* Centered Avatar: Tapping directly opens device gallery */}
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="relative w-24 h-24 rounded-full border-2 border-white/70 overflow-hidden flex items-center justify-center bg-black/50 cursor-pointer group shadow-xl ring-2 ring-white/20"
                      title={editAvatarUrl ? (profileT.tapToSelectPhoto || 'Şəkli dəyişmək üçün toxunun') : 'Şəkil seçmək üçün toxunun'}
                    >
                      {editAvatarUrl ? (
                        <img
                          src={editAvatarUrl}
                          alt="Profil şəkli"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/20 text-white">
                          <User size={46} className="text-white" />
                        </div>
                      )}

                      {/* Hover overlay with upload prompt */}
                      <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[10px] gap-1 font-semibold">
                        <Camera size={18} />
                        <span>{editAvatarUrl ? 'Dəyiş' : 'Şəkil seç'}</span>
                      </div>
                    </motion.div>

                    {/* Camera Badge at bottom-right of avatar */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white text-white flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-110"
                      title={profileT.selectFromGallery}
                    >
                      <Camera size={14} />
                    </div>
                  </div>

                  <p className="text-[11px] text-white/80 font-medium">
                    {editAvatarUrl
                      ? (profileT.tapToSelectPhoto || 'Şəkli dəyişmək üçün toxunun')
                      : 'Şəkil qoymaq istəmirsinizsə, standart ikon qalacaq'}
                  </p>

                  {/* DÜZƏLİŞ HİSSƏSİ & ŞƏKLİ SİLMƏ (Əgər şəkil varsa) */}
                  {editAvatarUrl && (
                    <div className="flex items-center justify-center gap-2 pt-0.5">
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={handleOpenManualCropper}
                        className="py-1.5 px-3.5 rounded-[12px] bg-gradient-to-r from-emerald-500/30 to-teal-500/30 hover:from-emerald-500/40 hover:to-teal-500/40 border border-emerald-400/50 text-emerald-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm"
                        title="Mövcud şəkli sürüşdür, yaxınlaşdır və çevir"
                      >
                        <Crop size={14} />
                        <span>{profileT.editPhotoBtn || 'Düzəliş et'}</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={() => {
                          setEditAvatarUrl('');
                          setRawAvatarUrl('');
                        }}
                        className="py-1.5 px-3 rounded-[12px] border border-red-500/35 bg-red-500/15 hover:bg-red-500/25 text-red-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm"
                        title="Şəkli sil və standart User ikonuna qayıt"
                      >
                        <Trash2 size={13} />
                        <span>Şəkli sil</span>
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* First and Last Name */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-white/80 mb-1">{profileT.firstName}</label>
                    <input
                      type="text"
                      required
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full px-3 py-2 rounded-[12px] text-xs border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-1 focus:ring-white/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-white/80 mb-1">{profileT.lastName}</label>
                    <input
                      type="text"
                      required
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full px-3 py-2 rounded-[12px] text-xs border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-1 focus:ring-white/40"
                    />
                  </div>
                </div>

                {/* Job & Experience */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-white/80 mb-1">{profileT.profession}</label>
                    <input
                      type="text"
                      required
                      value={editProfession}
                      onChange={(e) => setEditProfession(e.target.value)}
                      placeholder={profileT.profession}
                      className="w-full px-3 py-2 rounded-[12px] text-xs border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-1 focus:ring-white/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-white/80 mb-1">
                      {profileT.experience}
                    </label>
                    <input
                      type="text"
                      required
                      value={editExperience}
                      onChange={(e) => setEditExperience(e.target.value)}
                      placeholder={'1 ' + profileT.experience}
                      className="w-full px-3 py-2 rounded-[12px] text-xs border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-1 focus:ring-white/40"
                    />
                  </div>
                </div>

                {/* 3 Tags */}
                <div>
                  <label className="block text-[11px] font-medium text-white/80 mb-1">
                    {profileT.tagsTitle}
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editTag1}
                      onChange={(e) => setEditTag1(e.target.value)}
                      placeholder={profileT.tag1}
                      className="w-full px-3 py-2 rounded-[12px] text-xs border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-1 focus:ring-white/40"
                    />
                    <input
                      type="text"
                      value={editTag2}
                      onChange={(e) => setEditTag2(e.target.value)}
                      placeholder={profileT.tag2}
                      className="w-full px-3 py-2 rounded-[12px] text-xs border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-1 focus:ring-white/40"
                    />
                    <input
                      type="text"
                      value={editTag3}
                      onChange={(e) => setEditTag3(e.target.value)}
                      placeholder={profileT.tag3}
                      className="w-full px-3 py-2 rounded-[12px] text-xs border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-1 focus:ring-white/40"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-2.5 rounded-[12px] border border-white/25 text-xs font-medium hover:bg-white/15 transition-colors cursor-pointer text-white"
                  >
                    {profileT.cancelBtn}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-[12px] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs tracking-wide transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save size={14} />
                    <span>{profileT.saveBtn}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Manual Image Cropper & Adjuster Modal (Sürüşdürmə, Yaxınlaşdırma, Çevirmə) */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        imageSrc={imageToCrop}
        onClose={() => setIsCropperOpen(false)}
        t={t}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};
