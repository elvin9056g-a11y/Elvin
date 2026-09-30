import { supabase, isUuid } from './supabase';
import { ChatMessage } from '../components/chat/types';

export interface StealthBlockRecord {
  blockerId: string;
  blockedId: string;
  blockedAt: string;
  timestamp: number;
  blockedUser?: {
    id: string;
    name: string;
    avatarUrl?: string;
    userCode?: string;
    reason?: string;
  };
}

const STORAGE_KEY = 'lumora_stealth_blocks';

/**
 * Get all active stealth blocks from localStorage
 */
export function getAllStealthBlocks(): StealthBlockRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Save stealth blocks list to localStorage
 */
function saveAllStealthBlocks(blocks: StealthBlockRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
  } catch (e) {
    console.error('Failed to save stealth blocks', e);
  }
}

/**
 * Check if targetId has blocked viewerId (Viewer is blocked by target)
 * Used to hide target's online status and force single tick on messages.
 */
export function isViewerBlockedByTarget(viewerId?: string | null, targetId?: string | null): boolean {
  if (!viewerId || !targetId) return false;
  if (viewerId === targetId) return false;

  // 1. Check global stealth blocks table (blockerId === targetId && blockedId === viewerId)
  const blocks = getAllStealthBlocks();
  const found = blocks.some((b) => b.blockerId === targetId && b.blockedId === viewerId);
  if (found) return true;

  // 2. Check target's personal blocked list in localStorage
  try {
    const targetBlockedKey = `lumora_blocked_users_${targetId}`;
    const raw = localStorage.getItem(targetBlockedKey);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.some((item) => (typeof item === 'string' ? item === viewerId : item.id === viewerId))) {
        return true;
      }
    }
  } catch (e) {}

  return false;
}

/**
 * Check if viewerId has blocked targetId (Viewer is the blocker)
 * Used to filter out incoming realtime messages and exclude from chats.
 */
export function isTargetBlockedByViewer(viewerId?: string | null, targetId?: string | null): boolean {
  if (!viewerId || !targetId) return false;
  if (viewerId === targetId) return false;

  const blocks = getAllStealthBlocks();
  const found = blocks.some((b) => b.blockerId === viewerId && b.blockedId === targetId);
  if (found) return true;

  try {
    const viewerBlockedKey = `lumora_blocked_users_${viewerId}`;
    const raw = localStorage.getItem(viewerBlockedKey);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.some((item) => (typeof item === 'string' ? item === targetId : item.id === targetId))) {
        return true;
      }
    }
  } catch (e) {}

  return false;
}

/**
 * Record a stealth block
 */
