import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View
} from 'react-native';

import { COACH_NAME, MOTIVATION_META } from '../constants/motivation';
import { getRandomQuote } from '../constants/quotes';
import { colors } from '../constants/theme';
import {
  CallTurn,
  getMotivationMessage,
  getMotivationReply,
  isVoiceInputAvailable,
  MotivationMessage,
  speakMessage,
  startListening,
  startRinging,
  stopListening,
  stopRinging,
  stopSpeaking
} from '../services/motivation';
import { useAuthStore } from '../store/auth';
import { useMotivationStore } from '../store/motivation';
import { useWorkoutStore } from '../store/workout';
import { MotivationType, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'MotivationCall'>;

type CallState = 'ringing' | 'connecting' | 'active';

export function MotivationCallScreen({ navigation, route }: Props) {
  const alarmType: MotivationType = route.params?.alarmType ?? 'gym';
  const notificationId = route.params?.notificationId;
  const meta = MOTIVATION_META[alarmType];
  const ringtone = useMotivationStore((state) => state.ringtone);
  const language = useMotivationStore((state) => state.language);
  const [callState, setCallState] = useState<CallState>('ringing');
  const [turns, setTurns] = useState<CallTurn[]>([]);
  const [source, setSource] = useState<'ai' | 'local'>('local');
  const [speaking, setSpeaking] = useState(false);
  const [replying, setReplying] = useState(false);
  const [draft, setDraft] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState('');
  const pulse = useRef(new Animated.Value(1)).current;
  const quote = useRef(getRandomQuote()).current;
  const scrollRef = useRef<ScrollView>(null);
  // Ref mirror of `turns` so async voice callbacks always send the latest history.
  const turnsRef = useRef<CallTurn[]>([]);
  const voiceSupported = useRef(isVoiceInputAvailable()).current;
  // The coach's opening line, prefetched while the phone is still ringing so
  // answering connects instantly instead of sitting on a loading screen.
  const openerPromise = useRef<Promise<MotivationMessage> | null>(null);
  const openerResult = useRef<MotivationMessage | null>(null);

  useEffect(() => {
    const { user, accessToken, streak } = useAuthStore.getState();
    const workoutDoneToday = useWorkoutStore.getState().completedToday();
    const promise = getMotivationMessage(alarmType, accessToken, {
      name: user?.name,
      streakDays: streak,
      workoutDoneToday,
      language
    });
    openerPromise.current = promise;
    void promise.then((result) => {
      openerResult.current = result;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    turnsRef.current = turns;
    // Keep the latest message in view as the conversation grows.
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [turns]);

  // Ring: play the looping ringtone + vibrate + pulse the avatar until answered.
  useEffect(() => {
    if (callState !== 'ringing') return;
    void startRinging(ringtone);
    Vibration.vibrate([800, 1200], true);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    );
    loop.start();
    return () => {
      stopRinging();
      Vibration.cancel();
      loop.stop();
    };
  }, [callState, pulse, ringtone]);

  useEffect(
    () => () => {
      stopRinging();
      stopSpeaking();
      stopListening();
    },
    []
  );

  const endCall = () => {
    Vibration.cancel();
    stopRinging();
    stopSpeaking();
    stopListening();
    if (notificationId) {
      void Notifications.dismissNotificationAsync(notificationId).catch(() => undefined);
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('AppTabs');
    }
  };

  const answer = async () => {
    Vibration.cancel();
    if (notificationId) {
      void Notifications.dismissNotificationAsync(notificationId).catch(() => undefined);
    }

    const begin = (result: MotivationMessage) => {
      setSource(result.source);
      setTurns([{ role: 'assistant', content: result.message }]);
      setCallState('active');
      setSpeaking(true);
      speakMessage(result.message, () => setSpeaking(false), language);
    };

    // Prefetched while ringing — connect immediately.
    if (openerResult.current) {
      begin(openerResult.current);
      return;
    }

    // Answered before the prefetch finished — wait on the same in-flight
    // request rather than starting a new one.
    setCallState('connecting');
    const { user, accessToken, streak } = useAuthStore.getState();
    const workoutDoneToday = useWorkoutStore.getState().completedToday();
    const result = await (openerPromise.current ??
      getMotivationMessage(alarmType, accessToken, {
        name: user?.name,
        streakDays: streak,
        workoutDoneToday,
        language
      }));
    begin(result);
  };

  const sendTurn = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || replying) return;
    stopSpeaking();
    setSpeaking(false);
    setDraft('');
    setVoiceNote('');

    const history: CallTurn[] = [...turnsRef.current, { role: 'user', content: trimmed }];
    setTurns(history);
    setReplying(true);

    const { user, accessToken, streak } = useAuthStore.getState();
    const workoutDoneToday = useWorkoutStore.getState().completedToday();
    const result = await getMotivationReply(alarmType, history, accessToken, {
      name: user?.name,
      streakDays: streak,
      workoutDoneToday,
      language
    });
    setSource(result.source);
    setTurns((prev) => [...prev, { role: 'assistant', content: result.message }]);
    setReplying(false);
    setSpeaking(true);
    speakMessage(result.message, () => setSpeaking(false), language);
  };

  const toggleMic = async () => {
    if (listening) {
      stopListening();
      return;
    }
    stopSpeaking();
    setSpeaking(false);
    setVoiceNote('Listening…');
    setListening(true);
    const ok = await startListening(
      {
        onPartial: (t) => setDraft(t),
        onResult: (t) => {
          setListening(false);
          setVoiceNote('');
          void sendTurn(t);
        },
        onEnd: () => setListening(false),
        onError: (message) => {
          setListening(false);
          setVoiceNote(message);
        }
      },
      language
    );
    if (!ok) setListening(false);
  };

  const statusLine = listening
    ? '🎙️ Listening…'
    : speaking
      ? '🔊 Coach is speaking…'
      : replying
        ? 'Coach is thinking…'
        : source === 'ai'
          ? 'Personalized by AI'
          : 'From your coach playbook';

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.callLabel}>{callState === 'ringing' ? 'Incoming call' : 'On call'}</Text>
        <Animated.View style={[styles.avatar, { transform: [{ scale: callState === 'ringing' ? pulse : 1 }] }]}>
          <Ionicons name={meta.icon} size={56} color={colors.background} />
        </Animated.View>
        <Text style={styles.coachName}>{COACH_NAME}</Text>
        <Text style={styles.subtitle}>{meta.subtitle}</Text>
      </View>

      {callState === 'connecting' && (
        <View style={[styles.body, styles.centered]}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.connecting}>Connecting to your coach…</Text>
        </View>
      )}

      {callState === 'active' && (
        <ScrollView ref={scrollRef} style={styles.body} contentContainerStyle={styles.thread}>
          {turns.map((turn, index) => (
            <View
              key={index}
              style={[styles.bubble, turn.role === 'assistant' ? styles.coachBubble : styles.userBubble]}
            >
              <Text style={turn.role === 'assistant' ? styles.coachText : styles.userText}>{turn.content}</Text>
            </View>
          ))}
          {replying && (
            <View style={[styles.bubble, styles.coachBubble, styles.typingBubble]}>
              <ActivityIndicator color={colors.accent} size="small" />
            </View>
          )}
          <Text style={styles.source}>{statusLine}</Text>
          {turns.length <= 1 && (
            <View style={styles.quoteBox}>
              <Text style={styles.quoteText}>“{quote.text}”</Text>
              <Text style={styles.quoteAuthor}>— {quote.author}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {callState === 'active' && (
        <View style={styles.composer}>
          {!!voiceNote && <Text style={styles.voiceNote}>{voiceNote}</Text>}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder={voiceSupported ? 'Reply or tap the mic…' : 'Reply to your coach…'}
              placeholderTextColor={colors.textMuted}
              multiline
              editable={!replying}
              onSubmitEditing={() => void sendTurn(draft)}
              returnKeyType="send"
              blurOnSubmit
            />
            {voiceSupported && (
              <Pressable
                style={[styles.iconButton, listening && styles.iconButtonActive]}
                onPress={() => void toggleMic()}
                hitSlop={8}
              >
                <Ionicons name={listening ? 'stop' : 'mic'} size={22} color={listening ? colors.background : colors.text} />
              </Pressable>
            )}
            <Pressable
              style={[styles.iconButton, styles.sendButton, (!draft.trim() || replying) && styles.iconButtonDisabled]}
              onPress={() => void sendTurn(draft)}
              disabled={!draft.trim() || replying}
              hitSlop={8}
            >
              <Ionicons name="send" size={20} color={colors.background} />
            </Pressable>
          </View>
        </View>
      )}

      {callState === 'ringing' ? (
        <View style={styles.actions}>
          <CallButton icon="call" color={colors.danger} label="Decline" rotated onPress={endCall} />
          <CallButton icon="call" color={colors.accent} label="Answer" onPress={() => void answer()} />
        </View>
      ) : (
        <View style={styles.actions}>
          {callState === 'active' && !speaking && turns.length > 0 && (
            <CallButton
              icon="volume-high"
              color={colors.surfaceAlt}
              iconColor={colors.text}
              label="Replay"
              onPress={() => {
                const last = [...turns].reverse().find((t) => t.role === 'assistant');
                if (!last) return;
                setSpeaking(true);
                speakMessage(last.content, () => setSpeaking(false), language);
              }}
            />
          )}
          <CallButton icon="call" color={colors.danger} label="End call" rotated onPress={endCall} />
        </View>
      )}
    </KeyboardAvoidingView>
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
  root: { backgroundColor: colors.background, flex: 1, paddingBottom: 32, paddingTop: 72 },
  header: { alignItems: 'center', gap: 10 },
  callLabel: { color: colors.textMuted, fontSize: 14, letterSpacing: 2, textTransform: 'uppercase' },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 56,
    height: 112,
    justifyContent: 'center',
    marginVertical: 10,
    width: 112
  },
  coachName: { color: colors.text, fontSize: 24, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 15 },
  body: { flex: 1, marginTop: 16 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  connecting: { color: colors.textMuted, fontSize: 15, marginTop: 16, textAlign: 'center' },
  thread: { gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  bubble: { borderRadius: 18, maxWidth: '88%', paddingHorizontal: 16, paddingVertical: 12 },
  coachBubble: { alignSelf: 'flex-start', backgroundColor: colors.surfaceAlt, borderBottomLeftRadius: 4 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  typingBubble: { paddingVertical: 14 },
  coachText: { color: colors.text, fontSize: 16, lineHeight: 24 },
  userText: { color: colors.background, fontSize: 16, fontWeight: '600', lineHeight: 24 },
  source: { color: colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' },
  quoteBox: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 6,
    marginTop: 8,
    paddingTop: 14
  },
  quoteText: { color: colors.accent, fontSize: 15, fontStyle: 'italic', lineHeight: 22, textAlign: 'center' },
  quoteAuthor: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  composer: { gap: 6, paddingHorizontal: 16, paddingTop: 6 },
  voiceNote: { color: colors.accent, fontSize: 12, paddingLeft: 6 },
  inputRow: { alignItems: 'flex-end', flexDirection: 'row', gap: 8 },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: 16,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  iconButtonActive: { backgroundColor: colors.danger },
  iconButtonDisabled: { opacity: 0.4 },
  sendButton: { backgroundColor: colors.accent },
  actions: { flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 18 },
  callButtonWrap: { alignItems: 'center', gap: 8 },
  callButton: { alignItems: 'center', borderRadius: 36, height: 72, justifyContent: 'center', width: 72 },
  callButtonLabel: { color: colors.textMuted, fontSize: 13 },
  rotated: { transform: [{ rotate: '135deg' }] }
});
