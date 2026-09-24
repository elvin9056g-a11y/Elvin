import React from 'react';
import { motion } from 'motion/react';
import { Star, Heart, MessageSquare, ShoppingBag } from 'lucide-react';
import { StoreProduct } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface ProductCardProps {
  product: StoreProduct;
  mode?: 'discount' | 'catalog';
  onSelect: (product: StoreProduct) => void;
  onAddToCart: (product: StoreProduct, e: React.MouseEvent) => void;
  onToggleLike: (productId: string, e: React.MouseEvent) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  mode = 'discount',
  onSelect,
  onAddToCart,
  onToggleLike,
}) => {
  const { isDark } = useTheme();

  // -------------------------------------------------------------
  // 1. REJİM: KATALOQ (KVADRAT FORMASINDA YAN-YANA 3 DƏNƏ)
  // -------------------------------------------------------------
  if (mode === 'catalog') {
    return (
      <motion.div
        whileHover={{ y: -3, scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onSelect(product)}
        className={`relative flex flex-col justify-between rounded-2xl sm:rounded-3xl border overflow-hidden backdrop-blur-xl transition-all duration-200 cursor-pointer shadow-sm group ${
          isDark
            ? 'bg-[#151720]/80 hover:bg-[#1a1d28]/95 border-white/10 hover:border-cyan-500/40 text-white shadow-black/20'
            : 'bg-white hover:bg-gray-50/90 border-gray-200 hover:border-cyan-400 text-gray-900 shadow-[0_4px_16px_rgba(0,0,0,0.04)]'
        }`}
      >
        {/* Kvadrat Şəkil Sahəsi */}
        <div className="relative aspect-square w-full overflow-hidden bg-black/5">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500"
            loading="lazy"
          />

          {/* Endirim teqi */}
          {product.discountPercent && product.discountPercent > 0 && (
            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-lg bg-red-500/90 text-white text-[9px] sm:text-[10px] font-black tracking-tight backdrop-blur-md shadow-sm">
              -{product.discountPercent}%
            </span>
          )}

          {/* Seçilmişlərə Atma Düyməsi (Ürək) */}
          <button
            type="button"
            onClick={(e) => onToggleLike(product.id, e)}
            className={`absolute top-1.5 right-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full backdrop-blur-md flex items-center justify-center transition-all cursor-pointer ${
              product.isLiked
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-black/45 hover:bg-black/70 text-white'
            }`}
            title={product.isLiked ? 'Seçilmişlərdən çıxar' : 'Seçilmişlərə əlavə et'}
            aria-label="Seçilmişlərə əlavə et"
          >
            <Heart
              size={12}
              className={`transition-colors ${
                product.isLiked ? 'fill-white text-white' : 'text-white/90 hover:text-rose-400'
              }`}
            />
          </button>

          {/* Ulduz reytinqi şəklin üstündə */}
          <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/55 backdrop-blur-md flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-amber-300">
            <Star size={10} className="fill-amber-400 text-amber-400" />
            <span>{product.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Məhsul Məlumatı (Kompakt Kvadrat) */}
        <div className="p-2 sm:p-2.5 flex flex-col justify-between flex-1 gap-1">
          <div>
            <h5 className="text-[11px] sm:text-xs font-bold line-clamp-1 leading-tight group-hover:text-cyan-400 transition-colors">
              {product.name}
            </h5>

            {/* Nə üçün istifadə olunur */}
            <p className="text-[9px] sm:text-[10px] opacity-70 line-clamp-2 leading-tight mt-0.5">
              {product.description}
            </p>
          </div>

          {/* Qiymət və Səbətə atma */}
          <div className="pt-1 flex items-center justify-between border-t border-white/5 mt-auto">
            <div>
              <span className="text-[11px] sm:text-xs font-black text-cyan-500 dark:text-cyan-400">
                {product.price} ₼
              </span>
              {product.oldPrice && (
                <span className="block text-[8px] sm:text-[9px] line-through opacity-50">
                  {product.oldPrice} ₼
                </span>
              )}
            </div>

            {/* Səbətə at düyməsi */}
            <button
              type="button"
              onClick={(e) => onAddToCart(product, e)}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white flex items-center justify-center shadow-md transition-all active:scale-90 cursor-pointer"
              title="Səbətə at"
            >
              <ShoppingBag size={12} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // -------------------------------------------------------------
  // 2. REJİM: ENDİRİMLİ MƏHSULLAR (BLOK FORMASINDA YAN-YANA 2 DƏNƏ)
  // -------------------------------------------------------------
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(product)}
      className={`relative rounded-3xl border overflow-hidden backdrop-blur-xl transition-all duration-300 cursor-pointer shadow-sm flex flex-col justify-between group ${
        isDark
          ? 'bg-[#14161f]/85 hover:bg-[#1a1d28]/95 border-white/10 hover:border-cyan-500/40 text-white shadow-black/25'
          : 'bg-white hover:bg-gray-50/90 border-gray-200 hover:border-cyan-400 text-gray-900 shadow-[0_6px_24px_rgba(0,0,0,0.05)]'
      }`}
    >
      {/* Şəkil və İkonlar */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/5">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-500"
          loading="lazy"
        />

        {/* Qradiyent kölgə */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Endirim Teqi (Sol Yuxarı) */}
        {product.discountPercent && (
          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-rose-500/95 text-white text-[10px] sm:text-xs font-black tracking-wide backdrop-blur-md shadow-md flex items-center gap-1">
            <span>-{product.discountPercent}%</span>
            <span className="hidden sm:inline text-[9px] font-normal opacity-90">ENDİRİM</span>
          </div>
        )}

        {/* Bəyənmə Düyməsi və Sayı (Sağ Yuxarı) */}
        <button
          type="button"
          onClick={(e) => onToggleLike(product.id, e)}
          className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/45 hover:bg-black/70 backdrop-blur-md flex items-center gap-1.5 text-white transition-all cursor-pointer shadow-md"
          aria-label="Məhsulu bəyən"
        >
          <Heart
            size={13}
            className={`transition-colors ${
              product.isLiked
                ? 'fill-rose-500 text-rose-500'
                : 'text-white/90 hover:text-rose-400'
            }`}
          />
          <span className="text-[10px] sm:text-xs font-bold">{product.likesCount}</span>
        </button>

        {/* Alt kategoriya etiketi */}
        <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/55 backdrop-blur-md text-[9px] sm:text-[10px] text-white/90 font-medium">
          {product.subcategoryLabel}
        </div>
      </div>

      {/* Məhsul Məlumat Sahəsi */}
      <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 gap-2.5">
        <div className="space-y-1.5">
          {/* Məhsulun Adı */}
          <h4 className="text-xs sm:text-sm md:text-base font-extrabold line-clamp-1 leading-snug group-hover:text-cyan-400 transition-colors">
            {product.name}
          </h4>

          {/* NƏ ÜÇÜN İSTİFADƏ OLUNUR */}
          <div className="space-y-0.5">
            <span className="text-[9px] uppercase font-bold text-cyan-500 dark:text-cyan-400 tracking-wider">
              Təyinatı:
            </span>
            <p className="text-[10px] sm:text-xs opacity-75 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          </div>
        </div>

        {/* Reytinq, Yorumlar və Bəyənmə */}
        <div className="flex items-center justify-between text-[10px] sm:text-xs pt-1 border-t border-white/10 dark:border-white/5">
          {/* Ulduz Reytinqi */}
          <div className="flex items-center gap-1 font-black text-amber-400">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            <span>{product.rating.toFixed(1)}</span>
          </div>

          {/* Yorumlar sayı */}
          <div className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
            <MessageSquare size={12} />
            <span>{product.reviewsCount} yorum</span>
          </div>
        </div>

        {/* Qiymətlər və Səbətə atma */}
        <div className="pt-2 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm sm:text-lg font-black text-cyan-600 dark:text-cyan-400">
                {product.price} ₼
              </span>
              {product.oldPrice && (
                <span className="text-[10px] sm:text-xs line-through opacity-45">
                  {product.oldPrice} ₼
                </span>
              )}
            </div>
          </div>

          {/* Səbətə at düyməsi - sadəcə icon */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={(e) => onAddToCart(product, e)}
            className="w-8 h-8 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white flex items-center justify-center shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            title="Səbətə at"
            aria-label="Səbətə at"
          >
            <ShoppingBag size={15} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
