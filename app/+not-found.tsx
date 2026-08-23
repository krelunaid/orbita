import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/theme';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'Orbita', headerShown: false }} />
      <View style={styles.box}>
        <Text style={styles.title}>Schermata assente</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Torna al globo</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  link: { padding: 8 },
  linkText: { color: colors.accent, fontSize: 15 },
});
