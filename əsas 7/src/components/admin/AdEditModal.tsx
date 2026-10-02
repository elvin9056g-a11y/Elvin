import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Upload,
  Search,
  Check,
  Sparkles,
  Package,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Crop,
  Layers,
} from 'lucide-react';
import { supabase, uploadBannerImageToSupabase, saveProductAd } from '../../lib/supabase';
import { BannerCropperModal } from './BannerCropperModal';
import { DbProductAd } from '../../types';

interface ProductOption {
  id: string;
  title: string;
  price: number;
  image_url?: string | null;
  category_id?: string | null;
}

interface AdEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingAd?: DbProductAd | null;
}

export const AdEditModal: React.FC<AdEditModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  editingAd,
}) => {
  // Form fields
  const [title, setTitle] = useState('');
  const [croppedDataUrl, setCroppedDataUrl] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  // Products
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Cropper state
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission state
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load products list from Supabase
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadProducts() {
      setLoadingProducts(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, title, price, image_url, category_id')
          .order('title', { ascending: true });

        if (!error && data && isMounted) {
          setProducts(
            data.map((p) => ({
              id: p.id,
              title: p.title || 'Adsız məhsul',
              price: typeof p.price === 'number' ? p.price : Number(p.price) || 0,
              image_url: p.image_url,
              category_id: p.category_id,
            }))
          );
        }
      } catch (err) {
        console.warn('Failed to load products for ad modal:', err);
      } finally {
        if (isMounted) setLoadingProducts(false);
      }
    }

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Initialize or reset form based on editingAd
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      if (editingAd) {
        setTitle(editingAd.title || '');
        setExistingImageUrl(editingAd.image_url || null);
        setCroppedDataUrl(null);
        setCroppedBlob(null);

        // Pre-select products
        const preSelected = (editingAd.product_ad_items || []).map((item) => item.product_id);
        setSelectedProductIds(preSelected);
      } else {
        setTitle('');
        setExistingImageUrl(null);
        setCroppedDataUrl(null);
        setCroppedBlob(null);
        setSelectedProductIds([]);
      }
      setProductSearch('');
    }
  }, [isOpen, editingAd]);

  // Handle file select from Gallery / Computer
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Zəhmət olmasa düzgün şəkil formatı seçin (JPEG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRawImageSrc(reader.result);
        setIsCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);

    // Reset file input value to allow selecting same image again
    e.target.value = '';
  };

  // Toggle single product selection
  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // Select all or clear filtered products
  const handleSelectAllFiltered = () => {
    const idsToAdd = filteredProducts.map((p) => p.id);
    setSelectedProductIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const handleClearSelection = () => {
    setSelectedProductIds([]);
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase();
    return products.filter((p) => p.title.toLowerCase().includes(q));
  }, [products, productSearch]);

  // Main Save Logic
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setErrorMsg('Zəhmət olmasa reklamın başlığını daxil edin.');
      return;
    }

    const hasImage = Boolean(croppedBlob || croppedDataUrl || existingImageUrl);
    if (!hasImage) {
      setErrorMsg('Zəhmət olmasa "Qalereyadan Seç" düyməsi ilə banner şəkli təyin edin.');
      return;
    }

    setSaving(true);
    try {
      let finalImageUrl = existingImageUrl || '';

      // 1. If user cropped a new image, upload file to Supabase Storage 'banners' bucket
      if (croppedBlob) {
        finalImageUrl = await uploadBannerImageToSupabase(croppedBlob, 'banner.jpg');
      } else if (croppedDataUrl && !finalImageUrl) {
        // Fallback: convert dataURL to blob and upload
        finalImageUrl = croppedDataUrl;
      }

      if (!finalImageUrl) {
        throw new Error('Şəkil URL-i alına bilmədi.');
      }

      // 2. Save ad to Supabase product_ads and link product_ad_items
      const result = await saveProductAd({
        id: editingAd?.id,
        title: title.trim(),
        image_url: finalImageUrl,
        productIds: selectedProductIds,
      });

      if (!result.success) {
        throw new Error(result.error || 'Məlumat bazaya yazıla bilmədi');
      }

      setSuccessMsg('Reklam uğurla yadda saxlanıldı!');
      setTimeout(() => {
        onSaved();
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Save ad error:', err);
      setErrorMsg(err.message || 'Xəta baş verdi. Zəhmət olmasa təkrar cəhd edin.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentPreviewImage = croppedDataUrl || existingImageUrl;

  return (
    <>
      <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl overflow-y-auto">
        {/* Backdrop */}
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative z-10 w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden bg-[#11131a] border border-white/15 text-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-inner">
                <Sparkles size={18} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  {editingAd ? 'Reklamı Redaktə Et' : 'Yeni Reklam Əlavə Et'}
                </h2>
                <p className="text-xs text-white/60">
                  Mağaza banneri və aidiyyəti məhsulların idarəsi
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

          {/* Form Scrollable Body */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Feedback Alerts */}
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

            {/* Section 1: Title */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/90 flex items-center gap-1.5">
                <span>Reklamın Başlığı</span>
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Məs: Premium Alətlər və Yaz Endirimləri"
                className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium bg-white/5 border border-white/15 text-white placeholder-white/35 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
            </div>

            {/* Section 2: Banner Image with File Input and Cropper */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white/90 flex items-center gap-1.5">
                  <span>Banner Şəkli</span>
                  <span className="text-rose-400">*</span>
                  <span className="text-[10px] font-normal text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-md border border-cyan-400/20">
                    2.4:1 Aspect Ratio
                  </span>
                </label>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-500/20 active:scale-95"
                >
                  <Upload size={14} />
                  <span>{currentPreviewImage ? 'Şəkli Yenilə (Qalereyadan Seç)' : 'Qalereyadan Seç'}</span>
                </button>
              </div>

              {/* Banner Image Preview / Placeholder */}
              {currentPreviewImage ? (
                <div className="space-y-2">
                  <div className="relative w-full rounded-2xl overflow-hidden border border-white/20 bg-black/60 shadow-xl group">
                    {/* Aspect Ratio Box matching Store Banner: 2.4 : 1 */}
                    <div className="w-full aspect-[2.4/1] relative overflow-hidden">
                      <img
                        src={currentPreviewImage}
                        alt="Banner önbaxış"
                        className="w-full h-full object-cover"
                      />

                      {/* Gradient Overlay simulation */}
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-900/60 to-transparent" />

                      {/* Content simulation overlay */}
                      <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between z-10 pointer-events-none">
                        <span className="inline-flex self-start items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black text-white border border-white/20 uppercase">
                          <Sparkles size={10} className="text-amber-300" />
                          Xüsusi Təklif
                        </span>
                        <div className="max-w-[75%] space-y-0.5">
                          <h4 className="text-sm sm:text-base font-black text-white leading-tight drop-shadow">
                            {title || 'Reklam Başlığı'}
                          </h4>
                          <p className="text-[11px] text-white/80 line-clamp-1">
                            {selectedProductIds.length > 0
                              ? `${selectedProductIds.length} məhsul daxildir`
                              : 'Məhsullar aşağıdan seçilir'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Top Action Overlay Buttons */}
                    <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRawImageSrc(currentPreviewImage);
                          setIsCropperOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black text-xs font-semibold text-cyan-300 border border-cyan-400/50 backdrop-blur-md flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95"
                        title="Şəkli çərçivədə yenidən kəs və ya böyüt/kiçilt"
                      >
                        <Crop size={14} />
                        <span>Kəs və Nizamlaza</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95"
                        title="Başqa şəkil seç"
                      >
                        <Upload size={14} />
                        <span>Şəkli Yenilə</span>
                      </button>
                    </div>
                  </div>

                  {/* Status Indicator Bar */}
                  <div className="flex items-center justify-between px-1 text-[11px]">
                    {croppedBlob ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 size={13} />
                        <span>Yeni şəkil kəsildi. Yadda saxladıqda 'banners' bucket-inə yüklənəcək.</span>
                      </span>
                    ) : (
                      <span className="text-gray-400 flex items-center gap-1">
                        <span>Mövcud banner şəkli saxlanılır. Dəyişmək üçün </span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-cyan-400 hover:underline font-semibold cursor-pointer"
                        >
                          Şəkli Yenilə
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-[2.4/1] rounded-2xl border-2 border-dashed border-white/20 hover:border-cyan-400/60 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer p-6 text-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 group-hover:bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/20 transition-all">
                    <Upload size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white/90">
                      Qalereyadan və ya Kompüterdən Şəkil Seçin
                    </p>
                    <p className="text-[11px] text-white/50 mt-0.5">
                      Seçilən kimi avtomatik banner çərçivəsi (Crop) açılacaq
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Product Search and Selection */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-white/90 flex items-center gap-1.5">
                    <Package size={15} className="text-cyan-400" />
                    <span>Bu Reklama Aid Olan Məhsullar</span>
                  </label>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                    {selectedProductIds.length} seçilib
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  >
                    Axtarışdakıları seç
                  </button>
                  <span className="text-white/20">•</span>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="text-[11px] text-white/50 hover:text-white cursor-pointer"
                  >
                    Təmizlə
                  </button>
                </div>
              </div>

              {/* Product Search Input */}
              <div className="relative w-full">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Məhsulun adını yazaraq filtrlə..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl text-xs bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/60 transition-all"
                />
                {productSearch && (
                  <button
                    type="button"
                    onClick={() => setProductSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Product List with Checkboxes */}
              <div className="max-h-60 overflow-y-auto rounded-2xl border border-white/10 bg-black/40 p-2 space-y-1.5 scrollbar-thin">
                {loadingProducts ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-white/40 text-xs">
                    <RefreshCw size={18} className="animate-spin text-cyan-400" />
                    <span>Məhsullar yüklənir...</span>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="py-8 text-center text-white/40 text-xs">
                    {productSearch ? 'Axtarışa uyğun məhsul tapılmadı.' : 'Bazada heç bir məhsul yoxdur.'}
                  </div>
                ) : (
                  filteredProducts.map((prod) => {
                    const isChecked = selectedProductIds.includes(prod.id);
                    return (
                      <label
                        key={prod.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-cyan-500/15 border-cyan-400/40 text-white'
                            : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 text-white/80'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Checkbox */}
                          <div
                            onClick={(e) => {
                              e.preventDefault();
                              toggleProduct(prod.id);
                            }}
                            className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all ${
                              isChecked
                                ? 'bg-cyan-500 border-cyan-400 text-white shadow-sm shadow-cyan-500/40'
                                : 'border-white/30 bg-white/5'
                            }`}
                          >
                            {isChecked && <Check size={12} strokeWidth={3} />}
                          </div>

                          {/* Thumbnail */}
                          {prod.image_url ? (
                            <img
                              src={prod.image_url}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/40 shrink-0">
                              <Package size={14} />
                            </div>
                          )}

                          {/* Title */}
                          <div className="min-w-0">
                            <h5 className="text-xs font-semibold text-white truncate">
                              {prod.title}
                            </h5>
                            <span className="text-[10px] text-cyan-300 font-mono font-bold">
                              {prod.price} AZN
                            </span>
                          </div>
                        </div>

                        {/* Status badge */}
                        {isChecked && (
                          <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-md border border-cyan-400/20 shrink-0">
                            Seçilib
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-white/15 hover:bg-white/10 text-xs font-semibold text-white/80 transition-colors cursor-pointer"
              >
                İmtina
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Yadda saxlanılır...</span>
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    <span>Yadda Saxla</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Banner Cropper Modal */}
      {isCropperOpen && rawImageSrc && (
        <BannerCropperModal
          isOpen={isCropperOpen}
          imageSrc={rawImageSrc}
          onClose={() => setIsCropperOpen(false)}
          onCropComplete={(dataUrl, blob) => {
            setCroppedDataUrl(dataUrl);
            setCroppedBlob(blob);
            setExistingImageUrl(null);
            setIsCropperOpen(false);
          }}
        />
      )}
    </>
  );
};
