// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Pre-exam information screen that displays exam details (total items,
//          total points, duration) and instructions before the student begins.
// Key sections:
//   - Reads exam config params (subjectID, totalItems, totalPoints, timer, duration)
//   - formatDuration: converts minutes into human-readable hours/minutes string
//   - instructions: dynamic list of rules shown to the student
//   - UI: header with back button, exam details card, instructions card,
//         "Back to Subjects" and "Start Exam" action buttons
// ─────────────────────────────────────────────────────────────────────────────
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/contexts/ThemeContext';

export default function PracticeExamInfo() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const subjectID = params.subjectID as string;
  const subjectName = params.subjectName as string;
  const totalItems = parseInt(params.totalItems as string) || 0;
  const totalPoints = parseInt(params.totalPoints as string) || 0;
  const enableTimer = params.enableTimer === 'true';
  const durationMinutes = parseInt(params.durationMinutes as string) || 0;

  const handleStartExam = () => {
    router.push({
      pathname: '/(auth)/practice-exam/take',
      params: { subjectID, subjectName, totalItems, totalPoints, enableTimer, durationMinutes }
    });
  };

  const colors = {
    bg: isDark ? '#000' : '#f9fafb',
    card: isDark ? '#111' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    sectionBg: isDark ? '#1f2937' : '#f9fafb',
  };

  const formatDuration = () => {
    if (!enableTimer) return 'No time limit';
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  const instructions = [
    'Make sure to answer all questions before submitting',
    'Progress will not be saved if you exit',
    enableTimer ? `You have ${formatDuration()} to complete this exam` : 'There is no time limit for this exam',
    'You can bookmark questions to review them later',
    'Use the navigation buttons to move between questions',
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Exam Information</Text>
        </View>

        {/* Exam Details Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.subjectIconContainer}>
            <View style={styles.subjectIcon}>
              <Ionicons name="book" size={32} color="#FE6902" />
            </View>
          </View>
          
          <Text style={[styles.subjectName, { color: colors.text }]}>{subjectName || 'Practice Exam'}</Text>

          {/* Exam Details Grid */}
          <View style={[styles.detailsSection, { backgroundColor: colors.sectionBg }]}>
            <View style={styles.detailRow}>
              <Ionicons name="help-circle" size={20} color="#FE6902" />
              <View style={styles.detailTextContainer}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Total Items</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{totalItems}</Text>
              </View>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <Ionicons name="star" size={20} color="#FE6902" />
              <View style={styles.detailTextContainer}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Total Points</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{totalPoints}</Text>
              </View>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <Ionicons name="time" size={20} color="#FE6902" />
              <View style={styles.detailTextContainer}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Duration</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{formatDuration()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Instructions Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.instructionsHeader}>
            <Ionicons name="information-circle" size={24} color="#FE6902" />
            <Text style={[styles.instructionsTitle, { color: colors.text }]}>Instructions</Text>
          </View>

          <View style={styles.instructionsList}>
            {instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.instructionBullet}>
                  <Text style={styles.instructionBulletText}>{index + 1}</Text>
                </View>
                <Text style={[styles.instructionText, { color: colors.textSecondary }]}>{instruction}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.backToSubjectsBtn, { borderColor: colors.border }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={[styles.backToSubjectsText, { color: colors.text }]}>Back to Subjects</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.startBtn}
            onPress={handleStartExam}
            activeOpacity={0.9}
          >
            <Ionicons name="play" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.startBtnText}>Start Exam</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { padding: 8, marginRight: 12 },
  title: { fontSize: 24, fontWeight: '700' },
  
  card: { borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2 },
  subjectIconContainer: { alignItems: 'center', marginBottom: 16 },
  subjectIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center' },
  subjectName: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  
  detailsSection: { borderRadius: 12, padding: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  detailTextContainer: { marginLeft: 12, flex: 1 },
  detailLabel: { fontSize: 12, marginBottom: 2 },
  detailValue: { fontSize: 18, fontWeight: '700' },
  detailDivider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 8 },
  
  instructionsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  instructionsTitle: { fontSize: 18, fontWeight: '700', marginLeft: 10 },
  instructionsList: { gap: 12 },
  instructionItem: { flexDirection: 'row', alignItems: 'flex-start' },
  instructionBullet: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FE6902', justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 },
  instructionBulletText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  instructionText: { flex: 1, fontSize: 14, lineHeight: 20 },
  
  buttonContainer: { marginTop: 8, gap: 12 },
  backToSubjectsBtn: { paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  backToSubjectsText: { fontSize: 16, fontWeight: '600' },
  startBtn: { backgroundColor: '#FE6902', paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', elevation: 4 },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
