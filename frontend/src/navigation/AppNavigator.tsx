import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarButtonProps, BottomTabNavigationOptions, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ProgressNotifier } from '../components/ProgressNotifier';
import { colors } from '../constants/theme';
import { hydrateAll } from '../services/bootstrap';
import { AssistantScreen } from '../screens/AssistantScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { FinanceScreen } from '../screens/FinanceScreen';
import { MealsScreen } from '../screens/MealsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { WaterScreen } from '../screens/WaterScreen';
import { WorkoutScreen } from '../screens/WorkoutScreen';
import { AppTabParamList } from '../types';

type HomeStackParamList = {
  Dashboard: undefined;
  Water: undefined;
  Finance: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
      <HomeStack.Screen name="Water" component={WaterScreen} />
      {/* Finance moved off the tab bar — reached from the Dashboard cards. */}
      <HomeStack.Screen name="Finance" component={FinanceScreen} />
    </HomeStack.Navigator>
  );
}

const icons: Record<keyof AppTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Meals: 'restaurant',
  Assistant: 'sparkles',
  Workout: 'fitness',
  Profile: 'person'
};

// Raised, highlighted center button for the Assistant tab.
function AssistantTabButton({ children, onPress, accessibilityState }: BottomTabBarButtonProps) {
  const focused = accessibilityState?.selected;
  return (
    <View style={tabStyles.centerWrap}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={[tabStyles.centerButton, focused && tabStyles.centerButtonActive]}
      >
        {children}
      </Pressable>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  root: { flex: 1 },
  centerWrap: { alignItems: 'center', justifyContent: 'center', width: 64 },
  centerButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderColor: colors.background,
    borderRadius: 30,
    borderWidth: 4,
    height: 60,
    justifyContent: 'center',
    marginBottom: 18,
    width: 60
  },
  centerButtonActive: { backgroundColor: colors.accentMuted }
});

export function AppNavigator() {
  // Pull persisted data back into the stores once the authed app mounts (covers
  // both fresh login and cold start). Best-effort — failures fall back to cache.
  useEffect(() => {
    void hydrateAll();
  }, []);

  return (
    <View style={tabStyles.root}>
      <Tab.Navigator
        initialRouteName="Assistant"
        screenOptions={({ route }: { route: { name: keyof AppTabParamList } }): BottomTabNavigationOptions => ({
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 64, paddingBottom: 8 },
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name={icons[route.name]} size={size} color={color} />
        })}
      >
        <Tab.Screen name="Home" component={HomeNavigator} />
        <Tab.Screen name="Meals" component={MealsScreen} />
        <Tab.Screen
          name="Assistant"
          component={AssistantScreen}
          options={{
            tabBarLabel: () => null,
            tabBarButton: (props: BottomTabBarButtonProps) => <AssistantTabButton {...props} />,
            tabBarIcon: () => <Ionicons name="sparkles" size={26} color={colors.background} />
          }}
        />
        <Tab.Screen name="Workout" component={WorkoutScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
      {/* Headless: keeps the ongoing progress + motivation phone notification live. */}
      <ProgressNotifier />
    </View>
  );
}
