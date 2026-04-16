import { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showToast } from '../hooks/useToast';
import { getFAQs, submitSupportRequest, FAQ } from '../services/helpService';

interface HelpCenterModalProps {
  visible: boolean;
  onClose: () => void;
  userRole?: number;
}

export default function HelpCenterModal({ visible, onClose, userRole }: HelpCenterModalProps) {
  const isStudent = !userRole || userRole === 1;
  const isDark = false;

  const [activeTab, setActiveTab] = useState(isStudent ? 'faq' : 'announcement');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

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
    setIsSubmitting(true);
    try {
      const result = await submitSupportRequest(
        { subject: subject.trim(), message: message.trim(), priority: 'medium' },
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

  const colors = {
    bg: 'rgba(0,0,0,0.5)',
    card: '#fff',
    text: '#111827',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    inputBg: '#fff',
    orange: '#FE6902',
  };

  const title = isStudent ? 'Help Center' : 'Create Announcement';
  const submitLabel = isStudent ? 'Submit Request' : 'Post Announcement';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.bg }]}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {isStudent ? (
            <>
              {/* Tabs */}
              <View style={styles.tabRow}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'faq' && { backgroundColor: colors.orange }]}
                  onPress={() => setActiveTab('faq')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="help-circle" size={16} color={activeTab === 'faq' ? '#fff' : colors.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={[styles.tabText, { color: activeTab === 'faq' ? '#fff' : colors.textSecondary }]}>FAQs</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'support' && { backgroundColor: colors.orange }]}
                  onPress={() => setActiveTab('support')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="headset" size={16} color={activeTab === 'support' ? '#fff' : colors.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={[styles.tabText, { color: activeTab === 'support' ? '#fff' : colors.textSecondary }]}>Support</Text>
                </TouchableOpacity>
              </View>

              {activeTab === 'faq' ? (
                <ScrollView style={styles.content}>
                  {isLoadingFaqs ? (
                    <ActivityIndicator color={colors.orange} style={{ marginTop: 20 }} />
                  ) : (
                    faqs.map((faq, idx) => (
                      <TouchableOpacity
                        key={faq.id ?? idx}
                        style={[styles.faqItem, { borderBottomColor: colors.border }]}
                        onPress={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.faqHeader}>
                          <Text style={[styles.faqQ, { color: colors.text }]}>{faq.question}</Text>
                          <Ionicons name={expandedFaq === idx ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
                        </View>
                        {expandedFaq === idx && <Text style={[styles.faqA, { color: colors.textSecondary }]}>{faq.answer}</Text>}
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              ) : (
                <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
                  <Text style={[styles.formLabel, { color: colors.text }]}>Subject</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                    value={subject}
                    onChangeText={setSubject}
                    placeholder="Brief description of your issue"
                    placeholderTextColor={colors.textSecondary}
                  />

                  <Text style={[styles.formLabel, { color: colors.text }]}>Message</Text>
                  <TextInput
                    style={[styles.messageInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Describe your issue in detail..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                  />

                  <TouchableOpacity
                    style={[styles.submitBtn, { opacity: isSubmitting ? 0.6 : 1 }]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                  >
                    {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{submitLabel}</Text>}
                  </TouchableOpacity>
                </ScrollView>
              )}
            </>
          ) : (
            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Title</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                value={subject}
                onChangeText={setSubject}
                placeholder="Announcement title"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.formLabel, { color: colors.text }]}>Message</Text>
              <TextInput
                style={[styles.messageInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                value={message}
                onChangeText={setMessage}
                placeholder="Write your announcement here..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.submitBtn, { opacity: isSubmitting ? 0.6 : 1 }]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{submitLabel}</Text>}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  container: { maxHeight: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  tabText: { fontSize: 13, fontWeight: '600' },
  content: { maxHeight: 400 },
  faqItem: { paddingVertical: 12, borderBottomWidth: 1 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQ: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  faqA: { fontSize: 14, marginTop: 8, lineHeight: 20 },
  formLabel: { fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 15 },
  messageInput: { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 15, minHeight: 100 },
  submitBtn: { backgroundColor: '#FE6902', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
