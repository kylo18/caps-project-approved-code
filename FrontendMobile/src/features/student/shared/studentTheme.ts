// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Shared design tokens and constants for student-facing components.
//          Extracted from StudentUI.tsx to enable independent component files.
// ─────────────────────────────────────────────────────────────────────────────

import { Platform, StyleSheet } from 'react-native';

export const studentColors = {
  orange: '#FF6E00',
  orangeDark: '#EB6B00',
  orangeSoft: '#FFA258',
  orangeCard: '#F2B161',
  white: '#FFFFFF',
  text: '#0C092A',
  textSoft: '#858494',
  border: '#EFEEFC',
  borderSoft: '#F6F2FF',
  pink: '#FFD6DD',
  pinkSoft: '#FFC2CD',
  blue: '#C4D0FB',
  surface: '#FFF7F1',
  surfaceSoft: '#FFF1E9',
  pale: '#F8F6FF',
  success: '#86D2A8',
  gold: '#FFD45C',
  silver: '#C9CBD7',
  bronze: '#D89757',
};

export const studentRadii = {
  pill: 999,
  lg: 20,
  xl: 24,
  sheet: 32,
};

export const studentShadow = Platform.select({
  android: { elevation: 5 },
  default: {
    shadowColor: '#062B2D',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
  },
});

export const avatarPalette = ['#FFE17B', '#D9DCFF', '#D6F4D2', '#FFD0B1', '#FFD4EA'];

export type IconVariant = 'bars' | 'formula' | 'grid';

export function getSubjectVisualVariant(
  input?: string | null
): IconVariant {
  const label = input?.toLowerCase() ?? '';
  if (
    label.includes('program') ||
    label.includes('database') ||
    label.includes('logic')
  ) {
    return 'grid';
  }
  if (
    label.includes('calculus') ||
    label.includes('math') ||
    label.includes('economics') ||
    label.includes('chemistry')
  ) {
    return 'formula';
  }
  return 'bars';
}

export function formatWeeklyCountdown(periodEndsAt?: string | null) {
  if (!periodEndsAt) return '--';
  const diff = new Date(periodEndsAt).getTime() - Date.now();
  if (diff <= 0) return '00d 00h 00m';
  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return `${days.toString().padStart(2, '0')}d ${hours
    .toString()
    .padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
}

// Re-export all style tokens so components can reference them
export const studentStyles = StyleSheet.create({
  tabBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  tabBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: studentColors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 8,
    ...studentShadow,
  },
  tabBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
    gap: 3,
  },
  tabBarLabel: {
    fontFamily: 'Rubik',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: studentColors.white,
    borderWidth: 2,
    borderColor: studentColors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  leaderboardRowEmphasis: {
    backgroundColor: studentColors.surfaceSoft,
  },
});