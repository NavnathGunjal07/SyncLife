import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/theme';

// Purely presentational. RootNavigator mounts this while the auth store is
// rehydrating, then swaps to the Auth or AppTabs stack based on auth state.
export function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>SL</Text>
      </View>
      <Text style={styles.title}>SyncLife</Text>
      <Text style={styles.subtitle}>Meals, movement, money, and momentum.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center'
  },
  logo: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 28,
    height: 76,
    justifyContent: 'center',
    marginBottom: 18,
    width: 76
  },
  logoText: { color: colors.background, fontSize: 28, fontWeight: '900' },
  title: { color: colors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 15, marginTop: 8 }
});
