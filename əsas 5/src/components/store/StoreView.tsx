import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  ArrowLeft,
  Smartphone,
  Monitor,
  Activity,
  HeartPulse,
  Flame,
  Check,
  X,
  Wallet,
  Bell,
  Heart,
  Plus,
  Layers,
  Folder,
  Box,
  Tag,
  Sparkles,
} from 'lucide-react';
import {
  UserProfile,
  StoreProduct,
  StoreAdBanner,
  StoreMainCategory,
  CartItem,
  ProductReview,
} from '../../types';
import { useTheme } from '../../context/ThemeContext';
import {
  STORE_CATEGORIES,
  INITIAL_STORE_BANNERS,
  INITIAL_PRODUCTS,
} from '../../data/storeData';
import { supabase } from '../../lib/supabase';
import { StoreAdCarousel } from './StoreAdCarousel';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { StoreBottomBar, StoreTab } from './StoreBottomBar';
import { CartView } from './CartView';
import { StoreNotificationsModal, INITIAL_NOTIFICATIONS, StoreNotification } from './StoreNotificationsModal';
import { BalanceTopUpModal } from './BalanceTopUpModal';
import { FavoritesModal } from './FavoritesModal';
import { LibraryView } from './LibraryView';

interface DbCategory {
  id: string;
  name: string;
  icon?: string | null;
  parent_id?: string | null;
}

