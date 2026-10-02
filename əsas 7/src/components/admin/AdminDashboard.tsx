import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  Package,
  ShoppingCart,
  Plus,
  Trash2,
  RefreshCw,
  ArrowLeft,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  DollarSign,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  Box,
  Layers,
  Search,
  Folder,
  Tag,
  Sliders,
  KeyRound,
  Pencil,
  Upload,
  X,
  BookOpen,
  Users,
  User,
  Heart,
  MessageSquare,
  Star,
  Megaphone,
  Ticket,
  Bell,
  Send,
  Infinity as InfinityIcon,
} from 'lucide-react';
import { supabase, uploadChatMediaToSupabase, uploadAssetToSupabase, fetchProductAdsWithItems, deleteProductAd, fetchPromocodesFromDb, deletePromocodeFromDb, togglePromocodeActiveInDb, fetchNotificationsFromDb, deleteNotificationFromDb } from '../../lib/supabase';
import { ImageCropperModal } from '../home/ImageCropperModal';
import { AdEditModal } from './AdEditModal';
import { PromocodeEditModal } from './PromocodeEditModal';
import { NotificationSendModal } from './NotificationSendModal';
import { DbProductAd, DbPromocode, DbNotification } from '../../types';

interface CategoryItem {
  id: string;
  name: string;
  icon?: string | null;
  parent_id?: string | null;
  created_at?: string;
}

interface ProductItem {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  secret_content?: string | null;
  category_id?: string | null;
  parameters?: Record<string, any> | null;
  created_at?: string;
  is_discounted?: boolean;
  discount_price?: number | null;
  old_price?: number | null;
  discount_percentage?: number | null;
}

interface ProfileItem {
  id: string;
  user_code?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  avatar?: string | null;
  balance?: number;
}

interface UserLibraryItem {
  id: string;
  user_id: string;
  product_id: string;
  acquired_at?: string | null;
  created_at?: string | null;
  profile?: ProfileItem | null;
  products?: {
    id: string;
    title: string;
    image_url?: string | null;
    price?: number;
    description?: string | null;
    secret_content?: string | null;
  } | Array<{
    id: string;
    title: string;
    image_url?: string | null;
    price?: number;
    description?: string | null;
    secret_content?: string | null;
  }> | null;
}

interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  added_at?: string | null;
  created_at?: string | null;
  profile?: ProfileItem | null;
  products?: {
    id: string;
    title: string;
    image_url?: string | null;
    price?: number;
    description?: string | null;
  } | Array<{
    id: string;
    title: string;
    image_url?: string | null;
    price?: number;
    description?: string | null;
  }> | null;
}

interface AdminReviewItem {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string;
  created_at?: string | null;
  profile?: ProfileItem | null;
  products?: {
    id: string;
    title: string;
    image_url?: string | null;
    price?: number;
  } | Array<{
    id: string;
    title: string;
    image_url?: string | null;
    price?: number;
  }> | null;
}

const isUuid = (id?: string | null): boolean =>
  Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

