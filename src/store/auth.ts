import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { firebaseAuth } from '../services/firebase';
import { flushQueue, writeGoals } from '../services/googleSheets';
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
  /** True once zustand/persist has finished reading from AsyncStorage */
  _hydrated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  /** Unix timestamp (ms) when the access token expires — Google tokens live ~1h */
  tokenExpiresAt: number | null;
  onboardingComplete: boolean;
  spreadsheetReady: boolean;
  profile: UserProfile;
  streak: number;
  _setHydrated: () => void;
  setGoogleSession: (user: AuthUser, accessToken: string, expiresInSec?: number) => void;
  setAccessToken: (accessToken: string | null, expiresInSec?: number) => void;
  markOnboardingComplete: () => void;
  markSpreadsheetReady: () => void;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  syncNow: () => Promise<number>;
  incrementStreak: () => void;
  isTokenValid: () => boolean;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      _hydrated: false,
      user: null,
      accessToken: null,
      tokenExpiresAt: null,
      onboardingComplete: false,
      spreadsheetReady: false,
      profile: defaultProfile,
      streak: 0,

      _setHydrated: () => set({ _hydrated: true }),

      setGoogleSession: (user, accessToken, expiresInSec = 3600) =>
        set({
          user,
          accessToken,
          tokenExpiresAt: Date.now() + expiresInSec * 1000
        }),

      setAccessToken: (accessToken, expiresInSec = 3600) =>
        set({
          accessToken,
          tokenExpiresAt: accessToken ? Date.now() + expiresInSec * 1000 : null
        }),

      markOnboardingComplete: () => set({ onboardingComplete: true }),
      markSpreadsheetReady: () => set({ spreadsheetReady: true }),

      isTokenValid: () => {
        const { accessToken, tokenExpiresAt } = get();
        if (!accessToken) return false;
        if (!tokenExpiresAt) return true; // unknown expiry — assume valid
        // Consider expired 5 min early to avoid edge cases
        return Date.now() < tokenExpiresAt - 5 * 60 * 1000;
      },

      updateProfile: async (patch) => {
        const next = { ...get().profile, ...patch };
        if (next.waterGoalMode === 'auto') {
          next.waterGoalMl = waterGoalForWeight(next.weightKg);
        }
        set({ profile: next });
        const { accessToken, isTokenValid } = get();
        if (accessToken && isTokenValid()) {
          await writeGoals(accessToken, next);
        }
      },

      syncNow: async () => {
        const { accessToken, isTokenValid } = get();
        if (!accessToken || !isTokenValid()) {
          return 0;
        }
        return flushQueue(accessToken);
      },

      incrementStreak: () => set((state) => ({ streak: state.streak + 1 })),

      logout: async () => {
        await signOut(firebaseAuth);
        set({
          user: null,
          accessToken: null,
          tokenExpiresAt: null,
          spreadsheetReady: false,
          streak: 0
        });
      }
    }),
    {
      name: 'synclife_user_profile',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Mark hydration complete once AsyncStorage has been read
        state?._setHydrated();
      }
    }
  )
);
