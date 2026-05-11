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
  const initialRouteName = !onboardingComplete ? 'Onboarding' : user ? 'SheetSetup' : 'SignIn';

  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SheetSetup" component={SheetSetupScreen} />
    </Stack.Navigator>
  );
}
