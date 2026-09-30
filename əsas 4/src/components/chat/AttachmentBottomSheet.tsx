import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Image as ImageIcon,
  FileText,
  Headphones,
  BarChart2,
  Loader2,
} from 'lucide-react';
import { Language } from '../../types';
import { uploadChatMediaToSupabase } from '../../lib/supabase';

interface AttachmentBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSendUploadedMedia?: (payload: {
    type: 'image' | 'video' | 'voice' | 'file';
    url: string;
    fileName?: string;
    fileSize?: string;
    fileBytes?: number;
  }) => void;
  onOpenPollCreator?: () => void;
  isDark: boolean;
  currentLanguage?: Language;
}

export const AttachmentBottomSheet: React.FC<AttachmentBottomSheetProps> = ({
  isOpen,
  onClose,
  onSendUploadedMedia,
  onOpenPollCreator,
  isDark,
  currentLanguage = 'az',
}) => {
  const labels = {
    az: { gallery: 'Qalereya', document: 'Sənəd', audio: 'Səs', poll: 'Səsvermə', uploading: 'Yüklənir...' },
    en: { gallery: 'Gallery', document: 'Document', audio: 'Audio', poll: 'Poll', uploading: 'Uploading...' },
    ru: { gallery: 'Галерея', document: 'Документ', audio: 'Аудио', poll: 'Опрос', uploading: 'Загрузка...' },
    tr: { gallery: 'Galeri', document: 'Belge', audio: 'Ses', poll: 'Anket', uploading: 'Yükleniyor...' },
  }[currentLanguage] || { gallery: 'Qalereya', document: 'Sənəd', audio: 'Səs', poll: 'Səsvermə', uploading: 'Yüklənir...' };

  const [isUploading, setIsUploading] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFilesPicked = async (files: File[], targetCategory: 'gallery' | 'document' | 'audio') => {
    if (files.length === 0) return;
    setIsUploading(true);

    try {
      for (const file of files) {
        let type: 'image' | 'video' | 'voice' | 'file' = 'file';
        let folder: 'audio' | 'images' | 'videos' | 'files' = 'files';

        if (targetCategory === 'gallery' || file.type.startsWith('image/')) {
          if (file.type.startsWith('video/')) {
            type = 'video';
            folder = 'videos';
          } else {
            type = 'image';
            folder = 'images';
          }
        } else if (targetCategory === 'audio' || file.type.startsWith('audio/')) {
          type = 'voice';
          folder = 'audio';
        } else {
          type = 'file';
          folder = 'files';
        }

        const uploadedUrl = await uploadChatMediaToSupabase(file, folder, file.name);

        if (onSendUploadedMedia) {
          onSendUploadedMedia({
            type,
            url: uploadedUrl,
            fileName: file.name,
            fileSize: formatFileSize(file.size),
            fileBytes: file.size,
          });
        }
      }
      onClose();
    } catch (err) {
      console.error('File pick & upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Native 1. Gallery input for images and videos */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              e.target.value = '';
              handleFilesPicked(files, 'gallery');
            }}
            className="hidden"
          />

          {/* Native 2. Document input for all files */}
          <input
            ref={documentInputRef}
            type="file"
            accept="*/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              e.target.value = '';
              handleFilesPicked(files, 'document');
            }}
            className="hidden"
          />

          {/* Native 3. Audio input */}
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              e.target.value = '';
              handleFilesPicked(files, 'audio');
            }}
            className="hidden"
          />

          {/* Semi-transparent backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isUploading ? onClose : undefined}
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-30"
          />

          {/* Bottom Sheet Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={`absolute bottom-0 inset-x-0 z-40 rounded-t-3xl shadow-2xl flex flex-col border-t select-none pb-6 ${
              isDark
                ? 'bg-[#111b21] border-white/15 text-white'
                : 'bg-white border-black/10 text-gray-900'
            }`}
          >
            {/* Top Drag Handle */}
            <div
              className="pt-2.5 pb-2 flex justify-center cursor-pointer"
              onClick={!isUploading ? onClose : undefined}
            >
              <div className="w-10 h-1.5 rounded-full bg-gray-400/50 dark:bg-gray-600" />
            </div>

            {isUploading && (
              <div className="py-2 px-4 mb-2 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-500 animate-pulse bg-emerald-500/10">
                <Loader2 size={16} className="animate-spin" />
                <span>{labels.uploading}</span>
              </div>
            )}

            {/* Exactly 3 buttons: Qalereya, Sənəd, Səs */}
            <div className="px-6 py-4 flex items-center justify-around max-w-sm mx-auto w-full">
              {/* 1. Qalereya */}
              <button
                type="button"
                disabled={isUploading}
                onClick={() => galleryInputRef.current?.click()}
                className="flex flex-col items-center gap-2 group cursor-pointer disabled:opacity-50 transition-transform active:scale-95"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white flex items-center justify-center shadow-lg transition-all group-hover:scale-105">
                  <ImageIcon size={26} />
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  {labels.gallery}
                </span>
              </button>

              {/* 2. Sənəd */}
              <button
                type="button"
                disabled={isUploading}
                onClick={() => documentInputRef.current?.click()}
                className="flex flex-col items-center gap-2 group cursor-pointer disabled:opacity-50 transition-transform active:scale-95"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white flex items-center justify-center shadow-lg transition-all group-hover:scale-105">
                  <FileText size={26} />
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  {labels.document}
                </span>
              </button>

              {/* 3. Səs */}
              <button
                type="button"
                disabled={isUploading}
                onClick={() => audioInputRef.current?.click()}
                className="flex flex-col items-center gap-2 group cursor-pointer disabled:opacity-50 transition-transform active:scale-95"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white flex items-center justify-center shadow-lg transition-all group-hover:scale-105">
                  <Headphones size={26} />
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  {labels.audio}
                </span>
              </button>

              {/* 4. Səsvermə (Poll) */}
              <button
                type="button"
                disabled={isUploading}
                onClick={() => {
                  onClose();
                  onOpenPollCreator?.();
                }}
                className="flex flex-col items-center gap-2 group cursor-pointer disabled:opacity-50 transition-transform active:scale-95"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white flex items-center justify-center shadow-lg transition-all group-hover:scale-105">
                  <BarChart2 size={26} />
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  {labels.poll}
                </span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
