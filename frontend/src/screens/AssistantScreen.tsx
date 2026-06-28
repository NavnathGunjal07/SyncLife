import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/core';
import { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { ChatCardView } from '../components/chat/ChatCardView';
import { TypingDots } from '../components/chat/TypingDots';
import { ExerciseDetailSheet } from '../components/ExerciseDetailSheet';
import { colors } from '../constants/theme';
import { useChatStore } from '../store/chat';
import { useWorkoutStore } from '../store/workout';
import { ChatMessage } from '../types';

export function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { messages, loading, openChat, send, confirmMemoryCard } = useChatStore();
  const [input, setInput] = useState('');
  const [detail, setDetail] = useState<{ name: string; detail: string } | null>(null);

  // Greet on first mount and on every focus so the coach speaks first (fresh quote).
  useEffect(() => {
    void openChat();
    const unsubscribe = navigation.addListener('focus', () => void openChat());
    return unsubscribe;
  }, [navigation, openChat]);

  const submit = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    void send(text);
  };

  const markComplete = async () => {
    const saved = await useWorkoutStore.getState().completeWorkout();
    Toast.show(
      saved
        ? { type: 'success', text1: 'Workout marked complete' }
        : { type: 'info', text1: 'Already completed today' }
    );
  };

  // Inverted list renders newest at the bottom.
  const data = [...messages].reverse();

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={styles.msgBlock}>
        {item.content ? (
          <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
            <Text style={[styles.bubbleText, isUser && styles.userText]}>{item.content}</Text>
          </View>
        ) : null}

        {item.cards.map((card, i) => (
          <View key={i} style={styles.cardWrap}>
            <ChatCardView
              card={card}
              onShowExercise={(name, d) => setDetail({ name, detail: d })}
              onMarkComplete={() => void markComplete()}
              onConfirmMemory={(memoryId) => void confirmMemoryCard(item.id, memoryId)}
            />
          </View>
        ))}

        {!isUser && item.options.length > 0 ? (
          <View style={styles.options}>
            {item.options.map((opt) => (
              <Pressable key={opt} style={styles.optionChip} onPress={() => void send(opt)} disabled={loading}>
                <Text style={styles.optionText}>{opt}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.avatar}>
          <Ionicons name="sparkles" size={18} color={colors.background} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>SyncLife Coach</Text>
          <Text style={styles.subtitle}>Your AI health & life assistant</Text>
        </View>
      </View>

      <FlatList
        data={data}
        inverted
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={loading ? <View style={styles.typingWrap}><TypingDots /></View> : null}
      />

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Message your coach…"
          placeholderTextColor={colors.textMuted}
          multiline
          onSubmitEditing={submit}
          returnKeyType="send"
          blurOnSubmit
        />
        <Pressable style={[styles.sendBtn, (!input.trim() || loading) && styles.sendDisabled]} onPress={submit} disabled={!input.trim() || loading}>
          <Ionicons name="arrow-up" size={20} color={colors.background} />
        </Pressable>
      </View>

      <ExerciseDetailSheet
        visible={!!detail}
        onClose={() => setDetail(null)}
        displayName={detail?.name ?? ''}
        detail={detail?.detail ?? ''}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background, flex: 1 },
  header: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 12,
    paddingHorizontal: 16
  },
  avatar: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  headerText: { flex: 1 },
  title: { color: colors.text, fontSize: 18, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 13 },
  listContent: { gap: 12, padding: 16 },
  msgBlock: { gap: 8 },
  bubble: { borderRadius: 16, maxWidth: '88%', paddingHorizontal: 14, paddingVertical: 10 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.accent },
  bubbleText: { color: colors.text, fontSize: 15, lineHeight: 22 },
  userText: { color: colors.background, fontWeight: '600' },
  cardWrap: { maxWidth: '92%' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  optionChip: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.accent,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  optionText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  typingWrap: { paddingVertical: 4 },
  inputBar: {
    alignItems: 'flex-end',
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: 15,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10
  },
  sendBtn: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  sendDisabled: { opacity: 0.4 }
});
