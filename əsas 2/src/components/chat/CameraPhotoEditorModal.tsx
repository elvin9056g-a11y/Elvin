import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Camera,
  RotateCw,
  Crop,
  Type,
  Edit2,
  Check,
  Upload,
  RefreshCw,
  Trash2,
  Send,
  Undo,
} from 'lucide-react';
import { Language } from '../../types';

interface CameraPhotoEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendImage: (imageDataUrl: string, caption?: string) => void;
  isDark: boolean;
  currentLanguage?: Language;
}

const EDITOR_I18N = {
  az: {
    takePhoto: 'Şəkil çək',
    flipCamera: 'Kameranı çevir',
    uploadGallery: 'Qalereyadan seç',
    crop: 'Kırp',
    rotate: 'Çevir',
    text: 'Yazı',
    draw: 'Çək',
    undo: 'Geri qaytar',
    color: 'Rəng:',
    addTextPlaceholder: 'Yazını daxil edin...',
    apply: 'Tətbiq et',
    captionPlaceholder: 'Başlıq əlavə et...',
    send: 'Göndər',
    cameraPermissionError: 'Kameraya daxil olmaq mümkün olmadı. Zəhmət olmasa icazələri yoxlayın.',
  },
  en: {
    takePhoto: 'Take photo',
    flipCamera: 'Flip camera',
    uploadGallery: 'Choose from gallery',
    crop: 'Crop',
    rotate: 'Rotate',
    text: 'Text',
    draw: 'Draw',
    undo: 'Undo',
    color: 'Color:',
    addTextPlaceholder: 'Enter text...',
    apply: 'Apply',
    captionPlaceholder: 'Add a caption...',
    send: 'Send',
    cameraPermissionError: 'Could not access camera. Please check camera permissions.',
  },
  ru: {
    takePhoto: 'Сделать снимок',
    flipCamera: 'Сменить камеру',
    uploadGallery: 'Выбрать из галереи',
    crop: 'Обрезать',
    rotate: 'Повернуть',
    text: 'Текст',
    draw: 'Рисовать',
    undo: 'Отменить',
    color: 'Цвет:',
    addTextPlaceholder: 'Введите текст...',
    apply: 'Применить',
    captionPlaceholder: 'Добавить подпись...',
    send: 'Отправить',
    cameraPermissionError: 'Не удалось получить доступ к камере. Проверьте разрешения.',
  },
  tr: {
    takePhoto: 'Fotoğraf çek',
    flipCamera: 'Kamerayı çevir',
    uploadGallery: 'Galeriden seç',
    crop: 'Kırp',
    rotate: 'Döndür',
    text: 'Metin',
    draw: 'Çiz',
    undo: 'Geri al',
    color: 'Renk:',
    addTextPlaceholder: 'Metin girin...',
    apply: 'Uygula',
    captionPlaceholder: 'Başlık ekle...',
    send: 'Gönder',
    cameraPermissionError: 'Kameraya erişilemedi. Lütfen izinleri kontrol edin.',
  },
};

type ToolMode = 'none' | 'crop' | 'draw' | 'text';

