import { createClient, User } from '@supabase/supabase-js';
import { UserProfile } from '../types';
import { ChatMessage, ChatConversation } from '../components/chat/types';

const DEFAULT_SUPABASE_URL = 'https://whrgxttljzytitrqcfuf.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_NGH-5xvgp0CyS3BhXbURVQ_JTmFolsI';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Extracts first and last name from user metadata or Google profile.
 * - When signing in with Google, user_metadata contains full_name or name.
 *   We split by whitespace: 1st part -> first_name, 2nd part (and rest) -> last_name.
 * - Never uses email split('@')[0] as the user's name!
 */
export function extractNamesFromUser(
  user?: User | null,
  explicitNames?: { firstName?: string; lastName?: string }
): { firstName: string; lastName: string } {
  const meta = user?.user_metadata || {};

  // Check explicit first / last name
  const expFirst = explicitNames?.firstName?.trim();
  const expLast = explicitNames?.lastName?.trim();

  // Check metadata explicit name fields
  const metaFirst = (meta.first_name || meta.firstName || meta.given_name || '').toString().trim();
  const metaLast = (meta.last_name || meta.lastName || meta.family_name || '').toString().trim();

  // Full name from Google OAuth (user_metadata.full_name or user_metadata.name)
  const fullName = (meta.full_name || meta.name || '').toString().trim();
  const nameParts = fullName.split(/\s+/).filter(Boolean);

  let firstName = expFirst || metaFirst;
  let lastName = expLast !== undefined ? expLast : metaLast;

  if (!firstName && nameParts.length > 0) {
    firstName = nameParts[0];
  }
  if (!lastName && nameParts.length > 1) {
    lastName = nameParts.slice(1).join(' ');
  }

  // Never fall back to email split('@')[0]!
  if (!firstName) {
    firstName = 'İstifadəçi';
  }

  return { firstName, lastName };
}

/**
 * Transforms a Supabase database row from public.profiles into our typed UserProfile
 */
export function mapProfileRowToUserProfile(row: any, fallbackUser?: User | null): UserProfile {
  const extracted = extractNamesFromUser(fallbackUser);
  const meta = fallbackUser?.user_metadata || {};
  const emailPrefix = (row?.email || fallbackUser?.email || '').split('@')[0];

  let firstName =
    (row?.first_name && String(row.first_name).trim()) ||
    extracted.firstName ||
    'İstifadəçi';

  // Never allow email prefix as first_name if real name is available
  if (firstName === emailPrefix && extracted.firstName && extracted.firstName !== emailPrefix) {
    firstName = extracted.firstName;
  }

  let lastName =
    (row?.last_name !== undefined && row.last_name !== null && String(row.last_name).trim() !== ''
      ? String(row.last_name).trim()
      : '') ||
    extracted.lastName ||
    '';

  return {
    id: row?.id || fallbackUser?.id || '',
    userCode: row?.user_code || meta.user_code || '',
    firstName,
    lastName,
    email: row?.email || fallbackUser?.email || '',
    balance: typeof row?.balance === 'number' ? row.balance : Number(row?.balance) || 0,
    avatarUrl: row?.avatar || meta.avatar_url || meta.picture || undefined,
    profession: row?.profession || meta.profession || 'Dizayner',
    experience: row?.experience || meta.experience || 'Yeni',
    bio: row?.bio || meta.bio || '',
    tags: Array.isArray(row?.tags) && row.tags.length > 0 ? row.tags : (Array.isArray(meta.tags) ? meta.tags : []),
    isOnline: row?.is_online ?? true,
    lastSeen: row?.last_seen || new Date().toISOString(),
    createdAt: row?.created_at || fallbackUser?.created_at || new Date().toISOString(),
  };
}

/**
 * Transforms a Supabase Auth User object into our typed UserProfile
 */
export function mapSupabaseUserToProfile(user: User): UserProfile {
  const extracted = extractNamesFromUser(user);
  const meta = user.user_metadata || {};

  return {
    id: user.id,
    userCode: meta.user_code || '',
    firstName: extracted.firstName,
    lastName: extracted.lastName,
    email: user.email || '',
    balance: typeof meta.balance === 'number' ? meta.balance : 0,
    avatarUrl: meta.avatar_url || meta.picture || undefined,
    profession: meta.profession || 'Dizayner',
    experience: meta.experience || 'Yeni',
    bio: meta.bio || '',
    tags: Array.isArray(meta.tags) && meta.tags.length > 0
      ? meta.tags
      : ['Qrafik dizayn', 'Motion dizayn', 'Logo dizayn'],
    createdAt: user.created_at || new Date().toISOString(),
  };
}

/**
 * Fetch or automatically insert profile row into public.profiles
 */
