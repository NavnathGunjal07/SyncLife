import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { rescheduleMotivationCalls } from '../services/notifications';
import { MotivationAlarm, MotivationType } from '../types';
import { makeId } from '../utils/date';

const defaultAlarms: MotivationAlarm[] = [
  { id: 'default-gym', type: 'gym', hour: 18, minute: 0, enabled: false },
  { id: 'default-work', type: 'work', hour: 9, minute: 0, enabled: false }
];

type MotivationState = {
  alarms: MotivationAlarm[];
  /** True when the user denied notification permission on the last schedule attempt */
  permissionDenied: boolean;
  addAlarm: (type: MotivationType, hour: number, minute: number) => Promise<void>;
  toggleAlarm: (id: string) => Promise<void>;
  removeAlarm: (id: string) => Promise<void>;
  updateAlarmTime: (id: string, hour: number, minute: number) => Promise<void>;
};

export const useMotivationStore = create<MotivationState>()(
  persist(
    (set, get) => {
      const apply = async (alarms: MotivationAlarm[]) => {
        set({ alarms });
        const granted = await rescheduleMotivationCalls(alarms);
        set({ permissionDenied: !granted });
      };

      return {
        alarms: defaultAlarms,
        permissionDenied: false,

        addAlarm: (type, hour, minute) => apply([...get().alarms, { id: makeId('alarm'), type, hour, minute, enabled: true }]),

        toggleAlarm: (id) => apply(get().alarms.map((alarm) => (alarm.id === id ? { ...alarm, enabled: !alarm.enabled } : alarm))),

        removeAlarm: (id) => apply(get().alarms.filter((alarm) => alarm.id !== id)),

        updateAlarmTime: (id, hour, minute) => apply(get().alarms.map((alarm) => (alarm.id === id ? { ...alarm, hour, minute } : alarm)))
      };
    },
    {
      name: 'synclife_motivation_alarms',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ alarms: state.alarms })
    }
  )
);
