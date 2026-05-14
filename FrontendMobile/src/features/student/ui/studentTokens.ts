// ─────────────────────────────────────────────────────────────────────────────
// Design tokens for student-facing UI.
// Centralizes all color, radius, shadow, and palette constants so they can
// be reused across extracted student components without importing the full
// StudentUI barrel. Replaces the hardcoded studentColors export.
// ─────────────────────────────────────────────────────────────────────────────

import { Platform } from 'react-native';

export const studentColors = {
  orange: '#FE6902',
  orangeDark: '#D95D00',
  orangeSoft: '#FFE2C2',
  orangeCard: '#FFF3E6',
  white: '#FFFFFF',
  text: '#0C092A',
  textSoft: '#858494',
  border: '#E7E8EF',
  borderSoft: '#F2F4F7',
  pink: '#FFE1E8',
  pinkSoft: '#FF6B8A',
  blue: '#C4D0FB',
  surface: '#F7F8FA',
  surfaceSoft: '#F2F4F7',
  pale: '#F6F7FB',
  success: '#86D2A8',
  gold: '#FFD45C',
  silver: '#C9CBD7',
  bronze: '#D89757',
};

export type StudentThemeColors = typeof studentColors & {
  page: string;
  card: string;
  cardSoft: string;
  header: string;
  headerWarm: string;
  headerTextSoft: string;
  tab: string;
  mutedIcon: string;
  statsCard: string;
  examCard: string;
  examText: string;
  overlay: string;
  glow: string;
};

export const studentLightColors: StudentThemeColors = {
  ...studentColors,
  page: '#F7F8FA',
  card: '#FFFFFF',
  cardSoft: '#F2F4F7',
  header: '#FE6902',
  headerWarm: '#FFF1E9',
  headerTextSoft: '#FFF1D6',
  tab: '#FFFFFF',
  mutedIcon: '#B8BAC7',
  statsCard: '#FFF1E9',
  examCard: '#FFE1E8',
  examText: '#7A263C',
  overlay: 'rgba(15,15,15,0.42)',
  glow: 'rgba(254,105,2,0.16)',
};

export const studentDarkColors: StudentThemeColors = {
  ...studentColors,
  orange: '#FF8C00',
  orangeDark: '#FF8C00',
  orangeSoft: '#3A260D',
  orangeCard: '#1E1506',
  white: '#F8F8F8',
  text: '#F5F5F5',
  textSoft: '#A3A3A3',
  border: '#2A2A2A',
  borderSoft: '#242424',
  pink: '#1C1214',
  pinkSoft: '#FF6B8A',
  blue: '#252C45',
  surface: '#0F0F0F',
  surfaceSoft: '#242424',
  pale: '#1A1A1A',
  success: '#4ADE80',
  gold: '#FFD45C',
  silver: '#A8ADB8',
  bronze: '#D89757',
  page: '#0F0F0F',
  card: '#1A1A1A',
  cardSoft: '#242424',
  header: '#0F0F0F',
  headerWarm: '#1A1008',
  headerTextSoft: '#FFD7BC',
  tab: '#141414',
  mutedIcon: '#6F6F6F',
  statsCard: '#1E1506',
  examCard: '#1C1214',
  examText: '#FFE8ED',
  overlay: 'rgba(0,0,0,0.66)',
  glow: 'rgba(255,140,0,0.24)',
};

export function getStudentColors(isDark: boolean): StudentThemeColors {
  return isDark ? studentDarkColors : studentLightColors;
}

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

export function getStudentShadow(isDark: boolean) {
  return Platform.select({
    android: { elevation: isDark ? 2 : 5 },
    default: {
      shadowColor: isDark ? '#000000' : '#062B2D',
      shadowOffset: { width: 0, height: isDark ? 8 : 12 },
      shadowOpacity: isDark ? 0.22 : 0.1,
      shadowRadius: isDark ? 18 : 24,
    },
  }) ?? {};
}

export const avatarPalette = ['#FFE17B', '#FFD4EA', '#D9DCFF', '#D6F4D2', '#FFD0B1'];
