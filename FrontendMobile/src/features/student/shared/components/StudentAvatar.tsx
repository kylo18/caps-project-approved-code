// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Avatar component for student UI with initials and color palette.
// ─────────────────────────────────────────────────────────────────────────────

import { StyleProp, Text, View, ViewStyle } from 'react-native';
import { avatarPalette } from '../studentTheme';

export type StudentAvatarProps = {
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
      className="items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: avatarPalette[index % avatarPalette.length],
        ...(style as object),
      }}
    >
      <Text className="font-sans font-bold text-[#0C092A]" style={{ fontSize: Math.max(14, size * 0.28) }}>
        {initials || 'ST'}
      </Text>
    </View>
  );
}