import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { AppButton } from '../components/AppButton';
import { LEGAL_TITLES, LegalDocKind, legalUrl } from '../constants/legal';
import { colors } from '../constants/theme';
import { RootStackParamList } from '../types';

/**
 * Shows the Terms / Privacy Policy / deletion page served by the backend, so the
 * in-app text and the public URL in the Play listing are always identical.
 */
export function LegalScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'Legal'>) {
  // Route typing degrades to `any` via the @react-navigation/core stub in vendor.d.ts — pin it here.
  const kind: LegalDocKind = (route.params as RootStackParamList['Legal']).kind;
  const insets = useSafeAreaInsets();
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{LEGAL_TITLES[kind]}</Text>
      </View>

      {failed ? (
        <View style={styles.center}>
          <Text style={styles.message}>Couldn't load this page. Check your connection and try again.</Text>
          <AppButton
            label="Retry"
            icon="refresh"
            onPress={() => {
              setFailed(false);
              setReloadKey((k) => k + 1);
            }}
          />
          <AppButton label="Open in browser" icon="open-outline" variant="ghost" onPress={() => void Linking.openURL(legalUrl(kind))} />
        </View>
      ) : (
        <WebView
          key={reloadKey}
          source={{ uri: legalUrl(kind, true) }}
          style={styles.web}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.accent} />
            </View>
          )}
          onError={() => setFailed(true)}
          onHttpError={() => setFailed(true)}
          // Keep navigation inside the doc; external links (e.g. Google's policy) open in the browser.
          onShouldStartLoadWithRequest={(request) => {
            if (request.url.startsWith(legalUrl(kind))) return true;
            void Linking.openURL(request.url);
            return false;
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background, flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 14, paddingHorizontal: 16, paddingVertical: 12 },
  title: { color: colors.text, fontSize: 20, fontWeight: '900' },
  web: { backgroundColor: colors.background, flex: 1 },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', backgroundColor: colors.background, justifyContent: 'center' },
  center: { flex: 1, gap: 12, justifyContent: 'center', padding: 28 },
  message: { color: colors.textMuted, fontSize: 15, lineHeight: 22, textAlign: 'center' }
});
