import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Box,
  Layers,
  Search,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ProductItem {
  id: string | number;
  title: string;
  description?: string | null;
  base_price: number;
  image_url?: string | null;
  category_id?: string | null;
  created_at?: string;
  is_active?: boolean;
}

export function AdminDashboard() {
  // Authentication & 2FA State
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [isVerifiedAdmin, setIsVerifiedAdmin] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Dashboard Navigation State
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');

  // Products Management State
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [productActionLoading, setProductActionLoading] = useState<string | number | null>(null);

  // New Product Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  // 2. Fetch products once verified
  useEffect(() => {
    if (isVerifiedAdmin) {
      loadProducts();
    }
  }, [isVerifiedAdmin]);

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
      // Query store_admins table exactly as specified
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

  // 4. Handle Add New Product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    if (!title.trim()) {
      setFormFeedback({ type: 'error', message: 'Product title is required.' });
      return;
    }

    const parsedPrice = parseFloat(basePrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setFormFeedback({ type: 'error', message: 'Please enter a valid positive base price.' });
      return;
    }

    setSubmittingProduct(true);
    try {
      const payload: Record<string, any> = {
        title: title.trim(),
        description: description.trim() || null,
        base_price: parsedPrice,
        image_url: imageUrl.trim() || null,
      };

      const { data, error } = await supabase
        .from('products')
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setFormFeedback({ type: 'success', message: 'Product added successfully!' });
      setTitle('');
      setDescription('');
      setBasePrice('');
      setImageUrl('');

      // Add to local state or refresh
      if (data) {
        setProducts((prev) => [data, ...prev]);
      } else {
        loadProducts();
      }

      // Auto-clear success message after 4s
      setTimeout(() => {
        setFormFeedback(null);
      }, 4000);
    } catch (err: any) {
      console.error('Error inserting product:', err);
      setFormFeedback({
        type: 'error',
        message: err.message || 'Failed to add product to database.',
      });
    } finally {
      setSubmittingProduct(false);
    }
  };

  // 5. Handle Delete Product
  const handleDeleteProduct = async (productId: string | number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    setProductActionLoading(productId);
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);

      if (error) {
        alert(`Failed to delete product: ${error.message}`);
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      }
    } catch (err: any) {
      console.error('Error deleting product:', err);
      alert(`Unexpected error deleting product: ${err.message}`);
    } finally {
      setProductActionLoading(null);
    }
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

  // =========================================================================
  // VIEW 1: LOADING STATE
  // =========================================================================
  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-[#0a0c10] text-gray-200 flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium tracking-wide text-gray-400">
            Checking security credentials...
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
            <ArrowLeft size={16} /> Return to Lumora
          </button>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            <Lock size={12} /> Restricted Access
          </div>
        </div>

        <div className="w-full max-w-md mx-auto my-auto p-8 rounded-3xl bg-[#12141a]/95 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-6 text-cyan-400 shadow-inner">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 font-syne tracking-tight">
            Secure Admin Portal
          </h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Please login to access this page. This administrative route requires verified store credentials.
          </p>
          <button
            onClick={handleExitAdmin}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
          >
            Proceed to Login <ChevronRight size={16} />
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
        {/* Top Header */}
        <div className="flex items-center justify-between max-w-5xl w-full mx-auto">
          <button
            onClick={handleExitAdmin}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Exit to Store
          </button>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <ShieldAlert size={12} /> Double Lock 2FA Required
          </div>
        </div>

        {/* 2FA Card */}
        <div className="w-full max-w-md mx-auto my-auto p-8 rounded-3xl bg-[#12141a]/95 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5 text-amber-400">
            <Key size={28} />
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white mb-1.5 font-syne tracking-tight">
              Admin 2FA Verification
            </h2>
            <p className="text-xs text-gray-400">
              Authenticated user: <span className="text-cyan-400 font-mono">{user.email}</span>
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
                  placeholder="Enter secret key..."
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
                  <RefreshCw size={16} className="animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} /> Verify & Unlock Dashboard
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
              Cancel and return to store
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
              Connected as <span className="text-gray-300 font-mono">{user.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={loadProducts}
            disabled={loadingProducts}
            title="Refresh product data"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={loadingProducts ? 'animate-spin text-cyan-400' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleExitAdmin}
            className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-medium transition-all flex items-center gap-1.5"
          >
            <LogOut size={14} />
            <span>Exit Admin</span>
          </button>
        </div>
      </header>

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-[#0e1017]/70 border-b md:border-b-0 md:border-r border-white/10 p-4 shrink-0">
          <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold px-3 mb-2">
            Navigation
          </div>
          <nav className="space-y-1">
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
                <span>Products</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-black/40 text-[11px] font-mono text-gray-400">
                {products.length}
              </span>
            </button>

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
                <span>Orders</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-[10px] text-gray-500 font-normal">
                Coming soon
              </span>
            </button>
          </nav>

          <div className="mt-8 p-3.5 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-300 mb-1">
              <Sparkles size={14} className="text-cyan-400" /> Isolated Admin
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Modifications here interact with the real Supabase database. The storefront mock data remains untouched.
            </p>
          </div>
        </aside>

        {/* Dynamic Content Panel */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'products' ? (
            <div className="space-y-8">
              {/* Header Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#12141c] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-medium">Total Products</span>
                    <Box size={16} className="text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold text-white font-syne">{products.length}</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#12141c] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-medium">Database Status</span>
                    <ShieldCheck size={16} className="text-emerald-400" />
                  </div>
                  <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Supabase RLS Active
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#12141c] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-medium">Admin Operator</span>
                    <Lock size={16} className="text-amber-400" />
                  </div>
                  <div className="text-xs font-mono text-gray-300 truncate mt-1">
                    {user.email}
                  </div>
                </div>
              </div>

              {/* Form: Add New Product */}
              <div className="p-6 rounded-3xl bg-[#12141c] border border-white/10 shadow-xl">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                  <Plus size={18} className="text-cyan-400" />
                  <h3 className="text-base font-bold text-white font-syne">Add New Product</h3>
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

                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Title */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                        Product Title <span className="text-cyan-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Cyberpunk Neon Jacket"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-sm transition-all"
                      />
                    </div>

                    {/* Base Price */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                        Base Price ($ / ₼) <span className="text-cyan-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={basePrice}
                          onChange={(e) => setBasePrice(e.target.value)}
                          placeholder="e.g. 49.99"
                          required
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-sm transition-all font-mono"
                        />
                        <DollarSign className="absolute left-3 top-3 text-gray-500" size={15} />
                      </div>
                    </div>
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Image URL
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-sm transition-all font-mono"
                      />
                      <ImageIcon className="absolute left-3 top-3 text-gray-500" size={15} />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detailed product description, materials, or features..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-sm transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submittingProduct}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-medium text-sm transition-all shadow-md shadow-cyan-600/20 flex items-center gap-2"
                    >
                      {submittingProduct ? (
                        <>
                          <RefreshCw size={15} className="animate-spin" /> Saving Product...
                        </>
                      ) : (
                        <>
                          <Plus size={16} /> Save Product
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
                    <h3 className="text-base font-bold text-white font-syne">Existing Products</h3>
                    <p className="text-xs text-gray-400">
                      Live records fetched from the Supabase <span className="font-mono text-cyan-400">products</span> table.
                    </p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-xs transition-all"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
                  </div>
                </div>

                {loadingProducts ? (
                  <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-3">
                    <RefreshCw size={24} className="animate-spin text-cyan-400" />
                    <span className="text-sm">Loading products from database...</span>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="py-12 border border-dashed border-white/10 rounded-2xl text-center">
                    <Package size={36} className="mx-auto text-gray-600 mb-3" />
                    <h4 className="text-sm font-semibold text-gray-300 mb-1">No products found</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      {searchQuery
                        ? 'No products match your search query.'
                        : 'No products have been added to the products table yet. Use the form above to add your first product.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-white/10">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-black/40 text-[11px] uppercase tracking-wider text-gray-400 border-b border-white/10 font-mono">
                        <tr>
                          <th className="py-3 px-4">Product</th>
                          <th className="py-3 px-4">Base Price</th>
                          <th className="py-3 px-4 hidden md:table-cell">Created At</th>
                          <th className="py-3 px-4 text-right">Actions</th>
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
                                    <p className="text-xs text-gray-400 line-clamp-1 max-w-xs sm:max-w-md">
                                      {prod.description}
                                    </p>
                                  )}
                                  <span className="text-[10px] font-mono text-gray-500">
                                    ID: {String(prod.id).slice(0, 8)}...
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Price */}
                            <td className="py-3.5 px-4 font-mono font-semibold text-cyan-400 text-sm">
                              ${Number(prod.base_price || 0).toFixed(2)}
                            </td>

                            {/* Created Date */}
                            <td className="py-3.5 px-4 text-xs text-gray-400 font-mono hidden md:table-cell">
                              {prod.created_at
                                ? new Date(prod.created_at).toLocaleDateString()
                                : '—'}
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleDeleteProduct(prod.id)}
                                disabled={productActionLoading === prod.id}
                                title="Delete Product"
                                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-all inline-flex items-center justify-center disabled:opacity-40"
                              >
                                {productActionLoading === prod.id ? (
                                  <RefreshCw size={15} className="animate-spin" />
                                ) : (
                                  <Trash2 size={15} />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* =========================================================================
             * ORDERS TAB PLACEHOLDER
             * ========================================================================= */
            <div className="space-y-6">
              <div className="p-8 rounded-3xl bg-[#12141c] border border-white/10 shadow-xl text-center">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4 text-cyan-400">
                  <ShoppingCart size={32} />
                </div>
                <h3 className="text-xl font-bold text-white font-syne mb-2">Orders Management</h3>
                <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
                  The <span className="font-mono text-cyan-400">orders</span> and{' '}
                  <span className="font-mono text-cyan-400">order_items</span> tables are configured with RLS.
                  Order fulfillment and status updates will be managed from this view.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-300">
                  <Clock size={13} className="text-cyan-400" /> Module status: In Development
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
