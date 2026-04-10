// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Form for adding a new practice question (questionType: 'practice')
//          to a subject. Simpler than the exam question form -- no image support.
//          Collects question text and four choices, marks one as correct.
// Key sections:
//   - State: questionText, choices array (4 choices with isCorrect flag), submitting flag
//   - handleChoiceChange: updates choice text at a given index
//   - handleCorrectToggle: sets exactly one choice as correct (radio behavior)
//   - handleSubmit: validates inputs, POSTs question with type 'practice' then
//            choices to the API
//   - UI: header, question text input (multiline), choices section with radio
//         buttons and text inputs, submit button
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';

export default function CombinedPracticeQuestionForm() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const subjectID = params.subjectID;

  const [questionText, setQuestionText] = useState('');
  const [choices, setChoices] = useState([
    { choiceText: '', isCorrect: false },
    { choiceText: '', isCorrect: false },
    { choiceText: '', isCorrect: false },
    { choiceText: '', isCorrect: false },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChoiceChange = (index, value) => {
    const newChoices = [...choices];
    newChoices[index].choiceText = value;
    setChoices(newChoices);
  };

  const handleCorrectToggle = (index) => {
    const newChoices = choices.map((c, i) => ({ ...c, isCorrect: i === index }));
    setChoices(newChoices);
  };

  const handleSubmit = async () => {
    if (!questionText.trim() || choices.some(c => !c.choiceText.trim())) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    if (!choices.some(c => c.isCorrect)) {
      showToast('Please select the correct answer', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const questionRes = await apiRequest('/api/questions/add', { method: 'POST', body: { subjectID, questionText, questionType: 'practice' } });
      const questionID = questionRes?.questionID || questionRes?.data?.questionID;
      if (questionID) {
        await apiRequest('/api/questions/choices', { method: 'POST', body: { questionID, choices: choices.map(c => ({ choiceText: c.choiceText, isCorrect: c.isCorrect ? 1 : 0 })) } });
      }
      showToast('Practice question added', 'success');
      router.back();
    } catch (error) {
      showToast(error.message || 'Failed to add question', 'error');
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

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add Practice Question</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.text }]}>Question Text *</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} value={questionText} onChangeText={setQuestionText} placeholder="Enter question..." placeholderTextColor={colors.textSecondary} multiline numberOfLines={4} textAlignVertical="top" />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.text }]}>Choices</Text>
          {choices.map((choice, idx) => (
            <View key={idx} style={styles.choiceRow}>
              <TouchableOpacity style={[styles.radio, { borderColor: choice.isCorrect ? colors.green : colors.border }, choice.isCorrect && { backgroundColor: colors.green }]} onPress={() => handleCorrectToggle(idx)} activeOpacity={0.7}>
                {choice.isCorrect && <Ionicons name="checkmark" size={16} color="#fff" />}
              </TouchableOpacity>
              <TextInput style={[styles.choiceInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} value={choice.choiceText} onChangeText={(val) => handleChoiceChange(idx, val)} placeholder={`Choice ${String.fromCharCode(65 + idx)}`} placeholderTextColor={colors.textSecondary} />
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.submitBtn, { opacity: isSubmitting ? 0.6 : 1 }]} onPress={handleSubmit} disabled={isSubmitting} activeOpacity={0.8}>
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <><Ionicons name="checkmark-circle" size={20} color="#fff" /><Text style={styles.submitBtnText}>Add Question</Text></>}
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
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 14, minHeight: 60 },
  choiceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  radio: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  choiceInput: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FE6902', paddingVertical: 14, borderRadius: 12, gap: 8 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
