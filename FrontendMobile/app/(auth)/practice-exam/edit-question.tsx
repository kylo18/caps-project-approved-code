// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Form for editing an existing multiple-choice question. Reads the
//          current question and choices from navigation params (workaround for
//          missing GET /api/questions/{id} endpoint), allows modifications,
//          and saves changes via the API.
// Key sections:
//   - State: questionText, choices array, isLoading, isSubmitting
//   - handleChoiceChange / handleCorrectToggle: same radio-behavior as add-question
//   - handleSubmit: validates and PUTs updated question text and choices to the API
//   - UI: header, question text input, choices section with radio buttons,
//         save changes button; shows loading spinner while fetching
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
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

export default function EditQuestionForm() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const questionID = params.questionID;

  const [questionText, setQuestionText] = useState('');
  const [choices, setChoices] = useState<Choice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const richText = useRef<RichEditor>(null);

  useEffect(() => {
    // Workaround: read full question data from navigation params since
    // GET /api/questions/{id} is not available on the backend.
    try {
      const raw = typeof params.question === 'string' ? params.question : Array.isArray(params.question) ? params.question[0] : '';
      const parsedQuestion: Question | null = raw ? JSON.parse(raw) : null;
      if (parsedQuestion) {
        setQuestionText(parsedQuestion.questionText || '');
        setChoices(Array.isArray(parsedQuestion.choices) ? parsedQuestion.choices : []);
        setIsLoading(false);
        return;
      }
    } catch (e) {
      // fall through to error state
    }
    // If no question data passed, we can't edit
    showToast('Failed to load question data', 'error');
    setIsLoading(false);
  }, []);

  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index].choiceText = value;
    setChoices(newChoices);
  };

  const handleCorrectToggle = (index: number) => {
    const newChoices = choices.map((c, i) => ({ ...c, isCorrect: i === index ? 1 : 0 }));
    setChoices(newChoices);
  };

  const handleSubmit = async () => {
    if (!questionText.trim() || choices.some(c => !c.choiceText.trim())) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest(`/api/questions/update/${questionID}`, {
        method: 'POST',
        body: { questionText },
      });

      await apiRequest('/api/choices/update', {
        method: 'POST',
        body: { choices: choices.map(c => ({ choiceID: c.choiceID, choiceText: c.choiceText, isCorrect: c.isCorrect })) },
      });

      showToast('Question updated', 'success');
      if (router.canGoBack()) router.back();
    } catch (error: any) {
      showToast('Failed to update question', 'error');
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
    inputBg: isDark ? '#111827' : '#fff',
    orange: '#FE6902',
    green: '#10B981',
  };

  if (isLoading) {
    return <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.bg }}><CapsActivityIndicator size="large" color={colors.orange} /></View>;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: colors.card, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/(dean)/dashboard' as any)} className="p-2">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: colors.text }}>Edit Question</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 100, gap: 16 }} showsVerticalScrollIndicator={false}>
        <View className="rounded-2xl p-4" style={{ backgroundColor: colors.card, flex: 1, minHeight: 280, elevation: 2 }}>
          <Text className="text-base font-bold mb-2" style={{ color: colors.text }}>Question Text</Text>
          <View className="border rounded-xl overflow-hidden flex-1" style={{ backgroundColor: colors.inputBg, borderColor: colors.border }}>
            <RichToolbar
              editor={richText}
              actions={[
                actions.setBold,
                actions.setItalic,
                actions.setUnderline,
                actions.heading1,
                actions.heading2,
                actions.insertBulletsList,
                actions.insertOrderedList,
                actions.insertLink,
                actions.keyboard,
              ]}
              style={{ backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }}
              iconTint={colors.text}
              selectedIconTint="#FE6902"
              disabledIconTint="#9ca3af"
            />
            <RichEditor
              ref={richText}
              initialContentHTML={questionText}
              onChange={setQuestionText}
              placeholder="Enter question..."
              style={{ backgroundColor: colors.inputBg, color: colors.text, flex: 1 } as any}
              initialHeight={180}
              useContainer
            />
          </View>
        </View>

        <View className="rounded-2xl p-4" style={{ backgroundColor: colors.card, elevation: 2 }}>
          <Text className="text-base font-bold mb-2" style={{ color: colors.text }}>Choices</Text>
          {choices.map((choice, idx) => (
            <View key={choice.choiceID || idx} className="flex-row items-center gap-3 mb-2.5">
              <TouchableOpacity className="w-7 h-7 rounded-full border-2 justify-center items-center" style={{ borderColor: choice.isCorrect ? colors.green : colors.border, backgroundColor: choice.isCorrect ? colors.green : undefined }} onPress={() => handleCorrectToggle(idx)} activeOpacity={0.7}>
                {choice.isCorrect ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
              </TouchableOpacity>
              <TextInput className="flex-1 border rounded-xl p-2.5 text-[15px]" style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }} value={choice.choiceText} onChangeText={(val) => handleChoiceChange(idx, val)} placeholder={`Choice ${String.fromCharCode(65 + idx)}`} placeholderTextColor={colors.textSecondary} />
            </View>
          ))}
        </View>

        <TouchableOpacity className="flex-row items-center justify-center bg-[#FE6902] py-3.5 rounded-xl gap-2" style={{ opacity: isSubmitting ? 0.6 : 1 }} onPress={handleSubmit} disabled={isSubmitting} activeOpacity={0.8}>
          {isSubmitting ? <CapsActivityIndicator color="#fff" /> : <><Ionicons name="save" size={20} color="#fff" /><Text className="text-white text-base font-bold">Save Changes</Text></>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
