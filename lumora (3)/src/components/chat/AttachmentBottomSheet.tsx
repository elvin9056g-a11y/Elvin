import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Image as ImageIcon,
  FileText,
  Headphones,
  Video as VideoIcon,
  Plus,
} from 'lucide-react';

import { Language } from '../../types';

export interface GalleryMediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  duration?: string;
  thumbnail?: string;
}

// Default media items with high quality visuals & videos
export const RECENT_MEDIA_ITEMS: GalleryMediaItem[] = [
  {
    id: 'vid_1',
    type: 'video',
    duration: '0:20',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail:
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'img_chat_1',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'img_chat_2',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'img_chat_3',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'img_beads',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1611591475152-477d75be1749?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'img_profile_ui',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'img_player_ui',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'img_services_ui',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'img_card_ui',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'img_code_doc',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'img_console_ui',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'img_account_ui',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&auto=format&fit=crop&q=80',
  },
];

interface AttachmentBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (item: GalleryMediaItem) => void;
  onOpenGalleryPicker: () => void;
  onOpenDocumentPicker: () => void;
  onShareLocation?: () => void;
  onOpenAudioPicker: () => void;
  isDark: boolean;
  currentLanguage?: Language;
}

export const AttachmentBottomSheet: React.FC<AttachmentBottomSheetProps> = ({
  isOpen,
  onClose,
  onSelectMedia,
  onOpenGalleryPicker,
  onOpenDocumentPicker,
  onOpenAudioPicker,
  isDark,
  currentLanguage = 'az',
}) => {
  const labels = {
    az: { gallery: 'Qalereya', document: 'Sənəd', audio: 'Səs', allMedia: 'Bütün Qalereya', selectFromPhone: 'Telefondan seç' },
    en: { gallery: 'Gallery', document: 'Document', audio: 'Audio', allMedia: 'All Gallery', selectFromPhone: 'Choose from phone' },
    ru: { gallery: 'Галерея', document: 'Документ', audio: 'Аудио', allMedia: 'Вся галерея', selectFromPhone: 'Выбрать с телефона' },
    tr: { gallery: 'Galeri', document: 'Belge', audio: 'Ses', allMedia: 'Tüm Galeri', selectFromPhone: 'Telefondan seç' },
  }[currentLanguage] || { gallery: 'Qalereya', document: 'Sənəd', audio: 'Səs', allMedia: 'Bütün Qalereya', selectFromPhone: 'Telefondan seç' };

  const [mediaList, setMediaList] = useState<GalleryMediaItem[]>(() => {
    try {
      const saved = localStorage.getItem('lumora_custom_gallery_media');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...parsed, ...RECENT_MEDIA_ITEMS];
        }
      }
    } catch (e) {
      console.warn('Error reading saved gallery items', e);
    }
    return RECENT_MEDIA_ITEMS;
  });

  const deviceMediaInputRef = useRef<HTMLInputElement>(null);

  // Handle files chosen from phone/device
  const handleDeviceFilesPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newItems: GalleryMediaItem[] = [];

    files.forEach((file, idx) => {
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video/');
      const newItem: GalleryMediaItem = {
        id: `device_${Date.now()}_${idx}`,
        url,
        type: isVideo ? 'video' : 'image',
        duration: isVideo ? '0:15' : undefined,
        thumbnail: isVideo ? undefined : url,
      };
      newItems.push(newItem);
    });

    if (newItems.length > 0) {
      setMediaList((prev) => {
        const combined = [...newItems, ...prev];
        try {
          // Store minimal refs
          const toSave = combined.slice(0, 20).filter((item) => !item.id.startsWith('device_blob'));
          localStorage.setItem('lumora_custom_gallery_media', JSON.stringify(toSave));
        } catch {
          // ignore
        }
        return combined;
      });

      // Send the first item immediately to chat
      onSelectMedia(newItems[0]);
      onClose();
    }

    e.target.value = '';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Native device gallery picker input */}
          <input
            ref={deviceMediaInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleDeviceFilesPicked}
            className="hidden"
          />

          {/* Semi-transparent backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-30"
          />

          {/* Bottom Sheet Drawer matching fayıl.jpeg */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 27, stiffness: 300 }}
            className={`absolute bottom-0 inset-x-0 z-40 rounded-t-3xl shadow-2xl flex flex-col max-h-[82%] border-t select-none ${
              isDark
                ? 'bg-[#111b21] border-white/15 text-white'
                : 'bg-white border-black/10 text-gray-900'
            }`}
          >
            {/* Top Drag Handle Indicator */}
            <div className="pt-2.5 pb-1 flex justify-center cursor-pointer" onClick={onClose}>
              <div className="w-10 h-1.5 rounded-full bg-gray-400/50 dark:bg-gray-600" />
            </div>

            {/* Action Buttons Row */}
            <div className="px-6 py-3.5 flex items-center justify-around max-w-sm mx-auto w-full border-b border-black/5 dark:border-white/10">
              {/* 1. Galeri (Opens device gallery picker) */}
              <button
                type="button"
                onClick={() => {
                  if (deviceMediaInputRef.current) {
                    deviceMediaInputRef.current.click();
                  } else {
                    onOpenGalleryPicker();
                  }
                }}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-13 h-13 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                  <ImageIcon size={24} />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  {labels.gallery}
                </span>
              </button>

              {/* 2. Belge */}
              <button
                type="button"
                onClick={() => {
                  onOpenDocumentPicker();
                  onClose();
                }}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-13 h-13 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                  <FileText size={24} />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  {labels.document}
                </span>
              </button>

              {/* 3. Ses */}
              <button
                type="button"
                onClick={() => {
                  onOpenAudioPicker();
                  onClose();
                }}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-13 h-13 rounded-full bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                  <Headphones size={24} />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  {labels.audio}
                </span>
              </button>
            </div>

            {/* Gallery Header bar */}
            <div className="px-4 py-2 flex items-center justify-between text-xs opacity-75 border-b border-black/5 dark:border-white/5">
              <span className="font-semibold">{labels.allMedia}</span>
              <button
                type="button"
                onClick={() => deviceMediaInputRef.current?.click()}
                className="text-emerald-500 dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <Plus size={14} />
                <span>{labels.selectFromPhone}</span>
              </button>
            </div>

            {/* Recent Media Gallery Grid (4 Columns) */}
            <div className="flex-1 overflow-y-auto p-1.5">
              <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
                {/* 1st Card: Direct Phone Gallery Selector */}
                <button
                  type="button"
                  onClick={() => deviceMediaInputRef.current?.click()}
                  className={`relative aspect-square overflow-hidden rounded-md cursor-pointer flex flex-col items-center justify-center gap-1 border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 active:scale-95 transition-all ${
                    isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <Plus size={18} />
                  </div>
                  <span className="text-[10px] font-bold text-center px-1 leading-tight">
                    {labels.gallery}
                  </span>
                </button>

                {/* Media items */}
                {mediaList.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectMedia(item);
                      onClose();
                    }}
                    className="relative aspect-square overflow-hidden rounded-md cursor-pointer group bg-black/10 active:scale-95 transition-transform"
                  >
                    <img
                      src={item.thumbnail || item.url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />

                    {/* Video Duration Badge matching bottom-left badge in fayıl.jpeg */}
                    {item.type === 'video' && (
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1 shadow-md">
                        <VideoIcon size={12} className="shrink-0" />
                        <span>{item.duration || '0:20'}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
