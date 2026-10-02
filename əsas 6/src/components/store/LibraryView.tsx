import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  KeyRound,
  RefreshCw,
  Search,
  LayoutGrid,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Package,
  Layers,
  ArrowRight,
  FolderOpen,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { SecretContentModal, SecretModalProduct } from './SecretContentModal';

interface LibraryRow {
  id: string;
  user_id: string;
  product_id: string;
  products?: SecretModalProduct | SecretModalProduct[] | null;
}

interface LibraryViewProps {
  currentUser: UserProfile;
  onGoToCatalog: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  currentUser,
  onGoToCatalog,
}) => {
  const { isDark } = useTheme();
  const [libraryRows, setLibraryRows] = useState<LibraryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<SecretModalProduct | null>(null);

  // Load user_library joined with products from Supabase
  const loadLibrary = async () => {
    setLoading(true);
    try {
      // Determine user id
      let targetUserId = currentUser.id;
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser?.id) {
        targetUserId = authUser.id;
      }

      if (!targetUserId) {
        setLibraryRows([]);
        return;
      }

      // Supabase query: select('*, products(*)')
      const { data, error } = await supabase
        .from('user_library')
        .select('*, products(*)')
        .eq('user_id', targetUserId);

      if (error) {
        console.error('Error fetching user_library:', error);
      } else {
        setLibraryRows((data as LibraryRow[]) || []);
      }
    } catch (err) {
      console.error('Unexpected error loading user_library:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();

    let isMounted = true;
    let subscriptionChannel: any = null;

    (async () => {
      let uid = currentUser.id;
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser?.id) uid = authUser.id;

      if (uid && isMounted) {
        subscriptionChannel = supabase
          .channel(`user_library_realtime_${uid}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_library',
              filter: `user_id=eq.${uid}`,
            },
            () => {
              loadLibrary();
            }
          )
          .subscribe();
      }
    })();

    return () => {
      isMounted = false;
      if (subscriptionChannel) {
        supabase.removeChannel(subscriptionChannel);
      }
    };
  }, [currentUser.id]);

  // Extract products from library rows
  const productsList = useMemo(() => {
    return libraryRows
      .map((row) => {
        const prod = Array.isArray(row.products) ? row.products[0] : row.products;
        if (!prod) return null;
        return {
          libraryId: row.id,
          ...prod,
        };
      })
      .filter(Boolean) as Array<SecretModalProduct & { libraryId: string }>;
  }, [libraryRows]);

  // Filtered list by search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return productsList;
    const q = searchQuery.toLowerCase();
    return productsList.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [productsList, searchQuery]);

  return (
    <div className="space-y-6 pb-28">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400">
              <BookOpen size={18} />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
              Kitabxanam
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-mono font-bold">
              {productsList.length} məhsul
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Əldə etdiyiniz rəqəmsal məhsullar, fayllar və gizli təlimatlar.
          </p>
        </div>

        {/* Refresh & Search Buttons */}
        <div className="flex items-center gap-2">
          {productsList.length > 3 && (
            <div className="relative w-full sm:w-56">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kitabxanada axtar..."
                className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs font-medium border backdrop-blur-md transition-all focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 shadow-sm'
                }`}
              />
            </div>
          )}

          <button
            type="button"
            onClick={loadLibrary}
            disabled={loading}
            title="Kitabxananı yenilə"
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700 shadow-sm'
            }`}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-cyan-400' : ''} />
          </button>
        </div>
      </div>

      {/* Content State: Loading, Empty or Grid */}
      {loading && libraryRows.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-center">
          <RefreshCw size={26} className="animate-spin text-cyan-400 mb-3" />
          <p className="text-xs text-gray-400">Kitabxananız bazadan yüklənir...</p>
        </div>
      ) : productsList.length === 0 ? (
        /* Empty State */
        <div className="py-20 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 shadow-xl shadow-cyan-500/5">
            <BookOpen size={30} />
          </div>
          <h3 className="text-base sm:text-lg font-bold">
            Kitabxananız hələ boşdur
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 mt-2 mb-6 leading-relaxed">
            Hələ heç bir rəqəmsal məhsul əldə etməmisiniz. Kataloqdan bəyəndiyiniz məhsulları əldə edərək dərhal buradakı lisenziyalara və gizli məzmunlara çıxış qazana bilərsiniz.
          </p>
          <button
            type="button"
            onClick={onGoToCatalog}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs flex items-center gap-2 transition-all shadow-md shadow-cyan-600/20 cursor-pointer active:scale-95"
          >
            <LayoutGrid size={15} />
            <span>Kataloqa Keç</span>
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        /* Search Not Found State */
        <div className="py-16 text-center text-xs text-gray-400">
          Axtarışınıza uyğun heç bir məhsul tapılmadı.
        </div>
      ) : (
        /* Products Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredProducts.map((prod) => (
            <motion.div
              key={prod.libraryId}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`rounded-3xl border p-4 flex flex-col justify-between transition-all duration-300 group hover:shadow-xl ${
                isDark
                  ? 'bg-[#12141c]/90 border-white/10 hover:border-cyan-500/40 shadow-lg'
                  : 'bg-white/90 border-gray-200 hover:border-cyan-500/40 shadow-sm'
              }`}
            >
              <div>
                {/* Product Image */}
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black/40 border border-white/10 mb-3.5">
                  {prod.image_url ? (
                    <img
                      src={prod.image_url}
                      alt={prod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <Package size={32} />
                    </div>
                  )}

                  {/* Active License Badge */}
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/70 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono font-medium backdrop-blur-md flex items-center gap-1 shadow">
                    <CheckCircle2 size={11} className="text-emerald-400" />
                    <span>Aktiv Giriş</span>
                  </div>

                  {prod.price !== undefined && prod.price !== null && (
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/75 border border-white/15 text-cyan-400 text-[11px] font-mono font-bold backdrop-blur-md shadow">
                      {Number(prod.price).toFixed(2)} ₼
                    </div>
                  )}
                </div>

                {/* Title */}
                <h4 className="font-bold text-sm sm:text-base line-clamp-2 leading-tight group-hover:text-cyan-400 transition-colors">
                  {prod.title}
                </h4>

                {/* Description */}
                {prod.description && (
                  <p className="text-xs text-gray-400 line-clamp-2 mt-1.5 leading-relaxed">
                    {prod.description}
                  </p>
                )}
              </div>

              {/* Action Button: "Məzmuna Bax" */}
              <div className="mt-4 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(prod)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <KeyRound size={15} />
                  <span>Məzmuna Bax</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Secret Content Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <SecretContentModal
            isOpen={Boolean(selectedProduct)}
            onClose={() => setSelectedProduct(null)}
            product={selectedProduct}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
