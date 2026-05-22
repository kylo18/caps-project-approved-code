import { useEffect, useState } from 'react';
import { BackHandler, NativeModules, View, Text, Modal, TouchableOpacity, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { showToast } from '../../../../src/hooks/useToast';
import CapsActivityIndicator from './CapsActivityIndicator';

type InstallState = 'idle' | 'downloading' | 'installing' | 'done';
type CapsAppControlModule = {
  canRequestPackageInstalls?: () => Promise<boolean>;
  openUnknownSourcesSettings?: () => void;
  restartApp?: () => void;
};

const CapsAppControl = NativeModules.CapsAppControl as CapsAppControlModule | undefined;
const APK_MIME_TYPE = 'application/vnd.android.package-archive';
const FLAG_GRANT_READ_URI_PERMISSION = 1;
const EXTRA_RETURN_RESULT = 'android.intent.extra.RETURN_RESULT';
const EXTRA_INSTALL_RESULT = 'android.intent.extra.INSTALL_RESULT';

const INSTALL_FAILURE_MESSAGES: Record<number, string> = {
  [-2]: 'Android rejected the downloaded APK as invalid. Please rebuild and upload the APK again.',
  [-3]: 'Android could not read the downloaded APK. Please try downloading the update again.',
  [-4]: 'There is not enough storage space to install the update.',
  [-7]: 'Android blocked this update because the installed app was signed with a different key.',
  [-16]: 'This APK does not support your phone architecture.',
  [-25]: 'Android blocked this install because the APK version is older than the installed app.',
};

function getInstallFailureMessage(intentResult: { resultCode: number; extra?: object }) {
  if (intentResult.resultCode === IntentLauncher.ResultCode.Canceled) {
    return 'Installation was canceled before Android installed the update.';
  }

  const extra = intentResult.extra as Record<string, unknown> | undefined;
  const rawInstallResult = extra?.[EXTRA_INSTALL_RESULT];
  const installResult = typeof rawInstallResult === 'number'
    ? rawInstallResult
    : Number(rawInstallResult);

  if (Number.isFinite(installResult) && INSTALL_FAILURE_MESSAGES[installResult]) {
    return INSTALL_FAILURE_MESSAGES[installResult];
  }

  return 'Android did not confirm that the update was installed. Please try again.';
}

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
  const [installState, setInstallState] = useState<InstallState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const colors = {
    bg: isDark ? '#1f2937' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    accent: '#FE6902',
  };

  useEffect(() => {
    if (!visible) {
      setInstallState('idle');
      setProgress(0);
      setError(null);
    }
  }, [visible]);

  const handleDismiss = () => {
    if (!isForced && onDismiss) {
      onDismiss();
    }
  };

  const handleRestart = () => {
    if (Platform.OS === 'android' && CapsAppControl?.restartApp) {
      CapsAppControl.restartApp();
      return;
    }

    BackHandler.exitApp();
  };

  const handleUpdate = async () => {
    if (installState !== 'idle') return;
    if (Platform.OS !== 'android') return;

    setError(null);

    try {
      const canInstall = await CapsAppControl?.canRequestPackageInstalls?.();
      if (canInstall === false) {
        const msg = 'Allow CAPS to install app updates, then return here and tap download again.';
        setError(msg);
        showToast(msg, 'info');
        CapsAppControl?.openUnknownSourcesSettings?.();
        return;
      }

      setInstallState('downloading');
      setProgress(0);

      const API_URL = Constants.expoConfig?.extra?.API_URL as string | undefined;
      const baseUrl = (API_URL ?? 'http://localhost:8000').replace(/\/$/, '');
      const versionTag = requiredVersion || 'latest';
      const safeVersionTag = versionTag.replace(/[^0-9A-Za-z._-]/g, '') || 'latest';
      const apkUrl = `${baseUrl}/download/caps.apk?v=${encodeURIComponent(versionTag)}`;

      if (!FileSystem.cacheDirectory) {
        throw new Error('App cache directory is unavailable.');
      }

      const fileUri = `${FileSystem.cacheDirectory}CAPS-${safeVersionTag}.apk`;
      await FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => undefined);

      const downloadResumable = FileSystem.createDownloadResumable(
        apkUrl,
        fileUri,
        {},
        (downloadProgress) => {
          const expectedBytes = downloadProgress.totalBytesExpectedToWrite;
          const p = expectedBytes > 0 ? downloadProgress.totalBytesWritten / expectedBytes : 0;
          setProgress(p);
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (!result?.uri) {
        throw new Error('Download failed — no file received.');
      }

      setInstallState('installing');

      const contentUri = await FileSystem.getContentUriAsync(result.uri!);
      const intentResult = await IntentLauncher.startActivityAsync('android.intent.action.INSTALL_PACKAGE', {
        data: contentUri,
        type: APK_MIME_TYPE,
        flags: FLAG_GRANT_READ_URI_PERMISSION,
        extra: {
          [EXTRA_RETURN_RESULT]: true,
        },
      });

      if (intentResult.resultCode === IntentLauncher.ResultCode.Success) {
        showToast('Update installed. Restart CAPS to apply it.', 'success');
        setInstallState('done');
        return;
      }

      throw new Error(getInstallFailureMessage(intentResult));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed';
      setError(msg);
      showToast(msg, 'error');
      setInstallState('idle');
    }
  };

  const isBusy = installState !== 'idle' && installState !== 'done';

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
          {installState === 'done' ? (
            <>
              <View className="self-center mb-4">
                <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: '#DCFCE7' }}>
                  <Text className="text-3xl">✅</Text>
                </View>
              </View>

              <Text className="text-xl font-bold text-center mb-2" style={{ color: colors.text }}>
                Update Ready
              </Text>

              <Text className="text-sm text-center mb-5" style={{ color: colors.textSecondary }}>
                The update has been installed. Please restart the app to apply the new version.
              </Text>

              <TouchableOpacity
                className="py-3.5 rounded-xl items-center mb-3"
                style={{ backgroundColor: colors.accent }}
                onPress={handleRestart}
                activeOpacity={0.8}
              >
                <Text className="text-white text-base font-semibold">Close & Restart</Text>
              </TouchableOpacity>

              {!isForced && (
                <TouchableOpacity
                  className="py-3 rounded-xl items-center"
                  onPress={handleDismiss}
                  activeOpacity={0.7}
                >
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>
                    Later
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
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

              {installState === 'downloading' ? (
                <View className="mb-3">
                  <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb' }}>
                    <View className="h-full rounded-full" style={{ width: `${progress * 100}%`, backgroundColor: colors.accent }} />
                  </View>
                  <Text className="text-xs text-center mt-2" style={{ color: colors.textSecondary }}>
                    Downloading... {Math.round(progress * 100)}%
                  </Text>
                </View>
              ) : installState === 'installing' ? (
                <View className="mb-3 items-center">
                  <CapsActivityIndicator size="large" color="#FE6902" />
                  <Text className="text-xs mt-3" style={{ color: colors.textSecondary }}>
                    Preparing installation...
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
                style={{ backgroundColor: isBusy ? colors.textSecondary : colors.accent }}
                onPress={handleUpdate}
                disabled={isBusy}
                activeOpacity={0.8}
              >
                {installState === 'installing' ? (
                  <CapsActivityIndicator size="small" color="#fff" />
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
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
