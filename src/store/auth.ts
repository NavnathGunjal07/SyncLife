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
  user: AuthUser | null;
  accessToken: string | null;
  onboardingComplete: boolean;
  spreadsheetReady: boolean;
  profile: UserProfile;
  setGoogleSession: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (accessToken: string | null) => void;
  markOnboardingComplete: () => void;
  markSpreadsheetReady: () => void;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  syncNow: () => Promise<number>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      onboardingComplete: false,
      spreadsheetReady: false,
      profile: defaultProfile,
      setGoogleSession: (user, accessToken) => set({ user, accessToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      markOnboardingComplete: () => set({ onboardingComplete: true }),
      markSpreadsheetReady: () => set({ spreadsheetReady: true }),
      updateProfile: async (patch) => {
        const next = { ...get().profile, ...patch };
        if (next.waterGoalMode === 'auto') {
          next.waterGoalMl = waterGoalForWeight(next.weightKg);
        }
        set({ profile: next });
        const token = get().accessToken;
        if (token) {
          await writeGoals(token, next);
        }
      },
      syncNow: async () => {
        const token = get().accessToken;
        if (!token) {
          return 0;
        }
        return flushQueue(token);
      },
      logout: async () => {
        await signOut(firebaseAuth);
        set({ user: null, accessToken: null, spreadsheetReady: false });
      }
    }),
    {
      name: 'synclife_user_profile',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);
