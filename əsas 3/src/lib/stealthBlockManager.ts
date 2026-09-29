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
