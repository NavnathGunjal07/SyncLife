import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { CALL_BODY, COACH_NAME } from '../constants/motivation';
import { MotivationAlarm } from '../types';

const DAILY_IDS_KEY = 'synclife_daily_notification_ids';
const MOTIVATION_IDS_KEY = 'synclife_motivation_notification_ids';

/** High-importance Android channel so coach calls ring + show as a heads-up. */
const CALL_CHANNEL_ID = 'motivation-calls';
/** Default channel for the silent daily tracking reminders. */
const REMINDER_CHANNEL_ID = 'daily-reminders';

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Motivation calls ring like a real incoming call; other reminders stay silent
    const isCall = notification.request.content.data?.kind === 'motivation-call';
    return {
      shouldPlaySound: isCall,
      shouldSetBadge: false,
      // SDK 54 replaced the deprecated `shouldShowAlert` with these two fields.
      shouldShowBanner: true,
      shouldShowList: true
    };
  }
});

/**
 * Creates the Android notification channels. No-op on iOS. Safe to call
 * repeatedly — channel creation is idempotent. Must run before scheduling,
 * otherwise notifications land on the low-importance default channel (no sound,
 * no heads-up).
 */
export async function ensureAndroidChannelsAsync() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CALL_CHANNEL_ID, {
    name: 'Coach calls',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 800, 400, 800],
    enableVibrate: true,
    bypassDnd: false,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
  });
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Daily reminders',
    importance: Notifications.AndroidImportance.DEFAULT
  });
}

const dailyReminders = [
  { hour: 8, minute: 0, body: 'Log your breakfast 🍽️' },
  { hour: 13, minute: 0, body: "Don't forget to log lunch!" },
  { hour: 18, minute: 0, body: 'Evening workout time 💪' },
  { hour: 21, minute: 0, body: "Update today's expenses before you sleep." },
  { hour: 22, minute: 0, body: "Complete today's tracking — don't break the streak!" }
];

export async function requestNotificationPermissions() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function cancelTrackedNotifications(storageKey: string) {
  const raw = await AsyncStorage.getItem(storageKey);
  if (!raw) return;
  const ids: string[] = JSON.parse(raw);
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)));
  await AsyncStorage.removeItem(storageKey);
}

export async function scheduleDailyNotifications() {
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  await ensureAndroidChannelsAsync();

  // Cancel only our own previously scheduled reminders so motivation call
  // alarms (tracked separately) survive a reschedule
  await cancelTrackedNotifications(DAILY_IDS_KEY);

  // DAILY trigger repeats every day at the given hour/minute. (The bare
  // `{ hour, minute, repeats }` shorthand is an iOS-only CALENDAR trigger and
  // throws on Android.)
  const ids = await Promise.all(
    dailyReminders.map((reminder) =>
      Notifications.scheduleNotificationAsync({
        content: { title: 'SyncLife', body: reminder.body },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: reminder.hour,
          minute: reminder.minute,
          channelId: REMINDER_CHANNEL_ID
        }
      })
    )
  );
  await AsyncStorage.setItem(DAILY_IDS_KEY, JSON.stringify(ids));
}

/**
 * (Re)schedules the AI coach "incoming call" alarms. Cancels any previously
 * scheduled calls first, then schedules one daily repeating notification per
 * enabled alarm. Returns false when notification permission was denied.
 */
export async function rescheduleMotivationCalls(alarms: MotivationAlarm[]) {
  await cancelTrackedNotifications(MOTIVATION_IDS_KEY);

  const enabled = alarms.filter((alarm) => alarm.enabled);
  if (enabled.length === 0) return true;

  const granted = await requestNotificationPermissions();
  if (!granted) return false;

  await ensureAndroidChannelsAsync();

  // DAILY trigger so the coach calls every day at the chosen time. (The bare
  // `{ hour, minute, repeats }` shorthand is an iOS-only CALENDAR trigger and
  // throws on Android — which is why no calls were ever firing.)
  const ids = await Promise.all(
    enabled.map((alarm) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: `📞 Incoming call: ${COACH_NAME}`,
          body: CALL_BODY[alarm.type],
          sound: 'default',
          data: { kind: 'motivation-call', alarmId: alarm.id, alarmType: alarm.type }
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: alarm.hour,
          minute: alarm.minute,
          channelId: CALL_CHANNEL_ID
        }
      })
    )
  );
  await AsyncStorage.setItem(MOTIVATION_IDS_KEY, JSON.stringify(ids));
  return true;
}

export async function scheduleWaterReminderNotifications(intakeMl: number, goalMl: number) {
  const granted = await requestNotificationPermissions();
  if (!granted || goalMl <= 0 || intakeMl >= goalMl * 0.5) return;

  const now = new Date();
  const notifications: ReturnType<typeof Notifications.scheduleNotificationAsync>[] = [];

  for (let hour = 9; hour <= 20; hour += 2) {
    const triggerDate = new Date();
    triggerDate.setHours(hour, 0, 0, 0);
    if (triggerDate > now) {
      notifications.push(
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Water check',
            body: 'Hydrate now and keep your daily goal moving.'
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
            channelId: REMINDER_CHANNEL_ID
          }
        })
      );
    }
  }

  await Promise.all(notifications);
}
