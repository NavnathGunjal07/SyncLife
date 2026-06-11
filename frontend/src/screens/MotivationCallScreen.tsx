import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, Vibration, View } from 'react-native';

import { COACH_NAME } from '../constants/motivation';
import { colors } from '../constants/theme';
import { getMotivationMessage, speakMessage, stopSpeaking } from '../services/motivation';
import { useAuthStore } from '../store/auth';
import { useWorkoutStore } from '../store/workout';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'MotivationCall'>;

type CallState = 'ringing' | 'connecting' | 'active';

export function MotivationCallScreen({ navigation, route }: Props) {
  const alarmType = route.params?.alarmType ?? 'gym';
  const [callState, setCallState] = useState<CallState>('ringing');
  const [message, setMessage] = useState('');
  const [source, setSource] = useState<'ai' | 'local'>('local');
  const [speaking, setSpeaking] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;

  // Ring: vibrate + pulse the avatar until answered or declined
  useEffect(() => {
    if (callState !== 'ringing') return;
    Vibration.vibrate([800, 1200], true);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    );
    loop.start();
    return () => {
      Vibration.cancel();
      loop.stop();
    };
  }, [callState, pulse]);

  useEffect(() => () => stopSpeaking(), []);

  const endCall = () => {
    Vibration.cancel();
    stopSpeaking();
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('AppTabs');
    }
  };

  const answer = async () => {
    Vibration.cancel();
    setCallState('connecting');
    const { user, accessToken, streak } = useAuthStore.getState();
    const workoutDoneToday = useWorkoutStore.getState().completedToday();
    const result = await getMotivationMessage(alarmType, accessToken, {
      name: user?.name,
      streakDays: streak,
      workoutDoneToday
    });
    setMessage(result.message);
    setSource(result.source);
    setCallState('active');
    setSpeaking(true);
    speakMessage(result.message, () => setSpeaking(false));
  };

  const subtitle = alarmType === 'gym' ? 'Workout motivation call' : 'Work focus call';

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.callLabel}>{callState === 'ringing' ? 'Incoming call' : 'On call'}</Text>
        <Animated.View style={[styles.avatar, { transform: [{ scale: callState === 'ringing' ? pulse : 1 }] }]}>
          <Ionicons name={alarmType === 'gym' ? 'fitness' : 'briefcase'} size={56} color={colors.background} />
        </Animated.View>
        <Text style={styles.coachName}>{COACH_NAME}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {callState === 'connecting' && (
        <View style={[styles.body, styles.centered]}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.connecting}>Connecting to your coach…</Text>
        </View>
      )}

      {callState === 'active' && (
        <ScrollView style={styles.body} contentContainerStyle={styles.messageContainer}>
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.source}>
            {speaking ? '🔊 Coach is speaking…' : source === 'ai' ? 'Personalized by AI' : 'From your coach playbook'}
          </Text>
        </ScrollView>
      )}

      {callState === 'ringing' ? (
        <View style={styles.actions}>
          <CallButton icon="call" color={colors.danger} label="Decline" rotated onPress={endCall} />
          <CallButton icon="call" color={colors.accent} label="Answer" onPress={() => void answer()} />
        </View>
      ) : (
        <View style={styles.actions}>
          {callState === 'active' && !speaking && (
            <CallButton
              icon="refresh"
              color={colors.surfaceAlt}
              iconColor={colors.text}
              label="Repeat"
              onPress={() => {
                setSpeaking(true);
                speakMessage(message, () => setSpeaking(false));
              }}
            />
          )}
          <CallButton icon="call" color={colors.danger} label="End call" rotated onPress={endCall} />
        </View>
      )}
    </View>
  );
}

function CallButton({
  icon,
  color,
  label,
  onPress,
  rotated,
  iconColor
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  onPress: () => void;
  rotated?: boolean;
  iconColor?: string;
}) {
  return (
    <View style={styles.callButtonWrap}>
      <Pressable style={[styles.callButton, { backgroundColor: color }]} onPress={onPress}>
        <Ionicons name={icon} size={30} color={iconColor ?? colors.text} style={rotated ? styles.rotated : undefined} />
      </Pressable>
      <Text style={styles.callButtonLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background, flex: 1, paddingBottom: 48, paddingTop: 80 },
  header: { alignItems: 'center', gap: 12 },
  callLabel: { color: colors.textMuted, fontSize: 14, letterSpacing: 2, textTransform: 'uppercase' },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 60,
    height: 120,
    justifyContent: 'center',
    marginVertical: 12,
    width: 120
  },
  coachName: { color: colors.text, fontSize: 26, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 15 },
  body: { flex: 1, marginTop: 24 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  connecting: { color: colors.textMuted, fontSize: 15, marginTop: 16, textAlign: 'center' },
  messageContainer: { gap: 16, paddingHorizontal: 24, paddingVertical: 16 },
  message: { color: colors.text, fontSize: 19, fontWeight: '600', lineHeight: 30, textAlign: 'center' },
  source: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 24 },
  callButtonWrap: { alignItems: 'center', gap: 8 },
  callButton: { alignItems: 'center', borderRadius: 36, height: 72, justifyContent: 'center', width: 72 },
  callButtonLabel: { color: colors.textMuted, fontSize: 13 },
  rotated: { transform: [{ rotate: '135deg' }] }
});
