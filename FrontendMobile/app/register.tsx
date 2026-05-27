import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../src/services/apiClient';
import { useTheme } from '../src/contexts/ThemeContext';
import { showToast } from '../src/hooks/useToast';

const allPrograms = [
  { id: '1', name: 'BS Computer Engineering' },
  { id: '2', name: 'BS Electrical Engineering' },
  { id: '3', name: 'BS Civil Engineering' },
  { id: '4', name: 'BS Electronics Engineering' },
  { id: '5', name: 'BS Agricultural Biosystem Engineering' },
];

const campuses = [
  { id: '1', name: 'Main Campus' },
  { id: '2', name: 'Satellite Campus 1' },
  { id: '3', name: 'Satellite Campus 2' },
];

const roles = [
  { id: '1', name: 'Student' },
  { id: '2', name: 'Faculty' },
  { id: '3', name: 'Program Chair' },
  { id: '4', name: 'Dean' },
  { id: '5', name: 'Associate Dean' },
];

export default function RegisterScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [userCode, setUserCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roleID, setRoleID] = useState('');
  const [campusID, setCampusID] = useState('');
  const [programID, setProgramID] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState('');

  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const colors = {
    page: isDark ? '#0F0F0F' : '#F7F8FA',
    card: isDark ? '#171717' : '#FFFFFF',
    cardSoft: isDark ? '#242424' : '#F9FAFB',
    text: isDark ? '#F5F5F5' : '#111827',
    muted: isDark ? '#A3A3A3' : '#6B7280',
    border: isDark ? '#2A2A2A' : '#E5E7EB',
    accent: isDark ? '#FF8C00' : '#FE6902',
    accentSoft: isDark ? 'rgba(255,140,0,0.16)' : 'rgba(254,105,2,0.10)',
    error: '#EF4444',
  };
  const inputStyle = {
    backgroundColor: colors.cardSoft,
    borderColor: colors.border,
    color: colors.text,
  };

  const getFilteredPrograms = () => {
    if (campusID === '2' || campusID === '3') {
      return allPrograms.filter((program) => program.id === '5');
    }
    return allPrograms.filter((program) => program.id !== '5');
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!firstName || !firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName || !lastName.trim()) newErrors.lastName = 'Last name is required';
    if (Object.keys(newErrors).length > 0) setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!userCode || !userCode.trim()) {
      newErrors.userCode = 'User code is required';
    } else if (!/^\d{2}-[A-Za-z]-\d{5}$/.test(userCode.trim())) {
      newErrors.userCode = 'Format must be like 00-X-00000 (2 digits, letter, 5 digits)';
    }
    if (!email || !email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (Object.keys(newErrors).length > 0) setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (!roleID) newErrors.roleID = 'Position is required';
    if (!campusID) newErrors.campusID = 'Campus is required';
    if (!programID) newErrors.programID = 'Program is required';
    if (Object.keys(newErrors).length > 0) setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    const newErrors: Record<string, string> = {};
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (Object.keys(newErrors).length > 0) setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    let isValid = false;
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      case 4:
        isValid = validateStep4();
        break;
    }

    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep4()) return;

    setIsRegistering(true);
    try {
      await apiRequest('/api/register', {
        method: 'POST',
        body: {
          userCode,
          firstName,
          lastName,
          email,
          password,
          roleID,
          campusID,
          programID,
        },
      });

      setMessage('Registration successful! Your account is pending approval.');
      showToast('Registration successful!', 'success');

      setTimeout(() => {
        router.replace('/');
      }, 3000);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error && 'data' in error
        ? (error as { data?: { message?: string } }).data?.message || 'Registration failed. Please try again.'
        : 'Registration failed. Please try again.';
      setErrors({ general: errorMsg });
      showToast(errorMsg, 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  const renderStepIndicator = () => (
    <View className="flex-row justify-center gap-2 mb-6">
      {[1, 2, 3, 4].map((step) => (
        <View
          key={step}
          className="w-8 h-1 rounded-sm"
          style={{ backgroundColor: step <= currentStep ? colors.accent : colors.border }}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View className="mb-6">
      <Text className="text-2xl font-bold mb-2" style={{ color: colors.text }}>Personal Information</Text>
      <Text className="text-sm mb-6" style={{ color: colors.muted }}>
        Enter your full name
      </Text>

      <View className="mb-5">
        <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>First Name *</Text>
        <TextInput
          className="border rounded-xl px-4 py-3 text-base"
          style={[inputStyle, errors.firstName ? { borderColor: colors.error } : null]}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Enter first name"
          placeholderTextColor={colors.muted}
        />
        {errors.firstName && (
          <Text className="text-red-500 text-xs mt-1">{errors.firstName}</Text>
        )}
      </View>

      <View className="mb-5">
        <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>Last Name *</Text>
        <TextInput
          className="border rounded-xl px-4 py-3 text-base"
          style={[inputStyle, errors.lastName ? { borderColor: colors.error } : null]}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Enter last name"
          placeholderTextColor={colors.muted}
        />
        {errors.lastName && (
          <Text className="text-red-500 text-xs mt-1">{errors.lastName}</Text>
        )}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View className="mb-6">
      <Text className="text-2xl font-bold mb-2" style={{ color: colors.text }}>Account Details</Text>
      <Text className="text-sm mb-6" style={{ color: colors.muted }}>
        Set up your login credentials
      </Text>

      <View className="mb-5">
        <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>User Code *</Text>
        <TextInput
          className="border rounded-xl px-4 py-3 text-base"
          style={[inputStyle, errors.userCode ? { borderColor: colors.error } : null]}
          value={userCode}
          onChangeText={setUserCode}
          placeholder="Enter user code"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
        />
        {errors.userCode && (
          <Text className="text-red-500 text-xs mt-1">{errors.userCode}</Text>
        )}
      </View>

      <View className="mb-5">
        <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>Email Address *</Text>
        <TextInput
          className="border rounded-xl px-4 py-3 text-base"
          style={[inputStyle, errors.email ? { borderColor: colors.error } : null]}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email address"
          placeholderTextColor={colors.muted}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && (
          <Text className="text-red-500 text-xs mt-1">{errors.email}</Text>
        )}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View className="mb-6">
      <Text className="text-2xl font-bold mb-2" style={{ color: colors.text }}>Academic Information</Text>
      <Text className="text-sm mb-6" style={{ color: colors.muted }}>
        Select your role and institution details
      </Text>

      <View className="mb-5">
        <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>Position *</Text>
        <View className="border rounded-2xl max-h-[200px] overflow-hidden" style={{ backgroundColor: colors.cardSoft, borderColor: colors.border }}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              className="flex-row justify-between items-center p-3 border-b"
              style={{ backgroundColor: roleID === role.id ? colors.accentSoft : 'transparent', borderBottomColor: colors.border }}
              onPress={() => setRoleID(role.id)}
            >
              <Text className="text-sm flex-1" style={{ color: colors.text }}>
                {role.name}
              </Text>
              {roleID === role.id && (
                <Ionicons name="checkmark" size={20} color={colors.accent} />
              )}
            </TouchableOpacity>
          ))}
        </View>
        {errors.roleID && <Text className="text-red-500 text-xs mt-1">{errors.roleID}</Text>}
      </View>

      <View className="mb-5">
        <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>Campus *</Text>
        <View className="border rounded-2xl max-h-[200px] overflow-hidden" style={{ backgroundColor: colors.cardSoft, borderColor: colors.border }}>
          {campuses.map((campus) => (
            <TouchableOpacity
              key={campus.id}
              className="flex-row justify-between items-center p-3 border-b"
              style={{ backgroundColor: campusID === campus.id ? colors.accentSoft : 'transparent', borderBottomColor: colors.border }}
              onPress={() => {
                setCampusID(campus.id);
                setProgramID('');
              }}
            >
              <Text className="text-sm flex-1" style={{ color: colors.text }}>
                {campus.name}
              </Text>
              {campusID === campus.id && (
                <Ionicons name="checkmark" size={20} color={colors.accent} />
              )}
            </TouchableOpacity>
          ))}
        </View>
        {errors.campusID && <Text className="text-red-500 text-xs mt-1">{errors.campusID}</Text>}
      </View>

      {campusID && (
        <View className="mb-5">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>Program *</Text>
          <View className="border rounded-2xl max-h-[200px] overflow-hidden" style={{ backgroundColor: colors.cardSoft, borderColor: colors.border }}>
            {getFilteredPrograms().map((program) => (
              <TouchableOpacity
                key={program.id}
                className="flex-row justify-between items-center p-3 border-b"
                style={{ backgroundColor: programID === program.id ? colors.accentSoft : 'transparent', borderBottomColor: colors.border }}
                onPress={() => setProgramID(program.id)}
              >
                <Text
                  className="text-sm flex-1"
                  style={{ color: colors.text }}
                  numberOfLines={2}
                >
                  {program.name}
                </Text>
                {programID === program.id && (
                  <Ionicons name="checkmark" size={20} color={colors.accent} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          {errors.programID && <Text className="text-red-500 text-xs mt-1">{errors.programID}</Text>}
        </View>
      )}
    </View>
  );

  const renderStep4 = () => (
    <View className="mb-6">
      <Text className="text-2xl font-bold mb-2" style={{ color: colors.text }}>Set Password</Text>
      <Text className="text-sm mb-6" style={{ color: colors.muted }}>
        Create a secure password
      </Text>

      <View className="mb-5">
        <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>Password *</Text>
        <View className="flex-row items-center border rounded-xl px-4" style={inputStyle}>
          <TextInput
            className="flex-1 py-3 text-base"
            style={{ color: colors.text }}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor={colors.muted}
            secureTextEntry={!passwordVisible}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
            <Ionicons
              name={passwordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={colors.muted}
            />
          </TouchableOpacity>
        </View>
        {errors.password && <Text className="text-red-500 text-xs mt-1">{errors.password}</Text>}
        <Text className="text-xs mt-1" style={{ color: colors.muted }}>
          Must be at least 8 characters
        </Text>
      </View>

      <View className="mb-5">
        <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>Confirm Password *</Text>
        <View className="flex-row items-center border rounded-xl px-4" style={inputStyle}>
          <TextInput
            className="flex-1 py-3 text-base"
            style={{ color: colors.text }}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm password"
            placeholderTextColor={colors.muted}
            secureTextEntry={!confirmPasswordVisible}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}>
            <Ionicons
              name={confirmPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={colors.muted}
            />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && (
          <Text className="text-red-500 text-xs mt-1">{errors.confirmPassword}</Text>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      style={{ backgroundColor: colors.page }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 60 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={toggleTheme} className="absolute top-12 right-6 z-10 p-2 rounded-full" style={{ backgroundColor: colors.card }} activeOpacity={0.8}>
          <Ionicons
            name={isDark ? 'sunny' : 'moon'}
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>

        <View className="items-center mb-8">
          <Text className="text-[40px] font-bold" style={{ color: colors.accent }}>CAPS</Text>
          <Text className="text-base mt-2" style={{ color: colors.muted }}>
            Create your account
          </Text>
        </View>

        <View className="rounded-[28px] border px-5 pt-5 pb-6" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          {renderStepIndicator()}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {errors.general ? (
            <Text className="text-sm text-center mb-3" style={{ color: colors.error }}>{errors.general}</Text>
          ) : null}

          {message && (
          <View className="flex-row items-center p-4 rounded-2xl gap-3 mb-4" style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.14)' : '#D1FAE5' }}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text className="flex-1 text-sm font-medium" style={{ color: isDark ? '#A7F3D0' : '#065F46' }}>{message}</Text>
          </View>
          )}

          <View className="flex-row gap-3 mt-6 items-center">
          {currentStep > 1 && (
            <TouchableOpacity
              className="px-6 py-3.5 rounded-xl border"
              style={{ backgroundColor: colors.cardSoft, borderColor: colors.border }}
              onPress={() => setCurrentStep((prev) => prev - 1)}
              activeOpacity={0.7}
            >
              <Text className="text-base font-semibold" style={{ color: colors.text }}>
                Previous
              </Text>
            </TouchableOpacity>
          )}

          {currentStep < 4 ? (
            <TouchableOpacity className="flex-1 py-3.5 rounded-xl items-center justify-center min-h-12" style={{ backgroundColor: colors.accent }} onPress={handleNextStep} activeOpacity={0.8}>
              <Text className="text-white text-base font-semibold">Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="flex-1 py-3.5 rounded-xl items-center justify-center min-h-12"
              style={{ backgroundColor: isRegistering ? colors.border : colors.accent }}
              onPress={handleSubmit}
              disabled={isRegistering}
              activeOpacity={isRegistering ? 1 : 0.8}
            >
              <Text className="text-white text-base font-semibold">
                {isRegistering ? 'Registering...' : 'Register'}
              </Text>
            </TouchableOpacity>
          )}
          </View>
        </View>

        <View className="flex-row justify-center mt-6 gap-2">
          <Text className="text-sm" style={{ color: colors.muted }}>
            Already have an account?
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-sm font-semibold" style={{ color: colors.accent }}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