export function AdminDashboard() {
  // Authentication & 2FA State
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [isVerifiedAdmin, setIsVerifiedAdmin] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Dashboard Navigation State: 'products' | 'categories' | 'ads' | 'promocodes' | 'notifications' | 'orders' | 'libraries' | 'wishlist' | 'reviews'
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'ads' | 'promocodes' | 'notifications' | 'orders' | 'libraries' | 'wishlist' | 'reviews'>('products');

  // Notifications State (Bildiriş Göndər və Tarixçə)
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationSearchQuery, setNotificationSearchQuery] = useState('');
  const [notificationFilterType, setNotificationFilterType] = useState<'all' | 'broadcast' | 'personal'>('all');
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [deletingNotificationId, setDeletingNotificationId] = useState<string | null>(null);
  const [notificationFeedback, setNotificationFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Promocodes State (Promokodların İdarəedilməsi)
  const [promocodes, setPromocodes] = useState<DbPromocode[]>([]);
  const [loadingPromocodes, setLoadingPromocodes] = useState(false);
  const [promocodeSearchQuery, setPromocodeSearchQuery] = useState('');
  const [promocodeFilterStatus, setPromocodeFilterStatus] = useState<'all' | 'active' | 'inactive' | 'personal' | 'public'>('all');
  const [isPromocodeModalOpen, setIsPromocodeModalOpen] = useState(false);
  const [editingPromocode, setEditingPromocode] = useState<DbPromocode | null>(null);
  const [deletingPromocodeId, setDeletingPromocodeId] = useState<string | null>(null);
  const [promocodeFeedback, setPromocodeFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Ads State (Reklamların İdarəedilməsi)
  const [productAds, setProductAds] = useState<DbProductAd[]>([]);
  const [loadingAds, setLoadingAds] = useState(false);
  const [adSearchQuery, setAdSearchQuery] = useState('');
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<DbProductAd | null>(null);
  const [deletingAdId, setDeletingAdId] = useState<string | null>(null);
  const [adFeedback, setAdFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // User Libraries State
  const [userLibraries, setUserLibraries] = useState<UserLibraryItem[]>([]);
  const [loadingLibraries, setLoadingLibraries] = useState(false);
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  const [libraryActionLoading, setLibraryActionLoading] = useState<string | null>(null);
  const [libraryFeedback, setLibraryFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Wishlist State (İstək Siyahısı - Read Only)
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [wishlistSearchQuery, setWishlistSearchQuery] = useState('');

  // Reviews State (Rəylərin İdarəedilməsi)
  const [adminReviews, setAdminReviews] = useState<AdminReviewItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  // Edit Library Product / Secret Content Modal State
  const [editingLibraryProduct, setEditingLibraryProduct] = useState<{
    libraryId: string;
    productId: string;
    title: string;
    price: number | string;
    description: string;
    imageUrl: string;
    secretContent: string;
    userProfile?: ProfileItem | null;
    userId: string;
  } | null>(null);
  const [savingLibraryProduct, setSavingLibraryProduct] = useState(false);
  const [libraryEditFeedback, setLibraryEditFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Categories State
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('');
  const [categoryParentId, setCategoryParentId] = useState('');
  const [submittingCategory, setSubmittingCategory] = useState(false);
  const [categoryFeedback, setCategoryFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [categoryActionLoading, setCategoryActionLoading] = useState<string | null>(null);

  // Products Management State
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [productActionLoading, setProductActionLoading] = useState<string | null>(null);

  // New Product Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isDiscounted, setIsDiscounted] = useState<boolean>(false);
  const [discountPrice, setDiscountPrice] = useState<string>('');
  const [imageUrl, setImageUrl] = useState('');
  const [secretContent, setSecretContent] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  // Technical Parameters (parameters JSONB)
  const [paramUygunluq, setParamUygunluq] = useState('');
  const [paramFormat, setParamFormat] = useState('');
  const [paramDestek, setParamDestek] = useState('');
  const [customParams, setCustomParams] = useState<Array<{ key: string; value: string }>>([]);

  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Editing state
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Form scroll refs
  const productFormRef = useRef<HTMLDivElement>(null);
  const categoryFormRef = useRef<HTMLDivElement>(null);

  // Image Upload & Crop state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryFileInputRef = useRef<HTMLInputElement>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState('');
  const [cropperTarget, setCropperTarget] = useState<'product' | 'category'>('product');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCategoryIcon, setUploadingCategoryIcon] = useState(false);

  // 1. Fetch current logged-in Supabase user
  useEffect(() => {
    let isMounted = true;

    async function checkCurrentUser() {
      setAuthLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user && isMounted) {
          setUser(session.user);
        } else {
          const {
            data: { user: currentUser },
          } = await supabase.auth.getUser();
          if (isMounted) {
            setUser(currentUser || null);
          }
        }
      } catch (err) {
        console.error('Error fetching Supabase user for admin:', err);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    }

    checkCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        setIsVerifiedAdmin(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 2. Fetch categories, products, user libraries, wishlist, reviews, ads, and promocodes once 2FA verified
  useEffect(() => {
    if (isVerifiedAdmin) {
      loadCategories();
      loadProducts();
      loadUserLibraries();
      loadWishlistItems();
      loadAdminReviews();
      loadProductAds();
      loadPromocodes();
      loadNotifications();
    }
  }, [isVerifiedAdmin]);

  // Load all notifications from Supabase
  const loadNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const data = await fetchNotificationsFromDb();
      setNotifications(data);
    } catch (err) {
      console.warn('Error loading notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Delete notification from Supabase
  const handleDeleteNotification = async (id: string, titleText: string) => {
    if (!window.confirm(`"${titleText}" bildirişini silmək istədiyinizdən əminsiniz?`)) return;
    setDeletingNotificationId(id);
    try {
      const res = await deleteNotificationFromDb(id);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setNotificationFeedback({ type: 'success', message: 'Bildiriş uğurla silindi.' });
      } else {
        setNotificationFeedback({ type: 'error', message: res.error || 'Bildiriş silinərkən xəta baş verdi.' });
      }
    } catch (err: any) {
      setNotificationFeedback({ type: 'error', message: err?.message || 'Xəta baş verdi.' });
    } finally {
      setDeletingNotificationId(null);
      setTimeout(() => setNotificationFeedback(null), 4000);
    }
  };

  // Load all promocodes from Supabase
  const loadPromocodes = async () => {
    setLoadingPromocodes(true);
    try {
      const data = await fetchPromocodesFromDb();
      setPromocodes(data as DbPromocode[]);
    } catch (err) {
      console.warn('Error loading promocodes:', err);
    } finally {
      setLoadingPromocodes(false);
    }
  };

  // Delete promocode
  const handleDeletePromocode = async (id: string, codeName: string) => {
    if (!window.confirm(`"${codeName}" promokodunu silmək istədiyinizdən əminsiniz?`)) return;
    setDeletingPromocodeId(id);
    try {
      const res = await deletePromocodeFromDb(id);
      if (res.success) {
        setPromocodes((prev) => prev.filter((p) => p.id !== id));
        setPromocodeFeedback({ type: 'success', message: 'Promokod uğurla silindi.' });
      } else {
        setPromocodeFeedback({ type: 'error', message: res.error || 'Promokod silinərkən xəta baş verdi.' });
      }
    } catch (err: any) {
      setPromocodeFeedback({ type: 'error', message: err?.message || 'Xəta baş verdi.' });
    } finally {
      setDeletingPromocodeId(null);
      setTimeout(() => setPromocodeFeedback(null), 4000);
    }
  };

  // Toggle promocode active status
  const handleTogglePromocodeStatus = async (id: string, newStatus: boolean) => {
    try {
      const success = await togglePromocodeActiveInDb(id, newStatus);
      if (success) {
        setPromocodes((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_active: newStatus } : p))
        );
        setPromocodeFeedback({
          type: 'success',
          message: newStatus ? 'Promokod aktivləşdirildi.' : 'Promokod donduruldu (deaktiv edildi).',
        });
        setTimeout(() => setPromocodeFeedback(null), 3000);
      }
    } catch (err) {
      console.warn('Toggle status error:', err);
    }
  };

  // Load all product ads joined with items and products from Supabase
  const loadProductAds = async () => {
    setLoadingAds(true);
    try {
      const data = await fetchProductAdsWithItems();
      setProductAds(data as DbProductAd[]);
    } catch (err) {
      console.warn('Error loading product ads:', err);
    } finally {
      setLoadingAds(false);
    }
  };

  // Delete product ad
  const handleDeleteAd = async (adId: string) => {
    if (!window.confirm('Bu reklamı silmək istədiyinizdən əminsiniz?')) return;
    setDeletingAdId(adId);
    try {
      const res = await deleteProductAd(adId);
      if (res.success) {
        setProductAds((prev) => prev.filter((a) => a.id !== adId));
        setAdFeedback({ type: 'success', message: 'Reklam uğurla silindi.' });
      } else {
        setAdFeedback({ type: 'error', message: res.error || 'Reklam silinərkən xəta baş verdi.' });
      }
    } catch (err: any) {
      setAdFeedback({ type: 'error', message: err?.message || 'Xəta baş verdi.' });
    } finally {
      setDeletingAdId(null);
      setTimeout(() => setAdFeedback(null), 4000);
    }
  };

  // Load all reviews joined with products and profiles from Supabase
  const loadAdminReviews = async () => {
    setLoadingReviews(true);
    try {
      const [revRes, profRes] = await Promise.all([
        supabase
          .from('reviews')
          .select('*, products(*)')
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('*'),
      ]);

      if (revRes.error) {
        console.error('Error fetching admin reviews:', revRes.error);
        setAdminReviews([]);
        return;
      }

      const profilesMap = new Map<string, ProfileItem>();
      if (profRes.data) {
        profRes.data.forEach((p: ProfileItem) => {
          if (p.id) profilesMap.set(p.id, p);
        });
      }

      const enriched: AdminReviewItem[] = (revRes.data || []).map((row: any) => ({
        ...row,
        profile: profilesMap.get(row.user_id) || null,
      }));

      setAdminReviews(enriched);
    } catch (err) {
      console.error('Unexpected error loading reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Delete review permanently from Supabase reviews table
  const handleDeleteReview = async (reviewId: string) => {
    const confirmed = window.confirm('Bu rəyi silmək istədiyinizə əminsiniz?');
    if (!confirmed) return;

    setDeletingReviewId(reviewId);
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
      if (error) {
        alert(`Xəta: ${error.message}`);
      } else {
        setAdminReviews((prev) => prev.filter((r) => r.id !== reviewId));
      }
    } catch (err: any) {
      console.error('Error deleting review:', err);
      alert(`Xəta: ${err.message || err}`);
    } finally {
      setDeletingReviewId(null);
    }
  };

  // Load all wishlist items joined with products and profiles from Supabase
  const loadWishlistItems = async () => {
    setLoadingWishlist(true);
    try {
      const [wishRes, profRes] = await Promise.all([
        supabase
          .from('wishlist')
          .select('*, products(*)')
          .order('added_at', { ascending: false }),
        supabase.from('profiles').select('*'),
      ]);

      if (wishRes.error) {
        console.error('Error fetching wishlist:', wishRes.error);
        setWishlistItems([]);
        return;
      }

      const profilesMap = new Map<string, ProfileItem>();
      if (profRes.data) {
        profRes.data.forEach((p: ProfileItem) => {
          if (p.id) profilesMap.set(p.id, p);
        });
      }

      const enriched: WishlistItem[] = (wishRes.data || []).map((row: any) => ({
        ...row,
        profile: profilesMap.get(row.user_id) || null,
      }));

      setWishlistItems(enriched);
    } catch (err) {
      console.error('Unexpected error loading wishlist & profiles:', err);
    } finally {
      setLoadingWishlist(false);
    }
  };

  // Load all categories from Supabase
  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching categories:', error);
      } else {
        setCategories(data || []);
      }
    } catch (err) {
      console.error('Unexpected error loading categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Load all products from Supabase
  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts(data || []);
      }
    } catch (err) {
      console.error('Unexpected error loading products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Load all user_library items joined with products and profiles from Supabase
  const loadUserLibraries = async () => {
    setLoadingLibraries(true);
    try {
      const [libRes, profRes] = await Promise.all([
        supabase
          .from('user_library')
          .select('*, products(*)')
          .order('acquired_at', { ascending: false }),
        supabase.from('profiles').select('*'),
      ]);

      if (libRes.error) {
        console.error('Error fetching user_library:', libRes.error);
        setUserLibraries([]);
        return;
      }

      const profilesMap = new Map<string, ProfileItem>();
      if (profRes.data) {
        profRes.data.forEach((p: ProfileItem) => {
          if (p.id) profilesMap.set(p.id, p);
        });
      }

      const enriched: UserLibraryItem[] = (libRes.data || []).map((row: any) => ({
        ...row,
        profile: profilesMap.get(row.user_id) || null,
      }));

      setUserLibraries(enriched);
    } catch (err) {
      console.error('Unexpected error loading user_library & profiles:', err);
    } finally {
      setLoadingLibraries(false);
    }
  };

  // Open Edit Product & Secret Content Modal
  const handleStartEditLibraryProduct = (item: UserLibraryItem) => {
    const prod = Array.isArray(item.products) ? item.products[0] : item.products;
    if (!prod) {
      alert('Bu qeydə aid məhsul tapılmadı.');
      return;
    }
    setEditingLibraryProduct({
      libraryId: item.id,
      productId: prod.id || item.product_id,
      title: prod.title || '',
      price: prod.price ?? 0,
      description: prod.description || '',
      imageUrl: prod.image_url || '',
      secretContent: prod.secret_content || '',
      userProfile: item.profile || null,
      userId: item.user_id,
    });
    setLibraryEditFeedback(null);
  };

  // Save (UPDATE) Product & Secret Content to Supabase products table
  const handleSaveLibraryProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLibraryProduct) return;

    setSavingLibraryProduct(true);
    setLibraryEditFeedback(null);

    try {
      const updatePayload: Record<string, any> = {
        title: editingLibraryProduct.title.trim(),
        price: Number(editingLibraryProduct.price) || 0,
        description: editingLibraryProduct.description.trim() || null,
        image_url: editingLibraryProduct.imageUrl.trim() || null,
        secret_content: editingLibraryProduct.secretContent.trim() || null,
      };

      const { error } = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', editingLibraryProduct.productId);

      if (error) {
        throw error;
      }

      // Update in userLibraries state immediately
      setUserLibraries((prev) =>
        prev.map((lib): UserLibraryItem => {
          if (lib.product_id === editingLibraryProduct.productId) {
            const currentProd = Array.isArray(lib.products) ? lib.products[0] : lib.products;
            const updatedProd = {
              id: editingLibraryProduct.productId,
              title: editingLibraryProduct.title.trim() || currentProd?.title || 'Məhsul',
              price: Number(editingLibraryProduct.price) || 0,
              description: editingLibraryProduct.description.trim() || null,
              image_url: editingLibraryProduct.imageUrl.trim() || null,
              secret_content: editingLibraryProduct.secretContent.trim() || null,
            };
            return {
              ...lib,
              products: updatedProd,
            };
          }
          return lib;
        })
      );

      // Also update in products state if loaded
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingLibraryProduct.productId
            ? { ...p, ...updatePayload }
            : p
        )
      );

      setLibraryFeedback({
        type: 'success',
        message: `"${editingLibraryProduct.title}" məhsulu və gizli məzmunu uğurla yeniləndi!`,
      });
      setTimeout(() => setLibraryFeedback(null), 3500);

      setEditingLibraryProduct(null);
    } catch (err: any) {
      console.error('Error updating product in Supabase:', err);
      setLibraryEditFeedback({
        type: 'error',
        message: err.message || 'Məhsulu yeniləmək mümkün olmadı.',
      });
    } finally {
      setSavingLibraryProduct(false);
    }
  };

  // Handle Delete from user_library
  const handleDeleteUserLibrary = async (rowId: string, productTitle?: string) => {
    const confirmMsg = productTitle
      ? `"${productTitle}" məhsulunu bu istifadəçinin kitabxanasından silmək istədiyinizdən əminsiniz?`
      : 'Bu məhsulu istifadəçinin kitabxanasından silmək istədiyinizdən əminsiniz?';

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setLibraryActionLoading(rowId);
    try {
      const { error } = await supabase.from('user_library').delete().eq('id', rowId);

      if (error) {
        alert(`Silinmədi: ${error.message}`);
        setLibraryFeedback({ type: 'error', message: `Xəta: ${error.message}` });
      } else {
        setUserLibraries((prev) => prev.filter((item) => item.id !== rowId));
        setLibraryFeedback({
          type: 'success',
          message: 'Məhsul istifadəçinin kitabxanasından uğurla silindi.',
        });
        setTimeout(() => setLibraryFeedback(null), 3500);
      }
    } catch (err: any) {
      console.error('Error deleting from user_library:', err);
      alert(`Xəta: ${err.message}`);
    } finally {
      setLibraryActionLoading(null);
    }
  };

  const handleRefreshAll = () => {
    loadCategories();
    loadProducts();
    loadUserLibraries();
    loadWishlistItems();
    loadAdminReviews();
  };

  // 3. Handle 2FA Verification
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) {
      setVerifyError('No authenticated user session found.');
      return;
    }

    const trimmedKey = secretKeyInput.trim();
    if (!trimmedKey) {
      setVerifyError('Please enter the Admin Secret Key.');
      return;
    }

    setVerifying(true);
    setVerifyError(null);

    try {
      const { data, error } = await supabase
        .from('store_admins')
        .select('secret_key')
        .eq('email', user.email)
        .single();

      if (error || !data) {
        setVerifyError('Invalid Key or Access Denied');
        setIsVerifiedAdmin(false);
        return;
      }

      if (data.secret_key === trimmedKey) {
        setIsVerifiedAdmin(true);
        setVerifyError(null);
      } else {
        setVerifyError('Invalid Key or Access Denied');
        setIsVerifiedAdmin(false);
      }
    } catch (err: any) {
      console.error('Admin 2FA verification error:', err);
      setVerifyError('Invalid Key or Access Denied');
      setIsVerifiedAdmin(false);
    } finally {
      setVerifying(false);
    }
  };

  // Helper to convert base64 data url to Blob
  const dataURLtoBlob = (dataurl: string): Blob => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImageToCrop(result);
        setCropperTarget('product');
        setIsCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCategoryIconFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImageToCrop(result);
        setCropperTarget('category');
        setIsCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = async (croppedDataUrl: string) => {
    setIsCropperOpen(false);
    const blob = dataURLtoBlob(croppedDataUrl);

    if (cropperTarget === 'category') {
      setUploadingCategoryIcon(true);
      try {
        const uploadedUrl = await uploadAssetToSupabase(
          blob,
          'assets',
          `cat_icon_${Date.now()}.jpg`
        );
        setCategoryIcon(uploadedUrl);
      } catch (err) {
        console.warn('Storage upload note for category icon:', err);
        setCategoryIcon(croppedDataUrl);
      } finally {
        setUploadingCategoryIcon(false);
      }
    } else {
      setUploadingImage(true);
      try {
        const uploadedUrl = await uploadAssetToSupabase(
          blob,
          'assets',
          `product_${Date.now()}.jpg`
        );
        setImageUrl(uploadedUrl);
      } catch (err) {
        console.warn('Storage upload note for product:', err);
        setImageUrl(croppedDataUrl);
      } finally {
        setUploadingImage(false);
      }
    }
  };

  // 4. Handle Category Edit & Save
  const handleStartEditCategory = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setCategoryName(cat.name || '');
    setCategoryIcon(cat.icon || '');
    setCategoryParentId(cat.parent_id || '');
    setCategoryFeedback(null);
    categoryFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryIcon('');
    setCategoryParentId('');
    setCategoryFeedback(null);
    if (categoryFileInputRef.current) {
      categoryFileInputRef.current.value = '';
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryFeedback(null);

    if (!categoryName.trim()) {
      setCategoryFeedback({ type: 'error', message: 'Kateqoriya adı mütləqdir.' });
      return;
    }

    setSubmittingCategory(true);
    try {
      const payload: Record<string, any> = {
        name: categoryName.trim(),
        icon: categoryIcon.trim() || null,
        parent_id: isUuid(categoryParentId) ? categoryParentId : null,
      };

      if (editingCategory) {
        // UPDATE existing category in Supabase
        const { data, error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editingCategory.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        setCategoryFeedback({ type: 'success', message: 'Kateqoriya uğurla yeniləndi!' });
        handleCancelEditCategory();

        if (data) {
          setCategories((prev) => prev.map((c) => (c.id === editingCategory.id ? data : c)));
        } else {
          loadCategories();
        }
      } else {
        // INSERT new category
        const { data, error } = await supabase
          .from('categories')
          .insert(payload)
          .select()
          .single();

        if (error) {
          throw error;
        }

        setCategoryFeedback({ type: 'success', message: 'Kateqoriya uğurla əlavə edildi!' });
        handleCancelEditCategory();

        if (data) {
          setCategories((prev) => [data, ...prev]);
        } else {
          loadCategories();
        }
      }

      setTimeout(() => {
        setCategoryFeedback(null);
      }, 4000);
    } catch (err: any) {
      console.error('Error saving category:', err);
      setCategoryFeedback({
        type: 'error',
        message: err.message || 'Kateqoriyanı yadda saxlamaq mümkün olmadı.',
      });
    } finally {
      setSubmittingCategory(false);
    }
  };

  // Handle Delete Category
  const handleDeleteCategory = async (catId: string) => {
    if (!window.confirm('Bu kateqoriyanı silmək istədiyinizdən əminsiniz?')) {
      return;
    }

    setCategoryActionLoading(catId);
    try {
      const { error } = await supabase.from('categories').delete().eq('id', catId);
      if (error) {
        alert(`Kateqoriya silinmədi: ${error.message}`);
      } else {
        setCategories((prev) => prev.filter((c) => c.id !== catId));
        if (editingCategory?.id === catId) {
          handleCancelEditCategory();
        }
      }
    } catch (err: any) {
      console.error('Error deleting category:', err);
      alert(`Xəta: ${err.message}`);
    } finally {
      setCategoryActionLoading(null);
    }
  };

  // 5. Handle Product Edit & Save
  const handleStartEditProduct = (prod: ProductItem) => {
    setEditingProduct(prod);
    setTitle(prod.title || '');
    setDescription(prod.description || '');
    setPrice(prod.price !== undefined ? String(prod.price) : '');
    setIsDiscounted(Boolean(prod.is_discounted));
    setDiscountPrice(
      prod.discount_price !== undefined && prod.discount_price !== null
        ? String(prod.discount_price)
        : ''
    );
    setImageUrl(prod.image_url || '');
    setSecretContent(prod.secret_content || '');
    setSelectedCategoryId(prod.category_id || '');

    let params: Record<string, any> = {};
    if (prod.parameters) {
      if (typeof prod.parameters === 'object') params = prod.parameters;
      else if (typeof prod.parameters === 'string') {
        try {
          params = JSON.parse(prod.parameters);
        } catch {
          params = {};
        }
      }
    }

    setParamUygunluq(params['Uyğunluq'] ? String(params['Uyğunluq']) : '');
    setParamFormat(params['Format'] ? String(params['Format']) : '');
    setParamDestek(params['Dəstək'] ? String(params['Dəstək']) : '');

    const customs: Array<{ key: string; value: string }> = [];
    Object.entries(params).forEach(([k, v]) => {
      if (k !== 'Uyğunluq' && k !== 'Format' && k !== 'Dəstək') {
        customs.push({ key: k, value: String(v) });
      }
    });
    setCustomParams(customs);

    setFormFeedback(null);
    productFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCancelEditProduct = () => {
    setEditingProduct(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setIsDiscounted(false);
    setDiscountPrice('');
    setImageUrl('');
    setSecretContent('');
    setSelectedCategoryId('');
    setParamUygunluq('');
    setParamFormat('');
    setParamDestek('');
    setCustomParams([]);
    setFormFeedback(null);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    if (!title.trim()) {
      setFormFeedback({ type: 'error', message: 'Məhsulun adı mütləqdir.' });
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setFormFeedback({ type: 'error', message: 'Zəhmət olmasa düzgün qiymət daxil edin.' });
      return;
    }

    let parsedDiscountPrice: number | null = null;
    if (isDiscounted) {
      if (!discountPrice.trim()) {
        setFormFeedback({ type: 'error', message: 'Zəhmət olmasa endirimli qiyməti daxil edin.' });
        return;
      }
      parsedDiscountPrice = parseFloat(discountPrice);
      if (isNaN(parsedDiscountPrice) || parsedDiscountPrice < 0) {
        setFormFeedback({ type: 'error', message: 'Zəhmət olmasa düzgün endirimli qiymət daxil edin.' });
        return;
      }
    }

    // Collect Technical Parameters into JSONB
    const parametersObj: Record<string, string> = {};
    if (paramUygunluq.trim()) parametersObj['Uyğunluq'] = paramUygunluq.trim();
    if (paramFormat.trim()) parametersObj['Format'] = paramFormat.trim();
    if (paramDestek.trim()) parametersObj['Dəstək'] = paramDestek.trim();

    customParams.forEach((cp) => {
      if (cp.key.trim() && cp.value.trim()) {
        parametersObj[cp.key.trim()] = cp.value.trim();
      }
    });

    setSubmittingProduct(true);
    try {
      const payload: Record<string, any> = {
        title: title.trim(),
        description: description.trim() || null,
        price: parsedPrice,
        image_url: imageUrl.trim() || null,
        secret_content: secretContent.trim() || null,
        category_id: isUuid(selectedCategoryId) ? selectedCategoryId : null,
        parameters: Object.keys(parametersObj).length > 0 ? parametersObj : null,
        is_discounted: isDiscounted,
        discount_price: isDiscounted ? parsedDiscountPrice : null,
        discount_percentage:
          isDiscounted && parsedDiscountPrice !== null && parsedDiscountPrice < parsedPrice
            ? Math.round(((parsedPrice - parsedDiscountPrice) / parsedPrice) * 100)
            : 0,
      };

      if (editingProduct) {
        // UPDATE existing product in Supabase
        const { data, error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        setFormFeedback({ type: 'success', message: 'Məhsul məlumatları uğurla yeniləndi!' });
        handleCancelEditProduct();

        if (data) {
          setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? data : p)));
        } else {
          loadProducts();
        }
      } else {
        // INSERT new product
        const { data, error } = await supabase
          .from('products')
          .insert(payload)
          .select()
          .single();

        if (error) {
          throw error;
        }

        setFormFeedback({ type: 'success', message: 'Məhsul uğurla bazaya əlavə edildi!' });
        handleCancelEditProduct();

        if (data) {
          setProducts((prev) => [data, ...prev]);
        } else {
          loadProducts();
        }
      }

      setTimeout(() => {
        setFormFeedback(null);
      }, 4000);
    } catch (err: any) {
      console.error('Error saving product:', err);
      setFormFeedback({
        type: 'error',
        message: err.message || 'Məhsulu yadda saxlamaq mümkün olmadı.',
      });
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Bu məhsulu silmək istədiyinizdən əminsiniz?')) {
      return;
    }

    setProductActionLoading(productId);
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);

      if (error) {
        alert(`Məhsul silinmədi: ${error.message}`);
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      }
    } catch (err: any) {
      console.error('Error deleting product:', err);
      alert(`Xəta: ${err.message}`);
    } finally {
      setProductActionLoading(null);
    }
  };

  // Helper to add custom technical parameter field
  const handleAddCustomParam = () => {
    setCustomParams((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleUpdateCustomParam = (index: number, field: 'key' | 'value', val: string) => {
    setCustomParams((prev) => {
      const copy = [...prev];
      copy[index][field] = val;
      return copy;
    });
  };

  const handleRemoveCustomParam = (index: number) => {
    setCustomParams((prev) => prev.filter((_, i) => i !== index));
  };

  // Navigation back to client storefront / home
  const handleExitAdmin = () => {
    if (window.history.pushState) {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } else {
      window.location.href = '/';
    }
  };

  // Helper map to find category name by id
  const categoryMap = new Map<string, string>();
  categories.forEach((c) => categoryMap.set(c.id, c.name));

  // =========================================================================
  // VIEW 1: LOADING STATE
  // =========================================================================
  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-[#0a0c10] text-gray-200 flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium tracking-wide text-gray-400">
            Təhlükəsizlik parametrləri yoxlanılır...
          </span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: NOT LOGGED IN SCREEN
  // =========================================================================
  if (!user) {
    return (
      <div className="min-h-screen w-full bg-[#0a0c10] text-gray-100 flex flex-col justify-between p-6">
        <div className="flex items-center justify-between max-w-5xl w-full mx-auto">
          <button
            onClick={handleExitAdmin}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Lumora-ya Qayıt
          </button>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            <Lock size={12} /> Məhdud Giriş
          </div>
        </div>

        <div className="w-full max-w-md mx-auto my-auto p-8 rounded-3xl bg-[#12141a]/95 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-6 text-cyan-400 shadow-inner">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 font-syne tracking-tight">
            Təhlükəsiz Admin Portalı
          </h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Please login to access this page. Bu inzibati səhifəyə daxil olmaq üçün təsdiqlənmiş mağaza admin hesabı tələb olunur.
          </p>
          <button
            onClick={handleExitAdmin}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
          >
            Daxil Olmağa Keç <ChevronRight size={16} />
          </button>
        </div>

        <div className="text-center text-xs text-gray-600 py-4">
          Lumora Secure Store Engine • Strictly Isolated
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: 2FA VERIFICATION SCREEN (DOUBLE LOCK)
  // =========================================================================
  if (!isVerifiedAdmin) {
    return (
      <div className="min-h-screen w-full bg-[#0a0c10] text-gray-100 flex flex-col justify-between p-6">
        <div className="flex items-center justify-between max-w-5xl w-full mx-auto">
          <button
            onClick={handleExitAdmin}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Mağazaya Çıxış
          </button>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <ShieldAlert size={12} /> Double Lock 2FA Tələb Olunur
          </div>
        </div>

        <div className="w-full max-w-md mx-auto my-auto p-8 rounded-3xl bg-[#12141a]/95 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5 text-amber-400">
            <Key size={28} />
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white mb-1.5 font-syne tracking-tight">
              Admin 2FA Təsdiqi
            </h2>
            <p className="text-xs text-gray-400">
              Aktiv istifadəçi: <span className="text-cyan-400 font-mono">{user.email}</span>
            </p>
          </div>

          <form onSubmit={handleVerify2FA} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Admin Secret Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={secretKeyInput}
                  onChange={(e) => {
                    setSecretKeyInput(e.target.value);
                    if (verifyError) setVerifyError(null);
                  }}
                  placeholder="Secret açarınızı daxil edin..."
                  autoFocus
                  required
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm tracking-wider font-mono transition-all"
                />
                <Key className="absolute right-3.5 top-3.5 text-gray-500 pointer-events-none" size={16} />
              </div>
            </div>

            {verifyError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium animate-shake">
                <AlertCircle size={15} className="shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white font-medium text-sm transition-all shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Yoxlanılır...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} /> Təsdiq Et və Paneli Aç
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={handleExitAdmin}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Ləğv et və mağazaya qayıt
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-gray-600 py-4">
          Strict RLS Security • Store Admin Protocol
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 4: VERIFIED ADMIN DASHBOARD
  // =========================================================================
  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      String(p.id).includes(q)
    );
  });

  const filteredCategories = categories.filter((c) => {
    if (!categorySearchQuery.trim()) return true;
    const q = categorySearchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.icon?.toLowerCase().includes(q) ||
      String(c.id).includes(q)
    );
  });

  const filteredUserLibraries = userLibraries.filter((item) => {
    if (!librarySearchQuery.trim()) return true;
    const q = librarySearchQuery.toLowerCase();
    const prod = Array.isArray(item.products) ? item.products[0] : item.products;
    const prof = item.profile;
    const fullName = `${prof?.first_name || ''} ${prof?.last_name || ''}`.toLowerCase();

    return (
      item.user_id?.toLowerCase().includes(q) ||
      item.product_id?.toLowerCase().includes(q) ||
      prod?.title?.toLowerCase().includes(q) ||
      String(item.id).toLowerCase().includes(q) ||
      prof?.email?.toLowerCase().includes(q) ||
      prof?.user_code?.toLowerCase().includes(q) ||
      fullName.includes(q)
    );
  });

  const filteredWishlistItems = wishlistItems.filter((item) => {
    if (!wishlistSearchQuery.trim()) return true;
    const q = wishlistSearchQuery.toLowerCase();
    const prod = Array.isArray(item.products) ? item.products[0] : item.products;
    const prof = item.profile;
    const fullName = `${prof?.first_name || ''} ${prof?.last_name || ''}`.toLowerCase();

    return (
      item.user_id?.toLowerCase().includes(q) ||
      item.product_id?.toLowerCase().includes(q) ||
      prod?.title?.toLowerCase().includes(q) ||
      String(item.id).toLowerCase().includes(q) ||
      prof?.email?.toLowerCase().includes(q) ||
      prof?.user_code?.toLowerCase().includes(q) ||
      fullName.includes(q)
    );
  });

  const filteredAdminReviews = adminReviews.filter((item) => {
    if (!reviewSearchQuery.trim()) return true;
    const q = reviewSearchQuery.toLowerCase();
    const prod = Array.isArray(item.products) ? item.products[0] : item.products;
    const prof = item.profile;
    const fullName = `${prof?.first_name || ''} ${prof?.last_name || ''}`.toLowerCase();

    return (
      item.user_id?.toLowerCase().includes(q) ||
      item.product_id?.toLowerCase().includes(q) ||
      prod?.title?.toLowerCase().includes(q) ||
      String(item.id).toLowerCase().includes(q) ||
      prof?.email?.toLowerCase().includes(q) ||
      prof?.user_code?.toLowerCase().includes(q) ||
      fullName.includes(q) ||
      item.comment?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen w-full bg-[#0a0c10] text-gray-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full bg-[#111319]/90 border-b border-white/10 backdrop-blur-xl px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Package size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-tight font-syne">
                Lumora Store Admin
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">
                <ShieldCheck size={11} /> 2FA Verified
              </span>
            </div>
            <p className="text-[11px] text-gray-400 hidden sm:block">
              Bağlantı: <span className="text-gray-300 font-mono">{user.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleRefreshAll}
            disabled={loadingProducts || loadingCategories || loadingLibraries || loadingWishlist || loadingReviews}
            title="Məlumatları yenilə"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5"
          >
            <RefreshCw
              size={14}
              className={loadingProducts || loadingCategories || loadingLibraries || loadingWishlist || loadingReviews ? 'animate-spin text-cyan-400' : ''}
            />
            <span className="hidden sm:inline">Yenilə</span>
          </button>

          <button
            onClick={handleExitAdmin}
            className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-medium transition-all flex items-center gap-1.5"
          >
            <LogOut size={14} />
            <span>Çıxış</span>
          </button>
        </div>
      </header>

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-[#0e1017]/70 border-b md:border-b-0 md:border-r border-white/10 p-4 shrink-0">
          <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold px-3 mb-2">
            İdarəetmə Paneli
          </div>
          <nav className="space-y-1">
            {/* Products Tab */}
            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'products'
                  ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package size={17} />
                <span>Məhsullar</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-black/40 text-[11px] font-mono text-gray-400">
                {products.length}
              </span>
            </button>

            {/* Categories Tab */}
            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'categories'
                  ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers size={17} />
                <span>Kateqoriyalar</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-black/40 text-[11px] font-mono text-gray-400">
                {categories.length}
              </span>
            </button>

            {/* Ads Management Tab (Reklamlar) */}
            <button
              onClick={() => setActiveTab('ads')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'ads'
                  ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Megaphone size={17} />
                <span>Reklamlar</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-[11px] font-mono font-bold text-cyan-300 border border-cyan-500/30">
                {productAds.length}
              </span>
            </button>

            {/* Promocodes Management Tab (Promokodlar) */}
            <button
              onClick={() => setActiveTab('promocodes')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'promocodes'
                  ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Ticket size={17} />
                <span>Promokodlar</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-[11px] font-mono font-bold text-cyan-300 border border-cyan-500/30">
                {promocodes.length}
              </span>
            </button>

            {/* Notifications Management Tab (Bildirişlər) */}
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'notifications'
                  ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bell size={17} />
                <span>Bildirişlər</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-[11px] font-mono font-bold text-cyan-300 border border-cyan-500/30">
                {notifications.length}
              </span>
            </button>

            {/* Orders Tab */}
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'orders'
                  ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingCart size={17} />
                <span>Sifarişlər</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-[10px] text-gray-500 font-normal">
                Tezliklə
              </span>
            </button>

            {/* User Libraries Tab */}
            <button
              onClick={() => setActiveTab('libraries')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'libraries'
                  ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen size={17} />
                <span>İstifadəçi Kitabxanaları</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-black/40 text-[11px] font-mono text-gray-400">
                {userLibraries.length}
              </span>
            </button>

            {/* Wishlist Tab (İstək Siyahısı) */}
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'wishlist'
                  ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Heart size={17} />
                <span>İstək Siyahısı</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-black/40 text-[11px] font-mono text-gray-400">
                {wishlistItems.length}
              </span>
            </button>

            {/* Reviews Tab (Rəylər) */}
            <button
              onClick={() => setActiveTab('reviews')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'reviews'
                  ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare size={17} />
                <span>Rəylər</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-black/40 text-[11px] font-mono text-gray-400">
                {adminReviews.length}
              </span>
            </button>
          </nav>

          <div className="mt-8 p-3.5 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-300 mb-1">
              <Sparkles size={14} className="text-cyan-400" /> Supabase Realtime
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Bu paneldən əlavə olunan bütün kateqoriya və məhsullar birbaşa Supabase PostgreSQL bazasına yazılır.
            </p>
          </div>
        </aside>

        {/* Dynamic Content Panel */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* =========================================================================
           * 1. PRODUCTS VIEW
           * ========================================================================= */}
          {activeTab === 'products' && (
            <div className="space-y-8">
              {/* Header Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#12141c] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-medium">Cəmi Məhsul</span>
                    <Box size={16} className="text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold text-white font-syne">{products.length}</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#12141c] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-medium">Mövcud Kateqoriyalar</span>
                    <Layers size={16} className="text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold text-white font-syne">{categories.length}</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#12141c] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-medium">Baza Əlaqəsi</span>
                    <ShieldCheck size={16} className="text-emerald-400" />
                  </div>
                  <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Supabase RLS Aktiv
                  </div>
                </div>
              </div>

              {/* Form: Add or Edit Product */}
              <div ref={productFormRef} className="p-6 rounded-3xl bg-[#12141c] border border-white/10 shadow-xl">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    {editingProduct ? (
                      <Pencil size={18} className="text-cyan-400" />
                    ) : (
                      <Plus size={18} className="text-cyan-400" />
                    )}
                    <h3 className="text-base font-bold text-white font-syne">
                      {editingProduct ? 'Məhsula Düzəliş Et' : 'Yeni Məhsul Əlavə Et'}
                    </h3>
                  </div>
                  {editingProduct && (
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-medium flex items-center gap-1">
                      <Pencil size={11} /> Düzəliş Rejimi
                    </span>
                  )}
                </div>

                {formFeedback && (
                  <div
                    className={`mb-5 p-3.5 rounded-xl border flex items-center gap-2 text-xs font-medium ${
                      formFeedback.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}
                  >
                    {formFeedback.type === 'success' ? (
                      <CheckCircle2 size={16} className="shrink-0" />
                    ) : (
                      <AlertCircle size={16} className="shrink-0" />
                    )}
                    <span>{formFeedback.message}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProduct} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Title */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                        Məhsulun Adı (Title) <span className="text-cyan-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="məs: Cyberpunk UI Dəsti"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-sm transition-all"
                      />
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                        Qiymət (Price ₼ / $) <span className="text-cyan-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="məs: 29.99"
                          required
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-sm transition-all font-mono"
                        />
                        <DollarSign className="absolute left-3 top-3 text-gray-500" size={15} />
                      </div>

                      {/* Qiymət bölməsinin altında "Endirimdədir" (is_discounted) Checkbox / Toggle */}
                      <div className="mt-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label
                            className="flex items-center gap-2.5 cursor-pointer select-none"
                            onClick={() => {
                              const next = !isDiscounted;
                              setIsDiscounted(next);
                              if (!next) setDiscountPrice('');
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isDiscounted}
                              onChange={(e) => {
                                setIsDiscounted(e.target.checked);
                                if (!e.target.checked) setDiscountPrice('');
                              }}
                              className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 border-white/20 bg-black/40 cursor-pointer accent-rose-500"
                            />
                            <div>
                              <span className="text-xs font-bold text-white block">
                                Endirimdədir (is_discounted)
                              </span>
                              <span className="text-[10px] text-gray-400 block">
                                Məhsul üçün endirimli qiymət təyin et
                              </span>
                            </div>
                          </label>

                          {/* Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => {
                              const next = !isDiscounted;
                              setIsDiscounted(next);
                              if (!next) setDiscountPrice('');
                            }}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isDiscounted ? 'bg-rose-500' : 'bg-white/20'
                            }`}
                            role="switch"
                            aria-checked={isDiscounted}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                isDiscounted ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Dinamik İnput: Əgər "Endirimdədir" (is_discounted) aktiv edilərsə, dərhal altında "Endirimli Qiymət" sahəsi açılsın */}
                        {isDiscounted && (
                          <div className="pt-2 border-t border-white/10 space-y-1.5 animate-fadeIn">
                            <label className="block text-xs font-semibold text-rose-400">
                              Endirimli Qiymət (discount_price ₼ / $) <span className="text-rose-400">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={discountPrice}
                                onChange={(e) => setDiscountPrice(e.target.value)}
                                placeholder="məs: 19.99"
                                required={isDiscounted}
                                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-black/50 border border-rose-500/40 text-white placeholder-gray-500 focus:outline-none focus:border-rose-400 text-sm transition-all font-mono"
                              />
                              <DollarSign className="absolute left-3 top-2.5 text-rose-400" size={14} />
                            </div>

                            {price && discountPrice && Number(price) > 0 && Number(discountPrice) < Number(price) && (
                              <p className="text-[11px] text-emerald-400 font-medium pt-0.5">
                                ✓ Endirim nisbəti: -{Math.round(((Number(price) - Number(discountPrice)) / Number(price)) * 100)}% (Satış qiyməti: {Number(discountPrice).toFixed(2)} ₼)
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Category Select */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                        Kateqoriya (category_id)
                      </label>
                      <div className="relative">
                        <select
                          value={selectedCategoryId}
                          onChange={(e) => setSelectedCategoryId(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#0a0c10] border border-white/15 text-white focus:outline-none focus:border-cyan-500 text-sm transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Kateqoriyasız (Seçilməyib)</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name} {cat.icon ? `(${cat.icon})` : ''}
                            </option>
                          ))}
                        </select>
                        <Tag className="absolute left-3 top-3 text-gray-500 pointer-events-none" size={15} />
                      </div>
                    </div>

                    {/* Image URL & File Upload with Cropper */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-gray-300">
                          Şəkil (image_url)
                        </label>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                        >
                          <Upload size={12} />
                          <span>Şəkil seç və kəs</span>
                        </button>
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageFileSelect}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2">
                        {imageUrl ? (
                          <div className="relative shrink-0 group">
                            <img
                              src={imageUrl}
                              alt="Məhsul şəkli"
                              className="w-10 h-10 rounded-lg object-cover bg-black/40 border border-white/15"
                            />
                            <button
                              type="button"
                              onClick={() => setImageUrl('')}
                              title="Şəkli sil"
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] shadow cursor-pointer"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ) : null}
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://... və ya fayl seçin"
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-sm transition-all font-mono"
                          />
                          <ImageIcon className="absolute left-3 top-3 text-gray-500" size={15} />
                        </div>
                      </div>
                      {uploadingImage && (
                        <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 mt-1.5">
                          <RefreshCw size={12} className="animate-spin" />
                          <span>Şəkil yüklənir...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Məhsul Təsviri (description)
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Məhsul haqqında ətraflı məlumat..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-sm transition-all resize-none"
                    />
                  </div>

                  {/* Secret Content */}
                  <div>
                    <label className="block text-xs font-semibold text-amber-300 mb-1.5 flex items-center gap-1.5">
                      <KeyRound size={14} className="text-amber-400" />
                      Gizli Məzmun / Açarlar (secret_content)
                    </label>
                    <textarea
                      rows={2}
                      value={secretContent}
                      onChange={(e) => setSecretContent(e.target.value)}
                      placeholder="Yalnız məhsulu alan müştəriyə təqdim ediləcək xüsusi link, fayl linki və ya lisenziya açarı..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-amber-500/25 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 text-sm transition-all font-mono resize-none"
                    />
                  </div>

                  {/* Technical Parameters (parameters JSONB) */}
                  <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders size={14} /> Texniki Parametrlər (parameters JSONB)
                      </label>
                      <button
                        type="button"
                        onClick={handleAddCustomParam}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
                      >
                        <Plus size={13} /> Əlavə parametr
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="block text-[11px] text-gray-400 mb-1">Uyğunluq:</span>
                        <input
                          type="text"
                          value={paramUygunluq}
                          onChange={(e) => setParamUygunluq(e.target.value)}
                          placeholder="Figma, Adobe XD"
                          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <span className="block text-[11px] text-gray-400 mb-1">Format:</span>
                        <input
                          type="text"
                          value={paramFormat}
                          onChange={(e) => setParamFormat(e.target.value)}
                          placeholder=".FIG, .ZIP, .PSD"
                          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <span className="block text-[11px] text-gray-400 mb-1">Dəstək:</span>
                        <input
                          type="text"
                          value={paramDestek}
                          onChange={(e) => setParamDestek(e.target.value)}
                          placeholder="24/7 Dəstək, Ömürlük"
                          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    {customParams.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        {customParams.map((cp, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={cp.key}
                              onChange={(e) => handleUpdateCustomParam(idx, 'key', e.target.value)}
                              placeholder="Parametr adı (məs: Həcm)"
                              className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-500"
                            />
                            <input
                              type="text"
                              value={cp.value}
                              onChange={(e) => handleUpdateCustomParam(idx, 'value', e.target.value)}
                              placeholder="Dəyər (məs: 250 MB)"
                              className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomParam(idx)}
                              className="p-1.5 text-red-400 hover:text-red-300 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submit & Cancel Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    {editingProduct && (
                      <button
                        type="button"
                        onClick={handleCancelEditProduct}
                        className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white font-medium text-sm transition-all cursor-pointer"
                      >
                        Ləğv et
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={submittingProduct || uploadingImage}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-medium text-sm transition-all shadow-md shadow-cyan-600/20 flex items-center gap-2 cursor-pointer"
                    >
                      {submittingProduct ? (
                        <>
                          <RefreshCw size={15} className="animate-spin" /> Yadda saxlanılır...
                        </>
                      ) : editingProduct ? (
                        <>
                          <CheckCircle2 size={16} /> Dəyişiklikləri Yadda Saxla
                        </>
                      ) : (
                        <>
                          <Plus size={16} /> Məhsulu Bazaya Əlavə Et
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Products List & Table */}
              <div className="p-6 rounded-3xl bg-[#12141c] border border-white/10 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-white font-syne">Mövcud Məhsullar</h3>
                    <p className="text-xs text-gray-400">
                      Supabase <span className="font-mono text-cyan-400">products</span> cədvəlindən canlı çəkilmiş real məlumatlar.
                    </p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Məhsul axtar..."
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-xs transition-all"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
                  </div>
                </div>

                {loadingProducts ? (
                  <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-3">
                    <RefreshCw size={24} className="animate-spin text-cyan-400" />
                    <span className="text-sm">Məhsullar bazadan yüklənir...</span>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="py-12 border border-dashed border-white/10 rounded-2xl text-center">
                    <Package size={36} className="mx-auto text-gray-600 mb-3" />
                    <h4 className="text-sm font-semibold text-gray-300 mb-1">Məhsul tapılmadı</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      {searchQuery
                        ? 'Axtarışa uyğun məhsul tapılmadı.'
                        : 'Hələ heç bir məhsul bazaya əlavə edilməyib. Yuxarıdakı formadan ilk məhsulu əlavə edin.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-white/10">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-black/40 text-[11px] uppercase tracking-wider text-gray-400 border-b border-white/10 font-mono">
                        <tr>
                          <th className="py-3 px-4">Məhsul</th>
                          <th className="py-3 px-4">Kateqoriya</th>
                          <th className="py-3 px-4">Qiymət</th>
                          <th className="py-3 px-4 hidden lg:table-cell">Parametrlər</th>
                          <th className="py-3 px-4 hidden md:table-cell">Tarix</th>
                          <th className="py-3 px-4 text-right">Əməliyyat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-sans">
                        {filteredProducts.map((prod) => (
                          <tr key={prod.id} className="hover:bg-white/[0.02] transition-colors">
                            {/* Product Info with Image Thumbnail */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                {prod.image_url ? (
                                  <img
                                    src={prod.image_url}
                                    alt={prod.title}
                                    className="w-11 h-11 rounded-lg object-cover bg-black/40 border border-white/10 shrink-0"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-11 h-11 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 shrink-0">
                                    <ImageIcon size={18} />
                                  </div>
                                )}
                                <div>
                                  <div className="font-semibold text-white text-sm">
                                    {prod.title}
                                  </div>
                                  {prod.description && (
                                    <p className="text-xs text-gray-400 line-clamp-1 max-w-xs">
                                      {prod.description}
                                    </p>
                                  )}
                                  <span className="text-[10px] font-mono text-gray-500">
                                    ID: {String(prod.id).slice(0, 8)}...
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Category Badge */}
                            <td className="py-3.5 px-4">
                              {prod.category_id && categoryMap.has(prod.category_id) ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium">
                                  {categoryMap.get(prod.category_id)}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-500 italic">Təyinsiz</span>
                              )}
                            </td>

                            {/* Price with Discount Status */}
                            <td className="py-3.5 px-4 font-mono text-sm">
                              {prod.is_discounted && prod.discount_price !== null && prod.discount_price !== undefined ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-emerald-400">
                                      {Number(prod.discount_price).toFixed(2)} ₼
                                    </span>
                                    <span className="text-xs text-gray-500 line-through">
                                      {Number(prod.price || 0).toFixed(2)} ₼
                                    </span>
                                  </div>
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-400">
                                    <Tag size={10} />
                                    <span>Endirimli</span>
                                    {prod.discount_percentage ? `(-${prod.discount_percentage}%)` : ''}
                                  </span>
                                </div>
                              ) : (
                                <span className="font-semibold text-cyan-400">
                                  {Number(prod.price || 0).toFixed(2)} ₼
                                </span>
                              )}
                            </td>

                            {/* Technical Parameters Tags */}
                            <td className="py-3.5 px-4 hidden lg:table-cell">
                              {prod.parameters && typeof prod.parameters === 'object' && Object.keys(prod.parameters).length > 0 ? (
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {Object.entries(prod.parameters).slice(0, 3).map(([k, v]) => (
                                    <span
                                      key={k}
                                      className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-gray-300 font-mono"
                                    >
                                      {k}: {String(v)}
                                    </span>
                                  ))}
                                  {Object.keys(prod.parameters).length > 3 && (
                                    <span className="text-[10px] text-gray-500">
                                      +{Object.keys(prod.parameters).length - 3}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-500">—</span>
                              )}
                            </td>

                            {/* Created Date */}
                            <td className="py-3.5 px-4 text-xs text-gray-400 font-mono hidden md:table-cell">
                              {prod.created_at
                                ? new Date(prod.created_at).toLocaleDateString()
                                : '—'}
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditProduct(prod)}
                                  title="Düzəliş et"
                                  className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 transition-all inline-flex items-center justify-center cursor-pointer"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(prod.id)}
                                  disabled={productActionLoading === prod.id}
                                  title="Məhsulu Sil"
                                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-all inline-flex items-center justify-center disabled:opacity-40 cursor-pointer"
                                >
                                  {productActionLoading === prod.id ? (
                                    <RefreshCw size={15} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={15} />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
           * 2. CATEGORIES VIEW
           * ========================================================================= */}
          {activeTab === 'categories' && (
            <div className="space-y-8">
              {/* Header Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#12141c] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-medium">Cəmi Kateqoriya</span>
                    <Layers size={16} className="text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold text-white font-syne">{categories.length}</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#12141c] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-medium">Baza Cədvəli</span>
                    <Folder size={16} className="text-cyan-400" />
                  </div>
                  <div className="text-xs font-mono text-cyan-400 mt-1">public.categories</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#12141c] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-medium">Status</span>
                    <ShieldCheck size={16} className="text-emerald-400" />
                  </div>
                  <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Supabase RLS Aktiv
                  </div>
                </div>
              </div>

              {/* Form: Add or Edit Category */}
              <div ref={categoryFormRef} className="p-6 rounded-3xl bg-[#12141c] border border-white/10 shadow-xl">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    {editingCategory ? (
                      <Pencil size={18} className="text-cyan-400" />
                    ) : (
                      <Plus size={18} className="text-cyan-400" />
                    )}
                    <h3 className="text-base font-bold text-white font-syne">
                      {editingCategory ? 'Kateqoriyaya Düzəliş Et' : 'Yeni Kateqoriya Əlavə Et'}
                    </h3>
                  </div>
                  {editingCategory && (
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-medium flex items-center gap-1">
                      <Pencil size={11} /> Düzəliş Rejimi
                    </span>
                  )}
                </div>

                {categoryFeedback && (
                  <div
                    className={`mb-5 p-3.5 rounded-xl border flex items-center gap-2 text-xs font-medium ${
                      categoryFeedback.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}
                  >
                    {categoryFeedback.type === 'success' ? (
                      <CheckCircle2 size={16} className="shrink-0" />
                    ) : (
                      <AlertCircle size={16} className="shrink-0" />
                    )}
                    <span>{categoryFeedback.message}</span>
                  </div>
                )}

                <form onSubmit={handleSaveCategory} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                        Kateqoriya Adı (name) <span className="text-cyan-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        placeholder="məs: UI Dəstləri və Şablonlar"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-sm transition-all"
                      />
                    </div>

                    {/* Icon File Picker with Direct Gallery Selection */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-gray-300">
                          İkon (1:1 Kvadrat Şəkil)
                        </label>
                        {categoryIcon && (
                          <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 size={11} /> İkon seçilib
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {categoryIcon ? (
                          <div className="relative shrink-0 group">
                            <img
                              src={categoryIcon}
                              alt="Kateqoriya ikonu"
                              className="w-10 h-10 rounded-xl object-cover bg-black/40 border border-cyan-500/30 shadow-sm"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setCategoryIcon('');
                                if (categoryFileInputRef.current) categoryFileInputRef.current.value = '';
                              }}
                              title="İkonu sil"
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] shadow cursor-pointer hover:bg-red-600 transition-colors"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ) : null}

                        <div className="relative flex-1">
                          <input
                            type="file"
                            ref={categoryFileInputRef}
                            accept="image/*"
                            onChange={handleCategoryIconFileSelect}
                            className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/15 text-gray-300 file:mr-2.5 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/15 file:text-cyan-300 hover:file:bg-cyan-500/25 text-xs transition-all cursor-pointer focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>

                      {uploadingCategoryIcon && (
                        <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 mt-1.5">
                          <RefreshCw size={12} className="animate-spin" />
                          <span>İkon 'assets' anbarına yüklənir...</span>
                        </div>
                      )}
                    </div>

                    {/* Parent Category */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                        Ana Kateqoriya (parent_id)
                      </label>
                      <select
                        value={categoryParentId}
                        onChange={(e) => setCategoryParentId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0c10] border border-white/15 text-white focus:outline-none focus:border-cyan-500 text-sm transition-all cursor-pointer"
                      >
                        <option value="">Əsas Kateqoriya (Parent yoxdur)</option>
                        {categories
                          .filter((c) => !editingCategory || c.id !== editingCategory.id)
                          .map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name} {cat.icon ? `(${cat.icon})` : ''}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Submit & Cancel Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    {editingCategory && (
                      <button
                        type="button"
                        onClick={handleCancelEditCategory}
                        className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white font-medium text-sm transition-all cursor-pointer"
                      >
                        Ləğv et
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={submittingCategory}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-medium text-sm transition-all shadow-md shadow-cyan-600/20 flex items-center gap-2 cursor-pointer"
                    >
                      {submittingCategory ? (
                        <>
                          <RefreshCw size={15} className="animate-spin" /> Yadda saxlanılır...
                        </>
                      ) : editingCategory ? (
                        <>
                          <CheckCircle2 size={16} /> Dəyişiklikləri Yadda Saxla
                        </>
                      ) : (
                        <>
                          <Plus size={16} /> Kateqoriyanı Əlavə Et
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Categories List & Table */}
              <div className="p-6 rounded-3xl bg-[#12141c] border border-white/10 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-white font-syne">Mövcud Kateqoriyalar</h3>
                    <p className="text-xs text-gray-400">
                      Supabase <span className="font-mono text-cyan-400">categories</span> cədvəlindən canlı çəkilmiş real məlumatlar.
                    </p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      value={categorySearchQuery}
                      onChange={(e) => setCategorySearchQuery(e.target.value)}
                      placeholder="Kateqoriya axtar..."
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-xs transition-all"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
                  </div>
                </div>

                {loadingCategories ? (
                  <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-3">
                    <RefreshCw size={24} className="animate-spin text-cyan-400" />
                    <span className="text-sm">Kateqoriyalar bazadan yüklənir...</span>
                  </div>
                ) : filteredCategories.length === 0 ? (
                  <div className="py-12 border border-dashed border-white/10 rounded-2xl text-center">
                    <Layers size={36} className="mx-auto text-gray-600 mb-3" />
                    <h4 className="text-sm font-semibold text-gray-300 mb-1">Kateqoriya tapılmadı</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      {categorySearchQuery
                        ? 'Axtarışa uyğun kateqoriya tapılmadı.'
                        : 'Hələ heç bir kateqoriya əlavə edilməyib. Yuxarıdakı formadan ilk kateqoriyanı əlavə edin.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-white/10">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-black/40 text-[11px] uppercase tracking-wider text-gray-400 border-b border-white/10 font-mono">
                        <tr>
                          <th className="py-3 px-4">Kateqoriya Adı</th>
                          <th className="py-3 px-4">İkon</th>
                          <th className="py-3 px-4">Ana Kateqoriya (Parent)</th>
                          <th className="py-3 px-4 hidden md:table-cell">Tarix</th>
                          <th className="py-3 px-4 text-right">Əməliyyat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-sans">
                        {filteredCategories.map((cat) => (
                          <tr key={cat.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-white">
                              {cat.name}
                              <div className="text-[10px] font-mono text-gray-500 font-normal">
                                ID: {cat.id.slice(0, 8)}...
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-cyan-400 text-xs">
                              {cat.icon ? (
                                cat.icon.startsWith('http') || cat.icon.startsWith('data:') ? (
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={cat.icon}
                                      alt={cat.name}
                                      className="w-7 h-7 rounded-lg object-cover bg-black/40 border border-white/10 shrink-0"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                    <span className="text-[10px] text-gray-400 font-mono truncate max-w-[120px]">
                                      {cat.icon.startsWith('data:') ? 'base64' : cat.icon.split('/').pop()}
                                    </span>
                                  </div>
                                ) : (
                                  cat.icon
                                )
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-gray-400">
                              {cat.parent_id && categoryMap.has(cat.parent_id) ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-300">
                                  {categoryMap.get(cat.parent_id)}
                                </span>
                              ) : (
                                <span className="text-gray-500 italic">Əsas Kateqoriya</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-gray-400 font-mono hidden md:table-cell">
                              {cat.created_at
                                ? new Date(cat.created_at).toLocaleDateString()
                                : '—'}
                            </td>
                            {/* Action Buttons */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditCategory(cat)}
                                  title="Düzəliş et"
                                  className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 transition-all inline-flex items-center justify-center cursor-pointer"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat.id)}
                                  disabled={categoryActionLoading === cat.id}
                                  title="Kateqoriyanı Sil"
                                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-all inline-flex items-center justify-center disabled:opacity-40 cursor-pointer"
                                >
                                  {categoryActionLoading === cat.id ? (
                                    <RefreshCw size={15} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={15} />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
           * ADS MANAGEMENT TAB (REKLAMLARIN İDARƏ EDİLMƏSİ)
           * ========================================================================= */}
          {activeTab === 'ads' && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="p-6 rounded-3xl bg-[#12141c] border border-white/10 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                    <Megaphone size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-wide">
                      Reklamların İdarə Edilməsi
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Mağaza səhifəsindəki bannerlərin və aidiyyəti məhsulların idarəsi
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAd(null);
                      setIsAdModalOpen(true);
                    }}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Yeni Reklam Əlavə Et</span>
                  </button>

                  <button
                    type="button"
                    onClick={loadProductAds}
                    disabled={loadingAds}
                    className="p-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Yenilə"
                  >
                    <RefreshCw size={16} className={loadingAds ? 'animate-spin text-cyan-400' : ''} />
                  </button>
                </div>
              </div>

              {/* Feedback Alert */}
              {adFeedback && (
                <div
                  className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 ${
                    adFeedback.type === 'success'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {adFeedback.type === 'success' ? (
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle size={16} className="text-rose-400 shrink-0" />
                  )}
                  <span>{adFeedback.message}</span>
                </div>
              )}

              {/* Search & Filter Bar */}
              <div className="p-4 rounded-2xl bg-[#12141c] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={adSearchQuery}
                    onChange={(e) => setAdSearchQuery(e.target.value)}
                    placeholder="Reklam başlığı və ya məhsul ilə axtar..."
                    className="w-full pl-10 pr-8 py-2 rounded-xl text-xs bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-all"
                  />
                  {adSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setAdSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="text-xs text-gray-400 self-end sm:self-auto flex items-center gap-2">
                  <span>Toplam reklam:</span>
                  <span className="font-mono font-bold text-cyan-300 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                    {productAds.length}
                  </span>
                </div>
              </div>

              {/* Ads Grid */}
              {loadingAds ? (
                <div className="p-16 rounded-3xl bg-[#12141c] border border-white/10 flex flex-col items-center justify-center gap-3 text-gray-400 text-xs">
                  <RefreshCw size={24} className="animate-spin text-cyan-400" />
                  <span>Reklamlar bazadan yüklənir...</span>
                </div>
              ) : productAds.length === 0 ? (
                <div className="p-16 rounded-3xl bg-[#12141c] border border-white/10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                    <Megaphone size={30} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Hələ heç bir reklam yaradılmayıb</h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                      Mağaza səhifəsində banner nümayiş etdirmək və müvafiq məhsulları vurğulamaq üçün yeni reklam əlavə edin.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAd(null);
                      setIsAdModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-xs inline-flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>İlk Reklamı Əlavə Et</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {productAds
                    .filter((ad) => {
                      if (!adSearchQuery.trim()) return true;
                      const q = adSearchQuery.toLowerCase();
                      const matchTitle = (ad.title || '').toLowerCase().includes(q);
                      const matchProd = (ad.product_ad_items || []).some((item) =>
                        (item.products?.title || '').toLowerCase().includes(q)
                      );
                      return matchTitle || matchProd;
                    })
                    .map((ad) => {
                      const attachedItems = ad.product_ad_items || [];
                      const isDeleting = deletingAdId === ad.id;

                      return (
                        <div
                          key={ad.id}
                          className="rounded-3xl bg-[#12141c] border border-white/10 overflow-hidden shadow-xl hover:border-cyan-500/30 transition-all flex flex-col group"
                        >
                          {/* Banner Image Preview (Aspect Ratio 2.4 : 1) */}
                          <div className="relative w-full aspect-[2.4/1] bg-black overflow-hidden border-b border-white/10">
                            <img
                              src={ad.image_url}
                              alt={ad.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-900/60 to-transparent" />

                            {/* Banner Badge & Title preview */}
                            <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between z-10 pointer-events-none">
                              <span className="self-start inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black text-white border border-white/20 uppercase">
                                <Sparkles size={10} className="text-amber-300" />
                                Banner
                              </span>
                              <div className="max-w-[80%]">
                                <h4 className="text-sm sm:text-base font-black text-white leading-tight drop-shadow line-clamp-2">
                                  {ad.title}
                                </h4>
                              </div>
                            </div>
                          </div>

                          {/* Card Content & Attached Products */}
                          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-gray-300 flex items-center gap-1.5">
                                  <Package size={14} className="text-cyan-400" />
                                  <span>Aidiyyəti Məhsullar:</span>
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/20">
                                  {attachedItems.length} məhsul
                                </span>
                              </div>

                              {/* Products Badges List */}
                              {attachedItems.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                                  {attachedItems.map((item, idx) => (
                                    <span
                                      key={item.id || idx}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-[11px] text-gray-200"
                                    >
                                      {item.products?.image_url && (
                                        <img
                                          src={item.products.image_url}
                                          alt=""
                                          className="w-3.5 h-3.5 rounded object-cover"
                                        />
                                      )}
                                      <span className="truncate max-w-[130px]">
                                        {item.products?.title || 'Məhsul'}
                                      </span>
                                      {typeof item.products?.price === 'number' && (
                                        <span className="text-[9px] text-cyan-300 font-mono font-bold">
                                          {item.products.price}₼
                                        </span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[11px] text-gray-500 italic">
                                  Bu reklama hələ heç bir məhsul əlavə olunmayıb.
                                </p>
                              )}
                            </div>

                            {/* Card Footer Actions */}
                            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                              <span className="text-[11px] text-gray-500 font-mono">
                                {ad.created_at
                                  ? new Date(ad.created_at).toLocaleDateString('az-AZ', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                    })
                                  : 'Yeni'}
                              </span>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAd(ad);
                                    setIsAdModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Pencil size={13} />
                                  <span>Düzəliş et</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={isDeleting}
                                  onClick={() => handleDeleteAd(ad.id)}
                                  className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-colors cursor-pointer disabled:opacity-40"
                                  title="Reklamı Sil"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
           * PROMOCODES MANAGEMENT TAB (PROMOKODLARIN İDARƏ EDİLMƏSİ)
           * ========================================================================= */}
          {activeTab === 'promocodes' && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="p-6 rounded-3xl bg-[#12141c] border border-white/10 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                    <Ticket size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-wide">
                      Promokodların İdarə Edilməsi
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Endirim faizləri, istifadə limitləri, ümumi və şəxsi promokodların idarəsi
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPromocode(null);
                      setIsPromocodeModalOpen(true);
                    }}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Yeni Promokod</span>
                  </button>

                  <button
                    type="button"
                    onClick={loadPromocodes}
                    disabled={loadingPromocodes}
                    className="p-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Yenilə"
                  >
                    <RefreshCw size={16} className={loadingPromocodes ? 'animate-spin text-cyan-400' : ''} />
                  </button>
                </div>
              </div>

              {/* Feedback Alert */}
              {promocodeFeedback && (
                <div
                  className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 ${
                    promocodeFeedback.type === 'success'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {promocodeFeedback.type === 'success' ? (
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle size={16} className="text-rose-400 shrink-0" />
                  )}
                  <span>{promocodeFeedback.message}</span>
                </div>
              )}

              {/* Search & Filter Bar */}
              <div className="p-4 rounded-2xl bg-[#12141c] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={promocodeSearchQuery}
                    onChange={(e) => setPromocodeSearchQuery(e.target.value)}
                    placeholder="Kod, istifadəçi və ya ID ilə axtar..."
                    className="w-full pl-10 pr-8 py-2 rounded-xl text-xs bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-all"
                  />
                  {promocodeSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setPromocodeSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
                  {(
                    [
                      { id: 'all', label: 'Hamısı' },
                      { id: 'active', label: 'Aktiv' },
                      { id: 'inactive', label: 'Deaktiv' },
                      { id: 'personal', label: 'Şəxsi' },
                      { id: 'public', label: 'Hamı üçün' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setPromocodeFilterStatus(f.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        promocodeFilterStatus === f.id
                          ? 'bg-cyan-500 text-gray-950 font-bold shadow-sm'
                          : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Promocodes Table */}
              {loadingPromocodes ? (
                <div className="p-16 rounded-3xl bg-[#12141c] border border-white/10 flex flex-col items-center justify-center gap-3 text-gray-400 text-xs">
                  <RefreshCw size={24} className="animate-spin text-cyan-400" />
                  <span>Promokodlar bazadan yüklənir...</span>
                </div>
              ) : promocodes.length === 0 ? (
                <div className="p-16 rounded-3xl bg-[#12141c] border border-white/10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                    <Ticket size={30} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Hələ heç bir promokod yaradılmayıb</h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                      Müştərilərə endirim təqdim etmək üçün ümumi və ya şəxsi promokod yarada bilərsiniz.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPromocode(null);
                      setIsPromocodeModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-xs inline-flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>İlk Promokodu Əlavə Et</span>
                  </button>
                </div>
              ) : (
                <div className="rounded-3xl bg-[#12141c] border border-white/10 overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-mono uppercase tracking-wider text-gray-400">
                          <th className="py-3.5 px-4 font-bold">Kod</th>
                          <th className="py-3.5 px-4 font-bold">Endirim (%)</th>
                          <th className="py-3.5 px-4 font-bold">Növü</th>
                          <th className="py-3.5 px-4 font-bold">İstifadə / Limit</th>
                          <th className="py-3.5 px-4 font-bold">Status</th>
                          <th className="py-3.5 px-4 font-bold">Son Tarix</th>
                          <th className="py-3.5 px-4 font-bold text-right">Əməliyyatlar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs text-gray-300">
                        {promocodes
                          .filter((item) => {
                            // Filter by search query
                            if (promocodeSearchQuery.trim()) {
                              const q = promocodeSearchQuery.toLowerCase();
                              const matchCode = item.code.toLowerCase().includes(q);
                              const matchUser =
                                item.profiles &&
                                (`${item.profiles.first_name || ''} ${item.profiles.last_name || ''}`.toLowerCase().includes(q) ||
                                  (item.profiles.email || '').toLowerCase().includes(q) ||
                                  (item.profiles.user_code || '').includes(q));
                              if (!matchCode && !matchUser) return false;
                            }

                            // Filter by status/type
                            if (promocodeFilterStatus === 'active') return item.is_active;
                            if (promocodeFilterStatus === 'inactive') return !item.is_active;
                            if (promocodeFilterStatus === 'personal') return Boolean(item.user_id);
                            if (promocodeFilterStatus === 'public') return !item.user_id;

                            return true;
                          })
                          .map((item) => {
                            const isDeleting = deletingPromocodeId === item.id;
                            const isExpired =
                              item.expires_at && new Date(item.expires_at).getTime() < Date.now();

                            return (
                              <tr
                                key={item.id}
                                className="hover:bg-white/[0.02] transition-colors group"
                              >
                                {/* 1. Kod */}
                                <td className="py-3.5 px-4 font-mono font-bold text-white">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-mono text-xs font-bold tracking-wider inline-flex items-center gap-1.5 shadow-sm">
                                      <Ticket size={13} className="text-cyan-400" />
                                      <span>{item.code}</span>
                                    </span>
                                  </div>
                                </td>

                                {/* 2. Endirim (%) */}
                                <td className="py-3.5 px-4 font-mono">
                                  <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-xs">
                                    <span>%{item.discount_percent}</span>
                                  </span>
                                </td>

                                {/* 3. Növü (Hamı üçün vs Şəxsi) */}
                                <td className="py-3.5 px-4">
                                  {!item.user_id ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold">
                                      <Users size={12} />
                                      <span>Hamı üçün</span>
                                    </span>
                                  ) : (
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold shrink-0">
                                        <User size={11} />
                                        <span>Şəxsi</span>
                                      </span>
                                      <div className="min-w-0">
                                        <p className="text-xs text-white font-medium truncate max-w-[130px]">
                                          {item.profiles?.first_name} {item.profiles?.last_name || ''}
                                        </p>
                                        {item.profiles?.user_code && (
                                          <span className="font-mono text-[10px] text-gray-500">
                                            #{item.profiles.user_code}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {/* 4. İstifadə / Limit */}
                                <td className="py-3.5 px-4 font-mono text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-white">
                                      {item.used_count || 0}
                                    </span>
                                    <span className="text-gray-500">/</span>
                                    {item.usage_limit ? (
                                      <span className="text-gray-400 font-medium">
                                        {item.usage_limit}
                                      </span>
                                    ) : (
                                      <span className="text-cyan-300 flex items-center gap-0.5 font-bold">
                                        <InfinityIcon size={12} />
                                        <span>Limitsiz</span>
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* 5. Status (Aktiv / Deaktiv) */}
                                <td className="py-3.5 px-4">
                                  {item.is_active ? (
                                    <button
                                      type="button"
                                      onClick={() => handleTogglePromocodeStatus(item.id, false)}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition-all cursor-pointer"
                                      title="Dondurmaq / Deaktiv etmək üçün klikləyin"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                      <span>Aktiv</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleTogglePromocodeStatus(item.id, true)}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-bold hover:bg-white/10 transition-all cursor-pointer"
                                      title="Aktivləşdirmək üçün klikləyin"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                                      <span>Deaktiv</span>
                                    </button>
                                  )}
                                </td>

                                {/* 6. Son Tarix */}
                                <td className="py-3.5 px-4 font-mono text-xs">
                                  {item.expires_at ? (
                                    <div className="space-y-0.5">
                                      <span
                                        className={
                                          isExpired ? 'text-rose-400 line-through' : 'text-gray-300'
                                        }
                                      >
                                        {new Date(item.expires_at).toLocaleDateString('az-AZ', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                        })}
                                      </span>
                                      {isExpired && (
                                        <span className="block text-[10px] font-bold text-rose-400 uppercase">
                                          Vaxtı bitib
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 flex items-center gap-1 font-medium">
                                      <InfinityIcon size={12} className="text-cyan-400" />
                                      <span>Müddətsiz</span>
                                    </span>
                                  )}
                                </td>

                                {/* 7. Əməliyyatlar (Düzəliş et, Sil) */}
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingPromocode(item);
                                        setIsPromocodeModalOpen(true);
                                      }}
                                      className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                                      title="Düzəliş et"
                                    >
                                      <Pencil size={14} />
                                    </button>

                                    <button
                                      type="button"
                                      disabled={isDeleting}
                                      onClick={() => handleDeletePromocode(item.id, item.code)}
                                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-colors cursor-pointer disabled:opacity-40"
                                      title="Promokodu Sil"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: BİLDİRİŞLƏRİN İDARƏ EDİLMƏSİ (NOTIFICATIONS)                          */}
          {/* ========================================================================= */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* Header with Title, Count and "Yeni Bildiriş Göndər" button */}
              <div className="p-6 rounded-3xl bg-[#12141c] border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                      <Bell size={20} />
                    </span>
                    <h2 className="text-xl font-bold text-white font-syne">
                      Bildirişlərin İdarə Edilməsi
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-bold">
                      {notifications.length} bildiriş
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    İstifadəçilərə göndərilmiş bildirişlərin tarixçəsi və yeni fərdi/ümumi bildiriş göndərmək
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsNotificationModalOpen(true)}
                    className="flex-1 md:flex-none px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-black text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Yeni Bildiriş Göndər</span>
                  </button>

                  <button
                    type="button"
                    onClick={loadNotifications}
                    disabled={loadingNotifications}
                    className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                    title="Yenilə"
                  >
                    <RefreshCw size={16} className={loadingNotifications ? 'animate-spin text-cyan-400' : ''} />
                  </button>
                </div>
              </div>

              {/* Feedback Alert */}
              {notificationFeedback && (
                <div
                  className={`p-4 rounded-2xl border text-xs flex items-center gap-3 ${
                    notificationFeedback.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {notificationFeedback.type === 'success' ? (
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle size={16} className="text-rose-400 shrink-0" />
                  )}
                  <span>{notificationFeedback.message}</span>
                </div>
              )}

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={notificationSearchQuery}
                    onChange={(e) => setNotificationSearchQuery(e.target.value)}
                    placeholder="Başlıq, məzmun və ya istifadəçi ilə axtar..."
                    className="w-full pl-10 pr-9 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                  {notificationSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setNotificationSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 shrink-0">
                  {[
                    { id: 'all', label: 'Hamısı' },
                    { id: 'broadcast', label: 'Bütün İstifadəçilər' },
                    { id: 'personal', label: 'Şəxsi' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setNotificationFilterType(f.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        notificationFilterType === f.id
                          ? 'bg-cyan-500 text-gray-950 font-bold shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notifications Table (Tarixçə) */}
              {loadingNotifications ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400 text-xs">
                  <RefreshCw size={24} className="animate-spin text-cyan-400" />
                  <span>Bildirişlər yüklənir...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 rounded-3xl bg-[#12141c] border border-white/10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                    <Bell size={28} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Hələ heç bir bildiriş göndərilməyib</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                      "Yeni Bildiriş Göndər" düyməsinə klikləyərək istifadəçilərə kampaniya, endirim və ya sistem bildirişi göndərin.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNotificationModalOpen(true)}
                    className="px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-2"
                  >
                    <Plus size={15} />
                    <span>İlk Bildirişi Göndər</span>
                  </button>
                </div>
              ) : (
                <div className="bg-[#12141c] border border-white/10 rounded-3xl shadow-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-300">
                      <thead className="bg-white/[0.03] text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-white/10">
                        <tr>
                          <th className="py-3 px-4 w-12 text-center">İkon</th>
                          <th className="py-3 px-4">Başlıq</th>
                          <th className="py-3 px-4 min-w-[220px]">Mahiyyət (Məzmun)</th>
                          <th className="py-3 px-4">Kimə Göndərilib</th>
                          <th className="py-3 px-4">Tarix</th>
                          <th className="py-3 px-4 text-right">Əməliyyat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {notifications
                          .filter((item) => {
                            // Search filter
                            if (notificationSearchQuery.trim()) {
                              const q = notificationSearchQuery.toLowerCase();
                              const matchTitle = item.title.toLowerCase().includes(q);
                              const matchContent = item.content.toLowerCase().includes(q);
                              const matchUser =
                                item.profiles?.first_name?.toLowerCase().includes(q) ||
                                item.profiles?.last_name?.toLowerCase().includes(q) ||
                                item.profiles?.user_code?.includes(q) ||
                                item.profiles?.email?.toLowerCase().includes(q);
                              if (!matchTitle && !matchContent && !matchUser) return false;
                            }
                            // Type filter
                            if (notificationFilterType === 'broadcast') return !item.user_id;
                            if (notificationFilterType === 'personal') return Boolean(item.user_id);
                            return true;
                          })
                          .map((item) => {
                            const isDeleting = deletingNotificationId === item.id;

                            return (
                              <tr
                                key={item.id}
                                className="hover:bg-white/[0.02] transition-colors"
                              >
                                {/* 1. İkon */}
                                <td className="py-3.5 px-4 text-center">
                                  <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/15 bg-white/5 flex items-center justify-center mx-auto shrink-0">
                                    {item.icon_url ? (
                                      <img
                                        src={item.icon_url}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Bell size={16} className="text-cyan-400" />
                                    )}
                                  </div>
                                </td>

                                {/* 2. Başlıq */}
                                <td className="py-3.5 px-4 font-bold text-white max-w-[180px]">
                                  <span className="line-clamp-2">{item.title}</span>
                                </td>

                                {/* 3. Mahiyyət / Məzmun */}
                                <td className="py-3.5 px-4 text-gray-300 max-w-xs">
                                  <p className="line-clamp-2 leading-relaxed text-xs">
                                    {item.content}
                                  </p>
                                </td>

                                {/* 4. Kimə Göndərilib */}
                                <td className="py-3.5 px-4">
                                  {!item.user_id ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold">
                                      <Users size={12} />
                                      <span>Bütün İstifadəçilərə</span>
                                    </span>
                                  ) : (
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold shrink-0">
                                        <User size={11} />
                                        <span>Şəxsi</span>
                                      </span>
                                      <div className="min-w-0">
                                        <p className="text-xs text-white font-medium truncate max-w-[130px]">
                                          {item.profiles?.first_name} {item.profiles?.last_name || ''}
                                        </p>
                                        {item.profiles?.user_code && (
                                          <span className="font-mono text-[10px] text-gray-500">
                                            #{item.profiles.user_code}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {/* 5. Tarix */}
                                <td className="py-3.5 px-4 text-gray-400 font-mono text-[11px] whitespace-nowrap">
                                  {new Date(item.created_at).toLocaleString('az-AZ', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </td>

                                {/* 6. Əməliyyat (Sil) */}
                                <td className="py-3.5 px-4 text-right">
                                  <button
                                    type="button"
                                    disabled={isDeleting}
                                    onClick={() => handleDeleteNotification(item.id, item.title)}
                                    className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-colors cursor-pointer disabled:opacity-40"
                                    title="Bildirişi Sil"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="p-8 rounded-3xl bg-[#12141c] border border-white/10 shadow-xl text-center">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4 text-cyan-400">
                  <ShoppingCart size={32} />
                </div>
                <h3 className="text-xl font-bold text-white font-syne mb-2">Sifarişlərin İdarə Edilməsi</h3>
                <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
                  Supabase-dəki <span className="font-mono text-cyan-400">orders</span> və{' '}
                  <span className="font-mono text-cyan-400">order_items</span> cədvəlləri hazırlandıqda sifariş statusları və çatdırılma buradan idarə olunacaq.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-300">
                  <Clock size={13} className="text-cyan-400" /> Modul statusu: Hazırlanır
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
           * 4. USER LIBRARIES VIEW (İSTİFADƏÇİ KİTABXANALARI)
           * ========================================================================= */}
          {activeTab === 'libraries' && (
            <div className="space-y-6">
              {/* Header Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#12141c] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-medium">Kitabxana Qeydləri</span>
                    <BookOpen size={16} className="text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold text-white font-syne">{userLibraries.length}</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#12141c] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-medium">Aktiv İstifadəçilər</span>
                    <Users size={16} className="text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold text-white font-syne">
                    {new Set(userLibraries.map((l) => l.user_id)).size}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#12141c] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-medium">Baza Əlaqəsi</span>
                    <ShieldCheck size={16} className="text-emerald-400" />
                  </div>
                  <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> user_library ⇄ products
                  </div>
                </div>
              </div>

              {/* Feedback toast / alert */}
              {libraryFeedback && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-medium ${
                    libraryFeedback.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}
                >
                  {libraryFeedback.type === 'success' ? (
                    <CheckCircle2 size={16} className="shrink-0" />
                  ) : (
                    <AlertCircle size={16} className="shrink-0" />
                  )}
                  <span>{libraryFeedback.message}</span>
                </div>
              )}

              {/* Main Table Card */}
              <div className="p-6 rounded-3xl bg-[#12141c] border border-white/10 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <h3 className="text-base font-bold text-white font-syne flex items-center gap-2">
                      <BookOpen size={18} className="text-cyan-400" />
                      İstifadəçi Kitabxanaları
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      İstifadəçilərin əldə etdiyi və şəxsi kitabxanalarında mövcud olan məhsullar
                    </p>
                  </div>

                  {/* Search box & Refresh */}
                  <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        value={librarySearchQuery}
                        onChange={(e) => setLibrarySearchQuery(e.target.value)}
                        placeholder="İstifadəçi ID və ya məhsul adı..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-cyan-500"
                      />
                      <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
                    </div>

                    <button
                      type="button"
                      onClick={loadUserLibraries}
                      disabled={loadingLibraries}
                      title="Kitabxanaları yenilə"
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
                    >
                      <RefreshCw size={15} className={loadingLibraries ? 'animate-spin text-cyan-400' : ''} />
                    </button>
                  </div>
                </div>

                {loadingLibraries ? (
                  <div className="py-16 flex flex-col items-center justify-center text-gray-400 gap-3">
                    <RefreshCw size={24} className="animate-spin text-cyan-400" />
                    <span className="text-sm font-medium">İstifadəçi kitabxanaları bazadan yüklənir...</span>
                  </div>
                ) : filteredUserLibraries.length === 0 ? (
                  <div className="py-16 border border-dashed border-white/10 rounded-2xl text-center">
                    <BookOpen size={36} className="mx-auto text-gray-600 mb-3" />
                    <h4 className="text-sm font-semibold text-gray-300 mb-1">Kitabxana qeydi tapılmadı</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      {librarySearchQuery
                        ? 'Axtarışa uyğun istifadəçi və ya məhsul tapılmadı.'
                        : 'Hələ heç bir istifadəçi məhsul əldə etməyib və ya kitabxana cədvəli boşdur.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-white/10">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-black/40 text-[11px] uppercase tracking-wider text-gray-400 border-b border-white/10 font-mono">
                        <tr>
                          <th className="py-3 px-4">İstifadəçi (Ad, Soyad)</th>
                          <th className="py-3 px-4">8 Rəqəmli ID / UID</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Məhsul Şəkli</th>
                          <th className="py-3 px-4">Məhsulun Adı</th>
                          <th className="py-3 px-4">Əlavə Olunma Tarixi</th>
                          <th className="py-3 px-4 text-right">Əməliyyatlar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-sans">
                        {filteredUserLibraries.map((item) => {
                          const prod = Array.isArray(item.products)
                            ? item.products[0]
                            : item.products;
                          const prof = item.profile;
                          const acquiredDate = item.acquired_at || item.created_at;

                          return (
                            <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                              {/* 1. İstifadəçi (Ad, Soyad) */}
                              <td className="py-3.5 px-4 font-semibold text-white">
                                {prof?.first_name || prof?.last_name ? (
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                                      {(prof.first_name?.[0] || 'U').toUpperCase()}
                                    </div>
                                    <div className="space-y-0.5">
                                      <div className="text-sm font-bold text-white leading-tight">
                                        {prof.first_name || ''} {prof.last_name || ''}
                                      </div>
                                      {prof.balance !== undefined && (
                                        <div className="text-[10px] text-gray-400">
                                          Balans: <span className="text-cyan-400 font-semibold">{prof.balance.toFixed(2)} ₼</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">Profil tapılmadı</span>
                                )}
                              </td>

                              {/* 2. 8 Rəqəmli ID və UID */}
                              <td className="py-3.5 px-4 font-mono text-xs">
                                <div className="space-y-1">
                                  {prof?.user_code ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold">
                                      #{prof.user_code}
                                    </span>
                                  ) : (
                                    <span className="text-gray-500 text-[11px]">—</span>
                                  )}
                                  <div className="text-[10px] text-gray-500 font-mono truncate max-w-[130px]" title={item.user_id}>
                                    UID: {item.user_id.slice(0, 8)}...
                                  </div>
                                </div>
                              </td>

                              {/* 3. Email */}
                              <td className="py-3.5 px-4 text-xs font-mono text-gray-300">
                                {prof?.email ? (
                                  <span className="text-cyan-300/90 font-mono text-xs">{prof.email}</span>
                                ) : (
                                  <span className="text-gray-500">—</span>
                                )}
                              </td>

                              {/* 4. Məhsulun kiçik şəkli */}
                              <td className="py-3.5 px-4">
                                {prod?.image_url ? (
                                  <img
                                    src={prod.image_url}
                                    alt={prod.title || 'Məhsul'}
                                    className="w-10 h-10 rounded-xl object-cover bg-black/40 border border-white/10 shrink-0"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
                                    <ImageIcon size={18} />
                                  </div>
                                )}
                              </td>

                              {/* 5. Məhsulun adı və Gizli məzmun indikatoru */}
                              <td className="py-3.5 px-4 font-semibold text-white">
                                <div className="space-y-0.5">
                                  <div className="text-sm font-bold text-gray-100">
                                    {prod?.title || <span className="text-gray-500 italic">Məhsul tapılmadı</span>}
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] font-mono text-gray-500">
                                    {prod?.price !== undefined && (
                                      <span className="text-cyan-400 font-semibold">{prod.price} ₼</span>
                                    )}
                                    {prod?.secret_content ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                                        <Key size={10} /> Gizli məzmun var
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-amber-400/80 italic">Açar yoxdur</span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* 6. Əlavə olunma tarixi (acquired_at) */}
                              <td className="py-3.5 px-4 text-xs text-gray-300 font-mono">
                                {acquiredDate ? (
                                  <div className="flex flex-col">
                                    <span className="text-gray-200">
                                      {new Date(acquiredDate).toLocaleDateString('az-AZ')}
                                    </span>
                                    <span className="text-[10px] text-gray-500">
                                      {new Date(acquiredDate).toLocaleTimeString('az-AZ', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-500">—</span>
                                )}
                              </td>

                              {/* 7. Əməliyyatlar (Düzəliş et & Sil) */}
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditLibraryProduct(item)}
                                    title="Düzəliş et (Gizli məzmun və məhsul)"
                                    className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 transition-all inline-flex items-center justify-center cursor-pointer"
                                  >
                                    <Pencil size={15} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUserLibrary(item.id, prod?.title)}
                                    disabled={libraryActionLoading === item.id}
                                    title="Kitabxanadan Sil"
                                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-all inline-flex items-center justify-center disabled:opacity-40 cursor-pointer"
                                  >
                                    {libraryActionLoading === item.id ? (
                                      <RefreshCw size={15} className="animate-spin" />
                                    ) : (
                                      <Trash2 size={15} />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
           * 5. WISHLIST VIEW (İSTƏK SİYAHISI - READ ONLY ANALİTİKA)
           * ========================================================================= */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              {/* Header Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#12141c] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-medium">Cəmi İstək Qeydi</span>
                    <Heart size={16} className="text-rose-400 fill-rose-400/20" />
                  </div>
                  <div className="text-2xl font-bold text-white font-syne">{wishlistItems.length}</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#12141c] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-medium">Maraqlanan Müştərilər</span>
                    <Users size={16} className="text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold text-white font-syne">
                    {new Set(wishlistItems.map((w) => w.user_id)).size}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#12141c] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-medium">Arzulanan Məhsul Sayı</span>
                    <Package size={16} className="text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-white font-syne">
                    {new Set(wishlistItems.map((w) => w.product_id)).size}
                  </div>
                </div>
              </div>

              {/* Main Table Card */}
              <div className="p-6 rounded-3xl bg-[#12141c] border border-white/10 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <h3 className="text-base font-bold text-white font-syne flex items-center gap-2">
                      <Heart size={18} className="text-rose-400 fill-rose-400/20" />
                      Müştəri İstək Siyahıları (Wishlist)
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Müştərilərin maraq göstərdiyi və bəyəndiyi məhsulların analitik siyahısı (Promokod və təkliflər üçün)
                    </p>
                  </div>

                  {/* Search box & Refresh */}
                  <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        value={wishlistSearchQuery}
                        onChange={(e) => setWishlistSearchQuery(e.target.value)}
                        placeholder="Müştəri adı, email və ya məhsul..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-cyan-500"
                      />
                      <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
                    </div>

                    <button
                      type="button"
                      onClick={loadWishlistItems}
                      disabled={loadingWishlist}
                      title="İstək siyahısını yenilə"
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
                    >
                      <RefreshCw size={15} className={loadingWishlist ? 'animate-spin text-cyan-400' : ''} />
                    </button>
                  </div>
                </div>

                {loadingWishlist ? (
                  <div className="py-16 flex flex-col items-center justify-center text-gray-400 gap-3">
                    <RefreshCw size={24} className="animate-spin text-cyan-400" />
                    <span className="text-sm font-medium">İstək siyahısı bazadan yüklənir...</span>
                  </div>
                ) : filteredWishlistItems.length === 0 ? (
                  <div className="py-16 border border-dashed border-white/10 rounded-2xl text-center">
                    <Heart size={36} className="mx-auto text-gray-600 mb-3" />
                    <h4 className="text-sm font-semibold text-gray-300 mb-1">Heç bir istək qeydi tapılmadı</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      {wishlistSearchQuery
                        ? 'Axtarışa uyğun istifadəçi və ya arzulanan məhsul tapılmadı.'
                        : 'Hələ heç bir müştəri məhsulları seçilmişlərə əlavə etməyib.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-white/10">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-black/40 text-[11px] uppercase tracking-wider text-gray-400 border-b border-white/10 font-mono">
                        <tr>
                          <th className="py-3 px-4">İstifadəçi</th>
                          <th className="py-3 px-4">Arzuladığı Məhsul</th>
                          <th className="py-3 px-4">Tarix</th>
                          <th className="py-3 px-4 text-right">Analitika Statusu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-sans">
                        {filteredWishlistItems.map((item) => {
                          const prod = Array.isArray(item.products)
                            ? item.products[0]
                            : item.products;
                          const prof = item.profile;
                          const dateVal = item.added_at || item.created_at;

                          return (
                            <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                              {/* 1. İstifadəçi: (Adı, Emaili və ya 8 rəqəmli ID-si) */}
                              <td className="py-3.5 px-4 font-semibold text-white">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                                    {(prof?.first_name?.[0] || 'U').toUpperCase()}
                                  </div>
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-sm font-bold text-white">
                                        {prof?.first_name || prof?.last_name
                                          ? `${prof?.first_name || ''} ${prof?.last_name || ''}`
                                          : 'İstifadəçi'}
                                      </span>
                                      {prof?.user_code && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] font-bold">
                                          #{prof.user_code}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs font-mono text-cyan-300/80">
                                      {prof?.email || <span className="text-gray-500">Email qeyd olunmayıb</span>}
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-mono truncate max-w-[140px]" title={item.user_id}>
                                      UID: {item.user_id.slice(0, 8)}...
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* 2. Arzuladığı Məhsul: (Məhsulun kiçik şəkli və adı) */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  {prod?.image_url ? (
                                    <img
                                      src={prod.image_url}
                                      alt={prod.title || 'Məhsul'}
                                      className="w-10 h-10 rounded-xl object-cover bg-black/40 border border-white/10 shrink-0"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 shrink-0">
                                      <ImageIcon size={18} />
                                    </div>
                                  )}
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="text-sm font-bold text-gray-100 truncate max-w-[200px] sm:max-w-xs">
                                      {prod?.title || <span className="text-gray-500 italic">Məhsul mövcud deyil</span>}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400">
                                      {prod?.price !== undefined && (
                                        <span className="text-cyan-400 font-semibold">{prod.price} ₼</span>
                                      )}
                                      <span className="text-gray-500 text-[10px]">
                                        ID: {item.product_id ? `${item.product_id.slice(0, 8)}...` : '—'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* 3. Tarix: (Seçilmişlərə əlavə etdiyi tarix) */}
                              <td className="py-3.5 px-4 text-xs text-gray-300 font-mono whitespace-nowrap">
                                {dateVal ? (
                                  <div className="flex flex-col">
                                    <span className="text-gray-200">
                                      {new Date(dateVal).toLocaleDateString('az-AZ')}
                                    </span>
                                    <span className="text-[10px] text-gray-500">
                                      {new Date(dateVal).toLocaleTimeString('az-AZ', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-500">—</span>
                                )}
                              </td>

                              {/* 4. Analitika Statusu (Read-Only - Sətrin sonunda Sil və ya Redaktə et düymələri yoxdur) */}
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                                  <Heart size={12} className="fill-rose-500 text-rose-500" />
                                  <span>Bəyənilib</span>
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
           * 6. REVIEWS VIEW (RƏYLƏRİN İDARƏEDİLMƏSİ - DELETE DÜYMƏSİ İLƏ)
           * ========================================================================= */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {/* Header Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#12141c] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-medium">Cəmi Rəy</span>
                    <MessageSquare size={16} className="text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold text-white font-syne">{adminReviews.length}</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#12141c] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-medium">Orta Reytinq</span>
                    <Star size={16} className="text-amber-400 fill-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-white font-syne flex items-center gap-1.5">
                    {adminReviews.length > 0
                      ? (
                          adminReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) /
                          adminReviews.length
                        ).toFixed(1)
                      : '5.0'}
                    <span className="text-xs text-gray-400 font-normal">/ 5.0</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#12141c] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-medium">Rəy Yazan Müştərilər</span>
                    <Users size={16} className="text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-white font-syne">
                    {new Set(adminReviews.map((r) => r.user_id)).size}
                  </div>
                </div>
              </div>

              {/* Main Table Card */}
              <div className="p-6 rounded-3xl bg-[#12141c] border border-white/10 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <h3 className="text-base font-bold text-white font-syne flex items-center gap-2">
                      <MessageSquare size={18} className="text-cyan-400" />
                      Müştəri Rəylərinin İdarəedilməsi
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      İstifadəçilərin məhsullara yazdığı bütün rəylərin moderasiyası və silinməsi
                    </p>
                  </div>

                  {/* Search box & Refresh */}
                  <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        value={reviewSearchQuery}
                        onChange={(e) => setReviewSearchQuery(e.target.value)}
                        placeholder="Müştəri adı, email, məhsul və ya rəy..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-cyan-500"
                      />
                      <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
                    </div>

                    <button
                      type="button"
                      onClick={loadAdminReviews}
                      disabled={loadingReviews}
                      title="Rəyləri yenilə"
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
                    >
                      <RefreshCw size={15} className={loadingReviews ? 'animate-spin text-cyan-400' : ''} />
                    </button>
                  </div>
                </div>

                {loadingReviews ? (
                  <div className="py-16 flex flex-col items-center justify-center text-gray-400 gap-3">
                    <RefreshCw size={24} className="animate-spin text-cyan-400" />
                    <span className="text-sm font-medium">Rəylər bazadan yüklənir...</span>
                  </div>
                ) : filteredAdminReviews.length === 0 ? (
                  <div className="py-16 border border-dashed border-white/10 rounded-2xl text-center">
                    <MessageSquare size={36} className="mx-auto text-gray-600 mb-3" />
                    <h4 className="text-sm font-semibold text-gray-300 mb-1">Heç bir rəy tapılmadı</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      {reviewSearchQuery
                        ? 'Axtarış parametrinə uyğun heç bir müştəri rəyi tapılmadı.'
                        : 'Hələlik heç bir məhsula rəy bildirilməyib.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-white/10">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-black/40 text-[11px] uppercase tracking-wider text-gray-400 border-b border-white/10 font-mono">
                        <tr>
                          <th className="py-3 px-4">İstifadəçi</th>
                          <th className="py-3 px-4">Məhsul</th>
                          <th className="py-3 px-4">Ulduz və Rəy</th>
                          <th className="py-3 px-4">Tarix</th>
                          <th className="py-3 px-4 text-right">Əməliyyat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-sans">
                        {filteredAdminReviews.map((item) => {
                          const prod = Array.isArray(item.products)
                            ? item.products[0]
                            : item.products;
                          const prof = item.profile;
                          const starRating = Number(item.rating) || 5;

                          return (
                            <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                              {/* 1. İstifadəçi (Adı və ya Emaili) */}
                              <td className="py-3.5 px-4 font-semibold text-white">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                                    {(prof?.first_name?.[0] || 'U').toUpperCase()}
                                  </div>
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-sm font-bold text-white">
                                        {prof?.first_name || prof?.last_name
                                          ? `${prof?.first_name || ''} ${prof?.last_name || ''}`
                                          : 'İstifadəçi'}
                                      </span>
                                      {prof?.user_code && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] font-bold">
                                          #{prof.user_code}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs font-mono text-cyan-300/80">
                                      {prof?.email || <span className="text-gray-500">Email qeyd olunmayıb</span>}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* 2. Məhsul (Məhsulun kiçik şəkli və adı) */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  {prod?.image_url ? (
                                    <img
                                      src={prod.image_url}
                                      alt={prod.title || 'Məhsul'}
                                      className="w-10 h-10 rounded-xl object-cover bg-black/40 border border-white/10 shrink-0"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 shrink-0">
                                      <ImageIcon size={18} />
                                    </div>
                                  )}
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="text-sm font-bold text-gray-100 truncate max-w-[180px] sm:max-w-xs">
                                      {prod?.title || <span className="text-gray-500 italic">Məhsul mövcud deyil</span>}
                                    </div>
                                    {prod?.price !== undefined && (
                                      <div className="text-[11px] font-mono text-cyan-400 font-semibold">
                                        {prod.price} ₼
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* 3. Ulduz və Rəy (Verdiyi 1-5 ulduz vizual olaraq və yazdığı mətn) */}
                              <td className="py-3.5 px-4 max-w-sm">
                                <div className="space-y-1.5">
                                  {/* Ulduzlar */}
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        size={13}
                                        className={
                                          star <= starRating
                                            ? 'fill-amber-400 text-amber-400'
                                            : 'text-gray-600'
                                        }
                                      />
                                    ))}
                                    <span className="ml-1.5 text-xs font-mono font-bold text-amber-400">
                                      {starRating}.0
                                    </span>
                                  </div>

                                  {/* Mətn */}
                                  <p className="text-xs text-gray-200 leading-relaxed bg-white/[0.03] p-2.5 rounded-xl border border-white/5 break-words">
                                    {item.comment || <span className="text-gray-500 italic">Rəy mətni yazılmayıb</span>}
                                  </p>
                                </div>
                              </td>

                              {/* 4. Tarix (Rəyin yazıldığı tarix) */}
                              <td className="py-3.5 px-4 text-xs text-gray-300 font-mono whitespace-nowrap">
                                {item.created_at ? (
                                  <div className="flex flex-col">
                                    <span className="text-gray-200">
                                      {new Date(item.created_at).toLocaleDateString('az-AZ')}
                                    </span>
                                    <span className="text-[10px] text-gray-500">
                                      {new Date(item.created_at).toLocaleTimeString('az-AZ', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-500">—</span>
                                )}
                              </td>

                              {/* 5. Silmə Funksiyası (DELETE - ƏN VACİB) */}
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReview(item.id)}
                                  disabled={deletingReviewId === item.id}
                                  title="Bu rəyi birdəfəlik sil"
                                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-all inline-flex items-center justify-center disabled:opacity-40 cursor-pointer shadow-sm"
                                >
                                  {deletingReviewId === item.id ? (
                                    <RefreshCw size={15} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={15} />
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Edit Library Product & Secret Content Modal */}
      {editingLibraryProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            onClick={() => {
              if (!savingLibraryProduct) setEditingLibraryProduct(null);
            }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Dialog Container */}
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#12141c] border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl z-10 p-6 sm:p-7 space-y-5 text-white">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                  <Pencil size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-syne">
                    Məhsul və Gizli Məzmunun Redaktəsi
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    İstifadəçi: {editingLibraryProduct.userProfile ? `${editingLibraryProduct.userProfile.first_name || ''} ${editingLibraryProduct.userProfile.last_name || ''} (${editingLibraryProduct.userProfile.user_code ? '#' + editingLibraryProduct.userProfile.user_code : ''})` : editingLibraryProduct.userId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingLibraryProduct(null)}
                disabled={savingLibraryProduct}
                className="p-1.5 rounded-xl opacity-60 hover:opacity-100 hover:bg-white/10 text-gray-300 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {libraryEditFeedback && (
              <div
                className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-medium ${
                  libraryEditFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                {libraryEditFeedback.type === 'success' ? (
                  <CheckCircle2 size={16} className="shrink-0" />
                ) : (
                  <AlertCircle size={16} className="shrink-0" />
                )}
                <span>{libraryEditFeedback.message}</span>
              </div>
            )}

            {/* Edit Form */}
            <form onSubmit={handleSaveLibraryProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Məhsulun Adı (Title)
                  </label>
                  <input
                    type="text"
                    required
                    value={editingLibraryProduct.title}
                    onChange={(e) =>
                      setEditingLibraryProduct({ ...editingLibraryProduct, title: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Qiymət (₼)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingLibraryProduct.price}
                    onChange={(e) =>
                      setEditingLibraryProduct({ ...editingLibraryProduct, price: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Məhsul Şəkli (Image URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={editingLibraryProduct.imageUrl}
                    onChange={(e) =>
                      setEditingLibraryProduct({ ...editingLibraryProduct, imageUrl: e.target.value })
                    }
                    placeholder="https://..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500 font-mono text-xs"
                  />
                  {editingLibraryProduct.imageUrl && (
                    <img
                      src={editingLibraryProduct.imageUrl}
                      alt="Önizləmə"
                      className="w-10 h-10 rounded-xl object-cover bg-black/40 border border-white/10 shrink-0"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Təsvir (Description)
                </label>
                <textarea
                  rows={2}
                  value={editingLibraryProduct.description}
                  onChange={(e) =>
                    setEditingLibraryProduct({ ...editingLibraryProduct, description: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              {/* GİZLİ MƏZMUN (SECRET_CONTENT) INPUTU */}
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400">
                    <Key size={14} /> Gizli Məzmun / Açarlar (secret_content)
                  </label>
                  <span className="text-[10px] text-gray-400 font-mono">
                    Yalnız alan istifadəçiyə görünür
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Bu məhsul üçün istifadəçinin "Kitabxanam" səhifəsində açılan xüsusi lisenziya açarları, endirmə keçidləri, giriş məlumatları və ya təlimatlar.
                </p>
                <textarea
                  rows={6}
                  value={editingLibraryProduct.secretContent}
                  onChange={(e) =>
                    setEditingLibraryProduct({
                      ...editingLibraryProduct,
                      secretContent: e.target.value,
                    })
                  }
                  placeholder="Lisenziya açarı, fayl linkləri və ya gizli mətn daxil edin..."
                  className="w-full p-3 rounded-xl bg-black/60 border border-cyan-500/30 text-cyan-200 placeholder-gray-600 font-mono text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 resize-y"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  disabled={savingLibraryProduct}
                  onClick={() => setEditingLibraryProduct(null)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
                >
                  Ləğv et
                </button>

                <button
                  type="submit"
                  disabled={savingLibraryProduct}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {savingLibraryProduct ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Yadda saxlanılır...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Yadda Saxla (Supabase-də Yenilə)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Send Modal */}
      {isNotificationModalOpen && (
        <NotificationSendModal
          isOpen={isNotificationModalOpen}
          onClose={() => setIsNotificationModalOpen(false)}
          onSent={() => {
            loadNotifications();
          }}
        />
      )}

      {/* Promocode Add / Edit Modal */}
      {isPromocodeModalOpen && (
        <PromocodeEditModal
          isOpen={isPromocodeModalOpen}
          editingPromocode={editingPromocode}
          onClose={() => {
            setIsPromocodeModalOpen(false);
            setEditingPromocode(null);
          }}
          onSaved={() => {
            loadPromocodes();
          }}
        />
      )}

      {/* Ad Add / Edit Modal */}
      {isAdModalOpen && (
        <AdEditModal
          isOpen={isAdModalOpen}
          editingAd={editingAd}
          onClose={() => {
            setIsAdModalOpen(false);
            setEditingAd(null);
          }}
          onSaved={() => {
            loadProductAds();
          }}
        />
      )}

      {/* Image Cropper Modal (1:1 Kvadrat nisbətində kəsmə) */}
      {isCropperOpen && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          imageSrc={imageToCrop}
          onClose={() => setIsCropperOpen(false)}
          onCropComplete={handleCropComplete}
          cropShape="square"
          title={cropperTarget === 'category' ? 'Kateqoriya İkonunu Kəs (1:1)' : 'Məhsul Şəklini Kəs (1:1)'}
          subtitle="Kvadrat (1:1) çərçivəyə uyğunlaşdırın"
        />
      )}
    </div>
  );
}
