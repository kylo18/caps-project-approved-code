// Rotating icon pool — visually varied, subject-agnostic, consistent per subjectCode
const ICON_POOL = [
  'book-outline',
  'library-outline',
  'school-outline',
  'albums-outline',
  'documents-outline',
  'grid-outline',
  'layers-outline',
  'layers',
];

// Returns a stable icon per subjectCode — same code always → same icon
export function getSubjectIcon(subjectCode?: string | null): string {
  const code = subjectCode ?? '';
  const index = code.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0) % ICON_POOL.length;
  return ICON_POOL[index];
}

// ─────────────────────────────────────────────────────────────────────────────
// StudentExamCard — card component for exam/subject items in a list.
// Uses pure NativeWind styling (no mixed className + StyleSheet in the public surface).
// ─────────────────────────────────────────────────────────────────────────────

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getStudentColors, getStudentShadow } from './studentTokens';

function SubjectTile({
  iconVariant,
  iconName,
  colors,
}: {
  iconVariant: StudentExamCardProps['iconVariant'];
  iconName: string;
  colors: ReturnType<typeof getStudentColors>;
}) {
  return (
    <View
      className="w-16 h-16 rounded-[20px] overflow-hidden justify-center items-center"
      style={{ backgroundColor: colors.blue }}
    >
      <View className="w-12 h-12 rounded-[14px] justify-center items-center" style={{ backgroundColor: colors.card }}>
        <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={26} color={colors.orange} />
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
  subjectCode?: string | null;
};

export function StudentExamCard({
  title,
  subtitle,
  onPress,
  iconVariant,
  highlight = false,
  subjectCode,
}: StudentExamCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getStudentColors(isDark);
  const shadow = getStudentShadow(isDark);
  const iconName = subjectCode ? getSubjectIcon(subjectCode) : 'book-outline';

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center rounded-[20px] px-2 py-2 border-2"
      style={[
        {
          backgroundColor: highlight ? colors.statsCard : colors.card,
          borderColor: colors.border,
          gap: 16,
        },
        shadow,
      ]}
    >
      <SubjectTile iconVariant={iconVariant} iconName={iconName} colors={colors} />
      <View className="flex-1 gap-1.5">
        <Text numberOfLines={1} className="text-base font-medium" style={{ color: colors.text }}>
          {title}
        </Text>
        <Text numberOfLines={1} className="text-xs" style={{ color: colors.textSoft }}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.orange} />
    </Pressable>
  );
}

export function getSubjectVisualVariant(input?: string | null): StudentExamCardProps['iconVariant'] {
  const label = input?.toLowerCase() ?? '';
  if (label.includes('program') || label.includes('database') || label.includes('logic')) return 'grid';
  if (label.includes('calculus') || label.includes('math') || label.includes('economics') || label.includes('chemistry')) return 'formula';
  return 'bars';
}

// ── StyleSheet for internal icon helpers only ────────────────────────────────

const styles = StyleSheet.create({
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
