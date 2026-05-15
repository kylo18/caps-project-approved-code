import { useState, useEffect } from 'react';
import { apiRequest } from '../services/apiClient';
import { needsUpdate } from '../utils/versionUtils';
import Constants from 'expo-constants';

interface UseAppUpdateCheckResult {
  showModal: boolean;
  appVersion: string;
  requiredVersion: string;
  isForced: boolean;
  onDismiss: () => void;
}

export function useAppUpdateCheck(): UseAppUpdateCheckResult {
  const [showModal, setShowModal] = useState(false);
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [requiredVersion, setRequiredVersion] = useState('');
  const [isForced, setIsForced] = useState(false);

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const data = await apiRequest('/api/app-version');
        const serverVersion = data?.version || '';
        if (!serverVersion) return;

        const currentVersion = Constants.expoConfig?.version || '1.0.0';
        setAppVersion(currentVersion);
        setRequiredVersion(serverVersion);

        // Backend currently only returns { version }, no isForced flag.
        // Default to non-forced so users can skip.
        const forced = data?.isForced ?? false;
        setIsForced(forced);

        if (needsUpdate(currentVersion, serverVersion)) {
          setShowModal(true);
        }
      } catch {
        // Silently fail — version check is non-critical
      }
    };

    checkUpdate();
  }, []);

  const onDismiss = () => setShowModal(false);

  return { showModal, appVersion, requiredVersion, isForced, onDismiss };
}
