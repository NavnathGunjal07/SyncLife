import { create } from 'zustand';

import {
  confirmMemory as apiConfirmMemory,
  fetchChatHistory,
  fetchChatSession,
  sendChat
} from '../services/api';
import { refreshDomains } from '../services/bootstrap';
import { getRandomQuote } from '../constants/quotes';
import { ChatMessage, ChatRole } from '../types';
import { makeId, toISODate } from '../utils/date';
import { useAuthStore } from './auth';

type ChatState = {
  messages: ChatMessage[];
  loading: boolean;
  started: boolean;
  /** Loads history (once) then drops a fresh AI greeting — call on every open. */
  openChat: () => Promise<void>;
  greet: () => Promise<void>;
  send: (text: string) => Promise<void>;
  confirmMemoryCard: (messageId: string, memoryId: string) => Promise<void>;
  reset: () => void;
};

const quoteLine = () => {
  const q = getRandomQuote();
  return `\n\n“${q.text}” — ${q.author}`;
};

const userMsg = (content: string): ChatMessage => ({
  id: makeId('msg'),
  role: 'user',
  content,
  cards: [],
  options: []
});

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,
  started: false,

  openChat: async () => {
    const token = useAuthStore.getState().accessToken;

    // 1) Load persisted history once per session.
    if (!get().started) {
      set({ started: true });
      if (token) {
        try {
          const { messages } = await fetchChatHistory(token, 40);
          const restored: ChatMessage[] = messages
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({
              id: m.id,
              role: m.role as ChatRole,
              content: m.content,
              cards: m.data?.cards ?? [],
              options: [] // history options are stale; the greeting provides fresh ones
            }));
          set({ messages: restored });
        } catch {
          // ignore — greeting below still gives the user a starting point
        }
      }
    }

    // 2) Proactively greet on every open (coach speaks first).
    await get().greet();
  },

  // Appends a fresh, non-persisted AI greeting with a motivational quote. If the
  // last message is already an unanswered greeting, it's replaced (new quote) so
  // greetings never stack when toggling tabs.
  greet: async () => {
    const token = useAuthStore.getState().accessToken;

    const append = (content: string, options: string[]) =>
      set((state) => {
        const msgs = state.messages.map((m) => ({ ...m, options: [] }));
        if (msgs.length && msgs[msgs.length - 1]?.ephemeral) msgs.pop();
        return {
          messages: [...msgs, { id: makeId('greet'), role: 'assistant' as ChatRole, content, cards: [], options, ephemeral: true }]
        };
      });

    const defaultOptions = ['Log a meal', 'Mark workout done', 'Add water'];

    if (!token) {
      append(`Hey! I'm your SyncLife coach. Let's make today count.${quoteLine()}`, defaultOptions);
      return;
    }

    try {
      const session = await fetchChatSession(token, toISODate());
      // Setup prompts stay focused; daily check-ins carry a fresh quote.
      const content = session.setupComplete ? `${session.message}${quoteLine()}` : session.message;
      append(content, session.options?.length ? session.options : defaultOptions);
    } catch {
      append(`Welcome back! Ready to keep your streak alive?${quoteLine()}`, defaultOptions);
    }
  },

  send: async (text) => {
    const trimmed = text.trim();
    if (!trimmed || get().loading) return;

    // Clear stale options on prior messages and append the user's message.
    set((state) => ({
      messages: [...state.messages.map((m) => ({ ...m, options: [] })), userMsg(trimmed)],
      loading: true
    }));

    const token = useAuthStore.getState().accessToken;
    if (!token) {
      set((state) => ({
        messages: [
          ...state.messages,
          { id: makeId('msg'), role: 'assistant', content: 'Please sign in again to use the assistant.', cards: [], options: [] }
        ],
        loading: false
      }));
      return;
    }

    try {
      const res = await sendChat(token, trimmed, toISODate());
      set((state) => ({
        messages: [
          ...state.messages,
          { id: makeId('msg'), role: 'assistant', content: res.message, cards: res.cards ?? [], options: res.options ?? [] }
        ],
        loading: false
      }));
      if (res.refresh?.length) void refreshDomains(res.refresh);
    } catch (error) {
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: makeId('msg'),
            role: 'assistant',
            content: error instanceof Error ? error.message : "Sorry, I couldn't reach the assistant. Try again.",
            cards: [],
            options: []
          }
        ],
        loading: false
      }));
    }
  },

  confirmMemoryCard: async (messageId, memoryId) => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;
    try {
      await apiConfirmMemory(token, memoryId);
    } catch {
      // ignore — surface nothing; user can retry
      return;
    }
    // Replace the memory_prompt card with a confirmed note on that message.
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, cards: m.cards.filter((c) => !(c.type === 'memory_prompt' && c.id === memoryId)) }
          : m
      )
    }));
  },

  reset: () => set({ messages: [], loading: false, started: false })
}));
