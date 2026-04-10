// Firebase Login Form Component
// Handles email/password and Google sign in

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  signInWithEmail,
  useGoogleAuth,
  getAuthErrorMessage,
  signInWithGooglePopup,
} from '../../services/firebaseAuthService';
import { studentColors } from '../../student/ui';

export default function FirebaseLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { request, response, signInWithGoogle } = useGoogleAuth();
  
  // Handle Google auth response
  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse();
    }
  }, [response]);
  
  const handleGoogleResponse = async () => {
    setIsLoading(true);
    const result = await signInWithGoogle();
    setIsLoading(false);
    
    if (result.success) {
      router.replace('/(auth)/(student)/dashboard');
    } else {
      Alert.alert('Login Failed', result.error);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    const result = await signInWithEmail(email, password);
    setIsLoading(false);

    if (result.success) {
      // Navigate to main app
      router.replace('/(auth)/(student)/dashboard');
    } else {
      Alert.alert('Login Failed', getAuthErrorMessage(result.code || ''));
    }
  };

  const handleGoogleLogin = async () => {
    // For web/browser environments, use popup
    if (Platform.OS === 'web') {
      setIsLoading(true);
      const result = await signInWithGooglePopup();
      setIsLoading(false);
      
      if (result.success) {
        router.replace('/(auth)/(student)/dashboard');
      } else {
        Alert.alert('Login Failed', result.error);
      }
      return;
    }
    
    // For native (iOS/Android), use expo-auth-session
    // This will trigger the useEffect above when response is received
    if (request) {
      await signInWithGoogle();
    } else {
      Alert.alert('Error', 'Google Sign-In is not ready yet. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Email Input */}
      <View style={styles.inputGroup}>
        <Ionicons name="mail-outline" size={20} color="#858494" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#858494"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* Password Input */}
      <View style={styles.inputGroup}>
        <Ionicons name="lock-closed-outline" size={20} color="#858494" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#858494"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
          <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#858494" />
        </Pressable>
      </View>

      {/* Forgot Password */}
      <Pressable onPress={() => router.push('/forgot-password')}>
        <Text style={styles.forgotPassword}>Forgot Password?</Text>
      </Pressable>

      {/* Login Button */}
      <Pressable
        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
        onPress={handleEmailLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={studentColors.white} />
        ) : (
          <Text style={styles.loginButtonText}>Log In</Text>
        )}
      </Pressable>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Google Sign In */}
      <Pressable
        style={[styles.googleButton, (isLoading || (!request && Platform.OS !== 'web')) && styles.googleButtonDisabled]}
        onPress={handleGoogleLogin}
        disabled={isLoading || (!request && Platform.OS !== 'web')}
      >
        <Ionicons name="logo-google" size={20} color="#0C092A" />
        <Text style={styles.googleButtonText}>
          {isLoading ? 'Signing in...' : 'Continue with Google'}
        </Text>
      </Pressable>

      {/* Register Link */}
      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>Don't have an account? </Text>
        <Pressable onPress={() => router.push('/register')}>
          <Text style={styles.registerLink}>Sign Up</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 16,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F3F6',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Rubik',
    fontSize: 15,
    color: '#0C092A',
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    fontFamily: 'Rubik',
    fontSize: 14,
    fontWeight: '500',
    color: studentColors.orange,
    textAlign: 'right',
  },
  loginButton: {
    backgroundColor: studentColors.orange,
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontFamily: 'Rubik',
    fontSize: 16,
    fontWeight: '600',
    color: studentColors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E6E2F4',
  },
  dividerText: {
    fontFamily: 'Rubik',
    fontSize: 14,
    color: '#858494',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: studentColors.white,
    borderRadius: 16,
    height: 56,
    borderWidth: 2,
    borderColor: '#E6E2F4',
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
  googleButtonText: {
    fontFamily: 'Rubik',
    fontSize: 15,
    fontWeight: '600',
    color: '#0C092A',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  registerText: {
    fontFamily: 'Rubik',
    fontSize: 14,
    color: '#858494',
  },
  registerLink: {
    fontFamily: 'Rubik',
    fontSize: 14,
    fontWeight: '600',
    color: studentColors.orange,
  },
});
