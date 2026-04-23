import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { showToast } from '../../src/hooks/useToast';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../src/store/slices/authSlice';
import apiClient from '../services/apiClient';
import CapsActivityIndicator from './CapsActivityIndicator';

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
      await apiClient.post('/api/user/update-profile', {
        firstName,
        lastName,
        email,
      });

      if (wantsPasswordChange) {
        await apiClient.post('/api/change-password', {
          password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmNewPassword,
        });
      }

      dispatch(updateUser({ firstName, lastName, email }));
      showToast(
        wantsPasswordChange ? 'Profile and password updated' : 'Profile updated',
        'success'
      );
      onClose();
    } catch (error: any) {
      const validationErrors = error?.response?.data?.errors;
      const firstValidationError =
        validationErrors && typeof validationErrors === 'object'
          ? Object.values(validationErrors).find((value: any) => Array.isArray(value) ? value[0] : value)
          : null;
      const errorMsg =
        (Array.isArray(firstValidationError) ? firstValidationError[0] : firstValidationError) ||
        error.response?.data?.message ||
        'Failed to update profile';
      showToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const colors = {
    bg: isDark ? '#1f2937' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    inputBg: isDark ? '#111827' : '#fff',
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/60 justify-end">
        <View className="rounded-t-3xl p-5" style={{ backgroundColor: colors.bg, maxHeight: '80%' }}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold" style={{ color: colors.text }}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-2xl" style={{ color: colors.textSecondary }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
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

            <Text className="text-base font-bold mt-5 mb-1" style={{ color: colors.text }}>Change Password (Optional)</Text>

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

            <TouchableOpacity
              className="py-3.5 rounded-xl items-center mt-4"
              style={{ backgroundColor: '#FE6902', opacity: isSubmitting ? 0.6 : 1 }}
              onPress={handleSave}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <CapsActivityIndicator color="#fff" size="sm" />
              ) : (
                <Text className="text-white text-base font-bold">Save Changes</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
