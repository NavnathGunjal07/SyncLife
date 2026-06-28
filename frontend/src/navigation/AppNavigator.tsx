import { Ionicons } from '@expo/vector-icons';
import { BottomTabNavigationOptions, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';

import { colors } from '../constants/theme';
import { hydrateAll } from '../services/bootstrap';
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
};

const Tab = createBottomTabNavigator<AppTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
      <HomeStack.Screen name="Water" component={WaterScreen} />
    </HomeStack.Navigator>
  );
}

const icons: Record<keyof AppTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Meals: 'restaurant',
  Workout: 'fitness',
  Finance: 'wallet',
  Profile: 'person'
};

export function AppNavigator() {
  // Pull persisted data back into the stores once the authed app mounts (covers
  // both fresh login and cold start). Best-effort — failures fall back to cache.
  useEffect(() => {
    void hydrateAll();
  }, []);

  return (
    <Tab.Navigator
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
      <Tab.Screen name="Workout" component={WorkoutScreen} />
      <Tab.Screen name="Finance" component={FinanceScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
