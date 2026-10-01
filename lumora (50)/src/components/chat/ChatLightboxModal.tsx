import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download } from 'lucide-react';

interface ChatLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string | null;
  mediaType?: 'image' | 'video';
  senderName?: string;
  time?: string;
  caption?: string;
}

export const ChatLightboxModal: React.FC<ChatLightboxModalProps> = ({
  isOpen,
  onClose,
  mediaUrl,
  mediaType = 'image',
  senderName,
  time,
  caption,
}) => {
  if (!isOpen || !mediaUrl) return null;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const ext = mediaType === 'video' ? 'mp4' : 'jpg';
      a.download = `lumora_${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback direct link download
      const a = document.createElement('a');
      a.href = mediaUrl;
      a.download = `lumora_${Date.now()}`;
      a.target = '_blank';
      a.click();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-md select-none">
        {/* Top bar with back/close, info, and download */}
        <div className="flex items-center justify-between p-4 z-10 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/15 text-white/90 hover:text-white transition-colors cursor-pointer"
              title="Bağla"
            >
              <X size={24} />
            </button>
            {(senderName || time) && (
              <div className="flex flex-col text-left">
                {senderName && (
                  <span className="font-semibold text-sm text-white">
                    {senderName}
                  </span>
                )}
                {time && (
                  <span className="text-[11px] text-white/60">
                    {time}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Download button */}
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-lg border border-white/20"
            title="Yüklə"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Yüklə</span>
          </button>
        </div>

        {/* Center media viewer */}
        <div
          className="flex-1 flex items-center justify-center p-3 sm:p-6 overflow-hidden"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="relative max-w-full max-h-[82vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {mediaType === 'video' ? (
              <video
                src={mediaUrl}
                controls
                autoPlay
                className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl"
              />
            ) : (
              <img
                src={mediaUrl}
                alt=""
                className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl"
              />
            )}
          </motion.div>
        </div>

        {/* Bottom bar with caption if any */}
        {caption && (
          <div className="p-4 text-center z-10 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-sm text-white/90 max-w-xl mx-auto break-words bg-black/40 px-4 py-2 rounded-xl backdrop-blur-md inline-block">
              {caption}
            </p>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