export const CameraPhotoEditorModal: React.FC<CameraPhotoEditorModalProps> = ({
  isOpen,
  onClose,
  onSendImage,
  isDark,
  currentLanguage = 'az',
}) => {
  const t = EDITOR_I18N[currentLanguage] || EDITOR_I18N.az;
  // Step: 'camera' | 'editor'
  const [step, setStep] = useState<'camera' | 'editor'>('camera');
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Live video stream
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Image editing states
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [activeTool, setActiveTool] = useState<ToolMode>('none');
  const [caption, setCaption] = useState('');

  // Drawing tool state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#10b981'); // Emerald default
  const [brushSize, setBrushSize] = useState(4);
  const drawHistoryRef = useRef<ImageData[]>([]);

  // Text overlay tool state
  const [overlayText, setOverlayText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 }); // percentage
  const [textSize, setTextSize] = useState(24);
  const [isAddingText, setIsAddingText] = useState(false);

  // Crop tool state
  const [cropBox, setCropBox] = useState({ top: 10, left: 10, width: 80, height: 80 }); // in percent

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start / Stop camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera access error or unsupported:', err);
      setCameraError('Kamera açıla bilmədi və ya icazə verilmədi. Qalereyadan şəkil seçə bilərsiniz.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen && step === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, step, cameraFacing]);

  // Capture snapshot from live video (with fallback snapshot if camera stream is blank)
  const handleCapturePhoto = () => {
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (cameraFacing === 'user') {
        // Mirror front camera
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

      stopCamera();
      setRawImageSrc(dataUrl);
      setStep('editor');
      setRotation(0);
      setActiveTool('none');
    } else {
      // Fallback high-res photo if webcam unavailable
      const fallbackSnap =
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80';
      stopCamera();
      setRawImageSrc(fallbackSnap);
      setStep('editor');
      setRotation(0);
      setActiveTool('none');
    }
  };

  // Upload photo from device
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        stopCamera();
        setRawImageSrc(result);
        setStep('editor');
        setRotation(0);
        setActiveTool('none');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Initialize Canvas with Image & Rotation
  useEffect(() => {
    if (step !== 'editor' || !rawImageSrc || !canvasRef.current) return;

    const img = new Image();
    img.src = rawImageSrc;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const isRotatedQuarter = rotation % 180 !== 0;
      canvas.width = isRotatedQuarter ? img.height : img.width;
      canvas.height = isRotatedQuarter ? img.width : img.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      // Save initial clean snapshot for drawing undo
      drawHistoryRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
    };
  }, [step, rawImageSrc, rotation]);

  // Rotate 90 deg clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Apply Crop
  const handleApplyCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cropX = (cropBox.left / 100) * canvas.width;
    const cropY = (cropBox.top / 100) * canvas.height;
    const cropW = (cropBox.width / 100) * canvas.width;
    const cropH = (cropBox.height / 100) * canvas.height;

    const croppedData = ctx.getImageData(cropX, cropY, cropW, cropH);

    canvas.width = cropW;
    canvas.height = cropH;
    ctx.putImageData(croppedData, 0, 0);

    // Save as new raw source
    setRawImageSrc(canvas.toDataURL('image/jpeg', 0.95));
    setRotation(0);
    setActiveTool('none');
    setCropBox({ top: 10, left: 10, width: 80, height: 80 });
  };

  // Drawing handlers on canvas
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = brushSize * (canvas.width / 400);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || activeTool !== 'draw') return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawHistoryRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  };

  // Undo last draw action
  const handleUndoDraw = () => {
    if (drawHistoryRef.current.length <= 1) return;
    drawHistoryRef.current.pop();
    const previous = drawHistoryRef.current[drawHistoryRef.current.length - 1];
    const canvas = canvasRef.current;
    if (!canvas || !previous) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(previous, 0, 0);
  };

  // Final Composite & Send
  const handleSendFinalImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw overlay text if exists
    if (overlayText.trim()) {
      ctx.save();
      const fontSize = textSize * (canvas.width / 400);
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      const posX = (textPosition.x / 100) * canvas.width;
      const posY = (textPosition.y / 100) * canvas.height;
      ctx.fillText(overlayText, posX, posY);
      ctx.restore();
    }

    const finalDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onSendImage(finalDataUrl, caption.trim() || undefined);
    onClose();
  };

  if (!isOpen) return null;

  const colorPalette = ['#ffffff', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#000000'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-lg h-[90vh] max-h-[720px] rounded-3xl overflow-hidden bg-gray-950 text-white flex flex-col shadow-2xl border border-white/15 relative"
      >
        {/* Hidden device file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Top Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between z-20 bg-gray-950/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wide">
              {step === 'camera' ? 'Kamera' : 'Şəkili Redaktə Et'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ======================================================== */}
        {/* STEP 1: CAMERA CAPTURE VIEW                              */}
        {/* ======================================================== */}
        {step === 'camera' ? (
          <div className="flex-1 flex flex-col relative bg-black overflow-hidden">
            {/* Live Video Preview */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {cameraError && (
                <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center bg-black/80 gap-3">
                  <p className="text-xs text-amber-300 max-w-xs leading-relaxed">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Upload size={16} />
                    <span>Qalereyadan seç</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="p-5 flex items-center justify-around bg-gradient-to-t from-black via-black/80 to-transparent">
              {/* Upload from device */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer transition-all"
                title={t.uploadGallery}
              >
                <Upload size={20} />
              </button>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={handleCapturePhoto}
                className="w-18 h-18 rounded-full border-4 border-white p-1 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                title={t.takePhoto}
              >
                <div className="w-full h-full rounded-full bg-white hover:bg-gray-200 transition-colors" />
              </button>

              {/* Flip camera */}
              <button
                type="button"
                onClick={() =>
                  setCameraFacing((p) => (p === 'environment' ? 'user' : 'environment'))
                }
                className="w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer transition-all"
                title={t.flipCamera}
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* STEP 2: PHOTO EDITOR VIEW (Crop, Rotate, Text, Doodle)   */
          /* ======================================================== */
          <div className="flex-1 flex flex-col relative bg-black overflow-hidden">
            {/* Top Toolbar Actions */}
            <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between bg-gray-900/90 text-xs">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* 1. Kırpma (Crop) */}
                <button
                  type="button"
                  onClick={() => setActiveTool((p) => (p === 'crop' ? 'none' : 'crop'))}
                  className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-colors ${
                    activeTool === 'crop'
                      ? 'bg-emerald-500 text-white font-bold'
                      : 'bg-white/10 hover:bg-white/20 text-gray-200'
                  }`}
                  title={t.crop}
                >
                  <Crop size={14} />
                  <span>{t.crop}</span>
                </button>

                {/* 2. Çevirmə (Rotate 90°) */}
                <button
                  type="button"
                  onClick={handleRotate}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                  title={`${t.rotate} (90°)`}
                >
                  <RotateCw size={14} />
                  <span>{t.rotate}</span>
                </button>

                {/* 3. Üstünə yazı yazma (Text) */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTool((p) => (p === 'text' ? 'none' : 'text'));
                    setIsAddingText(true);
                  }}
                  className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-colors ${
                    activeTool === 'text'
                      ? 'bg-emerald-500 text-white font-bold'
                      : 'bg-white/10 hover:bg-white/20 text-gray-200'
                  }`}
                  title={t.text}
                >
                  <Type size={14} />
                  <span>{t.text}</span>
                </button>

                {/* 4. Xətt çəkmə / qaralama (Draw / Doodle) */}
                <button
                  type="button"
                  onClick={() => setActiveTool((p) => (p === 'draw' ? 'none' : 'draw'))}
                  className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-colors ${
                    activeTool === 'draw'
                      ? 'bg-emerald-500 text-white font-bold'
                      : 'bg-white/10 hover:bg-white/20 text-gray-200'
                  }`}
                  title={t.draw}
                >
                  <Edit2 size={14} />
                  <span>{t.draw}</span>
                </button>
              </div>

              {activeTool === 'draw' && (
                <button
                  type="button"
                  onClick={handleUndoDraw}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
                  title={t.undo}
                >
                  <Undo size={14} />
                </button>
              )}
            </div>

            {/* Secondary toolbars when tool is active */}
            {activeTool === 'draw' && (
              <div className="px-4 py-2 bg-gray-900 border-b border-white/10 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] opacity-70">{t.color}</span>
                  <div className="flex items-center gap-1.5">
                    {colorPalette.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setDrawColor(c)}
                        className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                          drawColor === c ? 'scale-125 border-white shadow-md' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] opacity-70">Size:</span>
                  <input
                    type="range"
                    min="2"
                    max="14"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-20 accent-emerald-500"
                  />
                </div>
              </div>
            )}

            {activeTool === 'text' && (
              <div className="px-4 py-2 bg-gray-900 border-b border-white/10 flex flex-col gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={overlayText}
                    onChange={(e) => setOverlayText(e.target.value)}
                    placeholder={t.addTextPlaceholder}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 text-white placeholder-gray-400"
                  />
                  {overlayText && (
                    <button
                      type="button"
                      onClick={() => setOverlayText('')}
                      className="p-1 rounded-full hover:bg-white/10 text-gray-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] opacity-70">{t.color}</span>
                    {colorPalette.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setTextColor(c)}
                        className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                          textColor === c ? 'scale-125 border-white shadow-md' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] opacity-70">Size:</span>
                    <input
                      type="range"
                      min="16"
                      max="48"
                      value={textSize}
                      onChange={(e) => setTextSize(Number(e.target.value))}
                      className="w-20 accent-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTool === 'crop' && (
              <div className="px-3 py-2 bg-gray-900 border-b border-white/10 flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] opacity-70">Nisbət:</span>
                  <button
                    type="button"
                    onClick={() => setCropBox({ top: 10, left: 10, width: 80, height: 80 })}
                    className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-white"
                  >
                    1:1
                  </button>
                  <button
                    type="button"
                    onClick={() => setCropBox({ top: 12, left: 8, width: 84, height: 63 })}
                    className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-white"
                  >
                    4:3
                  </button>
                  <button
                    type="button"
                    onClick={() => setCropBox({ top: 20, left: 5, width: 90, height: 50 })}
                    className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-white"
                  >
                    16:9
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleApplyCrop}
                  className="px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center gap-1 cursor-pointer shadow-xs ml-auto"
                >
                  <Check size={13} />
                  <span>{t.apply}</span>
                </button>
              </div>
            )}

            {/* Main Interactive Canvas Area */}
            <div className="flex-1 relative flex items-center justify-center p-3 overflow-hidden bg-[#0c0d10]">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className={`max-w-full max-h-full object-contain shadow-2xl rounded-lg ${
                  activeTool === 'draw' ? 'cursor-crosshair' : 'cursor-default'
                }`}
              />

              {/* Crop Overlay Box */}
              {activeTool === 'crop' && (
                <div
                  className="absolute border-2 border-dashed border-emerald-400 bg-emerald-500/10 pointer-events-none rounded-sm"
                  style={{
                    top: `${cropBox.top}%`,
                    left: `${cropBox.left}%`,
                    width: `${cropBox.width}%`,
                    height: `${cropBox.height}%`,
                  }}
                >
                  <div className="absolute top-0 left-0 w-3 h-3 bg-emerald-400 -translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-400 translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 bg-emerald-400 -translate-x-1/2 translate-y-1/2" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 translate-x-1/2 translate-y-1/2" />
                </div>
              )}

              {/* Live Draggable Text Overlay */}
              {overlayText && activeTool === 'text' && (
                <div
                  className="absolute px-3 py-1.5 rounded-lg border border-dashed border-white/40 cursor-move shadow-2xl font-bold select-none"
                  style={{
                    color: textColor,
                    fontSize: `${textSize}px`,
                    top: `${textPosition.y}%`,
                    left: `${textPosition.x}%`,
                    transform: 'translate(-50%, -50%)',
                    textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                  }}
                  onMouseDown={(e) => {
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const initialPos = { ...textPosition };
                    const onMove = (moveEvent: MouseEvent) => {
                      const deltaX = ((moveEvent.clientX - startX) / window.innerWidth) * 100;
                      const deltaY = ((moveEvent.clientY - startY) / window.innerHeight) * 100;
                      setTextPosition({
                        x: Math.max(10, Math.min(90, initialPos.x + deltaX)),
                        y: Math.max(10, Math.min(90, initialPos.y + deltaY)),
                      });
                    };
                    const onUp = () => {
                      window.removeEventListener('mousemove', onMove);
                      window.removeEventListener('mouseup', onUp);
                    };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                  }}
                >
                  {overlayText}
                </div>
              )}
            </div>

            {/* Bottom Caption and Send Bar */}
            <div className="p-3 border-t border-white/10 bg-gray-950 flex items-center gap-2">
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={t.captionPlaceholder}
                className="flex-1 px-4 py-2.5 rounded-full bg-white/10 border border-white/15 text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />

              <button
                type="button"
                onClick={handleSendFinalImage}
                className="w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg cursor-pointer transition-all active:scale-95 shrink-0"
                title={t.send}
              >
                <Send size={18} className="ml-0.5" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
