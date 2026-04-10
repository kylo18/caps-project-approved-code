import { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../src/services/apiClient';
import { showToast } from '../../src/hooks/useToast';

export default function HelpCenterModal({ visible, onClose }) {
  // Force light colors regardless of theme (matches orange hero header)
  const isDark = false;

  const [activeTab, setActiveTab] = useState('faq');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const faqs = [
    { q: 'How do I take a practice exam?', a: 'Go to your dashboard, select a subject, and tap on it to start the exam. Answer all questions and submit when done.' },
    { q: 'Can I retake an exam?', a: 'Yes! You can retake any practice exam as many times as you want to improve your score.' },
    { q: 'How is my score calculated?', a: 'Your score is based on the number of correct answers divided by total questions, expressed as a percentage.' },
    { q: 'What does the leaderboard show?', a: 'Rankings are based on your average score across all practice exams you have completed.' },
    { q: 'How do I contact support?', a: 'Switch to the "Support" tab in this modal and submit a request. Admins will respond as soon as possible.' },
    { q: 'Can I change my password?', a: 'Yes, tap your profile icon in the header and select "Edit Profile" to update your account details.' },
  ];

  const [expandedFaq, setExpandedFaq] = useState(null);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await apiRequest('/api/support/tickets', {
        method: 'POST',
        body: { subject, message },
      });
      showToast('Support request submitted', 'success');
      setSubject('');
      setMessage('');
      setActiveTab('faq');
    } catch (error) {
      showToast('Failed to submit request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const colors = {
    bg: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.5)',
    card: isDark ? '#1f2937' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    inputBg: isDark ? '#111827' : '#fff',
    orange: '#FE6902',
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: colors.bg }]}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Help Center</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.textSecondary} /></TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity style={[styles.tab, activeTab === 'faq' && { backgroundColor: colors.orange }]} onPress={() => setActiveTab('faq')} activeOpacity={0.7}>
              <Ionicons name="help-circle" size={16} color={activeTab === 'faq' ? '#fff' : colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={[styles.tabText, { color: activeTab === 'faq' ? '#fff' : colors.textSecondary }]}>FAQs</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'support' && { backgroundColor: colors.orange }]} onPress={() => setActiveTab('support')} activeOpacity={0.7}>
              <Ionicons name="headset" size={16} color={activeTab === 'support' ? '#fff' : colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={[styles.tabText, { color: activeTab === 'support' ? '#fff' : colors.textSecondary }]}>Support</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'faq' ? (
            <ScrollView style={styles.content}>
              {faqs.map((faq, idx) => (
                <TouchableOpacity key={idx} style={[styles.faqItem, { borderBottomColor: colors.border }]} onPress={() => setExpandedFaq(expandedFaq === idx ? null : idx)} activeOpacity={0.7}>
                  <View style={styles.faqHeader}>
                    <Text style={[styles.faqQ, { color: colors.text }]}>{faq.q}</Text>
                    <Ionicons name={expandedFaq === idx ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
                  </View>
                  {expandedFaq === idx && <Text style={[styles.faqA, { color: colors.textSecondary }]}>{faq.a}</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Subject</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} value={subject} onChangeText={setSubject} placeholder="Brief description of your issue" placeholderTextColor={colors.textSecondary} />

              <Text style={[styles.formLabel, { color: colors.text }]}>Message</Text>
              <TextInput style={[styles.messageInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} value={message} onChangeText={setMessage} placeholder="Describe your issue in detail..." placeholderTextColor={colors.textSecondary} multiline numberOfLines={5} textAlignVertical="top" />

              <TouchableOpacity style={[styles.submitBtn, { opacity: isSubmitting ? 0.6 : 1 }]} onPress={handleSubmit} disabled={isSubmitting} activeOpacity={0.8}>
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Request</Text>}
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
