import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../../../src/services/apiClient';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { showToast } from '../../../../src/hooks/useToast';
import SubjectCard from './SubjectCard';
import BottomModal from '../../core/components/BottomModal';

export default function SubjectCardProgramChair({ subject, onDelete, onPress }: { subject?: any; onDelete?: (id?: number | string) => void; onPress?: () => void }) {
  const [showMenu, setShowMenu] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleDelete = () => {
    setShowMenu(false);
    Alert.alert('Delete Subject', `Are you sure you want to delete ${subject?.subjectName || subject?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiRequest(`/api/subjects/${subject?.subjectID}/delete`, { method: 'DELETE' });
            showToast('Subject deleted', 'success');
            if (onDelete) onDelete(subject?.subjectID);
          } catch (error) {
            showToast('Failed to delete subject', 'error');
          }
        },
      },
    ]);
  };

  return (
    <>
      <SubjectCard
        subject={subject}
        role="program_chair"
        onPress={onPress}
        onMenuPress={() => setShowMenu(true)}
      />
      <BottomModal
        visible={showMenu}
        title="Subject Actions"
        onClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          className="flex-row items-center py-4 border-b border-gray-200 dark:border-gray-800"
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16 }}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={22} color="#EF4444" />
          <Text className="text-base font-semibold ml-3" style={{ color: '#EF4444', marginLeft: 12 }}>Delete Subject</Text>
        </TouchableOpacity>
      </BottomModal>
    </>
  );
}
