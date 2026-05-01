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
import { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
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
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to duplicate question', 'error');
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

  const tagsStyles = useMemo(() => ({
    p: { color: colors.text, fontSize: 16, lineHeight: 24, marginBottom: 8 },
    li: { color: colors.text, fontSize: 15, lineHeight: 22 },
    strong: { color: colors.text, fontWeight: '700' as const },
    u: { textDecorationLine: 'underline' as const },
    a: { color: colors.orange },
  }), [colors.text, colors.orange]);

  if (isLoading) {
    return <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.bg }}><CapsActivityIndicator size="large" color={colors.orange} /></View>;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: colors.card, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/(dean)/dashboard')} className="p-2">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: colors.text }}>Duplicate Question</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 100, gap: 16 }} showsVerticalScrollIndicator={false}>
        <View className="rounded-2xl p-4" style={{ backgroundColor: colors.card, elevation: 2 }}>
          <Text className="text-[13px] font-semibold mb-2" style={{ color: colors.textSecondary }}>Preview of Question to Duplicate</Text>
          <View style={{ marginBottom: 16 }}>
            <RenderHtml
              contentWidth={width - 64}
              source={{ html: question?.questionText || '<p>No question text</p>' }}
              tagsStyles={tagsStyles}
            />
          </View>

          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>Choices:</Text>
          {choices.map((choice, idx) => (
            <View key={idx} className="flex-row items-center gap-2.5 mb-1.5">
              <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: choice.isCorrect ? '#10B981' : '#e5e7eb' }} />
              <Text className="text-sm flex-1" style={{ color: colors.text }}>{choice.choiceText}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity className="flex-row items-center justify-center bg-[#FE6902] py-3.5 rounded-xl gap-2" style={{ opacity: isSubmitting ? 0.6 : 1 }} onPress={handleSubmit} disabled={isSubmitting} activeOpacity={0.8}>
          {isSubmitting ? <CapsActivityIndicator color="#fff" /> : <><Ionicons name="copy" size={20} color="#fff" /><Text className="text-white text-base font-bold">Duplicate Question</Text></>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
