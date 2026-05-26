import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { showToast } from '../../../../src/hooks/useToast';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../../../src/store/slices/authSlice';
import { apiRequest } from '../../../../src/services/apiClient';
import CapsActivityIndicator from '../../../features/core/components/CapsActivityIndicator';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: any;
}

export default function EditProfileModal({ visible, onClose, user }: EditProfileModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const dispatch = useDispatch();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setEmail(user?.email || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  }, [visible, user]);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      showToast('Name is required', 'error');
      return;
    }

    const wantsPasswordChange = Boolean(
      currentPassword.trim() || newPassword.trim() || confirmNewPassword.trim()
    );

    if (wantsPasswordChange) {
      if (!currentPassword.trim()) {
        showToast('Current password is required to change password', 'error');
        return;
      }
      if (newPassword.length < 8) {
        showToast('New password must be at least 8 characters', 'error');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        showToast('New password and confirmation do not match', 'error');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await apiRequest('/api/user/update-profile', {
        method: 'POST',
        body: {
          firstName,
          lastName,
          email,
        },
      });

      if (wantsPasswordChange) {
        await apiRequest('/api/change-password', {
          method: 'POST',
          body: {
            password: currentPassword,
            new_password: newPassword,
            new_password_confirmation: confirmNewPassword,
          },
        });
      }

      dispatch(updateUser({ firstName, lastName, email }));
      showToast(
        wantsPasswordChange ? 'Profile and password updated' : 'Profile updated',
        'success'
      );
      onClose();
    } catch (error: unknown) {
      const apiError = error as { data?: { errors?: Record<string, unknown>; message?: string } };
      const validationErrors = error instanceof Error && 'data' in error
        ? apiError.data?.errors
        : undefined;
      const firstValidationError =
        validationErrors && typeof validationErrors === 'object'
          ? Object.values(validationErrors).find((value: any) => Array.isArray(value) ? value[0] : value)
          : null;
      const errorMsg =
        (Array.isArray(firstValidationError) ? firstValidationError[0] : firstValidationError) ||
        apiError.data?.message ||
        'Failed to update profile';
      showToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const colors = {
    bg: isDark ? '#141414' : '#FFFFFF',
    card: isDark ? '#1A1A1A' : '#F7F8FA',
    text: isDark ? '#F5F5F5' : '#111827',
    textSecondary: isDark ? '#A3A3A3' : '#6B7280',
    border: isDark ? '#2A2A2A' : '#E5E7EB',
    inputBg: isDark ? '#242424' : '#FFFFFF',
    accent: isDark ? '#FF8C00' : '#FE6902',
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.62)' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ width: '100%' }}
        >
          <View className="rounded-t-[28px] border px-5 pt-3 pb-5" style={{ backgroundColor: colors.bg, borderColor: colors.border, maxHeight: '84%' }}>
          <View className="items-center pb-3">
            <View className="h-1 w-12 rounded-full" style={{ backgroundColor: colors.border }} />
          </View>

          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-xl font-bold" style={{ color: colors.text }}>Edit Profile</Text>
              <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>Keep your account details current.</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="h-9 w-9 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.card }}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View className="rounded-2xl border p-4 mb-4" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.text }}>First Name</Text>
            <TextInput
              className="text-base px-3 py-3 rounded-xl border mb-3"
              style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }}
              value={firstName}
              onChangeText={setFirstName}
            />

            <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.text }}>Last Name</Text>
            <TextInput
              className="text-base px-3 py-3 rounded-xl border mb-3"
              style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }}
              value={lastName}
              onChangeText={setLastName}
            />

            <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.text }}>Email</Text>
            <TextInput
              className="text-base px-3 py-3 rounded-xl border mb-3"
              style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            </View>

            <View className="rounded-2xl border p-4" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>Change Password</Text>
            <Text className="text-xs mb-4" style={{ color: colors.textSecondary }}>Optional, but recommended when you share a device.</Text>

            <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.text }}>Current Password</Text>
            <TextInput
              className="text-base px-3 py-3 rounded-xl border mb-3"
              style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Enter current password"
              placeholderTextColor={colors.textSecondary}
            />

            <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.text }}>New Password</Text>
            <TextInput
              className="text-base px-3 py-3 rounded-xl border mb-3"
              style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="At least 8 characters"
              placeholderTextColor={colors.textSecondary}
            />

            <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.text }}>Confirm New Password</Text>
            <TextInput
              className="text-base px-3 py-3 rounded-xl border mb-3"
              style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }}
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Re-enter new password"
              placeholderTextColor={colors.textSecondary}
            />
            </View>

            <TouchableOpacity
              className="py-3.5 rounded-2xl items-center mt-4"
              style={{ backgroundColor: colors.accent, opacity: isSubmitting ? 0.6 : 1 }}
              onPress={handleSave}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <CapsActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-white text-base font-bold">Save Changes</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