export async function fetchOrCreateUserProfile(
  user: User,
  explicitNames?: { firstName?: string; lastName?: string }
): Promise<UserProfile> {
  const extracted = extractNamesFromUser(user, explicitNames);
  const meta = user.user_metadata || {};

  try {
    // 1. Fetch from public.profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!error && data) {
      const emailPrefix = (user.email || '').split('@')[0];
      const needsNameUpdate =
        (explicitNames?.firstName && data.first_name !== explicitNames.firstName.trim()) ||
        (explicitNames?.lastName && data.last_name !== explicitNames.lastName.trim()) ||
        (!data.first_name && extracted.firstName && extracted.firstName !== 'İstifadəçi') ||
        (data.first_name === emailPrefix && extracted.firstName && extracted.firstName !== emailPrefix) ||
        (!data.last_name && extracted.lastName);

      if (needsNameUpdate) {
        const updatePayload: Record<string, any> = {};
        if (extracted.firstName && (data.first_name === emailPrefix || !data.first_name || explicitNames?.firstName)) {
          updatePayload.first_name = extracted.firstName;
        }
        if (extracted.lastName && (!data.last_name || explicitNames?.lastName)) {
          updatePayload.last_name = extracted.lastName;
        }
        if ((meta.avatar_url || meta.picture) && !data.avatar) {
          updatePayload.avatar = meta.avatar_url || meta.picture;
        }

        if (Object.keys(updatePayload).length > 0) {
          const { data: updatedRow } = await supabase
            .from('profiles')
            .update(updatePayload)
            .eq('id', user.id)
            .select()
            .maybeSingle();

          if (updatedRow) {
            return mapProfileRowToUserProfile(updatedRow, user);
          }
        }
      }

      return mapProfileRowToUserProfile(data, user);
    }

    // 2. If row does not exist yet, insert into public.profiles
    const avatarUrl = meta.avatar_url || meta.picture || '';
    const insertPayload: Record<string, any> = {
      id: user.id,
      email: user.email || '',
      first_name: extracted.firstName,
      last_name: extracted.lastName,
      avatar: avatarUrl,
      balance: typeof meta.balance === 'number' ? meta.balance : 0,
      profession: meta.profession || 'Dizayner',
      experience: meta.experience || 'Yeni',
      bio: meta.bio || '',
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      is_online: true,
      last_seen: new Date().toISOString(),
    };

    // First try without user_code so DB trigger can generate it automatically
    const { data: inserted, error: insertError } = await supabase
      .from('profiles')
      .insert(insertPayload)
      .select()
      .maybeSingle();

    if (!insertError && inserted) {
      return mapProfileRowToUserProfile(inserted, user);
    }

    // If trigger required user_code or table has not-null constraint fallback
    if (insertError) {
      const fallbackCode = Math.floor(10000000 + Math.random() * 90000000).toString();
      const { data: retryData } = await supabase
        .from('profiles')
        .insert({ ...insertPayload, user_code: fallbackCode })
        .select()
        .maybeSingle();

      if (retryData) {
        return mapProfileRowToUserProfile(retryData, user);
      }
    }

    // Final attempt to fetch in case trigger or race inserted it
    const { data: finalData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (finalData) {
      return mapProfileRowToUserProfile(finalData, user);
    }
  } catch (err) {
    console.error('fetchOrCreateUserProfile error:', err);
  }

  return mapSupabaseUserToProfile(user);
}

/**
 * Update user profile directly in public.profiles table and sync to auth metadata
 */
export async function updateUserProfileInDb(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> {
  const dbUpdates: Record<string, any> = {};
  if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
  if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
  if (updates.avatarUrl !== undefined) dbUpdates.avatar = updates.avatarUrl;
  if (updates.profession !== undefined) dbUpdates.profession = updates.profession;
  if (updates.experience !== undefined) dbUpdates.experience = updates.experience;
  if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
  if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  dbUpdates.last_seen = new Date().toISOString();

  let updatedProfileRow: any = null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Failed to update public.profiles:', error);
    } else {
      updatedProfileRow = data;
    }
  } catch (err) {
    console.error('Unexpected error in public.profiles update:', err);
  }

  // Also sync to Auth user_metadata
  try {
    const metaUpdates: Record<string, any> = {};
    if (updates.firstName !== undefined) metaUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) metaUpdates.last_name = updates.lastName;
    if (updates.avatarUrl !== undefined) metaUpdates.avatar_url = updates.avatarUrl;
    if (updates.profession !== undefined) metaUpdates.profession = updates.profession;
    if (updates.experience !== undefined) metaUpdates.experience = updates.experience;
    if (updates.bio !== undefined) metaUpdates.bio = updates.bio;
    if (updates.tags !== undefined) metaUpdates.tags = updates.tags;
    await supabase.auth.updateUser({ data: metaUpdates });
  } catch (err) {
    console.warn('Could not update metadata in Supabase Auth:', err);
  }

  if (updatedProfileRow) {
    return mapProfileRowToUserProfile(updatedProfileRow);
  }
  return null;
}

/**
 * Fetch all registered profiles from public.profiles
 */
export async function fetchAllProfiles(): Promise<UserProfile[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching all profiles:', error);
      return [];
    }

    return (data || []).map((row) => mapProfileRowToUserProfile(row));
  } catch (err) {
    console.error('fetchAllProfiles error:', err);
    return [];
  }
}

