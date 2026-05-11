import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowAlert: true
  })
});

const dailyReminders = [
  { hour: 8, minute: 0, body: 'Log your breakfast 🍽️' },
  { hour: 13, minute: 0, body: "Don't forget to log lunch!" },
  { hour: 18, minute: 0, body: 'Evening workout time 💪' },
  { hour: 21, minute: 0, body: "Update today's expenses before you sleep." },
  { hour: 22, minute: 0, body: "Complete today's tracking — don't break the streak!" }
];

export async function requestNotificationPermissions() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleDailyNotifications() {
  const granted = await requestNotificationPermissions();
  if (!granted) {
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  await Promise.all(
    dailyReminders.map((reminder) =>
      Notifications.scheduleNotificationAsync({
        content: { title: 'SyncLife', body: reminder.body },
        trigger: { hour: reminder.hour, minute: reminder.minute, repeats: true }
      })
    )
  );
}

export async function scheduleWaterReminderNotifications(intakeMl: number, goalMl: number) {
  const granted = await requestNotificationPermissions();
  if (!granted || goalMl <= 0 || intakeMl >= goalMl * 0.5) {
    return;
  }

  const now = new Date();
  const notifications = [];
  for (let hour = 9; hour <= 20; hour += 2) {
    const triggerDate = new Date();
    triggerDate.setHours(hour, 0, 0, 0);
    if (triggerDate > now) {
      notifications.push(
        Notifications.scheduleNotificationAsync({
          content: { title: 'Water check', body: 'Hydrate now and keep your daily goal moving.' },
          trigger: triggerDate
        })
      );
    }
  }
  await Promise.all(notifications);
}
