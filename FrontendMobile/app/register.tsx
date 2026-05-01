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
    if (!userCode || !userCode.trim()) newErrors.userCode = 'User code is required';
    if (!email || !email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!email.includes('@')) {
      newErrors.email = 'Email must contain @ symbol';
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
          style={{ backgroundColor: step <= currentStep ? '#FE6902' : isDark ? '#374151' : '#d1d5db' }}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View className="mb-6">
      <Text className={`text-2xl font-bold text-gray-900 mb-2 ${isDark ? 'text-white' : ''}`}>Personal Information</Text>
      <Text className={`text-sm text-gray-500 mb-6 ${isDark ? 'text-gray-400' : ''}`}>
        Enter your full name
      </Text>

      <View className="mb-5">
        <Text className={`text-sm font-semibold text-gray-700 mb-2 ${isDark ? 'text-white' : ''}`}>First Name *</Text>
        <TextInput
          className={`bg-white border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 dark:bg-gray-800 dark:border-gray-600 ${errors.firstName ? 'border-red-500' : ''}`}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Enter first name"
          placeholderTextColor="#999"
        />
        {errors.firstName && (
          <Text className="text-red-500 text-xs mt-1">{errors.firstName}</Text>
        )}
      </View>

      <View className="mb-5">
        <Text className={`text-sm font-semibold text-gray-700 mb-2 ${isDark ? 'text-white' : ''}`}>Last Name *</Text>
        <TextInput
          className={`bg-white border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 dark:bg-gray-800 dark:border-gray-600 ${errors.lastName ? 'border-red-500' : ''}`}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Enter last name"
          placeholderTextColor="#999"
        />
        {errors.lastName && (
          <Text className="text-red-500 text-xs mt-1">{errors.lastName}</Text>
        )}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View className="mb-6">
      <Text className={`text-2xl font-bold text-gray-900 mb-2 ${isDark ? 'text-white' : ''}`}>Account Details</Text>
      <Text className={`text-sm text-gray-500 mb-6 ${isDark ? 'text-gray-400' : ''}`}>
        Set up your login credentials
      </Text>

      <View className="mb-5">
        <Text className={`text-sm font-semibold text-gray-700 mb-2 ${isDark ? 'text-white' : ''}`}>User Code *</Text>
        <TextInput
          className={`bg-white border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 dark:bg-gray-800 dark:border-gray-600 ${errors.userCode ? 'border-red-500' : ''}`}
          value={userCode}
          onChangeText={setUserCode}
          placeholder="Enter user code"
          placeholderTextColor="#999"
          autoCapitalize="none"
        />
        {errors.userCode && (
          <Text className="text-red-500 text-xs mt-1">{errors.userCode}</Text>
        )}
      </View>

      <View className="mb-5">
        <Text className={`text-sm font-semibold text-gray-700 mb-2 ${isDark ? 'text-white' : ''}`}>Email Address *</Text>
        <TextInput
          className={`bg-white border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 dark:bg-gray-800 dark:border-gray-600 ${errors.email ? 'border-red-500' : ''}`}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email address"
          placeholderTextColor="#999"
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
      <Text className={`text-2xl font-bold text-gray-900 mb-2 ${isDark ? 'text-white' : ''}`}>Academic Information</Text>
      <Text className={`text-sm text-gray-500 mb-6 ${isDark ? 'text-gray-400' : ''}`}>
        Select your role and institution details
      </Text>

      <View className="mb-5">
        <Text className={`text-sm font-semibold text-gray-700 mb-2 ${isDark ? 'text-white' : ''}`}>Position *</Text>
        <View className={`border border-gray-300 rounded-lg bg-white max-h-[200px] dark:bg-gray-800 dark:border-gray-600`}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              className={`flex-row justify-between items-center p-3 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-600 ${roleID === role.id ? 'bg-amber-100' : ''}`}
              onPress={() => setRoleID(role.id)}
            >
              <Text className={`text-sm text-gray-900 flex-1 ${isDark ? 'text-white' : ''}`}>
                {role.name}
              </Text>
              {roleID === role.id && (
                <Ionicons name="checkmark" size={20} color="#FE6902" />
              )}
            </TouchableOpacity>
          ))}
        </View>
        {errors.roleID && <Text className="text-red-500 text-xs mt-1">{errors.roleID}</Text>}
      </View>

      <View className="mb-5">
        <Text className={`text-sm font-semibold text-gray-700 mb-2 ${isDark ? 'text-white' : ''}`}>Campus *</Text>
        <View className={`border border-gray-300 rounded-lg bg-white max-h-[200px] dark:bg-gray-800 dark:border-gray-600`}>
          {campuses.map((campus) => (
            <TouchableOpacity
              key={campus.id}
              className={`flex-row justify-between items-center p-3 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-600 ${campusID === campus.id ? 'bg-amber-100' : ''}`}
              onPress={() => {
                setCampusID(campus.id);
                setProgramID('');
              }}
            >
              <Text className={`text-sm text-gray-900 flex-1 ${isDark ? 'text-white' : ''}`}>
                {campus.name}
              </Text>
              {campusID === campus.id && (
                <Ionicons name="checkmark" size={20} color="#FE6902" />
              )}
            </TouchableOpacity>
          ))}
        </View>
        {errors.campusID && <Text className="text-red-500 text-xs mt-1">{errors.campusID}</Text>}
      </View>

      {campusID && (
        <View className="mb-5">
          <Text className={`text-sm font-semibold text-gray-700 mb-2 ${isDark ? 'text-white' : ''}`}>Program *</Text>
          <View className={`border border-gray-300 rounded-lg bg-white max-h-[200px] dark:bg-gray-800 dark:border-gray-600`}>
            {getFilteredPrograms().map((program) => (
              <TouchableOpacity
                key={program.id}
                className={`flex-row justify-between items-center p-3 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-600 ${programID === program.id ? 'bg-amber-100' : ''}`}
                onPress={() => setProgramID(program.id)}
              >
                <Text
                  className={`text-sm text-gray-900 flex-1 ${isDark ? 'text-white' : ''}`}
                  numberOfLines={2}
                >
                  {program.name}
                </Text>
                {programID === program.id && (
                  <Ionicons name="checkmark" size={20} color="#FE6902" />
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
      <Text className={`text-2xl font-bold text-gray-900 mb-2 ${isDark ? 'text-white' : ''}`}>Set Password</Text>
      <Text className={`text-sm text-gray-500 mb-6 ${isDark ? 'text-gray-400' : ''}`}>
        Create a secure password
      </Text>

      <View className="mb-5">
        <Text className={`text-sm font-semibold text-gray-700 mb-2 ${isDark ? 'text-white' : ''}`}>Password *</Text>
        <View className={`flex-row items-center bg-white border border-gray-300 rounded-lg px-4 dark:bg-gray-800 dark:border-gray-600`}>
          <TextInput
            className={`flex-1 py-3 text-base text-gray-900 ${isDark ? 'text-white' : ''}`}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor="#999"
            secureTextEntry={!passwordVisible}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
            <Ionicons
              name={passwordVisible ? 'eye-off' : 'eye'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>
        {errors.password && <Text className="text-red-500 text-xs mt-1">{errors.password}</Text>}
        <Text className={`text-xs text-gray-500 mt-1 ${isDark ? 'text-gray-400' : ''}`}>
          Must be at least 8 characters
        </Text>
      </View>

      <View className="mb-5">
        <Text className={`text-sm font-semibold text-gray-700 mb-2 ${isDark ? 'text-white' : ''}`}>Confirm Password *</Text>
        <View className={`flex-row items-center bg-white border border-gray-300 rounded-lg px-4 dark:bg-gray-800 dark:border-gray-600`}>
          <TextInput
            className={`flex-1 py-3 text-base text-gray-900 ${isDark ? 'text-white' : ''}`}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm password"
            placeholderTextColor="#999"
            secureTextEntry={!confirmPasswordVisible}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}>
            <Ionicons
              name={confirmPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color="#666"
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
      className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-100'}`}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 60 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={toggleTheme} className="absolute top-12 right-6 z-10 p-2">
          <Ionicons
            name={isDark ? 'sunny' : 'moon'}
            size={24}
            color={isDark ? '#fff' : '#000'}
          />
        </TouchableOpacity>

        <View className="items-center mb-8">
          <Text className="text-[40px] font-bold text-[#FE6902]">CAPS</Text>
          <Text className={`text-base text-gray-500 mt-2 ${isDark ? 'text-gray-400' : ''}`}>
            Create your account
          </Text>
        </View>

        {renderStepIndicator()}

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}

        {message && (
          <View className="flex-row items-center bg-green-100 p-4 rounded-lg gap-3 mb-4">
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text className="flex-1 text-green-800 text-sm font-medium">{message}</Text>
          </View>
        )}

        <View className="flex-row gap-3 mt-6 items-center">
          {currentStep > 1 && (
            <TouchableOpacity
              className={`px-6 py-3.5 rounded-lg bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-600`}
              onPress={() => setCurrentStep((prev) => prev - 1)}
              activeOpacity={0.7}
            >
              <Text className={`text-base font-semibold text-gray-700 ${isDark ? 'text-white' : ''}`}>
                Previous
              </Text>
            </TouchableOpacity>
          )}

          {currentStep < 4 ? (
            <TouchableOpacity className="flex-1 bg-[#FE6902] py-3.5 rounded-lg items-center justify-center min-h-12" onPress={handleNextStep} activeOpacity={0.8}>
              <Text className="text-white text-base font-semibold">Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className={`flex-1 bg-[#FE6902] py-3.5 rounded-lg items-center justify-center min-h-12 ${isRegistering ? 'bg-gray-400' : ''}`}
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

        <View className="flex-row justify-center mt-6 gap-2">
          <Text className={`text-sm text-gray-500 ${isDark ? 'text-gray-400' : ''}`}>
            Already have an account?
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-sm font-semibold text-[#FE6902]">Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
