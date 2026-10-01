import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, X, ShoppingBag, Eye, Trash2 } from 'lucide-react';
import { StoreProduct } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: StoreProduct[];
  onOpenProduct: (product: StoreProduct) => void;
  onAddToCart: (product: StoreProduct, e: React.MouseEvent) => void;
  onRemoveFavorite: (productId: string) => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  favorites,
  onOpenProduct,
  onAddToCart,
  onRemoveFavorite,
}) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className={`relative w-full max-w-md max-h-[85vh] rounded-3xl border shadow-2xl overflow-hidden flex flex-col z-10 backdrop-blur-2xl ${
            isDark
              ? 'bg-[#12141c]/95 border-white/15 text-white'
              : 'bg-white/95 border-gray-200 text-gray-900'
          }`}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-rose-500/20 text-rose-500">
                <Heart size={18} className="fill-rose-500" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold">
                  Seçilmiş Məhsullar
                </h3>
                <p className="text-[11px] opacity-65">
                  {favorites.length} bəyənilmiş məhsul
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* List */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2.5">
            {favorites.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-xs opacity-60">
                  Hələlik heç bir məhsulu seçilmişlərə əlavə etməmisiniz.
                </p>
                <p className="text-[11px] opacity-40">
                  Kataloqda məhsulların üzərindəki ürək ikonuna toxunaraq bura əlavə edə bilərsiniz.
                </p>
              </div>
            ) : (
              favorites.map((product) => (
                <div
                  key={product.id}
                  onClick={() => {
                    onOpenProduct(product);
                    onClose();
                  }}
                  className={`p-3 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer group ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 border-white/10'
                      : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/10 shrink-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <h4 className="text-xs font-bold truncate group-hover:text-cyan-400 transition-colors">
                      {product.name}
                    </h4>
                    <p className="text-[10px] opacity-60 truncate">
                      {product.description}
                    </p>
                    <span className="text-xs font-black text-cyan-400 block">
                      {product.price} ₼
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => onAddToCart(product, e)}
                      className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white cursor-pointer transition-all shadow-sm"
                      title="Səbətə at"
                    >
                      <ShoppingBag size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFavorite(product.id);
                      }}
                      className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-all"
                      title="Seçilmişlərdən sil"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
