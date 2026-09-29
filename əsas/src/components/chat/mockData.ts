import { ChatConversation, ChatMessage } from './types';

// Real chat conversations are fetched directly from Supabase public.direct_messages
export const INITIAL_CONVERSATIONS: ChatConversation[] = [];

// Real global messages are fetched directly from Supabase public.global_messages
export const INITIAL_GLOBAL_MESSAGES: ChatMessage[] = [];
