// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Exam card component for student subject list items.
//          Displays subject name, subtitle, and themed icon.
// ─────────────────────────────────────────────────────────────────────────────

import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { getSubjectVisualVariant, studentColors, studentShadow, IconVariant } from '../studentTheme';

export type StudentExamCardProps = {
  title: string;
  subtitle: string;
  onPress?: () => void;
  iconVariant?: IconVariant;
  highlight?: boolean;
};

function StudentLogoBars() {
  return (
    <View style={styles.miniBars}>
      <View style={[styles.miniBarBase, { height: 18 }]} />
      <View style={[styles.miniBarAccent, { height: 26 }]} />
      <View style={[styles.miniBarBase, { height: 34 }]} />
    </View>
  );
}

function StudentFormulaIcon() {
  return <Text style={styles.fxText}>ƒx</Text>;
}

function StudentGridIcon() {
  return (
    <View style={styles.gridIcon}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index} style={styles.gridDot} />
      ))}
    </View>
  );
}

function SubjectTile({ iconVariant }: { iconVariant: IconVariant | undefined }) {
  const variant = iconVariant ?? 'bars';
  const tileColor = variant === 'grid' ? studentColors.pinkSoft : studentColors.blue;

  return (
    <View style={[styles.subjectTile, { backgroundColor: tileColor }]}>
      <View style={styles.subjectTilePaper}>
        {variant === 'formula' ? <StudentFormulaIcon /> : null}
        {variant === 'grid' ? <StudentGridIcon /> : null}
        {variant === 'bars' ? <StudentLogoBars /> : null}
      </View>
    </View>
  );
}

export function StudentExamCard({
  title,
  subtitle,
  onPress,
  iconVariant,
  highlight = false,
}: StudentExamCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: highlight ? studentColors.surfaceSoft : studentColors.white,
          borderWidth: 2,
          borderColor: studentColors.border,
        },
        studentShadow,
      ]}
    >
      <SubjectTile iconVariant={iconVariant ?? getSubjectVisualVariant(title)} />
      <View style={{ flex: 1, gap: 6 }}>
        <Text numberOfLines={1} style={styles.cardTitle}>{title}</Text>
        <Text numberOfLines={1} style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={studentColors.orange} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 20,
    ...Platform.select({
      android: { elevation: 5 },
      default: {
        shadowColor: '#062B2D',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
      },
    }),
  },
  subjectTile: {
    width: 64,
    height: 64,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectTilePaper: {
    width: 48,
    height: 64,
    backgroundColor: studentColors.white,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  miniBarBase: {
    width: 6,
    borderRadius: 999,
    backgroundColor: studentColors.blue,
  },
  miniBarAccent: {
    width: 6,
    borderRadius: 999,
    backgroundColor: studentColors.orange,
  },
  fxText: {
    color: studentColors.orange,
    fontFamily: 'Rubik',
    fontSize: 22,
    fontWeight: '700',
  },
  gridIcon: {
    width: 22,
    height: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: studentColors.pinkSoft,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: studentColors.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: studentColors.textSoft,
  },
});