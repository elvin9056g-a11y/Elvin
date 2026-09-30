import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Search,
  User,
  Users,
  UserPlus,
  MoreVertical,
  Smile,
  Paperclip,
  Camera,
  Mic,
  Send,
  ChevronDown,
  Globe,
  X,
  PhoneOff,
  Trash2,
  CheckSquare,
  Square,
  FileText,
  Download,
  AlertCircle,
  MessageSquare,
  Pin,
  Bell,
  BellOff,
  ShieldAlert,
  Check,
  AlertTriangle,
  MapPin,
  Headphones,
  Image as ImageIcon,
  Edit3,
  Play,
  UserX,
  Unlock,
  Plus,
  Settings,
  Lock,
  Radio,
  Megaphone,
  BarChart2,
  Info,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ChatConversation, ChatMessage, PollData } from './types';
import { CreateGroupModal } from './CreateGroupModal';
import { GroupSettingsModal } from './GroupSettingsModal';
import { CreatePollModal } from './CreatePollModal';
import { VoiceHangoutPanel } from './VoiceHangoutPanel';
import {
  recordStealthBlock,
  recordStealthUnblockAndExplode,
  isViewerBlockedByTarget,
  isTargetBlockedByViewer,
  isMutualBlocked,
  shouldHideOnlineStatus,
  recordAcceptedChatPair,
  removeAcceptedChatPair,
  isChatPairAccepted,
  isConversationPendingRequest,
} from '../../lib/stealthBlockManager';

export interface BlockedUser {
  id: string;
  name: string;
  avatarUrl?: string;
  userCode?: string;
  blockedAt?: string;
  reason?: string;
}
import { AudioVoicePlayer } from './AudioVoicePlayer';
import {
  MessageStatusIndicator,
  MessageStatusLegendModal,
} from './MessageStatusIndicator';
import { WhatsAppEmojiPicker } from './WhatsAppEmojiPicker';
import { CameraPhotoEditorModal } from './CameraPhotoEditorModal';
import { ProfileCardModal } from '../home/ProfileCardModal';
import { ChatFluidBackground } from './ChatFluidBackground';
import {
  AttachmentBottomSheet,
} from './AttachmentBottomSheet';
import { ReportUserModal } from './ReportUserModal';
import { GlobalChatView } from './GlobalChatView';
import { VoiceRecorderBar } from './VoiceRecorderBar';
import { WhatsAppAudioPlayer } from './WhatsAppAudioPlayer';
import { MessageActionsModal } from './MessageActionsModal';
import { ChatLightboxModal } from './ChatLightboxModal';
import { Language, UserProfile } from '../../types';
import {
  supabase,
  isUuid,
  fetchAllProfiles,
  searchProfiles,
  fetchUserConversationsFromDb,
  fetchDirectMessagesBetweenUsers,
  fetchDirectMessageById,
  sendDirectMessageToDb,
  markDirectMessagesAsReadInDb,
  deleteDirectMessageInDb,
  deleteDirectMessagesBetweenUsers,
  deleteUserFriendshipAndMessagesInDb,
  submitReportToDb,
  mapDirectMessageRowToChatMessage,
  formatLastSeen,
  updateMessagesToDelivered,
  uploadChatMediaToSupabase,
} from '../../lib/supabase';
import { translations } from '../../data/translations';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | null;
  currentUserName?: string;
  currentLanguage?: Language;
}

