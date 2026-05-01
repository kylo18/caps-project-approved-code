// ─────────────────────────────────────────────────────────────────────────────
// Design tokens for student-facing UI.
// Centralizes all color, radius, shadow, and palette constants so they can
// be reused across extracted student components without importing the full
// StudentUI barrel. Replaces the hardcoded studentColors export.
// ─────────────────────────────────────────────────────────────────────────────

import { Platform } from 'react-native';

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

export const avatarPalette = ['#FFE17B', '#FFD4EA', '#D9DCFF', '#D6F4D2', '#FFD0B1'];