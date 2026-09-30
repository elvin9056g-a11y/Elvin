export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // user IDs
}

export interface PollData {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  isClosed?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderColor?: string; // For group chat sender name coloring
  isOutgoing: boolean;
  text?: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'image' | 'voice' | 'video' | 'file' | 'location' | 'system' | 'poll';
  mediaUrl?: string;
  audio_url?: string;
  image_url?: string;
  video_url?: string;
  file_url?: string;
  file_name?: string;
  voiceDuration?: string; // e.g. "0:06"
  voiceDurationSec?: number;
  locationInfo?: {
    latitude: number;
    longitude: number;
    title: string;
    address: string;
  };
  fileInfo?: {
    name: string;
    size: string;
    bytes: number;
    extension: string;
    fileUrl?: string;
  };
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
  isEdited?: boolean;
  reactions?: Record<string, number>;
  isSystem?: boolean;
  isAnnouncement?: boolean;
  poll?: PollData;
}

export interface ChatConversation {
  id: string;
  name: string;
  subtitle?: string;
  avatarType: 'photo' | 'initial' | 'icon';
  avatarUrl?: string;
  avatarBgColor?: string; // e.g. 'bg-sky-200 text-sky-800'
  initial?: string;
  unreadCount?: number;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageStatus?: 'sent' | 'delivered' | 'read';
  lastMessageType?: 'text' | 'image' | 'voice' | 'video' | 'file' | 'system' | 'poll';
  category: 'direct' | 'request' | 'group' | 'global';
  isOnline?: boolean;
  lastSeen?: string;
  isPinned?: boolean;
  isMuted?: boolean;
  userCode?: string;
  profession?: string;
  experience?: string;
  tags?: string[];
  members?: string[];
  removedMembers?: string[];
  creatorId?: string;
  admins?: string[];
  bio?: string;
  allowedWriters?: 'all' | 'admins' | 'selected';
  allowedWriterIds?: string[];
  voiceRoomActive?: boolean;
  voiceParticipants?: { id: string; name: string; avatarUrl?: string; isMuted?: boolean; isSpeaking?: boolean }[];
  messages: ChatMessage[];
}

export type MainCategoryId = 'mobile' | 'desktop';
export type SubcategoryId = 'iphone' | 'android' | 'windows' | 'macos' | 'linux';

export interface GlobalSubcategory {
  id: SubcategoryId;
  name: string;
  categoryId: MainCategoryId;
  memberCount: string;
  onlineCount: string;
  description: string;
  iconName: 'Smartphone' | 'Monitor' | 'Laptop' | 'Terminal' | 'Apple';
  accentColor: string;
}

export interface GlobalCategory {
  id: MainCategoryId;
  name: string;
  subtitle: string;
  iconName: 'Smartphone' | 'Monitor';
  subcategories: GlobalSubcategory[];
}
