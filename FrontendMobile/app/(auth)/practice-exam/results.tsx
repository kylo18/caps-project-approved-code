// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Post-exam results screen showing the student's score, performance
//          breakdown, and a per-question review with correct/incorrect filtering.
//          Also supports loading historical results via a resultId parameter.
// Key sections:
//   - State: score metrics, exam results array, active tab (all/correct/incorrect)
//   - fetchHistoricalResult: fetches a past exam result from the API by resultId
//   - getScoreColor / getScoreMessage: determines color and encouraging message based on percentage
//   - formatDate: formats date strings for display
//   - filteredResults: filters exam results by the active tab selection
//   - Loading / error states: shows spinner or error with back-to-dashboard button
//   - UI: score header (percentage circle, icon, message), score summary card,
//         performance bar, question review section with tabs, per-question cards
//         showing user answer vs correct answer, "Back" and "Retake Exam" buttons
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import {   View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import RenderHtml from 'react-native-render-html';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { shareExamResult } from '../../../src/services/shareService';

export default function PracticeExamResults() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { width: windowWidth } = useWindowDimensions();

  const resultId = params.resultId as string;
  const origin = (params.origin as string) || 'home';
  const [loading, setLoading] = useState(!!resultId);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'correct' | 'incorrect'>('all');

  const [earnedPoints, setEarnedPoints] = useState(parseInt(params.earnedPoints as string) || 0);
  const [totalPoints, setTotalPoints] = useState(parseInt(params.totalPoints as string) || 0);
  const [percentage, setPercentage] = useState(parseInt(params.percentage as string) || 0);
  const [subjectName, setSubjectName] = useState(params.subjectName as string);
  const [totalItems, setTotalItems] = useState(parseInt(params.totalItems as string) || 0);
  const [examResults, setExamResults] = useState<any[]>([]);
  const [examDuration, setExamDuration] = useState(params.examDuration as string);
  const [startTime, setStartTime] = useState(params.startTime as string);
  const [endTime, setEndTime] = useState(params.endTime as string);

  useEffect(() => {
    if (resultId) {
      fetchHistoricalResult();
    }
  }, [resultId]);

  const fetchHistoricalResult = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const response = await apiRequest(`/api/practice-exam/result/${resultId}`);
      const data = response?.data || response;

      setEarnedPoints(data?.score?.earnedPoints ?? data?.earnedPoints ?? 0);
      setTotalPoints(data?.score?.totalPoints ?? data?.totalPoints ?? 0);
      setPercentage(data?.score?.percentage ?? data?.percentage ?? 0);
      setSubjectName(data?.subjectName ?? subjectName);
      setExamDuration(data?.examDuration ?? data?.duration ?? null);
      setStartTime(data?.startTime ?? null);
      setEndTime(data?.created_at ?? data?.endTime ?? null);

      const results = data?.results || [];
      setExamResults(results);
      setTotalItems(results.length);
    } catch (error: unknown) {
      setFetchError(error instanceof Error ? error.message : 'Failed to load exam result');
    } finally {
      setLoading(false);
    }
  };

  const colors = {
    bg: isDark ? '#000' : '#f3f4f6',
    card: isDark ? '#1f2937' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    orange: '#FE6902',
    green: '#10B981',
    greenBg: isDark ? '#064E3B' : '#D1FAE5',
    greenBorder: isDark ? '#065F46' : '#A7F3D0',
    red: '#EF4444',
    redBg: isDark ? '#7F1D1D' : '#FEE2E2',
    redBorder: isDark ? '#991B1B' : '#FECACA',
    orangeBg: isDark ? '#7C2D12' : '#FFF7ED',
    orangeBorder: isDark ? '#9A3412' : '#FFEDD5',
  };

  const getScoreColor = () => {
    if (percentage >= 80) return colors.green;
    if (percentage >= 60) return '#F59E0B';
    return colors.red;
  };

  const getScoreMessage = () => {
    if (percentage >= 90) return { icon: 'trophy' as const, message: 'Outstanding!', color: '#F59E0B' };
    if (percentage >= 80) return { icon: 'star' as const, message: 'Great Job!', color: colors.green };
    if (percentage >= 60) return { icon: 'thumbs-up' as const, message: 'Good Effort!', color: '#F59E0B' };
    return { icon: 'book' as const, message: 'Keep Practicing!', color: colors.red };
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'N/A';
    }
  };

  const scoreInfo = getScoreMessage();
  const scoreColor = getScoreColor();
  const correctCount = examResults.filter(q => q.isCorrect).length;
  const incorrectCount = examResults.filter(q => !q.isCorrect).length;

  const filteredResults = examResults.filter(q => {
    if (activeTab === 'all') return true;
    if (activeTab === 'correct') return q.isCorrect;
    if (activeTab === 'incorrect') return !q.isCorrect;
    return true;
  });

  const backRoute = origin === 'profile' ? '/(auth)/(student)/insights' : '/(auth)/(student)/dashboard';
  const backLabel = origin === 'profile' ? 'Back to Profile' : 'Back to Home';

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.bg }}>
        <CapsActivityIndicator size="large" color={colors.orange} />
        <Text className="text-sm mt-3" style={{ color: colors.textSecondary }}>Loading exam result...</Text>
      </View>
    );
  }

  if (fetchError) {
    return (
      <View className="flex-1 justify-center items-center px-5" style={{ backgroundColor: colors.bg }}>
        <Ionicons name="alert-circle" size={48} color={colors.red} />
        <Text className="text-base font-semibold mt-3 mb-5 text-center" style={{ color: colors.red }}>{fetchError}</Text>
        <TouchableOpacity className="bg-[#FE6902] px-6 py-3.5 rounded-xl" onPress={() => router.replace('/(auth)/(student)/dashboard')} activeOpacity={0.8}>
          <Text className="text-white text-base font-bold">Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Score Header */}
        <View className="items-center p-8 rounded-[20px] mb-4" style={{ backgroundColor: colors.card, elevation: 2 }}>
          <View className="w-[120px] h-[120px] rounded-full border-[6px] justify-center items-center mb-4" style={{ borderColor: scoreColor }}>
            <Text className="text-4xl font-black" style={{ color: scoreColor }}>{percentage}%</Text>
          </View>
          <View className="mb-2">
            <Ionicons name={scoreInfo.icon} size={32} color={scoreInfo.color} />
          </View>
          <Text className="text-[22px] font-bold mb-1" style={{ color: scoreInfo.color }}>{scoreInfo.message}</Text>
          <Text className="text-base font-semibold" style={{ color: colors.text }}>{subjectName || 'Practice Exam'}</Text>
        </View>

        {/* Score Details Card */}
        <View className="rounded-2xl p-5 mb-4" style={{ backgroundColor: colors.card, elevation: 2 }}>
          <Text className="text-lg font-bold mb-4" style={{ color: colors.text }}>Score Summary</Text>

          <View className="rounded-xl p-4 mb-2 items-center" style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
            <Text className="text-[32px] font-extrabold" style={{ color: colors.orange }}>{earnedPoints}/{totalPoints}</Text>
            <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>Total Score</Text>
          </View>

          <View className="rounded-xl p-4 mb-2 items-center" style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
            <Text className="text-[32px] font-extrabold" style={{ color: colors.text }}>{percentage}%</Text>
            <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>Percentage</Text>
          </View>

          <View className="rounded-xl border p-3 mt-2" style={{ borderColor: colors.border }}>
            <View className="flex-row justify-between py-1.5">
              <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>Subject:</Text>
              <Text className="text-xs font-semibold" style={{ color: colors.text }}>{subjectName || `Subject ${params.subjectID}`}</Text>
            </View>
            {examDuration && (
              <View className="flex-row justify-between py-1.5">
                <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>Duration:</Text>
                <Text className="text-xs font-semibold" style={{ color: colors.text }}>{examDuration}</Text>
              </View>
            )}
            {(startTime || endTime) && (
              <>
                {startTime && (
                  <View className="flex-row justify-between py-1.5">
                    <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>Started:</Text>
                    <Text className="text-xs font-semibold" style={{ color: colors.text }}>{formatDate(startTime)}</Text>
                  </View>
                )}
                <View className="flex-row justify-between py-1.5">
                  <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>{startTime ? 'Finished:' : 'Taken:'}</Text>
                  <Text className="text-xs font-semibold" style={{ color: colors.text }}>{formatDate(endTime)}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Performance Breakdown */}
        <View className="rounded-2xl p-5 mb-4" style={{ backgroundColor: colors.card, elevation: 2 }}>
          <Text className="text-lg font-bold mb-4" style={{ color: colors.text }}>Performance</Text>
          <View className="h-3 bg-gray-200 rounded-md mb-3">
            <View className="h-full rounded-md" style={{ width: `${percentage}%`, backgroundColor: scoreColor }} />
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm font-semibold" style={{ color: colors.green }}>✓ {correctCount} Correct</Text>
            <Text className="text-sm font-semibold" style={{ color: colors.red }}>✗ {incorrectCount} Incorrect</Text>
          </View>
        </View>

        {/* Question Review Section */}
        {examResults.length > 0 && (
          <View className="rounded-2xl p-5 mb-4" style={{ backgroundColor: colors.card, elevation: 2 }}>
            <Text className="text-lg font-bold mb-4" style={{ color: colors.text }}>Question Review</Text>

            {/* Tabs */}
            <View className="flex-row gap-2 mb-4">
              <TouchableOpacity
                className="flex-1 py-2 rounded-lg items-center"
                style={activeTab === 'all' ? { backgroundColor: colors.orangeBg } : undefined}
                onPress={() => setActiveTab('all')}
                activeOpacity={0.7}
              >
                <Text className="text-[13px] font-medium text-center" style={activeTab === 'all' ? { color: colors.orange, fontWeight: '700' } : undefined}>All Questions</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-2 rounded-lg items-center"
                style={activeTab === 'correct' ? { backgroundColor: colors.greenBg } : undefined}
                onPress={() => setActiveTab('correct')}
                activeOpacity={0.7}
              >
                <Text className="text-[13px] font-medium text-center" style={activeTab === 'correct' ? { color: colors.green, fontWeight: '700' } : undefined}>Correct ({correctCount})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-2 rounded-lg items-center"
                style={activeTab === 'incorrect' ? { backgroundColor: colors.redBg } : undefined}
                onPress={() => setActiveTab('incorrect')}
                activeOpacity={0.7}
              >
                <Text className="text-[13px] font-medium text-center" style={activeTab === 'incorrect' ? { color: colors.red, fontWeight: '700' } : undefined}>Incorrect ({incorrectCount})</Text>
              </TouchableOpacity>
            </View>

            {/* Questions List */}
            {filteredResults.length === 0 ? (
              <Text className="text-sm text-center py-5" style={{ color: colors.textSecondary }}>No questions to display.</Text>
            ) : (
              filteredResults.map((q, index) => {
                return (
                  <View
                    key={q.questionID || index}
                    className="rounded-xl p-3 mb-3"
                    style={[
                      {
                        backgroundColor: q.isCorrect ? colors.greenBg : colors.redBg,
                        borderColor: q.isCorrect ? colors.greenBorder : colors.redBorder,
                        borderWidth: 1,
                      }
                    ]}
                  >
                    {/* Question Header */}
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-sm font-bold" style={{ color: colors.text }}>Q{index + 1}</Text>
                      <View className="flex-row items-center px-2 py-1 rounded-xl" style={{ backgroundColor: q.isCorrect ? colors.green : colors.red, gap: 4 }}>
                        <Ionicons name={q.isCorrect ? 'checkmark-circle' : 'close-circle'} size={16} color="#fff" />
                        <Text className="text-white text-xs font-semibold">{q.isCorrect ? 'Correct' : 'Incorrect'}</Text>
                      </View>
                    </View>

                    {/* Question Text */}
                    <View className="mb-3">
                      <RenderHtml
                        contentWidth={windowWidth - 64}
                        source={{ html: q.questionText || '<p>No question text</p>' }}
                        tagsStyles={{
                          p: { color: colors.text, fontSize: 15, lineHeight: 22, marginBottom: 8 },
                          li: { color: colors.text, fontSize: 14, lineHeight: 20 },
                          strong: { color: colors.text, fontWeight: '700' },
                          u: { textDecorationLine: 'underline' },
                          a: { color: '#FE6902' },
                        }}
                      />
                    </View>

                    {/* Choices */}
                    {q.choices?.map((choice: any, cIdx: number) => {
                      const isUserChoice = choice.choiceID === q.selectedChoiceID;
                      const isUserChoiceCorrect = isUserChoice && q.isCorrect;
                      const isUserChoiceWrong = isUserChoice && !q.isCorrect;

                      let choiceBg = isDark ? '#1f2937' : '#fff';
                      let choiceBorder = colors.border;
                      let choiceIcon = null;

                      if (isUserChoiceCorrect) {
                        choiceBg = colors.greenBg;
                        choiceBorder = colors.green;
                        choiceIcon = <Ionicons name="checkmark-circle" size={18} color={colors.green} />;
                      } else if (isUserChoiceWrong) {
                        choiceBg = colors.redBg;
                        choiceBorder = colors.red;
                        choiceIcon = <Ionicons name="close-circle" size={18} color={colors.red} />;
                      }

                      return (
                        <View
                          key={choice.choiceID || cIdx}
                          className="flex-row items-center p-2.5 rounded-lg mb-1.5"
                          style={[
                            { backgroundColor: choiceBg, borderColor: choiceBorder, borderWidth: 1 }
                          ]}
                        >
                          <Text className="text-sm font-semibold mr-2" style={{ color: colors.text }}>
                            {String.fromCharCode(65 + cIdx)}.
                          </Text>
                          <Text className="text-sm leading-5 flex-1" style={{ color: colors.text }}>
                            {choice.choiceText?.replace(/<[^>]*>/g, '') || ''}
                          </Text>
                          {choiceIcon}
                        </View>
                      );
                    })}

                    {/* Points */}
                    <View className="mt-2 pt-2 border-t" style={{ borderTopColor: 'rgba(0,0,0,0.1)' }}>
                      <Text className="text-xs" style={{ color: colors.textSecondary }}>
                        Points: {q.pointsEarned ?? (q.isCorrect ? 1 : 0)}/{q.pointsPossible ?? 1}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Buttons */}
        <View className="mt-2 gap-3">
          <TouchableOpacity
            className="flex-row items-center justify-center py-3.5 rounded-xl border"
            style={{ borderColor: colors.border }}
            onPress={() => router.replace(backRoute)}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} style={{ marginRight: 8 }} />
            <Text className="text-base font-semibold" style={{ color: colors.text }}>
              {backLabel}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-center py-3.5 rounded-xl border"
            style={{ borderColor: colors.border }}
            onPress={() =>
              shareExamResult({
                subjectName: subjectName || undefined,
                percentage,
                earnedPoints,
                totalPoints,
                correctCount,
                incorrectCount,
              })
            }
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={20} color={colors.text} style={{ marginRight: 8 }} />
            <Text className="text-base font-semibold" style={{ color: colors.text }}>Share Result</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-center bg-[#FE6902] py-3.5 rounded-xl"
            style={{ elevation: 4 }}
            onPress={() => router.replace({
              pathname: '/(auth)/practice-exam/info',
              params: { subjectName, totalItems: String(totalItems), totalPoints: String(totalPoints), enableTimer: 'true', durationMinutes: '60' }
            })}
            activeOpacity={0.9}
          >
            <Ionicons name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text className="text-white text-base font-bold">Retake Exam</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
