// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Segmented control / tab switcher for student filters.
//          Orange-themed pill-style toggle for period/filter selection.
// ─────────────────────────────────────────────────────────────────────────────

import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { studentColors } from '../studentTheme';

export type StudentSegmentedControlProps<T extends string> = {
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
};

export function StudentSegmentedControl<T extends string>({
  value,
  options,
  onChange,
  style,
}: StudentSegmentedControlProps<T>) {
  return (
    <View style={[styles.segmentedControl, style]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segmentButton, active ? styles.segmentButtonActive : null]}
          >
            <Text
              style={[
                styles.segmentButtonText,
                active ? styles.segmentButtonTextActive : null,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: studentColors.orangeDark,
    borderRadius: 24,
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#FFC48D',
  },
  segmentButtonText: {
    color: 'rgba(255,255,255,0.88)',
    fontFamily: 'Rubik',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  segmentButtonTextActive: {
    color: studentColors.orangeDark,
    fontWeight: '700',
  },
});