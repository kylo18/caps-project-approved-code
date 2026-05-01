// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Exam card component for student subject list items.
//          Displays subject name, subtitle, and themed icon.
// ─────────────────────────────────────────────────────────────────────────────

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { getSubjectVisualVariant, IconVariant } from '../studentTheme';
import { studentColors, studentShadow } from '../ui/studentTokens';

export type StudentExamCardProps = {
  title: string;
  subtitle: string;
  onPress?: () => void;
  iconVariant?: IconVariant;
  highlight?: boolean;
};

function StudentLogoBars() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
      <View style={{ width: 6, height: 18, borderRadius: 999, backgroundColor: studentColors.blue }} />
      <View style={{ width: 6, height: 26, borderRadius: 999, backgroundColor: studentColors.orange }} />
      <View style={{ width: 6, height: 34, borderRadius: 999, backgroundColor: studentColors.blue }} />
    </View>
  );
}

function StudentFormulaIcon() {
  return <Text style={{ color: studentColors.orange, fontFamily: 'Rubik', fontSize: 22, fontWeight: '700' }}>ƒx</Text>;
}

function StudentGridIcon() {
  return (
    <View style={{ width: 22, height: 22, flexDirection: 'row', flexWrap: 'wrap', gap: 3, justifyContent: 'center', alignItems: 'center' }}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index} style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: studentColors.pinkSoft }} />
      ))}
    </View>
  );
}

function SubjectTile({ iconVariant }: { iconVariant: IconVariant | undefined }) {
  const variant = iconVariant ?? 'bars';
  const tileColor = variant === 'grid' ? studentColors.pinkSoft : studentColors.blue;

  return (
    <View className="w-16 h-16 rounded-[20px] overflow-hidden justify-center items-center" style={{ backgroundColor: tileColor }}>
      <View className="w-12 h-16 bg-white rounded-lg justify-center items-center">
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
      className="flex-row items-center gap-4 px-2 py-2 rounded-[20px]"
      style={[
        {
          borderWidth: 2,
          borderColor: studentColors.border,
        },
        studentShadow,
        highlight ? { backgroundColor: studentColors.surfaceSoft } : { backgroundColor: studentColors.white },
      ]}
    >
      <SubjectTile iconVariant={iconVariant ?? getSubjectVisualVariant(title)} />
      <View className="flex-1 gap-1.5">
        <Text numberOfLines={1} className="font-sans text-[15px] font-medium" style={{ color: studentColors.text }}>{title}</Text>
        <Text numberOfLines={1} className="font-sans text-xs" style={{ color: studentColors.textSoft }}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={studentColors.orange} />
    </Pressable>
  );
}