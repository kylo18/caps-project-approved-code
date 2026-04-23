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
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import CapsActivityIndicator from '../../../src/components/CapsActivityIndicator';
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
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: colors.card, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} className="p-2"><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: colors.text }}>Add Exam Question</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 100, gap: 16 }} showsVerticalScrollIndicator={false}>
        <View className="rounded-2xl p-4" style={{ backgroundColor: colors.card, elevation: 2 }}>
          <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.text }}>Question Text *</Text>
          <TextInput className="border rounded-[10px] p-2.5 text-sm min-h-[60px] mb-2.5" style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }} value={questionText} onChangeText={setQuestionText} placeholder="Enter question..." placeholderTextColor={colors.textSecondary} multiline numberOfLines={4} textAlignVertical="top" />
          <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.text }}>Image URL (optional)</Text>
          <TextInput className="border rounded-[10px] p-2.5 text-sm min-h-[60px]" style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }} value={questionImage} onChangeText={setQuestionImage} placeholder="https://..." placeholderTextColor={colors.textSecondary} />
        </View>

        <View className="rounded-2xl p-4" style={{ backgroundColor: colors.card, elevation: 2 }}>
          <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.text }}>Choices</Text>
          {choices.map((choice, idx) => (
            <View key={idx} className="mb-3">
              <View className="flex-row items-center gap-2 mb-1.5">
                <Text className="text-base font-bold" style={{ color: colors.text }}>{String.fromCharCode(65 + idx)}.</Text>
                <TextInput className="flex-1 border rounded-lg p-2 text-sm" style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }} value={choice.choiceText} onChangeText={(val) => handleChoiceChange(idx, 'choiceText', val)} placeholder="Choice text" placeholderTextColor={colors.textSecondary} />
                <TouchableOpacity className="w-6 h-6 rounded-full border-2 justify-center items-center" style={[{ borderColor: choice.isCorrect ? colors.green : colors.border }, choice.isCorrect && { backgroundColor: colors.green }]} onPress={() => handleCorrectToggle(idx)}>
                  {choice.isCorrect && <Ionicons name="checkmark" size={14} color="#fff" />}
                </TouchableOpacity>
              </View>
              <TextInput className="border rounded-lg p-2 text-xs" style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }} value={choice.choiceImage} onChangeText={(val) => handleChoiceChange(idx, 'choiceImage', val)} placeholder="Image URL (optional)" placeholderTextColor={colors.textSecondary} />
            </View>
          ))}
        </View>

        <TouchableOpacity className="flex-row items-center justify-center bg-[#FE6902] py-3.5 rounded-xl gap-2" style={{ opacity: isSubmitting ? 0.6 : 1 }} onPress={handleSubmit} disabled={isSubmitting} activeOpacity={0.8}>
          {isSubmitting ? <CapsActivityIndicator color="#fff" /> : <><Ionicons name="checkmark-circle" size={20} color="#fff" /><Text className="text-white text-base font-bold">Add Question</Text></>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
