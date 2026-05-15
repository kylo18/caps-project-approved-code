import { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Platform, ActivityIndicator, Linking } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';
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
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
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

  const handleUpdate = async () => {
    if (downloading) return;
    if (Platform.OS !== 'android') return;

    setDownloading(true);
    setProgress(0);
    setError(null);

    try {
      const API_URL = Constants.expoConfig?.extra?.API_URL as string | undefined;
      const baseUrl = (API_URL ?? 'http://localhost:8000').replace(/\/$/, '');
      const apkUrl = `${baseUrl}/download/caps.apk`;
      const fileUri = FileSystem.cacheDirectory + 'CAPS.apk';

      const downloadResumable = FileSystem.createDownloadResumable(
        apkUrl,
        fileUri,
        {},
        (downloadProgress) => {
          const p = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setProgress(p);
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (!result?.uri) {
        throw new Error('Download failed — no file received.');
      }

      const contentUri = await FileSystem.getContentUriAsync(result.uri!);
      await Linking.openURL(contentUri);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed';
      setError(msg);
    } finally {
      setDownloading(false);
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

          {downloading ? (
            <View className="mb-3">
              <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb' }}>
                <View className="h-full rounded-full" style={{ width: `${progress * 100}%`, backgroundColor: colors.accent }} />
              </View>
              <Text className="text-xs text-center mt-2" style={{ color: colors.textSecondary }}>
                Downloading... {Math.round(progress * 100)}%
              </Text>
            </View>
          ) : error ? (
            <View className="bg-red-50 border border-red-100 rounded-xl p-3 mb-3">
              <Text className="text-xs text-center" style={{ color: '#991b1b' }}>
                {error}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            className="py-3.5 rounded-xl items-center mb-3"
            style={{ backgroundColor: downloading ? colors.textSecondary : colors.accent }}
            onPress={handleUpdate}
            disabled={downloading}
            activeOpacity={0.8}
          >
            {downloading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-semibold">Download & Install Update</Text>
            )}
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
