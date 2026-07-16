import { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CapsActivityIndicator from '../../../features/core/components/CapsActivityIndicator';
import { showToast } from '../../../hooks/useToast';
import { apiRequest } from '../../../services/apiClient';
import { useTheme } from '../../../contexts/ThemeContext';
import { getRoleThemeColors } from '../../../features/core/styles/roleTheme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function GenerateReportModal({ visible, onClose }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getRoleThemeColors(isDark);

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { key: 'general', label: 'General' },
    { key: 'technical', label: 'Technical' },
    { key: 'account', label: 'Account' },
    { key: 'academic', label: 'Academic' },
    { key: 'other', label: 'Other' },
  ];

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    if (message.trim().length < 10) {
      showToast('Please enter at least 10 characters', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest('/api/support-tickets', {
        method: 'POST',
        body: {
          subject: subject.trim(),
          message: message.trim(),
          issue_type: category,
        },
      });
      showToast('Report submitted successfully', 'success');
      setSubject('');
      setMessage('');
      setCategory('general');
      onClose();
    } catch {
      showToast('Failed to submit report', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View
          className="rounded-t-3xl p-5"
          style={{ backgroundColor: colors.surface, maxHeight: '80%' }}
        >
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              Generate Report
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.text }}>
              Category
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  className="px-3 py-1.5 rounded-full border"
                  style={{
                    borderColor: category === cat.key ? colors.accent : colors.border,
                    backgroundColor: category === cat.key ? colors.accent : colors.surfaceSoft,
                  }}
                  onPress={() => setCategory(cat.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: category === cat.key ? '#fff' : colors.muted }}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.text }}>
              Subject
            </Text>
            <TextInput
              className="text-sm px-3 py-2.5 rounded-lg border mb-4"
              style={{
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.text,
              }}
              value={subject}
              onChangeText={setSubject}
              placeholder="Brief title of your report"
              placeholderTextColor={colors.muted}
            />

            <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.text }}>
              Message
            </Text>
            <TextInput
              className="text-sm px-3 py-2.5 rounded-lg border mb-4"
              style={{
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.text,
                minHeight: 120,
              }}
              value={message}
              onChangeText={setMessage}
              placeholder="Describe the issue or concern in detail..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <TouchableOpacity
              className="py-3.5 rounded-xl items-center mt-2"
              style={{ backgroundColor: colors.accent, opacity: isSubmitting ? 0.6 : 1 }}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <CapsActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-white text-base font-bold">Submit Report</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
