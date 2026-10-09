import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import * as Notifications from 'expo-notifications';
import Toast from 'react-native-toast-message';

import { deleteAccount, postGoals, setUnauthorizedHandler } from '../services/api';
import { clearProgressNotification } from '../services/notifications';
import { AuthUser, UserProfile } from '../types';
import { waterGoalForWeight } from '../utils/calculators';

/** Reads the `exp` claim (seconds) from a JWT without verifying it — the server does that. */
function tokenExpiresAt(token: string): number | null {
  try {
    const payload = token.split('.')[1] ?? '';
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '='));
    const { exp } = JSON.parse(json) as { exp?: number };
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const expiresAt = tokenExpiresAt(token);
  return expiresAt !== null && expiresAt <= Date.now();
}

const defaultProfile: UserProfile = {
  weightKg: 70,
  heightCm: 170,
  fitnessGoal: 'Maintain',
  calorieTarget: 2200,
  waterGoalMl: waterGoalForWeight(70),
  waterGoalMode: 'auto',
  monthlyBudget: 30000,
  dietaryPreference: 'veg',
  avoidFoods: '',
  workoutMode: 'Home',
  workoutLevel: 'Beginner'
};

type AuthState = {
  _hydrated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  onboardingComplete: boolean;
  profile: UserProfile;
  streak: number;
  /** LEGAL_VERSION of the Terms/Privacy Policy this user accepted (null = never). */
  acceptedLegalVersion: string | null;
  /** Saw the permissions disclosure screen (allowed or skipped each one). */
  permissionsReviewed: boolean;
  _setHydrated: () => void;
  setSession: (user: AuthUser, token: string) => void;
  markOnboardingComplete: () => void;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  hydrateProfile: (patch: Partial<UserProfile>) => void;
  syncNow: () => Promise<number>;
  incrementStreak: () => void;
  setStreak: (streak: number) => void;
  isTokenValid: () => boolean;
  acceptLegal: (version: string) => void;
  markPermissionsReviewed: () => void;
  logout: () => Promise<void>;
  /** Deletes the account server-side, then wipes everything stored on the device. */
  deleteAccount: (password: string) => Promise<void>;
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
      acceptedLegalVersion: null,
      permissionsReviewed: false,

      _setHydrated: () => set({ _hydrated: true }),

      setSession: (user, token) => set({ user, accessToken: token }),

      markOnboardingComplete: () => set({ onboardingComplete: true }),

      isTokenValid: () => !isTokenExpired(get().accessToken),

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

      acceptLegal: (version) => set({ acceptedLegalVersion: version }),

      markPermissionsReviewed: () => set({ permissionsReviewed: true }),

      logout: async () => {
        // Acceptance is per person, so the next account on this device accepts for itself.
        set({ user: null, accessToken: null, streak: 0, acceptedLegalVersion: null });
        await clearProgressNotification();
      },

      deleteAccount: async (password) => {
        const { accessToken } = get();
        if (!accessToken) throw new Error('You are not signed in.');
        await deleteAccount(accessToken, password);
        await clearProgressNotification();
        await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
        await AsyncStorage.clear();
        set({
          user: null,
          accessToken: null,
          onboardingComplete: false,
          profile: defaultProfile,
          streak: 0,
          acceptedLegalVersion: null,
          permissionsReviewed: false
        });
      }
    }),
    {
      name: 'synclife_user_profile',
      storage: createJSONStorage(() => AsyncStorage),
      // Deep-merge the persisted profile onto defaults so profiles saved before
      // newer fields existed (e.g. dietaryPreference) still have every key.
      merge: (persisted, current) => {
        const prev = (persisted ?? {}) as Partial<AuthState>;
        return {
          ...current,
          ...prev,
          profile: { ...current.profile, ...(prev.profile ?? {}) }
        };
      },
      onRehydrateStorage: () => (state) => {
        // A token that expired while the app was closed goes straight to sign-in
        // instead of mounting the app and failing every request.
        if (state?.accessToken && isTokenExpired(state.accessToken)) {
          void state.logout();
        }
        state?._setHydrated();
      }
    }
  )
);

// Any authenticated request that comes back 401 (expired/revoked token, deleted
// account) signs the user out once; RootNavigator then swaps to the Auth stack.
let signingOut = false;
setUnauthorizedHandler(() => {
  const { accessToken, logout } = useAuthStore.getState();
  if (!accessToken || signingOut) return;
  signingOut = true;
  Toast.show({ type: 'info', text1: 'Session expired', text2: 'Please sign in again.' });
  void logout().finally(() => {
    signingOut = false;
  });
});
