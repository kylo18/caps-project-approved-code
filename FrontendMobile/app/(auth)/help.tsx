// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Help Center screen — displays a FAQ section with common questions
//          about practice exams, scoring, and leaderboards, plus a "Need More
//          Help?" section directing users to contact their instructor or submit
//          a support request.
// Key sections: Header with back button, FAQ list, additional help guidance card.
// ─────────────────────────────────────────────────────────────────────────────

import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
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
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <View className="flex-row items-center px-4 py-3 border-b" style={{ backgroundColor: colors.card, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-3">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: colors.text }}>Help Center</Text>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View className="rounded-2xl p-4" style={{ backgroundColor: colors.card, elevation: 2 }}>
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>Frequently Asked Questions</Text>
          {faqs.map((faq, idx) => (
            <View key={idx} className="mb-3">
              <Text className="text-[15px] font-semibold mb-1" style={{ color: colors.text }}>{faq.q}</Text>
              <Text className="text-sm leading-5" style={{ color: colors.textSecondary }}>{faq.a}</Text>
            </View>
          ))}
        </View>

        <View className="rounded-2xl p-4" style={{ backgroundColor: colors.card, elevation: 2 }}>
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>Need More Help?</Text>
          <Text className="text-sm leading-5" style={{ color: colors.textSecondary }}>
            If you need further assistance, please contact your instructor or submit a support request through the Admin Support section.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
