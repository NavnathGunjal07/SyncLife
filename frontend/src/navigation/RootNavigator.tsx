import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

import { colors } from '../constants/theme';
import { MotivationCallScreen } from '../screens/MotivationCallScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { useAuthStore } from '../store/auth';
import { MotivationType, RootStackParamList } from '../types';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';
import { navigationRef } from './navigationRef';

const Stack = createNativeStackNavigator<RootStackParamList>();

type Props = {
  onReady?: () => void;
};

export function RootNavigator({ onReady }: Props) {
  // Auth state drives which stack is mounted. When the store changes
  // (login / register / logout), the correct stack renders automatically —
  // no imperative navigation required.
  const hydrated = useAuthStore((state) => state._hydrated);
  const user = useAuthStore((state) => state.user);
  const onboardingComplete = useAuthStore((state) => state.onboardingComplete);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthed = Boolean(user && onboardingComplete && accessToken);

  // Call requested before the navigator was ready (cold start from a notification tap)
  const pendingCall = useRef<{ alarmType: MotivationType; notificationId?: string } | null>(null);

  const openCall = (alarmType: MotivationType, notificationId?: string) => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('MotivationCall', { alarmType, notificationId });
    } else {
      pendingCall.current = { alarmType, notificationId };
    }
  };

  useEffect(() => {
    const alarmTypeFromNotification = (notification: Notifications.Notification): MotivationType | null => {
      const data = notification.request.content.data;
      if (data?.kind !== 'motivation-call') return null;
      return (data.alarmType as MotivationType) ?? 'gym';
    };

    const handleResponse = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const alarmType = alarmTypeFromNotification(response.notification);
      if (alarmType) {
        openCall(alarmType, response.notification.request.identifier);
      }
    };

    // App launched by tapping the notification. SplashScreen resets the stack
    // ~1.5s after hydration, so wait until that reset has happened before
    // pushing the call screen — otherwise the reset would wipe it.
    const coldStartTimer = setTimeout(() => {
      void Notifications.getLastNotificationResponseAsync().then(handleResponse);
    }, 2600);
    // App already running when the notification is tapped
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    // App already open: interrupt the current screen with the incoming-call UI
    // as soon as the alarm notification is delivered.
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      const alarmType = alarmTypeFromNotification(notification);
      if (alarmType) {
        openCall(alarmType, notification.request.identifier);
      }
    });
    return () => {
      clearTimeout(coldStartTimer);
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        onReady?.();
        if (pendingCall.current) {
          navigationRef.navigate('MotivationCall', pendingCall.current);
          pendingCall.current = null;
        }
      }}
      theme={{
        dark: true,
        colors: {
          primary: colors.accent,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.accent
        }
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hydrated ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : isAuthed ? (
          <Stack.Group>
            <Stack.Screen name="AppTabs" component={AppNavigator} />
            <Stack.Screen name="MotivationCall" component={MotivationCallScreen} options={{ animation: 'fade', gestureEnabled: false }} />
          </Stack.Group>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