interface StoreViewProps {
  currentUser: UserProfile;
  onBackToHome: () => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const StoreView: React.FC<StoreViewProps> = ({
  currentUser,
  onBackToHome,
  onUpdateProfile,
}) => {
  const { isDark } = useTheme();

  // Navigation tab inside Store: 'home' | 'catalog' | 'cart' (Səbət yerində qalır)
  const [activeTab, setActiveTab] = useState<StoreTab>('home');

  // Search Query for Ev and Kataloq
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Category & Subcategory in Catalog
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');

  // Supabase Database Categories
  const [categories, setCategories] = useState<DbCategory[]>([]);

  // Banners & Products State
  const [banners] = useState<StoreAdBanner[]>(INITIAL_STORE_BANNERS);
  const [products, setProducts] = useState<StoreProduct[]>(() => {
    try {
      const savedLikes = localStorage.getItem('lumora_product_likes');
      if (savedLikes) {
        const likedIds: string[] = JSON.parse(savedLikes);
        return INITIAL_PRODUCTS.map((p) => ({
          ...p,
          isLiked: likedIds.includes(p.id),
          likesCount: likedIds.includes(p.id) ? p.likesCount + 1 : p.likesCount,
        }));
      }
    } catch {
      // fallback
    }
    return INITIAL_PRODUCTS;
  });

  // Fetch Categories & Products directly from Supabase
  useEffect(() => {
    let isMounted = true;

    async function fetchStoreData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          supabase.from('categories').select('*').order('created_at', { ascending: true }),
          supabase.from('products').select('*').order('created_at', { ascending: false }),
        ]);

        if (isMounted && catRes.data && catRes.data.length > 0) {
          setCategories(catRes.data);
        }

        if (isMounted && prodRes.data && prodRes.data.length > 0) {
          const savedLikes = localStorage.getItem('lumora_product_likes');
          const likedIds: string[] = savedLikes ? JSON.parse(savedLikes) : [];

          const catMap = new Map<string, string>();
          (catRes.data || []).forEach((c: any) => catMap.set(c.id, c.name));

          const mapped: StoreProduct[] = prodRes.data.map((row: any) => {
            const prodPrice = typeof row.price === 'number' ? row.price : Number(row.price) || 0;
            const subLabel = catMap.get(row.category_id) || 'Rəqəmsal Məhsul';
            const imgUrl =
              row.image_url ||
              'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80';

            let parsedParams: Record<string, any> = {};
            if (row.parameters) {
              if (typeof row.parameters === 'object') {
                parsedParams = row.parameters;
              } else if (typeof row.parameters === 'string') {
                try {
                  parsedParams = JSON.parse(row.parameters);
                } catch {
                  parsedParams = {};
                }
              }
            }

            return {
              id: String(row.id),
              name: row.title || 'Məhsul',
              title: row.title || 'Məhsul',
              category: row.category_id || 'all',
              category_id: row.category_id || null,
              subcategory: row.category_id || 'all',
              subcategoryLabel: subLabel,
              image: imgUrl,
              image_url: row.image_url || imgUrl,
              description: row.description || '',
              fullDetails: row.description || '',
              price: prodPrice,
              oldPrice: row.old_price || undefined,
              discountPercent: row.discount_percentage || (prodPrice === 0 ? 100 : undefined),
              rating: typeof row.rating === 'number' ? row.rating : 5.0,
              reviewsCount: row.reviews_count || 0,
              likesCount: likedIds.includes(String(row.id)) ? 1 : 0,
              isLiked: likedIds.includes(String(row.id)),
              inStock: true,
              reviews: [],
              specs: parsedParams,
              parameters: parsedParams,
              isDiscounted: Boolean((row.discount_percentage && row.discount_percentage > 0) || prodPrice === 0),
              secret_content: row.secret_content || null,
            };
          });

          setProducts(mapped);
        }
      } catch (err) {
        console.warn('Error fetching store data from Supabase:', err);
      }
    }

    fetchStoreData();

    // Subscribe to realtime updates for products and categories
    const channel = supabase
      .channel('public:store_realtime_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchStoreData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          fetchStoreData();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Cart State (cached in localStorage)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('lumora_store_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Notifications State
  const [notifications, setNotifications] = useState<StoreNotification[]>(INITIAL_NOTIFICATIONS);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Modals state
  const [selectedProductForModal, setSelectedProductForModal] = useState<StoreProduct | null>(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    try {
      localStorage.setItem('lumora_store_cart', JSON.stringify(items));
    } catch (e) {
      console.warn('Cart storage error:', e);
    }
  };

  // Add to Cart
  const handleAddToCart = (product: StoreProduct, quantity = 1, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const existingIndex = cartItems.findIndex((item) => item.product.id === product.id);
    let updated: CartItem[];

    if (existingIndex >= 0) {
      updated = cartItems.map((item, idx) =>
        idx === existingIndex
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      updated = [...cartItems, { product, quantity }];
    }

    saveCart(updated);
    showToast(`"${product.name}" səbətə əlavə edildi!`);
  };

  // Update Cart item quantity
  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    const updated = cartItems
      .map((item) => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[];

    saveCart(updated);
  };

  // Remove single item from cart
  const handleRemoveCartItem = (productId: string) => {
    const updated = cartItems.filter((i) => i.product.id !== productId);
    saveCart(updated);
    showToast('Məhsul səbətdən silindi.');
  };

  // Clear entire cart
  const handleClearCart = () => {
    saveCart([]);
  };

  // Toggle Like / Favorite (ürək qoyduqda bəyənilənlərə əlavə olunur)
  const handleToggleLike = (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    setProducts((prev) => {
      const updated = prev.map((prod) => {
        if (prod.id === productId) {
          const isLiked = !prod.isLiked;
          const likesCount = isLiked ? prod.likesCount + 1 : Math.max(0, prod.likesCount - 1);
          if (isLiked) {
            showToast(`"${prod.name}" seçilmişlərə əlavə olundu!`);
          } else {
            showToast(`"${prod.name}" seçilmişlərdən silindi.`);
          }
          return { ...prod, isLiked, likesCount };
        }
        return prod;
      });

      try {
        const likedIds = updated.filter((p) => p.isLiked).map((p) => p.id);
        localStorage.setItem('lumora_product_likes', JSON.stringify(likedIds));
      } catch (err) {
        console.warn('Could not save liked products:', err);
      }

      return updated;
    });

    setSelectedProductForModal((prev) => {
      if (prev && prev.id === productId) {
        const isLiked = !prev.isLiked;
        const likesCount = isLiked ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1);
        return { ...prev, isLiked, likesCount };
      }
      return prev;
    });
  };

  // Add Review
  const handleAddReview = (
    productId: string,
    reviewData: Omit<ProductReview, 'id' | 'date'>
  ) => {
    const newRev: ProductReview = {
      id: `rev_${Date.now()}`,
      ...reviewData,
      date: new Date().toLocaleDateString('az-AZ', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    };

    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id === productId) {
          const updatedReviews = [newRev, ...(prod.reviews || [])];
          const newCount = prod.reviewsCount + 1;
          const avgRating =
            updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
          return {
            ...prod,
            reviews: updatedReviews,
            reviewsCount: newCount,
            rating: Number(avgRating.toFixed(1)),
          };
        }
        return prod;
      })
    );

    setSelectedProductForModal((prev) => {
      if (prev && prev.id === productId) {
        const updatedReviews = [newRev, ...(prev.reviews || [])];
        const newCount = prev.reviewsCount + 1;
        const avgRating =
          updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
        return {
          ...prev,
          reviews: updatedReviews,
          reviewsCount: newCount,
          rating: Number(avgRating.toFixed(1)),
        };
      }
      return prev;
    });
  };

  // Mark notifications as read
  const handleMarkNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // Favorites list
  const favoriteProducts = useMemo(() => {
    return products.filter((p) => p.isLiked);
  }, [products]);

  // Total cart items count
  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Top-level categories: categories where !parent_id
  const topLevelCategories: DbCategory[] = useMemo(() => {
    if (categories.length === 0) {
      return STORE_CATEGORIES.map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.id,
        parent_id: null,
      }));
    }
    const top = categories.filter((c) => !c.parent_id);
    return top.length > 0 ? top : categories;
  }, [categories]);

  // Subcategories for the currently selected category
  const availableSubcategories = useMemo(() => {
    if (categories.length > 0) {
      const children = categories.filter((c) => c.parent_id === selectedCategory);
      if (children.length > 0) {
        return children.map((c) => ({ id: c.id, name: c.name }));
      }
    }
    const fallbackDef = STORE_CATEGORIES.find((c) => c.id === selectedCategory);
    return fallbackDef?.subcategories || [];
  }, [categories, selectedCategory]);

  const renderCategoryIcon = (iconOrId?: string | null) => {
    if (!iconOrId) return <Layers size={16} />;
    if (iconOrId.startsWith('http') || iconOrId.startsWith('data:')) {
      return (
        <img
          src={iconOrId}
          alt=""
          className="w-4 h-4 rounded object-cover inline-block shrink-0"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      );
    }
    const str = iconOrId.toLowerCase();
    if (str.includes('mobil') || str.includes('phone') || str.includes('smart'))
      return <Smartphone size={16} />;
    if (str.includes('desktop') || str.includes('monitor') || str.includes('komp'))
      return <Monitor size={16} />;
    if (str.includes('idman') || str.includes('sport') || str.includes('activity'))
      return <Activity size={16} />;
    if (str.includes('tibb') || str.includes('med') || str.includes('heart') || str.includes('pulse'))
      return <HeartPulse size={16} />;
    if (str.includes('sparkle')) return <Sparkles size={16} />;
    if (str.includes('folder')) return <Folder size={16} />;
    if (str.includes('box')) return <Box size={16} />;
    if (str.includes('tag')) return <Tag size={16} />;
    if (iconOrId.length <= 4 && !/^[a-zA-Z]+$/.test(iconOrId)) {
      return <span className="text-sm">{iconOrId}</span>;
    }
    return <Layers size={16} />;
  };

  // Filtered Products for Home (Supabase bazasından çəkilən məhsullar)
  const homeProducts = useMemo(() => {
    let list = products;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => {
        const titleStr = (p.title || p.name || '').toLowerCase();
        const descStr = (p.description || '').toLowerCase();
        const subLabelStr = (p.subcategoryLabel || '').toLowerCase();
        return titleStr.includes(q) || descStr.includes(q) || subLabelStr.includes(q);
      });
    }
    return list;
  }, [products, searchQuery]);

  // Filtered Products for Catalog (Kvadrat formada yan-yana 3 dənə aşağı sonsuz)
  const catalogProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        !selectedCategory ||
        selectedCategory === 'all' ||
        p.category_id === selectedCategory ||
        p.category === selectedCategory;

      const matchSubcategory =
        !selectedSubcategory ||
        selectedSubcategory === 'all' ||
        p.category_id === selectedSubcategory ||
        p.subcategory === selectedSubcategory;

      if (!searchQuery.trim()) return matchCategory && matchSubcategory;
      const q = searchQuery.toLowerCase();
      const titleStr = (p.title || p.name || '').toLowerCase();
      const descStr = (p.description || '').toLowerCase();
      const subLabelStr = (p.subcategoryLabel || '').toLowerCase();
      return (
        matchCategory &&
        matchSubcategory &&
        (titleStr.includes(q) || descStr.includes(q) || subLabelStr.includes(q))
      );
    });
  }, [products, selectedCategory, selectedSubcategory, searchQuery]);

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-between pb-28 pt-2 sm:pt-4 transition-colors duration-300 relative ${
        isDark ? 'text-white' : 'text-gray-900'
      }`}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 z-50 px-4 py-2.5 rounded-full border shadow-xl text-xs font-semibold backdrop-blur-xl flex items-center gap-2 ${
              isDark
                ? 'bg-[#1e2029]/95 border-white/20 text-white'
                : 'bg-white/95 border-gray-300 text-gray-950 shadow-lg'
            }`}
          >
            <Check size={14} className="text-cyan-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* TOP HEADER - SƏHİFƏYƏ UYĞUN DƏQİQ DÜZƏLİŞ                  */}
      {/* 1. Ev səhifəsi: Balans olmayacaq, sadəcə bildiriş         */}
      {/* 2. Kataloq: Balans olmayacaq, sadəcə seçilmişlər          */}
      {/* 3. Səbət: Balans və artır olacaq                          */}
      {/* ========================================================= */}
      <header className="w-full max-w-4xl px-3 sm:px-6 space-y-3">
        <div className="flex items-center justify-between">
          {/* Geri düyməsi */}
          <button
            type="button"
            onClick={onBackToHome}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md transition-all cursor-pointer ${
              isDark
                ? 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft size={14} />
            <span>Ana Səhifə</span>
          </button>

          {/* SAĞ DÜYMƏLƏR - TAB-A UYĞUN: */}

          {/* 1. EV SƏHİFƏSİ: BALANS OLMAYACAQ, SADƏCƏ BİLDİRİŞ */}
          {activeTab === 'home' && (
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(true)}
              className={`relative p-2 rounded-full border text-xs backdrop-blur-md transition-all cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/15 text-white/80 hover:text-white'
                  : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700 shadow-sm'
              }`}
              aria-label="Mağaza Bildirişləri"
            >
              <Bell size={17} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-md animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {/* 2. KATALOQ SƏHİFƏSİ: BALANS OLMAYACAQ, SADƏCƏ SEÇİLMİŞLƏR DÜYMƏSİ */}
          {activeTab === 'catalog' && (
            <button
              type="button"
              onClick={() => setIsFavoritesModalOpen(true)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold backdrop-blur-md transition-all cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/15 text-white/90'
                  : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-800 shadow-sm'
              }`}
              aria-label="Seçilmişlər"
            >
              <Heart size={15} className={favoriteProducts.length > 0 ? 'fill-rose-500 text-rose-500' : 'text-rose-400'} />
              <span>Seçilmişlər</span>
              {favoriteProducts.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                  {favoriteProducts.length}
                </span>
              )}
            </button>
          )}

          {/* 3. SƏBƏT SƏHİFƏSİ: YUXARIDA BALANS HİSSƏSİ VƏ ARTIR DÜYMƏSİ */}
          {activeTab === 'cart' && (
            <button
              type="button"
              onClick={() => setIsTopUpOpen(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold backdrop-blur-md transition-all cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/15 text-white'
                  : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-900 shadow-sm'
              }`}
              title="Balansı artır"
            >
              <Wallet size={14} className="text-cyan-400" />
              <span>{currentUser.balance.toFixed(2)} ₼</span>
              <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 text-[10px] font-black flex items-center gap-0.5">
                <Plus size={10} /> Artır
              </span>
            </button>
          )}

          {/* 4. KİTABXANAM SƏHİFƏSİ: RƏQƏMSAL KİTABXANA NİŞANI */}
          {activeTab === 'library' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md bg-cyan-500/10 border-cyan-500/25 text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Rəqəmsal Giriş</span>
            </div>
          )}
        </div>

        {/* ======================================================= */}
        {/* AXTARIŞ PANELİ: EV VƏ KATALOQDA VAR, SƏBƏTDƏ YOXDUR      */}
        {/* Axtarış ikonu qara rəngdə təmin edildi                  */}
        {/* ======================================================= */}
        {(activeTab === 'home' || activeTab === 'catalog') && (
          <div className="relative w-full">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-black z-10">
              <Search size={18} strokeWidth={2.5} className="text-black" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Məhsul adı və ya təyinatı üzrə axtarış..."
              className={`w-full pl-11 pr-10 py-3 rounded-2xl text-xs sm:text-sm font-medium border backdrop-blur-md transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                isDark
                  ? 'bg-white/5 border-white/15 text-white placeholder-white/40'
                  : 'bg-white border-gray-300 text-gray-950 placeholder-gray-400 shadow-sm'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white cursor-pointer z-10"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* MAIN VIEW CONTENT (Ev / Kataloq / Səbət)                  */}
      {/* ========================================================= */}
      <main className="w-full max-w-4xl px-3 sm:px-6 pt-3 flex-1 flex flex-col">
        {/* ======================================================= */}
        {/* TAB 1: EV (HOME)                                         */}
        {/* ======================================================= */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Reklam Tablosu: 3 saniyədən bir sürüşür, əllə sürüşdükdə 10 saniyə hərəkət etmir */}
            <section className="space-y-2">
              <StoreAdCarousel
                banners={banners}
                onSelectCategory={(cat) => {
                  setSelectedCategory(cat);
                  setSelectedSubcategory('all');
                  setActiveTab('catalog');
                }}
              />
            </section>

            {/* Kateqoriya qısayol düymələri */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {topLevelCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedSubcategory('all');
                    setActiveTab('catalog');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                      : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-900 shadow-sm'
                  }`}
                >
                  <span className="text-cyan-400">
                    {renderCategoryIcon(cat.icon || cat.name || cat.id)}
                  </span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Endirimli / Seçilmiş Məhsullar: Blok formasında yan-yana iki dənə */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-rose-500/20 text-rose-500">
                  <Flame size={16} />
                </span>
                <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
                  Endirimli Məhsullar
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500">
                  Xüsusi Təkliflər
                </span>
              </div>

              {/* Blok formasında yan-yana 2 dənə məhsul qridi */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {homeProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    mode="discount"
                    onSelect={(p) => setSelectedProductForModal(p)}
                    onAddToCart={(p, e) => handleAddToCart(p, 1, e)}
                    onToggleLike={(id, e) => handleToggleLike(id, e)}
                  />
                ))}
              </div>

              {homeProducts.length === 0 && (
                <div className="py-8 text-center text-xs opacity-60">
                  Axtarışınıza uyğun endirimli məhsul tapılmadı.
                </div>
              )}
            </section>
          </div>
        )}

        {/* ======================================================= */}
        {/* TAB 2: KATALOQ                                           */}
        {/* ======================================================= */}
        {activeTab === 'catalog' && (
          <div className="space-y-4">
            {/* Əsas Kateqoriyalar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {topLevelCategories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory((prev) => (prev === cat.id ? 'all' : cat.id));
                      setSelectedSubcategory('all');
                    }}
                    className={`p-2.5 sm:p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer select-none ${
                      isSelected
                        ? isDark
                          ? 'bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                          : 'bg-cyan-50 border-cyan-500 text-cyan-900 shadow-md'
                        : isDark
                        ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className={isSelected ? 'text-cyan-400' : 'opacity-70'}>
                      {renderCategoryIcon(cat.icon || cat.name || cat.id)}
                    </span>
                    <span className="text-[11px] sm:text-xs font-black truncate max-w-full">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Alt Kataloqlar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedSubcategory('all')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedSubcategory === 'all'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : isDark
                    ? 'bg-white/10 text-white/70 hover:bg-white/15'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Hamısı
              </button>

              {availableSubcategories.map((sub) => {
                const isSubSelected = selectedSubcategory === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubcategory(sub.id)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isSubSelected
                        ? 'bg-cyan-500 text-white shadow-sm'
                        : isDark
                        ? 'bg-white/10 text-white/70 hover:bg-white/15'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {sub.name}
                  </button>
                );
              })}
            </div>

            {/* KATALOQDA KVADRAT FORMADA YAN-YANA 3 DƏNƏ AŞAĞI SONSUZ */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3.5 pt-1">
              {catalogProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  mode="catalog"
                  onSelect={(p) => setSelectedProductForModal(p)}
                  onAddToCart={(p, e) => handleAddToCart(p, 1, e)}
                  onToggleLike={(id, e) => handleToggleLike(id, e)}
                />
              ))}
            </div>

            {catalogProducts.length === 0 && (
              <div className="py-12 text-center text-xs opacity-60">
                Bu alt kataloqda hələlik məhsul yoxdur.
              </div>
            )}
          </div>
        )}

        {/* ======================================================= */}
        {/* TAB 3: SƏBƏT (SƏBƏT YERİNDƏ QALIR)                      */}
        {/* Axtarış paneli yoxdur, balans artırmaq və alış var      */}
        {/* ======================================================= */}
        {activeTab === 'cart' && (
          <CartView
            items={cartItems}
            currentUser={currentUser}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onOpenProduct={(p) => setSelectedProductForModal(p)}
            onGoToCatalog={() => setActiveTab('catalog')}
            onUpdateProfile={onUpdateProfile}
            onOpenTopUp={() => setIsTopUpOpen(true)}
          />
        )}

        {/* ======================================================= */}
        {/* TAB 4: KİTABXANAM                                        */}
        {/* Supabase user_library & products gizli məzmun səhifəsi  */}
        {/* ======================================================= */}
        {activeTab === 'library' && (
          <LibraryView
            currentUser={currentUser}
            onGoToCatalog={() => setActiveTab('catalog')}
          />
        )}
      </main>

      {/* ========================================================= */}
      {/* STORE BOTTOM NAVIGATION BAR                               */}
      {/* 4 tabs: Ev, Kataloq, Səbət, Kitabxanam                    */}
      {/* ========================================================= */}
      <StoreBottomBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cartCount={totalCartCount}
      />

      {/* ========================================================= */}
      {/* MODALS                                                    */}
      {/* ========================================================= */}
      {/* 1. Məhsul Ətraflı & Yorumlar Modalı */}
      <ProductDetailModal
        isOpen={Boolean(selectedProductForModal)}
        product={selectedProductForModal}
        onClose={() => setSelectedProductForModal(null)}
        onAddToCart={(p, q) => handleAddToCart(p, q)}
        onToggleLike={(id) => handleToggleLike(id)}
        onAddReview={handleAddReview}
      />

      {/* 2. Mağaza Bildirişləri Modalı */}
      <StoreNotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkNotificationsAsRead}
      />

      {/* 3. Balansı Artır Modalı */}
      <BalanceTopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        currentUser={currentUser}
        onUpdateProfile={onUpdateProfile}
        onSuccess={(amt) => {
          showToast(`Balansınız ${amt.toFixed(2)} AZN artırıldı!`);
        }}
      />

      {/* 4. Kataloq üçün Seçilmişlər Modalı */}
      <FavoritesModal
        isOpen={isFavoritesModalOpen}
        onClose={() => setIsFavoritesModalOpen(false)}
        favorites={favoriteProducts}
        onOpenProduct={(p) => setSelectedProductForModal(p)}
        onAddToCart={(p, e) => handleAddToCart(p, 1, e)}
        onRemoveFavorite={(id) => handleToggleLike(id)}
      />
    </div>
  );
};
