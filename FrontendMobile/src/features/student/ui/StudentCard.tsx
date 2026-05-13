// Maps subject code prefix to a contextually appropriate Ionicons icon
export function getSubjectIcon(subjectCode?: string | null): string {
  const code = (subjectCode ?? '').toUpperCase();
  if (code.startsWith('MATH')) return 'calculator-outline';
  if (code.startsWith('ENG')) return 'language-outline';
  if (code.startsWith('SCI') || code.startsWith('BIO') || code.startsWith('CHEM') || code.startsWith('PHYS')) return 'flask-outline';
  if (code.startsWith('HIST')) return 'time-outline';
  if (code.startsWith('ART')) return 'brush-outline';
  if (code.startsWith('MUS')) return 'musical-notes-outline';
  if (code.startsWith('PE') || code.startsWith('P.E')) return 'fitness-outline';
  if (code.startsWith('CS') || code.startsWith('IT')) return 'code-slash-outline';
  return 'book-outline';
}

// ─────────────────────────────────────────────────────────────────────────────
// StudentExamCard — card component for exam/subject items in a list.
// Uses pure NativeWind styling (no mixed className + StyleSheet in the public surface).
// ─────────────────────────────────────────────────────────────────────────────

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

function SubjectTile({ iconVariant, iconName }: { iconVariant: StudentExamCardProps['iconVariant']; iconName: string }) {
  return (
    <View className="w-16 h-16 rounded-[20px] overflow-hidden justify-center items-center bg-[#C4D0FB]">
      <View className="w-12 h-12 rounded-[14px] bg-white justify-center items-center">
        <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={26} color="#FF6E00" />
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
  const iconName = subjectCode ? getSubjectIcon(subjectCode) : 'book-outline';
  const bg = highlight ? 'bg-[#FFF1E9]' : 'bg-white';
  const border = 'border-2 border-[#EFEEFC]';

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center rounded-[20px] px-2 py-2 shadow-sm ${bg} ${border}`}
    >
      <SubjectTile iconVariant={iconVariant} iconName={iconName} />
      <View className="flex-1 gap-1.5">
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