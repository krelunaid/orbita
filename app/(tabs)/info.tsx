import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { it } from '@/src/i18n';
import { MAX_OBJECTS } from '@/src/orbit/fetchTle';
import { useSatellites } from '@/src/state/SatellitesContext';
import { colors, space } from '@/src/theme';

export default function AboutScreen() {
  const { snapshots, source } = useSatellites();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>{it.appName}</Text>
        <Text style={styles.title}>{it.aboutTitle}</Text>
        <Text style={styles.body}>{it.aboutBody}</Text>

        <Section title={it.aboutDati}>
          <Text style={styles.body}>{it.aboutDatiBody}</Text>
          <Text style={styles.meta}>
            Catalogo attuale: {snapshots.length}/{MAX_OBJECTS}
            {source ? ` · fonte ${source}` : ''}
          </Text>
        </Section>

        <Section title={it.aboutProp}>
          <Text style={styles.body}>{it.aboutPropBody}</Text>
        </Section>

        <Section title={it.aboutAttrib}>
          {it.aboutAttribItems.map((line) => (
            <Text key={line} style={styles.bullet}>
              · {line}
            </Text>
          ))}
        </Section>

        <Section title={it.aboutDisclaimerTitle}>
          <Text style={styles.disclaimer}>{it.aboutDisclaimer}</Text>
        </Section>

        <Section title={it.aboutPrivacy}>
          <Text style={styles.body}>{it.aboutPrivacyBody}</Text>
        </Section>

        <Text style={styles.meta}>{it.expoGoHint}</Text>
        <Text style={styles.bundle}>it.kreluna.orbita</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.md, paddingBottom: 48, gap: 8 },
  kicker: { color: colors.accent, fontSize: 13, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginBottom: 6 },
  body: { color: colors.text, fontSize: 15, lineHeight: 22 },
  section: {
    marginTop: 16,
    backgroundColor: colors.panelSolid,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 16,
    padding: space.md,
    gap: 8,
  },
  sectionTitle: { color: colors.gold, fontSize: 14, fontWeight: '700' },
  bullet: { color: colors.text, fontSize: 14, lineHeight: 21 },
  disclaimer: { color: colors.danger, fontSize: 14, lineHeight: 21 },
  meta: { color: colors.muted, fontSize: 13, marginTop: 10 },
  bundle: { color: colors.dim, fontFamily: 'SpaceMono', fontSize: 12, marginTop: 4 },
});