/**
 * Search profiles in public.profiles by 8-digit user_code, first_name, last_name, or email
 */
export async function searchProfiles(
  query: string,
  excludeUserId?: string
): Promise<UserProfile[]> {
  const cleanQ = query.trim().replace(/^@/, '');

  try {
    let qb = supabase.from('profiles').select('*');

    if (cleanQ) {
      // If user typed digits only (8-digit ID or partial code)
      const isDigitsOnly = /^\d+$/.test(cleanQ);
      if (isDigitsOnly) {
        qb = qb.or(`user_code.eq.${cleanQ},user_code.ilike.%${cleanQ}%`);
      } else {
        qb = qb.or(
          `first_name.ilike.%${cleanQ}%,last_name.ilike.%${cleanQ}%,email.ilike.%${cleanQ}%,user_code.ilike.%${cleanQ}%`
        );
      }
    } else {
      // Empty query: return latest users
      qb = qb.order('created_at', { ascending: false }).limit(25);
    }

    if (excludeUserId) {
      qb = qb.neq('id', excludeUserId);
    }

    const { data, error } = await qb.limit(30);
    if (error) {
      console.warn('searchProfiles error:', error);
      return [];
    }

    return (data || []).map((row) => mapProfileRowToUserProfile(row));
  } catch (err) {
    console.error('searchProfiles exception:', err);
    return [];
  }
}

/**
 * UUID validator helper
 */
export const isUuid = (id?: string | null): boolean =>
  Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

/**
 * Set user online/offline status in public.profiles table
 */
