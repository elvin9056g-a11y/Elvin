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
} from 'lucide-react';
import { supabase, uploadChatMediaToSupabase, uploadAssetToSupabase } from '../../lib/supabase';
import { ImageCropperModal } from '../home/ImageCropperModal';

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

  // Dashboard Navigation State: 'products' | 'categories' | 'orders'
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'orders'>('products');

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

  // 2. Fetch categories and products once 2FA verified
  useEffect(() => {
    if (isVerifiedAdmin) {
      loadCategories();
      loadProducts();
    }
  }, [isVerifiedAdmin]);

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

  const handleRefreshAll = () => {
    loadCategories();
    loadProducts();
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
            disabled={loadingProducts || loadingCategories}
            title="Məlumatları yenilə"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5"
          >
            <RefreshCw
              size={14}
              className={loadingProducts || loadingCategories ? 'animate-spin text-cyan-400' : ''}
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

                            {/* Price */}
                            <td className="py-3.5 px-4 font-mono font-semibold text-cyan-400 text-sm">
                              {Number(prod.price || 0).toFixed(2)} ₼
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
           * 3. ORDERS TAB (PLACEHOLDER)
           * ========================================================================= */}
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
        </main>
      </div>

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
