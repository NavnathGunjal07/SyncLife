import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { OnboardingScreen } from '../screens/OnboardingScreen';
import { SheetSetupScreen } from '../screens/SheetSetupScreen';
import { SignInScreen } from '../screens/SignInScreen';
import { useAuthStore } from '../store/auth';

type AuthStackParamList = {
  Onboarding: undefined;
  SignIn: undefined;
  SheetSetup: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const onboardingComplete = useAuthStore((state) => state.onboardingComplete);
  const user = useAuthStore((state) => state.user);
  const spreadsheetReady = useAuthStore((state) => state.spreadsheetReady);

  // Determine the correct entry point based on progress:
  // 1. Haven't seen onboarding yet → Onboarding
  // 2. Seen onboarding but not signed in → SignIn
  // 3. Signed in but Sheets not set up → SheetSetup
  // 4. Everything done → SplashScreen would have gone to AppTabs already
  let initialRouteName: keyof AuthStackParamList = 'Onboarding';
  if (onboardingComplete && user && !spreadsheetReady) {
    initialRouteName = 'SheetSetup';
  } else if (onboardingComplete && !user) {
    initialRouteName = 'SignIn';
  }

  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SheetSetup" component={SheetSetupScreen} />
    </Stack.Navigator>
  );
}
