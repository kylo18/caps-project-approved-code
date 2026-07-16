import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { getStudentColors } from '../../../src/features/student/ui/StudentUI';
import { getQuizResult } from '../../../src/services/studentClassService';

export default function ClassQuizResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const studentColors = getStudentColors(isDark);
  const { resultID, quizName } = useLocalSearchParams();
  const resultId = String(resultID);

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResult();
  }, []);

  async function loadResult() {
    try {
      const data = await getQuizResult(resultId);
      setResult(data?.data || data || {});
    } catch (error) {
      console.error('Error loading result:', error);
    } finally {
      setLoading(false);
    }
  }

  const score = result?.score ?? result?.accuracy ?? 0;
  const totalScore = result?.totalScore ?? 100;
  const accuracy = result?.accuracy ?? score;
  const passed = accuracy >= 75;

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: studentColors.surface }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <CapsActivityIndicator size="large" color={studentColors.orange} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: studentColors.page }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View className="px-6 pb-6 items-center" style={{ paddingTop: insets.top + 20, backgroundColor: studentColors.orange }}>
        <Pressable
          onPress={() => router.replace('/(auth)/(student)/dashboard')}
          className="absolute left-5 h-10 w-10 items-center justify-center rounded-full"
          style={{ top: insets.top + 12, backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>

        <Text
          className="text-white mt-8"
          style={{ fontFamily: 'Rubik', fontSize: 22, fontWeight: '600', lineHeight: 30 }}
        >
          {quizName || 'Quiz Result'}
        </Text>

        <View
          className="mt-5 w-28 h-28 rounded-full items-center justify-center border-4"
          style={{
            borderColor: passed ? studentColors.success : '#EF4444',
            backgroundColor: 'rgba(255,255,255,0.15)',
          }}
        >
          <Text className="text-white text-3xl font-bold" style={{ fontFamily: 'Rubik' }}>
            {Math.round(accuracy)}%
          </Text>
          <Text className="text-white/80 text-xs font-medium" style={{ fontFamily: 'Rubik' }}>
            {passed ? 'Passed' : 'Needs Review'}
          </Text>
        </View>

        <View className="flex-row mt-5 gap-6">
          <View className="items-center">
            <Text className="text-white text-lg font-bold" style={{ fontFamily: 'Rubik' }}>
              {Math.round(score)}
            </Text>
            <Text className="text-white/70 text-xs" style={{ fontFamily: 'Rubik' }}>
              Score
            </Text>
          </View>
          <View className="items-center">
            <Text className="text-white text-lg font-bold" style={{ fontFamily: 'Rubik' }}>
              {Math.round(totalScore)}
            </Text>
            <Text className="text-white/70 text-xs" style={{ fontFamily: 'Rubik' }}>
              Total
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 rounded-t-[24px] -mt-4"
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        style={{ backgroundColor: studentColors.card }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            color: studentColors.text,
            fontFamily: 'Rubik',
            fontSize: 18,
            fontWeight: '600',
            marginBottom: 16,
          }}
        >
          Question Breakdown
        </Text>

        {result?.questions?.length ? (
          result.questions.map((q: any, idx: number) => {
            const isCorrect = q.isCorrect ?? (q.selectedChoiceID && q.correctChoiceID && q.selectedChoiceID === q.correctChoiceID);
            const isWrong = q.selectedChoiceID && !isCorrect;
            const isUnanswered = !q.selectedChoiceID;

            return (
              <View
                key={q.personalQuizQuestionID || q.questionID || idx}
                className="rounded-2xl border-2 p-4 mb-3"
                style={{
                  borderColor: isCorrect ? studentColors.success : isWrong ? '#EF4444' : studentColors.border,
                  backgroundColor: isCorrect ? (isDark ? '#064E3B' : '#F0FDF4') : isWrong ? (isDark ? '#7F1D1D' : '#FEF2F2') : studentColors.card,
                }}
              >
                <View className="flex-row items-start gap-2">
                  <Ionicons
                    name={isCorrect ? 'checkmark-circle' : isWrong ? 'close-circle' : 'help-circle'}
                    size={20}
                    color={isCorrect ? studentColors.success : isWrong ? '#EF4444' : studentColors.textSoft}
                  />
                  <View className="flex-1">
                    <Text
                      style={{
                        color: studentColors.text,
                        fontFamily: 'Rubik',
                        fontSize: 14,
                        fontWeight: '500',
                        lineHeight: 20,
                      }}
                    >
                      {stripHtml(q.questionText || 'Question')}
                    </Text>

                    {q.choices?.map((c: any) => {
                      const isUserChoice = c.personalQuizChoiceID === q.selectedChoiceID || c.choiceID === q.selectedChoiceID;
                      const isCorrectChoice = c.personalQuizChoiceID === q.correctChoiceID || c.choiceID === q.correctChoiceID || c.isCorrect;

                      if (!isUserChoice && !isCorrectChoice) return null;

                      return (
                        <View
                          key={c.personalQuizChoiceID || c.choiceID}
                          className="flex-row items-center mt-2"
                          style={{ gap: 6 }}
                        >
                          <Ionicons
                            name={isCorrectChoice ? 'checkmark' : 'close'}
                            size={14}
                            color={isCorrectChoice ? studentColors.success : '#EF4444'}
                          />
                          <Text
                            style={{
                              color: isCorrectChoice ? '#065f46' : '#B91C1C',
                              fontFamily: 'Rubik',
                              fontSize: 13,
                              fontWeight: isUserChoice ? '600' : '400',
                            }}
                          >
                            {c.choiceText}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <Text
            className="text-center py-8"
            style={{ color: studentColors.textSoft, fontFamily: 'Rubik', fontSize: 14 }}
          >
            Detailed question breakdown is not available for this result.
          </Text>
        )}
      </ScrollView>

      {/* Done Button */}
      <View
        className="absolute bottom-0 left-0 right-0 px-6 py-4"
        style={{
          backgroundColor: studentColors.card,
          borderTopWidth: 1,
          borderTopColor: studentColors.border,
          paddingBottom: insets.bottom + 16,
        }}
      >
        <Pressable
          onPress={() => router.replace('/(auth)/(student)/dashboard')}
          className="rounded-2xl py-4 items-center"
          style={{ backgroundColor: studentColors.orange }}
        >
          <Text style={{ color: '#fff', fontFamily: 'Rubik', fontSize: 16, fontWeight: '600' }}>
            Back to Home
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const stripHtml = (input: string) =>
  input?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';
