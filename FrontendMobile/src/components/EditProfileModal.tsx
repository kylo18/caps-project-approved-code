import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { showToast } from '../../src/hooks/useToast';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../src/store/slices/authSlice';
import apiClient from '../services/apiClient';

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
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose}><Text style={[styles.closeBtn, { color: colors.textSecondary }]}>✕</Text></TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.label, { color: colors.text }]}>First Name</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} value={firstName} onChangeText={setFirstName} />

            <Text style={[styles.label, { color: colors.text }]}>Last Name</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} value={lastName} onChangeText={setLastName} />

            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Change Password (Optional)</Text>

            <Text style={[styles.label, { color: colors.text }]}>Current Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Enter current password"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={[styles.label, { color: colors.text }]}>New Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="At least 8 characters"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={[styles.label, { color: colors.text }]}>Confirm New Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Re-enter new password"
              placeholderTextColor={colors.textSecondary}
            />

            <TouchableOpacity style={[styles.saveBtn, { opacity: isSubmitting ? 0.6 : 1 }]} onPress={handleSave} disabled={isSubmitting} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  closeBtn: { fontSize: 24, padding: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginTop: 18 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15 },
  saveBtn: { backgroundColor: '#FE6902', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
