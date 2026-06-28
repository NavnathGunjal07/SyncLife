import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/theme';
import { deleteMemory, fetchMemory } from '../services/api';
import { useAuthStore } from '../store/auth';
import { SavedMemory } from '../types';
import { Card } from './Card';

export function SavedMemoriesCard() {
  const token = useAuthStore((state) => state.accessToken);
  const [memories, setMemories] = useState<SavedMemory[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetchMemory(token)
      .then((res) => {
        if (active) setMemories(res.memories);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const remove = async (id: string) => {
    if (!token) return;
    setMemories((prev) => prev.filter((m) => m.id !== id));
    try {
      await deleteMemory(token, id);
    } catch {
      // ignore — UI already updated optimistically
    }
  };

  // Hide entirely until loaded with at least one memory.
  if (!loaded || memories.length === 0) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="bookmark" size={16} color={colors.accent} />
        <Text style={styles.title}>What your coach remembers</Text>
      </View>
      {memories.map((m) => (
        <View key={m.id} style={styles.row}>
          <Text style={styles.memText}>{m.content}</Text>
          <Pressable hitSlop={8} onPress={() => void remove(m.id)}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </Pressable>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  title: { color: colors.text, fontSize: 16, fontWeight: '800' },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  memText: { color: colors.textMuted, flex: 1, fontSize: 14, lineHeight: 20 }
});
