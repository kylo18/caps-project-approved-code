import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../src/services/apiClient';
import { useTheme } from '../src/contexts/ThemeContext';
import { showToast } from '../src/hooks/useToast';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const isDark = theme === 'dark';

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

    setIsLoading(true);
    try {
      await apiRequest('/api/reset-password', {
        method: 'POST',
        body: {
          token: token as string,
          password,
          password_confirmation: confirmPassword,
        },
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

        <View className="mt-[120px] items-center">
          <Ionicons name="key" size={64} color="#FE6902" />
          <Text className={`text-[28px] font-bold text-gray-900 mt-4 text-center ${isDark ? 'text-white' : ''}`}>
            Reset Password
          </Text>
          <Text className={`text-sm text-gray-500 mt-3 text-center ${isDark ? 'text-gray-400' : ''}`}>
            Enter your new password
          </Text>
        </View>

        <View className="mt-12">
          <View className="mb-6">
            <Text className={`text-sm font-semibold text-gray-700 mb-2 ${isDark ? 'text-white' : ''}`}>New Password</Text>
            <View className={`flex-row items-center bg-white border border-gray-300 rounded-lg px-4 dark:bg-gray-800 dark:border-gray-600`}>
              <TextInput
                className={`flex-1 py-3.5 text-base text-gray-900 ${isDark ? 'text-white' : ''}`}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter new password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-6">
            <Text className={`text-sm font-semibold text-gray-700 mb-2 ${isDark ? 'text-white' : ''}`}>Confirm Password</Text>
            <View className={`flex-row items-center bg-white border border-gray-300 rounded-lg px-4 dark:bg-gray-800 dark:border-gray-600`}>
              <TextInput
                className={`flex-1 py-3.5 text-base text-gray-900 ${isDark ? 'text-white' : ''}`}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#999"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            className={`bg-[#FE6902] py-4 rounded-lg items-center mt-2 ${isLoading ? 'bg-gray-400' : ''}`}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text className="text-white text-base font-semibold">
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
