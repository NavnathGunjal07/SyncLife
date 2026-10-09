import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { BrandLogo } from '../components/BrandLogo';
import { GradientFill } from '../components/GradientFill';
import { colors, gradients } from '../constants/theme';
import { useAuthStore } from '../store/auth';

type AuthStackParamList = {
  Onboarding: undefined;
  SignIn: undefined;
  Register: undefined;
};
type NavProp = NativeStackNavigationProp<AuthStackParamList>;

const slides = [
  {
    icon: 'restaurant' as const,
    gradient: gradients.brand,
    title: 'Track the day',
    body: 'Calories, Indian meals, water, workouts, expenses, and gold holdings live together.'
  },
  {
    icon: 'cloud-done' as const,
    gradient: gradients.ocean,
    title: 'Own the data',
    body: 'Your data syncs to your private SyncLife account. No ads, never sold, and you can delete it anytime from Profile.'
  },
  {
    icon: 'flame' as const,
    gradient: gradients.ember,
    title: 'Close the loop',
    body: 'Daily summaries, reminders, streaks, and progress rings keep the day easy to read.'
  }
];

const { width } = Dimensions.get('window');

export function OnboardingScreen() {
  const navigation = useNavigation<NavProp>();
  const markOnboardingComplete = useAuthStore((state) => state.markOnboardingComplete);

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <BrandLogo size={36} />
        <Text style={styles.brandText}>SyncLife</Text>
      </View>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        {slides.map((slide) => (
          <View key={slide.title} style={[styles.slide, { width }]}>
            <FloatingOrb gradient={slide.gradient} icon={slide.icon} />
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        {/* New users go straight to sign-up; returning users skip it. */}
        <AppButton
          label="Create account"
          icon="arrow-forward"
          onPress={() => {
            markOnboardingComplete();
            navigation.navigate('Register');
          }}
        />
        <AppButton
          label="I already have an account"
          variant="ghost"
          onPress={() => {
            markOnboardingComplete();
            navigation.navigate('SignIn');
          }}
        />
      </View>
    </View>
  );
}

// Gently bobbing gradient orb so each slide feels alive.
function FloatingOrb({ gradient, icon }: { gradient: readonly [string, string]; icon: keyof typeof Ionicons.glyphMap }) {
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);
  return (
    <Animated.View
      style={[
        styles.orb,
        {
          transform: [
            { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
            { rotate: bob.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] }) }
          ]
        }
      ]}
    >
      <GradientFill colors={gradient} radius={40} />
      <Ionicons name={icon} size={52} color={colors.text} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingHorizontal: 24, paddingTop: 56 },
  brandText: { color: colors.text, fontSize: 20, fontWeight: '900' },
  container: {
    backgroundColor: colors.background,
    flex: 1
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28
  },
  orb: {
    alignItems: 'center',
    borderRadius: 40,
    height: 128,
    justifyContent: 'center',
    marginBottom: 36,
    overflow: 'hidden',
    width: 128
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center'
  },
  body: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
    textAlign: 'center'
  },
  footer: {
    gap: 8,
    padding: 24
  }
});
