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
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
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
        method: 'PUT',
        body: { questionText },
      });

      await apiRequest('/api/choices/update', {
        method: 'PUT',
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
    return <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={colors.orange} /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/(dean)/dashboard' as any)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Question</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card, flex: 1, minHeight: 280 }]}>
          <Text style={[styles.label, { color: colors.text }]}>Question Text</Text>
          <View style={[styles.editorWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
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
              style={[styles.toolbar, { backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }]}
              iconTint={colors.text}
              selectedIconTint="#FE6902"
              disabledIconTint="#9ca3af"
            />
            <RichEditor
              ref={richText}
              initialContentHTML={questionText}
              onChange={setQuestionText}
              placeholder="Enter question..."
              style={[styles.editor, { backgroundColor: colors.inputBg, color: colors.text }]}
              initialHeight={180}
              useContainer
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.text }]}>Choices</Text>
          {choices.map((choice, idx) => (
            <View key={choice.choiceID || idx} style={styles.choiceRow}>
              <TouchableOpacity style={[styles.radio, { borderColor: choice.isCorrect ? colors.green : colors.border, backgroundColor: choice.isCorrect ? colors.green : undefined }]} onPress={() => handleCorrectToggle(idx)} activeOpacity={0.7}>
                {choice.isCorrect ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
              </TouchableOpacity>
              <TextInput style={[styles.choiceInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} value={choice.choiceText} onChangeText={(val) => handleChoiceChange(idx, val)} placeholder={`Choice ${String.fromCharCode(65 + idx)}`} placeholderTextColor={colors.textSecondary} />
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.submitBtn, { opacity: isSubmitting ? 0.6 : 1 }]} onPress={handleSubmit} disabled={isSubmitting} activeOpacity={0.8}>
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <><Ionicons name="save" size={20} color="#fff" /><Text style={styles.submitBtnText}>Save Changes</Text></>}
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
  label: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15, minHeight: 80 },
  editorWrapper: { borderWidth: 1, borderRadius: 12, overflow: 'hidden', flex: 1 },
  toolbar: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  editor: { borderBottomLeftRadius: 12, borderBottomRightRadius: 12, flex: 1 },
  choiceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  radio: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  choiceInput: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 10, fontSize: 15 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FE6902', paddingVertical: 14, borderRadius: 12, gap: 8 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
