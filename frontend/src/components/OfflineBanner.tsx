import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors } from '../constants/theme';

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      setOffline(!(state.isConnected && state.isInternetReachable !== false));
    });
  }, []);

  if (!offline) {
    return null;
  }

  return <Text style={styles.banner}>Offline. Sync is paused and writes are queued.</Text>;
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warning,
    color: colors.background,
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textAlign: 'center'
  }
});
