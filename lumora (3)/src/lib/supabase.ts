import { createClient, User } from '@supabase/supabase-js';
import { UserProfile } from '../types';

const DEFAULT_SUPABASE_URL = 'https://czvamcdrvcdjzrzdsibv.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_L5Gs_6WGrkRPJYF0LnhgXQ_n5RFyVF2';

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
 * Transforms a Supabase Auth User object into our typed UserProfile
 */
export function mapSupabaseUserToProfile(user: User): UserProfile {
  const meta = user.user_metadata || {};
  const fullName = meta.full_name || meta.name || '';
  const nameParts = fullName.trim().split(/\s+/);

  const firstName =
    meta.first_name ||
    nameParts[0] ||
    (user.email ? user.email.split('@')[0] : 'İstifadəçi');
  const lastName =
    meta.last_name ||
    (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');

  return {
    id: user.id,
    userCode: meta.user_code || '12345678',
    firstName: firstName || 'Elvin',
    lastName: lastName || 'Səmədov',
    email: user.email || '',
    balance: typeof meta.balance === 'number' ? meta.balance : 0,
    avatarUrl: meta.avatar_url || meta.picture || undefined,
    profession: meta.profession || 'Dizayner',
    experience: meta.experience || '1 il',
    tags: Array.isArray(meta.tags) && meta.tags.length > 0
      ? meta.tags
      : ['Qrafik dizayn', 'Motion dizayn', 'Logo dizayn'],
    createdAt: user.created_at || new Date().toISOString(),
  };
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
  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: pass,
    options: {
      data: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: fullName,
        balance: 0,
      },
    },
  });

  if (error) {
    throw error;
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
