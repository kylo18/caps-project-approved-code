// ─────────────────────────────────────────────────────────────────────────────
// StudentAvatar — circular initials badge with color from avatarPalette.
// Exported from StudentUI as-is.
// ─────────────────────────────────────────────────────────────────────────────

import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { avatarPalette } from './studentTokens';

type StudentAvatarProps = {
  label?: string;
  size?: number;
  index?: number;
  style?: StyleProp<ViewStyle>;
};

export function StudentAvatar({
  label = 'ST',
  size = 56,
  index = 0,
  style,
}: StudentAvatarProps) {
  const initials = label
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: avatarPalette[index % avatarPalette.length],
        },
        style,
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: Math.max(14, size * 0.28) }]}>
        {initials || 'ST'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#0C092A',
    fontFamily: 'Rubik',
    fontWeight: '700',
  },
});