export async function setUserOnlineStatus(userId?: string | null, isOnline: boolean = true): Promise<void> {
  if (!userId || !isUuid(userId)) return;
  const now = new Date().toISOString();
  const payload = {
    is_online: isOnline,
    last_seen: now,
  };

  try {
    if (!isOnline && typeof window !== 'undefined') {
      const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`;
      fetch(url, {
        method: 'PATCH',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
    await supabase.from('profiles').update(payload).eq('id', userId);
  } catch (err) {
    console.warn('setUserOnlineStatus error:', err);
  }
}

/**
 * Update any 'sent' messages to 'delivered' when a receiver comes online
 */
export async function updateMessagesToDelivered(receiverId?: string | null): Promise<void> {
  if (!receiverId || !isUuid(receiverId)) return;
  try {
    await supabase
      .from('direct_messages')
      .update({ status: 'delivered' })
      .eq('receiver_id', receiverId)
      .eq('status', 'sent');
  } catch (err) {
    console.warn('updateMessagesToDelivered error:', err);
  }
}

/**
 * Format Last Seen time string according to WhatsApp style
 * - "Online" if isOnline
 * - "Son görülmə: 14:30" if today
 * - "Son görülmə: dünən 14:30" if yesterday
 * - "Son görülmə: 28.09 14:30" if older
 */
export function formatLastSeen(isOnline?: boolean, lastSeen?: string | null): string {
  if (isOnline) {
    return 'Online';
  }
  if (!lastSeen) {
    return 'Oflayn';
  }
  try {
    const date = new Date(lastSeen);
    if (isNaN(date.getTime())) return 'Oflayn';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 60000 && diffMs >= 0) {
      return 'Bayaq görüldü';
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isToday) {
      return `Son görülmə: ${timeStr}`;
    } else if (isYesterday) {
      return `Son görülmə: dünən ${timeStr}`;
    } else {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `Son görülmə: ${day}.${month} ${timeStr}`;
    }
  } catch (e) {
    return 'Oflayn';
  }
}

/**
 * Checks if a filename or URL represents a video file
 */
export function isVideoUrlOrName(urlOrName?: string): boolean {
  if (!urlOrName) return false;
  return /\.(mp4|webm|mov|m4v|mkv|avi|ogv)(\?.*)?$/i.test(urlOrName);
}

/**
 * Uploads a media file or blob to Supabase Storage in the 'chat_media' bucket.
 * Returns public URL if available, or robust base64 DataURL fallback if bucket is restricted.
 */
export async function uploadChatMediaToSupabase(
  fileOrBlob: File | Blob,
  folder: 'audio' | 'images' | 'videos' | 'files' = 'files',
  customFileName?: string
): Promise<string> {
  const mimeType = fileOrBlob.type || (folder === 'audio' ? 'audio/webm' : folder === 'images' ? 'image/jpeg' : folder === 'videos' ? 'video/mp4' : 'application/octet-stream');
  
  let extension = 'bin';
  if (customFileName && customFileName.includes('.')) {
    extension = customFileName.split('.').pop() || 'bin';
  } else if (mimeType.includes('webm')) {
    extension = 'webm';
  } else if (mimeType.includes('mp4')) {
    extension = 'mp4';
  } else if (mimeType.includes('wav')) {
    extension = 'wav';
  } else if (mimeType.includes('ogg')) {
    extension = 'ogg';
  } else if (mimeType.includes('png')) {
    extension = 'png';
  } else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    extension = 'jpg';
  } else if (mimeType.includes('pdf')) {
    extension = 'pdf';
  }

  const cleanName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extension}`;

  try {
    const { data, error } = await supabase.storage
      .from('chat_media')
      .upload(cleanName, fileOrBlob, {
        contentType: mimeType,
        upsert: true,
      });

    if (!error && data?.path) {
      const { data: pubData } = supabase.storage
        .from('chat_media')
        .getPublicUrl(data.path);
      if (pubData?.publicUrl) {
        return pubData.publicUrl;
      }
    }
  } catch (err) {
    console.warn('Storage upload note:', err);
  }

  // Robust fallback: Convert to DataURL (Base64)
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      resolve(URL.createObjectURL(fileOrBlob));
    };
    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Maps a public.global_messages row into a UI ChatMessage
 */
export function mapGlobalMessageRowToChatMessage(
  row: any,
  currentUserId?: string
): ChatMessage {
  const isOutgoing = currentUserId ? row.sender_id === currentUserId : false;
  const time = row.created_at
    ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const hasVideo = isVideoUrlOrName(row.file_url) || isVideoUrlOrName(row.file_name);

  let msgType: ChatMessage['type'] = 'text';
  if (row.audio_url) msgType = 'voice';
  else if (row.image_url) msgType = 'image';
  else if (hasVideo) msgType = 'video';
  else if (row.file_url) msgType = 'file';

  const profile = row.profiles;
  let senderName = row.sender_name || 'İstifadəçi';
  if (profile) {
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    if (fullName) senderName = fullName;
  }
  const senderAvatar = row.sender_avatar || profile?.avatar || undefined;

  const audioUrl = row.audio_url || undefined;
  const imageUrl = row.image_url || undefined;
  const videoUrl = hasVideo ? row.file_url : undefined;
  const fileUrl = !hasVideo ? (row.file_url || undefined) : undefined;
  const mediaUrl = imageUrl || audioUrl || videoUrl || fileUrl;

  let voiceDuration: string | undefined = undefined;
  let voiceDurationSec: number | undefined = undefined;
  if (audioUrl) {
    if (row.file_name && !isNaN(Number(row.file_name)) && Number(row.file_name) > 0) {
      voiceDurationSec = Math.round(Number(row.file_name));
      const m = Math.floor(voiceDurationSec / 60);
      const s = voiceDurationSec % 60;
      voiceDuration = `${m}:${s < 10 ? '0' : ''}${s}`;
    } else if (row.text && row.text.includes(':')) {
      voiceDuration = row.text;
      const [m, s] = row.text.split(':').map(Number);
      if (!isNaN(m) && !isNaN(s)) voiceDurationSec = m * 60 + s;
    } else if (row.file_name && row.file_name.includes(':')) {
      voiceDuration = row.file_name;
      const [m, s] = row.file_name.split(':').map(Number);
      if (!isNaN(m) && !isNaN(s)) voiceDurationSec = m * 60 + s;
    } else {
      voiceDuration = '0:05';
      voiceDurationSec = 5;
    }
  }

  return {
    id: String(row.id),
    senderId: row.sender_id || '',
    senderName,
    senderAvatar,
    senderColor: '#10b981',
    isOutgoing,
    text: row.text || '',
    time,
    status: 'read',
    type: msgType,
    mediaUrl,
    audio_url: audioUrl,
    image_url: imageUrl,
    video_url: videoUrl,
    file_url: fileUrl,
    file_name: row.file_name || undefined,
    voiceDuration,
    voiceDurationSec,
    reactions: row.reactions && typeof row.reactions === 'object' ? row.reactions : undefined,
    fileInfo: row.file_url
      ? {
          name: row.file_name || (hasVideo ? 'Video' : 'Fayl'),
          size: '1.2 MB',
          bytes: 1200000,
          extension: (row.file_name || '').split('.').pop() || (hasVideo ? 'mp4' : 'dat'),
          fileUrl: row.file_url,
        }
      : undefined,
    replyTo: row.reply_to_id
      ? {
          id: String(row.reply_to_id),
          senderName: 'Cavab',
          text: '',
        }
      : undefined,
  };
}

/**
 * Fetch messages from public.global_messages (order by created_at asc)
 */
export async function fetchGlobalMessagesFromDb(
  currentUserId?: string
): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('global_messages')
      .select('*, profiles!sender_id(first_name, last_name, avatar, is_online, last_seen)')
      .order('created_at', { ascending: true })
      .limit(300);

    if (error) {
      console.warn('fetchGlobalMessagesFromDb error, fallback:', error);
      const fallback = await supabase
        .from('global_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(300);
      return (fallback.data || []).map((row) => mapGlobalMessageRowToChatMessage(row, currentUserId));
    }

    return (data || []).map((row) => mapGlobalMessageRowToChatMessage(row, currentUserId));
  } catch (err) {
    console.error('fetchGlobalMessagesFromDb error:', err);
    return [];
  }
}

/**
 * Fetch single global message by id joined with sender profile
 */
export async function fetchGlobalMessageById(
  messageId: string,
  currentUserId?: string
): Promise<ChatMessage | null> {
  try {
    const { data, error } = await supabase
      .from('global_messages')
      .select('*, profiles!sender_id(first_name, last_name, avatar, is_online, last_seen)')
      .eq('id', messageId)
      .maybeSingle();

    if (error || !data) {
      const fallback = await supabase
        .from('global_messages')
        .select('*')
        .eq('id', messageId)
        .maybeSingle();
      if (!fallback.data) return null;
      return mapGlobalMessageRowToChatMessage(fallback.data, currentUserId);
    }

    return mapGlobalMessageRowToChatMessage(data, currentUserId);
  } catch (err) {
    console.error('fetchGlobalMessageById error:', err);
    return null;
  }
}


/**
 * Insert new message into public.global_messages
 */
export async function sendGlobalMessageToDb(payload: {
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  sender_role?: string;
  text?: string;
  reply_to_id?: string;
  audio_url?: string;
  image_url?: string;
  video_url?: string;
  file_url?: string;
  file_name?: string;
}): Promise<any> {
  const fileUrl = payload.video_url || payload.file_url || null;
  const fileName = payload.file_name || (payload.video_url ? 'video.mp4' : null);

  const insertData: Record<string, any> = {
    sender_id: payload.sender_id,
    sender_name: payload.sender_name,
    sender_avatar: payload.sender_avatar || '',
    sender_role: payload.sender_role || 'user',
    text: payload.text || '',
    reply_to_id: (payload.reply_to_id && isUuid(payload.reply_to_id)) ? payload.reply_to_id : null,
    audio_url: payload.audio_url || null,
    image_url: payload.image_url || null,
    file_url: fileUrl,
    file_name: fileName,
  };

  const { data, error } = await supabase
    .from('global_messages')
    .insert(insertData)
    .select('*, profiles!sender_id(first_name, last_name, avatar, is_online, last_seen)')
    .single();

  if (error) {
    console.error('sendGlobalMessageToDb error:', error);
    throw error;
  }
  return data;
}

/**
 * Delete a message from public.global_messages
 */
export async function deleteGlobalMessageFromDb(messageId: string): Promise<void> {
  try {
    const { error } = await supabase.from('global_messages').delete().eq('id', messageId);
    if (error) {
      console.warn('deleteGlobalMessageFromDb error:', error);
    }
  } catch (e) {
    console.warn(e);
  }
}

/**
 * Update reactions in public.global_messages
 */
export async function updateGlobalMessageReactions(messageId: string, reactions: any): Promise<void> {
  try {
    await supabase.from('global_messages').update({ reactions }).eq('id', messageId);
  } catch (e) {
    console.warn(e);
  }
}

/**
 * Maps a public.direct_messages row into a UI ChatMessage
 */
export function mapDirectMessageRowToChatMessage(
  row: any,
  currentUserId?: string
): ChatMessage {
  const isOutgoing = currentUserId ? row.sender_id === currentUserId : false;
  const time = row.created_at
    ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const hasVideo = isVideoUrlOrName(row.file_url) || isVideoUrlOrName(row.file_name);

  let msgType: ChatMessage['type'] = 'text';
  if (row.audio_url) msgType = 'voice';
  else if (row.image_url) msgType = 'image';
  else if (hasVideo) msgType = 'video';
  else if (row.file_url) msgType = 'file';

  const profile = row.profiles;
  let senderName = isOutgoing ? 'Siz' : 'Qarşı tərəf';
  if (!isOutgoing && profile) {
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    if (fullName) senderName = fullName;
  }

  const audioUrl = row.audio_url || undefined;
  const imageUrl = row.image_url || undefined;
  const videoUrl = hasVideo ? row.file_url : undefined;
  const fileUrl = !hasVideo ? (row.file_url || undefined) : undefined;
  const mediaUrl = imageUrl || audioUrl || videoUrl || fileUrl;

  let voiceDuration: string | undefined = undefined;
  let voiceDurationSec: number | undefined = undefined;
  if (audioUrl) {
    if (row.file_name && !isNaN(Number(row.file_name)) && Number(row.file_name) > 0) {
      voiceDurationSec = Math.round(Number(row.file_name));
      const m = Math.floor(voiceDurationSec / 60);
      const s = voiceDurationSec % 60;
      voiceDuration = `${m}:${s < 10 ? '0' : ''}${s}`;
    } else if (row.text && row.text.includes(':')) {
      voiceDuration = row.text;
      const [m, s] = row.text.split(':').map(Number);
      if (!isNaN(m) && !isNaN(s)) voiceDurationSec = m * 60 + s;
    } else if (row.file_name && row.file_name.includes(':')) {
      voiceDuration = row.file_name;
      const [m, s] = row.file_name.split(':').map(Number);
      if (!isNaN(m) && !isNaN(s)) voiceDurationSec = m * 60 + s;
    } else {
      voiceDuration = '0:05';
      voiceDurationSec = 5;
    }
  }

  return {
    id: String(row.id),
    senderId: row.sender_id,
    senderName,
    senderAvatar: profile?.avatar || undefined,
    isOutgoing,
    text: row.text || '',
    time,
    status: (row.status as 'sent' | 'delivered' | 'read') || 'sent',
    type: msgType,
    mediaUrl,
    audio_url: audioUrl,
    image_url: imageUrl,
    video_url: videoUrl,
    file_url: fileUrl,
    file_name: row.file_name || undefined,
    voiceDuration,
    voiceDurationSec,
    fileInfo: row.file_url
      ? {
          name: row.file_name || (hasVideo ? 'Video' : 'Fayl'),
          size: '1.0 MB',
          bytes: 1000000,
          extension: (row.file_name || '').split('.').pop() || (hasVideo ? 'mp4' : 'dat'),
          fileUrl: row.file_url,
        }
      : undefined,
    replyTo: row.reply_to_id
      ? {
          id: String(row.reply_to_id),
          senderName: '',
          text: '',
        }
      : undefined,
  };
}

/**
 * Fetch messages between two users from public.direct_messages
 */
export async function fetchDirectMessagesBetweenUsers(
  user1Id: string,
  user2Id: string,
  currentUserId?: string
): Promise<ChatMessage[]> {
  if (!isUuid(user1Id) || !isUuid(user2Id)) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('direct_messages')
      .select('*, profiles!sender_id(first_name, last_name, avatar, is_online, last_seen)')
      .or(
        `and(sender_id.eq.${user1Id},receiver_id.eq.${user2Id}),and(sender_id.eq.${user2Id},receiver_id.eq.${user1Id})`
      )
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('fetchDirectMessagesBetweenUsers error, fallback:', error);
      const fallback = await supabase
        .from('direct_messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user1Id},receiver_id.eq.${user2Id}),and(sender_id.eq.${user2Id},receiver_id.eq.${user1Id})`
        )
        .order('created_at', { ascending: true });
      const fallbackMapped = (fallback.data || []).map((row) => mapDirectMessageRowToChatMessage(row, currentUserId || user1Id));
      const fbMap = new Map<string, ChatMessage>();
      fallbackMapped.forEach((m) => fbMap.set(m.id, m));
      fallbackMapped.forEach((m) => {
        if (m.replyTo?.id && (!m.replyTo.text || !m.replyTo.senderName)) {
          const t = fbMap.get(m.replyTo.id);
          if (t) {
            m.replyTo.senderName = t.senderName;
            m.replyTo.text = t.text || (t.type === 'image' ? '📷 Şəkil' : t.type === 'voice' ? '🎤 Səsli mesaj' : t.type === 'video' ? '🎥 Video' : 'Media');
          }
        }
      });
      return fallbackMapped;
    }

    const mapped = (data || []).map((row) => mapDirectMessageRowToChatMessage(row, currentUserId || user1Id));
    const msgMap = new Map<string, ChatMessage>();
    mapped.forEach((m) => msgMap.set(m.id, m));
    mapped.forEach((m) => {
      if (m.replyTo?.id && (!m.replyTo.text || !m.replyTo.senderName)) {
        const t = msgMap.get(m.replyTo.id);
        if (t) {
          m.replyTo.senderName = t.senderName;
          m.replyTo.text = t.text || (t.type === 'image' ? '📷 Şəkil' : t.type === 'voice' ? '🎤 Səsli mesaj' : t.type === 'video' ? '🎥 Video' : 'Media');
        }
      }
    });

    return mapped;
  } catch (err) {
    console.error('fetchDirectMessagesBetweenUsers error:', err);
    return [];
  }
}

