// ─────────────────────────────────────────────────────────────────────────────
// StudentExamCard — card component for exam/subject items in a list.
// Exported from StudentUI as-is.
// ─────────────────────────────────────────────────────────────────────────────

import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

// ── Internal tile icon helpers (pure StyleSheet — no className mixing) ────────

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

function SubjectTile({ iconVariant }: { iconVariant: StudentExamCardProps['iconVariant'] }) {
  const variant = iconVariant ?? 'bars';
  const tileColor = variant === 'grid' ? '#FFC2CD' : '#C4D0FB';

  return (
    <View className={`w-16 h-16 rounded-[20px] overflow-hidden justify-center items-center`} style={{ backgroundColor: tileColor }}>
      <View className="w-12 h-16 bg-white rounded-lg justify-center items-center">
        {variant === 'formula' ? <StudentFormulaIcon /> : null}
        {variant === 'grid' ? <StudentGridIcon /> : null}
        {variant === 'bars' ? <StudentLogoBars /> : null}
      </View>
    </View>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

export type StudentExamCardProps = {
  title: string;
  subtitle: string;
  onPress?: () => void;
  iconVariant?: 'bars' | 'formula' | 'grid';
  highlight?: boolean;
};

const studentShadow = Platform.select({
  android: { elevation: 5 },
  default: {
    shadowColor: '#062B2D',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
  },
});

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
      className={`flex-row items-center rounded-[20px] px-2 py-2 border-2 ${highlight ? 'bg-[#FFF1E9]' : 'bg-white'} border-[#EFEEFC]`}
      style={[{ gap: 16 }, studentShadow]}
    >
      <SubjectTile iconVariant={iconVariant} />
      <View className="flex-1" style={{ gap: 6 }}>
        <Text numberOfLines={1} className="text-base font-medium text-[#0C092A]">
          {title}
        </Text>
        <Text numberOfLines={1} className="text-xs text-[#858494]">
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#FF6E00" />
    </Pressable>
  );
}

export function getSubjectVisualVariant(input?: string | null): StudentExamCardProps['iconVariant'] {
  const label = input?.toLowerCase() ?? '';
  if (label.includes('program') || label.includes('database') || label.includes('logic')) {
    return 'grid';
  }
  if (label.includes('calculus') || label.includes('math') || label.includes('economics') || label.includes('chemistry')) {
    return 'formula';
  }
  return 'bars';
}

const styles = StyleSheet.create({
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#C4D0FB',
  },
  miniBarAccent: {
    width: 6,
    borderRadius: 999,
    backgroundColor: '#FF6E00',
  },
  fxText: {
    color: '#FF6E00',
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
    backgroundColor: '#FFC2CD',
  },
});