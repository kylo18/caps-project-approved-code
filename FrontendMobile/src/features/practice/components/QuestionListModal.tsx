import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
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
    card: isDark ? '#1A1A1A' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    itemBg: isDark ? '#1A1A1A' : '#f9fafb',
    currentItemBg: isDark ? '#1c1917' : '#fff7ed',
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: colors.bg }}>
        <View className="rounded-t-3xl p-5" style={{ backgroundColor: colors.card, maxHeight: '85%' }}>
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className="text-xl font-bold" style={{ color: colors.text }}>Question Navigator</Text>
              <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                {answeredCount}/{questions.length} answered
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1" activeOpacity={0.7}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-2 mb-4">
            <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: isDark ? '#242424' : '#F3F4F6' }}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text className="text-xs font-medium" style={{ color: colors.text }}>{answeredCount} Answered</Text>
            </View>
            <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: isDark ? '#242424' : '#F3F4F6' }}>
              <Ionicons name="ellipse-outline" size={16} color="#9ca3af" />
              <Text className="text-xs font-medium" style={{ color: colors.text }}>{questions.length - answeredCount} Remaining</Text>
            </View>
            <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: isDark ? '#242424' : '#F3F4F6' }}>
              <Ionicons name="bookmark" size={16} color="#F59E0B" />
              <Text className="text-xs font-medium" style={{ color: colors.text }}>{bookmarkedQuestions.length} Bookmarked</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.questionID];
              const isBookmarked = bookmarkedQuestions.includes(q.questionID);
              const isCurrent = idx === currentQuestionIndex;

              return (
                <TouchableOpacity
                  key={q.questionID}
                  className="w-[22%] aspect-square rounded-xl border-2 p-2.5 justify-between"
                  style={{
                    backgroundColor: isCurrent ? colors.currentItemBg : colors.itemBg,
                    borderColor: isCurrent ? '#FE6902' : colors.border,
                    elevation: isCurrent ? 4 : 0,
                  }}
                  onPress={() => onQuestionClick(idx)}
                  activeOpacity={0.7}
                >
                  <View className="flex-row justify-between items-center">
                    <Text
                      className="text-lg font-bold"
                      style={{ color: isCurrent ? '#FE6902' : colors.text }}
                    >
                      {idx + 1}
                    </Text>
                    {isBookmarked && <Ionicons name="bookmark" size={14} color="#F59E0B" />}
                  </View>
                  <View
                    className="w-6 h-6 rounded-full justify-center items-center self-end"
                    style={{ backgroundColor: isAnswered ? '#10B981' : '#d1d5db' }}
                  >
                    <Text className="text-white text-sm font-bold">{isAnswered ? '✓' : '○'}</Text>
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
