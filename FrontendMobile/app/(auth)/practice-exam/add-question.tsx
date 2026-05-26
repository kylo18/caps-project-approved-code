// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Form for adding a new multiple-choice exam question to a subject.
//          Collects question text and four answer choices, marks one as correct,
//          then creates the question and its choices via the API.
// Key sections:
//   - State: questionText, choices array (4 choices with isCorrect flag), submitting flag
//   - handleChoiceChange: updates choice text at a given index
//   - handleCorrectToggle: sets exactly one choice as correct (radio behavior)
//   - handleSubmit: validates inputs, POSTs question then choices to the API
//   - UI: header, question text input (multiline), choices section with radio
//         buttons and text inputs, hint text, submit button
// ─────────────────────────────────────────────────────────────────────────────
import { useRef, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';

export default function AddQuestionForm() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [questionText, setQuestionText] = useState('');
  const [choices, setChoices] = useState([
    { choiceText: '', isCorrect: false },
    { choiceText: '', isCorrect: false },
    { choiceText: '', isCorrect: false },
    { choiceText: '', isCorrect: false },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const richText = useRef<RichEditor>(null);

  const subjectID = params.subjectID;
  const personalQuizID = params.personalQuizID;

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
    if (!questionText.trim()) {
      showToast('Please enter question text', 'error');
      return;
    }
    if (choices.some(c => !c.choiceText.trim())) {
      showToast('Please fill in all choices', 'error');
      return;
    }
    if (!choices.some(c => c.isCorrect)) {
      showToast('Please select the correct answer', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build exactly 5 choices (4 user choices + 1 automatic "None of the above")
      const allChoices = [
        ...choices.map((c) => ({
          choiceText: c.choiceText,
          isCorrect: c.isCorrect,
        })),
        { choiceText: 'None of the above', isCorrect: false },
      ];

      if (personalQuizID) {
        // ── Personal Quiz flow: add question to a quiz container ──
        const questionRes = await apiRequest('/api/personal-quiz-questions', {
          method: 'POST',
          body: {
            personalQuizID: Number(personalQuizID),
            questionText: questionText.trim(),
            score: 1,
            coverage_id: null,
          },
        });
        const questionID = questionRes?.quizQuestion?.personalQuizQuestionID || questionRes?.personalQuizQuestionID || questionRes?.data?.personalQuizQuestionID;
        if (questionID) {
          await apiRequest('/api/personal-quiz-choices', {
            method: 'POST',
            body: {
              personalQuizQuestionID: Number(questionID),
              choices: allChoices.map((c) => ({ choiceText: c.choiceText, isCorrect: c.isCorrect ? 1 : 0 })),
            },
          });
        }
        showToast('Question added to quiz', 'success');
        router.back();
      } else {
        // ── Legacy standalone question flow ──
        const questionRes = await apiRequest('/api/questions/add', {
          method: 'POST',
          body: {
            subjectID: Number(subjectID),
            questionText: questionText.trim(),
            coverage_id: 1,
            score: 1,
            difficulty_id: 1,
            status_id: 2,
            purpose_id: 1,
          },
        });

        const questionID = questionRes?.questionID || questionRes?.data?.questionID || questionRes?.data?.id;

        if (questionID) {
          await apiRequest('/api/questions/choices', {
            method: 'POST',
            body: {
              questionID: Number(questionID),
              choices: allChoices,
            },
          });
        }

        showToast('Question added successfully', 'success');
        router.back();
      }
    } catch (error: unknown) {
      const message = error instanceof Error && 'data' in error
        ? (error as { data?: { message?: string } }).data?.message || error.message || 'Failed to add question'
        : 'Failed to add question';
      showToast(message, 'error');
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
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: colors.text }}>{personalQuizID ? 'Add to Quiz' : 'Add Question'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 100, gap: 16 }} showsVerticalScrollIndicator={false}>
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
              style={{ backgroundColor: colors.card }}
              iconTint={colors.text}
              selectedIconTint="#FE6902"
              disabledIconTint="#9ca3af"
            />
            <RichEditor
              ref={richText}
              initialContentHTML={questionText}
              onChange={setQuestionText}
              placeholder="Enter question..."
              style={{ backgroundColor: colors.inputBg, flex: 1 }}
              initialHeight={180}
              useContainer
            />
          </View>
        </View>

        <View className="rounded-2xl p-4" style={{ backgroundColor: colors.card, elevation: 2 }}>
          <Text className="text-base font-bold mb-2" style={{ color: colors.text }}>Choices</Text>
          {choices.map((choice, idx) => (
            <View key={idx} className="flex-row items-center gap-3 mb-2.5">
              <TouchableOpacity
                className="w-7 h-7 rounded-full border-2 justify-center items-center"
                style={[{ borderColor: choice.isCorrect ? colors.green : colors.border }, choice.isCorrect && { backgroundColor: colors.green }]}
                onPress={() => handleCorrectToggle(idx)}
                activeOpacity={0.7}
              >
                {choice.isCorrect && <Ionicons name="checkmark" size={16} color="#fff" />}
              </TouchableOpacity>
              <TextInput
                className="flex-1 border rounded-xl p-2.5 text-[15px]"
                style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }}
                value={choice.choiceText}
                onChangeText={(val) => handleChoiceChange(idx, val)}
                placeholder={`Choice ${String.fromCharCode(65 + idx)}`}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          ))}
          <Text className="text-xs mt-2" style={{ color: colors.textSecondary }}>Tap the circle to mark correct answer</Text>
        </View>

        <TouchableOpacity
          className="flex-row items-center justify-center bg-[#FE6902] py-3.5 rounded-xl gap-2"
          style={{ opacity: isSubmitting ? 0.6 : 1 }}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <CapsActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text className="text-white text-base font-bold">Add Question</Text>
            </>
          )}
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
