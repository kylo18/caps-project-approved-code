import { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CapsActivityIndicator from '../../../features/core/components/CapsActivityIndicator';
import { showToast } from '../../../hooks/useToast';
import { getFAQs, submitSupportRequest, FAQ } from '../../../services/helpService';
import { useTheme } from '../../../contexts/ThemeContext';
import { getRoleThemeColors } from '../../../features/core/styles/roleTheme';

interface HelpCenterModalProps {
  visible: boolean;
  onClose: () => void;
  userRole?: number;
}

export default function HelpCenterModal({ visible, onClose, userRole }: HelpCenterModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isStudent = !userRole || userRole === 1;

  const [activeTab, setActiveTab] = useState(isStudent ? 'faq' : 'announcement');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const supportCategories = [
    { key: 'general', label: 'General' },
    { key: 'technical', label: 'Technical' },
    { key: 'account', label: 'Account' },
    { key: 'academic', label: 'Academic' },
    { key: 'other', label: 'Other' },
  ];

  useEffect(() => {
    if (visible && isStudent) {
      loadFAQs();
    }
  }, [visible, isStudent]);

  useEffect(() => {
    if (visible) {
      setActiveTab(isStudent ? 'faq' : 'announcement');
      setSubject('');
      setMessage('');
      setCategory('general');
      setExpandedFaq(null);
    }
  }, [visible, isStudent]);

  const loadFAQs = async () => {
    setIsLoadingFaqs(true);
    try {
      const res = await getFAQs();
      setFaqs(res.data);
    } catch (error) {
      console.error('Failed to load FAQs:', error);
    } finally {
      setIsLoadingFaqs(false);
    }
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    if (message.trim().length < 10) {
      showToast('Please enter at least 10 characters in your message', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await submitSupportRequest(
        { subject: subject.trim(), message: message.trim(), category },
        userRole
      );
      if (result.success) {
        showToast(result.message, 'success');
        setSubject('');
        setMessage('');
        if (isStudent) {
          setActiveTab('faq');
        }
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('Failed to submit request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleColors = getRoleThemeColors(isDark);
  const colors = {
    bg: roleColors.overlay,
    card: roleColors.surface,
    tabIdle: roleColors.surfaceSoft,
    text: roleColors.text,
    textSecondary: roleColors.muted,
    border: roleColors.border,
    inputBg: roleColors.input,
    orange: roleColors.accent,
  };

  const title = isStudent ? 'Help Center' : 'Create Announcement';
  const submitLabel = isStudent ? 'Submit Request' : 'Post Announcement';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: colors.bg }}>
        <View className="rounded-t-3xl p-5" style={{ backgroundColor: colors.card, maxHeight: '85%' }}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold" style={{ color: colors.text }}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {isStudent ? (
            <>
              <View className="flex-row gap-2 mb-4">
                <TouchableOpacity
                  className="flex-row items-center px-4 py-2 rounded-full"
                  style={{ backgroundColor: activeTab === 'faq' ? colors.orange : colors.tabIdle, borderWidth: activeTab === 'faq' ? 0 : 1, borderColor: colors.border }}
                  onPress={() => setActiveTab('faq')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="help-circle" size={16} color={activeTab === 'faq' ? '#fff' : colors.textSecondary} />
                  <Text className="text-xs font-semibold ml-1" style={{ color: activeTab === 'faq' ? '#fff' : colors.textSecondary }}>FAQs</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-row items-center px-4 py-2 rounded-full"
                  style={{ backgroundColor: activeTab === 'support' ? colors.orange : colors.tabIdle, borderWidth: activeTab === 'support' ? 0 : 1, borderColor: colors.border }}
                  onPress={() => setActiveTab('support')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="headset" size={16} color={activeTab === 'support' ? '#fff' : colors.textSecondary} />
                  <Text className="text-xs font-semibold ml-1" style={{ color: activeTab === 'support' ? '#fff' : colors.textSecondary }}>Support</Text>
                </TouchableOpacity>
              </View>

              {activeTab === 'faq' ? (
                <ScrollView style={{ maxHeight: 400 }}>
                  {isLoadingFaqs ? (
                    <View className="items-center justify-center py-5">
                      <CapsActivityIndicator color={colors.orange} />
                    </View>
                  ) : (
                    faqs.map((faq, idx) => (
                      <TouchableOpacity
                        key={faq.id ?? idx}
                        className="py-3 border-b"
                        style={{ borderBottomColor: colors.border }}
                        onPress={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                        activeOpacity={0.7}
                      >
                        <View className="flex-row justify-between items-center">
                          <Text className="text-sm font-semibold flex-1 mr-2" style={{ color: colors.text }}>{faq.question}</Text>
                          <Ionicons name={expandedFaq === idx ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
                        </View>
                        {expandedFaq === idx && <Text className="text-sm mt-2 leading-5" style={{ color: colors.textSecondary }}>{faq.answer}</Text>}
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              ) : (
                <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                  <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.text }}>Category</Text>
                  <View className="flex-row flex-wrap gap-2 mb-1">
                    {supportCategories.map((cat) => (
                      <TouchableOpacity
                        key={cat.key}
                        className="px-3 py-1.5 rounded-full border"
                        style={{ borderColor: category === cat.key ? colors.orange : colors.border, backgroundColor: category === cat.key ? colors.orange : colors.tabIdle }}
                        onPress={() => setCategory(cat.key)}
                        activeOpacity={0.7}
                      >
                        <Text className="text-xs font-semibold" style={{ color: category === cat.key ? '#fff' : colors.textSecondary }}>{cat.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text className="text-sm font-semibold mb-1.5 mt-3" style={{ color: colors.text }}>Subject</Text>
                  <TextInput
                    className="text-sm px-3 py-2.5 rounded-lg border mb-3"
                    style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }}
                    value={subject}
                    onChangeText={setSubject}
                    placeholder="Brief description of your issue"
                    placeholderTextColor={colors.textSecondary}
                  />

                  <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.text }}>Message</Text>
                  <TextInput
                    className="text-sm px-3 py-2.5 rounded-lg border mb-3"
                    style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text, minHeight: 100 }}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Describe your issue in detail..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                  />

                  <TouchableOpacity
                    className="py-3.5 rounded-xl items-center mt-4"
                    style={{ backgroundColor: colors.orange, opacity: isSubmitting ? 0.6 : 1 }}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                  >
                    {isSubmitting ? <CapsActivityIndicator color="#fff" size="small" /> : <Text className="text-white text-base font-bold">{submitLabel}</Text>}
                  </TouchableOpacity>
                </ScrollView>
              )}
            </>
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.text }}>Title</Text>
              <TextInput
                className="text-sm px-3 py-2.5 rounded-lg border mb-3"
                style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }}
                value={subject}
                onChangeText={setSubject}
                placeholder="Announcement title"
                placeholderTextColor={colors.textSecondary}
              />

              <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.text }}>Message</Text>
              <TextInput
                className="text-sm px-3 py-2.5 rounded-lg border mb-3"
                style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text, minHeight: 100 }}
                value={message}
                onChangeText={setMessage}
                placeholder="Write your announcement here..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              <TouchableOpacity
                className="py-3.5 rounded-xl items-center mt-4"
                style={{ backgroundColor: colors.orange, opacity: isSubmitting ? 0.6 : 1 }}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? <CapsActivityIndicator color="#fff" size="small" /> : <Text className="text-white text-base font-bold">{submitLabel}</Text>}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
