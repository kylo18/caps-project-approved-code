import { Platform } from 'react-native';

export const roleDarkColors = {
  page: '#0F0F0F',
  surface: '#1A1A1A',
  surfaceSoft: '#242424',
  surfaceMuted: '#202020',
  input: '#242424',
  border: '#2A2A2A',
  text: '#F5F5F5',
  muted: '#A3A3A3',
  mutedIcon: '#6F6F6F',
  accent: '#FE6902',
  accentStrong: '#FF8C00',
  overlay: 'rgba(0,0,0,0.66)',
  dangerSoft: '#2A1515',
};

export const roleLightColors = {
  page: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceSoft: '#F2F4F7',
  surfaceMuted: '#F9FAFB',
  input: '#FFFFFF',
  border: '#E7E8EF',
  text: '#111827',
  muted: '#6B7280',
  mutedIcon: '#B8BAC7',
  accent: '#FE6902',
  accentStrong: '#FE6902',
  overlay: 'rgba(15,15,15,0.42)',
  dangerSoft: '#FEE2E2',
};

export function getRoleThemeColors(isDark: boolean) {
  return isDark ? roleDarkColors : roleLightColors;
}

export function getRoleShadow(isDark: boolean) {
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
