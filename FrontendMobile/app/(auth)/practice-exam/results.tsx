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
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';

export default function PracticeExamResults() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const resultId = params.resultId as string;
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
    } catch (error: any) {
      setFetchError(error.message || 'Failed to load exam result');
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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.orange} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading exam result...</Text>
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle" size={48} color={colors.red} />
        <Text style={[styles.errorText, { color: colors.red }]}>{fetchError}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(auth)/(student)/dashboard')} activeOpacity={0.8}>
          <Text style={styles.backBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Score Header */}
        <View style={[styles.scoreHeader, { backgroundColor: colors.card }]}>
          <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
            <Text style={[styles.scorePercent, { color: scoreColor }]}>{percentage}%</Text>
          </View>
          <View style={styles.scoreIconContainer}>
            <Ionicons name={scoreInfo.icon} size={32} color={scoreInfo.color} />
          </View>
          <Text style={[styles.scoreMessage, { color: scoreInfo.color }]}>{scoreInfo.message}</Text>
          <Text style={[styles.subjectName, { color: colors.text }]}>{subjectName || 'Practice Exam'}</Text>
        </View>

        {/* Score Details Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Score Summary</Text>
          
          <View style={[styles.scoreBox, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
            <Text style={[styles.scoreBoxValue, { color: colors.orange }]}>{earnedPoints}/{totalPoints}</Text>
            <Text style={[styles.scoreBoxLabel, { color: colors.textSecondary }]}>Total Score</Text>
          </View>

          <View style={[styles.scoreBox, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
            <Text style={[styles.scoreBoxValue, { color: colors.text }]}>{percentage}%</Text>
            <Text style={[styles.scoreBoxLabel, { color: colors.textSecondary }]}>Percentage</Text>
          </View>

          <View style={[styles.detailsList, { borderColor: colors.border }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Subject:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{subjectName || `Subject ${params.subjectID}`}</Text>
            </View>
            {examDuration && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Duration:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{examDuration}</Text>
              </View>
            )}
            {(startTime || endTime) && (
              <>
                {startTime && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Started:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(startTime)}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{startTime ? 'Finished:' : 'Taken:'}</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(endTime)}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Performance Breakdown */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Performance</Text>
          <View style={styles.performanceBar}>
            <View style={[styles.performanceFill, { width: `${percentage}%`, backgroundColor: scoreColor }]} />
          </View>
          <View style={styles.performanceLabels}>
            <Text style={[styles.performanceLabel, { color: colors.green }]}>✓ {correctCount} Correct</Text>
            <Text style={[styles.performanceLabel, { color: colors.red }]}>✗ {incorrectCount} Incorrect</Text>
          </View>
        </View>

        {/* Question Review Section */}
        {examResults.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Question Review</Text>

            {/* Tabs */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'all' && { backgroundColor: colors.orangeBg }]}
                onPress={() => setActiveTab('all')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, activeTab === 'all' && { color: colors.orange, fontWeight: '700' }]}>All Questions</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'correct' && { backgroundColor: colors.greenBg }]}
                onPress={() => setActiveTab('correct')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, activeTab === 'correct' && { color: colors.green, fontWeight: '700' }]}>Correct ({correctCount})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'incorrect' && { backgroundColor: colors.redBg }]}
                onPress={() => setActiveTab('incorrect')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, activeTab === 'incorrect' && { color: colors.red, fontWeight: '700' }]}>Incorrect ({incorrectCount})</Text>
              </TouchableOpacity>
            </View>

            {/* Questions List */}
            {filteredResults.length === 0 ? (
              <Text style={[styles.emptyQuestions, { color: colors.textSecondary }]}>No questions to display.</Text>
            ) : (
              filteredResults.map((q, index) => {
                const userChoice = q.choices?.find((c: any) => c.choiceID === q.selectedChoiceID);
                const correctChoice = q.choices?.find((c: any) => c.isCorrect);

                return (
                  <View
                    key={q.questionID || index}
                    style={[
                      styles.questionCard,
                      {
                        backgroundColor: q.isCorrect ? colors.greenBg : colors.redBg,
                        borderColor: q.isCorrect ? colors.greenBorder : colors.redBorder,
                        borderWidth: 1,
                      }
                    ]}
                  >
                    {/* Question Header */}
                    <View style={styles.questionHeader}>
                      <Text style={[styles.questionNumber, { color: colors.text }]}>Q{index + 1}</Text>
                      <View style={[styles.correctnessBadge, { backgroundColor: q.isCorrect ? colors.green : colors.red }]}>
                        <Ionicons name={q.isCorrect ? 'checkmark-circle' : 'close-circle'} size={16} color="#fff" />
                        <Text style={styles.correctnessText}>{q.isCorrect ? 'Correct' : 'Incorrect'}</Text>
                      </View>
                    </View>

                    {/* Question Text */}
                    <Text style={[styles.questionText, { color: colors.text }]}>
                      {q.questionText?.replace(/<[^>]*>/g, '') || 'No question text'}
                    </Text>

                    {/* Choices */}
                    {q.choices?.map((choice: any, cIdx: number) => {
                      const isUserChoice = choice.choiceID === q.selectedChoiceID;
                      const isCorrectChoice = choice.isCorrect;
                      
                      let choiceBg = isDark ? '#1f2937' : '#fff';
                      let choiceBorder = colors.border;
                      let choiceIcon = null;

                      if (isCorrectChoice) {
                        choiceBg = colors.greenBg;
                        choiceBorder = colors.green;
                        choiceIcon = <Ionicons name="checkmark-circle" size={18} color={colors.green} />;
                      } else if (isUserChoice && !isCorrectChoice) {
                        choiceBg = colors.redBg;
                        choiceBorder = colors.red;
                        choiceIcon = <Ionicons name="close-circle" size={18} color={colors.red} />;
                      }

                      return (
                        <View
                          key={choice.choiceID || cIdx}
                          style={[
                            styles.choiceItem,
                            { backgroundColor: choiceBg, borderColor: choiceBorder, borderWidth: 1 }
                          ]}
                        >
                          <Text style={[styles.choiceLetter, { color: colors.text }]}>
                            {String.fromCharCode(65 + cIdx)}.
                          </Text>
                          <Text style={[styles.choiceText, { color: colors.text, flex: 1 }]}>
                            {choice.choiceText?.replace(/<[^>]*>/g, '') || ''}
                          </Text>
                          {choiceIcon}
                        </View>
                      );
                    })}

                    {/* Points */}
                    <View style={styles.pointsRow}>
                      <Text style={[styles.pointsText, { color: colors.textSecondary }]}>
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
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            onPress={() => router.replace(resultId ? '/(auth)/(student)/insights' : '/(auth)/(student)/dashboard')}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} style={{ marginRight: 8 }} />
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
              {resultId ? 'Back to Insights' : 'Back to Dashboard'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace({
              pathname: '/(auth)/practice-exam/info',
              params: { subjectName, totalItems: String(totalItems), totalPoints: String(totalPoints), enableTimer: 'true', durationMinutes: '60' }
            })}
            activeOpacity={0.9}
          >
            <Ionicons name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Retake Exam</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingText: { fontSize: 14, marginTop: 12 },
  errorText: { fontSize: 16, fontWeight: '600', marginTop: 12, textAlign: 'center', marginBottom: 20 },
  backBtn: { backgroundColor: '#FE6902', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  scoreHeader: { alignItems: 'center', padding: 32, borderRadius: 20, marginBottom: 16, elevation: 2 },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 6, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  scorePercent: { fontSize: 36, fontWeight: '900' },
  scoreIconContainer: { marginBottom: 8 },
  scoreMessage: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subjectName: { fontSize: 16, fontWeight: '600' },
  card: { borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  scoreBox: { borderRadius: 12, padding: 16, marginBottom: 8, alignItems: 'center' },
  scoreBoxValue: { fontSize: 32, fontWeight: '800' },
  scoreBoxLabel: { fontSize: 12, marginTop: 4 },
  detailsList: { borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 8 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  detailLabel: { fontSize: 12, fontWeight: '500' },
  detailValue: { fontSize: 12, fontWeight: '600' },
  performanceBar: { height: 12, backgroundColor: '#e5e7eb', borderRadius: 6, marginBottom: 12 },
  performanceFill: { height: '100%', borderRadius: 6 },
  performanceLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  performanceLabel: { fontSize: 14, fontWeight: '600' },
  
  // Tabs
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
  emptyQuestions: { fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  
  // Question Cards
  questionCard: { borderRadius: 12, padding: 12, marginBottom: 12 },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  questionNumber: { fontSize: 14, fontWeight: '700' },
  correctnessBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  correctnessText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  questionText: { fontSize: 15, lineHeight: 22, marginBottom: 12 },
  choiceItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, marginBottom: 6, gap: 8 },
  choiceLetter: { fontSize: 14, fontWeight: '600' },
  choiceText: { fontSize: 14, lineHeight: 20 },
  pointsRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' },
  pointsText: { fontSize: 12 },
  
  // Buttons
  buttonContainer: { marginTop: 8, gap: 12 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  secondaryBtnText: { fontSize: 16, fontWeight: '600' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FE6902', paddingVertical: 14, borderRadius: 12, elevation: 4 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
