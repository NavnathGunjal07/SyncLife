import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_LANGUAGE, DEFAULT_RINGTONE } from '../constants/motivation';
import { putAlarms } from '../services/api';
import { rescheduleMotivationCalls } from '../services/notifications';
import { CoachLanguage, MotivationAlarm, MotivationType, Ringtone } from '../types';
import { makeId } from '../utils/date';
import { useAuthStore } from './auth';

// Fire-and-forget push of the full alarm set to the backend. Non-fatal: local
// state + OS notifications are the source of truth; the DB is a synced backup.
function syncAlarmsToServer(alarms: MotivationAlarm[]) {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    void putAlarms(token, alarms).catch(() => undefined);
  }
}

const defaultAlarms: MotivationAlarm[] = [
  { id: 'default-gym', type: 'gym', hour: 18, minute: 0, enabled: false },
  { id: 'default-work', type: 'work', hour: 9, minute: 0, enabled: false }
];

type MotivationState = {
  alarms: MotivationAlarm[];
  /** Ringtone played for incoming coach calls (notification + in-app ring). */
  ringtone: Ringtone;
  /** Language the AI coach speaks (and listens) in on calls. */
  language: CoachLanguage;
  /** True when the user denied notification permission on the last schedule attempt */
  permissionDenied: boolean;
  addAlarm: (type: MotivationType, hour: number, minute: number) => Promise<void>;
  toggleAlarm: (id: string) => Promise<void>;
  removeAlarm: (id: string) => Promise<void>;
  updateAlarmTime: (id: string, hour: number, minute: number) => Promise<void>;
  /** Changes the coach-call ringtone and re-registers the alarms on its channel. */
  setRingtone: (ringtone: Ringtone) => Promise<void>;
  /** Changes the coach's language and re-registers alarms so notifications match. */
  setLanguage: (language: CoachLanguage) => Promise<void>;
  /** Re-registers OS notifications from the persisted alarms (run on app launch). */
  syncSchedule: () => Promise<void>;
  /** Replaces alarms from the server copy (run during hydration) without pushing back. */
  hydrateFromServer: (alarms: MotivationAlarm[]) => Promise<void>;
};

export const useMotivationStore = create<MotivationState>()(
  persist(
    (set, get) => {
      // reschedule-only: update local state + OS notifications (no server push).
      const reschedule = async (alarms: MotivationAlarm[]) => {
        set({ alarms });
        try {
          const granted = await rescheduleMotivationCalls(alarms, get().ringtone, get().language);
          set({ permissionDenied: !granted });
        } catch (error) {
          console.error('[SyncLife] Failed to schedule motivation calls:', error);
        }
      };

      // apply: user-initiated change — reschedule AND persist to the backend.
      const apply = async (alarms: MotivationAlarm[]) => {
        await reschedule(alarms);
        syncAlarmsToServer(alarms);
      };

      return {
        alarms: defaultAlarms,
        ringtone: DEFAULT_RINGTONE,
        language: DEFAULT_LANGUAGE,
        permissionDenied: false,

        addAlarm: (type, hour, minute) => apply([...get().alarms, { id: makeId('alarm'), type, hour, minute, enabled: true }]),

        toggleAlarm: (id) => apply(get().alarms.map((alarm) => (alarm.id === id ? { ...alarm, enabled: !alarm.enabled } : alarm))),

        removeAlarm: (id) => apply(get().alarms.filter((alarm) => alarm.id !== id)),

        updateAlarmTime: (id, hour, minute) => apply(get().alarms.map((alarm) => (alarm.id === id ? { ...alarm, hour, minute } : alarm))),

        setRingtone: async (ringtone) => {
          set({ ringtone });
          // Re-register so existing alarms move to the new ringtone's channel.
          await reschedule(get().alarms);
        },

        setLanguage: async (language) => {
          set({ language });
          // Re-register so the incoming-call notification text matches.
          await reschedule(get().alarms);
        },

        // Launch-time reschedule only — does not push to the server.
        syncSchedule: () => reschedule(get().alarms),

        hydrateFromServer: (alarms) => reschedule(alarms)
      };
    },
    {
      name: 'synclife_motivation_alarms',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ alarms: state.alarms, ringtone: state.ringtone, language: state.language }),
      // After persisted alarms rehydrate on launch, re-register them with the OS.
      // This recovers alarms that were toggled on before the scheduling fix and
      // therefore never actually got scheduled.
      onRehydrateStorage: () => (state) => {
        void state?.syncSchedule();
      }
    }
  )
);
