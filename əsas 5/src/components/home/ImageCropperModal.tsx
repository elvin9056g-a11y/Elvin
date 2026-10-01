import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Check,
  X,
  Move,
  Camera,
} from 'lucide-react';
import { Translations } from '../../types';
import { translations } from '../../data/translations';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
  t?: Translations;
  cropShape?: 'circle' | 'square';
  title?: string;
  subtitle?: string;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  t,
  cropShape = 'circle',
  title,
  subtitle,
}) => {
  const profileT = t?.profile || translations.az.profile;
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // degrees: 0, 90, 180, 270
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Drag references for mouse and single-touch
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
  });

  // Pinch-to-zoom references for mobile multi-touch
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1);

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset adjustments whenever a new image or modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  // Touch handlers for mobile (single finger drag + two finger pinch-to-zoom)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // Pinch gesture
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = zoom;
      setIsDragging(false);
    } else if (e.touches.length === 1) {
      touchStartDistRef.current = null;
      setIsDragging(true);
      dragStartRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        posX: position.x,
        posY: position.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      // Pinch-to-zoom in progress
      e.preventDefault();
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDist / touchStartDistRef.current;
      const newZoom = Math.min(3.5, Math.max(0.5, Number((touchStartZoomRef.current * ratio).toFixed(2))));
      setZoom(newZoom);
    } else if (e.touches.length === 1 && isDragging) {
      // Single finger drag
      e.preventDefault();
      const deltaX = e.touches[0].clientX - dragStartRef.current.startX;
      const deltaY = e.touches[0].clientY - dragStartRef.current.startY;
      setPosition({
        x: dragStartRef.current.posX + deltaX,
        y: dragStartRef.current.posY + deltaY,
      });
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
    setIsDragging(false);
  };

  // Mouse / pointer drag handlers for desktop
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only handle mouse pointers here (touch is handled by onTouch* above)
    if (e.pointerType === 'touch') return;
    e.preventDefault();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;
    setPosition({
      x: dragStartRef.current.posX + deltaX,
      y: dragStartRef.current.posY + deltaY,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.12 : -0.12;
    setZoom((prev) => Math.min(3.5, Math.max(0.5, Number((prev + zoomDelta).toFixed(2)))));
  };

  // Rotate 90 deg clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Reset to original center & zoom
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Crop & generate high-res canvas image
  const handleConfirmCrop = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;

    const CROP_SIZE = 450; // High resolution square output
    const DISPLAY_MASK_SIZE = 220; // Size of circular viewport mask

    const canvas = document.createElement('canvas');
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High quality interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const scaleRatio = CROP_SIZE / DISPLAY_MASK_SIZE;

    // Translate to center
    ctx.translate(CROP_SIZE / 2, CROP_SIZE / 2);

    // Rotate
    ctx.rotate((rotation * Math.PI) / 180);

    // Zoom scale
    const effectiveScale = zoom * scaleRatio;
    ctx.scale(effectiveScale, effectiveScale);

    // Apply offset translation according to current angle
    const rad = (-rotation * Math.PI) / 180;
    const transformedX = position.x * Math.cos(rad) - position.y * Math.sin(rad);
    const transformedY = position.x * Math.sin(rad) + position.y * Math.cos(rad);

    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;

    const maxDimension = Math.max(imgWidth, imgHeight);
    const baseFitScale = DISPLAY_MASK_SIZE / maxDimension;

    ctx.drawImage(
      img,
      transformedX / zoom - (imgWidth * baseFitScale) / 2,
      transformedY / zoom - (imgHeight * baseFitScale) / 2,
      imgWidth * baseFitScale,
      imgHeight * baseFitScale
    );

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.94);
    onCropComplete(croppedDataUrl);
    onClose();
  }, [zoom, rotation, position, onCropComplete, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl select-none">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 15 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="relative z-10 w-full max-w-[390px] rounded-[24px] overflow-hidden text-white flex flex-col shadow-2xl"
        style={{
          background: 'rgba(20, 22, 30, 0.92)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.22)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-white/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center">
              <Move size={15} />
            </div>
            <div>
              <h3 className="font-bold text-xs tracking-wide">
                {title || (cropShape === 'square' ? 'Şəkli Kəs və Uyğunlaşdır' : profileT.cropTitle)}
              </h3>
              <p className="text-[10px] text-white/60">
                {subtitle || (cropShape === 'square' ? '1:1 Kvadrat formatı' : profileT.cropSubtitle)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-white/20 hover:bg-white/15 flex items-center justify-center text-white/70 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Interactive Viewport Area (Touch + Mouse Drag & Pinch) */}
        <div
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          className="relative w-full h-[300px] bg-[#090a0f] overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
        >
          {/* Moving Image */}
          <div
            className="absolute pointer-events-none will-change-transform"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.12s ease-out',
            }}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Profil önbaxış"
              className="max-w-[220px] max-h-[220px] object-contain select-none pointer-events-none"
              draggable={false}
            />
          </div>

          {/* Darkened Vignette Mask with 210px Cutout in center */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <mask id="avatar-crop-mask">
                  <rect width="100%" height="100%" fill="white" />
                  {cropShape === 'square' ? (
                    <rect x="calc(50% - 105px)" y="calc(50% - 105px)" width="210" height="210" rx="14" fill="black" />
                  ) : (
                    <circle cx="50%" cy="50%" r="105" fill="black" />
                  )}
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.72)" mask="url(#avatar-crop-mask)" />
            </svg>

            {/* Border Ring with Specular Glow & Crosshairs */}
            {cropShape === 'square' ? (
              <div className="absolute w-[210px] h-[210px] rounded-2xl border-2 border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.35)] pointer-events-none flex items-center justify-center">
                <div className="w-full h-[1px] bg-cyan-400/25 pointer-events-none" />
                <div className="h-full w-[1px] bg-cyan-400/25 pointer-events-none absolute" />
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 border border-cyan-400/40 text-[9px] font-mono text-cyan-300">
                  1:1 Kvadrat
                </span>
              </div>
            ) : (
              <div className="absolute w-[210px] h-[210px] rounded-full border-2 border-white/90 shadow-[0_0_25px_rgba(255,255,255,0.4)] pointer-events-none flex items-center justify-center">
                <div className="w-full h-[1px] bg-white/20 pointer-events-none" />
                <div className="h-full w-[1px] bg-white/20 pointer-events-none absolute" />
              </div>
            )}
          </div>

          {/* Touch Interaction Hint Overlay */}
          <div className="absolute bottom-2.5 inset-x-0 flex justify-center pointer-events-none">
            <span className="px-3.5 py-1 rounded-full bg-black/70 border border-white/20 text-[10px] text-white/90 backdrop-blur-md shadow-md flex items-center gap-1.5">
              <Move size={11} className="text-emerald-400" />
              <span>{profileT.cropHint}</span>
            </span>
          </div>
        </div>

        {/* Controls: Zoom Slider & Rotation & Reset */}
        <div className="p-4 space-y-3.5 bg-black/40 border-t border-white/10">
          {/* Zoom Slider Bar */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(0.5, Number((prev - 0.15).toFixed(2))))}
              className="p-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-white/80 cursor-pointer"
              title="Kiçilt"
            >
              <ZoomOut size={16} />
            </button>

            <input
              type="range"
              min="0.5"
              max="3.2"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />

            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(3.2, Number((prev + 0.15).toFixed(2))))}
              className="p-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-white/80 cursor-pointer"
              title="Böyüt"
            >
              <ZoomIn size={16} />
            </button>

            <span className="text-[11px] font-mono text-emerald-300 w-11 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Action Row: Rotate, Reset, Cancel & Confirm */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleRotate}
                className="px-2.5 py-1.5 rounded-xl border border-white/20 hover:bg-white/10 text-[11px] flex items-center gap-1.5 text-white/90 cursor-pointer transition-colors"
                title={profileT.rotate}
              >
                <RotateCw size={13} />
                <span>{profileT.rotate}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1.5 rounded-xl border border-white/20 hover:bg-white/10 text-[11px] flex items-center gap-1.5 text-white/90 cursor-pointer transition-colors"
                title={profileT.center}
              >
                <RefreshCw size={13} />
                <span>{profileT.center}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl border border-white/20 hover:bg-white/10 text-[11px] text-white/80 cursor-pointer transition-colors"
              >
                {profileT.cancelBtn}
              </button>

              <button
                type="button"
                onClick={handleConfirmCrop}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer transition-all"
              >
                <Check size={14} />
                <span>{profileT.confirm}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