export function recordStealthBlock(
  blockerId: string,
  blockedId: string,
  userMeta?: { name: string; avatarUrl?: string; userCode?: string; reason?: string }
) {
  if (!blockerId || !blockedId) return;

  const blocks = getAllStealthBlocks().filter(
    (b) => !(b.blockerId === blockerId && b.blockedId === blockedId)
  );

  const newRecord: StealthBlockRecord = {
    blockerId,
    blockedId,
    blockedAt: new Date().toLocaleDateString(),
    timestamp: Date.now(),
    blockedUser: {
      id: blockedId,
      name: userMeta?.name || 'İstifadəçi',
      avatarUrl: userMeta?.avatarUrl,
      userCode: userMeta?.userCode,
      reason: userMeta?.reason || 'İstifadəçi tərəfindən bloklandı',
    },
  };

  blocks.push(newRecord);
  saveAllStealthBlocks(blocks);

  // Sync to blocker's personal blocked list
  try {
    const key = `lumora_blocked_users_${blockerId}`;
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((b: any) => (typeof b === 'string' ? b !== blockedId : b.id !== blockedId));
    filtered.push(newRecord.blockedUser);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (e) {}
}

/**
 * Remove stealth block and execute explosion trigger:
 * Restores all messages sent by blockedId while blocked,
 * marks them as 'delivered' in Supabase, and returns them for A's UI.
 */
export async function recordStealthUnblockAndExplode(
  blockerId: string,
  blockedId: string
): Promise<{ success: boolean }> {
  if (!blockerId || !blockedId) return { success: false };

  // 1. Remove from stealth blocks registry
  const blocks = getAllStealthBlocks().filter(
    (b) => !(b.blockerId === blockerId && b.blockedId === blockedId)
  );
  saveAllStealthBlocks(blocks);

  // 2. Remove from blocker's personal blocked list
  try {
    const key = `lumora_blocked_users_${blockerId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const list = JSON.parse(raw);
      const filtered = list.filter((b: any) => (typeof b === 'string' ? b !== blockedId : b.id !== blockedId));
      localStorage.setItem(key, JSON.stringify(filtered));
    }
  } catch (e) {}

  // 3. Database Explosion Trigger:
  // Messages sent by blockedId to blockerId while blocked had status 'sent'.
  // We immediately update them to 'delivered' so the sender (B) sees double ticks,
  // and they are now ready to be read by A.
  if (isUuid(blockerId) && isUuid(blockedId)) {
    try {
      await supabase
        .from('direct_messages')
        .update({ status: 'delivered' })
        .eq('sender_id', blockedId)
        .eq('receiver_id', blockerId)
        .eq('status', 'sent');
    } catch (err) {
      console.warn('Stealth unblock trigger delivered update error:', err);
    }
  }

  return { success: true };
}

/**
 * Check if there is ANY active block between user1 and user2 in either direction.
 * If user1 blocked user2 OR user2 blocked user1 -> returns true.
 * Used for mutual status hiding: neither party can see the other's online/last_seen.
 */
export function isMutualBlocked(user1Id?: string | null, user2Id?: string | null): boolean {
  if (!user1Id || !user2Id) return false;
  if (user1Id === user2Id) return false;
  return isViewerBlockedByTarget(user1Id, user2Id) || isTargetBlockedByViewer(user1Id, user2Id);
}

const ACCEPTED_PAIRS_KEY = 'lumora_accepted_chat_pairs';

/**
 * Get all globally accepted chat pairs from localStorage
 */
export function getAcceptedChatPairs(): string[] {
  try {
    const raw = localStorage.getItem(ACCEPTED_PAIRS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Record mutually accepted chat pair so neither sees pending request status
 */
export function recordAcceptedChatPair(user1Id: string, user2Id: string) {
  if (!user1Id || !user2Id) return;
  const pairKey = [user1Id, user2Id].sort().join(':');
  const pairs = getAcceptedChatPairs();
  if (!pairs.includes(pairKey)) {
    pairs.push(pairKey);
    try {
      localStorage.setItem(ACCEPTED_PAIRS_KEY, JSON.stringify(pairs));
    } catch (e) {}
  }

  // Also update personal accepted lists
  try {
    const key1 = `lumora_accepted_chats_${user1Id}`;
    const raw1 = localStorage.getItem(key1);
    const list1 = raw1 ? JSON.parse(raw1) : [];
    if (!list1.includes(user2Id)) {
      localStorage.setItem(key1, JSON.stringify([...list1, user2Id]));
    }

    const key2 = `lumora_accepted_chats_${user2Id}`;
    const raw2 = localStorage.getItem(key2);
    const list2 = raw2 ? JSON.parse(raw2) : [];
    if (!list2.includes(user1Id)) {
      localStorage.setItem(key2, JSON.stringify([...list2, user1Id]));
    }
  } catch (e) {}
}

/**
 * Remove accepted chat pair from all registries (used when deleting a user/friendship)
 */
export function removeAcceptedChatPair(user1Id?: string | null, user2Id?: string | null) {
  if (!user1Id || !user2Id) return;
  const pairKey = [user1Id, user2Id].sort().join(':');
  const pairs = getAcceptedChatPairs().filter((p) => p !== pairKey);
  try {
    localStorage.setItem(ACCEPTED_PAIRS_KEY, JSON.stringify(pairs));
  } catch (e) {}

  try {
    const key1 = `lumora_accepted_chats_${user1Id}`;
    const raw1 = localStorage.getItem(key1);
    if (raw1) {
      const list1 = JSON.parse(raw1).filter((id: string) => id !== user2Id);
      localStorage.setItem(key1, JSON.stringify(list1));
    }
    const key2 = `lumora_accepted_chats_${user2Id}`;
    const raw2 = localStorage.getItem(key2);
    if (raw2) {
      const list2 = JSON.parse(raw2).filter((id: string) => id !== user1Id);
      localStorage.setItem(key2, JSON.stringify(list2));
    }
  } catch (e) {}
}

/**
 * Check if a chat pair has been confirmed/accepted
 */
export function isChatPairAccepted(user1Id?: string | null, user2Id?: string | null): boolean {
  if (!user1Id || !user2Id) return false;
  const pairKey = [user1Id, user2Id].sort().join(':');
  if (getAcceptedChatPairs().includes(pairKey)) return true;

  try {
    const key1 = `lumora_accepted_chats_${user1Id}`;
    const raw1 = localStorage.getItem(key1);
    if (raw1 && JSON.parse(raw1).includes(user2Id)) return true;

    const key2 = `lumora_accepted_chats_${user2Id}`;
    const raw2 = localStorage.getItem(key2);
    if (raw2 && JSON.parse(raw2).includes(user1Id)) return true;
  } catch (e) {}

  return false;
}

/**
 * Check if the chat between currentUserId and partner is still in "pending request" stage.
 * If either:
 * - Conversation category is 'request', OR
 * - Pair is not accepted and not both have replied to each other.
 */
export function isConversationPendingRequest(
  currentUserId?: string | null,
  conversation?: { id: string; category?: string; messages?: any[] } | null
): boolean {
  if (!currentUserId || !conversation) return false;
  if (conversation.category === 'group') return false;
  if (conversation.category === 'request') return true;

  const partnerId = conversation.id;
  if (isChatPairAccepted(currentUserId, partnerId)) return false;

  // Check messages: if both parties have sent messages, it is accepted
  if (conversation.messages && conversation.messages.length > 0) {
    const hasMyMsg = conversation.messages.some(
      (m: any) => m.senderId === currentUserId || m.sender_id === currentUserId
    );
    const hasPartnerMsg = conversation.messages.some(
      (m: any) => m.senderId === partnerId || m.sender_id === partnerId
    );
    if (hasMyMsg && hasPartnerMsg) {
      recordAcceptedChatPair(currentUserId, partnerId);
      return false;
    }
    // Only one party sent messages and not accepted yet -> PENDING
    return true;
  }

  // Not accepted yet and no mutual exchange -> PENDING
  return true;
}

/**
 * Mutual Privacy Check:
 * If either party blocked the other OR the conversation is in a pending request stage
 * (not mutually accepted yet), online and last_seen status must be COMPLETELY HIDDEN
 * (returns true) for both sides.
 */
export function shouldHideOnlineStatus(
  currentUserId?: string | null,
  partnerId?: string | null,
  conversation?: { id: string; category?: string; messages?: any[] } | null
): boolean {
  if (!currentUserId || !partnerId) return false;
  if (currentUserId === partnerId) return false;

  // 1. Mutual block check: if A blocked B or B blocked A -> HIDDEN
  if (isMutualBlocked(currentUserId, partnerId)) return true;

  // Groups do not hide status via 1-on-1 mutual rules
  if (conversation?.category === 'group') return false;

  // 2. Pending request category check -> HIDDEN
  if (conversation?.category === 'request') return true;

  // 3. Accepted pair check:
  if (isChatPairAccepted(currentUserId, partnerId)) return false;

  // 4. Pending communication check:
  // If not yet accepted, and both sides haven't exchanged messages -> HIDDEN
  if (conversation?.messages && conversation.messages.length > 0) {
    const hasMyMsg = conversation.messages.some(
      (m: any) => m.senderId === currentUserId || m.sender_id === currentUserId
    );
    const hasPartnerMsg = conversation.messages.some(
      (m: any) => m.senderId === partnerId || m.sender_id === partnerId
    );
    if (!hasMyMsg || !hasPartnerMsg) {
      return true; // Still pending request
    }
  } else {
    // No messages or pending direct chat -> HIDDEN until confirmed
    return true;
  }

  return false;
}
