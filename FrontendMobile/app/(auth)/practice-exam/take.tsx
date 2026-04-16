// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Main practice exam screen where students answer questions one at a
//          time. Handles question display, answer selection, bookmarking,
//          optional countdown timer, and exam submission.
// Key sections:
//   - State: current question index, answers, bookmarks, timer, loading/error
//   - fetchExamQuestions: fetches exam questions from the API on mount
//   - loadSavedState / saveState: persists answers, bookmarks, and timer to AsyncStorage
//   - Timer logic: countdown interval with time-is-up modal when expired
//   - handleSelectAnswer / handleClearAnswer: manage answer state per question
//   - handleToggleBookmark: add/remove question from bookmarks
//   - handleNavigate: previous/next question navigation
//   - handleSubmit: POSTs answers to the API, clears saved state, navigates to results
//   - TimerModal: summary modal (answered/unanswered/bookmarked counts + submit button)
//   - ImageModal: full-screen overlay for question/choice images
//   - UI: header (subject name, progress badge, timer), progress bar, question card
//         with choices, navigation footer (Previous/Next/Submit), error banner
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, Dimensions, Alert, ActivityIndicator, useWindowDimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RenderHtml from 'react-native-render-html';
import apiClient from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';
import QuestionListModal from '../../../src/components/QuestionListModal';

const { width, height } = Dimensions.get('window');