/**
 * Fetch a single message from direct_messages by id joined with sender profile
 */
export async function fetchDirectMessageById(
  messageId: string,
  currentUserId?: string
): Promise<ChatMessage | null> {
  try {
    const { data, error } = await supabase
      .from('direct_messages')
      .select('*, profiles!sender_id(first_name, last_name, avatar, is_online, last_seen)')
      .eq('id', messageId)
      .maybeSingle();

    if (error || !data) {
      const fallback = await supabase
        .from('direct_messages')
        .select('*')
        .eq('id', messageId)
        .maybeSingle();
      if (!fallback.data) return null;
      return mapDirectMessageRowToChatMessage(fallback.data, currentUserId);
    }

    return mapDirectMessageRowToChatMessage(data, currentUserId);
  } catch (err) {
    console.error('fetchDirectMessageById error:', err);
    return null;
  }
}


/**
 * Insert a message into public.direct_messages
 */
export async function sendDirectMessageToDb(payload: {
  sender_id: string;
  receiver_id: string;
  text?: string;
  audio_url?: string;
  image_url?: string;
  video_url?: string;
  file_url?: string;
  file_name?: string;
  reply_to_id?: string;
  status?: string;
}): Promise<any> {
  if (!isUuid(payload.sender_id) || !isUuid(payload.receiver_id)) {
    console.warn('sendDirectMessageToDb: sender_id and receiver_id must be valid UUIDs', payload);
    return null;
  }

  const fileUrl = payload.video_url || payload.file_url || null;
  const fileName = payload.file_name || (payload.video_url ? 'video.mp4' : null);

  const insertPayload: Record<string, any> = {
    sender_id: payload.sender_id,
    receiver_id: payload.receiver_id,
    text: payload.text || '',
    status: payload.status || 'sent',
  };
  if (payload.audio_url) insertPayload.audio_url = payload.audio_url;
  if (payload.image_url) insertPayload.image_url = payload.image_url;
  if (fileUrl) insertPayload.file_url = fileUrl;
  if (fileName) insertPayload.file_name = fileName;
  if (payload.reply_to_id && isUuid(payload.reply_to_id)) insertPayload.reply_to_id = payload.reply_to_id;

  const { data, error } = await supabase
    .from('direct_messages')
    .insert(insertPayload)
    .select('*, profiles!sender_id(first_name, last_name, avatar, is_online, last_seen)')
    .single();

  if (error) {
    console.error('sendDirectMessageToDb error:', error);
    throw error;
  }
  return data;
}

