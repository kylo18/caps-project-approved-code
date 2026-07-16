import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../../../src/services/apiClient';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { showToast } from '../../../../src/hooks/useToast';
import SubjectCard from './SubjectCard';
import BottomModal from '../../core/components/BottomModal';

export default function SubjectCardFaculty({ subject, onUnassign }: { subject?: any; onUnassign?: (id?: number | string) => void }) {
  const [showMenu, setShowMenu] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleUnassign = () => {
    setShowMenu(false);
    Alert.alert('Unassign Subject', `Remove ${subject?.subjectName || subject?.name} from your assigned subjects?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unassign',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiRequest(`/api/remove-assigned-subject/${subject?.subjectID}`, { method: 'DELETE' });
            showToast('Subject unassigned', 'success');
            if (onUnassign) onUnassign(subject?.subjectID);
          } catch (error) {
            showToast('Failed to unassign subject', 'error');
          }
        },
      },
    ]);
  };

  return (
    <>
      <SubjectCard
        subject={subject}
        role="faculty"
        onMenuPress={() => setShowMenu(true)}
      />
      <BottomModal
        visible={showMenu}
        title="Subject Actions"
        onClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          className="flex-row items-center py-4 border-b border-gray-200 dark:border-[#2A2A2A]"
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16 }}
          onPress={handleUnassign}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={22} color="#EF4444" />
          <Text className="text-base font-semibold ml-3" style={{ color: '#EF4444', marginLeft: 12 }}>Unassign Subject</Text>
        </TouchableOpacity>
      </BottomModal>
    </>
  );
}
