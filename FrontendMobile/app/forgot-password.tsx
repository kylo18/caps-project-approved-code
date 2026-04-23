import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../src/services/apiClient';
import { useTheme } from '../src/contexts/ThemeContext';
import { showToast } from '../src/hooks/useToast';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const isDark = theme === 'dark';

  const handleSubmit = async () => {
    if (!email.trim()) {
      showToast('Please enter your email address', 'error');
      return;
    }

    if (!email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/api/forgot-password', { email });
      setIsSent(true);
      showToast('Password reset link sent to your email', 'success');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to send reset link';
      showToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-gray-100"
      >
        <View className="flex-1 p-6">
          <TouchableOpacity onPress={toggleTheme} className="absolute top-12 right-6 z-10 p-2">
            <Ionicons
              name={isDark ? 'sunny' : 'moon'}
              size={24}
              color={isDark ? '#fff' : '#000'}
            />
          </TouchableOpacity>

          <View className="flex-1 justify-center items-center">
            <Ionicons name="mail-open" size={80} color="#10B981" />
            <Text className={`text-2xl font-bold text-gray-900 mt-6 text-center ${isDark ? 'text-white' : ''}`}>
              Check Your Email
            </Text>
            <Text className={`text-sm text-gray-500 mt-3 text-center mb-8 ${isDark ? 'text-gray-400' : ''}`}>
              We've sent a password reset link to {email}
            </Text>

            <TouchableOpacity
              className="w-full bg-[#FE6902] py-4 rounded-lg items-center"
              onPress={() => router.replace('/' as any)}
            >
              <Text className="text-white text-base font-semibold">Back to Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-4 p-3"
              onPress={() => {
                setIsSent(false);
                setEmail('');
              }}
            >
              <Text className="text-[#FE6902] text-sm font-semibold">Resend Email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-100'}`}
    >
      <View className="flex-1 p-6">
        <TouchableOpacity onPress={toggleTheme} className="absolute top-12 right-6 z-10 p-2">
          <Ionicons
            name={isDark ? 'sunny' : 'moon'}
            size={24}
            color={isDark ? '#fff' : '#000'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          className="absolute top-12 left-6 z-10 p-2"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>

        <View className="mt-[120px] items-center">
          <Ionicons name="lock-closed" size={64} color="#FE6902" />
          <Text className={`text-[28px] font-bold text-gray-900 mt-4 text-center ${isDark ? 'text-white' : ''}`}>
            Forgot Password?
          </Text>
          <Text className={`text-sm text-gray-500 mt-3 text-center ${isDark ? 'text-gray-400' : ''}`}>
            Enter your email address and we'll send you a link to reset your password
          </Text>
        </View>

        <View className="mt-12">
          <View className="mb-6">
            <Text className={`text-sm font-semibold text-gray-700 mb-2 ${isDark ? 'text-white' : ''}`}>Email Address</Text>
            <TextInput
              className={`bg-white border border-gray-300 rounded-lg px-4 py-3.5 text-base text-gray-900 dark:bg-gray-800 dark:border-gray-600 ${isDark ? 'text-white' : ''}`}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <TouchableOpacity
            className={`bg-[#FE6902] py-4 rounded-lg items-center ${isLoading ? 'bg-gray-400' : ''}`}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text className="text-white text-base font-semibold">
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
