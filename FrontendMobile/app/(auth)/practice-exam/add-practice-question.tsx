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
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
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

  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index].choiceText = value;
    setChoices(newChoices);
  };

  const handleCorrectToggle = (index: number) => {
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
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to add question', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const colors = {
    bg: isDark ? '#0F0F0F' : '#f3f4f6',
    card: isDark ? '#1A1A1A' : '#fff',
    text: isDark ? '#F5F5F5' : '#111827',
    textSecondary: isDark ? '#A3A3A3' : '#6b7280',
    border: isDark ? '#2A2A2A' : '#e5e7eb',
    inputBg: isDark ? '#242424' : '#fff',
    orange: '#FE6902',
    green: '#10B981',
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: colors.card, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} className="p-2"><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: colors.text }}>Add Practice Question</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 100, gap: 16 }} showsVerticalScrollIndicator={false}>
        <View className="rounded-2xl p-4" style={{ backgroundColor: colors.card, elevation: 2 }}>
          <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.text }}>Question Text *</Text>
          <TextInput className="border rounded-[10px] p-2.5 text-sm min-h-[60px]" style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }} value={questionText} onChangeText={setQuestionText} placeholder="Enter question..." placeholderTextColor={colors.textSecondary} multiline numberOfLines={4} textAlignVertical="top" />
        </View>

        <View className="rounded-2xl p-4" style={{ backgroundColor: colors.card, elevation: 2 }}>
          <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.text }}>Choices</Text>
          {choices.map((choice, idx) => (
            <View key={idx} className="flex-row items-center gap-3 mb-2">
              <TouchableOpacity className="w-7 h-7 rounded-full border-2 justify-center items-center" style={[{ borderColor: choice.isCorrect ? colors.green : colors.border }, choice.isCorrect && { backgroundColor: colors.green }]} onPress={() => handleCorrectToggle(idx)} activeOpacity={0.7}>
                {choice.isCorrect && <Ionicons name="checkmark" size={16} color="#fff" />}
              </TouchableOpacity>
              <TextInput className="flex-1 border rounded-lg p-2.5 text-sm" style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }} value={choice.choiceText} onChangeText={(val) => handleChoiceChange(idx, val)} placeholder={`Choice ${String.fromCharCode(65 + idx)}`} placeholderTextColor={colors.textSecondary} />
            </View>
          ))}
        </View>

        <TouchableOpacity className="flex-row items-center justify-center bg-[#FE6902] py-3.5 rounded-xl gap-2" style={{ opacity: isSubmitting ? 0.6 : 1 }} onPress={handleSubmit} disabled={isSubmitting} activeOpacity={0.8}>
          {isSubmitting ? <CapsActivityIndicator color="#fff" /> : <><Ionicons name="checkmark-circle" size={20} color="#fff" /><Text className="text-white text-base font-bold">Add Question</Text></>}
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
