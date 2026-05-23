// ─────────────────────────────────────────────────────────────────────────────
// StudentUI — barrel re-export for student-specific UI components.
// Components are split into individual files in the same directory.
// Design tokens are in studentTokens.ts.
// ─────────────────────────────────────────────────────────────────────────────

// ── Design tokens ────────────────────────────────────────────────────────────
export {
  studentColors,
  studentLightColors,
  studentDarkColors,
  studentRadii,
  studentShadow,
  avatarPalette,
  getStudentColors,
  getStudentShadow,
} from './studentTokens';
export type { StudentThemeColors } from './studentTokens';

// ── Components ────────────────────────────────────────────────────────────────
export { StudentAvatar } from './StudentAvatar';
export { StudentSectionHeader } from './StudentSectionHeader';
export { StudentExamCard, getSubjectVisualVariant, getSubjectIcon } from './StudentCard';
export {
  StudentLeaderboardRow,
  StudentLeaderboardPodium,
} from './StudentLeaderboard';
export { LeaderboardShareModal } from './LeaderboardShareModal';
export { StudentFilterSheet } from './StudentFilterSheet';
export { StudentTabBar } from './StudentTabBar';
export { StudentHeroDecoration } from './StudentDecorations';

// ── Re-exported utilities that live here (not split) ─────────────────────────

import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getStudentColors } from './studentTokens';

// ── SegmentedControl (kept inline — small, self-contained) ────────────────────

type StudentSegmentedControlProps<T extends string> = {
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
};

export function StudentSegmentedControl<T extends string>({
  value,
  options,
  onChange,
  style,
}: StudentSegmentedControlProps<T>) {
  const { theme } = useTheme();
  const colors = getStudentColors(theme === 'dark');

  return (
    <View
      className="flex-row rounded-3xl p-1 gap-1"
      style={[{ backgroundColor: colors.cardSoft }, style]}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className="flex-1 rounded-[20px] py-2 px-3 items-center justify-center"
            style={{ backgroundColor: active ? colors.orange : 'transparent' }}
          >
            <Text
              className={`font-sans text-sm leading-5 ${active ? 'font-bold' : 'font-medium'}`}
              style={{ color: active ? '#FFFFFF' : colors.textSoft }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Utility ──────────────────────────────────────────────────────────────────

export function formatWeeklyCountdown(periodEndsAt?: string | null) {
  if (!periodEndsAt) return '--';
  const diff = new Date(periodEndsAt).getTime() - Date.now();
  if (diff <= 0) return '00d 00h 00m';
  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return `${days.toString().padStart(2, '0')}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
}
