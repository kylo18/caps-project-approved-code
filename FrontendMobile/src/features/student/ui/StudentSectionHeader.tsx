// ─────────────────────────────────────────────────────────────────────────────
// StudentSectionHeader — row with title and optional action label/press.
// Exported from StudentUI as-is.
// ─────────────────────────────────────────────────────────────────────────────

import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { studentColors } from './studentTokens';

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
  return (
    <View className="flex-row items-center justify-between" style={style}>
      <Text className="font-sans text-[#0C092A] text-xl font-medium leading-7">{title}</Text>
      {actionLabel ? (
        <Pressable hitSlop={8} onPress={onActionPress}>
          <Text className="font-sans text-sm font-medium leading-5" style={{ color: actionColor }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}