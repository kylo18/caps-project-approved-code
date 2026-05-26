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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CapsActivityIndicator from '../src/features/core/components/CapsActivityIndicator';
import { apiRequest } from '../src/services/apiClient';
import { useTheme } from '../src/contexts/ThemeContext';
import { showToast } from '../src/hooks/useToast';
import loginBg from '../assets/login-bg.png';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
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

  const normalizedEmail = email.trim().toLowerCase();

  const handleSubmit = async () => {
    if (!normalizedEmail) {
      showToast('Please enter your email address', 'error');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest('/api/forgot-password', {
        method: 'POST',
        body: { email: normalizedEmail },
        auth: false,
      });
      setEmail(normalizedEmail);
      setIsSent(true);
      showToast('Password reset link sent to your email', 'success');
    } catch (error: unknown) {
      const errorMsg = error instanceof Error && 'data' in error
        ? (error as { data?: { message?: string } }).data?.message || 'Failed to send reset link'
        : 'Failed to send reset link';
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
                backgroundColor: isSent ? `${colors.success}18` : colors.soft,
                marginBottom: 18,
              }}
            >
              <Ionicons name={isSent ? 'mail-open' : 'lock-closed'} size={38} color={isSent ? colors.success : colors.primary} />
            </View>
            <Text style={{ color: colors.text, fontSize: 27, fontWeight: '800', textAlign: 'center' }}>
              {isSent ? 'Check Your Email' : 'Forgot Password?'}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 10, textAlign: 'center' }}>
              {isSent
                ? `We sent a password reset link to ${email}.`
                : "Enter your account email and we'll send a secure reset link."}
            </Text>
          </View>

          {!isSent ? (
            <View style={{ marginTop: 26 }}>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>Email Address</Text>
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
                <Ionicons name="mail-outline" size={20} color={colors.muted} />
                <TextInput
                  style={{ flex: 1, color: colors.text, fontSize: 15, paddingVertical: 14, paddingLeft: 10 }}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  selectionColor={colors.primary}
                />
              </View>

              <TouchableOpacity
                style={{
                  minHeight: 54,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isLoading ? '#9CA3AF' : colors.primary,
                  marginTop: 20,
                }}
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <CapsActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ marginTop: 26, gap: 12 }}>
              <TouchableOpacity
                style={{ minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }}
                onPress={() => router.replace('/')}
                activeOpacity={0.85}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>Back to Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ minHeight: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
                onPress={() => setIsSent(false)}
                activeOpacity={0.75}
              >
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '800' }}>Send Another Link</Text>
              </TouchableOpacity>
            </View>
          )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
