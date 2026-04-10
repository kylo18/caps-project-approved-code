// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Associate Dean "Subject Questions" screen — fetches all subjects and
//          their questions for college-wide oversight. Allows toggling question
//          approval status and deleting questions. Read-only review with
//          moderation capabilities (no add/edit navigation).
// Key sections: Header with back button, horizontal subject tabs, questions list
//               (with status toggle and delete actions), empty state,
//               loading/refresh handling.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';

export default function AssoDeanSubjectsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) fetchQuestions();
  }, [selectedSubject]);

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/api/subjects');
      const list = Array.isArray(data?.subjects) ? data.subjects : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setSubjects(list);
      if (list.length > 0 && !selectedSubject) setSelectedSubject(list[0]);
    } catch (error) {
      showToast('Unable to load subjects', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuestions = async () => {
    if (!selectedSubject) return;
    try {
      const data = await apiRequest(`/api/subjects/${selectedSubject.subjectID}/questions`);
      setQuestions(Array.isArray(data?.questions) ? data.questions : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleDeleteQuestion = (questionID) => {
    Alert.alert('Delete Question', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await apiRequest(`/api/questions/delete/${questionID}`, { method: 'DELETE' });
          setQuestions(prev => prev.filter(q => q.questionID !== questionID));
          showToast('Question deleted', 'success');
        } catch (error) {
          showToast('Failed to delete', 'error');
        }
      }},
    ]);
  };

  const handleToggleStatus = async (questionID, currentStatus) => {
    try {
      const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
      await apiRequest(`/api/questions/${questionID}/status`, { method: 'PATCH', body: { status: newStatus } });
      setQuestions(prev => prev.map(q => q.questionID === questionID ? { ...q, status: newStatus } : q));
      showToast(`Question ${newStatus}`, 'success');
    } catch (error) {
      showToast('Failed to update', 'error');
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchSubjects();
    setIsRefreshing(false);
  };

  const colors = {
    bg: isDark ? '#000' : '#f3f4f6',
    card: isDark ? '#1f2937' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    orange: '#FE6902',
    green: '#10B981',
    yellow: '#F59E0B',
    red: '#EF4444',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Subject Questions</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.orange} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.orange]} />}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectTabs}>
            {subjects.map(subject => (
              <TouchableOpacity key={subject.subjectID} style={[styles.subjectTab, { backgroundColor: colors.card, borderColor: colors.border }, selectedSubject?.subjectID === subject.subjectID && { backgroundColor: colors.orange, borderColor: colors.orange }]} onPress={() => setSelectedSubject(subject)} activeOpacity={0.7}>
                <Text style={[styles.subjectTabText, { color: selectedSubject?.subjectID === subject.subjectID ? '#fff' : colors.text }]} numberOfLines={1}>{subject.subjectName}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectedSubject && (
            <View style={styles.questionsSection}>
              <View style={styles.questionsHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Questions ({questions.length})</Text>
              </View>

              {questions.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                  <Ionicons name="help-circle" size={48} color={colors.orange} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No Questions</Text>
                </View>
              ) : (
                questions.map((q, idx) => (
                  <View key={q.questionID || idx} style={[styles.questionCard, { backgroundColor: colors.card }]}>
                    <View style={styles.questionHeader}>
                      <Text style={[styles.questionNumber, { color: colors.textSecondary }]}>Q{idx + 1}</Text>
                      <View style={styles.questionActions}>
                        <TouchableOpacity style={[styles.statusBadge, { backgroundColor: q.status === 'approved' ? colors.green : colors.yellow }]} onPress={() => handleToggleStatus(q.questionID, q.status)} activeOpacity={0.7}>
                          <Text style={styles.statusText}>{q.status === 'approved' ? 'Approved' : 'Pending'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteQuestion(q.questionID)} style={styles.deleteBtn}>
                          <Ionicons name="trash" size={18} color={colors.red} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={[styles.questionText, { color: colors.text }]} numberOfLines={2}>{q.questionText?.replace(/<[^>]*>/g, '') || 'No question text'}</Text>
                    <View style={styles.questionFooter}>
                      <Text style={[styles.questionMeta, { color: colors.textSecondary }]}>{q.choices?.length || 4} choices</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { padding: 8, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flexGrow: 1, paddingBottom: 100 },
  subjectTabs: { paddingHorizontal: 16, paddingVertical: 12, maxHeight: 50 },
  subjectTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  subjectTabText: { fontSize: 13, fontWeight: '600', maxWidth: 150 },
  questionsSection: { paddingHorizontal: 16, gap: 12 },
  questionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  emptyState: { borderRadius: 24, padding: 32, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  questionCard: { borderRadius: 16, padding: 16, elevation: 2, marginBottom: 12 },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  questionNumber: { fontSize: 14, fontWeight: '600' },
  questionActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  deleteBtn: { padding: 4 },
  questionText: { fontSize: 15, lineHeight: 22, marginBottom: 12 },
  questionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  questionMeta: { fontSize: 12 },
});
