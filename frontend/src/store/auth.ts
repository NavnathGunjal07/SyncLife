import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { postGoals } from '../services/api';
import { AuthUser, UserProfile } from '../types';
import { waterGoalForWeight } from '../utils/calculators';

const defaultProfile: UserProfile = {
  weightKg: 70,
  heightCm: 170,
  fitnessGoal: 'Maintain',
  calorieTarget: 2200,
  waterGoalMl: waterGoalForWeight(70),
  waterGoalMode: 'auto',
  monthlyBudget: 30000
};

type AuthState = {
  _hydrated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  onboardingComplete: boolean;
  profile: UserProfile;
  streak: number;
  _setHydrated: () => void;
  setSession: (user: AuthUser, token: string) => void;
  markOnboardingComplete: () => void;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  hydrateProfile: (patch: Partial<UserProfile>) => void;
  syncNow: () => Promise<number>;
  incrementStreak: () => void;
  setStreak: (streak: number) => void;
  isTokenValid: () => boolean;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      _hydrated: false,
      user: null,
      accessToken: null,
      onboardingComplete: false,
      profile: defaultProfile,
      streak: 0,

      _setHydrated: () => set({ _hydrated: true }),

      setSession: (user, token) => set({ user, accessToken: token }),

      markOnboardingComplete: () => set({ onboardingComplete: true }),

      isTokenValid: () => Boolean(get().accessToken),

      updateProfile: async (patch) => {
        const next = { ...get().profile, ...patch };
        if (next.waterGoalMode === 'auto') {
          next.waterGoalMl = waterGoalForWeight(next.weightKg);
        }
        set({ profile: next });
        const { accessToken } = get();
        if (accessToken) {
          try {
            await postGoals(accessToken, next);
          } catch {
            // non-fatal — local state already updated
          }
        }
      },

      // Merge a server-sourced profile into local state WITHOUT POSTing it back
      // (used during hydration; updateProfile is for user edits that sync up).
      hydrateProfile: (patch) => set((state) => ({ profile: { ...state.profile, ...patch } })),

      syncNow: async () => 0,

      incrementStreak: () => set((state) => ({ streak: state.streak + 1 })),

      setStreak: (streak) => set({ streak }),

      logout: async () => {
        set({ user: null, accessToken: null, streak: 0 });
      }
    }),
    {
      name: 'synclife_user_profile',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?._setHydrated();
      }
    }
  )
);
