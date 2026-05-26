import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { colors } from '../constants/theme';
import { SplashScreen } from '../screens/SplashScreen';
import { RootStackParamList } from '../types';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

type Props = {
  onReady?: () => void;
};

export function RootNavigator({ onReady }: Props) {
  return (
    <NavigationContainer
      onReady={onReady}
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
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="AppTabs" component={AppNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
