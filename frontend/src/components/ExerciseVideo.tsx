import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

import { colors } from '../constants/theme';

/** In-app YouTube tutorial player for an exercise (official iframe embed). */
export function ExerciseVideo({ videoId, height = 200 }: { videoId: string; height?: number }) {
  const [playing, setPlaying] = useState(false);

  const onChangeState = useCallback((state: string) => {
    if (state === 'ended') setPlaying(false);
  }, []);

  return (
    <View style={styles.wrap}>
      <YoutubePlayer
        height={height}
        play={playing}
        videoId={videoId}
        onChangeState={onChangeState}
        webViewProps={{ androidLayerType: 'hardware' }}
        initialPlayerParams={{ modestbranding: true, rel: false }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    overflow: 'hidden'
  }
});
