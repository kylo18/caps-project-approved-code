import { useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CapsActivityIndicator from '../src/features/core/components/CapsActivityIndicator';
import { apiRequest } from '../src/services/apiClient';
import { useTheme } from '../src/contexts/ThemeContext';
import { showToast } from '../src/hooks/useToast';
import loginBg from '../assets/login-bg.png';

export default function ResetPasswordScreen() {
  const { token, email } = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const isDark = theme === 'dark';

  const colors = useMemo(
    () => ({
      page: isDark ? '#0F0F0F' : '#F7F8FA',
      card: isDark ? '#141414' : '#FFFFFF',
      soft: isDark ? 'rgba(255,140,0,0.16)' : 'rgba(254,105,2,0.10)',
      text: isDark ? '#F5F5F5' : '#111827',
      muted: isDark ? '#A3A3A3' : '#6B7280',
      border: isDark ? '#2A2A2A' : '#DADDE5',
      input: isDark ? '#1F1F1F' : '#FFFFFF',
      primary: isDark ? '#FF8C00' : '#FE6902',
      success: '#10B981',
    }),
    [isDark]
  );

  const handleSubmit = async () => {
    if (!password) {
      showToast('Please enter a new password', 'error');
      return;
    }

    if (password.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    const resetEmail = Array.isArray(email) ? email[0] : email;
    const normalizedEmail = typeof resetEmail === 'string' ? resetEmail.trim().toLowerCase() : '';

    if (!normalizedEmail) {
      showToast('Reset link is missing the account email. Please request a new reset link.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest('/api/reset-password', {
        method: 'POST',
        body: {
          token: token as string,
          email: normalizedEmail,
          password,
          password_confirmation: confirmPassword,
        },
        auth: false,
      });

      showToast('Password reset successful!', 'success');
      setTimeout(() => {
        router.replace('/');
      }, 2000);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error && 'data' in error
        ? (error as { data?: { message?: string } }).data?.message || 'Failed to reset password'
        : 'Failed to reset password';
      showToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const HeaderActions = () => (
    <View style={{ position: 'absolute', top: 48, left: 24, right: 24, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
      <TouchableOpacity
        onPress={() => router.back()}
        activeOpacity={0.75}
        style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
      >
        <Ionicons name="arrow-back" size={21} color={colors.text} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={toggleTheme}
        activeOpacity={0.75}
        style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
      >
        <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={isDark ? '#FBBF24' : colors.text} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.page }}>
      <Image source={loginBg} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} resizeMode="cover" />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <HeaderActions />
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 120, paddingBottom: 40 }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 24,
              padding: 24,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 78,
                  height: 78,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.soft,
                  marginBottom: 18,
                }}
              >
                <Ionicons name="key" size={38} color={colors.primary} />
              </View>
              <Text style={{ color: colors.text, fontSize: 27, fontWeight: '800', textAlign: 'center' }}>
                Reset Password
              </Text>
              <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 10, textAlign: 'center' }}>
                Enter your new password below.
              </Text>
            </View>

            <View style={{ marginTop: 26 }}>
              {/* New Password */}
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>New Password</Text>
              <View
                style={{
                  minHeight: 54,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.input,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                  marginBottom: 20,
                }}
              >
                <Ionicons name="lock-closed-outline" size={20} color={colors.muted} />
                <TextInput
                  style={{ flex: 1, color: colors.text, fontSize: 15, paddingVertical: 14, paddingLeft: 10 }}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor={colors.primary}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.muted}
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm Password */}
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>Confirm Password</Text>
              <View
                style={{
                  minHeight: 54,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.input,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                }}
              >
                <Ionicons name="lock-closed-outline" size={20} color={colors.muted} />
                <TextInput
                  style={{ flex: 1, color: colors.text, fontSize: 15, paddingVertical: 14, paddingLeft: 10 }}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor={colors.primary}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: 4 }}>
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.muted}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={{
                  minHeight: 54,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isLoading ? '#9CA3AF' : colors.primary,
                  marginTop: 24,
                }}
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <CapsActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>Reset Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