/**
 * Mark direct messages as read in public.direct_messages
 */
export async function markDirectMessagesAsReadInDb(
  otherUserId: string,
  currentUserId: string
): Promise<void> {
  if (!isUuid(otherUserId) || !isUuid(currentUserId)) {
    return;
  }

  try {
    await supabase
      .from('direct_messages')
      .update({ status: 'read' })
      .eq('sender_id', otherUserId)
      .eq('receiver_id', currentUserId)
      .neq('status', 'read');
  } catch (err) {
    console.warn('markDirectMessagesAsReadInDb error:', err);
  }
}

/**
 * Delete a message from public.direct_messages
 */
export async function deleteDirectMessageInDb(messageId: string): Promise<void> {
  try {
    const { error } = await supabase.from('direct_messages').delete().eq('id', messageId);
    if (error) {
      console.warn('deleteDirectMessageInDb error:', error);
    }
  } catch (err) {
    console.warn(err);
  }
}

/**
 * Fetch all user conversations directly from public.direct_messages & public.profiles
 */
export async function fetchUserConversationsFromDb(
  currentUserId: string,
  acceptedPartnerIds: string[] = [],
  blockedUserIds: string[] = []
): Promise<ChatConversation[]> {
  if (!isUuid(currentUserId)) {
    return [];
  }

  try {
    const { data: messages, error } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .order('created_at', { ascending: false });

    if (error || !messages || messages.length === 0) {
      return [];
    }

    const partnerMap = new Map<
      string,
      { partnerId: string; messages: any[]; unreadCount: number }
    >();

    for (const msg of messages) {
      const partnerId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
      if (!partnerId) continue;
      if (blockedUserIds.includes(partnerId)) continue;

      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, { partnerId, messages: [], unreadCount: 0 });
      }
      const entry = partnerMap.get(partnerId)!;
      entry.messages.push(msg);
      if (msg.receiver_id === currentUserId && msg.status !== 'read') {
        entry.unreadCount += 1;
      }
    }

    const partnerIds = Array.from(partnerMap.keys());
    if (partnerIds.length === 0) return [];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', partnerIds);

    const profileMap = new Map<string, any>();
    (profiles || []).forEach((p) => profileMap.set(p.id, p));

    const conversations: ChatConversation[] = [];

    partnerMap.forEach(({ partnerId, messages: partnerMsgs, unreadCount }) => {
      const profile = profileMap.get(partnerId);
      const name = profile
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email?.split('@')[0] || 'İstifadəçi'
        : 'İstifadəçi';

      const chronological = [...partnerMsgs]
        .reverse()
        .map((m) => mapDirectMessageRowToChatMessage(m, currentUserId));

      // Resolve replyTo references in chronological messages
      const msgById = new Map<string, ChatMessage>();
      chronological.forEach((m) => msgById.set(m.id, m));
      chronological.forEach((m) => {
        if (m.replyTo?.id && (!m.replyTo.text || !m.replyTo.senderName)) {
          const target = msgById.get(m.replyTo.id);
          if (target) {
            m.replyTo.senderName = target.senderName;
            m.replyTo.text =
              target.text ||
              (target.type === 'image'
                ? '📷 Şəkil'
                : target.type === 'voice'
                ? '🎤 Səsli mesaj'
                : target.type === 'video'
                ? '🎥 Video'
                : target.type === 'file'
                ? '📎 Fayl'
                : 'Media');
          }
        }
      });

      const latest = partnerMsgs[0];
      const timeStr = latest?.created_at
        ? new Date(latest.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';

      const hasCurrentUserReplied = partnerMsgs.some((m) => m.sender_id === currentUserId);
      const isAccepted = acceptedPartnerIds.includes(partnerId);
      const isRequest = !hasCurrentUserReplied && !isAccepted;

      conversations.push({
        id: partnerId,
        name,
        avatarType: profile?.avatar ? 'photo' : 'icon',
        avatarUrl: profile?.avatar || undefined,
        avatarBgColor: 'bg-emerald-100 text-emerald-800',
        initial: name.charAt(0).toUpperCase() || 'U',
        unreadCount,
        lastMessage:
          latest?.text ||
          (latest?.audio_url
            ? '🎤 Səsli mesaj'
            : latest?.image_url
            ? '📷 Şəkil'
            : latest?.file_url
            ? '📎 Fayl'
            : ''),
        lastMessageTime: timeStr,
        lastMessageStatus: (latest?.status as any) || 'sent',
        lastMessageType: latest?.audio_url
          ? 'voice'
          : latest?.image_url
          ? 'image'
          : latest?.file_url
          ? 'file'
          : 'text',
        category: isRequest ? 'request' : 'direct',
        isOnline: profile?.is_online ?? false,
        lastSeen: profile?.last_seen || null,
        userCode: profile?.user_code || undefined,
        profession: profile?.profession || undefined,
        experience: profile?.experience || undefined,
        tags: profile?.tags || undefined,
        messages: chronological,
      });
    });

    return conversations;
  } catch (err) {
    console.error('fetchUserConversationsFromDb error:', err);
    return [];
  }
}

