import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuestionListModalProps {
  visible: boolean;
  onClose: () => void;
  questions: any[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  bookmarkedQuestions: string[];
  onQuestionClick: (index: number) => void;
  onToggleBookmark: (questionID: string) => void;
  isDark: boolean;
}

export default function QuestionListModal({
  visible, onClose, questions, currentQuestionIndex,
  answers, bookmarkedQuestions, onQuestionClick, onToggleBookmark, isDark
}: QuestionListModalProps) {
  const colors = {
    bg: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.5)',
    card: isDark ? '#1f2937' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    itemBg: isDark ? '#111827' : '#f9fafb',
    currentItemBg: isDark ? '#1c1917' : '#fff7ed',
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.bg }]}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Question Navigator</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {answeredCount}/{questions.length} answered
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.statText}>{answeredCount} Answered</Text>
            </View>
            <View style={styles.statBadge}>
              <Ionicons name="ellipse-outline" size={16} color="#9ca3af" />
              <Text style={styles.statText}>{questions.length - answeredCount} Remaining</Text>
            </View>
            <View style={styles.statBadge}>
              <Ionicons name="bookmark" size={16} color="#F59E0B" />
              <Text style={styles.statText}>{bookmarkedQuestions.length} Bookmarked</Text>
            </View>
          </View>

          {/* Question Grid */}
          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.questionID];
              const isBookmarked = bookmarkedQuestions.includes(q.questionID);
              const isCurrent = idx === currentQuestionIndex;

              return (
                <TouchableOpacity
                  key={q.questionID}
                  style={[
                    styles.gridItem,
                    { backgroundColor: isCurrent ? colors.currentItemBg : colors.itemBg },
                    { borderColor: isCurrent ? '#FE6902' : colors.border },
                    isCurrent && styles.currentItem,
                  ]}
                  onPress={() => onQuestionClick(idx)}
                  activeOpacity={0.7}
                >
                  <View style={styles.gridItemHeader}>
                    <Text style={[
                      styles.gridItemNumber,
                      { color: isCurrent ? '#FE6902' : colors.text },
                      isAnswered && { color: '#10B981' },
                    ]}>
                      {idx + 1}
                    </Text>
                    {isBookmarked && (
                      <Ionicons name="bookmark" size={14} color="#F59E0B" />
                    )}
                  </View>
                  <View style={[
                    styles.gridItemStatus,
                    { backgroundColor: isAnswered ? '#10B981' : '#d1d5db' }
                  ]}>
                    <Text style={styles.gridItemStatusText}>
                      {isAnswered ? '✓' : '○'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  container: { maxHeight: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  closeBtn: { padding: 4 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 4 },
  statText: { fontSize: 12, fontWeight: '500', color: '#374151' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 20 },
  gridItem: { width: '22%', aspectRatio: 1, borderRadius: 12, borderWidth: 2, padding: 10, justifyContent: 'space-between' },
  currentItem: { elevation: 4 },
  gridItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gridItemNumber: { fontSize: 18, fontWeight: '700' },
  gridItemStatus: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end' },
  gridItemStatusText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
