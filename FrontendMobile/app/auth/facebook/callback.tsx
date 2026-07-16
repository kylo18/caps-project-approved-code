import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { apiRequest } from '../../../src/services/apiClient';
import { showToast } from '../../../src/hooks/useToast';
import { setCredentials } from '../../../src/store/slices/authSlice';
import { useDispatch } from 'react-redux';
import { getDashboardRoute } from '../../../src/utils/roleValidation';

export default function FacebookCallback() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{
    social_token?: string | string[];
    social_error?: string | string[];
    message?: string | string[];
  }>();
  const dispatch = useDispatch();

  useEffect(() => {
    const getParam = (value?: string | string[]) => Array.isArray(value) ? value[0] : value;
    const token = getParam(searchParams.social_token);
    const error = getParam(searchParams.social_error);
    const message = getParam(searchParams.message);

    if (error) {
      showToast(message || 'Facebook sign in failed', 'error');
      router.replace('/');
      return;
    }

    if (!token) {
      showToast('No authentication token received', 'error');
      router.replace('/');
      return;
    }

    (async () => {
      try {
        await SecureStore.setItemAsync('token', token);
        const user = await apiRequest('/api/user/profile');
        await SecureStore.setItemAsync('user', JSON.stringify(user));
        await SecureStore.setItemAsync('rememberMe', 'true');
        dispatch(setCredentials({ user, token }));
        const route = getDashboardRoute(user.roleID ?? user.roleId);
        router.replace(route);
      } catch {
        showToast('Failed to complete sign in', 'error');
        router.replace('/');
      }
    })();
  }, []);

  return null;
}
