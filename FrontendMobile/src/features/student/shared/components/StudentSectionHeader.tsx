// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Section header with optional action button for student screens.
// ─────────────────────────────────────────────────────────────────────────────

import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { studentColors } from '../studentTheme';

export type StudentSectionHeaderProps = {
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
}: StudentSectionHeaderProps) {
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
    color: studentColors.text,
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