import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { colors } from '../constants/theme';
import { useAuthStore } from '../store/auth';

type AuthStackParamList = {
  Onboarding: undefined;
  SignIn: undefined;
  SheetSetup: undefined;
};
type NavProp = NativeStackNavigationProp<AuthStackParamList>;

const slides = [
  {
    title: 'Track the day',
    body: 'Calories, Indian meals, water, workouts, expenses, and gold holdings live together.'
  },
  {
    title: 'Own the data',
    body: 'SyncLife writes to Google Sheets in your Drive, with offline queueing when the network drops.'
  },
  {
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
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        {slides.map((slide) => (
          <View key={slide.title} style={[styles.slide, { width }]}>
            <View style={styles.orb}>
              <Text style={styles.orbText}>{slide.title.slice(0, 1)}</Text>
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <AppButton
          label="Get started"
          icon="arrow-forward"
          onPress={() => {
            markOnboardingComplete();
            navigation.navigate('SignIn');
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 36,
    borderWidth: 1,
    height: 96,
    justifyContent: 'center',
    marginBottom: 28,
    width: 96
  },
  orbText: {
    color: colors.accent,
    fontSize: 38,
    fontWeight: '900'
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
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
    padding: 24
  }
});
