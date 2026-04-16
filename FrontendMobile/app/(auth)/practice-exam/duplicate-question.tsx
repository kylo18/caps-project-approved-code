// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Confirmation screen for duplicating an existing question. Shows a
//          preview of the question and its choices read from navigation params
//          (workaround for missing GET /api/questions/{id}), then creates a
//          copy via the API when the user confirms.
// Key sections:
//   - State: question object, choices array, isLoading, isSubmitting
//   - handleSubmit: POSTs a duplicate request to the API
//   - UI: header, preview card showing question text and all choices with
//         visual indicators for the correct answer, duplicate button
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import RenderHtml from 'react-native-render-html';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';

interface Choice {
  choiceID?: number;
  choiceText: string;
  isCorrect: number;
}

interface Question {
  questionID?: number;
  questionText: string;
  choices?: Choice[];
}

export default function DuplicateQuestionForm() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const questionID = params.questionID;
  const { width } = useWindowDimensions();

  const [question, setQuestion] = useState<Question | null>(null);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Workaround: read full question data from navigation params since
    // GET /api/questions/{id} is not available on the backend.
    try {
      const raw = typeof params.question === 'string' ? params.question : Array.isArray(params.question) ? params.question[0] : '';
      const parsedQuestion: Question | null = raw ? JSON.parse(raw) : null;
      if (parsedQuestion) {
        setQuestion(parsedQuestion);
        setChoices(Array.isArray(parsedQuestion.choices) ? parsedQuestion.choices : []);
        setIsLoading(false);
        return;
      }
    } catch (e) {
      // fall through to error state
    }
    showToast('Failed to load question data', 'error');
    setIsLoading(false);
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await apiRequest(`/api/questions/${questionID}/duplicate`, { method: 'POST' });
      showToast('Question duplicated successfully', 'success');
      if (router.canGoBack()) router.back();
    } catch (error: any) {
      showToast(error?.message || 'Failed to duplicate question', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const colors = {
    bg: isDark ? '#000' : '#f3f4f6',
    card: isDark ? '#1f2937' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    orange: '#FE6902',
  };

  if (isLoading) {
    return <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={colors.orange} /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/(dean)/dashboard' as any)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Duplicate Question</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>Preview of Question to Duplicate</Text>
          <View style={{ marginBottom: 16 }}>
            <RenderHtml
              contentWidth={width - 64}
              source={{ html: question?.questionText || '<p>No question text</p>' }}
              tagsStyles={{
                p: { color: colors.text, fontSize: 16, lineHeight: 24, marginBottom: 8 },
                li: { color: colors.text, fontSize: 15, lineHeight: 22 },
                strong: { color: colors.text, fontWeight: '700' },
                u: { textDecorationLine: 'underline' },
                a: { color: colors.orange },
              }}
            />
          </View>

          <Text style={[styles.choicesLabel, { color: colors.text }]}>Choices:</Text>
          {choices.map((choice, idx) => (
            <View key={idx} style={styles.choiceItem}>
              <View style={[styles.radioIndicator, { backgroundColor: choice.isCorrect ? '#10B981' : '#e5e7eb' }]} />
              <Text style={[styles.choiceText, { color: colors.text }]}>{choice.choiceText}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.submitBtn, { opacity: isSubmitting ? 0.6 : 1 }]} onPress={handleSubmit} disabled={isSubmitting} activeOpacity={0.8}>
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <><Ionicons name="copy" size={20} color="#fff" /><Text style={styles.submitBtnText}>Duplicate Question</Text></>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { flexGrow: 1, padding: 16, paddingBottom: 100, gap: 16 },
  card: { borderRadius: 16, padding: 16, elevation: 2 },
  previewLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  questionText: { fontSize: 16, lineHeight: 24, marginBottom: 16 },
  choicesLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  choiceItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  radioIndicator: { width: 10, height: 10, borderRadius: 5 },
  choiceText: { fontSize: 14, flex: 1 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FE6902', paddingVertical: 14, borderRadius: 12, gap: 8 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
