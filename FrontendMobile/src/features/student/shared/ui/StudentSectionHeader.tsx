// ─────────────────────────────────────────────────────────────────────────────
// StudentSectionHeader — row with title and optional action label/press.
// Exported from StudentUI as-is.
// ─────────────────────────────────────────────────────────────────────────────

import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { studentColors } from './studentTokens';

type SectionHeaderProps = {
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
    <View style={[styles.sectionHeader, style]}>
      <Text style={styles.sectionHeaderTitle}>{title}</Text>
      {actionLabel ? (
        <Pressable hitSlop={8} onPress={onActionPress}>
          <Text style={[styles.sectionHeaderAction, { color: actionColor }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderTitle: {
    color: '#0C092A',
    fontFamily: 'Rubik',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 28,
  },
  sectionHeaderAction: {
    fontFamily: 'Rubik',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});