import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { CALL_BODY, COACH_NAME, DEFAULT_RINGTONE, RINGTONES, ringtoneFile } from '../constants/motivation';
import { getRandomQuote } from '../constants/quotes';
import { MotivationAlarm, Ringtone } from '../types';

const DAILY_IDS_KEY = 'synclife_daily_notification_ids';
const MOTIVATION_IDS_KEY = 'synclife_motivation_notification_ids';

// An Android notification channel's sound is immutable after creation, so we
// keep one high-importance channel PER ringtone and schedule calls on the
// channel that matches the user's choice. Bump the version to force-recreate
// channels if their config ever changes.
const CALL_CHANNEL_VERSION = 'v3';
const callChannelId = (ringtone: Ringtone) => `motivation-call-${ringtone}-${CALL_CHANNEL_VERSION}`;
/** Default channel for the silent daily tracking reminders. */
const REMINDER_CHANNEL_ID = 'daily-reminders';
const CALL_VIBRATION_PATTERN = [0, 900, 450, 900, 450, 1200];

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Motivation calls ring like a real incoming call; other reminders stay silent
    const isCall = notification.request.content.data?.kind === 'motivation-call';
    return {
      shouldPlaySound: isCall,
      shouldSetBadge: false,
      // SDK 54 replaced the deprecated `shouldShowAlert` with these two fields.
      shouldShowBanner: true,
      shouldShowList: true,
      priority: isCall ? Notifications.AndroidNotificationPriority.MAX : Notifications.AndroidNotificationPriority.DEFAULT
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
  // One alarm channel per ringtone — each rings with its own bundled sound so
  // the coach call is audible even when the app is backgrounded or killed.
  await Promise.all(
    RINGTONES.map((r) =>
      Notifications.setNotificationChannelAsync(callChannelId(r.id), {
        name: `AI coach calls — ${r.label}`,
        importance: Notifications.AndroidImportance.MAX,
        sound: r.file,
        audioAttributes: {
          usage: Notifications.AndroidAudioUsage.ALARM,
          contentType: Notifications.AndroidAudioContentType.SONIFICATION
        },
        vibrationPattern: CALL_VIBRATION_PATTERN,
        enableVibrate: true,
        bypassDnd: false,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
      })
    )
  );
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
        content: { title: 'SyncLife', body: `${reminder.body}\n\n💡 ${getRandomQuote().text}` },
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
export async function rescheduleMotivationCalls(alarms: MotivationAlarm[], ringtone: Ringtone = DEFAULT_RINGTONE) {
  await cancelTrackedNotifications(MOTIVATION_IDS_KEY);

  const enabled = alarms.filter((alarm) => alarm.enabled);
  if (enabled.length === 0) return true;

  const granted = await requestNotificationPermissions();
  if (!granted) return false;

  await ensureAndroidChannelsAsync();

  const channelId = callChannelId(ringtone);
  const soundFile = ringtoneFile(ringtone);

  // DAILY trigger so the coach calls every day at the chosen time. (The bare
  // `{ hour, minute, repeats }` shorthand is an iOS-only CALENDAR trigger and
  // throws on Android — which is why no calls were ever firing.)
  const ids = await Promise.all(
    enabled.map((alarm) => {
      const quote = getRandomQuote();
      return Notifications.scheduleNotificationAsync({
        content: {
          title: `📞 Incoming call: ${COACH_NAME}`,
          body: `${CALL_BODY[alarm.type]}\n\n"${quote.text}" — ${quote.author}`,
          sound: soundFile,
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: CALL_VIBRATION_PATTERN,
          autoDismiss: false,
          sticky: true,
          color: '#1FD67E',
          data: { kind: 'motivation-call', alarmId: alarm.id, alarmType: alarm.type }
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: alarm.hour,
          minute: alarm.minute,
          channelId
        }
      });
    })
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
