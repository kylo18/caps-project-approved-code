import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/contexts/ThemeContext';

export type SubjectCardProps = {
  subject: {
    subjectID: number;
    subjectCode?: string | null;
    subjectName: string;
    programName?: string;
    yearLevel?: string;
    is_enabled_for_exam_questions?: boolean;
  };
  role: 'faculty' | 'program_chair' | 'dean' | 'associate_dean';
  onPress?: () => void;
  onMenuPress?: () => void; // Click handler for the ellipsis menu button
};

// Maps subject code prefix or program name to a contextually appropriate Ionicons icon
const ICON_POOL = [
  'book-outline',
  'library-outline',
  'school-outline',
  'albums-outline',
  'documents-outline',
  'grid-outline',
  'layers-outline',
  'layers',
] as const;

const getSubjectIcon = (subjectCode?: string | null): typeof ICON_POOL[number] => {
  const code = subjectCode ?? '';
  const index = code.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0) % ICON_POOL.length;
  return ICON_POOL[index];
};

export default function SubjectCard({ subject, role, onPress, onMenuPress }: SubjectCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Role Theme styling based on HSL color guidelines:
  // Faculty: Emerald (#10B981, HSL: 162, 72%, 40%)
  // Administrative roles: Indigo/Violet (#6366F1, HSL: 242, 60%, 55%)
  const isFaculty = role === 'faculty';
  const roleColor = isFaculty ? '#10B981' : '#6366F1';
  const roleBg = isFaculty ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.12)';

  const colors = {
    card: isDark ? '#1f2937' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    badgeText: isDark ? '#e5e7eb' : '#4b5563',
    badgeBg: isDark ? '#374151' : '#f3f4f6',
    green: '#10B981',
    greenBg: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5',
    red: '#EF4444',
    redBg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
  };

  return (
    <TouchableOpacity
      className="flex-row items-center rounded-2xl p-4 gap-3 mb-2.5 border"
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Dynamic Left Icon with Role Accent styling */}
      <View
        className="w-12 h-12 rounded-xl items-center justify-center"
        style={{ backgroundColor: roleBg }}
      >
        <Ionicons name={getSubjectIcon(subject?.subjectCode)} size={24} color={roleColor} />
      </View>

      {/* Center content */}
      <View className="flex-1 min-w-0">
        <Text
          className="text-base font-bold"
          numberOfLines={1}
          style={{ color: colors.text }}
        >
          {subject?.subjectName || 'Unknown Subject'}
        </Text>
        <Text
          className="text-sm font-semibold mt-0.5"
          style={{ color: colors.textSecondary }}
        >
          {subject?.subjectCode || 'GEN'}
        </Text>

        {/* Badge Metadata row */}
        <View className="flex-row flex-wrap gap-1.5 mt-2">
          {subject?.programName && (
            <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: colors.badgeBg }}>
              <Text className="text-[10px] font-bold" style={{ color: colors.badgeText }}>
                {subject.programName}
              </Text>
            </View>
          )}
          {subject?.yearLevel && (
            <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: colors.badgeBg }}>
              <Text className="text-[10px] font-bold" style={{ color: colors.badgeText }}>
                Yr {subject.yearLevel}
              </Text>
            </View>
          )}

          {/* Exam configuration indicator specifically for Dean */}
          {role === 'dean' && (
            <View
              className="px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: subject?.is_enabled_for_exam_questions ? colors.greenBg : colors.redBg
              }}
            >
              <Text
                className="text-[10px] font-bold"
                style={{
                  color: subject?.is_enabled_for_exam_questions ? colors.green : colors.red
                }}
              >
                {subject?.is_enabled_for_exam_questions ? 'Questions Enabled' : 'Questions Disabled'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Touchscreen safe vertical ellipsis context action sheet trigger */}
      {onMenuPress && (
        <TouchableOpacity
          className="p-2.5 -mr-2"
          onPress={onMenuPress}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}
