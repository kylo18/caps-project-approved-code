// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Help Center screen — displays a FAQ section with common questions
//          about practice exams, scoring, and leaderboards, plus a "Need More
//          Help?" section directing users to contact their instructor or submit
//          a support request.
// Key sections: Header with back button, FAQ list, additional help guidance card.
// ─────────────────────────────────────────────────────────────────────────────

import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function TutorialLayout() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const colors = {
    bg: isDark ? '#000' : '#f3f4f6',
    card: isDark ? '#1f2937' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    orange: '#FE6902',
  };

  const faqs = [
    { q: 'How do I take a practice exam?', a: 'Go to the dashboard, select a subject, and tap on it to start the exam.' },
    { q: 'Can I retake an exam?', a: 'Yes, you can retake any practice exam as many times as you want.' },
    { q: 'How is my score calculated?', a: 'Your score is based on the number of correct answers divided by total questions.' },
    { q: 'What do the leaderboard rankings mean?', a: 'Rankings are based on your average score across all practice exams.' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Help Center</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
          {faqs.map((faq, idx) => (
            <View key={idx} style={styles.faqItem}>
              <Text style={[styles.faqQ, { color: colors.text }]}>{faq.q}</Text>
              <Text style={[styles.faqA, { color: colors.textSecondary }]}>{faq.a}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Need More Help?</Text>
          <Text style={[styles.helpText, { color: colors.textSecondary }]}>
            If you need further assistance, please contact your instructor or submit a support request through the Admin Support section.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { padding: 8, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { flexGrow: 1, padding: 16, gap: 16, paddingBottom: 100 },
  section: { borderRadius: 16, padding: 16, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  faqItem: { marginBottom: 12 },
  faqQ: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  faqA: { fontSize: 14, lineHeight: 20 },
  helpText: { fontSize: 14, lineHeight: 20 },
});
