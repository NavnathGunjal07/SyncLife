import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/theme';

type Props = {
  title: string;
  /** Small muted text on the right (e.g. a count or hint). */
  trailing?: string;
};

/** A titled section divider used to group content into clear blocks. */
export function SectionHeader({ title, trailing }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {trailing ? <Text style={styles.trailing}>{trailing}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900'
  },
  trailing: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700'
  }
});
