import { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../src/services/apiClient';
import { useTheme } from '../../src/contexts/ThemeContext';
import { showToast } from '../../src/hooks/useToast';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function PrintExamModal({ visible, onClose }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (visible) fetchSubjects();
  }, [visible]);

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/api/subjects');
      setSubjects(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (error) {
      showToast('Failed to load subjects', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubject = (subject) => {
    const exists = selectedSubjects.find(s => s.subjectID === subject.subjectID);
    if (exists) {
      setSelectedSubjects(prev => prev.filter(s => s.subjectID !== subject.subjectID));
    } else {
      setSelectedSubjects(prev => [...prev, { ...subject, percentage: 50 }]);
    }
  };

  const handleGenerateExam = async () => {
    if (selectedSubjects.length === 0) {
      showToast('Please select at least one subject', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest('/api/generate-multi-subject-exam', {
        method: 'POST',
        body: {
          subjects: selectedSubjects.map(s => ({
            subjectID: s.subjectID,
            percentage: s.percentage || 50,
          })),
        },
      });

      // Generate PDF
      const htmlContent = generateExamHTML(response);
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      
      showToast('Exam generated successfully', 'success');
      onClose();
    } catch (error) {
      showToast(error.message || 'Failed to generate exam', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateExamHTML = (data) => {
    const questions = data?.questions || [];
    return `
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>Qualifying Exam</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;}h1{text-align:center;}h2{margin-top:30px;}.question{margin-bottom:20px;}.choices{margin-left:20px;}</style>
      </head><body>
      <h1>Qualifying Examination</h1>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <hr>
      ${questions.map((q, i) => `
        <div class="question">
          <p><strong>${i + 1}.</strong> ${q.questionText || ''}</p>
          <div class="choices">
            ${(q.choices || []).map((c, j) => `<p>${String.fromCharCode(65 + j)}. ${c.choiceText || ''}</p>`).join('')}
          </div>
        </div>
      `).join('')}
      </body></html>
    `;
  };

  const colors = {
    bg: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.5)',
    card: isDark ? '#1f2937' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    orange: '#FE6902',
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: colors.bg }]}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Generate Exam</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.textSecondary} /></TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color={colors.orange} style={{ marginVertical: 40 }} />
          ) : (
            <>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Select Subjects</Text>
              <ScrollView style={styles.subjectList}>
                {subjects.map(subject => {
                  const isSelected = selectedSubjects.some(s => s.subjectID === subject.subjectID);
                  return (
                    <TouchableOpacity key={subject.subjectID} style={[styles.subjectItem, { borderColor: colors.border }, isSelected && { borderColor: colors.orange, backgroundColor: `${colors.orange}15` }]} onPress={() => toggleSubject(subject)} activeOpacity={0.7}>
                      <View style={[styles.checkbox, { borderColor: colors.border }, isSelected && { backgroundColor: colors.orange, borderColor: colors.orange }]}>
                        {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                      </View>
                      <Text style={[styles.subjectName, { color: colors.text }]} numberOfLines={1}>{subject.subjectName}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {selectedSubjects.length > 0 && (
                <View style={styles.selectedInfo}>
                  <Ionicons name="information-circle" size={18} color={colors.orange} />
                  <Text style={[styles.selectedText, { color: colors.textSecondary }]}>
                    {selectedSubjects.length} subject{selectedSubjects.length > 1 ? 's' : ''} selected
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.generateBtn, { opacity: isGenerating || selectedSubjects.length === 0 ? 0.6 : 1 }]}
                onPress={handleGenerateExam}
                disabled={isGenerating || selectedSubjects.length === 0}
                activeOpacity={0.8}
              >
                {isGenerating ? <ActivityIndicator color="#fff" /> : <><Ionicons name="document-text" size={20} color="#fff" /><Text style={styles.generateBtnText}>Generate & Print</Text></>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  container: { maxHeight: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 14, marginBottom: 12 },
  subjectList: { maxHeight: 300, marginBottom: 12 },
  subjectItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderRadius: 12, marginBottom: 8, gap: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  subjectName: { fontSize: 15, fontWeight: '500', flex: 1 },
  selectedInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: 'rgba(254,105,2,0.1)', borderRadius: 12, marginBottom: 12 },
  selectedText: { fontSize: 13 },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FE6902', paddingVertical: 14, borderRadius: 12, gap: 8 },
  generateBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
