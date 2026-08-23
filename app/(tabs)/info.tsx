import Constants from 'expo-constants';
import type { ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fmtWhen } from '@/src/format';
import { it } from '@/src/i18n';
import { MAX_OBJECTS } from '@/src/orbit/fetchTle';
import { useSatellites } from '@/src/state/SatellitesContext';
import { colors, space } from '@/src/theme';

const VERSION = Constants.expoConfig?.version ?? '1.0.0';

const LINKS = [
  { label: 'CelesTrak — T.S. Kelso', url: 'https://celestrak.org' },
  { label: 'SatNOGS DB — Libre Space Foundation', url: 'https://db.satnogs.org' },
  { label: 'tle.ivanstanojevic.me', url: 'https://tle.ivanstanojevic.me' },
] as const;

export default function AboutScreen() {
  const { snapshots, allSnapshots, source, fetchedAt, cached, error } = useSatellites();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>{it.appName}</Text>
        <Text style={styles.title}>{it.aboutTitle}</Text>
        <Text style={styles.tagline}>{it.tagline}</Text>
        <Text style={styles.body}>{it.aboutBody}</Text>

        <View style={styles.status}>
          <StatusCell
            label={it.oggetti}
            value={`${allSnapshots.length || snapshots.length}/${MAX_OBJECTS}`}
          />
          <StatusCell label={it.fonte} value={source ?? '—'} />
          <StatusCell
            label={it.ultimoAggiornamento}
            value={fetchedAt ? fmtWhen(fetchedAt) : '—'}
          />
        </View>
        {cached ? <Text style={styles.meta}>{it.cache}</Text> : null}
        {error ? <Text style={styles.warn}>{error}</Text> : null}

        <Section title={it.howToTitle}>
          {it.howToItems.map((line) => (
            <Text key={line} style={styles.bullet}>
              · {line}
            </Text>
          ))}
        </Section>

        <Section title={it.aboutDati}>
          <Text style={styles.body}>{it.aboutDatiBody}</Text>
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
          <View style={styles.links}>
            {LINKS.map((item) => (
              <Pressable
                key={item.url}
                onPress={() => {
                  void Linking.openURL(item.url).catch(() => {
                    // simulator / blocked
                  });
                }}
                accessibilityRole="link">
                <Text style={styles.link}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section title={it.aboutDisclaimerTitle}>
          <Text style={styles.disclaimer}>{it.aboutDisclaimer}</Text>
        </Section>

        <Section title={it.aboutPrivacy}>
          <Text style={styles.body}>{it.aboutPrivacyBody}</Text>
        </Section>

        <Text style={styles.meta}>
          {it.versione} {VERSION}
        </Text>
        <Text style={styles.meta}>{it.howToOpen}</Text>
        <Text style={styles.bundle}>it.kreluna.orbita</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.cell}>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={styles.cellValue}>{value}</Text>
    </View>
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
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginBottom: 2 },
  tagline: { color: colors.gold, fontSize: 15, fontWeight: '600', marginBottom: 6 },
  body: { color: colors.text, fontSize: 15, lineHeight: 22 },
  status: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  cell: {
    flex: 1,
    backgroundColor: colors.panelSolid,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    gap: 4,
  },
  cellLabel: { color: colors.dim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3 },
  cellValue: { color: colors.text, fontSize: 13, fontWeight: '700' },
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
  links: { gap: 6, marginTop: 4 },
  link: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  disclaimer: { color: colors.danger, fontSize: 14, lineHeight: 21 },
  meta: { color: colors.muted, fontSize: 13, marginTop: 10 },
  warn: { color: colors.danger, fontSize: 13, marginTop: 4 },
  bundle: { color: colors.dim, fontFamily: 'SpaceMono', fontSize: 12, marginTop: 4 },
});
