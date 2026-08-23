import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { tapLight } from '../haptics';
import { groupLabel } from '../i18n';
import { colors, space } from '../theme';
import { GROUP_IDS, type GroupId } from '../types';

const CHIPS: GroupId[] = [...GROUP_IDS];

type Props = {
  enabled: GroupId[];
  onToggle: (g: GroupId) => void;
};

export function GroupFilter({ enabled, onToggle }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={styles.row}>
      {CHIPS.map((g) => {
        const on = enabled.includes(g);
        return (
          <Pressable
            key={g}
            onPress={() => {
              void tapLight();
              onToggle(g);
            }}
            style={[styles.chip, on && { borderColor: colors.groups[g], backgroundColor: '#121A2C' }]}>
            <View style={[styles.dot, { backgroundColor: colors.groups[g] }]} />
            <Text style={[styles.label, on ? styles.on : styles.off]}>{groupLabel(g)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: { flexGrow: 0, flexShrink: 0 },
  row: {
    gap: 8,
    paddingHorizontal: space.md,
    paddingVertical: 4,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: { fontSize: 12, fontWeight: '600' },
  on: { color: colors.text },
  off: { color: colors.dim },
});
