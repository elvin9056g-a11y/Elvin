import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Check,
  X,
  Move,
  Sparkles,
} from 'lucide-react';

interface BannerCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string, croppedBlob: Blob) => void;
  title?: string;
}

export const BannerCropperModal: React.FC<BannerCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  title = 'Banner Şəklini Kəs və Nizamlaza',
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Drag references for mouse and touch
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
  });

  // Pinch-to-zoom references
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1);

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Aspect ratio constants for Store Banner
  // Standard Store banner ratio: 2.4 : 1
  const DISPLAY_FRAME_WIDTH = 384;
  const DISPLAY_FRAME_HEIGHT = 160;
  const OUTPUT_WIDTH = 1200;
  const OUTPUT_HEIGHT = 500;

  // Reset adjustments whenever a new image opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
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
      e.preventDefault();
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDist / touchStartDistRef.current;
      const newZoom = Math.min(4.0, Math.max(0.5, Number((touchStartZoomRef.current * ratio).toFixed(2))));
      setZoom(newZoom);
    } else if (e.touches.length === 1 && isDragging) {
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

  // Mouse / Pointer handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
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
    setZoom((prev) => Math.min(4.0, Math.max(0.5, Number((prev + zoomDelta).toFixed(2)))));
  };

  // Rotate 90 deg
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Reset
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Confirm and Crop
  const handleConfirmCrop = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const scaleRatio = OUTPUT_WIDTH / DISPLAY_FRAME_WIDTH;

    // Center canvas
    ctx.translate(OUTPUT_WIDTH / 2, OUTPUT_HEIGHT / 2);

    // Rotate
    ctx.rotate((rotation * Math.PI) / 180);

    // Zoom scale
    const effectiveScale = zoom * scaleRatio;
    ctx.scale(effectiveScale, effectiveScale);

    // Calculate rotation-adjusted translation
    const rad = (-rotation * Math.PI) / 180;
    const transformedX = position.x * Math.cos(rad) - position.y * Math.sin(rad);
    const transformedY = position.x * Math.sin(rad) + position.y * Math.cos(rad);

    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;

    // Scale so that image fits nicely inside the frame
    const baseFitScale = Math.max(DISPLAY_FRAME_WIDTH / imgWidth, DISPLAY_FRAME_HEIGHT / imgHeight);

    ctx.drawImage(
      img,
      transformedX / zoom - (imgWidth * baseFitScale) / 2,
      transformedY / zoom - (imgHeight * baseFitScale) / 2,
      imgWidth * baseFitScale,
      imgHeight * baseFitScale
    );

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(croppedDataUrl, blob);
        } else {
          // Fallback blob conversion
          const arr = croppedDataUrl.split(',');
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const fallbackBlob = new Blob([u8arr], { type: 'image/jpeg' });
          onCropComplete(croppedDataUrl, fallbackBlob);
        }
        onClose();
      },
      'image/jpeg',
      0.95
    );
  }, [zoom, rotation, position, onCropComplete, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl select-none">
        {/* Backdrop */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-lg rounded-3xl overflow-hidden text-white flex flex-col shadow-2xl border border-white/20 bg-[#12141c]/95 backdrop-blur-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white tracking-wide">
                  {title}
                </h3>
                <p className="text-[11px] text-white/60">
                  Mağaza banneri üçün sabit ölçülü (2.4 : 1) çərçivə
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-white/15 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Interactive Viewport Area */}
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
            className="relative w-full h-[320px] bg-[#07080c] overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
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
                crossOrigin="anonymous"
                alt="Banner önbaxış"
                className="max-w-[420px] max-h-[300px] object-contain select-none pointer-events-none"
                draggable={false}
              />
            </div>

            {/* Darkened Vignette Mask with 384x160 Cutout in center */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <mask id="banner-crop-mask">
                    <rect width="100%" height="100%" fill="white" />
                    <rect
                      x="calc(50% - 192px)"
                      y="calc(50% - 80px)"
                      width="384"
                      height="160"
                      rx="20"
                      fill="black"
                    />
                  </mask>
                </defs>
                <rect
                  width="100%" height="100%"
                  fill="rgba(0, 0, 0, 0.76)"
                  mask="url(#banner-crop-mask)"
                />
              </svg>

              {/* Fixed Frame Ring with Cyan Specular Glow & Grid Lines */}
              <div className="absolute w-[384px] h-[160px] rounded-2xl border-2 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.35)] pointer-events-none flex items-center justify-center overflow-hidden">
                {/* Rule of thirds grid lines */}
                <div className="w-full h-[1px] bg-cyan-400/20 pointer-events-none absolute top-1/3" />
                <div className="w-full h-[1px] bg-cyan-400/20 pointer-events-none absolute top-2/3" />
                <div className="h-full w-[1px] bg-cyan-400/20 pointer-events-none absolute left-1/3" />
                <div className="h-full w-[1px] bg-cyan-400/20 pointer-events-none absolute left-2/3" />

                {/* Badge on corner */}
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/75 border border-cyan-400/40 text-[10px] font-mono text-cyan-300 font-bold backdrop-blur-md">
                  Banner 2.4 : 1
                </span>
              </div>
            </div>

            {/* Drag & Pan Hint Overlay */}
            <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none">
              <span className="px-3 py-1 rounded-full bg-black/75 border border-white/15 text-[11px] text-white/90 backdrop-blur-md shadow-lg flex items-center gap-1.5">
                <Move size={12} className="text-cyan-400" />
                <span>Şəkli sürüşdürmək üçün tutub dartın</span>
              </span>
            </div>
          </div>

          {/* Controls: Zoom Slider & Actions */}
          <div className="p-4 sm:p-5 space-y-4 bg-black/40 border-t border-white/10">
            {/* Zoom Slider Bar */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(0.5, Number((prev - 0.15).toFixed(2))))}
                className="p-2 rounded-xl border border-white/15 hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Kiçilt"
              >
                <ZoomOut size={16} />
              </button>

              <input
                type="range"
                min="0.5"
                max="3.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />

              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(3.5, Number((prev + 0.15).toFixed(2))))}
                className="p-2 rounded-xl border border-white/15 hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Böyüt"
              >
                <ZoomIn size={16} />
              </button>

              <span className="text-xs font-mono font-bold text-cyan-300 w-12 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Action Row: Rotate, Reset, Cancel & Confirm */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRotate}
                  className="px-3 py-2 rounded-xl border border-white/15 hover:bg-white/10 text-xs flex items-center gap-1.5 text-white/90 transition-colors cursor-pointer"
                  title="90 dərəcə çevir"
                >
                  <RotateCw size={14} />
                  <span className="hidden sm:inline">Çevir</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-2 rounded-xl border border-white/15 hover:bg-white/10 text-xs flex items-center gap-1.5 text-white/90 transition-colors cursor-pointer"
                  title="Sıfırla"
                >
                  <RefreshCw size={14} />
                  <span className="hidden sm:inline">Mərkəz</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-white/15 hover:bg-white/10 text-xs font-semibold text-white/80 transition-colors cursor-pointer"
                >
                  İmtina
                </button>

                <button
                  type="button"
                  onClick={handleConfirmCrop}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  <Check size={15} />
                  <span>Kəs və Təsdiq Et</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
