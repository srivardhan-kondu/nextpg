import { StyleSheet } from '@react-pdf/renderer';

/**
 * PDF palette. Deliberately hard-coded hex rather than the CSS variables the app
 * uses — @react-pdf has no cascade, and the report must look identical whatever
 * theme the user was browsing in.
 */
export const palette = {
  primary: '#2563eb',
  primarySoft: '#eff6ff',
  ink: '#0f172a',
  body: '#334155',
  muted: '#64748b',
  line: '#e2e8f0',
  surface: '#f8fafc',
  white: '#ffffff',
  strong: '#16a34a',
  strongSoft: '#ecfdf5',
  moderate: '#d97706',
  moderateSoft: '#fffbeb',
  stretch: '#dc2626',
  stretchSoft: '#fef2f2',
} as const;

export const likelihoodColor = {
  STRONG: palette.strong,
  MODERATE: palette.moderate,
  STRETCH: palette.stretch,
  VERY_DIFFICULT: palette.stretch,
} as const;

export const likelihoodBg = {
  STRONG: palette.strongSoft,
  MODERATE: palette.moderateSoft,
  STRETCH: palette.stretchSoft,
  VERY_DIFFICULT: palette.stretchSoft,
} as const;

export const styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontSize: 9.5,
    color: palette.body,
    fontFamily: 'Helvetica',
    lineHeight: 1.45,
  },

  // ── Cover ──
  cover: { paddingTop: 0, paddingHorizontal: 0, paddingBottom: 0 },
  coverBand: { backgroundColor: palette.primary, paddingHorizontal: 44, paddingTop: 64, paddingBottom: 48 },
  coverBrand: { color: palette.white, fontSize: 26, fontFamily: 'Helvetica-Bold', letterSpacing: -0.5 },
  coverTagline: { color: '#dbeafe', fontSize: 10.5, marginTop: 6 },
  coverTitle: { color: palette.white, fontSize: 17, fontFamily: 'Helvetica-Bold', marginTop: 34 },
  coverBody: { paddingHorizontal: 44, paddingTop: 32 },
  coverName: { fontSize: 21, fontFamily: 'Helvetica-Bold', color: palette.ink },
  coverMeta: { fontSize: 10, color: palette.muted, marginTop: 4 },

  headline: {
    marginTop: 26,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
    backgroundColor: palette.primarySoft,
    padding: 20,
  },
  headlineLabel: { fontSize: 9, color: palette.muted, textTransform: 'uppercase', letterSpacing: 0.7 },
  headlineValue: { fontSize: 27, fontFamily: 'Helvetica-Bold', color: palette.primary, marginTop: 5 },
  headlineHint: { fontSize: 9, color: palette.muted, marginTop: 7 },

  // ── Structure ──
  section: { marginTop: 20 },
  sectionTitle: {
    fontSize: 12.5,
    fontFamily: 'Helvetica-Bold',
    color: palette.ink,
    borderBottomWidth: 2,
    borderBottomColor: palette.primary,
    paddingBottom: 5,
    marginBottom: 11,
  },
  sectionCaption: { fontSize: 8.5, color: palette.muted, marginTop: -7, marginBottom: 9 },
  paragraph: { marginBottom: 6 },

  // ── Stat strip ──
  statRow: { flexDirection: 'row', gap: 9, marginBottom: 13 },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 6,
    padding: 10,
    backgroundColor: palette.surface,
  },
  statLabel: { fontSize: 7.5, color: palette.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: palette.ink, marginTop: 3 },

  // ── Key/value grid ──
  kvGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  kvItem: { width: '33.33%', marginBottom: 10, paddingRight: 8 },
  kvLabel: { fontSize: 7.5, color: palette.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  kvValue: { fontSize: 10, color: palette.ink, fontFamily: 'Helvetica-Bold', marginTop: 2 },

  // ── Tables ──
  table: { borderWidth: 1, borderColor: palette.line, borderRadius: 6, overflow: 'hidden' },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: palette.line },
  trLast: { flexDirection: 'row' },
  th: {
    backgroundColor: palette.surface,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingVertical: 6,
    paddingHorizontal: 7,
  },
  td: { fontSize: 8.5, paddingVertical: 6, paddingHorizontal: 7, color: palette.body },
  tdStrong: { fontFamily: 'Helvetica-Bold', color: palette.ink },

  // ── Callouts ──
  callout: {
    borderLeftWidth: 3,
    borderLeftColor: palette.primary,
    backgroundColor: palette.surface,
    paddingVertical: 9,
    paddingHorizontal: 11,
    marginBottom: 8,
    borderRadius: 3,
  },
  calloutTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: palette.ink, marginBottom: 3 },

  pill: {
    alignSelf: 'flex-start',
    paddingVertical: 2.5,
    paddingHorizontal: 7,
    borderRadius: 9,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
  },

  bullet: { flexDirection: 'row', marginBottom: 4 },
  bulletDot: { width: 11, color: palette.primary, fontFamily: 'Helvetica-Bold' },
  bulletText: { flex: 1, fontSize: 8.5 },

  disclaimer: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 6,
    backgroundColor: palette.surface,
    padding: 11,
    fontSize: 8,
    color: palette.muted,
  },

  footer: {
    position: 'absolute',
    bottom: 26,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingTop: 7,
    fontSize: 7.5,
    color: palette.muted,
  },
});
