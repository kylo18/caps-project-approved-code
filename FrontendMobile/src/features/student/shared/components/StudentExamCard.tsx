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
// Purpose: Exam card component for student subject list items.
//          Displays subject name, subtitle, and themed icon.
// ─────────────────────────────────────────────────────────────────────────────

import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { getSubjectVisualVariant, IconVariant } from '../studentTheme';
import { studentColors, studentShadow } from '../ui/studentTokens';

export type StudentExamCardProps = {
  title: string;
  subtitle: string;
  onPress?: () => void;
  iconVariant?: IconVariant;
  highlight?: boolean;
  subjectCode?: string | null;
};

function SubjectTile({ iconVariant, iconName }: { iconVariant: IconVariant | undefined; iconName: string }) {
  return (
    <View className="w-16 h-16 rounded-[20px] overflow-hidden justify-center items-center" style={{ backgroundColor: studentColors.blue }}>
      <View className="w-12 h-12 rounded-[14px] bg-white justify-center items-center">
        <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={26} color={studentColors.orange} />
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
  subjectCode,
}: StudentExamCardProps) {
  const iconName = subjectCode ? getSubjectIcon(subjectCode) : 'book-outline';

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
      <SubjectTile iconVariant={iconVariant ?? getSubjectVisualVariant(title)} iconName={iconName} />
      <View className="flex-1 gap-1.5">
        <Text numberOfLines={1} className="font-sans text-[15px] font-medium" style={{ color: studentColors.text }}>{title}</Text>
        <Text numberOfLines={1} className="font-sans text-xs" style={{ color: studentColors.textSoft }}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={studentColors.orange} />
    </Pressable>
  );
}