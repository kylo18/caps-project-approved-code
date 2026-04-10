import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { showToast } from '../../src/hooks/useToast';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../src/store/slices/authSlice';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      // TODO: Call API to update profile
      // await apiRequest('/api/user/update-profile', { method: 'POST', body: { firstName, lastName, email } });
      dispatch(updateUser({ firstName, lastName, email }));
      showToast('Profile updated', 'success');
      onClose();
    } catch (error) {
      showToast('Failed to update profile', 'error');
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

          <Text style={[styles.label, { color: colors.text }]}>First Name</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} value={firstName} onChangeText={setFirstName} />

          <Text style={[styles.label, { color: colors.text }]}>Last Name</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} value={lastName} onChangeText={setLastName} />

          <Text style={[styles.label, { color: colors.text }]}>Email</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} value={email} onChangeText={setEmail} keyboardType="email-address" />

          <TouchableOpacity style={[styles.saveBtn, { opacity: isSubmitting ? 0.6 : 1 }]} onPress={handleSave} disabled={isSubmitting} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
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
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15 },
  saveBtn: { backgroundColor: '#FE6902', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
