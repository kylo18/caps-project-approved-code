import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ visible, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }: ConfirmModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#1f2937' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View className="w-4/5 p-6 rounded-2xl" style={{ backgroundColor: colors.bg, elevation: 4 }}>
          <Text className="text-lg font-bold mb-2" style={{ color: colors.text }}>{title}</Text>
          <Text className="text-sm leading-5 mb-5" style={{ color: colors.textSecondary }}>{message}</Text>
          <View className="flex-row justify-end gap-3">
            <TouchableOpacity className="py-2.5 px-4 rounded-lg bg-gray-100" onPress={onCancel} activeOpacity={0.7}>
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity className="py-2.5 px-4 rounded-lg" style={{ backgroundColor: '#FE6902' }} onPress={onConfirm} activeOpacity={0.8}>
              <Text className="text-white text-sm font-semibold">{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
