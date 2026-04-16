import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../src/services/apiClient';
import { useTheme } from '../src/contexts/ThemeContext';
import { showToast } from '../src/hooks/useToast';

// ─────────────────────────────────────────────────────────────────────────────
// File purpose: Multi-step user registration screen for the CAPS mobile app.
//   Collects personal information, account details, academic information, and
//   password, then submits the data to the backend for account creation pending
//   admin approval.
// Key sections:
//   - Step 1: Personal Information (first name, last name)
//   - Step 2: Account Details (user code, email)
//   - Step 3: Academic Information (role/position, campus, program)
//   - Step 4: Password creation and confirmation
//   - Step indicator showing current progress across all 4 steps
//   - Navigation buttons (Previous/Next/Register)
//   - Login link for users who already have an account
//   - Theme toggle (light/dark mode)
// ─────────────────────────────────────────────────────────────────────────────

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
      const response = await apiClient.post('/api/register', {
        userCode,
        firstName,
        lastName,
        email,
        password,
        roleID,
        campusID,
        programID,
      });

      setMessage('Registration successful! Your account is pending approval.');
      showToast('Registration successful!', 'success');
      
      setTimeout(() => {
        router.replace('/' as any);
      }, 3000);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Registration failed. Please try again.';
      setErrors({ general: errorMsg });
      showToast(errorMsg, 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((step) => (
        <View
          key={step}
          style={[
            styles.stepDot,
            { backgroundColor: step <= currentStep ? '#FE6902' : isDark ? '#374151' : '#d1d5db' },
          ]}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, isDark && styles.darkText]}>Personal Information</Text>
      <Text style={[styles.stepDescription, isDark && styles.darkSubtext]}>
        Enter your full name
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, isDark && styles.darkText]}>First Name *</Text>
        <TextInput
          style={[styles.input, isDark && styles.darkInput, errors.firstName && styles.inputError]}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Enter first name"
          placeholderTextColor="#999"
        />
        {errors.firstName && (
          <Text style={styles.errorText}>{errors.firstName}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, isDark && styles.darkText]}>Last Name *</Text>
        <TextInput
          style={[styles.input, isDark && styles.darkInput, errors.lastName && styles.inputError]}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Enter last name"
          placeholderTextColor="#999"
        />
        {errors.lastName && (
          <Text style={styles.errorText}>{errors.lastName}</Text>
        )}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, isDark && styles.darkText]}>Account Details</Text>
      <Text style={[styles.stepDescription, isDark && styles.darkSubtext]}>
        Set up your login credentials
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, isDark && styles.darkText]}>User Code *</Text>
        <TextInput
          style={[styles.input, isDark && styles.darkInput, errors.userCode && styles.inputError]}
          value={userCode}
          onChangeText={setUserCode}
          placeholder="Enter user code"
          placeholderTextColor="#999"
          autoCapitalize="none"
        />
        {errors.userCode && (
          <Text style={styles.errorText}>{errors.userCode}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, isDark && styles.darkText]}>Email Address *</Text>
        <TextInput
          style={[styles.input, isDark && styles.darkInput, errors.email && styles.inputError]}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email address"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && (
          <Text style={styles.errorText}>{errors.email}</Text>
        )}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, isDark && styles.darkText]}>Academic Information</Text>
      <Text style={[styles.stepDescription, isDark && styles.darkSubtext]}>
        Select your role and institution details
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, isDark && styles.darkText]}>Position *</Text>
        <View style={styles.dropdownContainer}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={[
                styles.dropdownOption,
                isDark && styles.darkDropdownOption,
                roleID === role.id && styles.selectedOption,
              ]}
              onPress={() => setRoleID(role.id)}
            >
              <Text style={[styles.dropdownOptionText, isDark && styles.darkText]}>
                {role.name}
              </Text>
              {roleID === role.id && (
                <Ionicons name="checkmark" size={20} color="#FE6902" />
              )}
            </TouchableOpacity>
          ))}
        </View>
        {errors.roleID && <Text style={styles.errorText}>{errors.roleID}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, isDark && styles.darkText]}>Campus *</Text>
        <View style={styles.dropdownContainer}>
          {campuses.map((campus) => (
            <TouchableOpacity
              key={campus.id}
              style={[
                styles.dropdownOption,
                isDark && styles.darkDropdownOption,
                campusID === campus.id && styles.selectedOption,
              ]}
              onPress={() => {
                setCampusID(campus.id);
                setProgramID(''); // Reset program when campus changes
              }}
            >
              <Text style={[styles.dropdownOptionText, isDark && styles.darkText]}>
                {campus.name}
              </Text>
              {campusID === campus.id && (
                <Ionicons name="checkmark" size={20} color="#FE6902" />
              )}
            </TouchableOpacity>
          ))}
        </View>
        {errors.campusID && <Text style={styles.errorText}>{errors.campusID}</Text>}
      </View>

      {campusID && (
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>Program *</Text>
          <View style={styles.dropdownContainer}>
            {getFilteredPrograms().map((program) => (
              <TouchableOpacity
                key={program.id}
                style={[
                  styles.dropdownOption,
                  isDark && styles.darkDropdownOption,
                  programID === program.id && styles.selectedOption,
                ]}
                onPress={() => setProgramID(program.id)}
              >
                <Text
                  style={[styles.dropdownOptionText, isDark && styles.darkText]}
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
          {errors.programID && <Text style={styles.errorText}>{errors.programID}</Text>}
        </View>
      )}
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, isDark && styles.darkText]}>Set Password</Text>
      <Text style={[styles.stepDescription, isDark && styles.darkSubtext]}>
        Create a secure password
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, isDark && styles.darkText]}>Password *</Text>
        <View style={[styles.inputWithIcon, isDark && styles.darkInputWithIcon]}>
          <TextInput
            style={[styles.flexInput, isDark && styles.darkInput]}
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
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        <Text style={[styles.hintText, isDark && styles.darkSubtext]}>
          Must be at least 8 characters
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, isDark && styles.darkText]}>Confirm Password *</Text>
        <View style={[styles.inputWithIcon, isDark && styles.darkInputWithIcon]}>
          <TextInput
            style={[styles.flexInput, isDark && styles.darkInput]}
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
          <Text style={styles.errorText}>{errors.confirmPassword}</Text>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, isDark && styles.darkContainer]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Theme toggle */}
        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
          <Ionicons
            name={isDark ? 'sunny' : 'moon'}
            size={24}
            color={isDark ? '#fff' : '#000'}
          />
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={[styles.logoText, isDark && styles.darkText]}>CAPS</Text>
          <Text style={[styles.subtitle, isDark && styles.darkSubtext]}>
            Create your account
          </Text>
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Steps */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}

        {/* Success Message */}
        {message && (
          <View style={styles.successMessage}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.successText}>{message}</Text>
          </View>
        )}

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={[styles.secondaryButton, isDark && styles.darkSecondaryButton]}
              onPress={() => setCurrentStep((prev) => prev - 1)}
              activeOpacity={0.7}
            >
              <Text style={[styles.secondaryButtonText, isDark && styles.darkText]}>
                Previous
              </Text>
            </TouchableOpacity>
          )}

          {currentStep < 4 ? (
            <TouchableOpacity style={styles.primaryButton} onPress={handleNextStep} activeOpacity={0.8}>
              <Text style={styles.primaryButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, isRegistering && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isRegistering}
              activeOpacity={isRegistering ? 1 : 0.8}
            >
              <Text style={styles.primaryButtonText}>
                {isRegistering ? 'Registering...' : 'Register'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Login Link */}
        <View style={styles.loginLinkContainer}>
          <Text style={isDark ? styles.darkSubtext : styles.loginText}>
            Already have an account?
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  themeToggle: {
    position: 'absolute',
    top: 48,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FE6902',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  stepDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
  },
  stepContainer: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
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
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  darkInput: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
    color: '#fff',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  darkInputWithIcon: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  flexInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    maxHeight: 200,
  },
  darkDropdownOption: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectedOption: {
    backgroundColor: '#FEF3C7',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 16,
    borderRadius: 8,
    gap: 12,
    marginBottom: 16,
  },
  successText: {
    flex: 1,
    color: '#065F46',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    alignItems: 'center',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#FE6902',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  darkSecondaryButton: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  loginText: {
    fontSize: 14,
    color: '#6b7280',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FE6902',
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#9ca3af',
  },
});
