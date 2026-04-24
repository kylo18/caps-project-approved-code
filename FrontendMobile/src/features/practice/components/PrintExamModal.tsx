import { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../../../src/services/apiClient';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { showToast } from '../../../../src/hooks/useToast';
import CapsActivityIndicator from '../../../features/core/components/CapsActivityIndicator';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function PrintExamModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Exam settings
  const [totalItems, setTotalItems] = useState('20');
  const [easyPercentage, setEasyPercentage] = useState('30');
  const [moderatePercentage, setModeratePercentage] = useState('50');
  const [hardPercentage, setHardPercentage] = useState('20');

  useEffect(() => {
    if (visible) {
      setSelectedSubjects([]);
      setTotalItems('20');
      setEasyPercentage('30');
      setModeratePercentage('50');
      setHardPercentage('20');
      fetchSubjects();
    }
  }, [visible]);

  const fetchSubjects = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const data = await apiRequest('/api/subjects');
      const subjectList = Array.isArray(data?.subjects)
        ? data.subjects
        : Array.isArray(data?.data?.subjects)
          ? data.data.subjects
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : [];
      setSubjects(subjectList);
    } catch (error: any) {
      console.error('Unable to load subjects for print/export:', error);
      setSubjects([]);
      setLoadError(error?.message || 'Unable to load subjects right now.');
      showToast('Failed to load subjects', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubject = (subject: any) => {
    const exists = selectedSubjects.find(s => s.subjectID === subject.subjectID);
    if (exists) {
      // Remove subject and redistribute percentages among remaining
      const remaining = selectedSubjects.filter(s => s.subjectID !== subject.subjectID);
      if (remaining.length > 0) {
        const basePercent = Math.floor(100 / remaining.length);
        const remainder = 100 - (basePercent * remaining.length);
        setSelectedSubjects(remaining.map((s, idx) => ({
          ...s,
          percentage: basePercent + (idx < remainder ? 1 : 0),
        })));
      } else {
        setSelectedSubjects([]);
      }
    } else {
      // Add subject and redistribute percentages
      const next = [...selectedSubjects, subject];
      const basePercent = Math.floor(100 / next.length);
      const remainder = 100 - (basePercent * next.length);
      setSelectedSubjects(next.map((s, idx) => ({
        ...s,
        percentage: basePercent + (idx < remainder ? 1 : 0),
      })));
    }
  };

  const handleGenerateExam = async () => {
    if (selectedSubjects.length === 0) {
      showToast('Please select at least one subject', 'error');
      return;
    }

    const total = parseInt(totalItems, 10);
    if (isNaN(total) || total < 1) {
      showToast('Total items must be at least 1', 'error');
      return;
    }

    const easy = parseInt(easyPercentage, 10) || 0;
    const moderate = parseInt(moderatePercentage, 10) || 0;
    const hard = parseInt(hardPercentage, 10) || 0;
    const sum = easy + moderate + hard;

    if (sum !== 100) {
      showToast(`Difficulty percentages must sum to 100% (currently ${sum}%)`, 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest('/api/generate-multi-subject-exam', {
        method: 'POST',
        body: {
          total_items: total,
          subjects: selectedSubjects.map(s => ({
            subjectID: s.subjectID,
            percentage: s.percentage || 50,
          })),
          difficulty_distribution: {
            easy,
            moderate,
            hard,
          },
          preview: true,
          purpose: 'examQuestions',
        },
      });

      const htmlContent = generateExamHTML(response);
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });

      showToast('Exam generated successfully', 'success');
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to generate exam', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateExamHTML = (data: any) => {
    const questions: any[] = data?.questions || [];
    return `
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>Qualifying Exam</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;}h1{text-align:center;}h2{margin-top:30px;}.question{margin-bottom:20px;}.choices{margin-left:20px;}</style>
      </head><body>
      <h1>Qualifying Examination</h1>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <hr>
      ${questions.map((q: any, i: number) => `
        <div class="question">
          <p><strong>${i + 1}.</strong> ${q.questionText || ''}</p>
          <div class="choices">
            ${(q.choices || []).map((c: any, j: number) => `<p>${String.fromCharCode(65 + j)}. ${c.choiceText || ''}</p>`).join('')}
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

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.text,
    backgroundColor: isDark ? '#111827' : '#f9fafb',
    fontSize: 14,
    minWidth: 60,
    textAlign: 'center',
  } as any;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-end" style={{ backgroundColor: colors.bg }}>
        <View className="rounded-t-3xl p-5" style={{ backgroundColor: colors.card }}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold" style={{ color: colors.text }}>Generate Exam</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View className="items-center justify-center py-10">
              <CapsActivityIndicator size="large" color={colors.orange} />
            </View>
          ) : loadError ? (
            <View className="items-center justify-center py-10 px-4">
              <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
              <Text className="text-base font-bold mt-3 text-center" style={{ color: colors.text }}>Unable to load subjects</Text>
              <Text className="text-sm mt-1 text-center" style={{ color: colors.textSecondary }}>{loadError}</Text>
              <TouchableOpacity
                className="mt-4 px-4 py-2.5 rounded-xl"
                style={{ backgroundColor: colors.orange }}
                onPress={fetchSubjects}
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : subjects.length === 0 ? (
            <View className="items-center justify-center py-10 px-4">
              <Ionicons name="library-outline" size={48} color={colors.textSecondary} />
              <Text className="text-base font-bold mt-3 text-center" style={{ color: colors.text }}>No Subjects Available</Text>
              <Text className="text-sm mt-1 text-center" style={{ color: colors.textSecondary }}>Export options will appear once subjects are available.</Text>
            </View>
          ) : (
            <>
              <ScrollView style={{ maxHeight: 420 }}>
                <Text className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>Select Subjects</Text>
                <View style={{ marginBottom: 12 }}>
                  {subjects.map(subject => {
                    const isSelected = selectedSubjects.some(s => s.subjectID === subject.subjectID);
                    return (
                      <TouchableOpacity
                        key={subject.subjectID}
                        className="flex-row items-center px-3 py-3 rounded-xl border mb-2 gap-3"
                        style={{
                          borderColor: isSelected ? colors.orange : colors.border,
                          backgroundColor: isSelected ? `${colors.orange}15` : 'transparent',
                        }}
                        onPress={() => toggleSubject(subject)}
                        activeOpacity={0.7}
                      >
                        <View
                          className="w-6 h-6 rounded-md border-2 items-center justify-center"
                          style={{
                            borderColor: isSelected ? colors.orange : colors.border,
                            backgroundColor: isSelected ? colors.orange : 'transparent',
                          }}
                        >
                          {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                        </View>
                        <Text className="text-sm font-medium flex-1" numberOfLines={1} style={{ color: colors.text }}>{subject.subjectName}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {selectedSubjects.length > 0 && (
                  <>
                    <View className="flex-row items-center gap-2 px-3 py-2.5 rounded-xl mb-3" style={{ backgroundColor: `${colors.orange}15` }}>
                      <Ionicons name="information-circle" size={18} color={colors.orange} />
                      <Text className="text-sm" style={{ color: colors.textSecondary }}>
                        {selectedSubjects.length} subject{selectedSubjects.length > 1 ? 's' : ''} selected
                      </Text>
                    </View>

                    {/* Total Items */}
                    <View className="mb-4">
                      <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>Total Items</Text>
                      <TextInput
                      style={[inputStyle, { textAlign: 'left', minWidth: '100%' } as any]}
                      keyboardType="numeric"
                      value={totalItems}
                      onChangeText={setTotalItems}
                      placeholder="Enter total items"
                      placeholderTextColor={colors.textSecondary}
                    />
                    </View>

                    {/* Difficulty Distribution */}
                    <View className="mb-4">
                      <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>Difficulty Distribution (%)</Text>
                      <View className="flex-row justify-between gap-2">
                        <View className="flex-1">
                          <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>Easy</Text>
                          <TextInput
                            style={inputStyle}
                            keyboardType="numeric"
                            value={easyPercentage}
                            onChangeText={setEasyPercentage}
                            placeholder="0"
                            placeholderTextColor={colors.textSecondary}
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>Moderate</Text>
                          <TextInput
                            style={inputStyle}
                            keyboardType="numeric"
                            value={moderatePercentage}
                            onChangeText={setModeratePercentage}
                            placeholder="0"
                            placeholderTextColor={colors.textSecondary}
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>Hard</Text>
                          <TextInput
                            style={inputStyle}
                            keyboardType="numeric"
                            value={hardPercentage}
                            onChangeText={setHardPercentage}
                            placeholder="0"
                            placeholderTextColor={colors.textSecondary}
                          />
                        </View>
                      </View>
                      <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                        Total: {(parseInt(easyPercentage, 10) || 0) + (parseInt(moderatePercentage, 10) || 0) + (parseInt(hardPercentage, 10) || 0)}%
                      </Text>
                    </View>
                  </>
                )}
              </ScrollView>

              <TouchableOpacity
                className="flex-row items-center justify-center py-3.5 rounded-xl gap-2 mt-2"
                style={{ backgroundColor: '#FE6902', opacity: isGenerating || selectedSubjects.length === 0 ? 0.6 : 1 }}
                onPress={handleGenerateExam}
                disabled={isGenerating || selectedSubjects.length === 0}
                activeOpacity={0.8}
              >
                {isGenerating ? (
                  <CapsActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="document-text" size={20} color="#fff" />
                    <Text className="text-white text-base font-bold">Generate &amp; Print</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
