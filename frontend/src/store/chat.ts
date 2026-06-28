import { create } from 'zustand';

import {
  confirmMemory as apiConfirmMemory,
  fetchChatHistory,
  fetchChatSession,
  sendChat
} from '../services/api';
import { refreshDomains } from '../services/bootstrap';
import { ChatMessage, ChatRole } from '../types';
import { makeId, toISODate } from '../utils/date';
import { useAuthStore } from './auth';

type ChatState = {
  messages: ChatMessage[];
  loading: boolean;
  started: boolean;
  startSession: () => Promise<void>;
  send: (text: string) => Promise<void>;
  confirmMemoryCard: (messageId: string, memoryId: string) => Promise<void>;
  reset: () => void;
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

  startSession: async () => {
    if (get().started) return;
    set({ started: true });
    const token = useAuthStore.getState().accessToken;
    if (!token) return;
    const date = toISODate();
    try {
      const { messages } = await fetchChatHistory(token, 40);
      const restored: ChatMessage[] = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          id: m.id,
          role: m.role as ChatRole,
          content: m.content,
          cards: m.data?.cards ?? [],
          options: m.data?.options ?? []
        }));

      if (restored.length > 0) {
        // Only the latest assistant message keeps its tappable options active.
        const lastAssistant = [...restored].reverse().find((m) => m.role === 'assistant');
        const messagesWithOptions = restored.map((m) =>
          m === lastAssistant ? m : { ...m, options: [] }
        );
        set({ messages: messagesWithOptions });
        return;
      }

      // No history yet — fetch the opening turn (setup vs daily check-in).
      const session = await fetchChatSession(token, date);
      set({
        messages: [
          { id: makeId('msg'), role: 'assistant', content: session.message, cards: session.cards ?? [], options: session.options ?? [] }
        ]
      });
    } catch {
      set({
        messages: [
          {
            id: makeId('msg'),
            role: 'assistant',
            content: "Hi! I'm your SyncLife coach. How can I help — log a meal, a workout, water, or an expense?",
            cards: [],
            options: ['Log a meal', 'Mark workout done', 'Add water']
          }
        ]
      });
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
