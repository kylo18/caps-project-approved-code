import { View, Text, Modal, TouchableOpacity, Linking, Platform } from 'react-native';
import { useTheme } from '../../../../src/contexts/ThemeContext';

interface ForceUpdateModalProps {
  visible: boolean;
  appVersion: string;
  requiredVersion: string;
  isForced: boolean;
  onDismiss?: () => void;
}

export default function ForceUpdateModal({ visible, appVersion, requiredVersion, isForced, onDismiss }: ForceUpdateModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#1f2937' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    accent: '#FE6902',
  };

  const handleDismiss = () => {
    if (!isForced && onDismiss) {
      onDismiss();
    }
  };

  const handleUpdate = () => {
    const baseUrl = _getApiBaseUrl();
    const apkUrl = `${baseUrl}/download/caps.apk`;

    if (Platform.OS === 'android') {
      Linking.openURL(apkUrl);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View className="flex-1 bg-black/60 justify-center items-center">
        <View
          className="w-4/5 p-6 rounded-2xl"
          style={{ backgroundColor: colors.bg, elevation: 6 }}
        >
          {/* Update icon */}
          <View className="self-center mb-4">
            <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: isForced ? '#FEE2E2' : '#DBEAFE' }}>
              <Text className="text-3xl">{isForced ? '🔄' : '📦'}</Text>
            </View>
          </View>

          <Text className="text-xl font-bold text-center mb-2" style={{ color: colors.text }}>
            {isForced ? 'Update Required' : 'Update Available'}
          </Text>

          <Text className="text-sm text-center mb-1" style={{ color: colors.textSecondary }}>
            {isForced
              ? 'A new version of CAPS is required to continue.'
              : 'A new version of CAPS is available.'}
          </Text>

          <View className="flex-row justify-center gap-2 mb-5">
            <Text className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6', color: colors.textSecondary }}>
              Your version: {appVersion}
            </Text>
            <Text className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: isForced ? '#FEE2E2' : '#DBEAFE', color: isForced ? '#991b1b' : '#1e40af' }}>
              Required: {requiredVersion}
            </Text>
          </View>

          {isForced ? (
            <View className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-5">
              <Text className="text-xs" style={{ color: '#92400e' }}>
                ⚠️ This update is required to continue using the app. Please download and install the latest version.
              </Text>
            </View>
          ) : (
            <View className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5">
              <Text className="text-xs" style={{ color: '#1e40af' }}>
                💡 You can skip this update for now, but some features may not work properly.
              </Text>
            </View>
          )}

          <TouchableOpacity
            className="py-3.5 rounded-xl items-center mb-3"
            style={{ backgroundColor: colors.accent }}
            onPress={handleUpdate}
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-semibold">Download & Install Update</Text>
          </TouchableOpacity>

          {!isForced && (
            <TouchableOpacity
              className="py-3 rounded-xl items-center"
              onPress={handleDismiss}
              activeOpacity={0.7}
            >
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Skip for now
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

/** Resolves the server base URL from the Expo config extras */
function _getApiBaseUrl(): string {
  // Dynamic import to avoid top-level side effects
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Constants = require('expo-constants');
  const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;
  return (extra?.API_URL ?? 'http://localhost:8000').replace(/\/$/, '');
}