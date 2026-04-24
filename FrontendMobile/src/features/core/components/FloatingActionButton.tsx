import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

type FloatingActionButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  bottom?: number;
  right?: number;
  backgroundColor?: string;
  disabled?: boolean;
};

export default function FloatingActionButton({
  icon,
  label,
  onPress,
  bottom = 96,
  right = 20,
  backgroundColor = '#FE6902',
  disabled = false,
}: FloatingActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="flex-row items-center px-5 py-3.5 rounded-full border border-white/20"
      style={({ pressed }) => [
        {
          position: 'absolute',
          right,
          bottom,
          zIndex: 1000,
          backgroundColor,
          opacity: disabled ? 0.6 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
        },
      ]}
    >
      <Ionicons name={icon} size={18} color="#FFFFFF" />
      <View className="ml-2">
        <Text className="text-white text-sm font-bold">{label}</Text>
      </View>
    </Pressable>
  );
}
