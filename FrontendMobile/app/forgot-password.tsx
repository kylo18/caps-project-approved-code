import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../src/services/apiClient';
import { useTheme } from '../src/contexts/ThemeContext';
import { showToast } from '../src/hooks/useToast';

// ─────────────────────────────────────────────────────────────────────────────
// File purpose: Password recovery screen that allows users to request a password
//   reset link by entering their registered email address. Displays a success
//   confirmation screen after the reset link is sent.
// Key sections:
//   - Email input form with validation
//   - Send Reset Link submission button
//   - Success confirmation screen (shown after email is sent) with
//     "Back to Login" and "Resend Email" options
//   - Theme toggle (light/dark mode)
//   - Back button to return to the login screen
// ─────────────────────────────────────────────────────────────────────────────

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
        style={[styles.container, isDark && styles.darkContainer]}
      >
        <View style={styles.content}>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
            <Ionicons
              name={isDark ? 'sunny' : 'moon'}
              size={24}
              color={isDark ? '#fff' : '#000'}
            />
          </TouchableOpacity>

          <View style={styles.successContainer}>
            <Ionicons name="mail-open" size={80} color="#10B981" />
            <Text style={[styles.successTitle, isDark && styles.darkText]}>
              Check Your Email
            </Text>
            <Text style={[styles.successDescription, isDark && styles.darkSubtext]}>
              We've sent a password reset link to {email}
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace('/' as any)}
            >
              <Text style={styles.primaryButtonText}>Back to Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => {
                setIsSent(false);
                setEmail('');
              }}
            >
              <Text style={styles.resendButtonText}>Resend Email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, isDark && styles.darkContainer]}
    >
      <View style={styles.content}>
        {/* Theme toggle */}
        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
          <Ionicons
            name={isDark ? 'sunny' : 'moon'}
            size={24}
            color={isDark ? '#fff' : '#000'}
          />
        </TouchableOpacity>

        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="lock-closed" size={64} color="#FE6902" />
          <Text style={[styles.title, isDark && styles.darkText]}>
            Forgot Password?
          </Text>
          <Text style={[styles.description, isDark && styles.darkSubtext]}>
            Enter your email address and we'll send you a link to reset your password
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark && styles.darkText]}>Email Address</Text>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
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
            style={[styles.primaryButton, isLoading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  darkContainer: {
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  themeToggle: {
    position: 'absolute',
    top: 48,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 24,
    zIndex: 10,
    padding: 8,
  },
  header: {
    marginTop: 120,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
  },
  form: {
    marginTop: 48,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
  },
  darkInput: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
    color: '#fff',
  },
  primaryButton: {
    backgroundColor: '#FE6902',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 24,
    textAlign: 'center',
  },
  successDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
    marginBottom: 32,
  },
  resendButton: {
    marginTop: 16,
    padding: 12,
  },
  resendButtonText: {
    color: '#FE6902',
    fontSize: 14,
    fontWeight: '600',
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#9ca3af',
  },
});
