// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Form for adding a new exam question with support for optional images
//          on both the question and each choice. Creates the question and its
//          choices via the API.
// Key sections:
//   - State: questionText, questionImage URL, choices array (4 choices each
//            with choiceText, choiceImage, and isCorrect flag), submitting flag
//   - handleChoiceChange: updates a specific field (choiceText or choiceImage)
//   - handleCorrectToggle: sets exactly one choice as correct (radio behavior)
//   - handleSubmit: validates inputs, POSTs question (with optional image) then
//            choices (with optional images) to the API
//   - UI: header, question text input + image URL input, choices section with
//         text input, image URL input, and radio button per choice, submit button
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';

export default function CombinedExamQuestionForm() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const subjectID = params.subjectID;

  const [questionText, setQuestionText] = useState('');
  const [questionImage, setQuestionImage] = useState('');
  const [choices, setChoices] = useState([
    { choiceText: '', choiceImage: '', isCorrect: false },
    { choiceText: '', choiceImage: '', isCorrect: false },
    { choiceText: '', choiceImage: '', isCorrect: false },
    { choiceText: '', choiceImage: '', isCorrect: false },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChoiceChange = (index, field, value) => {
    const newChoices = [...choices];
    newChoices[index][field] = value;
    setChoices(newChoices);
  };

  const handleCorrectToggle = (index) => {
    const newChoices = choices.map((c, i) => ({ ...c, isCorrect: i === index }));
    setChoices(newChoices);
  };

  const handleSubmit = async () => {
    if (!questionText.trim() || choices.some(c => !c.choiceText.trim())) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    if (!choices.some(c => c.isCorrect)) {
      showToast('Please select the correct answer', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const questionRes = await apiRequest('/api/questions/add', {
        method: 'POST',
        body: { subjectID, questionText, questionImage: questionImage || null, questionType: 'multiple_choice' },
      });

      const questionID = questionRes?.questionID || questionRes?.data?.questionID;
      if (questionID) {
        await apiRequest('/api/questions/choices', {
          method: 'POST',
          body: {
            questionID,
            choices: choices.map(c => ({
              choiceText: c.choiceText,
              choiceImage: c.choiceImage || null,
              isCorrect: c.isCorrect ? 1 : 0,
            })),
          },
        });
      }

      showToast('Exam question added', 'success');
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add Exam Question</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.text }]}>Question Text *</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} value={questionText} onChangeText={setQuestionText} placeholder="Enter question..." placeholderTextColor={colors.textSecondary} multiline numberOfLines={4} textAlignVertical="top" />
          <Text style={[styles.label, { color: colors.text }]}>Image URL (optional)</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} value={questionImage} onChangeText={setQuestionImage} placeholder="https://..." placeholderTextColor={colors.textSecondary} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.text }]}>Choices</Text>
          {choices.map((choice, idx) => (
            <View key={idx} style={styles.choiceBlock}>
              <View style={styles.choiceRow}>
                <Text style={[styles.choiceLabel, { color: colors.text }]}>{String.fromCharCode(65 + idx)}.</Text>
                <TextInput style={[styles.choiceInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} value={choice.choiceText} onChangeText={(val) => handleChoiceChange(idx, 'choiceText', val)} placeholder="Choice text" placeholderTextColor={colors.textSecondary} />
                <TouchableOpacity style={[styles.radio, { borderColor: choice.isCorrect ? colors.green : colors.border }, choice.isCorrect && { backgroundColor: colors.green }]} onPress={() => handleCorrectToggle(idx)}>
                  {choice.isCorrect && <Ionicons name="checkmark" size={14} color="#fff" />}
                </TouchableOpacity>
              </View>
              <TextInput style={[styles.choiceImageInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} value={choice.choiceImage} onChangeText={(val) => handleChoiceChange(idx, 'choiceImage', val)} placeholder="Image URL (optional)" placeholderTextColor={colors.textSecondary} />
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
  input: { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 14, minHeight: 60, marginBottom: 10 },
  choiceBlock: { marginBottom: 12 },
  choiceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  choiceLabel: { fontSize: 16, fontWeight: '700' },
  choiceInput: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 8, fontSize: 14 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  choiceImageInput: { borderWidth: 1, borderRadius: 8, padding: 8, fontSize: 12 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FE6902', paddingVertical: 14, borderRadius: 12, gap: 8 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