const CHAT_I18N = {
  az: {
    personal: 'Şəxsi',
    global: 'Qlobal',
    search: 'Axtarış',
    all: 'Hamısı',
    requests: 'İstəklər',
    groups: 'Qruplar',
    requestBadge: 'İstək',
    pinnedTooltip: 'Başa bərkidilib',
    mutedTooltip: 'Bildirişlər söndürülüb',
    noChats: 'Söhbət tapılmadı',
    viewProfile: 'Profilə bax',
    chatsNav: 'Çatlar',
    addUserNav: 'İstifadəçi tap və əlavə et (ID ilə)',
    groupsNav: 'Qruplar',
    back: 'Geri',
    close: 'Bağla',
    typing: 'yazır...',
    online: 'Onlayn',
    lastSeenToday: 'Son görülmə bu gün 17:40',
    menu: 'Menyu',
    turnOnNotifications: 'Bildirişləri aç',
    turnOffNotifications: 'Bildirişləri bağla',
    mutedBadge: 'Səssiz',
    reportUser: 'İstifadəçini şikayət et',
    clearChat: 'Sil',
    clearChatTitle: 'Sil:',
    clearAll: 'Mesajları Sil',
    clearAllDesc: 'Yalnız mesajları təmizləyir',
    deleteUser: 'İstifadəçini Sil',
    deleteUserDesc: 'Mesajları və əlaqəni tamamilə silir',
    deleteWarning: 'Bu adamı silsəniz bütün mesajlar silinəcək və geriyə qaytarmaq olmayacaq',
    manualSelect: 'Əl ilə seçim',
    manualSelectDesc: 'Mesajları tək-tək seçərək sil',
    cancel: 'Ləğv et',
    messagesSelected: (count: number) => `${count} mesaj seçildi`,
    selectAll: 'Hamısını seç',
    deselectAll: 'Seçimi sil',
    deleteSelected: 'Seçilənləri sil',
    today: 'Bugün',
    noMessagesYet: 'Bu söhbətdə hələ mesaj yoxdur.',
    replyingTo: (name: string) => `${name} üçün cavab`,
    myLocation: 'Məkanım',
    defaultCity: 'Bakı şəhəri',
    downloadFile: 'Faylı yüklə',
    messageRequestTitle: 'Mesaj istəyi',
    messageRequestDesc: 'Bu istifadəçi sizə mesaj göndərmək istəyir. İstəyi qəbul edərək cavab yaza və ya şikayət edə bilərsiniz.',
    acceptRequest: 'Mesaj istəyini qəbul et',
    report: 'Şikayət et',
    messagePlaceholder: 'Mesaj',
    voiceNote: '🎤 Səsli mesaj',
    emojis: 'Smayliklər',
    attachFileMedia: 'Fayl və Media əlavə et',
    cameraEditor: 'Kamera və Şəkil redaktoru',
    scrollDown: 'Aşağı sürüşdür',
    globalChatTitle: 'Qlobal İcma Çatı',
    activeMembers: '1,280 aktiv üzv',
    globalBanner: 'Bütün istifadəçilər burada canlı ünsiyyət qura bilər',
    globalInputPlaceholder: 'Qlobal çatda mesaj yaz...',
    findAndAddUser: 'İstifadəçi Tap və Əlavə Et',
    findUserDesc: 'İstifadəçinin 8 rəqəmli ID-sini və ya adını daxil edin.',
    findUserPlaceholder: 'Məs: 28491045 və ya @murad',
    searchResults: 'Axtarış Nəticələri:',
    recommendedUsers: 'Tövsiyə olunan istifadəçilər:',
    userNotFound: 'Bu ID ilə istifadəçi tapılmadı.',
    messageBtn: 'Mesaj',
    endCall: 'Zəngi bitir',
    chatOperations: 'Söhbət əməliyyatları',
    pin: 'Başa bərkit',
    unpin: 'Başa bərkidilmişdən çıxar',
    deleteChat: 'Söhbəti sil',
    chatCleared: 'Söhbət təmizləndi',
    messagesDeleted: 'Seçilmiş mesajlar silindi',
    requestAccepted: 'Mesaj istəyi qəbul edildi',
    reportedToast: (name: string, reason: string) => `"${name}" haqqında şikayətiniz qeydə alındı (${reason}).`,
    mutedToast: (name: string) => `"${name}" üçün bildirişlər söndürüldü`,
    unmutedToast: (name: string) => `"${name}" üçün bildirişlər aktivləşdirildi`,
    blockedUsersTitle: 'Bloklananlar',
    blockedUsersModalTitle: 'Bloklanan İstifadəçilər',
    unblock: 'Blokdan çıxar',
    noBlockedUsers: 'Bloklanan istifadəçi yoxdur',
    blockUser: 'İstifadəçini blokla',
    unblockedSuccess: 'İstifadəçi blokdan çıxarıldı',
    blockedAt: 'Tarix:',
    reason: 'Səbəb:',
    createGroup: 'Qrup Yarat',
    groupSettings: 'Qrup Ayarları',
    onlyAllowedCanWrite: 'Yalnız icazəli şəxslər yaza bilər',
    groupCreatedSuccess: 'Qrup uğurla yaradıldı',
    noGroupsYet: 'Heç bir qrup yoxdur',
    createFirstGroupDesc: 'Dostlarınız və həmkarlarınızla müzakirələr üçün yeni qrup yaradın.',
  },
  en: {
    personal: 'Personal',
    global: 'Global',
    search: 'Search',
    all: 'All',
    requests: 'Requests',
    groups: 'Groups',
    requestBadge: 'Request',
    pinnedTooltip: 'Pinned to top',
    mutedTooltip: 'Notifications muted',
    noChats: 'No chats found',
    viewProfile: 'View profile',
    chatsNav: 'Chats',
    addUserNav: 'Find & add user (by ID)',
    groupsNav: 'Groups',
    back: 'Back',
    close: 'Close',
    typing: 'typing...',
    online: 'Online',
    lastSeenToday: 'Last seen today 17:40',
    menu: 'Menu',
    turnOnNotifications: 'Unmute notifications',
    turnOffNotifications: 'Mute notifications',
    mutedBadge: 'Muted',
    reportUser: 'Report user',
    clearChat: 'Delete',
    clearChatTitle: 'Delete:',
    clearAll: 'Delete messages',
    clearAllDesc: 'Clears messages only',
    deleteUser: 'Delete user',
    deleteUserDesc: 'Deletes messages and removes user completely',
    deleteWarning: 'Bu adamı silsəniz bütün mesajlar silinəcək və geriyə qaytarmaq olmayacaq',
    manualSelect: 'Manual selection',
    manualSelectDesc: 'Select messages one-by-one to delete',
    cancel: 'Cancel',
    messagesSelected: (count: number) => `${count} messages selected`,
    selectAll: 'Select all',
    deselectAll: 'Deselect all',
    deleteSelected: 'Delete selected',
    today: 'Today',
    noMessagesYet: 'No messages in this chat yet.',
    replyingTo: (name: string) => `Replying to ${name}`,
    myLocation: 'My Location',
    defaultCity: 'Baku city',
    downloadFile: 'Download file',
    messageRequestTitle: 'Message request',
    messageRequestDesc: 'This user wants to message you. You can accept the request to reply or report them.',
    acceptRequest: 'Accept message request',
    report: 'Report',
    messagePlaceholder: 'Message',
    voiceNote: '🎤 Voice message',
    emojis: 'Emojis',
    attachFileMedia: 'Attach file & media',
    cameraEditor: 'Camera & photo editor',
    scrollDown: 'Scroll down',
    globalChatTitle: 'Global Community Chat',
    activeMembers: '1,280 active members',
    globalBanner: 'All users can chat live here',
    globalInputPlaceholder: 'Write in global chat...',
    findAndAddUser: 'Find & Add User',
    findUserDesc: 'Enter user 8-digit ID or name.',
    findUserPlaceholder: 'E.g.: 28491045 or @murad',
    searchResults: 'Search Results:',
    recommendedUsers: 'Recommended users:',
    userNotFound: 'No user found with this ID.',
    messageBtn: 'Message',
    endCall: 'End call',
    chatOperations: 'Chat options',
    pin: 'Pin chat',
    unpin: 'Unpin chat',
    deleteChat: 'Delete chat',
    chatCleared: 'Chat cleared',
    messagesDeleted: 'Selected messages deleted',
    requestAccepted: 'Message request accepted',
    reportedToast: (name: string, reason: string) => `Your report against "${name}" has been recorded (${reason}).`,
    mutedToast: (name: string) => `Notifications muted for "${name}"`,
    unmutedToast: (name: string) => `Notifications enabled for "${name}"`,
    blockedUsersTitle: 'Blocked Users',
    blockedUsersModalTitle: 'Blocked Users',
    unblock: 'Unblock',
    noBlockedUsers: 'No blocked users',
    blockUser: 'Block user',
    unblockedSuccess: 'User unblocked',
    blockedAt: 'Date:',
    reason: 'Reason:',
    createGroup: 'Create Group',
    groupSettings: 'Group Settings',
    onlyAllowedCanWrite: 'Only authorized members can send messages',
    groupCreatedSuccess: 'Group created successfully',
    noGroupsYet: 'No groups yet',
    createFirstGroupDesc: 'Create a new group to discuss with your friends and colleagues.',
  },
  ru: {
    personal: 'Личные',
    global: 'Глобальный',
    search: 'Поиск',
    all: 'Все',
    requests: 'Запросы',
    groups: 'Группы',
    requestBadge: 'Запрос',
    pinnedTooltip: 'Закреплено',
    mutedTooltip: 'Уведомления выключены',
    noChats: 'Чаты не найдены',
    viewProfile: 'Профиль',
    chatsNav: 'Чаты',
    addUserNav: 'Найти пользователя (по ID)',
    groupsNav: 'Группы',
    back: 'Назад',
    close: 'Закрыть',
    typing: 'печатает...',
    online: 'В сети',
    lastSeenToday: 'Был(а) сегодня в 17:40',
    menu: 'Меню',
    turnOnNotifications: 'Включить уведомления',
    turnOffNotifications: 'Выключить уведомления',
    mutedBadge: 'Без звука',
    reportUser: 'Пожаловаться на пользователя',
    clearChat: 'Удалить',
    clearChatTitle: 'Удалить:',
    clearAll: 'Удалить сообщения',
    clearAllDesc: 'Очищает только сообщения',
    deleteUser: 'Удалить пользователя',
    deleteUserDesc: 'Удаляет сообщения и связь из списка',
    deleteWarning: 'Bu adamı silsəniz bütün mesajlar silinəcək və geriyə qaytarmaq olmayacaq',
    manualSelect: 'Выбрать вручную',
    manualSelectDesc: 'Выбрать отдельные сообщения для удаления',
    cancel: 'Отмена',
    messagesSelected: (count: number) => `Выбрано сообщений: ${count}`,
    selectAll: 'Выбрать все',
    deselectAll: 'Снять выбор',
    deleteSelected: 'Удалить выбранные',
    today: 'Сегодня',
    noMessagesYet: 'В этом чате пока нет сообщений.',
    replyingTo: (name: string) => `Ответ для ${name}`,
    myLocation: 'Моя локация',
    defaultCity: 'г. Баку',
    downloadFile: 'Скачать файл',
    messageRequestTitle: 'Запрос на переписку',
    messageRequestDesc: 'Этот пользователь хочет написать вам. Вы можете принять запрос для ответа или пожаловаться.',
    acceptRequest: 'Принять запрос',
    report: 'Пожаловаться',
    messagePlaceholder: 'Сообщение',
    voiceNote: '🎤 Голосовое сообщение',
    emojis: 'Смайлики',
    attachFileMedia: 'Прикрепить файл и медиа',
    cameraEditor: 'Камера и редактор фото',
    scrollDown: 'Прокрутить вниз',
    globalChatTitle: 'Глобальный чат сообщества',
    activeMembers: '1 280 активных участников',
    globalBanner: 'Все пользователи могут свободно общаться здесь',
    globalInputPlaceholder: 'Написать в общий чат...',
    findAndAddUser: 'Найти и добавить пользователя',
    findUserDesc: 'Введите 8-значный ID пользователя или имя.',
    findUserPlaceholder: 'Напр: 28491045 или @murad',
    searchResults: 'Результаты поиска:',
    recommendedUsers: 'Рекомендуемые пользователи:',
    userNotFound: 'Пользователь с таким ID не найден.',
    messageBtn: 'Написать',
    endCall: 'Завершить звонок',
    chatOperations: 'Действия с чатом',
    pin: 'Закрепить чат',
    unpin: 'Открепить чат',
    deleteChat: 'Удалить чат',
    chatCleared: 'Чат очищен',
    messagesDeleted: 'Выбранные сообщения удалены',
    requestAccepted: 'Запрос на переписку принят',
    reportedToast: (name: string, reason: string) => `Ваша жалоба на "${name}" принята (${reason}).`,
    mutedToast: (name: string) => `Уведомления отключены для "${name}"`,
    unmutedToast: (name: string) => `Уведомления включены для "${name}"`,
    blockedUsersTitle: 'Заблокированные',
    blockedUsersModalTitle: 'Заблокированные пользователи',
    unblock: 'Разблокировать',
    noBlockedUsers: 'Нет заблокированных пользователей',
    blockUser: 'Заблокировать',
    unblockedSuccess: 'Пользователь разблокирован',
    blockedAt: 'Дата:',
    reason: 'Причина:',
    createGroup: 'Создать группу',
    groupSettings: 'Настройки группы',
    onlyAllowedCanWrite: 'Только разрешенные участники могут отправлять сообщения',
    groupCreatedSuccess: 'Группа успешно создана',
    noGroupsYet: 'Групп пока нет',
    createFirstGroupDesc: 'Создайте группу для общения с друзьями и коллегами.',
  },
  tr: {
    personal: 'Kişisel',
    global: 'Genel',
    search: 'Ara',
    all: 'Tümü',
    requests: 'İstekler',
    groups: 'Gruplar',
    requestBadge: 'İstek',
    pinnedTooltip: 'Başa sabitlendi',
    mutedTooltip: 'Bildirimler sessize alındı',
    noChats: 'Sohbet bulunamadı',
    viewProfile: 'Profile bak',
    chatsNav: 'Sohbetler',
    addUserNav: 'Kişi bul ve ekle (ID ile)',
    groupsNav: 'Gruplar',
    back: 'Geri',
    close: 'Kapat',
    typing: 'yazıyor...',
    online: 'Çevrimiçi',
    lastSeenToday: 'Son görülme bugün 17:40',
    menu: 'Menü',
    turnOnNotifications: 'Bildirimleri aç',
    turnOffNotifications: 'Bildirimleri kapat',
    mutedBadge: 'Sessiz',
    reportUser: 'Kullanıcıyı şikayet et',
    clearChat: 'Sil',
    clearChatTitle: 'Sil:',
    clearAll: 'Mesajları Sil',
    clearAllDesc: 'Yalnızca mesajları temizler',
    deleteUser: 'Kullanıcıyı Sil',
    deleteUserDesc: 'Mesajları ve kişiyi tamamen siler',
    deleteWarning: 'Bu adamı silsəniz bütün mesajlar silinəcək və geriyə qaytarmaq olmayacaq',
    manualSelect: 'Manuel seçim',
    manualSelectDesc: 'Mesajları tek tek seçerek sil',
    cancel: 'İptal',
    messagesSelected: (count: number) => `${count} mesaj seçildi`,
    selectAll: 'Tümünü seç',
    deselectAll: 'Seçimi temizle',
    deleteSelected: 'Seçilenleri sil',
    today: 'Bugün',
    noMessagesYet: 'Bu sohbette henüz mesaj yok.',
    replyingTo: (name: string) => `${name} kişisine yanıt`,
    myLocation: 'Konumum',
    defaultCity: 'Bakü şehri',
    downloadFile: 'Dosyayı indir',
    messageRequestTitle: 'Mesaj isteği',
    messageRequestDesc: 'Bu kullanıcı size mesaj göndermek istiyor. İsteği kabul ederek yanıtlayabilir veya şikayet edebilirsiniz.',
    acceptRequest: 'Mesaj isteğini kabul et',
    report: 'Şikayet et',
    messagePlaceholder: 'Mesaj',
    voiceNote: '🎤 Sesli mesaj',
    emojis: 'İfadeler',
    attachFileMedia: 'Dosya ve Medya ekle',
    cameraEditor: 'Kamera ve Fotoğraf editörü',
    scrollDown: 'Aşağı kaydır',
    globalChatTitle: 'Genel Topluluk Sohbeti',
    activeMembers: '1.280 aktif üye',
    globalBanner: 'Tüm kullanıcılar burada canlı sohbet edebilir',
    globalInputPlaceholder: 'Genel sohbete mesaj yaz...',
    findAndAddUser: 'Kullanıcı Bul ve Ekle',
    findUserDesc: 'Kullanıcının 8 haneli ID\'sini veya adını girin.',
    findUserPlaceholder: 'Ör: 28491045 veya @murad',
    searchResults: 'Arama Sonuçları:',
    recommendedUsers: 'Önerilen kullanıcılar:',
    userNotFound: 'Bu ID ile kullanıcı bulunamadı.',
    messageBtn: 'Mesaj',
    endCall: 'Aramayı sonlandır',
    chatOperations: 'Sohbet işlemleri',
    pin: 'Başa sabitle',
    unpin: 'Sabitlemeyi kaldır',
    deleteChat: 'Sohbeti sil',
    chatCleared: 'Sohbet temizlendi',
    messagesDeleted: 'Seçilen mesajlar silindi',
    requestAccepted: 'Mesaj isteği kabul edildi',
    reportedToast: (name: string, reason: string) => `"${name}" hakkındaki şikayetiniz kaydedildi (${reason}).`,
    mutedToast: (name: string) => `"${name}" için bildirimler kapatıldı`,
    unmutedToast: (name: string) => `"${name}" için bildirimler açıldı`,
    blockedUsersTitle: 'Engellenenler',
    blockedUsersModalTitle: 'Engellenen Kullanıcılar',
    unblock: 'Engeli kaldır',
    noBlockedUsers: 'Engellenen kullanıcı yok',
    blockUser: 'Kullanıcıyı engelle',
    unblockedSuccess: 'Kullanıcının engeli kaldırıldı',
    blockedAt: 'Tarih:',
    reason: 'Sebep:',
    createGroup: 'Grup Oluştur',
    groupSettings: 'Grup Ayarları',
    onlyAllowedCanWrite: 'Yalnızca yetkili kişiler mesaj yazabilir',
    groupCreatedSuccess: 'Grup başarıyla oluşturuldu',
    noGroupsYet: 'Henüz grup yok',
    createFirstGroupDesc: 'Arkadaşlarınız ve iş arkadaşlarınızla sohbet etmek için yeni bir grup oluşturun.',
  },
};

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentUserName = 'Siz',
  currentLanguage = 'az',
}) => {
  const { isDark } = useTheme();
  const t = CHAT_I18N[currentLanguage] || CHAT_I18N.az;

  // Top Section Mode: "Şəxsi" (Personal) vs "Qlobal" (Global)
  const [sectionMode, setSectionMode] = useState<'personal' | 'global'>('personal');

  // Filter tabs in "Şəxsi" list: Hamısı, İstəklər, Qruplar
  const [personalFilter, setPersonalFilter] = useState<'all' | 'requests' | 'groups'>('all');

  // Bottom floating navigation active pill
  const [bottomNav, setBottomNav] = useState<'direct' | 'new_contact' | 'groups'>('direct');

  // Selected chat for 1-to-1 or group conversation screen
  const [selectedChat, setSelectedChat] = useState<ChatConversation | null>(null);

  // Real conversations list loaded from Supabase public.direct_messages & public.profiles
  const [conversations, setConversations] = useState<ChatConversation[]>([]);

  // Global Community Chat messages
  const [globalMessages, setGlobalMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('lumora_global_chat_messages');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load global chats', e);
    }
    return [];
  });

  // Pending global message from external modals (camera, attachments, voice)
  const [pendingGlobalMessage, setPendingGlobalMessage] = useState<ChatMessage | null>(null);

  // Search input in chat list
  const [searchQuery, setSearchQuery] = useState('');

  // Input bar text
  const [inputText, setInputText] = useState('');

  // Replying to a specific message
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Yanıtlanan Mesaja Sürüşmə (Scroll to Reply) & 1 saniyəlik vurğulama effekti
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const highlightTimerRef = useRef<any>(null);

  const handleScrollToMessage = (targetMsgId: string) => {
    const el = document.getElementById('message-' + targetMsgId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(targetMsgId);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(() => {
        setHighlightedMsgId(null);
      }, 1000);
    }
  };

  // Accepted chats list (so message requests become direct when accepted)
  const [acceptedChats, setAcceptedChats] = useState<string[]>(() => {
    try {
      const key = `lumora_accepted_chats_${currentUser?.id || 'guest'}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Bloklanan İstifadəçilər (Blocked Users state & local storage)
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>(() => {
    try {
      const key = `lumora_blocked_users_${currentUser?.id || 'guest'}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isInboxMenuOpen, setIsInboxMenuOpen] = useState(false);
  const [isBlockedUsersModalOpen, setIsBlockedUsersModalOpen] = useState(false);

  // Group modals state
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isGroupSettingsModalOpen, setIsGroupSettingsModalOpen] = useState(false);
  const [isVoiceHangoutOpen, setIsVoiceHangoutOpen] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);

  // Sync acceptedChats & blockedUsers with LocalStorage
  useEffect(() => {
    if (currentUser?.id) {
      try {
        localStorage.setItem(
          `lumora_accepted_chats_${currentUser.id}`,
          JSON.stringify(acceptedChats)
        );
      } catch (e) {}
    }
  }, [acceptedChats, currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id) {
      try {
        localStorage.setItem(
          `lumora_blocked_users_${currentUser.id}`,
          JSON.stringify(blockedUsers)
        );
      } catch (e) {}
    }
  }, [blockedUsers, currentUser?.id]);

  // Block & Unblock handlers (Stealth Flow)
  const handleBlockUser = (
    userId: string,
    name: string,
    avatarUrl?: string,
    userCode?: string,
    reason?: string
  ) => {
    const myId = currentUser?.id || 'me';
    recordStealthBlock(myId, userId, { name, avatarUrl, userCode, reason });

    const item: BlockedUser = {
      id: userId,
      name,
      avatarUrl,
      userCode,
      blockedAt: new Date().toLocaleDateString(),
      reason: reason || 'İstifadəçi tərəfindən bloklandı',
    };
    setBlockedUsers((prev) => {
      const filtered = prev.filter((b) => b.id !== userId);
      return [...filtered, item];
    });
    setConversations((prev) => prev.filter((c) => c.id !== userId));
    if (selectedChat?.id === userId) {
      setSelectedChat(null);
    }
  };

  // Stealth Unblock & Message Explosion Trigger:
  // When A unblocks B, all messages sent by B during the block are fetched and exploded onto screen,
  // and updated to 'delivered' and 'read'!
  const handleUnblockUser = async (userId: string) => {
    const target = blockedUsers.find((b) => b.id === userId);
    const myId = currentUser?.id || 'me';

    // 1. Remove from state & stealthBlockManager, trigger DB update of all B's sent messages to 'delivered'
    await recordStealthUnblockAndExplode(myId, userId);
    setBlockedUsers((prev) => prev.filter((b) => b.id !== userId));

    // 2. Mesajların Partlayışı:
    // Fetch conversations and messages from DB
    if (myId && isUuid(myId) && isUuid(userId)) {
      const remainingBlocked = blockedUsers.filter((b) => b.id !== userId).map((b) => b.id);
      const convs = await fetchUserConversationsFromDb(myId, acceptedChats, remainingBlocked);
      const allMsgs = await fetchDirectMessagesBetweenUsers(myId, userId);

      let conv = convs.find((c) => c.id === userId);
      if (!conv) {
        conv = {
          id: userId,
          name: target?.name || 'İstifadəçi',
          avatarType: target?.avatarUrl ? 'photo' : 'initial',
          avatarUrl: target?.avatarUrl,
          initial: (target?.name || 'U').charAt(0).toUpperCase(),
          userCode: target?.userCode,
          category: 'direct',
          lastMessage: allMsgs[allMsgs.length - 1]?.text || 'Söhbət açıldı',
          lastMessageTime: allMsgs[allMsgs.length - 1]?.time || '',
          lastMessageStatus: 'delivered',
          messages: allMsgs,
          unreadCount: 0,
          isOnline: false,
        };
        setConversations((prev) => [conv!, ...prev.filter((c) => c.id !== userId)]);
      } else {
        conv.messages = allMsgs;
        setConversations(convs);
      }

      // Automatically display on A's screen
      setSelectedChat(conv);

      // Update status to read as A is currently viewing the conversation
      await markDirectMessagesAsReadInDb(userId, myId);

      // Update local state messages to 'read'
      setSelectedChat((curr) => {
        if (!curr || curr.id !== userId) return curr;
        return {
          ...curr,
          messages: curr.messages.map((m) =>
            !m.isOutgoing ? { ...m, status: 'read' as const } : m
          ),
        };
      });
    }

    showToast(t.unblockedSuccess || `${target?.name || 'İstifadəçi'} blokdan çıxarıldı`);
    setIsBlockedUsersModalOpen(false);
  };

  // Group creation & updating handlers
  const handleCreateGroup = (groupData: {
    name: string;
    avatarUrl?: string;
    bio?: string;
    memberIds: string[];
    allowedWriters: 'all' | 'admins' | 'selected';
    allowedWriterIds?: string[];
  }) => {
    const myId = currentUser?.id || 'me';
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newGroup: ChatConversation = {
      id: 'group_' + Date.now(),
      name: groupData.name,
      avatarType: 'photo',
      avatarUrl: groupData.avatarUrl,
      subtitle: `${groupData.memberIds.length + 1} üzv`,
      lastMessage: 'Qrup yaradıldı',
      lastMessageTime: timeStr,
      lastMessageStatus: 'read',
      category: 'group',
      creatorId: myId,
      admins: [myId],
      members: [myId, ...groupData.memberIds],
      allowedWriters: groupData.allowedWriters,
      allowedWriterIds: groupData.allowedWriterIds,
      bio: groupData.bio,
      unreadCount: 0,
      messages: [
        {
          id: 'msg_sys_' + Date.now(),
          senderId: 'system',
          senderName: 'Sistem',
          isOutgoing: false,
          text: `Səni "${groupData.name}" adlı qrupa qoşdular`,
          time: timeStr,
          status: 'read',
          type: 'text',
        },
        {
          id: 'msg_grp_' + Date.now(),
          senderId: myId,
          senderName: currentUserName,
          isOutgoing: true,
          text: `Salam! "${groupData.name}" qrupu yaradıldı. Xoş gəlmisiniz!`,
          time: timeStr,
          status: 'read',
          type: 'text',
        },
      ],
    };

    setConversations((prev) => [newGroup, ...prev]);
    setSelectedChat(newGroup);

    try {
      const raw = localStorage.getItem('lumora_user_groups');
      const existing = raw ? JSON.parse(raw) : [];
      localStorage.setItem(
        'lumora_user_groups',
        JSON.stringify([newGroup, ...existing.filter((g: any) => g.id !== newGroup.id)])
      );
    } catch (e) {}

    // Supabase Realtime Broadcast to added members
    if (isUuid(myId)) {
      groupData.memberIds.forEach((mId) => {
        if (isUuid(mId) && mId !== myId) {
          sendDirectMessageToDb({
            sender_id: myId,
            receiver_id: mId,
            text: `SYSTEM_GROUP_ACTION:${JSON.stringify({
              action: 'INVITE',
              group: newGroup,
              notification: `Səni "${groupData.name}" adlı qrupa qoşdular`,
            })}`,
            status: 'sent',
          }).catch((err) => console.warn('Group invite broadcast error:', err));
        }
      });
    }

    showToast(t.groupCreatedSuccess || `"${groupData.name}" qrupu uğurla yaradıldı!`);
  };

  const handleUpdateGroup = (updated: ChatConversation) => {
    setSelectedChat(updated);
    setConversations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    try {
      const raw = localStorage.getItem('lumora_user_groups');
      const existing = raw ? JSON.parse(raw) : [];
      const newSaved = existing.map((g: any) => (g.id === updated.id ? updated : g));
      localStorage.setItem('lumora_user_groups', JSON.stringify(newSaved));
    } catch (e) {}

    // Broadcast update to all group members via Supabase direct_messages
    const myId = currentUser?.id;
    if (myId && isUuid(myId) && updated.members) {
      updated.members.forEach((mId) => {
        if (isUuid(mId) && mId !== myId) {
          sendDirectMessageToDb({
            sender_id: myId,
            receiver_id: mId,
            text: `SYSTEM_GROUP_ACTION:${JSON.stringify({
              action: 'UPDATE_GROUP',
              group: updated,
            })}`,
            status: 'sent',
          }).catch((err) => console.warn('Group update broadcast error:', err));
        }
      });
    }

    showToast('Qrup ayarları saxlanıldı');
  };

  const handleLeaveGroup = (groupId: string) => {
    const group = conversations.find((c) => c.id === groupId) || selectedChat;
    if (!group) return;
    const myId = currentUser?.id || 'me';
    const myName = `${currentUser?.firstName || 'İstifadəçi'} ${currentUser?.lastName || ''}`.trim();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newMembers = (group.members || []).filter((id) => id !== myId);
    const newAdmins = (group.admins || []).filter((id) => id !== myId);
    const newRemoved = [...(group.removedMembers || []), myId];

    const sysMsg: ChatMessage = {
      id: `sys_${Date.now()}_leave`,
      senderId: myId,
      senderName: 'Sistem',
      text: `${myName} qrupdan çıxdı`,
      time: timeStr,
      isOutgoing: false,
      isSystem: true,
      type: 'system',
    };

    const updated: ChatConversation = {
      ...group,
      members: newMembers,
      admins: newAdmins,
      removedMembers: newRemoved,
      messages: [...group.messages, sysMsg],
    };

    handleUpdateGroup(updated);
    showToast('Qrupdan çıxdınız');
  };

  const handleDeleteGroup = (groupId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== groupId));
    if (selectedChat?.id === groupId) {
      setSelectedChat(null);
    }
    try {
      const raw = localStorage.getItem('lumora_user_groups');
      const existing = raw ? JSON.parse(raw) : [];
      localStorage.setItem('lumora_user_groups', JSON.stringify(existing.filter((g: any) => g.id !== groupId)));
    } catch (e) {}

    const myId = currentUser?.id;
    if (myId && isUuid(myId) && selectedChat?.members) {
      selectedChat.members.forEach((mId) => {
        if (isUuid(mId) && mId !== myId) {
          sendDirectMessageToDb({
            sender_id: myId,
            receiver_id: mId,
            text: `SYSTEM_GROUP_ACTION:${JSON.stringify({
              action: 'DELETE_GROUP',
              groupId,
            })}`,
            status: 'sent',
          }).catch(() => {});
        }
      });
    }

    showToast('Qrup silindi');
  };

  const handleAddMemberToGroup = (groupId: string, user: { id: string; name: string; avatarUrl?: string }) => {
    const group = conversations.find((c) => c.id === groupId) || selectedChat;
    if (!group) return;
    const myId = currentUser?.id || 'me';
    const myName = `${currentUser?.firstName || 'İstifadəçi'} ${currentUser?.lastName || ''}`.trim();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (group.members?.includes(user.id)) {
      showToast(`${user.name} artıq qrupdadır`);
      return;
    }

    const sysMsg: ChatMessage = {
      id: `sys_${Date.now()}_add`,
      senderId: myId,
      senderName: 'Sistem',
      text: `${user.name} qrupa əlavə edildi`,
      time: timeStr,
      isOutgoing: false,
      isSystem: true,
      type: 'system',
    };

    const updated: ChatConversation = {
      ...group,
      members: [...(group.members || []), user.id],
      removedMembers: (group.removedMembers || []).filter((id) => id !== user.id),
      messages: [...group.messages, sysMsg],
    };

    handleUpdateGroup(updated);

    if (isUuid(myId) && isUuid(user.id)) {
      sendDirectMessageToDb({
        sender_id: myId,
        receiver_id: user.id,
        text: `SYSTEM_GROUP_ACTION:${JSON.stringify({
          action: 'INVITE',
          group: updated,
          notification: `Səni "${group.name}" adlı qrupa qoşdular`,
        })}`,
        status: 'sent',
      }).catch(() => {});
    }

    showToast(`${user.name} qrupa əlavə edildi`);
  };

  const handleRemoveMemberFromGroup = (groupId: string, memberId: string, memberName: string) => {
    const group = conversations.find((c) => c.id === groupId) || selectedChat;
    if (!group) return;
    const myId = currentUser?.id || 'me';
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const sysMsg: ChatMessage = {
      id: `sys_${Date.now()}_rem`,
      senderId: myId,
      senderName: 'Sistem',
      text: `${memberName} qrupdan çıxarıldı`,
      time: timeStr,
      isOutgoing: false,
      isSystem: true,
      type: 'system',
    };

    const updated: ChatConversation = {
      ...group,
      members: (group.members || []).filter((id) => id !== memberId),
      admins: (group.admins || []).filter((id) => id !== memberId),
      removedMembers: [...(group.removedMembers || []), memberId],
      messages: [...group.messages, sysMsg],
    };

    handleUpdateGroup(updated);

    if (isUuid(myId) && isUuid(memberId)) {
      sendDirectMessageToDb({
        sender_id: myId,
        receiver_id: memberId,
        text: `SYSTEM_GROUP_ACTION:${JSON.stringify({
          action: 'REMOVE_MEMBER',
          groupId,
          memberId,
        })}`,
        status: 'sent',
      }).catch(() => {});
    }

    showToast(`${memberName} qrupdan çıxarıldı`);
  };

  const handleSendPoll = (question: string, options: string[]) => {
    if (!selectedChat) return;
    const myId = currentUser?.id || 'me';
    const myName = `${currentUser?.firstName || 'İstifadəçi'} ${currentUser?.lastName || ''}`.trim();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const pollData: PollData = {
      id: `poll_${Date.now()}`,
      question,
      options: options.map((opt, idx) => ({
        id: `opt_${Date.now()}_${idx}`,
        text: opt,
        votes: [],
      })),
      totalVotes: 0,
    };

    const pollMsg: ChatMessage = {
      id: `msg_poll_${Date.now()}`,
      senderId: myId,
      senderName: myName,
      senderAvatar: currentUser?.avatarUrl,
      text: `📊 Səsvermə: ${question}`,
      time: timeStr,
      status: 'sent',
      type: 'poll',
      poll: pollData,
      isOutgoing: true,
    };

    appendOutgoingMessage(pollMsg, `📊 Səsvermə: ${question}`);
  };

  const handleVotePoll = (messageId: string, optionId: string) => {
    if (!selectedChat) return;
    const myId = currentUser?.id || 'me';

    const updatedMessages = selectedChat.messages.map((m) => {
      if (m.id !== messageId || !m.poll) return m;

      const currentPoll = m.poll;
      const updatedOptions = currentPoll.options.map((opt) => {
        const hasVoted = opt.votes.includes(myId);
        if (opt.id === optionId) {
          return {
            ...opt,
            votes: hasVoted ? opt.votes.filter((uid) => uid !== myId) : [...opt.votes, myId],
          };
        } else {
          return {
            ...opt,
            votes: opt.votes.filter((uid) => uid !== myId),
          };
        }
      });

      const totalVotes = updatedOptions.reduce((acc, opt) => acc + opt.votes.length, 0);

      return {
        ...m,
        poll: {
          ...currentPoll,
          options: updatedOptions,
          totalVotes,
        },
      };
    });

    const updatedChat = {
      ...selectedChat,
      messages: updatedMessages,
    };
    setSelectedChat(updatedChat);
    setConversations((prev) => prev.map((c) => (c.id === selectedChat.id ? updatedChat : c)));

    if (selectedChat.category === 'group' && isUuid(myId) && selectedChat.members) {
      selectedChat.members.forEach((mId) => {
        if (isUuid(mId) && mId !== myId) {
          sendDirectMessageToDb({
            sender_id: myId,
            receiver_id: mId,
            text: `SYSTEM_GROUP_ACTION:${JSON.stringify({
              action: 'POLL_VOTE',
              groupId: selectedChat.id,
              messageId,
              optionId,
              voterId: myId,
            })}`,
            status: 'sent',
          }).catch(() => {});
        }
      });
    }
  };

  // New Contact / Add User Dialog & Search by ID
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [userIdSearchQuery, setUserIdSearchQuery] = useState('');

  // Real registered users loaded from Supabase public.profiles
  const [dbUsers, setDbUsers] = useState<UserProfile[]>([]);
  const [searchedUsers, setSearchedUsers] = useState<UserProfile[]>([]);

  // Fetch conversations and clean up any old mock data from localStorage
  useEffect(() => {
    if (!isOpen) return;

    try {
      const saved = localStorage.getItem('lumora_chat_conversations');
      if (
        saved &&
        (saved.includes('usr_28491045') ||
          saved.includes('usr_88219402') ||
          saved.includes('usr_49102834') ||
          saved.includes('usr_61048291') ||
          saved.includes('chat_1') ||
          saved.includes('chat_2'))
      ) {
        localStorage.removeItem('lumora_chat_conversations');
      }
    } catch (e) {}

    const blockedIds = blockedUsers.map((b) => b.id);
    const myId = currentUser?.id;

    const loadSavedGroups = (): ChatConversation[] => {
      try {
        const raw = localStorage.getItem('lumora_user_groups');
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    };

    if (myId && isUuid(myId)) {
      fetchUserConversationsFromDb(myId, acceptedChats, blockedIds).then((convs) => {
        const savedGroups = loadSavedGroups();
        const userGroups = savedGroups.filter(
          (g) => g.creatorId === myId || g.members?.includes(myId)
        );
        const groupIds = new Set(userGroups.map((g) => g.id));
        const combined = [...userGroups, ...convs.filter((c) => !groupIds.has(c.id))];
        setConversations(combined);

        // Also check if any group invites were sent to myId in Supabase direct_messages
        supabase
          .from('direct_messages')
          .select('text')
          .eq('receiver_id', myId)
          .like('text', 'SYSTEM_GROUP_ACTION:%')
          .then(({ data }) => {
            if (data && data.length > 0) {
              data.forEach((row) => {
                try {
                  const actionData = JSON.parse(row.text.replace('SYSTEM_GROUP_ACTION:', ''));
                  if (actionData.action === 'INVITE' && actionData.group) {
                    const grp = actionData.group;
                    setConversations((prev) => {
                      if (prev.some((c) => c.id === grp.id)) return prev;
                      return [grp, ...prev];
                    });
                    const raw = localStorage.getItem('lumora_user_groups');
                    const existing = raw ? JSON.parse(raw) : [];
                    if (!existing.some((g: any) => g.id === grp.id)) {
                      localStorage.setItem('lumora_user_groups', JSON.stringify([grp, ...existing]));
                    }
                  }
                } catch (e) {}
              });
            }
          });
      });
    } else {
      const savedGroups = loadSavedGroups();
      if (savedGroups.length > 0) {
        setConversations((prev) => [
          ...savedGroups,
          ...prev.filter((c) => !savedGroups.some((g) => g.id === c.id)),
        ]);
      }
    }

    fetchAllProfiles().then((profiles) => {
      if (profiles && profiles.length > 0) {
        setDbUsers(profiles);
      }
    });
  }, [isOpen, currentUser?.id]);

  // Real-time search from public.profiles table by 8-digit user_code or first/last name
  useEffect(() => {
    let active = true;
    const cleanQ = userIdSearchQuery.trim();
    searchProfiles(cleanQ, currentUser?.id).then((results) => {
      if (active) {
        setSearchedUsers(results);
      }
    });
    return () => {
      active = false;
    };
  }, [userIdSearchQuery, currentUser?.id]);

  // Channel ref for sending instant broadcast events (e.g. read receipts)
  const chatChannelRef = useRef<any>(null);

  // Keep ref to selectedChat to avoid teardown/resubscribe on every contact selection
  const selectedChatRef = useRef<ChatConversation | null>(selectedChat);
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Update delivered status for any pending messages on login (only from accepted contacts)
  useEffect(() => {
    if (currentUser?.id && isUuid(currentUser.id)) {
      updateMessagesToDelivered(currentUser.id, acceptedChats);
    }
  }, [currentUser?.id, acceptedChats]);

  // Fetch messages between users when a chat is selected & mark as read if accepted
  useEffect(() => {
    if (!selectedChat?.id || !currentUser?.id) return;
    if (!isUuid(selectedChat.id) || !isUuid(currentUser.id)) return;
    const chatId = selectedChat.id;
    const myId = currentUser.id;

    // Check if this conversation is in pending request stage
    const currentConv = selectedChatRef.current?.id === chatId ? selectedChatRef.current : selectedChat;
    const isPending = isConversationPendingRequest(myId, currentConv);

    // 1. Dərhal yerli state-də oxunmamış mesaj sayğacını sıfırla
    setConversations((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c))
    );

    // 2. Qarşı tərəfin ən son online və son görülmə statusunu bazadan çək
    supabase
      .from('profiles')
      .select('is_online, last_seen')
      .eq('id', chatId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const isHidden = shouldHideOnlineStatus(
            myId,
            chatId,
            selectedChatRef.current?.id === chatId ? selectedChatRef.current : undefined
          );
          const isOnline = isHidden ? false : Boolean(data.is_online);
          const lastSeen = isHidden ? null : (data.last_seen || null);
          setSelectedChat((curr) =>
            curr && curr.id === chatId ? { ...curr, isOnline, lastSeen } : curr
          );
          setConversations((prev) =>
            prev.map((c) => (c.id === chatId ? { ...c, isOnline, lastSeen } : c))
          );
        }
      });

    // 3. Mesajları çək; yalnız istək qəbul edildikdə ekranda 'read' et
    fetchDirectMessagesBetweenUsers(myId, chatId, myId).then((msgs) => {
      setSelectedChat((curr) => {
        if (!curr || curr.id !== chatId) return curr;
        return {
          ...curr,
          unreadCount: 0,
          messages: msgs.map((m) =>
            !m.isOutgoing && m.status !== 'read' && !isPending ? { ...m, status: 'read' } : m
          ),
        };
      });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                unreadCount: 0,
                messages: msgs.map((m) =>
                  !m.isOutgoing && m.status !== 'read' && !isPending ? { ...m, status: 'read' } : m
                ),
              }
            : c
        )
      );
    });

    // 4. Bazada statusları yalnız istək qəbul edilibsə 'read' et və broadcast göndər
    if (!isPending) {
      markDirectMessagesAsReadInDb(chatId, myId)
        .then(() => {
          if (chatChannelRef.current) {
            chatChannelRef.current.send({
              type: 'broadcast',
              event: 'messages_read',
              payload: { readerId: myId, senderId: chatId },
            });
          }
        })
        .catch(console.warn);
    }
  }, [selectedChat?.id, currentUser?.id]);

  // Realtime subscription on public.direct_messages
  useEffect(() => {
    if (!currentUser?.id || !isUuid(currentUser.id)) return;
    const myId = currentUser.id;
    const channelId = `direct_messages_${myId}_${Date.now()}`;

    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        async (payload) => {
          const row = payload.new;
          if (!row || (row.sender_id !== myId && row.receiver_id !== myId)) return;

          const partnerId = row.sender_id === myId ? row.receiver_id : row.sender_id;
          const isCurrentActiveChat = selectedChatRef.current?.id === partnerId;

          // Intercept system group actions (INVITE, UPDATE_GROUP)
          if (row.receiver_id === myId && row.text && row.text.startsWith('SYSTEM_GROUP_ACTION:')) {
            try {
              const actionData = JSON.parse(row.text.replace('SYSTEM_GROUP_ACTION:', ''));
              if (actionData.action === 'INVITE') {
                const incomingGroup: ChatConversation = actionData.group;
                if (!incomingGroup.messages?.some((m) => m.text?.includes('qoşdular'))) {
                  incomingGroup.messages = [
                    {
                      id: 'msg_sys_' + Date.now(),
                      senderId: 'system',
                      senderName: 'Sistem',
                      isOutgoing: false,
                      text: actionData.notification || `Səni "${incomingGroup.name}" adlı qrupa qoşdular`,
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      status: 'read',
                      type: 'text',
                    },
                    ...(incomingGroup.messages || []),
                  ];
                }
                setConversations((prev) => {
                  if (prev.some((c) => c.id === incomingGroup.id)) return prev;
                  return [incomingGroup, ...prev];
                });
                try {
                  const raw = localStorage.getItem('lumora_user_groups');
                  const existing = raw ? JSON.parse(raw) : [];
                  if (!existing.some((g: any) => g.id === incomingGroup.id)) {
                    localStorage.setItem('lumora_user_groups', JSON.stringify([incomingGroup, ...existing]));
                  }
                } catch (e) {}

                showToast(actionData.notification || `Səni "${incomingGroup.name}" adlı qrupa qoşdular`);
              } else if (actionData.action === 'UPDATE_GROUP') {
                const updatedGroup: ChatConversation = actionData.group;
                setConversations((prev) =>
                  prev.map((c) => (c.id === updatedGroup.id ? { ...c, ...updatedGroup } : c))
                );
                if (selectedChatRef.current?.id === updatedGroup.id) {
                  setSelectedChat((curr) => (curr ? { ...curr, ...updatedGroup } : curr));
                }
                try {
                  const raw = localStorage.getItem('lumora_user_groups');
                  const existing = raw ? JSON.parse(raw) : [];
                  const nextGroups = existing.map((g: any) =>
                    g.id === updatedGroup.id ? { ...g, ...updatedGroup } : g
                  );
                  localStorage.setItem('lumora_user_groups', JSON.stringify(nextGroups));
                } catch (e) {}
              }
            } catch (err) {}
            return;
          }

          // Əgər payload.new içində profil məlumatları çatmırsa, id-yə görə join edib çək
          let newMsg: ChatMessage;
          if (!row.profiles || !row.profiles.first_name) {
            const fetched = await fetchDirectMessageById(row.id, myId);
            newMsg = fetched || mapDirectMessageRowToChatMessage(row, myId);
          } else {
            newMsg = mapDirectMessageRowToChatMessage(row, myId);
          }

          // Stealth Block filter: If current user has blocked the sender, IGNORE message completely!
          if (row.receiver_id === myId) {
            const isSenderBlocked =
              blockedUsers.some((b) => b.id === row.sender_id) ||
              isTargetBlockedByViewer(myId, row.sender_id);
            if (isSenderBlocked) {
              return;
            }
          }

          // Əgər istifadəçi həmin an bu çata baxırsa, mesaj anında oxunmuş hesab olunur
          if (row.receiver_id === myId) {
            if (isCurrentActiveChat) {
              newMsg.status = 'read';
              markDirectMessagesAsReadInDb(partnerId, myId).catch(console.warn);
              channel.send({
                type: 'broadcast',
                event: 'messages_read',
                payload: { readerId: myId, senderId: partnerId },
              });
            } else {
              newMsg.status = 'delivered';
              if (row.status === 'sent') {
                supabase
                  .from('direct_messages')
                  .update({ status: 'delivered' })
                  .eq('id', row.id)
                  .then(() => {});
              }
            }
          }

          setSelectedChat((curr) => {
            if (curr && curr.id === partnerId) {
              const tempIdx = curr.messages.findIndex(
                (m) =>
                  (m.id.startsWith('msg_') && m.text === newMsg.text && m.senderId === newMsg.senderId) ||
                  m.id === newMsg.id
              );
              let updatedMessages: ChatMessage[];
              if (tempIdx >= 0) {
                updatedMessages = [...curr.messages];
                updatedMessages[tempIdx] = newMsg;
              } else if (curr.messages.some((m) => m.id === newMsg.id)) {
                return curr;
              } else {
                updatedMessages = [...curr.messages, newMsg];
              }

              return {
                ...curr,
                unreadCount: 0,
                lastMessage: newMsg.text || 'Media',
                lastMessageTime: newMsg.time,
                lastMessageStatus: newMsg.status,
                messages: updatedMessages,
              };
            }
            return curr;
          });

          setConversations((prev) => {
            const idx = prev.findIndex((c) => c.id === partnerId);
            if (idx >= 0) {
              const existing = prev[idx];
              const tempIdx = existing.messages.findIndex(
                (m) =>
                  (m.id.startsWith('msg_') && m.text === newMsg.text && m.senderId === newMsg.senderId) ||
                  m.id === newMsg.id
              );
              let updatedMsgs: ChatMessage[];
              if (tempIdx >= 0) {
                updatedMsgs = [...existing.messages];
                updatedMsgs[tempIdx] = newMsg;
              } else if (existing.messages.some((m) => m.id === newMsg.id)) {
                updatedMsgs = existing.messages;
              } else {
                updatedMsgs = [...existing.messages, newMsg];
              }

              const updatedConv = {
                ...existing,
                lastMessage: newMsg.text || 'Media',
                lastMessageTime: newMsg.time,
                lastMessageStatus: newMsg.status,
                unreadCount:
                  row.receiver_id === myId && !isCurrentActiveChat
                    ? (existing.unreadCount || 0) + 1
                    : 0,
                messages: updatedMsgs,
              };
              const nextList = [...prev];
              nextList.splice(idx, 1);
              return [updatedConv, ...nextList];
            } else {
              if (blockedUsers.some((b) => b.id === partnerId)) return prev;

              fetchAllProfiles().then((profiles) => {
                const p = profiles.find((x) => x.id === partnerId);
                const name = p
                  ? `${p.firstName} ${p.lastName}`.trim() || p.username || 'İstifadəçi'
                  : 'İstifadəçi';
                const isIncomingRequest = row.receiver_id === myId;
                const isAccepted = acceptedChats.includes(partnerId);

                const freshConv: ChatConversation = {
                  id: partnerId,
                  name,
                  avatarType: p?.avatarUrl ? 'photo' : 'icon',
                  avatarUrl: p?.avatarUrl,
                  initial: name.charAt(0).toUpperCase() || 'U',
                  lastMessage: newMsg.text || 'Media',
                  lastMessageTime: newMsg.time,
                  lastMessageStatus: newMsg.status,
                  unreadCount: row.receiver_id === myId && !isCurrentActiveChat ? 1 : 0,
                  category: isIncomingRequest && !isAccepted ? 'request' : 'direct',
                  userCode: p?.userCode,
                  messages: [newMsg],
                };
                setConversations((currList) => [
                  freshConv,
                  ...currList.filter((c) => c.id !== partnerId),
                ]);
              });
              return prev;
            }
          });

          // Avtomatik Sürüşdürmə: Yeni mesaj gələn kimi ekran həmişə avtomatik ən aşağıya sürüklənsin
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'direct_messages' },
        (payload) => {
          const row = payload.new;
          if (!row || (row.sender_id !== myId && row.receiver_id !== myId)) return;
          const partnerId = row.sender_id === myId ? row.receiver_id : row.sender_id;
          const newStatus = (row.status as 'sent' | 'delivered' | 'read') || 'sent';

          setSelectedChat((curr) => {
            if (!curr || curr.id !== partnerId) return curr;
            const updatedMessages = curr.messages.map((m) =>
              m.id === String(row.id) ? { ...m, status: newStatus } : m
            );
            const lastMsg = updatedMessages[updatedMessages.length - 1];
            return {
              ...curr,
              lastMessageStatus: lastMsg?.id === String(row.id) ? newStatus : curr.lastMessageStatus,
              messages: updatedMessages,
            };
          });

          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== partnerId) return c;
              const updatedMessages = c.messages.map((m) =>
                m.id === String(row.id) ? { ...m, status: newStatus } : m
              );
              const lastMsg = updatedMessages[updatedMessages.length - 1];
              return {
                ...c,
                lastMessageStatus: lastMsg?.id === String(row.id) ? newStatus : c.lastMessageStatus,
                messages: updatedMessages,
              };
            })
          );
        }
      )
      .on('broadcast', { event: 'messages_read' }, ({ payload }) => {
        // Qarşı tərəf mesajlarımızı oxuduqda anında quşları mavi (#53bdeb) et
        if (payload?.readerId && payload?.senderId === myId) {
          const partnerId = payload.readerId;
          setSelectedChat((curr) => {
            if (!curr || curr.id !== partnerId) return curr;
            return {
              ...curr,
              lastMessageStatus: 'read',
              messages: curr.messages.map((m) =>
                m.isOutgoing ? { ...m, status: 'read' } : m
              ),
            };
          });

          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== partnerId) return c;
              return {
                ...c,
                lastMessageStatus: 'read',
                messages: c.messages.map((m) =>
                  m.isOutgoing ? { ...m, status: 'read' } : m
                ),
              };
            })
          );
        }
      })
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'direct_messages' },
        (payload) => {
          const deletedId = String(payload.old?.id);
          setSelectedChat((curr) => {
            if (!curr) return curr;
            return {
              ...curr,
              messages: curr.messages.filter((m) => m.id !== deletedId),
            };
          });
          setConversations((prev) =>
            prev.map((c) => ({
              ...c,
              messages: c.messages.filter((m) => m.id !== deletedId),
            }))
          );
        }
      )
      .subscribe();

    chatChannelRef.current = channel;

    // Realtime subscription to profiles table for instant online/offline/last_seen changes
    const profilesChannelId = `chat_profiles_${myId}_${Date.now()}`;
    const profilesChannel = supabase
      .channel(profilesChannelId)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const updated = payload.new;
          if (!updated?.id) return;

          const isHidden = shouldHideOnlineStatus(
            myId,
            updated.id,
            selectedChatRef.current?.id === updated.id ? selectedChatRef.current : undefined
          );
          const isOnline = isHidden ? false : Boolean(updated.is_online);
          const lastSeen = isHidden ? null : (updated.last_seen || null);

          setSelectedChat((curr) => {
            if (curr && curr.id === updated.id) {
              return {
                ...curr,
                isOnline,
                lastSeen: lastSeen || curr.lastSeen,
              };
            }
            return curr;
          });

          setConversations((prev) =>
            prev.map((c) =>
              c.id === updated.id
                ? {
                    ...c,
                    isOnline,
                    lastSeen: lastSeen || c.lastSeen,
                  }
                : c
            )
          );

          // Qarşı tərəf online olduqda: göndərilən mesajlar avtomatik 'delivered' edilsin (əgər gizli/blok deyilsə)
          if (isOnline && myId && !isHidden) {
            supabase
              .from('direct_messages')
              .update({ status: 'delivered' })
              .eq('sender_id', myId)
              .eq('receiver_id', updated.id)
              .eq('status', 'sent')
              .then(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
        supabase.removeChannel(profilesChannel);
      } catch (e) {
        console.warn('Error removing chat channels:', e);
      }
      chatChannelRef.current = null;
    };
  }, [currentUser?.id]);



  // Profile View Modal state (like Home page profile card, readOnly)
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);

  // Simulated Voice/Video Call Dialog
  const [activeCall, setActiveCall] = useState<{
    name: string;
    type: 'audio' | 'video';
    avatar?: string;
  } | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  // WhatsApp-style Emoji picker drawer
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Camera & Photo Editor modal
  const [isCameraEditorOpen, setIsCameraEditorOpen] = useState(false);

  // File upload input ref and error alert
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const [fileErrorAlert, setFileErrorAlert] = useState<string | null>(null);

  // Attachment bottom sheet (matching fayıl.jpeg)
  const [isAttachSheetOpen, setIsAttachSheetOpen] = useState(false);

  // Full-screen Media Lightbox modal state (Image & Video)
  const [lightboxMedia, setLightboxMedia] = useState<{
    url: string;
    type: 'image' | 'video';
    senderName?: string;
    time?: string;
    caption?: string;
  } | null>(null);

  // Handler for uploaded media from AttachmentBottomSheet
  const handleSendUploadedMedia = (payload: {
    type: 'image' | 'video' | 'voice' | 'file';
    url: string;
    fileName?: string;
    fileSize?: string;
    fileBytes?: number;
  }) => {
    setIsAttachSheetOpen(false);
    const currentTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const isMe = true;
    const newMsg: ChatMessage = {
      id: 'media_' + Date.now(),
      senderId: currentUser?.id || 'me',
      senderName: currentUserName,
      isOutgoing: isMe,
      time: currentTime,
      status: 'sent',
      type: payload.type,
      mediaUrl: payload.url,
      audio_url: payload.type === 'voice' ? payload.url : undefined,
      image_url: payload.type === 'image' ? payload.url : undefined,
      video_url: payload.type === 'video' ? payload.url : undefined,
      file_url: payload.type === 'file' ? payload.url : undefined,
      file_name: payload.fileName,
      voiceDuration: payload.type === 'voice' ? '0:06' : undefined,
      fileInfo: payload.type === 'file' ? {
        name: payload.fileName || 'Fayl',
        size: payload.fileSize || '1.0 MB',
        bytes: payload.fileBytes || 1000000,
        extension: payload.fileName?.split('.').pop() || 'dat',
        fileUrl: payload.url,
      } : undefined,
      replyTo: replyingTo ? {
        id: replyingTo.id,
        senderName: replyingTo.senderName,
        text: replyingTo.text || 'Media',
      } : undefined,
    };

    if (sectionMode === 'global') {
      setPendingGlobalMessage(newMsg);
    } else {
      appendOutgoingMessage(
        newMsg,
        payload.type === 'image' ? '📷 Şəkil' : payload.type === 'video' ? '🎥 Video' : payload.type === 'voice' ? '🎤 Səsli mesaj' : `📎 ${payload.fileName || 'Fayl'}`
      );
    }
    setReplyingTo(null);
  };

  // Message Status Legend Modal
  const [isStatusLegendOpen, setIsStatusLegendOpen] = useState(false);

  // Three-dots menu & Clear chat options
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClearOptionsOpen, setIsClearOptionsOpen] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(new Set());

  // Automatically close menus and attachment sheet when switching or leaving chats
  useEffect(() => {
    setIsMenuOpen(false);
    setIsClearOptionsOpen(false);
    setIsAttachSheetOpen(false);
  }, [selectedChat?.id]);

  // Report User Modal state (for requests & user report)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Long-press Context menu state for chat list items
  const [contextChat, setContextChat] = useState<ChatConversation | null>(null);
  const [chatToDelete, setChatToDelete] = useState<ChatConversation | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActiveRef = useRef(false);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // Personal message long-press & edit/delete state
  const [selectedMsgForAction, setSelectedMsgForAction] = useState<ChatMessage | null>(null);
  const [editingPersonalMessage, setEditingPersonalMessage] = useState<ChatMessage | null>(null);
  const msgLongPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // In-line voice recording for personal chat
  const [isRecordingPersonalVoice, setIsRecordingPersonalVoice] = useState(false);

  const handleStartEditMessage = (msg: ChatMessage) => {
    setEditingPersonalMessage(msg);
    setInputText(msg.text || '');
    setShowEmojiPicker(false);
    setTimeout(() => messageInputRef.current?.focus(), 100);
  };

  const handleDeleteSingleMessage = (msg: ChatMessage) => {
    if (!selectedChat) return;
    const targetChatId = selectedChat.id;
    const updatedMsgs = selectedChat.messages.filter((m) => m.id !== msg.id);
    const lastM = updatedMsgs[updatedMsgs.length - 1];
    const updatedChat: ChatConversation = {
      ...selectedChat,
      messages: updatedMsgs,
      lastMessage: lastM
        ? lastM.text ||
          (lastM.type === 'voice'
            ? '🎤 Səsli mesaj'
            : lastM.type === 'image'
            ? '📷 Şəkil'
            : '📎 Fayl')
        : '',
      lastMessageTime: lastM ? lastM.time : '',
    };
    setSelectedChat(updatedChat);
    setConversations((prev) =>
      prev.map((c) => (c.id === targetChatId ? updatedChat : c))
    );
    if (editingPersonalMessage?.id === msg.id) {
      setEditingPersonalMessage(null);
      setInputText('');
    }
    showToast('Mesaj silindi', 'info');
  };

  const handleSendPersonalVoice = (
    mediaUrl: string,
    durationStr: string,
    durationSec: number
  ) => {
    if (!selectedChat) return;
    const voiceId = 'voice_' + Date.now();
    const voiceMsg: ChatMessage = {
      id: voiceId,
      senderId: currentUser?.id || 'me',
      senderName: currentUserName,
      isOutgoing: true,
      type: 'voice',
      mediaUrl,
      audio_url: mediaUrl,
      voiceDuration: durationStr,
      voiceDurationSec: durationSec,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'sent',
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            text: replyingTo.text || 'Səs',
          }
        : undefined,
    };
    appendOutgoingMessage(voiceMsg, `🎤 ${t.voiceNote}`);
    setIsRecordingPersonalVoice(false);
    setReplyingTo(null);
  };

  // In-app alert / toast notification feedback
  const [chatToast, setChatToast] = useState<{
    message: string;
    type?: 'info' | 'success' | 'warning';
  } | null>(null);

  const showToast = (
    message: string,
    type: 'info' | 'success' | 'warning' = 'success'
  ) => {
    setChatToast({ message, type });
    setTimeout(() => setChatToast(null), 3200);
  };

  // Recipient typing indicator state & Realtime Broadcast Channel
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const typingBroadcastChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!selectedChat?.id || !currentUser?.id || !isUuid(selectedChat.id) || !isUuid(currentUser.id)) {
      setIsRecipientTyping(false);
      return;
    }

    const pairId = [currentUser.id, selectedChat.id].sort().join('_');
    const channel = supabase.channel(`typing_${pairId}`);

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.userId === selectedChat.id) {
          setIsRecipientTyping(Boolean(payload?.isTyping));
          if (payload?.isTyping) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
              setIsRecipientTyping(false);
            }, 3000);
          }
        }
      })
      .subscribe();

    typingBroadcastChannelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      supabase.removeChannel(channel);
      typingBroadcastChannelRef.current = null;
      setIsRecipientTyping(false);
    };
  }, [selectedChat?.id, currentUser?.id]);

  // Handle typing input change with Realtime typing broadcast
  const handleTypingInputChange = (val: string) => {
    setInputText(val);
    if (!selectedChat?.id || !currentUser?.id || !isUuid(selectedChat.id) || !isUuid(currentUser.id)) return;

    if (typingBroadcastChannelRef.current) {
      typingBroadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUser.id, isTyping: val.trim().length > 0 },
      });
    }
  };

  // Scroll to bottom helper
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Auto-scroll on conversation open or new message arriving
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
    setShowScrollBottom(false);
  };

  useEffect(() => {
    if (selectedChat?.id) {
      scrollToBottom('auto');
      const t1 = setTimeout(() => scrollToBottom('smooth'), 50);
      const t2 = setTimeout(() => scrollToBottom('smooth'), 180);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [selectedChat?.id]);

  useEffect(() => {
    if (selectedChat?.messages?.length) {
      scrollToBottom('smooth');
    }
  }, [selectedChat?.messages?.length]);

  // Save conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lumora_chat_conversations', JSON.stringify(conversations));
    } catch (e) {
      console.warn('Failed to save chats', e);
    }
  }, [conversations]);

  // Save global messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lumora_global_chat_messages', JSON.stringify(globalMessages));
    } catch (e) {
      console.warn('Failed to save global chats', e);
    }
  }, [globalMessages]);

  // Track scroll position for "scroll to bottom" button
  const handleScroll = () => {
    if (!chatScrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight > 180) {
      setShowScrollBottom(true);
    } else {
      setShowScrollBottom(false);
    }
  };

  // Call timer simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeCall) {
      setCallDuration(0);
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  if (!isOpen) return null;

  // Filter conversations (excluding blocked users)
  const blockedIds = new Set(blockedUsers.map((b) => b.id));
  const filteredConversations = conversations.filter((c) => {
    if (blockedIds.has(c.id)) return false;

    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (personalFilter === 'requests') {
      return c.category === 'request';
    }
    if (personalFilter === 'groups') {
      return c.category === 'group';
    }
    // "all" includes direct and groups
    return c.category === 'direct' || c.category === 'group';
  });

  // Sort conversations: Pinned items stay at the very top
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  // Calculate badge counts excluding blocked users
  const unblockedConvs = conversations.filter((c) => !blockedIds.has(c.id));
  const allCount = unblockedConvs.filter(
    (c) => c.category === 'direct' || c.category === 'group'
  ).length;
  const requestsCount = unblockedConvs.filter((c) => c.category === 'request').length;
  const groupsCount = unblockedConvs.filter((c) => c.category === 'group').length;

  // Append outgoing message helper and persist to Supabase
  const appendOutgoingMessage = (newMsg: ChatMessage, previewText?: string) => {
    if (!selectedChat) return;
    const targetChatId = selectedChat.id;
    const messageDisplay = previewText || newMsg.text || 'Fayl';

    // WhatsApp Quşları: Qarşı tərəf online olanda 'delivered' (2 boz quş), oflayn olanda 'sent' (1 boz quş)
    // Stealth Block: Əgər qarşı tərəf bizi bloklayıbsa, status məcburi yalnız 'sent' (tək quş) qalır!
    // İstəklər Qutusu: Əgər əlaqə pending (İstək) mərhələsindədirsə, status MÜTLƏQ yalnız 'sent' (1 boz quş) qalır!
    const isBlockedByPartner = isViewerBlockedByTarget(currentUser?.id, targetChatId);
    const isPending = isConversationPendingRequest(currentUser?.id, selectedChat);
    const isPartnerOnline = !isBlockedByPartner && !isPending && Boolean(selectedChat.isOnline);
    const initialStatus: 'sent' | 'delivered' = (isPartnerOnline && !isPending) ? 'delivered' : 'sent';

    const msgWithStatus: ChatMessage = {
      ...newMsg,
      status: initialStatus,
    };

    const isAlreadyAccepted = isChatPairAccepted(currentUser?.id, targetChatId);
    const updatedCategory = isAlreadyAccepted ? 'direct' : selectedChat.category;

    const updatedChat: ChatConversation = {
      ...selectedChat,
      category: updatedCategory,
      lastMessage: messageDisplay,
      lastMessageTime: newMsg.time,
      lastMessageStatus: initialStatus,
      messages: [...selectedChat.messages, msgWithStatus],
    };

    setSelectedChat(updatedChat);
    setConversations((prev) =>
      prev.map((c) => (c.id === targetChatId ? updatedChat : c))
    );

    // If it's a group, persist updated messages to localStorage
    if (selectedChat.category === 'group') {
      try {
        const raw = localStorage.getItem('lumora_user_groups');
        const saved = raw ? JSON.parse(raw) : [];
        const updatedSaved = saved.map((g: any) => (g.id === targetChatId ? updatedChat : g));
        localStorage.setItem('lumora_user_groups', JSON.stringify(updatedSaved));
      } catch (e) {}
    }

    // Avtomatik Sürüşdürmə: istifadəçi özü mesaj göndərən kimi ekran həmişə avtomatik ən aşağıya sürüklənsin
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    // Save to Supabase public.direct_messages
    if (currentUser?.id && isUuid(currentUser.id) && isUuid(targetChatId)) {
      sendDirectMessageToDb({
        sender_id: currentUser.id,
        receiver_id: targetChatId,
        text: newMsg.text || (newMsg.type === 'voice' ? (newMsg.voiceDuration || '0:05') : '') || '',
        audio_url: newMsg.audio_url || (newMsg.type === 'voice' ? newMsg.mediaUrl : undefined),
        image_url: newMsg.image_url || (newMsg.type === 'image' ? newMsg.mediaUrl : undefined),
        video_url: newMsg.video_url || (newMsg.type === 'video' ? newMsg.mediaUrl : undefined),
        file_url: newMsg.file_url || (newMsg.type === 'file' ? (newMsg.mediaUrl || newMsg.fileInfo?.fileUrl) : undefined),
        file_name: newMsg.file_name || (newMsg.type === 'voice' ? String(newMsg.voiceDurationSec || 5) : newMsg.fileInfo?.name),
        reply_to_id: (newMsg.replyTo?.id && isUuid(newMsg.replyTo.id)) ? newMsg.replyTo.id : undefined,
        status: initialStatus,
      })
        .then((inserted) => {
          if (inserted) {
            const realMsg = mapDirectMessageRowToChatMessage(inserted, currentUser.id);
            setSelectedChat((curr) => {
              if (!curr || curr.id !== targetChatId) return curr;
              return {
                ...curr,
                messages: curr.messages.map((m) => (m.id === newMsg.id ? realMsg : m)),
              };
            });
            setConversations((prev) =>
              prev.map((c) =>
                c.id === targetChatId
                  ? {
                      ...c,
                      messages: c.messages.map((m) => (m.id === newMsg.id ? realMsg : m)),
                    }
                  : c
              )
            );
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 50);
          }
        })
        .catch((e) => console.warn('sendDirectMessageToDb error:', e));
    }
  };


  // Handle sending text message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    // Handle Edit Mode for Personal Chat
    if (editingPersonalMessage && selectedChat) {
      const trimmed = inputText.trim();
      const targetChatId = selectedChat.id;
      const updatedMsgs = selectedChat.messages.map((m) =>
        m.id === editingPersonalMessage.id
          ? { ...m, text: trimmed, isEdited: true }
          : m
      );
      const isLast =
        selectedChat.messages[selectedChat.messages.length - 1]?.id ===
        editingPersonalMessage.id;
      const updatedChat: ChatConversation = {
        ...selectedChat,
        messages: updatedMsgs,
        lastMessage: isLast ? trimmed : selectedChat.lastMessage,
      };
      setSelectedChat(updatedChat);
      setConversations((prev) =>
        prev.map((c) => (c.id === targetChatId ? updatedChat : c))
      );
      setEditingPersonalMessage(null);
      setInputText('');
      setShowEmojiPicker(false);
      showToast('Mesaj redaktə edildi', 'success');
      return;
    }

    const currentTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const isBlockedByPartner = isViewerBlockedByTarget(currentUser?.id, selectedChat?.id);
    const isPending = isConversationPendingRequest(currentUser?.id, selectedChat);
    const isPartnerOnline = !isBlockedByPartner && !isPending && Boolean(selectedChat?.isOnline);
    const initialStatus: 'sent' | 'delivered' = (isPartnerOnline && !isPending) ? 'delivered' : 'sent';

    const myId = currentUser?.id || 'me';
    const isGroup = selectedChat?.category === 'group';
    const isGroupAdmin = Boolean(
      isGroup && (selectedChat?.creatorId === myId || selectedChat?.admins?.includes(myId))
    );
    const hasAtAll = inputText.includes('@all');
    const isAnnouncement = Boolean(isGroup && isGroupAdmin && hasAtAll);

    const newMsgId = 'msg_' + Date.now();
    const newMsg: ChatMessage = {
      id: newMsgId,
      senderId: myId,
      senderName: currentUserName,
      isOutgoing: true,
      text: inputText.trim(),
      time: currentTime,
      status: initialStatus,
      isAnnouncement,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            text: replyingTo.text || 'Media',
          }
        : undefined,
    };

    if (sectionMode === 'global') {
      setGlobalMessages((prev) => [...prev, newMsg]);
      setInputText('');
      setReplyingTo(null);
      return;
    }

    if (!selectedChat) return;
    const sentText = inputText.trim();
    appendOutgoingMessage(newMsg, sentText);

    if (isAnnouncement) {
      showToast('Bütün qrup üzvlərinə @all bildirişi göndərildi 📢');
    }

    // Typing bitirildi bildirişi göndər
    if (typingBroadcastChannelRef.current && currentUser?.id) {
      typingBroadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUser.id, isTyping: false },
      });
    }

    setInputText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
  };

  // File attachment selection handler (Max 5 files, total max 200 MB)
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Constraint 1: Maximum 5 files
    if (files.length > 5) {
      setFileErrorAlert('Maksimum 5 ədəd fayl seçə bilərsiniz.');
      setTimeout(() => setFileErrorAlert(null), 4000);
      e.target.value = '';
      return;
    }

    // Constraint 2: Combined total size <= 200 MB
    const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
    const maxBytes = 200 * 1024 * 1024; // 200 MB
    if (totalBytes > maxBytes) {
      setFileErrorAlert('Fayılların ümumi həcmi 200 MB-dan çox ola bilməz.');
      setTimeout(() => setFileErrorAlert(null), 4000);
      e.target.value = '';
      return;
    }

    const formatFileSize = (bytes: number) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const currentTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    files.forEach((file, index) => {
      const fileUrl = URL.createObjectURL(file);
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      const isAud = file.type.startsWith('audio/');
      const extension = file.name.split('.').pop()?.toUpperCase() || 'FILE';

      const fileMsg: ChatMessage = {
        id: 'file_' + Date.now() + '_' + index,
        senderId: 'me',
        senderName: currentUserName,
        isOutgoing: true,
        time: currentTime,
        status: 'sent',
        type: isImg ? 'image' : isVid ? 'video' : isAud ? 'voice' : 'file',
        mediaUrl: isImg || isVid || isAud ? fileUrl : undefined,
        // CRITICAL REQUIREMENT: For images & videos, do NOT show file name
        text: isImg || isVid ? undefined : file.name,
        fileInfo: {
          name: file.name,
          size: formatFileSize(file.size),
          bytes: file.size,
          extension,
          fileUrl,
        },
      };

      if (sectionMode === 'global') {
        setPendingGlobalMessage(fileMsg);
      } else {
        appendOutgoingMessage(
          fileMsg,
          isImg ? '📷 Şəkil' : isVid ? '🎥 Video' : isAud ? '🎤 Səsli mesaj' : `📎 ${file.name}`
        );
      }
    });

    e.target.value = '';
    setIsAttachSheetOpen(false);
  };

  // Handler for sharing location in AttachmentBottomSheet
  const handleShareLocation = () => {
    setIsAttachSheetOpen(false);
    const currentTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const locMsg: ChatMessage = {
      id: 'loc_' + Date.now(),
      senderId: 'me',
      senderName: currentUserName,
      isOutgoing: true,
      time: currentTime,
      status: 'sent',
      type: 'location',
      text: '📍 Bakı, Azərbaycan',
      locationInfo: {
        latitude: 40.4093,
        longitude: 49.8671,
        title: 'Məkanım',
        address: 'Bakı şəhəri, Heydər Əliyev prospekti',
      },
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            text: replyingTo.text || '📍 Məkan',
          }
        : undefined,
    };

    if (sectionMode === 'global') {
      setPendingGlobalMessage(locMsg);
    } else {
      appendOutgoingMessage(locMsg, '📍 Məkan');
    }
    setReplyingTo(null);
  };

  // Photo Editor Send callback
  const handleSendEditedImage = (imageDataUrl: string, caption?: string) => {
    const currentTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const imgMsg: ChatMessage = {
      id: 'img_' + Date.now(),
      senderId: 'me',
      senderName: currentUserName,
      isOutgoing: true,
      time: currentTime,
      status: 'sent',
      type: 'image',
      mediaUrl: imageDataUrl,
      text: caption || undefined,
    };

    if (sectionMode === 'global') {
      setPendingGlobalMessage(imgMsg);
    } else {
      appendOutgoingMessage(imgMsg, '📷 Şəkil');
    }
  };

  // Convert ChatConversation or custom info to UserProfile for readOnly ProfileCardModal
  const handleOpenUserProfile = (chat: ChatConversation) => {
    const nameParts = chat.name.split(' ');
    const profile: UserProfile = {
      id: chat.id,
      firstName: nameParts[0] || chat.name,
      lastName: nameParts.slice(1).join(' ') || '',
      balance: 0,
      profession: chat.profession || 'Lumora İstifadəçisi',
      experience: chat.experience || '2 il təcrübə',
      avatarUrl: chat.avatarUrl || '',
      userCode: chat.userCode || '',
      tags: chat.tags || ['Dizayn', 'Texnologiya', 'Lumora'],
    };
    setViewingProfile(profile);
  };

  // Start chat directly with a found UserProfile
  const handleStartChatWithUser = (user: UserProfile) => {
    const fullName = `${user.firstName} ${user.lastName}`.trim() || user.username || 'İstifadəçi';
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    // Check if already exists in conversations
    const existing = conversations.find(
      (c) => c.id === user.id || (user.userCode && c.userCode === user.userCode)
    );

    if (existing) {
      setSelectedChat(existing);
    } else {
      const isAccepted = isChatPairAccepted(currentUser?.id, user.id);
      const newConv: ChatConversation = {
        id: user.id, // REAL Supabase Profile UUID!
        name: fullName,
        avatarType: user.avatarUrl ? 'photo' : 'initial',
        avatarUrl: user.avatarUrl,
        userCode: user.userCode,
        profession: user.profession || 'İstifadəçi',
        experience: user.experience || 'Yeni',
        tags: user.tags || ['İstifadəçi'],
        lastMessage: '',
        lastMessageTime: timeStr,
        lastMessageStatus: 'sent',
        category: isAccepted ? 'direct' : 'request',
        isOnline: Boolean(user.isOnline),
        lastSeen: user.lastSeen || undefined,
        unreadCount: 0,
        messages: [],
      };

      setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== user.id)]);
      setSelectedChat(newConv);
    }

    setViewingProfile(null);
    setIsAddUserModalOpen(false);
    setSectionMode('personal');
  };

  // Three-dots Sub-option a) Mesajları Sil: Yalnız mesajları təmizləyir
  const handleDeleteMessagesOnly = async () => {
    if (!selectedChat) return;
    const targetId = selectedChat.id;
    const myId = currentUser?.id;

    // Supabase DB: həmin şəxslə olan bütün mesajlar təmizlənsin
    if (myId && isUuid(myId) && isUuid(targetId)) {
      try {
        await deleteDirectMessagesBetweenUsers(myId, targetId);
      } catch (err) {
        console.warn('handleDeleteMessagesOnly DB delete error:', err);
      }
    }

    const updated: ChatConversation = {
      ...selectedChat,
      messages: [],
      lastMessage: '',
      lastMessageStatus: 'sent',
    };
    setSelectedChat(updated);
    const updatedList = conversations.map((c) => (c.id === targetId ? updated : c));
    setConversations(updatedList);
    try {
      localStorage.setItem('lumora_chat_conversations', JSON.stringify(updatedList));
    } catch (e) {}

    setIsMenuOpen(false);
    setIsClearOptionsOpen(false);
    showToast('Mesajlar təmizləndi');
  };

  // Three-dots Sub-option b) İstifadəçini Sil: Həm mesajları təmizləyir, həm də istifadəçilər arasındakı əlaqəni silərək adamı əlaqələr/çat siyahısından tamamilə yox edir
  const handleDeleteUserAndMessages = async () => {
    if (!selectedChat) return;
    const targetId = selectedChat.id;
    const myId = currentUser?.id;
    const partnerName = selectedChat.name;

    // 1. Supabase DB: mesajları və əlaqəni (friendship row) sil
    if (myId && isUuid(myId) && isUuid(targetId)) {
      try {
        await deleteUserFriendshipAndMessagesInDb(myId, targetId);
      } catch (err) {
        console.warn('handleDeleteUserAndMessages DB delete error:', err);
      }
    }

    // 2. Local əlaqə qeydlərindən (friendship / accepted pair) sil
    if (myId) {
      removeAcceptedChatPair(myId, targetId);
      setAcceptedChats((prev) => prev.filter((id) => id !== targetId));
    }

    // 3. Çat siyahısından tamamilə yox et
    const updatedList = conversations.filter((c) => c.id !== targetId);
    setConversations(updatedList);
    try {
      localStorage.setItem('lumora_chat_conversations', JSON.stringify(updatedList));
    } catch (e) {}

    setSelectedChat(null);
    setIsMenuOpen(false);
    setIsClearOptionsOpen(false);
    showToast(`"${partnerName}" və bütün mesajlar silindi`);
  };

  const handleClearAllMessages = handleDeleteMessagesOnly;

  // Three-dots: Enter Multi-Select Mode for manual deletion
  const handleStartManualSelection = () => {
    setIsMultiSelectMode(true);
    setSelectedMsgIds(new Set());
    setIsMenuOpen(false);
    setIsClearOptionsOpen(false);
  };

  // Toggle single message in multi-select mode
  const handleToggleSelectMessage = (msgId: string) => {
    setSelectedMsgIds((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  };

  // Delete selected messages
  const handleDeleteSelectedMessages = () => {
    if (!selectedChat || selectedMsgIds.size === 0) return;
    const remainingMsgs = selectedChat.messages.filter(
      (m) => !selectedMsgIds.has(m.id)
    );
    const lastMsg =
      remainingMsgs.length > 0
        ? remainingMsgs[remainingMsgs.length - 1].text || '[Fayl]'
        : 'Söhbət təmizləndi';

    const updated: ChatConversation = {
      ...selectedChat,
      messages: remainingMsgs,
      lastMessage: lastMsg,
    };
    setSelectedChat(updated);
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedChat.id ? updated : c))
    );
    setIsMultiSelectMode(false);
    setSelectedMsgIds(new Set());
  };

  // Select all / Deselect all in multi-select mode
  const handleToggleSelectAll = () => {
    if (!selectedChat) return;
    if (selectedMsgIds.size === selectedChat.messages.length) {
      setSelectedMsgIds(new Set());
    } else {
      setSelectedMsgIds(new Set(selectedChat.messages.map((m) => m.id)));
    }
  };

  // Real filtered users from Supabase search (by 8-digit user_code or first/last name)
  const searchResultsUsers: UserProfile[] = searchedUsers;

  // Handle Accept Message Request
  const handleAcceptRequest = async () => {
    if (!selectedChat) return;
    const targetId = selectedChat.id;
    const myId = currentUser?.id;

    // 1. Supabase DB: həmin mesajların statusunu 'read' (2 mavi quş) et
    if (myId && isUuid(myId) && isUuid(targetId)) {
      try {
        await supabase
          .from('direct_messages')
          .update({ status: 'read' })
          .eq('sender_id', targetId)
          .eq('receiver_id', myId);
      } catch (err) {
        console.warn('handleAcceptRequest update status error:', err);
      }
    }

    if (myId) {
      recordAcceptedChatPair(myId, targetId);
    }
    setAcceptedChats((prev) => (prev.includes(targetId) ? prev : [...prev, targetId]));

    // Broadcast messages_read to sender so their screen immediately updates to 2 blue ticks
    if (chatChannelRef.current && myId && targetId) {
      chatChannelRef.current.send({
        type: 'broadcast',
        event: 'messages_read',
        payload: { readerId: myId, senderId: targetId },
      });
    }

    // 2. UI-da mesajların statusu dərhal 'read' (2 mavi quş) yenilənsin
    const updatedMessages = (selectedChat.messages || []).map((m) => ({
      ...m,
      status: 'read' as const,
    }));

    const updatedChat: ChatConversation = {
      ...selectedChat,
      category: 'direct',
      lastMessageStatus: 'read',
      messages: updatedMessages,
    };
    setSelectedChat(updatedChat);
    const updatedList = conversations.map((c) =>
      c.id === targetId ? updatedChat : c
    );
    setConversations(updatedList);

    try {
      localStorage.setItem('lumora_chat_conversations', JSON.stringify(updatedList));
    } catch (e) {
      console.warn(e);
    }

    // 3. Immediately fetch partner online status now that request is accepted
    if (isUuid(targetId)) {
      supabase
        .from('profiles')
        .select('is_online, last_seen')
        .eq('id', targetId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            const isOnline = Boolean(data.is_online);
            const lastSeen = data.last_seen || null;
            setSelectedChat((curr) =>
              curr && curr.id === targetId ? { ...curr, isOnline, lastSeen } : curr
            );
            setConversations((prev) =>
              prev.map((c) => (c.id === targetId ? { ...c, isOnline, lastSeen } : c))
            );
          }
        });
    }

    showToast('Mesaj istəyi qəbul edildi. Artıq yazışa bilərsiniz!');
  };

  // Handle Report User and insert into Supabase public.reports
  const handleReportUser = (reason: string, details: string, blockUser: boolean) => {
    if (!selectedChat) return;
    const targetId = selectedChat.id;
    const targetName = selectedChat.name;
    const targetAvatar = selectedChat.avatarUrl;
    const targetCode = selectedChat.userCode;

    if (currentUser?.id && targetId && isUuid(currentUser.id) && isUuid(targetId)) {
      submitReportToDb({
        reporter_id: currentUser.id,
        reported_user_id: targetId,
        reason,
        details,
      }).catch((e) => console.warn('submitReportToDb error:', e));
    }

    if (blockUser) {
      handleBlockUser(targetId, targetName, targetAvatar, targetCode, reason);
    }
    showToast(`"${targetName}" haqqında şikayətiniz qeydə alındı (${reason}).`);
  };

  // Toggle Mute / Unmute Notifications for active chat
  const handleToggleMuteNotifications = () => {
    if (!selectedChat) return;
    const newMuted = !selectedChat.isMuted;
    const updatedChat: ChatConversation = { ...selectedChat, isMuted: newMuted };
    setSelectedChat(updatedChat);
    const updatedList = conversations.map((c) =>
      c.id === selectedChat.id ? updatedChat : c
    );
    setConversations(updatedList);
    try {
      localStorage.setItem('lumora_chat_conversations', JSON.stringify(updatedList));
    } catch (e) {
      console.warn(e);
    }
    setIsMenuOpen(false);
    showToast(
      newMuted
        ? `"${selectedChat.name}" üçün bildirişlər söndürüldü`
        : `"${selectedChat.name}" üçün bildirişlər aktivləşdirildi`
    );
  };

  // Pin / Unpin Conversation from Chat List
  const handleTogglePinConversation = (convId: string) => {
    let wasPinned = false;
    const updated = conversations.map((c) => {
      if (c.id === convId) {
        wasPinned = !c.isPinned;
        return { ...c, isPinned: !c.isPinned };
      }
      return c;
    });
    setConversations(updated);
    try {
      localStorage.setItem('lumora_chat_conversations', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    setContextChat(null);
    showToast(
      wasPinned
        ? 'Söhbət başa bərkidildi'
        : 'Söhbət başa bərkidilmişlərdən çıxarıldı'
    );
  };

  // Confirm and delete chat and all messages from Supabase (Long Press / Delete modal)
  const handleConfirmDeleteChatFromList = async () => {
    if (!chatToDelete) return;
    const targetId = chatToDelete.id;
    const myId = currentUser?.id;
    const partnerName = chatToDelete.name;

    // Supabase DB: həmin şəxslə olan bütün mesajlar təmizlənsin (Delete from messages)
    if (myId && isUuid(myId) && isUuid(targetId)) {
      try {
        await deleteDirectMessagesBetweenUsers(myId, targetId);
      } catch (err) {
        console.warn('handleConfirmDeleteChatFromList DB delete error:', err);
      }
    }

    if (myId) {
      removeAcceptedChatPair(myId, targetId);
      setAcceptedChats((prev) => prev.filter((id) => id !== targetId));
    }

    const updated = conversations.filter((c) => c.id !== targetId);
    setConversations(updated);
    try {
      localStorage.setItem('lumora_chat_conversations', JSON.stringify(updated));
    } catch (e) {}

    if (selectedChat?.id === targetId) {
      setSelectedChat(null);
    }
    setChatToDelete(null);
    setContextChat(null);
    showToast(`"${partnerName}" ilə söhbət və bütün mesajlar silindi`);
  };

  // Delete Conversation triggers modal warning
  const handleDeleteConversation = (convId: string) => {
    const target = conversations.find((c) => c.id === convId);
    if (target) {
      setChatToDelete(target);
    }
  };

  // Touch and Mouse handlers for conversation item Long-Press
  const handleTouchStart = (conv: ChatConversation, e: React.TouchEvent) => {
    touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    isLongPressActiveRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(40);
        } catch (err) {
          console.warn(err);
        }
      }
      setChatToDelete(conv);
    }, 450);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartPosRef.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartPosRef.current.y);
    if (dx > 10 || dy > 10) {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const handleMouseDown = (conv: ChatConversation) => {
    isLongPressActiveRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      setChatToDelete(conv);
    }, 450);
  };

  const handleMouseUp = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const handleConvClick = (conv: ChatConversation) => {
    if (isLongPressActiveRef.current) {
      isLongPressActiveRef.current = false;
      return;
    }
    setIsMenuOpen(false);
    setIsClearOptionsOpen(false);
    setIsAttachSheetOpen(false);
    setReplyingTo(null);

    const clearedConv = { ...conv, unreadCount: 0 };
    setSelectedChat(clearedConv);
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
    );
  };

  const handleContextMenu = (e: React.MouseEvent, conv: ChatConversation) => {
    e.preventDefault();
    setChatToDelete(conv);
  };

  const formatCallTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
      {/* Hidden file inputs for file & media attachments */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="*/*"
        onChange={handleFilesSelected}
        className="hidden"
      />
      <input
        ref={documentInputRef}
        type="file"
        multiple
        accept="*/*"
        onChange={handleFilesSelected}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFilesSelected}
        className="hidden"
      />
      <input
        ref={audioInputRef}
        type="file"
        multiple
        accept="audio/*"
        onChange={handleFilesSelected}
        className="hidden"
      />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.97 }}
        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
        className={`w-full h-full sm:h-[92vh] sm:max-w-md sm:rounded-[36px] overflow-hidden flex flex-col shadow-2xl relative select-none border transition-colors ${
          isDark
            ? 'bg-[#121b22] border-white/15 text-white'
            : 'bg-[#f0f2f5] border-black/10 text-gray-900'
        }`}
      >
        {/* File Error Alert Banner */}
        <AnimatePresence>
          {fileErrorAlert && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-3 inset-x-3 z-50 p-3 rounded-2xl bg-red-500 text-white text-xs font-semibold flex items-center gap-2 shadow-2xl"
            >
              <AlertCircle size={18} className="shrink-0" />
              <span className="flex-1">{fileErrorAlert}</span>
              <button
                type="button"
                onClick={() => setFileErrorAlert(null)}
                className="p-1 hover:bg-white/20 rounded-full cursor-pointer"
              >
                <X size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Toast Notification Banner */}
        <AnimatePresence>
          {chatToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`absolute top-3 inset-x-3 z-50 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-2xl border ${
                chatToast.type === 'warning'
                  ? 'bg-amber-600 text-white border-amber-400'
                  : 'bg-emerald-600 text-white border-emerald-500'
              }`}
            >
              {chatToast.type === 'warning' ? (
                <AlertCircle size={18} className="shrink-0" />
              ) : (
                <Check size={18} strokeWidth={2.5} className="shrink-0" />
              )}
              <span className="flex-1 leading-snug">{chatToast.message}</span>
              <button
                type="button"
                onClick={() => setChatToast(null)}
                className="opacity-70 hover:opacity-100 cursor-pointer p-0.5"
              >
                <X size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ======================================================== */}
        {/* VIEW 1: ACTIVE CONVERSATION                              */}
        {/* ======================================================== */}
        {selectedChat ? (() => {
          const myId = currentUser?.id || 'me';
          const isRemovedFromGroup = Boolean(
            selectedChat.category === 'group' &&
            (selectedChat.removedMembers?.includes(myId) ||
             (selectedChat.members && selectedChat.members.length > 0 && !selectedChat.members.includes(myId)))
          );

          // SƏRT INTERCEPTOR: Bloklama Zamanı Mütləq Məxfilik (Online Status Restriction)
          // Xəta: Bloklanan və ya bloklayan tərəf hələ də qarşı tərəfin is_online statusunu görə bilir.
          // Həlli: Çat başlığında (Header) istifadəçi məlumatları render edilməmişdən əvvəl sərt bir Interceptor/Condition yaz.
          // Əgər hər hansı tərəf digərini bloklayıbsa (status === 'blocked'), is_online dəyərini MƏCBURİ şəkildə false, last_seen dəyərini isə null et.
          // Ekranda heç bir "Online" mətni və ya yaşıl nöqtə görünməməlidir.
          const isBlockedByMe = blockedUsers.some((b) => b.id === selectedChat.id) || isTargetBlockedByViewer(currentUser?.id, selectedChat.id);
          const isBlockedByThem = isViewerBlockedByTarget(currentUser?.id, selectedChat.id);
          const isAnyBlocked = isBlockedByMe || isBlockedByThem || isMutualBlocked(currentUser?.id, selectedChat.id) || (selectedChat as any).status === 'blocked' || (selectedChat as any).isBlocked === true;

          const effectiveHeaderOnline = isAnyBlocked ? false : Boolean(selectedChat.isOnline);
          const effectiveHeaderLastSeen = isAnyBlocked ? null : selectedChat.lastSeen;

          return (
            <div className="flex-1 flex flex-col h-full relative overflow-hidden">
            {/* Header: Normal Mode vs Multi-Select Mode */}
            {isMultiSelectMode ? (
              /* Multi-Select Action Bar */
              <div
                className={`px-3 py-2.5 flex items-center justify-between border-b shadow-xs z-30 ${
                  isDark
                    ? 'bg-[#1f2c34] border-white/10 text-white'
                    : 'bg-emerald-600 border-emerald-700 text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMultiSelectMode(false);
                      setSelectedMsgIds(new Set());
                    }}
                    className="p-1.5 rounded-full hover:bg-white/10 cursor-pointer"
                    title={t.cancel}
                  >
                    <X size={20} />
                  </button>
                  <span className="font-bold text-sm">
                    {t.messagesSelected(selectedMsgIds.size)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/15 hover:bg-white/25 cursor-pointer"
                  >
                    {selectedMsgIds.size === selectedChat.messages.length
                      ? t.deselectAll
                      : t.selectAll}
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteSelectedMessages}
                    disabled={selectedMsgIds.size === 0}
                    className={`p-2 rounded-full cursor-pointer transition-colors ${
                      selectedMsgIds.size > 0
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-md'
                        : 'opacity-40 cursor-not-allowed text-gray-300'
                    }`}
                    title={t.deleteSelected}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ) : (
              /* Standard Active Chat Header */
              <div
                className={`px-3 py-2.5 flex items-center justify-between border-b shadow-xs z-20 ${
                  isDark
                    ? 'bg-[#1f2c34] border-white/10 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
              >
                {/* User Info Bar - Click opens User Profile (readOnly) or Group Profile Modal */}
                <div
                  className="flex items-center gap-2.5 truncate flex-1 mr-2 cursor-pointer hover:opacity-85 transition-opacity"
                  onClick={() => {
                    if (selectedChat.category === 'group') {
                      setIsGroupSettingsModalOpen(true);
                    } else {
                      handleOpenUserProfile(selectedChat);
                    }
                  }}
                  title={selectedChat.category === 'group' ? 'Qrup məlumatı' : t.viewProfile}
                >
                  {/* Back button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      setIsClearOptionsOpen(false);
                      setIsAttachSheetOpen(false);
                      setReplyingTo(null);
                      if (selectedChat?.id) {
                        setConversations((prev) =>
                          prev.map((c) => (c.id === selectedChat.id ? { ...c, unreadCount: 0 } : c))
                        );
                      }
                      setSelectedChat(null);
                    }}
                    className="p-1.5 -ml-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-gray-700 dark:text-gray-200"
                    aria-label={t.back}
                  >
                    <ArrowLeft size={22} />
                  </button>

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {selectedChat.avatarType === 'photo' && selectedChat.avatarUrl ? (
                      <img
                        src={selectedChat.avatarUrl}
                        alt={selectedChat.name}
                        className="w-10 h-10 rounded-full object-cover shadow-xs"
                      />
                    ) : selectedChat.avatarType === 'initial' ? (
                      <div
                        className={`w-10 h-10 rounded-full font-bold text-base flex items-center justify-center shadow-xs ${
                          selectedChat.avatarBgColor || 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {selectedChat.initial || selectedChat.name.charAt(0)}
                      </div>
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xs ${
                          selectedChat.avatarBgColor || 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {selectedChat.category === 'group' ? (
                          <Users size={20} />
                        ) : (
                          <User size={20} />
                        )}
                      </div>
                    )}
                    {!isAnyBlocked && !shouldHideOnlineStatus(currentUser?.id, selectedChat.id, selectedChat) && effectiveHeaderOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#1f2c34] rounded-full" />
                    )}
                  </div>

                  {/* Title & Subtitle */}
                  <div className="truncate">
                    <h3 className="font-semibold text-sm leading-tight truncate text-gray-950 dark:text-white flex items-center gap-1.5">
                      <span className="truncate">{selectedChat.name}</span>
                      {selectedChat.isMuted && (
                        <span title={t.mutedTooltip} className="inline-flex shrink-0">
                          <BellOff
                            size={13}
                            className="text-amber-500 dark:text-amber-400"
                          />
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] leading-tight mt-0.5 truncate">
                      {isRecipientTyping && !isAnyBlocked ? (
                        <span className="text-emerald-500 font-semibold animate-pulse">
                          {t.typing || 'Yazır...'}
                        </span>
                      ) : selectedChat.category === 'group' ? (
                        <span className="opacity-65 text-gray-500 dark:text-gray-400">
                          {selectedChat.subtitle || `${selectedChat.members?.length || 1} üzv`}
                        </span>
                      ) : isAnyBlocked || shouldHideOnlineStatus(currentUser?.id, selectedChat.id, selectedChat) ? null : (
                        <span
                          className={
                            effectiveHeaderOnline
                              ? 'text-emerald-500 font-semibold'
                              : 'opacity-65 text-gray-500 dark:text-gray-400'
                          }
                        >
                          {formatLastSeen(effectiveHeaderOnline, effectiveHeaderLastSeen)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right Action Icons: Səsli Söhbət (Qruplar) və Menyu */}
                <div className="flex items-center gap-1.5 relative shrink-0 text-gray-600 dark:text-gray-300">
                  {selectedChat.category === 'group' && !isRemovedFromGroup && (
                    <button
                      type="button"
                      onClick={() => setIsVoiceHangoutOpen((prev) => !prev)}
                      className={`py-1.5 px-2.5 sm:px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95 ${
                        isVoiceHangoutOpen
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20'
                          : isDark
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                      }`}
                      title={isVoiceHangoutOpen ? 'Səsli söhbəti gizlət' : 'Səsli Söhbətə Qoşul'}
                    >
                      <Radio size={14} className={isVoiceHangoutOpen ? 'animate-pulse' : ''} />
                      <span className="hidden sm:inline">Səsli Söhbət</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(!isMenuOpen);
                      setIsClearOptionsOpen(false);
                    }}
                    className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors"
                    title={t.menu}
                  >
                    <MoreVertical size={20} />
                  </button>

                  {/* Three-dots Dropdown Menu */}
                  {isMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsClearOptionsOpen(false);
                        }}
                      />
                      <div
                        className={`absolute right-0 top-11 w-54 rounded-2xl p-1.5 shadow-2xl border z-50 ${
                        isDark
                          ? 'bg-[#233138] border-white/15 text-white'
                          : 'bg-white border-gray-200 text-gray-900'
                      }`}
                    >
                      {!isClearOptionsOpen ? (
                        <>
                          {selectedChat.category === 'group' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setIsMenuOpen(false);
                                setIsGroupSettingsModalOpen(true);
                              }}
                              className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-2 cursor-pointer text-emerald-500 font-semibold"
                            >
                              <Settings size={15} />
                              <span>{t.groupSettings || 'Qrup Ayarları'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenUserProfile(selectedChat);
                                setIsMenuOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                            >
                              <User size={15} className="opacity-70" />
                              <span>{t.viewProfile}</span>
                            </button>
                          )}

                          {/* Bildirişləri bağla / aç */}
                          <button
                            type="button"
                            onClick={handleToggleMuteNotifications}
                            className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              {selectedChat.isMuted ? (
                                <>
                                  <Bell size={15} className="text-emerald-500" />
                                  <span>{t.turnOnNotifications}</span>
                                </>
                              ) : (
                                <>
                                  <BellOff size={15} className="text-amber-500" />
                                  <span>{t.turnOffNotifications}</span>
                                </>
                              )}
                            </div>
                            {selectedChat.isMuted && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold">
                                {t.mutedBadge}
                              </span>
                            )}
                          </button>

                          {selectedChat.category !== 'group' && (
                            <>
                              {/* İstifadəçini şikayət et */}
                              <button
                                type="button"
                                onClick={() => {
                                  setIsMenuOpen(false);
                                  setIsReportModalOpen(true);
                                }}
                                className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-2 cursor-pointer text-amber-500 dark:text-amber-400"
                              >
                                <ShieldAlert size={15} />
                                <span>{t.reportUser}</span>
                              </button>

                              {/* İstifadəçini blokla */}
                              <button
                                type="button"
                                onClick={() => {
                                  setIsMenuOpen(false);
                                  if (selectedChat) {
                                    handleBlockUser(
                                      selectedChat.id,
                                      selectedChat.name,
                                      selectedChat.avatarUrl,
                                      selectedChat.userCode,
                                      'İstifadəçi tərəfindən bloklandı'
                                    );
                                    showToast(`"${selectedChat.name}" bloklandı`, 'info');
                                  }
                                }}
                                className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-red-500/10 text-red-500 flex items-center gap-2 cursor-pointer"
                              >
                                <UserX size={15} />
                                <span>{t.blockUser}</span>
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => setIsClearOptionsOpen(true)}
                            className="w-full text-left px-3 py-2 text-xs rounded-xl text-red-500 hover:bg-red-500/10 flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Trash2 size={15} />
                              <span>{t.clearChat}</span>
                            </div>
                            <ChevronDown size={14} className="-rotate-90" />
                          </button>
                        </>
                      ) : (
                        /* Sil Sub-options: a) Mesajları Sil, b) İstifadəçini Sil */
                        <div className="space-y-1">
                          <div className="px-3 py-1 text-[11px] font-bold opacity-60 border-b border-black/10 dark:border-white/10 mb-1 flex items-center justify-between">
                            <span>{t.clearChatTitle}</span>
                          </div>

                          {/* a) Mesajları Sil (Delete messages): Yalnız mesajları təmizləyir */}
                          <button
                            type="button"
                            onClick={handleDeleteMessagesOnly}
                            className="w-full text-left px-3 py-2 text-xs rounded-xl text-red-500 hover:bg-red-500/15 flex items-center gap-2.5 cursor-pointer font-medium transition-colors"
                          >
                            <Trash2 size={15} className="shrink-0 text-red-500" />
                            <div className="min-w-0 flex-1">
                              <div className="font-bold">{t.clearAll}</div>
                              <div className="text-[10px] opacity-70 font-normal truncate">
                                {t.clearAllDesc}
                              </div>
                            </div>
                          </button>

                          {/* b) İstifadəçini Sil (Delete user): Həm mesajları təmizləyir, həm də istifadəçilər arasındakı əlaqəni silərək adamı əlaqələr/çat siyahısından tamamilə yox edir */}
                          <button
                            type="button"
                            onClick={handleDeleteUserAndMessages}
                            className="w-full text-left px-3 py-2 text-xs rounded-xl text-red-600 hover:bg-red-600/15 flex items-center gap-2.5 cursor-pointer font-medium transition-colors"
                          >
                            <UserX size={15} className="shrink-0 text-red-600" />
                            <div className="min-w-0 flex-1">
                              <div className="font-bold">{t.deleteUser}</div>
                              <div className="text-[10px] opacity-70 font-normal truncate">
                                {t.deleteUserDesc}
                              </div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsClearOptionsOpen(false)}
                            className="w-full text-center py-1.5 text-[11px] opacity-60 hover:opacity-100 cursor-pointer pt-1"
                          >
                            {t.back}
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
                </div>
              </div>
            )}

            {/* Səsli Söhbət Otağı (Voice Hangout Panel) */}
            {selectedChat && selectedChat.category === 'group' && (
              <VoiceHangoutPanel
                isOpen={isVoiceHangoutOpen && !isRemovedFromGroup}
                onClose={() => setIsVoiceHangoutOpen(false)}
                groupName={selectedChat.name}
                currentUserId={myId}
                currentUserName={`${currentUser?.firstName || 'Siz'} ${currentUser?.lastName || ''}`.trim()}
                currentUserAvatar={currentUser?.avatarUrl}
                participants={(selectedChat.members || []).map((mId) => {
                  const contact = conversations.find((c) => c.id === mId);
                  return {
                    id: mId,
                    name: contact?.name || 'Üzv',
                    avatarUrl: contact?.avatarUrl,
                  };
                })}
                isDark={isDark}
              />
            )}

            {/* Conversation Messages Stream with Live Animated Mesh Gradient */}
            <div className="flex-1 relative overflow-hidden flex flex-col z-10">
              {/* Real-time live fluid animation matching the video, watermark-free */}
              <ChatFluidBackground isDark={isDark} />

              {isRemovedFromGroup ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none z-20">
                  <div className="w-16 h-16 rounded-3xl bg-gray-500/10 dark:bg-white/5 border border-gray-500/20 flex items-center justify-center text-gray-400 mb-3 shadow-inner">
                    <Users size={32} className="opacity-60" />
                  </div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                    Siz artıq bu qrupun üzvü deyilsiniz
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs leading-relaxed">
                    Bu qrupdan çıxdığınız və ya çıxarıldığınız üçün mesajlar gizlədildi.
                  </p>
                </div>
              ) : (
                <div
                  ref={chatScrollContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 relative overflow-y-auto p-3 sm:p-4 space-y-2.5 z-10"
                >
                  {/* Date Chip */}
                  <div className="flex justify-center my-2 relative z-10">
                    <span
                      className={`text-[11px] font-semibold px-3 py-1 rounded-lg shadow-sm border backdrop-blur-md ${
                        isDark
                          ? 'bg-black/40 border-white/15 text-white/90'
                          : 'bg-white/80 border-gray-200 text-gray-800'
                      }`}
                    >
                      {t.today}
                    </span>
                  </div>

                  {/* Empty messages hint */}
                  {selectedChat.messages.length === 0 && (
                    <div className="py-12 text-center text-xs opacity-60">
                      {t.noMessagesYet}
                    </div>
                  )}

                  {/* Message Bubbles */}
                  {selectedChat.messages.map((msg) => {
                    if (msg.isSystem || msg.type === 'system') {
                      return (
                        <div key={msg.id} className="flex justify-center my-2 select-none">
                          <div
                            className={`px-3.5 py-1.5 rounded-xl text-[11px] font-medium max-w-sm text-center shadow-xs border ${
                              isDark
                                ? 'bg-[#182229]/90 border-white/10 text-gray-300'
                                : 'bg-gray-200/90 border-gray-300 text-gray-700'
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    }

                    const isMe = msg.isOutgoing;
                    const isSelected = selectedMsgIds.has(msg.id);
                    const isHighlighted = highlightedMsgId === msg.id;
                    const isGroupAnnouncement = Boolean(
                      selectedChat.category === 'group' &&
                      (msg.isAnnouncement || (msg.text?.includes('@all') && (selectedChat.admins?.includes(msg.senderId) || selectedChat.creatorId === msg.senderId)))
                    );

                    // WhatsApp Quşları: Əgər əlaqə pending (İstək) mərhələsindədirsə, status MÜTLƏQ yalnız 'sent' (1 boz quş) olaraq render edilməlidir!
                    const isChatPending = isConversationPendingRequest(currentUser?.id, selectedChat);
                    const effectiveStatus: 'sent' | 'delivered' | 'read' = isChatPending ? 'sent' : (msg.status || 'sent');

                  return (
                    <div
                      key={msg.id}
                      id={'message-' + msg.id}
                      className={`relative w-full overflow-hidden my-0.5 group rounded-2xl transition-all duration-300 ${
                        isHighlighted
                          ? 'ring-4 ring-amber-400 bg-amber-400/30 dark:bg-amber-400/20 p-1 scale-[1.01] shadow-xl'
                          : ''
                      }`}
                    >
                      <div
                        onClick={() => {
                          if (isMultiSelectMode) handleToggleSelectMessage(msg.id);
                        }}
                        className={`flex items-center gap-2 relative z-10 ${
                          isMe ? 'justify-end' : 'justify-start'
                        } ${isMultiSelectMode ? 'cursor-pointer' : ''}`}
                      >
                        {/* Multi-select checkbox on left */}
                        {isMultiSelectMode && (
                          <div className="shrink-0 p-1">
                            {isSelected ? (
                              <CheckSquare size={20} className="text-emerald-500" />
                            ) : (
                              <Square size={20} className="text-gray-400" />
                            )}
                          </div>
                        )}

                        <motion.div
                          drag="x"
                          dragConstraints={{ left: 0, right: 0 }}
                          dragElastic={0.35}
                          onDragEnd={(_e, info) => {
                            if (!isMultiSelectMode && (info.offset.x > 40 || info.offset.x < -40)) {
                              setReplyingTo(msg);
                              if (typeof window !== 'undefined' && window.navigator?.vibrate) {
                                window.navigator.vibrate(20);
                              }
                            }
                          }}
                          onContextMenu={(e) => {
                            if (isMe && !isMultiSelectMode) {
                              e.preventDefault();
                              setSelectedMsgForAction(msg);
                            }
                          }}
                          onTouchStart={() => {
                            if (isMe && !isMultiSelectMode) {
                              msgLongPressTimerRef.current = setTimeout(() => {
                                setSelectedMsgForAction(msg);
                                if (typeof window !== 'undefined' && window.navigator?.vibrate) {
                                  window.navigator.vibrate(30);
                                }
                              }, 450);
                            }
                          }}
                          onTouchMove={() => {
                            if (msgLongPressTimerRef.current) {
                              clearTimeout(msgLongPressTimerRef.current);
                              msgLongPressTimerRef.current = null;
                            }
                          }}
                          onTouchEnd={() => {
                            if (msgLongPressTimerRef.current) {
                              clearTimeout(msgLongPressTimerRef.current);
                              msgLongPressTimerRef.current = null;
                            }
                          }}
                          onMouseDown={() => {
                            if (isMe && !isMultiSelectMode) {
                              msgLongPressTimerRef.current = setTimeout(() => {
                                setSelectedMsgForAction(msg);
                              }, 450);
                            }
                          }}
                          onMouseMove={() => {
                            if (msgLongPressTimerRef.current) {
                              clearTimeout(msgLongPressTimerRef.current);
                              msgLongPressTimerRef.current = null;
                            }
                          }}
                          onMouseUp={() => {
                            if (msgLongPressTimerRef.current) {
                              clearTimeout(msgLongPressTimerRef.current);
                              msgLongPressTimerRef.current = null;
                            }
                          }}
                          className={`relative max-w-[75%] sm:max-w-[62%] rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-md transition-all group backdrop-blur-md cursor-grab active:cursor-grabbing select-none ${
                            isSelected
                              ? 'ring-2 ring-emerald-500'
                              : ''
                          } ${
                            isGroupAnnouncement
                              ? 'ring-2 ring-amber-400 border-amber-500/50 shadow-amber-500/10'
                              : ''
                          } ${
                            isMe
                              ? isDark
                                ? isGroupAnnouncement ? 'bg-amber-950/40 text-white rounded-tr-xs border border-amber-500/30' : 'bg-[#005c4b]/85 text-white rounded-tr-xs border border-white/10'
                                : isGroupAnnouncement ? 'bg-amber-100 text-gray-900 rounded-tr-xs border border-amber-400' : 'bg-[#d9fdd3]/90 text-gray-900 rounded-tr-xs border border-emerald-500/20'
                              : isDark
                              ? isGroupAnnouncement ? 'bg-amber-950/40 text-white rounded-tl-xs border border-amber-500/30' : 'bg-[#1e293b]/85 text-white rounded-tl-xs border border-white/10'
                              : isGroupAnnouncement ? 'bg-amber-100 text-gray-900 rounded-tl-xs border border-amber-400' : 'bg-white/90 text-gray-900 rounded-tl-xs border border-gray-200/60'
                          }`}
                        >
                          {/* Group Announcement Header */}
                          {isGroupAnnouncement && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 dark:text-amber-400 mb-1.5 pb-1 border-b border-amber-500/30">
                              <Megaphone size={12} className="animate-pulse" />
                              <span>Qrup Bildirişi (@all)</span>
                            </div>
                          )}
                          {/* Group Sender Name with Color (Clickable to open profile) */}
                          {!isMe && selectedChat.category === 'group' && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingProfile({
                                  id: msg.senderId || 'usr',
                                  firstName: msg.senderName.split(' ')[0] || msg.senderName,
                                  lastName: msg.senderName.split(' ').slice(1).join(' ') || '',
                                  username: `@${msg.senderName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
                                  userCode: selectedChat.userCode || '',
                                  balance: 0,
                                  profession: 'Qrup Üzvü',
                                  experience: '1 il təcrübə',
                                  avatarUrl: msg.senderAvatar,
                                  tags: ['Qrup', selectedChat.name, 'Lumora'],
                                });
                              }}
                              className="font-bold text-[10px] mb-1 leading-none cursor-pointer hover:underline"
                              style={{ color: msg.senderColor || '#e65100' }}
                              title={t.viewProfile}
                            >
                              {msg.senderName}
                            </div>
                          )}

                          {/* WhatsApp-style Quote Block (Reply) */}
                          {msg.replyTo && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                if (msg.replyTo?.id) {
                                  handleScrollToMessage(msg.replyTo.id);
                                }
                              }}
                              className={`mb-2 px-2.5 py-1.5 rounded-lg border-l-4 text-xs select-none cursor-pointer transition-all hover:opacity-90 active:scale-[0.98] ${
                                isMe
                                  ? isDark
                                    ? 'bg-black/35 border-emerald-400 text-white/90 hover:bg-black/50'
                                    : 'bg-emerald-950/10 border-emerald-600 text-gray-900 hover:bg-emerald-950/20'
                                  : isDark
                                  ? 'bg-black/40 border-sky-400 text-white/90 hover:bg-black/50'
                                  : 'bg-sky-950/10 border-sky-600 text-gray-900 hover:bg-sky-950/20'
                              }`}
                              title="Yanıtlanan mesaja keç"
                            >
                              <div
                                className={`font-semibold text-[11px] leading-tight truncate ${
                                  isMe
                                    ? isDark
                                      ? 'text-emerald-300'
                                      : 'text-emerald-800'
                                    : isDark
                                    ? 'text-sky-300'
                                    : 'text-sky-800'
                                }`}
                              >
                                {msg.replyTo.senderName || 'İstifadəçi'}
                              </div>
                              <div className="text-[11px] opacity-85 truncate mt-0.5 leading-snug">
                                {msg.replyTo.text || 'Media'}
                              </div>
                            </div>
                          )}

                          {/* Message Content: Conditional Media Rendering */}
                          {(() => {
                            const audioUrl = msg.audio_url || (msg.type === 'voice' ? msg.mediaUrl : undefined);
                            const imageUrl = msg.image_url || (msg.type === 'image' ? msg.mediaUrl : undefined);
                            const videoUrl = msg.video_url || (msg.type === 'video' ? msg.mediaUrl : undefined);
                            const fileUrl = msg.file_url || (msg.type === 'file' ? (msg.mediaUrl || msg.fileInfo?.fileUrl) : undefined);
                            const fileName = msg.file_name || msg.fileInfo?.name || 'Fayl';
                            if (msg.type === 'poll' || msg.poll) {
                              const poll = msg.poll;
                              if (!poll) return null;
                              const totalVotes = poll.totalVotes || 0;

                              return (
                                <div className="flex flex-col gap-2 min-w-[230px] max-w-[310px] my-1">
                                  {/* Poll Header */}
                                  <div className="flex items-start gap-2">
                                    <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                                      <BarChart2 size={16} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h4 className="text-xs sm:text-[13px] font-bold leading-snug break-words">
                                        {poll.question}
                                      </h4>
                                      <p className="text-[10px] opacity-65 mt-0.5">
                                        Səsvermə • {totalVotes} səs
                                      </p>
                                    </div>
                                  </div>

                                  {/* Poll Options */}
                                  <div className="space-y-1.5 pt-0.5">
                                    {poll.options.map((opt) => {
                                      const hasVoted = opt.votes.includes(myId);
                                      const optVotes = opt.votes.length;
                                      const percentage = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;

                                      return (
                                        <div
                                          key={opt.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleVotePoll(msg.id, opt.id);
                                          }}
                                          className={`relative overflow-hidden p-2 rounded-xl border text-xs cursor-pointer select-none transition-all active:scale-[0.99] ${
                                            hasVoted
                                              ? 'border-emerald-500/60 bg-emerald-500/15'
                                              : isDark
                                              ? 'border-white/10 bg-white/5 hover:bg-white/10'
                                              : 'border-gray-200 bg-gray-50/80 hover:bg-gray-100'
                                          }`}
                                        >
                                          {/* Progress bar background fill */}
                                          <div
                                            className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                                              hasVoted ? 'bg-emerald-500/25' : isDark ? 'bg-white/10' : 'bg-gray-200'
                                            }`}
                                            style={{ width: `${percentage}%` }}
                                          />

                                          <div className="relative flex items-center justify-between gap-2 z-10">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                              <div
                                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                                  hasVoted
                                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                                    : 'border-gray-400 opacity-60'
                                                }`}
                                              >
                                                {hasVoted && <Check size={10} strokeWidth={3} />}
                                              </div>
                                              <span
                                                className={`truncate text-xs ${
                                                  hasVoted
                                                    ? 'font-bold text-emerald-500 dark:text-emerald-400'
                                                    : 'font-medium'
                                                }`}
                                              >
                                                {opt.text}
                                              </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0 text-[10px] opacity-75">
                                              <span className="font-bold">{percentage}%</span>
                                              <span>({optVotes})</span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  <div className="flex items-center justify-end gap-1 text-[9px] opacity-70 pr-0.5 shrink-0 min-w-fit overflow-visible pt-0.5">
                                    <span>{msg.time}</span>
                                    {isMe && (
                                      <span className="inline-flex items-center justify-center shrink-0 min-w-fit overflow-visible ml-0.5">
                                        <MessageStatusIndicator status={effectiveStatus} size={14} currentLanguage={currentLanguage} onOpenStatusInfo={() => setIsStatusLegendOpen(true)} />
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            }

                            if (imageUrl) {
                              return (
                                <div className="space-y-1">
                                  <div
                                    className="w-full max-w-[250px] rounded-[8px] overflow-hidden cursor-pointer"
                                    onClick={() => setLightboxMedia({ url: imageUrl, type: 'image', senderName: msg.senderName, time: msg.time, caption: msg.text })}
                                  >
                                    <img
                                      src={imageUrl}
                                      alt=""
                                      className="w-full max-h-60 object-cover block rounded-[8px] hover:opacity-95 transition-opacity"
                                    />
                                  </div>
                                  {msg.text && !msg.text.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                                    <p className="text-xs sm:text-[12.5px] leading-snug px-0.5 pt-0.5 break-words">
                                      {msg.text}
                                    </p>
                                  )}
                                  <div className="flex items-center justify-end gap-1 text-[9px] opacity-70 pr-0.5 shrink-0 min-w-fit overflow-visible">
                                    <span>{msg.time}</span>
                                    {isMe && (
                                      <span className="inline-flex items-center justify-center shrink-0 min-w-fit overflow-visible ml-0.5">
                                        <MessageStatusIndicator status={effectiveStatus} size={14} currentLanguage={currentLanguage} onOpenStatusInfo={() => setIsStatusLegendOpen(true)} />
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            }

                            if (videoUrl) {
                              return (
                                <div className="space-y-1">
                                  <div
                                    className="w-full max-w-[250px] rounded-[8px] overflow-hidden cursor-pointer relative group"
                                    onClick={() => setLightboxMedia({ url: videoUrl, type: 'video', senderName: msg.senderName, time: msg.time, caption: msg.text })}
                                  >
                                    <video
                                      src={videoUrl}
                                      className="w-full max-h-60 object-cover block rounded-[8px] pointer-events-none"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors">
                                      <div className="w-11 h-11 rounded-full bg-black/60 text-white flex items-center justify-center shadow-lg backdrop-blur-xs">
                                        <Play size={20} className="ml-0.5 fill-white" />
                                      </div>
                                    </div>
                                  </div>
                                  {msg.text && !msg.text.match(/\.(mp4|webm|mov|mkv)$/i) && (
                                    <p className="text-xs sm:text-[12.5px] leading-snug px-0.5 pt-0.5 break-words">
                                      {msg.text}
                                    </p>
                                  )}
                                  <div className="flex items-center justify-end gap-1 text-[9px] opacity-70 pr-0.5 shrink-0 min-w-fit overflow-visible">
                                    <span>{msg.time}</span>
                                    {isMe && (
                                      <span className="inline-flex items-center justify-center shrink-0 min-w-fit overflow-visible ml-0.5">
                                        <MessageStatusIndicator status={effectiveStatus} size={14} currentLanguage={currentLanguage} onOpenStatusInfo={() => setIsStatusLegendOpen(true)} />
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            }

                            if (audioUrl) {
                              return (
                                <div className="flex flex-col gap-1 min-w-[220px] max-w-[290px] my-1">
                                  <WhatsAppAudioPlayer
                                    src={audioUrl}
                                    isOutgoing={isMe}
                                    isDark={isDark}
                                    fallbackDuration={msg.voiceDuration}
                                    durationSec={msg.voiceDurationSec}
                                  />
                                  <div className="flex items-center justify-end gap-1 text-[9px] opacity-70 pr-1 shrink-0 min-w-fit overflow-visible -mt-0.5">
                                    <span>{msg.time}</span>
                                    {isMe && (
                                      <span className="inline-flex items-center justify-center shrink-0 min-w-fit overflow-visible ml-0.5">
                                        <MessageStatusIndicator status={effectiveStatus} size={14} currentLanguage={currentLanguage} onOpenStatusInfo={() => setIsStatusLegendOpen(true)} />
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            }

                            if (fileUrl) {
                              return (
                                <div className="flex flex-col gap-1 min-w-[180px] max-w-[240px]">
                                  <div
                                    className={`p-2.5 rounded-xl flex items-center gap-2.5 border ${
                                      isMe
                                        ? 'bg-black/15 border-white/20'
                                        : isDark
                                        ? 'bg-black/30 border-white/10'
                                        : 'bg-gray-50 border-gray-200'
                                    }`}
                                  >
                                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                                      <FileText size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-semibold truncate leading-tight">
                                        {fileName}
                                      </p>
                                      <p className="text-[10px] opacity-70 mt-0.5">
                                        {msg.fileInfo?.size || 'Fayl'} • {fileName.split('.').pop()?.toUpperCase() || 'FILE'}
                                      </p>
                                    </div>
                                    <a
                                      href={fileUrl}
                                      download={fileName}
                                      className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/15 text-emerald-500 cursor-pointer shrink-0 transition-colors"
                                      title={t.downloadFile}
                                    >
                                      <Download size={16} />
                                    </a>
                                  </div>
                                  {msg.text && !msg.text.match(/\.(pdf|doc|docx|zip|rar|txt|xlsx)$/i) && (
                                    <p className="text-xs sm:text-[12.5px] leading-snug px-0.5 pt-0.5 break-words">
                                      {msg.text}
                                    </p>
                                  )}
                                  <div className="flex items-center justify-end gap-1 text-[9px] opacity-70 shrink-0 min-w-fit overflow-visible">
                                    <span>{msg.time}</span>
                                    {isMe && (
                                      <span className="inline-flex items-center justify-center shrink-0 min-w-fit overflow-visible ml-0.5">
                                        <MessageStatusIndicator status={effectiveStatus} size={14} currentLanguage={currentLanguage} onOpenStatusInfo={() => setIsStatusLegendOpen(true)} />
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            }

                            if (msg.type === 'location') {
                              return (
                                <div className="flex flex-col gap-1 min-w-[160px] max-w-[190px]">
                                  <div className="relative rounded-lg overflow-hidden border border-black/10 dark:border-white/10 bg-emerald-950/20">
                                    <div className="w-full h-20 bg-emerald-900/30 flex items-center justify-center relative overflow-hidden">
                                      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:10px_10px]" />
                                      <div className="relative flex flex-col items-center justify-center gap-0.5 z-10">
                                        <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                                          <MapPin size={16} />
                                        </div>
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-xs">
                                          {msg.locationInfo?.title || t.myLocation}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="p-1.5 text-[11px]">
                                      <p className="font-semibold truncate">
                                        {msg.locationInfo?.address || t.defaultCity}
                                      </p>
                                      <p className="text-[9px] opacity-65 mt-0.5">
                                        {msg.locationInfo?.latitude || '40.4093'}° N, {msg.locationInfo?.longitude || '49.8671'}° E
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-end gap-1 text-[9px] opacity-70 shrink-0 min-w-fit overflow-visible">
                                    <span>{msg.time}</span>
                                    {isMe && (
                                      <span className="inline-flex items-center justify-center shrink-0 min-w-fit overflow-visible ml-0.5">
                                        <MessageStatusIndicator status={effectiveStatus} size={14} currentLanguage={currentLanguage} onOpenStatusInfo={() => setIsStatusLegendOpen(true)} />
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div className="flex flex-col">
                                <p className="text-xs sm:text-[12.5px] leading-relaxed break-words pr-6">
                                  {msg.text?.split(/(@all)/g).map((part, i) =>
                                    part === '@all' ? (
                                      <span
                                        key={i}
                                        className="px-1.5 py-0.5 mx-0.5 rounded-md bg-amber-500/25 text-amber-500 dark:text-amber-400 font-bold border border-amber-500/30 inline-block shadow-2xs"
                                      >
                                        @all
                                      </span>
                                    ) : (
                                      part
                                    )
                                  )}
                                </p>
                                <div className="flex items-center justify-end gap-1 -mt-0.5 text-[9px] opacity-70 self-end shrink-0 min-w-fit overflow-visible">
                                  {msg.isEdited && (
                                    <span className="text-[9px] opacity-70 italic mr-0.5">(düzəliş edildi)</span>
                                  )}
                                  <span>{msg.time}</span>
                                  {isMe && (
                                    <span className="inline-flex items-center justify-center shrink-0 min-w-fit overflow-visible ml-0.5">
                                      <MessageStatusIndicator status={effectiveStatus} size={14} currentLanguage={currentLanguage} onOpenStatusInfo={() => setIsStatusLegendOpen(true)} />
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </motion.div>
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>
              )}
            </div>

            {/* Scroll to bottom floating button */}
            {showScrollBottom && (
              <button
                type="button"
                onClick={() => scrollToBottom('smooth')}
                className="absolute bottom-20 right-4 z-20 w-9 h-9 rounded-full bg-white dark:bg-[#1f2c34] shadow-lg border border-black/10 dark:border-white/10 flex items-center justify-center text-gray-700 dark:text-gray-200 cursor-pointer hover:scale-110 transition-transform"
                title={t.scrollDown}
              >
                <ChevronDown size={18} />
              </button>
            )}

            {/* Reply Preview Bar */}
            {replyingTo && (
              <div
                className={`px-4 py-2 border-t flex items-center justify-between text-xs z-20 ${
                  isDark ? 'bg-[#182229] border-white/10' : 'bg-gray-100 border-gray-200'
                }`}
              >
                <div className="border-l-4 border-emerald-500 pl-2">
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">
                    {t.replyingTo(replyingTo.senderName)}
                  </div>
                  <div className="truncate text-gray-500 dark:text-gray-400 text-[11px] max-w-xs">
                    {replyingTo.text}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* Bottom Input Area or Request Action Banner */}
            {selectedChat.category === 'request' ? (
              <div
                className={`p-3.5 sm:p-4 border-t shadow-lg z-20 backdrop-blur-md flex flex-col gap-3 ${
                  isDark
                    ? 'bg-[#182229]/95 border-white/10 text-white'
                    : 'bg-white/95 border-gray-200 text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                    <AlertCircle size={20} />
                  </div>
                  <div className="text-xs leading-tight">
                    <span className="font-bold block text-sm">{t.messageRequestTitle}</span>
                    <span className="opacity-75 text-[11px]">
                      {t.messageRequestDesc}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Mesaj istəyini qəbul et */}
                  <button
                    type="button"
                    onClick={handleAcceptRequest}
                    className="flex-1 py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <Check size={16} strokeWidth={2.5} />
                    <span>{t.acceptRequest}</span>
                  </button>

                  {/* Şikayət et */}
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(true)}
                    className="flex-1 py-2.5 px-3 rounded-2xl bg-red-500/15 hover:bg-red-500/25 active:bg-red-500/35 text-red-500 dark:text-red-400 font-bold text-xs flex items-center justify-center gap-2 border border-red-500/30 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <ShieldAlert size={16} />
                    <span>{t.report}</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Editing Message Banner */}
                {editingPersonalMessage && (
                  <div
                    className={`px-4 py-2 border-t flex items-center justify-between text-xs backdrop-blur-md z-20 ${
                      isDark
                        ? 'bg-[#182229] border-white/10 text-white'
                        : 'bg-emerald-50 border-emerald-200 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <Edit3 size={15} className="text-emerald-500 shrink-0" />
                      <span className="font-bold text-[11px] text-emerald-500">Düzəliş edilir:</span>
                      <span className="text-[11px] opacity-75 truncate italic">"{editingPersonalMessage.text}"</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPersonalMessage(null);
                        setInputText('');
                      }}
                      className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer text-gray-500 hover:text-white shrink-0"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}

                {/* Voice Recording In-line Bar OR Standard Input Bar OR Group Permission Restriction */}
                {(() => {
                  if (isRemovedFromGroup) {
                    return (
                      <div
                        className={`p-3.5 sm:p-4 border-t flex items-center justify-center gap-2 select-none z-20 ${
                          isDark
                            ? 'bg-[#182229] border-white/10 text-gray-400'
                            : 'bg-gray-100 border-gray-300 text-gray-600'
                        }`}
                      >
                        <Lock size={15} className="shrink-0 opacity-70" />
                        <span className="text-xs font-semibold">
                          Siz artıq bu qrupun üzvü deyilsiniz
                        </span>
                      </div>
                    );
                  }

                  const isCurrentGroup = selectedChat.category === 'group';
                  const isCurrentGroupAdmin = Boolean(
                    isCurrentGroup &&
                      (selectedChat.creatorId === myId || selectedChat.admins?.includes(myId))
                  );
                  const allowedWriters = selectedChat.allowedWriters || 'all';
                  const canWrite =
                    !isCurrentGroup ||
                    allowedWriters === 'all' ||
                    (allowedWriters === 'admins' && isCurrentGroupAdmin) ||
                    (allowedWriters === 'selected' &&
                      (isCurrentGroupAdmin || selectedChat.allowedWriterIds?.includes(myId)));

                  if (!canWrite) {
                    return (
                      <div
                        className={`p-3.5 sm:p-4 border-t flex items-center justify-center gap-2 select-none z-20 ${
                          isDark
                            ? 'bg-[#182229] border-white/10 text-amber-300/90'
                            : 'bg-amber-50/80 border-amber-200 text-amber-800'
                        }`}
                      >
                        <Lock size={15} className="shrink-0" />
                        <span className="text-xs font-semibold">
                          {t.onlyAllowedCanWrite || 'Yalnız icazəli şəxslər yaza bilər'}
                        </span>
                      </div>
                    );
                  }

                  if (isRecordingPersonalVoice) {
                    return (
                      <VoiceRecorderBar
                        onSendVoice={handleSendPersonalVoice}
                        onCancel={() => setIsRecordingPersonalVoice(false)}
                        isDark={isDark}
                      />
                    );
                  }

                  return (
                    <div
                      className={`p-2 sm:p-2.5 border-t flex items-center gap-2 z-20 ${
                        isDark ? 'bg-[#1f2c34] border-white/10' : 'bg-[#f0f2f5] border-gray-200'
                      }`}
                    >
                      <div
                        className={`flex-1 flex items-center gap-2 px-3.5 py-2 rounded-full border shadow-inner ${
                          isDark ? 'bg-[#2a3942] border-white/10' : 'bg-white border-gray-300'
                        }`}
                      >
                        {/* WhatsApp-style Emoji Picker Toggle */}
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className={`cursor-pointer transition-colors ${
                            showEmojiPicker ? 'text-emerald-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                          title={t.emojis}
                        >
                          <Smile size={20} />
                        </button>

                        {/* Text input */}
                        <input
                          ref={messageInputRef}
                          type="text"
                          value={inputText}
                          onChange={(e) => handleTypingInputChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder={t.messagePlaceholder}
                          className="flex-1 bg-transparent text-xs sm:text-[13px] focus:outline-none placeholder-gray-400"
                        />

                        {/* Attachment Paperclip (Opens Attachment Bottom Sheet matching fayıl.jpeg) */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsAttachSheetOpen((prev) => !prev);
                            setShowEmojiPicker(false);
                          }}
                          className={`cursor-pointer transition-colors ${
                            isAttachSheetOpen
                              ? 'text-emerald-500'
                              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                          title={t.attachFileMedia}
                        >
                          <Paperclip size={19} />
                        </button>

                        {/* Camera Icon (Opens camera + photo editor with crop, rotate, text, doodle) */}
                        <button
                          type="button"
                          onClick={() => setIsCameraEditorOpen(true)}
                          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer transition-colors"
                          title={t.cameraEditor}
                        >
                          <Camera size={19} />
                        </button>
                      </div>

                      {/* Mic / Send Button */}
                      {inputText.trim() ? (
                        <button
                          type="button"
                          onClick={() => handleSendMessage()}
                          className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform active:scale-95 shrink-0"
                          title={editingPersonalMessage ? 'Düzəlişi saxla' : 'Göndər'}
                        >
                          <Send size={18} className="ml-0.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsRecordingPersonalVoice(true)}
                          className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform active:scale-95 shrink-0"
                          title="Səsli mesaj yaz"
                        >
                          <Mic size={18} />
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* WhatsApp Emoji Picker Drawer */}
                {showEmojiPicker && (
                  <WhatsAppEmojiPicker
                    onSelectEmoji={(emoji) => setInputText((prev) => prev + emoji)}
                    onBackspace={() => setInputText((prev) => prev.slice(0, -1))}
                    isDark={isDark}
                  />
                )}
              </>
            )}
          </div>
          );
        })() : (
          /* ======================================================== */
          /* VIEW 2: CHAT HUB & LIST SCREEN                           */
          /* ======================================================== */
          <div className="flex-1 flex flex-col h-full relative overflow-hidden">
            {/* SUB-VIEW A: "ŞƏXSİ" LIST */}
            {sectionMode === 'personal' ? (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                {/* Header: Back arrow & Centered Title "Şəxsi" */}
                <div
                  className={`relative px-4 pt-4 pb-2.5 flex items-center justify-between border-b ${
                    isDark ? 'border-white/10 bg-[#121b22]' : 'border-gray-200 bg-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1 -ml-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-gray-800 dark:text-gray-200 z-10"
                    aria-label={t.close}
                  >
                    <ArrowLeft size={22} />
                  </button>

                  {/* Centered Section Title */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <h1 className="text-xl font-bold tracking-tight text-gray-950 dark:text-white pointer-events-auto">
                      {t.personal}
                    </h1>
                  </div>

                  {/* Top Right Kebab Menu (3 dots) for Inbox options like Blocked Users */}
                  <div className="relative shrink-0 z-20">
                    <button
                      type="button"
                      onClick={() => setIsInboxMenuOpen((prev) => !prev)}
                      className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-gray-800 dark:text-gray-200 transition-colors"
                      title={t.menu}
                      aria-label="Söhbətlər menyusu"
                    >
                      <MoreVertical size={20} />
                    </button>

                    {isInboxMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsInboxMenuOpen(false)}
                        />
                        <div
                          className={`absolute right-0 top-10 w-52 rounded-2xl p-1.5 shadow-2xl border z-50 animate-in fade-in zoom-in-95 duration-150 ${
                            isDark
                              ? 'bg-[#233138] border-white/15 text-white'
                              : 'bg-white border-gray-200 text-gray-900'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setIsInboxMenuOpen(false);
                              setIsBlockedUsersModalOpen(true);
                            }}
                            className="w-full text-left px-3 py-2.5 text-xs rounded-xl hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-between cursor-pointer font-medium"
                          >
                            <div className="flex items-center gap-2">
                              <UserX size={16} className="text-red-500" />
                              <span>{t.blockedUsersTitle}</span>
                            </div>
                            {blockedUsers.length > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-500 font-bold">
                                {blockedUsers.length}
                              </span>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {/* Search Bar */}
                <div className="px-3.5 sm:px-4 py-2">
                  <div
                    className={`flex items-center gap-2.5 px-4 py-2 rounded-full border shadow-xs transition-all ${
                      isDark
                        ? 'bg-white/5 border-white/15 focus-within:border-emerald-400/50'
                        : 'bg-white border-gray-300 focus-within:border-emerald-500'
                    }`}
                  >
                    <Search size={18} className="opacity-50 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.search}
                      className="w-full bg-transparent text-xs sm:text-sm focus:outline-none placeholder-gray-400"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="opacity-50 hover:opacity-100 cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Pills with Badge Counters - Centered with equal spacing from both left and right sides */}
                <div className="px-4 pb-2.5 flex items-center justify-center">
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(25px)',
                      WebkitBackdropFilter: 'blur(25px)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      boxShadow:
                        'inset 0 1px 0 0 rgba(255, 255, 255, 0.3), 0 10px 30px rgba(0, 0, 0, 0.25)',
                    }}
                    className="p-1 rounded-full flex items-center justify-center gap-1.5 sm:gap-2 transition-all"
                  >
                    {/* 1. Hamısı */}
                    <button
                      type="button"
                      onClick={() => {
                        setPersonalFilter('all');
                        setBottomNav('direct');
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                        personalFilter === 'all'
                          ? isDark
                            ? 'bg-white/20 text-emerald-400 font-bold shadow-xs'
                            : 'bg-white text-emerald-700 font-bold shadow-xs'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <span>{t.all}</span>
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center">
                        {allCount}
                      </span>
                    </button>

                    {/* 2. İstəklər */}
                    <button
                      type="button"
                      onClick={() => setPersonalFilter('requests')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                        personalFilter === 'requests'
                          ? isDark
                            ? 'bg-white/20 text-emerald-400 font-bold shadow-xs'
                            : 'bg-white text-emerald-700 font-bold shadow-xs'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <span>{t.requests}</span>
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center">
                        {requestsCount}
                      </span>
                    </button>

                    {/* 3. Qruplar */}
                    <button
                      type="button"
                      onClick={() => {
                        setPersonalFilter('groups');
                        setBottomNav('groups');
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                        personalFilter === 'groups'
                          ? isDark
                            ? 'bg-white/20 text-emerald-400 font-bold shadow-xs'
                            : 'bg-white text-emerald-700 font-bold shadow-xs'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <span>{t.groups}</span>
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center">
                        {groupsCount}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 min-h-0 overflow-y-auto px-3.5 sm:px-4 space-y-1.5 pb-28">
                  {sortedConversations.map((conv) => {
                    return (
                      <div
                        key={conv.id}
                        onContextMenu={(e) => handleContextMenu(e, conv)}
                        onTouchStart={(e) => handleTouchStart(conv, e)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={handleTouchEnd}
                        onMouseDown={() => handleMouseDown(conv)}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onClick={() => handleConvClick(conv)}
                        className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl cursor-pointer transition-all select-none relative ${
                          conv.isPinned
                            ? isDark
                              ? 'bg-white/[0.08] hover:bg-white/[0.12] active:bg-white/15 ring-1 ring-emerald-500/30'
                              : 'bg-emerald-50/70 hover:bg-emerald-100/70 active:bg-emerald-100 ring-1 ring-emerald-600/30'
                            : isDark
                            ? 'hover:bg-white/5 active:bg-white/10'
                            : 'hover:bg-black/5 active:bg-black/10'
                        }`}
                      >
                        {/* Avatar Circle - Clicking avatar opens user's readOnly profile card */}
                        <div
                          className="relative shrink-0 cursor-pointer w-12 h-12 flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenUserProfile(conv);
                          }}
                          title={t.viewProfile}
                        >
                          {conv.avatarType === 'photo' && conv.avatarUrl ? (
                            <img
                              src={conv.avatarUrl}
                              alt={conv.name}
                              className="w-12 h-12 rounded-full object-cover shadow-xs shrink-0 block"
                            />
                          ) : conv.avatarType === 'initial' ? (
                            <div
                              className={`w-12 h-12 rounded-full font-bold text-lg flex items-center justify-center shadow-xs shrink-0 ${
                                conv.avatarBgColor || 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {conv.initial || conv.name.charAt(0)}
                            </div>
                          ) : (
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xs shrink-0 ${
                                conv.avatarBgColor || 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {conv.category === 'group' ? (
                                <Users size={22} />
                              ) : (
                                <User size={22} />
                              )}
                            </div>
                          )}

                          {conv.isOnline && !shouldHideOnlineStatus(currentUser?.id, conv.id, conv) && (
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#121b22] rounded-full" />
                          )}
                        </div>

                        {/* Name & Last Message Preview */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-gray-950 dark:text-white truncate flex items-center gap-1.5">
                            <span className="truncate">{conv.name}</span>
                            {conv.isPinned && (
                              <span title={t.pinnedTooltip} className="inline-flex shrink-0">
                                <Pin
                                  size={12}
                                  className="text-gray-400 dark:text-gray-500"
                                />
                              </span>
                            )}
                            {conv.isMuted && (
                              <span title={t.mutedTooltip} className="inline-flex shrink-0">
                                <BellOff
                                  size={12}
                                  className="text-amber-500/80"
                                />
                              </span>
                            )}
                            {conv.category === 'request' && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/15 text-amber-500 font-semibold rounded-md shrink-0">
                                {t.requestBadge}
                              </span>
                            )}
                          </h4>

                          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5 min-w-0">
                            {conv.lastMessageStatus && (
                              <span className="shrink-0 inline-flex items-center justify-center min-w-fit overflow-visible">
                                <MessageStatusIndicator
                                  status={isConversationPendingRequest(currentUser?.id, conv) ? 'sent' : conv.lastMessageStatus}
                                  size={15}
                                  showTooltip={false}
                                  currentLanguage={currentLanguage}
                                  onOpenStatusInfo={() => setIsStatusLegendOpen(true)}
                                />
                              </span>
                            )}

                            {conv.lastMessageType === 'image' && (
                              <span className="opacity-80 shrink-0">📷</span>
                            )}
                            {conv.lastMessageType === 'voice' && (
                              <span className="opacity-80 shrink-0">🎤</span>
                            )}
                            {conv.lastMessageType === 'file' && (
                              <span className="opacity-80 shrink-0">📎</span>
                            )}

                            <span className="truncate flex-1">{conv.lastMessage}</span>
                          </div>
                        </div>

                        {/* Time & Unread Badge */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span
                            className={`text-[11px] font-medium ${
                              conv.unreadCount
                                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                : 'text-gray-400'
                            }`}
                          >
                            {conv.lastMessageTime}
                          </span>

                          {Boolean(conv.unreadCount && conv.unreadCount > 0) && (
                            <span className="min-w-[19px] h-[19px] px-1 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {sortedConversations.length === 0 && (
                    personalFilter === 'groups' ? (
                      <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
                        <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                          <Users size={28} />
                        </div>
                        <h4 className="text-sm font-bold mb-1">{t.noGroupsYet || 'Heç bir qrup yoxdur'}</h4>
                        <p className="text-xs opacity-60 mb-4 max-w-xs">
                          {t.createFirstGroupDesc || 'Dostlarınız və həmkarlarınızla müzakirələr üçün yeni qrup yaradın.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsCreateGroupModalOpen(true)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-colors"
                        >
                          <Plus size={16} />
                          <span>{t.createGroup || 'Yeni Qrup Yarat'}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="py-12 text-center text-xs opacity-50">
                        {t.noChats}
                      </div>
                    )
                  )}
                </div>

                {/* Qruplar səhifəsində "Qrup Yarat" FAB ikonu */}
                {personalFilter === 'groups' && (
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    type="button"
                    onClick={() => setIsCreateGroupModalOpen(true)}
                    className="absolute bottom-22 right-5 z-40 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xl shadow-emerald-500/30 flex items-center gap-2 cursor-pointer font-bold text-xs transition-transform active:scale-95"
                    title={t.createGroup || 'Qrup Yarat'}
                  >
                    <Plus size={18} strokeWidth={2.5} />
                    <span>{t.createGroup || 'Qrup Yarat'}</span>
                  </motion.button>
                )}

                {/* Bottom Floating Navigation Dock */}
                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center pointer-events-none z-30">
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(25px)',
                      WebkitBackdropFilter: 'blur(25px)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      boxShadow:
                        'inset 0 1px 0 0 rgba(255, 255, 255, 0.3), 0 10px 30px rgba(0, 0, 0, 0.25)',
                    }}
                    className="pointer-events-auto px-4 py-2 rounded-full flex items-center gap-4 sm:gap-6 transition-all"
                  >
                    {/* Left Capsule: Şəxsi yazışma */}
                    <div className="flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSectionMode('personal');
                          setPersonalFilter('all');
                        }}
                        className={`w-20 sm:w-24 py-2.5 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                          isDark
                            ? 'bg-white/20 text-white shadow-xs'
                            : 'bg-white/80 text-gray-950 shadow-xs'
                        }`}
                        title={t.personal}
                      >
                        <MessageSquare size={22} />
                      </button>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shadow-xs" />
                    </div>

                    {/* Middle Circular Capsule: Add User / Contact with ID Search */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsAddUserModalOpen(true)}
                        className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all shadow-lg active:scale-95 ${
                          isDark
                            ? 'bg-[#252f38] text-white border-2 border-pink-400/40 shadow-[0_0_15px_rgba(244,114,182,0.3)]'
                            : 'bg-white text-gray-900 border-2 border-pink-400/50 shadow-[0_0_15px_rgba(244,114,182,0.25)]'
                        }`}
                        title={t.addUserNav}
                      >
                        <UserPlus size={22} className="text-pink-500 dark:text-pink-400" />
                      </button>
                    </div>

                    {/* Right Capsule: Qlobal çat */}
                    <div className="flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSectionMode('global');
                        }}
                        className="w-20 sm:w-24 py-2.5 rounded-full flex items-center justify-center cursor-pointer transition-all text-gray-700 dark:text-gray-300 opacity-60 hover:opacity-100"
                        title={t.globalChatTitle}
                      >
                        <Globe size={22} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* SUB-VIEW B: QLOBAL CHAT (Mobile & Desktop with Subcategories & Dedicated Group Chats) */
              <GlobalChatView
                currentLanguage={currentLanguage}
                currentUser={currentUser}
                currentUserName={currentUserName}
                isDark={isDark}
                onClose={onClose}
                onOpenAttachSheet={() => setIsAttachSheetOpen(true)}
                onOpenVoiceRecorder={() => {
                  const now = new Date();
                  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
                    now.getMinutes()
                  ).padStart(2, '0')}`;
                  const voiceMsg: ChatMessage = {
                    id: 'voice_' + Date.now(),
                    senderId: 'me',
                    senderName: currentUserName,
                    isOutgoing: true,
                    type: 'voice',
                    voiceDuration: '0:06',
                    voiceDurationSec: 6,
                    time: timeStr,
                    status: 'sent',
                  };
                  setPendingGlobalMessage(voiceMsg);
                }}
                pendingOutgoingMessage={pendingGlobalMessage}
                onClearPendingMessage={() => setPendingGlobalMessage(null)}
                onSwitchToPersonal={() => setSectionMode('personal')}
                onOpenAddUser={() => setIsAddUserModalOpen(true)}
                onOpenUserProfile={(user) => setViewingProfile(user)}
              />
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL 1: ADD CONTACT / SEARCH BY ID                      */}
        {/* ======================================================== */}
        <AnimatePresence>
          {isAddUserModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl relative max-h-[85vh] flex flex-col ${
                  isDark
                    ? 'bg-[#1a232a] border-white/15 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsAddUserModalOpen(false);
                    setUserIdSearchQuery('');
                  }}
                  className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                >
                  <X size={18} />
                </button>

                <div className="w-12 h-12 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center mb-3">
                  <UserPlus size={24} />
                </div>

                <h3 className="text-lg font-bold">{t.findAndAddUser}</h3>
                <p className="text-xs opacity-65 mb-3">
                  Sadəcə istifadəçi adı və ID ilə axtarış edin.
                </p>

                {/* ID & Username Search Input */}
                <div className="relative mb-3">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50"
                  />
                  <input
                    type="text"
                    value={userIdSearchQuery}
                    onChange={(e) => setUserIdSearchQuery(e.target.value)}
                    placeholder="İstifadəçi adı (məs: @murad) və ya ID (məs: 28491045)..."
                    className={`w-full pl-9 pr-4 py-2.5 rounded-2xl border text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                      isDark
                        ? 'border-white/15 bg-white/5 text-white'
                        : 'border-gray-300 bg-gray-50 text-gray-900'
                    }`}
                  />
                </div>

                {/* Search Results List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-1">
                  <div className="text-[11px] font-bold opacity-60 px-1">
                    {userIdSearchQuery ? t.searchResults : t.recommendedUsers}
                  </div>

                  {searchResultsUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => setViewingProfile(user)}
                      className={`p-2.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.01] ${
                        isDark
                          ? 'bg-white/5 border-white/10 hover:bg-white/10'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.firstName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={20} />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs truncate">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-[11px] opacity-70 truncate">
                          {user.profession || 'Dizayner'}
                        </div>
                        {user.userCode && (
                          <div className="text-[10px] text-emerald-500 font-semibold mt-0.5">
                            ID: {user.userCode}
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartChatWithUser(user);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold shadow-sm shrink-0 cursor-pointer"
                      >
                        {t.messageBtn}
                      </button>
                    </div>
                  ))}

                  {searchResultsUsers.length === 0 && (
                    <div className="py-6 text-center text-xs opacity-50">
                      {t.userNotFound}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ======================================================== */}
        {/* MODAL 2: USER PROFILE MODAL (Exact Home page card, readOnly) */}
        {/* ======================================================== */}
        {viewingProfile && (
          <ProfileCardModal
            user={viewingProfile}
            isOpen={Boolean(viewingProfile)}
            onClose={() => setViewingProfile(null)}
            readOnly={true} // NO edit button per user requirement!
            t={translations[currentLanguage]}
            onStartChat={() => handleStartChatWithUser(viewingProfile)}
          />
        )}

        {/* ======================================================== */}
        {/* MODAL 2.5: ATTACHMENT BOTTOM SHEET (Media, File, etc.)  */}
        {/* ======================================================== */}
        <AttachmentBottomSheet
          isOpen={isAttachSheetOpen}
          onClose={() => setIsAttachSheetOpen(false)}
          onSendUploadedMedia={handleSendUploadedMedia}
          onOpenPollCreator={() => setIsCreatePollOpen(true)}
          currentLanguage={currentLanguage}
          isDark={isDark}
        />

        {/* Interactive Poll Creator Modal */}
        <CreatePollModal
          isOpen={isCreatePollOpen}
          onClose={() => setIsCreatePollOpen(false)}
          onCreatePoll={handleSendPoll}
          isDark={isDark}
        />

        {/* Fullscreen Media Lightbox Modal (Images & Videos) */}
        <ChatLightboxModal
          isOpen={Boolean(lightboxMedia)}
          onClose={() => setLightboxMedia(null)}
          mediaUrl={lightboxMedia?.url || null}
          mediaType={lightboxMedia?.type}
          senderName={lightboxMedia?.senderName}
          time={lightboxMedia?.time}
          caption={lightboxMedia?.caption}
        />

        {/* ======================================================== */}
        {/* MODAL 3: CAMERA & PHOTO EDITOR                           */}
        {/* ======================================================== */}
        <CameraPhotoEditorModal
          isOpen={isCameraEditorOpen}
          onClose={() => setIsCameraEditorOpen(false)}
          onSendImage={handleSendEditedImage}
          currentLanguage={currentLanguage}
          isDark={isDark}
        />

        {/* ======================================================== */}
        {/* MODAL 4: CALL SIMULATION                                 */}
        {/* ======================================================== */}
        <AnimatePresence>
          {activeCall && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg"
            >
              <div className="w-full max-w-sm rounded-[36px] p-8 text-center text-white flex flex-col items-center justify-between h-[450px] bg-gradient-to-b from-gray-900 to-black border border-white/20 shadow-2xl relative">
                {/* Caller Info */}
                <div className="space-y-3 mt-4">
                  <div className="w-24 h-24 rounded-full mx-auto overflow-hidden border-2 border-emerald-400 p-1 shadow-lg">
                    {activeCall.avatar ? (
                      <img
                        src={activeCall.avatar}
                        alt={activeCall.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl font-bold">
                        {activeCall.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{activeCall.name}</h3>
                    <p className="text-xs text-emerald-400 mt-1 font-medium">
                      {formatCallTime(callDuration)}
                    </p>
                  </div>
                </div>

                {/* Hang up */}
                <button
                  type="button"
                  onClick={() => setActiveCall(null)}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-xl cursor-pointer active:scale-95 transition-all"
                  title={t.endCall}
                >
                  <PhoneOff size={28} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ======================================================== */}
        {/* MODAL 5: MESSAGE STATUS LEGEND MODAL                     */}
        {/* ======================================================== */}
        <MessageStatusLegendModal
          isOpen={isStatusLegendOpen}
          onClose={() => setIsStatusLegendOpen(false)}
          currentLanguage={currentLanguage}
        />

        {/* ======================================================== */}
        {/* MODAL 6: REPORT USER MODAL                               */}
        {/* ======================================================== */}
        <ReportUserModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          userName={selectedChat?.name || 'İstifadəçi'}
          reporterId={currentUser?.id}
          reportedUserId={selectedChat?.id}
          onReport={handleReportUser}
          currentLanguage={currentLanguage}
          isDark={isDark}
        />

        {/* ======================================================== */}
        {/* MODAL 7: CONVERSATION LONG-PRESS CONTEXT MENU            */}
        {/* ======================================================== */}
        <AnimatePresence>
          {contextChat && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.96 }}
                className={`w-full sm:max-w-xs rounded-t-3xl sm:rounded-3xl p-5 border shadow-2xl space-y-3 ${
                  isDark
                    ? 'bg-[#1f2c34] border-white/15 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
              >
                {/* Header preview of chat */}
                <div className="flex items-center gap-3 pb-3 border-b border-black/10 dark:border-white/10">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 font-bold">
                    {contextChat.avatarType === 'photo' && contextChat.avatarUrl ? (
                      <img
                        src={contextChat.avatarUrl}
                        alt={contextChat.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      contextChat.name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm truncate">{contextChat.name}</h4>
                    <p className="text-[11px] opacity-60 truncate">{t.chatOperations}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setContextChat(null)}
                    className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Actions: Pin & Delete */}
                <div className="space-y-1.5">
                  {/* Pin / Unpin Action */}
                  <button
                    type="button"
                    onClick={() => handleTogglePinConversation(contextChat.id)}
                    className="w-full py-2.5 px-3 rounded-2xl flex items-center gap-3 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors text-left"
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        contextChat.isPinned
                          ? 'bg-amber-500/15 text-amber-500'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      <Pin
                        size={17}
                        className={contextChat.isPinned ? '' : 'rotate-45'}
                      />
                    </div>
                    <span>
                      {contextChat.isPinned
                        ? t.unpin
                        : t.pin}
                    </span>
                  </button>

                  {/* Delete Conversation Action */}
                  <button
                    type="button"
                    onClick={() => handleDeleteConversation(contextChat.id)}
                    className="w-full py-2.5 px-3 rounded-2xl flex items-center gap-3 text-xs font-semibold text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-500 flex items-center justify-center shrink-0">
                      <Trash2 size={17} />
                    </div>
                    <span>{t.deleteChat}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ======================================================== */}
        {/* MODAL 7.5: SÖHBƏTİ SİL TƏSDİQ MODALI (LONG PRESS ON CHAT) */}
        {/* ======================================================== */}
        <AnimatePresence>
          {chatToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.2 }}
                className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl space-y-4 ${
                  isDark
                    ? 'bg-[#1f2c34] border-white/15 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-red-500/15 text-red-500 flex items-center justify-center shrink-0">
                    <Trash2 size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold truncate">
                      {t.deleteChat || 'Söhbəti Sil'}
                    </h3>
                    <p className="text-xs opacity-70 truncate font-semibold text-emerald-500">
                      {chatToDelete.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChatToDelete(null)}
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Warning Text requested by user */}
                <div
                  className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                    isDark
                      ? 'bg-red-500/10 border-red-500/25 text-red-200'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  <p className="font-semibold mb-1 flex items-center gap-1.5">
                    <AlertTriangle size={14} className="shrink-0 text-red-500" />
                    <span>Diqqət:</span>
                  </p>
                  <p>
                    {t.deleteWarning || 'Bu adamı silsəniz bütün mesajlar silinəcək və geriyə qaytarmaq olmayacaq'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setChatToDelete(null)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                      isDark
                        ? 'border-white/15 hover:bg-white/10 text-white/80'
                        : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {t.cancel || 'Ləğv et'}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteChatFromList}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    <span>{t.clearChat || 'Söhbəti Sil'}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ======================================================== */}
        {/* MODAL 8: BLOKLANAN İSTİFADƏÇİLƏR (BLOCKED USERS MODAL)   */}
        {/* ======================================================== */}
        <AnimatePresence>
          {isBlockedUsersModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 15 }}
                transition={{ duration: 0.2 }}
                className={`w-full max-w-md rounded-3xl p-5 shadow-2xl border flex flex-col max-h-[85vh] overflow-hidden ${
                  isDark
                    ? 'bg-[#182229] border-white/15 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10 dark:border-white/10 border-gray-200 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                      <UserX size={22} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold leading-tight">
                        {t.blockedUsersModalTitle}
                      </h3>
                      <p className="text-xs opacity-60">
                        {blockedUsers.length > 0
                          ? `${blockedUsers.length} istifadəçi bloklanıb`
                          : t.noBlockedUsers}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsBlockedUsersModalOpen(false)}
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1">
                  {blockedUsers.length === 0 ? (
                    <div className="py-12 text-center flex flex-col items-center justify-center opacity-60">
                      <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-3">
                        <UserX size={28} className="opacity-40" />
                      </div>
                      <p className="text-sm font-medium">{t.noBlockedUsers}</p>
                    </div>
                  ) : (
                    blockedUsers.map((bUser) => (
                      <div
                        key={bUser.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                          isDark
                            ? 'bg-white/5 border-white/10'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {bUser.avatarUrl ? (
                            <img
                              src={bUser.avatarUrl}
                              alt={bUser.name}
                              className="w-10 h-10 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 font-bold flex items-center justify-center shrink-0 text-sm">
                              {bUser.name.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold truncate leading-tight">
                              {bUser.name}
                            </h4>
                            {bUser.userCode && (
                              <p className="text-[11px] opacity-60 truncate">
                                ID: {bUser.userCode}
                              </p>
                            )}
                            {bUser.blockedAt && (
                              <p className="text-[10px] opacity-50">
                                {t.blockedAt} {bUser.blockedAt}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUnblockUser(bUser.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shrink-0 cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
                        >
                          <Unlock size={13} />
                          <span>{t.unblock}</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-white/10 dark:border-white/10 border-gray-200 shrink-0 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsBlockedUsersModalOpen(false)}
                    className={`py-2 px-4 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                      isDark
                        ? 'border-white/15 hover:bg-white/10 text-white/80'
                        : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {t.close}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Message Long-Press Actions: Düzəliş et & Sil */}
        <MessageActionsModal
          isOpen={Boolean(selectedMsgForAction)}
          onClose={() => setSelectedMsgForAction(null)}
          message={selectedMsgForAction}
          onEdit={handleStartEditMessage}
          onDelete={handleDeleteSingleMessage}
          isDark={isDark}
        />

        {/* Qrup Yaratma Modalı (Create Group Modal) */}
        <CreateGroupModal
          isOpen={isCreateGroupModalOpen}
          onClose={() => setIsCreateGroupModalOpen(false)}
          availableContacts={conversations.filter((c) => c.category === 'direct')}
          currentUser={currentUser}
          currentUserName={currentUserName}
          currentLanguage={currentLanguage}
          isDark={isDark}
          onCreateGroup={handleCreateGroup}
        />

        {/* Qrup Ayarları Modalı (Group Settings Modal) */}
        <GroupSettingsModal
          isOpen={isGroupSettingsModalOpen}
          onClose={() => setIsGroupSettingsModalOpen(false)}
          group={selectedChat}
          currentUser={currentUser}
          allContacts={conversations.filter((c) => c.category === 'direct')}
          isDark={isDark}
          onUpdateGroup={handleUpdateGroup}
        />
      </motion.div>
    </div>
  );
};