export default function PracticeExamScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { width: windowWidth } = useWindowDimensions();

  const subjectID = params.subjectID as string;
  const subjectName = params.subjectName as string;
  const totalItems = parseInt(params.totalItems as string) || 0;
  const totalPoints = parseInt(params.totalPoints as string) || 0;
  const enableTimer = params.enableTimer === 'true';
  const durationMinutes = parseInt(params.durationMinutes as string) || 0;

  // State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<string[]>([]);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(enableTimer ? durationMinutes * 60 : null);
  const [isQuestionListOpen, setIsQuestionListOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const examKey = `exam_${subjectID}`;

  // Fetch exam questions from API
  useEffect(() => {
    fetchExamQuestions();
  }, []);

  const fetchExamQuestions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/practice-exam/generate/${subjectID}`);
      if (response.data && response.data.questions) {
        setQuestions(response.data.questions);
      } else {
        setError('No questions available for this subject.');
      }
    } catch (err: any) {
      console.error('Failed to fetch exam questions:', err);
      const msg = err.response?.data?.message || 'Failed to load exam questions.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Load saved state from AsyncStorage
  useEffect(() => {
    loadSavedState();
  }, []);

  // Timer
  useEffect(() => {
    if (enableTimer && secondsLeft !== null && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setShowTimerModal(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enableTimer, secondsLeft !== null]);

  // Save answers to AsyncStorage
  useEffect(() => {
    saveState();
  }, [answers, bookmarkedQuestions, secondsLeft]);

  const loadSavedState = async () => {
    try {
      const savedAnswers = await AsyncStorage.getItem(`${examKey}_answers`);
      const savedBookmarks = await AsyncStorage.getItem(`${examKey}_bookmarks`);
      const savedTimer = await AsyncStorage.getItem(`${examKey}_timer`);

      if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
      if (savedBookmarks) setBookmarkedQuestions(JSON.parse(savedBookmarks));
      if (enableTimer && savedTimer) {
        const savedSeconds = parseInt(savedTimer);
        if (savedSeconds > 0) setSecondsLeft(savedSeconds);
      }
    } catch (error) {
      console.error('Failed to load exam state:', error);
    }
  };

  const saveState = async () => {
    try {
      await AsyncStorage.setItem(`${examKey}_answers`, JSON.stringify(answers));
      await AsyncStorage.setItem(`${examKey}_bookmarks`, JSON.stringify(bookmarkedQuestions));
      if (enableTimer && secondsLeft !== null) {
        await AsyncStorage.setItem(`${examKey}_timer`, secondsLeft.toString());
      }
    } catch (error) {
      console.error('Failed to save exam state:', error);
    }
  };

  const clearExamData = async () => {
    try {
      await AsyncStorage.removeItem(`${examKey}_answers`);
      await AsyncStorage.removeItem(`${examKey}_bookmarks`);
      await AsyncStorage.removeItem(`${examKey}_timer`);
    } catch (error) {
      console.error('Failed to clear exam data:', error);
    }
  };

  // Use fetched questions; fall back to empty array while loading
  const currentQuestion = questions[currentQuestionIndex];
  const questionCount = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = questionCount > 0 ? (answeredCount / questionCount) * 100 : 0;
  const isLastQuestion = currentQuestionIndex === questionCount - 1;
  const allAnswered = answeredCount === questionCount;

  // Handlers
  const handleSelectAnswer = (choiceID: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.questionID]: choiceID }));
    setError('');
  };

  const handleClearAnswer = () => {
    setAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[currentQuestion.questionID];
      return newAnswers;
    });
  };

  const handleToggleBookmark = (questionID: string) => {
    setBookmarkedQuestions((prev) =>
      prev.includes(questionID) ? prev.filter((id) => id !== questionID) : [...prev, questionID]
    );
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else if (direction === 'next' && currentQuestionIndex < totalItems - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleSubmit = async (bypassCheck = false) => {
    if (!bypassCheck && isLastQuestion && !answers[currentQuestion.questionID]) {
      setError('Please answer the final question before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/api/practice-exam/submit', {
        subjectID,
        answers: questions.map((q) => ({
          questionID: q.questionID,
          selectedChoiceID: answers[q.questionID] ? parseInt(answers[q.questionID]) : null,
        })),
      });

      await clearExamData();

      const score = response.data.score;
      const resultId = response.data.resultId;
      router.replace({
        pathname: '/(auth)/practice-exam/results',
        params: {
          earnedPoints: score.earnedPoints,
          totalPoints: score.totalPoints,
          percentage: score.percentage,
          subjectName,
          totalItems: questions.length,
          resultId: resultId ? String(resultId) : '',
        }
      });
    } catch (err: any) {
      console.error('Submit error:', err);
      showToast(err.response?.data?.message || 'Failed to submit exam. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
    };
  };

  const colors = {
    bg: isDark ? '#000' : '#f3f4f6',
    card: isDark ? '#111' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    optionBg: isDark ? '#1f2937' : '#f9fafb',
    selectedBg: isDark ? '#1c1917' : '#fff7ed',
    selectedBorder: '#FE6902',
  };

  // Timer Modal
  const TimerModal = () => (
    <Modal visible={showTimerModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
          <Ionicons name="alarm" size={48} color="#FE6902" style={{ marginBottom: 16 }} />
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {secondsLeft === 0 ? 'Time is Up!' : 'Submit Exam?'}
          </Text>
          <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
            You have answered {answeredCount} of {questionCount} questions.
          </Text>
          <View style={styles.modalStats}>
            <View style={styles.modalStat}>
              <Text style={[styles.modalStatValue, { color: '#10B981' }]}>{answeredCount}</Text>
              <Text style={[styles.modalStatLabel, { color: colors.textSecondary }]}>Answered</Text>
            </View>
            <View style={styles.modalStat}>
              <Text style={[styles.modalStatValue, { color: '#EF4444' }]}>{questionCount - answeredCount}</Text>
              <Text style={[styles.modalStatLabel, { color: colors.textSecondary }]}>Unanswered</Text>
            </View>
            <View style={styles.modalStat}>
              <Text style={[styles.modalStatValue, { color: '#F59E0B' }]}>{bookmarkedQuestions.length}</Text>
              <Text style={[styles.modalStatLabel, { color: colors.textSecondary }]}>Bookmarked</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.modalBtn, { opacity: isSubmitting ? 0.6 : 1 }]}
            onPress={() => handleSubmit(true)}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.modalBtnText}>Submit Exam</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Image Modal
  const ImageModal = () => (
    <Modal visible={!!imageModalUrl} transparent animationType="fade">
      <TouchableOpacity style={styles.imageModalOverlay} activeOpacity={1} onPress={() => setImageModalUrl(null)}>
        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 100 }}>
          Image viewer - URL: {imageModalUrl}
        </Text>
        <TouchableOpacity style={styles.imageModalClose} onPress={() => setImageModalUrl(null)}>
          <Ionicons name="close" size={32} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {loading || !currentQuestion ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FE6902" />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {loading ? 'Loading exam questions...' : 'No questions available.'}
          </Text>
        </View>
      ) : (
        <>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerSubject, { color: colors.text }]} numberOfLines={1}>{subjectName}</Text>
              <View style={styles.headerBadges}>
                <View style={styles.progressBadge}>
                  <Text style={styles.progressBadgeText}>{answeredCount}/{questionCount}</Text>
                </View>
                {enableTimer && (
                  <View style={[styles.timerBadge, secondsLeft !== null && secondsLeft <= 300 && styles.timerBadgeWarning]}>
                    {secondsLeft !== null ? (
                      <>
                        <Ionicons name="time" size={14} color={secondsLeft <= 300 ? '#EF4444' : '#FE6902'} />
                        <Text style={[styles.timerText, secondsLeft <= 300 && styles.timerTextWarning]}>
                          {(() => {
                            const t = formatTime(secondsLeft);
                            return `${t.hours}:${t.minutes}:${t.seconds}`;
                          })()}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.timerText}>00:00:00</Text>
                    )}
                  </View>
                )}
                {!enableTimer && (
                  <View style={styles.unlimitedBadge}>
                    <Ionicons name="infinity" size={14} color="#10B981" />
                    <Text style={styles.unlimitedText}>Unlimited</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerIconBtn} onPress={() => setIsQuestionListOpen(true)}>
                <Ionicons name="list" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>{Math.round(progressPercent)}% Answered</Text>

          {/* Question Content */}
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={[styles.questionCard, { backgroundColor: colors.card }]}>
              {/* Question Header */}
              <View style={styles.questionHeader}>
                <View style={styles.questionNumberBadge}>
                  <Text style={styles.questionNumberText}>{currentQuestionIndex + 1}</Text>
                </View>
                <Text style={[styles.questionLabel, { color: colors.text }]}>Question {currentQuestionIndex + 1} of {totalItems}</Text>
                <TouchableOpacity
                  style={styles.bookmarkBtn}
                  onPress={() => handleToggleBookmark(currentQuestion.questionID)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={bookmarkedQuestions.includes(currentQuestion.questionID) ? 'bookmark' : 'bookmark-outline'}
                    size={24}
                    color={bookmarkedQuestions.includes(currentQuestion.questionID) ? '#F59E0B' : colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Question Text */}
              <View style={{ marginBottom: 20 }}>
                <RenderHtml
                  contentWidth={windowWidth - 48}
                  source={{ html: currentQuestion.questionText || '<p></p>' }}
                  tagsStyles={{
                    p: { color: colors.text, fontSize: 16, lineHeight: 24, marginBottom: 8 },
                    li: { color: colors.text, fontSize: 15, lineHeight: 22 },
                    strong: { color: colors.text, fontWeight: '700' },
                    u: { textDecorationLine: 'underline' },
                    a: { color: '#FE6902' },
                  }}
                />
              </View>

              {/* Question Image */}
              {currentQuestion.questionImage && (
                <TouchableOpacity onPress={() => setImageModalUrl(currentQuestion.questionImage)} activeOpacity={0.8} style={{ marginBottom: 16 }}>
                  <Text style={[styles.questionImageHint, { color: '#FE6902' }]}>📷 Tap to view question image</Text>
                </TouchableOpacity>
              )}

              {/* Choices */}
              <View style={styles.choicesContainer}>
                {currentQuestion.choices.map((choice: any, idx: number) => {
                  const isSelected = answers[currentQuestion.questionID] === String(choice.choiceID);
                  return (
                    <TouchableOpacity
                      key={choice.choiceID}
                      style={[
                        styles.choiceItem,
                        { backgroundColor: isSelected ? colors.selectedBg : colors.optionBg },
                        { borderColor: isSelected ? colors.selectedBorder : colors.border },
                        { borderLeftWidth: isSelected ? 4 : 1, borderLeftColor: isSelected ? colors.selectedBorder : 'transparent' },
                      ]}
                      onPress={() => handleSelectAnswer(String(choice.choiceID))}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.choiceRadio,
                        { borderColor: isSelected ? colors.selectedBorder : colors.textSecondary },
                        isSelected && { backgroundColor: colors.selectedBorder, borderColor: colors.selectedBorder },
                      ]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                      <Text style={[styles.choiceText, { color: colors.text }, isSelected && { fontWeight: '600' }]}>
                        {String.fromCharCode(65 + idx)}. {choice.choiceText}
                      </Text>
                      {choice.choiceImage && (
                        <TouchableOpacity onPress={() => setImageModalUrl(choice.choiceImage)} activeOpacity={0.8}>
                          <Text style={[styles.questionImageHint, { color: '#FE6902', fontSize: 12 }]}>📷 View image</Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Clear Answer */}
              {answers[currentQuestion.questionID] && (
                <TouchableOpacity style={styles.clearAnswerBtn} onPress={handleClearAnswer} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                  <Text style={styles.clearAnswerText}>Clear Answer</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          {/* Navigation Footer */}
          <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.navBtn, { borderColor: colors.border }, currentQuestionIndex === 0 && styles.navBtnDisabled]}
              onPress={() => handleNavigate('prev')}
              disabled={currentQuestionIndex === 0}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
              <Text style={[styles.navBtnText, { color: colors.text }]}>Previous</Text>
            </TouchableOpacity>

            {!isLastQuestion ? (
              <TouchableOpacity
                style={[styles.navBtn, styles.nextBtn]}
                onPress={() => handleNavigate('next')}
                activeOpacity={0.8}
              >
                <Text style={styles.nextBtnText}>Next</Text>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.navBtn, styles.submitBtn, { opacity: isSubmitting || (!allAnswered && !answers[currentQuestion.questionID]) ? 0.5 : 1 }]}
                onPress={() => {
                  if (!answers[currentQuestion.questionID]) {
                    setError('Please answer this question before submitting.');
                    return;
                  }
                  setShowTimerModal(true);
                }}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Submit</Text>
                    <Ionicons name="checkmark-done" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="warning" size={18} color="#fff" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Modals */}
          <TimerModal />
          <ImageModal />
          <QuestionListModal
            visible={isQuestionListOpen}
            onClose={() => setIsQuestionListOpen(false)}
            questions={questions}
            currentQuestionIndex={currentQuestionIndex}
            answers={answers}
            bookmarkedQuestions={bookmarkedQuestions}
            onQuestionClick={(index) => {
              setCurrentQuestionIndex(index);
              setIsQuestionListOpen(false);
            }}
            onToggleBookmark={handleToggleBookmark}
            isDark={isDark}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, marginTop: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerLeft: { flex: 1 },
  headerSubject: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  headerBadges: { flexDirection: 'row', gap: 8 },
  progressBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  progressBadgeText: { color: '#FE6902', fontSize: 12, fontWeight: '600' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  timerBadgeWarning: { backgroundColor: '#FEE2E2' },
  timerText: { color: '#FE6902', fontSize: 12, fontWeight: '600' },
  timerTextWarning: { color: '#EF4444' },
  unlimitedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  unlimitedText: { color: '#10B981', fontSize: 12, fontWeight: '600' },
  headerRight: { flexDirection: 'row', gap: 8 },
  headerIconBtn: { padding: 8 },
  progressBarBg: { height: 6, marginHorizontal: 16, marginTop: 8, borderRadius: 3 },
  progressFill: { height: '100%', backgroundColor: '#FE6902', borderRadius: 3 },
  progressLabel: { fontSize: 12, textAlign: 'right', marginHorizontal: 16, marginTop: 4, marginBottom: 8 },
  content: { flexGrow: 1, padding: 16, paddingBottom: 100 },
  questionCard: { borderRadius: 16, padding: 20, elevation: 2 },
  questionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  questionNumberBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FE6902', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  questionNumberText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  questionLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  bookmarkBtn: { padding: 8 },
  questionText: { fontSize: 16, lineHeight: 24, marginBottom: 20 },
  questionImageHint: { fontSize: 14, fontWeight: '500' },
  choicesContainer: { gap: 12 },
  choiceItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1 },
  choiceRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  choiceText: { flex: 1, fontSize: 15, lineHeight: 22 },
  clearAnswerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, padding: 10 },
  clearAnswerText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff' },
  navBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, minWidth: 120 },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { fontSize: 15, fontWeight: '600', marginHorizontal: 6 },
  nextBtn: { backgroundColor: '#FE6902', borderWidth: 0 },
  nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '600', marginHorizontal: 6 },
  submitBtn: { backgroundColor: '#FE6902', borderWidth: 0 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', marginHorizontal: 6 },
  errorBanner: { position: 'absolute', bottom: 80, left: 16, right: 16, backgroundColor: '#EF4444', padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  errorText: { color: '#fff', fontSize: 14, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: width * 0.85, borderRadius: 20, padding: 24, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  modalDesc: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  modalStats: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', marginBottom: 24 },
  modalStat: { alignItems: 'center' },
  modalStatValue: { fontSize: 24, fontWeight: '700' },
  modalStatLabel: { fontSize: 12, marginTop: 4 },
  modalBtn: { width: '100%', backgroundColor: '#FE6902', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  imageModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  imageModalClose: { position: 'absolute', top: 50, right: 20 },
});
