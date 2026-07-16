// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Segmented control / tab switcher for student filters.
//          Orange-themed pill-style toggle for period/filter selection.
// ─────────────────────────────────────────────────────────────────────────────

import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';

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
    <View className="flex-row bg-primary-dark rounded-3xl p-1 gap-1" style={style}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={`flex-1 rounded-[20px] py-2 px-3 items-center justify-center ${active ? 'bg-[#FFC48D]' : ''}`}
          >
            <Text className={`font-sans text-sm leading-5 ${active ? 'text-primary-dark font-bold' : 'text-white/90 font-medium'}`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}