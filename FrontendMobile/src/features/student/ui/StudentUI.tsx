// ─────────────────────────────────────────────────────────────────────────────
// StudentUI — barrel re-export for student-specific UI components.
// Components are split into individual files in the same directory.
// Design tokens are in studentTokens.ts.
// ─────────────────────────────────────────────────────────────────────────────

// ── Design tokens ────────────────────────────────────────────────────────────
export { studentColors, studentRadii, studentShadow, avatarPalette } from './studentTokens';

// ── Components ────────────────────────────────────────────────────────────────
export { StudentAvatar } from './StudentAvatar';
export { StudentSectionHeader } from './StudentSectionHeader';
export { StudentExamCard, getSubjectVisualVariant } from './StudentCard';
export {
  StudentLeaderboardRow,
  StudentLeaderboardPodium,
} from './StudentLeaderboard';
export { StudentFilterSheet } from './StudentFilterSheet';
export { StudentTabBar } from './StudentTabBar';
export { StudentHeroDecoration } from './StudentDecorations';

// ── Re-exported utilities that live here (not split) ─────────────────────────

import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

// ── SegmentedControl (kept inline — small, self-contained) ────────────────────

type StudentSegmentedControlProps<T extends string> = {
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
  style?: object;
};

export function StudentSegmentedControl<T extends string>({
  value,
  options,
  onChange,
  style,
}: StudentSegmentedControlProps<T>) {
  return (
    <View style={[styles.segmentedControl, style]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segmentButton, active ? styles.segmentButtonActive : null]}
          >
            <Text style={[styles.segmentButtonText, active ? styles.segmentButtonTextActive : null]}>
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

// ── Styles (only for SegmentedControl) ────────────────────────────────────────

const styles = StyleSheet.create({
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#EB6B00',
    borderRadius: 24,
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#FFC48D',
  },
  segmentButtonText: {
    color: 'rgba(255,255,255,0.88)',
    fontFamily: 'Rubik',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  segmentButtonTextActive: {
    color: '#EB6B00',
    fontWeight: '700',
  },
});