/**
 * Insert user report into public.reports
 */
export async function submitReportToDb(report: {
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  details?: string;
}): Promise<{ success: boolean; error?: any }> {
  if (!isUuid(report.reporter_id) || !isUuid(report.reported_user_id)) {
    console.warn('submitReportToDb: reporter_id and reported_user_id must be valid UUIDs', report);
    return { success: false, error: 'Invalid UUIDs' };
  }

  try {
    const { error } = await supabase
      .from('reports')
      .insert({
        reporter_id: report.reporter_id,
        reported_user_id: report.reported_user_id,
        reason: report.reason,
        details: report.details || '',
      });

    if (error) {
      console.warn('submitReportToDb error:', error);
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    console.error('submitReportToDb exception:', err);
    return { success: false, error: err };
  }
}

/**
 * Update user metadata (avatar, profession, experience, tags, name) in Supabase
 */
export async function updateUserProfileMeta(updates: Partial<UserProfile>) {
  const metaUpdates: Record<string, any> = {};
  if (updates.firstName !== undefined) metaUpdates.first_name = updates.firstName;
  if (updates.lastName !== undefined) metaUpdates.last_name = updates.lastName;
  if (updates.avatarUrl !== undefined) metaUpdates.avatar_url = updates.avatarUrl;
  if (updates.profession !== undefined) metaUpdates.profession = updates.profession;
  if (updates.experience !== undefined) metaUpdates.experience = updates.experience;
  if (updates.bio !== undefined) metaUpdates.bio = updates.bio;
  if (updates.tags !== undefined) metaUpdates.tags = updates.tags;
  if (updates.userCode !== undefined) metaUpdates.user_code = updates.userCode;

  const { data, error } = await supabase.auth.updateUser({
    data: metaUpdates,
  });

  if (error) {
    console.warn('Could not update metadata in Supabase:', error.message);
  }
  return data;
}

/**
 * Sign up a new user with email, password, and personal info
 */
export async function signUpWithEmail(
  email: string,
  pass: string,
  firstName: string,
  lastName: string
) {
  const cleanFirst = firstName.trim();
  const cleanLast = lastName.trim();
  const fullName = `${cleanFirst} ${cleanLast}`.trim();

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: pass,
    options: {
      data: {
        firstName: cleanFirst,
        lastName: cleanLast,
        first_name: cleanFirst,
        last_name: cleanLast,
        full_name: fullName,
        name: fullName,
        balance: 0,
      },
    },
  });

  if (error) {
    throw error;
  }

  // Also write/upsert directly into public.profiles table
  if (data.user) {
    try {
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          email: email.trim(),
          first_name: cleanFirst,
          last_name: cleanLast,
          avatar: '',
          balance: 0,
          profession: 'Dizayner',
          experience: 'Yeni',
          bio: '',
          tags: ['Qrafik dizayn', 'Motion dizayn', 'Logo dizayn'],
          is_online: true,
          last_seen: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
      if (profileError) {
        console.warn('Direct profile upsert error on signUp:', profileError);
      }
    } catch (e) {
      console.warn('Could not upsert profile directly:', e);
    }
  }

  return data;
}

/**
 * Sign in an existing user with email and password
 */
export async function signInWithEmail(email: string, pass: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: pass,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Sign out current user session
 */
export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string) {
  const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
  const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: redirectUrl,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Verify OTP / email token
 */
export async function verifyEmailOtp(email: string, token: string) {
  // First attempt recovery type, fallback to signup/email
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: 'recovery',
  });

  if (error) {
    // Retry with 'email' verification type
    const retry = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'email',
    });
    if (retry.error) {
      throw error;
    }
    return retry.data;
  }

  return data;
}

/**
 * Update password for current authenticated user
 */
export async function updateUserPassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Trigger OAuth login with Google or Facebook via Supabase
 */
export async function signInWithOAuthProvider(provider: 'google' | 'facebook') {
  const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}
