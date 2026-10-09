import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarButtonProps, BottomTabNavigationOptions, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import { Animated, AppState, Easing, Pressable, StyleSheet, View } from 'react-native';

import { GradientFill } from '../components/GradientFill';
import { ProgressNotifier } from '../components/ProgressNotifier';
import { colors, gradients } from '../constants/theme';
import { registerBackgroundRefresh } from '../services/background';
import { hydrateAll } from '../services/bootstrap';
import { useStepsStore } from '../store/steps';
import { AssistantScreen } from '../screens/AssistantScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { FinanceScreen } from '../screens/FinanceScreen';
import { HabitTrackerScreen } from '../screens/HabitTrackerScreen';
import { MealsScreen } from '../screens/MealsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { WaterScreen } from '../screens/WaterScreen';
import { WorkoutScreen } from '../screens/WorkoutScreen';
import { AppTabParamList } from '../types';

type HomeStackParamList = {
  Dashboard: undefined;
  Water: undefined;
  Finance: undefined;
  Habits: undefined;
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
      <HomeStack.Screen name="Habits" component={HabitTrackerScreen} />
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

// Tab icon that pops when it becomes active, with a small glowing dot underneath.
function TabIcon({ name, color, focused }: { name: keyof typeof Ionicons.glyphMap; color: string; focused: boolean }) {
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: focused ? 1 : 0, speed: 18, bounciness: 14, useNativeDriver: true }).start();
  }, [anim, focused]);
  return (
    <View style={tabStyles.iconWrap}>
      <Animated.View
        style={{
          transform: [
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) },
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }
          ]
        }}
      >
        <Ionicons name={focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)} size={23} color={color} />
      </Animated.View>
      <Animated.View style={[tabStyles.dot, { opacity: anim, transform: [{ scale: anim }] }]} />
    </View>
  );
}

// Raised gradient center button for the Assistant tab, with a slow "breathing" glow.
function AssistantTabButton({ children, onPress, accessibilityState }: BottomTabBarButtonProps) {
  const focused = accessibilityState?.selected;
  const pulse = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const springTo = (toValue: number) =>
    Animated.spring(press, { toValue, speed: 40, bounciness: toValue === 1 ? 14 : 0, useNativeDriver: true }).start();

  return (
    <View style={tabStyles.centerWrap}>
      <Animated.View
        pointerEvents="none"
        style={[
          tabStyles.centerGlow,
          {
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [focused ? 0.55 : 0.35, 0] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }) }]
          }
        ]}
      />
      <Pressable accessibilityRole="button" onPress={onPress} onPressIn={() => springTo(0.9)} onPressOut={() => springTo(1)}>
        <Animated.View style={[tabStyles.centerButton, { transform: [{ scale: press }] }]}>
          <GradientFill colors={gradients.brand} radius={30} />
          {children}
        </Animated.View>
      </Pressable>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  root: { flex: 1 },
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  dot: { backgroundColor: colors.accent, borderRadius: 3, height: 5, marginTop: 4, width: 5 },
  centerWrap: { alignItems: 'center', justifyContent: 'center', width: 70 },
  centerGlow: {
    backgroundColor: colors.accent,
    borderRadius: 32,
    height: 60,
    marginBottom: 22,
    position: 'absolute',
    width: 60
  },
  centerButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 30,
    elevation: 8,
    height: 60,
    justifyContent: 'center',
    marginBottom: 22,
    overflow: 'hidden',
    shadowColor: colors.accent,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    width: 60
  }
});

export function AppNavigator() {
  // Pull persisted data back into the stores once the authed app mounts (covers
  // both fresh login and cold start). Best-effort — failures fall back to cache.
  useEffect(() => {
    void hydrateAll();
    void useStepsStore.getState().init();
    void registerBackgroundRefresh();
    // On resume, catch steps up and re-arm tracking if the process was suspended.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void useStepsStore.getState().init();
    });
    return () => sub.remove();
  }, []);

  return (
    <View style={tabStyles.root}>
      <Tab.Navigator
        initialRouteName="Assistant"
        screenOptions={({ route }: { route: { name: keyof AppTabParamList } }): BottomTabNavigationOptions => ({
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            height: 70,
            paddingBottom: 10,
            paddingTop: 6
          },
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <TabIcon name={icons[route.name]} color={color} focused={focused} />
          )
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
            tabBarIcon: () => <Ionicons name="sparkles" size={26} color={colors.onAccent} />
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
