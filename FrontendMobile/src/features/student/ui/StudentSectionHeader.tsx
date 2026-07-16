// ─────────────────────────────────────────────────────────────────────────────
// StudentSectionHeader — row with title and optional action label/press.
// Exported from StudentUI as-is.
// ─────────────────────────────────────────────────────────────────────────────

import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getStudentColors, studentColors } from './studentTokens';

export type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  actionColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function StudentSectionHeader({
  title,
  actionLabel,
  onActionPress,
  actionColor = studentColors.orange,
  style,
}: SectionHeaderProps) {
  const { theme } = useTheme();
  const colors = getStudentColors(theme === 'dark');
  const resolvedActionColor = actionColor === studentColors.orange ? colors.orange : actionColor;

  return (
    <View className="flex-row items-center justify-between" style={style}>
      <Text className="font-sans text-xl font-medium leading-7" style={{ color: colors.text }}>{title}</Text>
      {actionLabel ? (
        <Pressable hitSlop={8} onPress={onActionPress}>
          <Text className="font-sans text-sm font-medium leading-5" style={{ color: resolvedActionColor }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
