import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { apiRequest } from '../src/services/apiClient';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../src/store/slices/authSlice';
import { getDashboardRoute } from '../src/utils/roleValidation';
import { useTheme } from '../src/contexts/ThemeContext';
import { showToast } from '../src/hooks/useToast';
import {
  isBiometricAvailable,
  authenticateWithBiometrics,
} from '../src/services/biometricAuthService';
import {
  registerForPushNotificationsAsync,
  registerPushTokenWithBackend,
} from '../src/services/pushNotificationService';
import {
  useGoogleAuth,
  signInWithGooglePopup,
} from '../src/services/googleAuthService';
import AnimatedCapsLoader from '../src/features/core/components/AnimatedCapsLoader';


// ─────────────────────────────────────────────────────────────────────────────
// App entry point — Login Screen
// Displays branded login form with university/college logos, user code +
// password fields, OAuth (Google/Facebook), and role-based routing after auth.
// ─────────────────────────────────────────────────────────────────────────────
import loginBg from '../assets/login-bg.png';
import univLogo from '../assets/univLogo.png';
import collegeLogo from '../assets/college-logo.png';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  // ── Form state ─────────────────────────────────────────────────────────
  const [userCode, setUserCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUserCodeFocused, setIsUserCodeFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  const { request, signInWithGoogle } = useGoogleAuth();

  const router = useRouter();
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Restore persistent session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [token, userJson, rememberMeStored, biometricEnabled] = await Promise.all([
          SecureStore.getItemAsync('token'),
          SecureStore.getItemAsync('user'),
          SecureStore.getItemAsync('rememberMe'),
          SecureStore.getItemAsync('biometricEnabled'),
        ]);

        if (token && userJson && rememberMeStored === 'true') {
          const user = JSON.parse(userJson);

          // Validate token is still active before auto-login (skip if offline)
          const net = await NetInfo.fetch();
          const isOnline = net.isConnected ?? true;
          if (isOnline) {
            try {
              await apiRequest('/api/user/profile');
            } catch (err: any) {
              if (err.status === 401) {
                // Token expired — global handler already cleared storage,
                // just stop the spinner so the login form appears.
                setIsRestoringSession(false);
                return;
              }
              // Other errors (network, 5xx): still attempt auto-login with cached data
            }
          }

          if (biometricEnabled === 'true') {
            const bioAvailable = await isBiometricAvailable();
            if (bioAvailable) {
              const success = await authenticateWithBiometrics('Use Face ID / fingerprint to sign in to CAPS');
              if (success) {
                dispatch(setCredentials({ user, token }));
                routeBasedOnRole(user.roleID ?? user.roleId);
                return;
              } else {
                // Biometric cancelled/failed — stay on login screen
                setIsRestoringSession(false);
                return;
              }
            }
          }

          dispatch(setCredentials({ user, token }));
          routeBasedOnRole(user.roleID ?? user.roleId);
        } else {
          // If rememberMe is false or missing, clear stored credentials
          if (rememberMeStored === 'false') {
            await SecureStore.deleteItemAsync('token');
            await SecureStore.deleteItemAsync('user');
          }
          setIsRestoringSession(false);
        }
      } catch (e) {
        setIsRestoringSession(false);
      }
    };

    restoreSession();
  }, []);

  // ── Login: authenticates with user code + password, stores token, routes by role ──
  const handleLogin = async () => {
    setError('');
    if (!userCode.trim() || !password.trim()) {
      showToast('Please enter both ID Code and Password.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiRequest('/api/login', { method: 'POST', body: { userCode, password } });
      const { token, user } = response;
      await SecureStore.setItemAsync('token', token);
      await SecureStore.setItemAsync('user', JSON.stringify(user));
      await SecureStore.setItemAsync('rememberMe', rememberMe ? 'true' : 'false');

      // Push notifications — fail silently so login still works
      try {
        const pushResult = await registerForPushNotificationsAsync();
        if (pushResult.token) {
          await registerPushTokenWithBackend(pushResult.token);
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Push notification setup failed';
        console.warn('Push notification error:', errMsg);
        showToast(`Push notifications: ${errMsg}`, 'info');
      }

      // Prompt to enable biometric auth on first successful login with Remember Me
      if (rememberMe) {
        const biometricEnabled = await SecureStore.getItemAsync('biometricEnabled');
        if (biometricEnabled === null) {
          const bioAvailable = await isBiometricAvailable();
          if (bioAvailable) {
            Alert.alert(
              'Enable Biometric Login?',
              'Use Face ID or fingerprint for faster sign-in next time.',
              [
                { text: 'Not Now', style: 'cancel' },
                {
                  text: 'Enable',
                  onPress: async () => {
                    await SecureStore.setItemAsync('biometricEnabled', 'true');
                    showToast('Biometric login enabled', 'success');
                  },
                },
              ]
            );
          }
        }
      }

      dispatch(setCredentials({ user, token }));
      routeBasedOnRole(user.roleID ?? user.roleId);
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMsg = err.data?.message || err.message || 'Something went wrong.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ── OAuth: Google / Facebook (Backend) ──
  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    setIsLoading(true);
    try {
      if (provider === 'google') {
        let result;
        if (Platform.OS === 'web') {
          result = await signInWithGooglePopup();
        } else {
          result = await signInWithGoogle();
        }

        if (!result.success || !result.token) {
          showToast(result.error || 'Google sign in failed', 'error');
          return;
        }

        // Mobile flow returns user; web flow only returns token
        let user = result.user;
        if (!user) {
          await SecureStore.setItemAsync('token', result.token);
          const profileRes = await apiRequest('/api/user/profile');
          user = profileRes;
        }

        await SecureStore.setItemAsync('token', result.token);
        await SecureStore.setItemAsync('user', JSON.stringify(user));
        await SecureStore.setItemAsync('rememberMe', 'true');

        const pushResult = await registerForPushNotificationsAsync();
        if (pushResult.token) {
          await registerPushTokenWithBackend(pushResult.token);
        }

        dispatch(setCredentials({ user: user!, token: result.token }));
        routeBasedOnRole(user!.roleID ?? user!.roleId);
        return;
      }

      // Facebook: use backend OAuth redirect via web browser
      const API_URL = Constants.expoConfig?.extra?.API_URL || process.env.EXPO_PUBLIC_API_URL;
      const result = await WebBrowser.openAuthSessionAsync(
        `${API_URL}/api/auth/${provider}/redirect`,
        'caps://auth/callback'
      );
      if (result.type === 'success') {
        const token = extractTokenFromUrl(result.url);
        if (!token) {
          showToast('OAuth login failed', 'error');
          return;
        }
        await SecureStore.setItemAsync('token', token);
        const response = await apiRequest('/api/user/profile');
        const user = response;
        await SecureStore.setItemAsync('user', JSON.stringify(user));
        await SecureStore.setItemAsync('rememberMe', 'true');
        const pushResult = await registerForPushNotificationsAsync();
        if (pushResult.token) {
          await registerPushTokenWithBackend(pushResult.token);
        }
        dispatch(setCredentials({ user, token }));
        routeBasedOnRole(user.roleID ?? user.roleId);
      }
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'OAuth login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const extractTokenFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.hash.substring(1));
      return params.get('token') || urlObj.searchParams.get('token');
    } catch { return null; }
  };

  const routeBasedOnRole = (roleID: number) => {
    const route = getDashboardRoute(roleID);
    router.replace(route);
  };

  const colors = {
    bg: isDark ? '#000' : '#ffffff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#d1d5db',
    inputBg: isDark ? '#000' : '#fff',
    primary: '#FE6902', // Brand orange — use this for focused/active states
  };

  const hasUser = (val: string, focused: boolean) => val.length > 0 || focused;

  if (isRestoringSession) {
    return (
      <View className="flex-1 bg-[#242424]">
        <Image source={loginBg} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} resizeMode="cover" />
        <View className="flex-1 justify-center items-center bg-black/55 p-6">
          <AnimatedCapsLoader
            size="lg"
            color="#FFFFFF"
            accentColor={colors.primary}
            subtitle="Preparing your CAPS experience..."
          />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#242424]">
      {/* Login Background Image */}
      <Image source={loginBg} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} resizeMode="cover" />

      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 0 }} keyboardShouldPersistTaps="handled" bounces={false}>

          {/* ===== HEADER - h-60 (240px) with gradient ===== */}
          <View className="h-60 px-4 pt-11 pb-12" style={{ backgroundColor: isDark ? '#000' : '#242424' }}>
            {/* Top bar */}
            <View className="flex-row justify-between items-center px-4">
              <View className="flex-row items-center">
                {/* Actual logos from original project */}
                <Image source={univLogo} className="w-8 h-8 mr-2" />
                <Image source={collegeLogo} className="w-8 h-8 mr-2" />
                <TouchableOpacity onPress={toggleTheme} className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} activeOpacity={0.7}>
                  <Ionicons name={isDark ? 'sunny' : 'moon'} size={14} color={isDark ? '#FBBF24' : '#fff'} />
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center">
                <Text className="text-white/80 text-xs mr-2">{"Don't have an account?"}</Text>
                <TouchableOpacity onPress={() => router.push('/register')} className="px-3.5 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} activeOpacity={0.7}>
                  <Text className="text-white text-sm font-medium">Sign up</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* CAPS Title - exactly 2 lines, fits mobile */}
            <View className="items-center mt-4 gap-1 w-full">
              <Text className="text-white text-2xl font-black text-center tracking-wide leading-8 text-shadow text-shadow-sm" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                <Text className="text-primary text-3xl font-black tracking-wider">C</Text>OMPREHENSIVE <Text className="text-primary text-3xl font-black tracking-wider">A</Text>SSESSMENT
              </Text>
              <Text className="text-white text-2xl font-black text-center tracking-wide leading-8" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                AND <Text className="text-primary text-3xl font-black tracking-wider">P</Text>REPARATION <Text className="text-primary text-3xl font-black tracking-wider">S</Text>YSTEM
              </Text>
            </View>
          </View>

          {/* ===== CURVE + LOGIN CARD ===== */}
          <View className="flex-1" style={{ backgroundColor: isDark ? '#000' : '#242424' }}>
            <View className="flex-1 px-6 pt-7 pb-6 rounded-[34px] -mt-5" style={{ backgroundColor: colors.bg }}>
              <Text className="text-center text-xl font-black tracking-wide mb-1.5 leading-7" style={{ color: colors.text }}>LOG IN ACCOUNT</Text>
              <Text className="text-center text-sm leading-5 mb-2.5" style={{ color: colors.textSecondary }}>
                Welcome! Please enter your code and password to access your account.
              </Text>

              <View className="mt-2 mb-3">
                {/* User Code */}
                <View className="mb-3 mt-2">
                  <View className="relative border rounded-xl min-h-[46px] justify-center py-0" style={{ backgroundColor: colors.inputBg, borderColor: isUserCodeFocused ? colors.primary : colors.border }}>
                    <TextInput className="px-4 py-2 text-sm" style={{ color: colors.text, height: 46 }} value={userCode} onChangeText={setUserCode} onFocus={() => setIsUserCodeFocused(true)} onBlur={() => setIsUserCodeFocused(false)} placeholder="" autoCapitalize="none" autoCorrect={false} />
                    <Text className="absolute z-10 px-1 text-sm" style={{
                      backgroundColor: colors.inputBg,
                      top: hasUser(userCode, isUserCodeFocused) ? 0 : 14,
                      fontSize: hasUser(userCode, isUserCodeFocused) ? 10 : 14,
                      left: hasUser(userCode, isUserCodeFocused) ? 8 : 16,
                      paddingHorizontal: 4,
                      color: isUserCodeFocused ? colors.primary : colors.textSecondary,
                    }}>
                      Instructor Code/Student ID Number
                    </Text>
                  </View>
                </View>

                {/* Password */}
                <View className="mb-3">
                  <View className="relative border rounded-xl min-h-[46px] justify-center py-0" style={{ backgroundColor: colors.inputBg, borderColor: isPasswordFocused ? colors.primary : colors.border }}>
                    <TextInput className="px-4 py-2 pr-12 text-sm" style={{ color: colors.text, height: 46 }} value={password} onChangeText={setPassword} onFocus={() => setIsPasswordFocused(true)} onBlur={() => setIsPasswordFocused(false)} placeholder="" secureTextEntry={!showPassword} autoCapitalize="none" autoComplete="current-password" />
                    <Text className="absolute z-10 px-1 text-sm" style={{
                      backgroundColor: colors.inputBg,
                      top: hasUser(password, isPasswordFocused) ? 0 : 14,
                      fontSize: hasUser(password, isPasswordFocused) ? 10 : 14,
                      left: hasUser(password, isPasswordFocused) ? 8 : 16,
                      paddingHorizontal: 4,
                      color: isPasswordFocused ? colors.primary : colors.textSecondary,
                    }}>
                      Password
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 p-1 z-20"
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye-outline'} size={22} color={showPassword ? colors.primary : colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {error ? <Text className="text-red-500 text-xs text-center mt-2 mb-1">{error}</Text> : null}

                {/* Remember Me */}
                <TouchableOpacity
                  className="flex-row items-center gap-2 mt-1 mb-2"
                  onPress={() => setRememberMe((v) => !v)}
                  activeOpacity={0.8}
                >
                  <View className="w-[18px] h-[18px] rounded border-2 items-center justify-center" style={{ borderColor: colors.primary, backgroundColor: rememberMe ? colors.primary : 'transparent' }}>
                    {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>Remember me</Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity className="flex-row items-center justify-center py-3 rounded-xl mt-3 mb-2" style={{ backgroundColor: colors.primary }} onPress={handleLogin} disabled={isLoading} activeOpacity={0.9}>
                  {isLoading ? (
                    <AnimatedCapsLoader size="sm" color="#FFFFFF" accentColor="#FFD2B2" />
                  ) : <Text className="text-white text-base font-bold">LOG IN</Text>}
                </TouchableOpacity>

                {/* Forgot */}
                <TouchableOpacity onPress={() => router.push('/forgot-password')} activeOpacity={0.7}>
                  <Text className="text-primary text-sm text-center mt-2 mb-3">Forgot your password?</Text>
                </TouchableOpacity>

                {/* Or divider */}
                <View className="items-center mb-4"><Text className="text-gray-500 text-xs">or continue with</Text></View>

                {/* OAuth */}
                <View className="flex-row gap-3 mb-6">
                  <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-xl border"
                    style={{ borderColor: colors.border, backgroundColor: colors.inputBg, opacity: (!request && Platform.OS !== 'web') || isLoading ? 0.5 : 1 }}
                    onPress={() => handleOAuthLogin('google')}
                    activeOpacity={0.7}
                    disabled={(!request && Platform.OS !== 'web') || isLoading}
                  >
                    <Ionicons name="logo-google" size={18} color={colors.text} />
                    <Text className="text-sm font-medium" style={{ color: colors.text }}>Google</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-xl border"
                    style={{ borderColor: colors.border, backgroundColor: colors.inputBg }}
                    onPress={() => handleOAuthLogin('facebook')}
                    activeOpacity={0.7}
                  >
                    <FontAwesome name="facebook" size={18} color="#1877F2" />
                    <Text className="text-sm font-medium" style={{ color: colors.text }}>Facebook</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text className="text-center text-gray-500 text-xs mt-2">Developed by <Text className="text-primary">Team Caps</Text></Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}


