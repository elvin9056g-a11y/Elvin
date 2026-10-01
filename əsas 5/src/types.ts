export type Language = 'az' | 'en' | 'ru' | 'tr';
export type Theme = 'dark' | 'light';

export type AuthScreen =
  | 'login'
  | 'signup'
  | 'forgot_password'
  | 'verify_otp'
  | 'new_password';

export interface UserProfile {
  id: string;
  userCode?: string;
  username?: string;
  firstName: string;
  lastName: string;
  email?: string;
  balance: number; // AZN
  avatarUrl?: string;
  profession?: string;
  experience?: string;
  bio?: string;
  tags?: string[];
  phone?: string;
  company?: string;
  isOnline?: boolean;
  lastSeen?: string;
  createdAt?: string;
}

export interface SupportMessage {
  id: string;
  sender: 'support' | 'user';
  text?: string;
  imageUrl?: string;
  timestamp: string;
}

export interface AdInquiry {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
  email: string;
  serviceType?: string;
  note?: string;
  createdAt: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  category: 'design' | 'other';
  categoryLabel: string;
  price: string;
  rating: number;
  reviewsCount: number;
  iconName: 'palette' | 'video' | 'layout' | 'home' | 'sparkles' | 'share';
  description: string;
}

// ==========================================
// MAĞAZA (STORE) TYPES
// ==========================================

export type StoreMainCategory = 'mobil' | 'desktop' | 'idman' | 'tibb';

export interface ProductReview {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5
  comment: string;
  date: string;
}

export interface StoreProduct {
  id: string;
  name: string;
  title?: string;
  category: StoreMainCategory | string;
  category_id?: string | null;
  subcategory: string; // e.g., 'tetbiqler', 'sistem', 'destek'
  subcategoryLabel: string;
  image: string;
  image_url?: string | null;
  description: string; // Nə üçün istifadə olunur
  fullDetails?: string;
  price: number; // AZN
  oldPrice?: number;
  discountPercent?: number; // e.g., 30 for 30%
  rating: number; // e.g. 4.9
  reviewsCount: number;
  likesCount: number;
  isLiked?: boolean;
  inStock?: boolean;
  reviews: ProductReview[];
  specs?: Record<string, string>;
  parameters?: Record<string, any> | null;
  isDiscounted?: boolean;
  secret_content?: string | null;
}

export interface StoreAdBanner {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  imageUrl: string;
  accentColor?: string;
  buttonText: string;
  targetCategory?: StoreMainCategory;
}

export interface CartItem {
  product: StoreProduct;
  quantity: number;
}

export interface Translations {
  appName: string;
  languages: {
    az: string;
    en: string;
    ru: string;
    tr: string;
  };
  login: {
    title: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    rememberMe: string;
    forgotPassword: string;
    submitBtn: string;
    orContinueWith: string;
    google: string;
    facebook: string;
    noAccount: string;
    createAccount: string;
    errors: {
      emailRequired: string;
      emailInvalid: string;
      passwordRequired: string;
      loginFailed: string;
    };
  };
  signup: {
    title: string;
    firstNameLabel: string;
    firstNamePlaceholder: string;
    lastNameLabel: string;
    lastNamePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    confirmPasswordLabel: string;
    confirmPasswordPlaceholder: string;
    submitBtn: string;
    orContinueWith: string;
    alreadyHaveAccount: string;
    loginLink: string;
    errors: {
      allFieldsRequired: string;
      passwordMismatch: string;
      passwordTooShort: string;
      emailInvalid: string;
    };
  };
  forgotPassword: {
    title: string;
    description: string;
    emailLabel: string;
    emailPlaceholder: string;
    submitBtn: string;
    backToLogin: string;
    errors: {
      emailRequired: string;
      emailInvalid: string;
    };
  };
  otp: {
    title: string;
    description: string;
    resendIn: string;
    resendBtn: string;
    submitBtn: string;
    backBtn: string;
    errors: {
      invalidCode: string;
      expiredCode: string;
    };
    codeSentSuccess: string;
  };
  newPassword: {
    title: string;
    description: string;
    newPasswordLabel: string;
    newPasswordPlaceholder: string;
    confirmPasswordLabel: string;
    confirmPasswordPlaceholder: string;
    submitBtn: string;
    successTitle: string;
    successDesc: string;
    goToLogin: string;
    errors: {
      required: string;
      mismatch: string;
      tooShort: string;
    };
  };
  welcome: {
    title: string;
    subtitle: string;
    balanceLabel: string;
    step1Done: string;
    step1Desc: string;
    logoutBtn: string;
    testModeBanner: string;
  };
  pwa: {
    installPrompt: string;
    installBtn: string;
    installed: string;
    dismiss: string;
  };
  home: {
    liveSupport: string;
    greeting: string;
    userProfileAria: string;
    adBadge: string;
    adTitle: string;
    adDesc: string;
    applyNow: string;
    auditIncluded: string;
    aiTitle: string;
    servicesTitle: string;
    searchPlaceholder: string;
    tabAll: string;
    tabDesign: string;
    noServicesFound: string;
    orderSoonToast: string;
    navHome: string;
    navSupport: string;
    navShop: string;
    navBalance: string;
    navSettings: string;
    shopComingSoon: string;
    balanceToast: string;
  };
  services: {
    graphic: { title: string; desc: string; category: string; price: string };
    motion: { title: string; desc: string; category: string; price: string };
    web: { title: string; desc: string; category: string; price: string };
    interior: { title: string; desc: string; category: string; price: string };
    logo: { title: string; desc: string; category: string; price: string };
  };
  profile: {
    title: string;
    editTitle: string;
    firstName: string;
    lastName: string;
    profession: string;
    experience: string;
    idLabel: string;
    copyId: string;
    copied: string;
    editBtn: string;
    saveBtn: string;
    cancelBtn: string;
    successSaved: string;
    profilePhoto: string;
    selectFromGallery: string;
    adjustAndCrop: string;
    withUrl: string;
    closeUrl: string;
    tagsTitle: string;
    tag1: string;
    tag2: string;
    tag3: string;
    cropTitle: string;
    cropSubtitle: string;
    cropHint: string;
    rotate: string;
    center: string;
    confirm: string;
    editPhotoBtn?: string;
    tapToSelectPhoto?: string;
    changePhoto?: string;
  };
  settings: {
    title: string;
    subtitle: string;
    themeSection: string;
    themeDesc: string;
    darkMode: string;
    lightMode: string;
    darkDesc: string;
    lightDesc: string;
    languageSection: string;
    languageDesc: string;
    accountSection: string;
    userName: string;
    userEmail: string;
    userId: string;
    balance: string;
    editProfileBtn: string;
    logoutBtn: string;
    logoutConfirm: string;
    close: string;
  };
  support: {
    drawerTitle: string;
    onlineStatus: string;
    greetingMessage: string;
    placeholder: string;
    sendBtn: string;
    onlyImagesAllowed: string;
    uploadImage: string;
  };
  adModal: {
    title: string;
    subtitle: string;
    firstName: string;
    lastName: string;
    company: string;
    phone: string;
    email: string;
    serviceType: string;
    notes: string;
    submitBtn: string;
    successMsg: string;
    close: string;
  };
}
