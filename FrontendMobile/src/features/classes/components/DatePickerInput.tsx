import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DatePickerInputProps {
  isDark: boolean;
  colors: any;
  label: string;
  value: string; // "YYYY-MM-DD" or empty
  onChange: (dateStr: string) => void;
  placeholder?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DatePickerInput({
  isDark,
  colors,
  label,
  value,
  onChange,
  placeholder = 'Select date'
}: DatePickerInputProps) {
  const [modalVisible, setModalVisible] = useState(false);

  // Parse current value or default to today
  const initialDate = value ? new Date(value) : new Date();
  const validInitialDate = Number.isNaN(initialDate.getTime()) ? new Date() : initialDate;

  const [currentMonth, setCurrentMonth] = useState(validInitialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(validInitialDate.getFullYear());

  // Format date for display: "YYYY-MM-DD" to "Month DD, YYYY"
  const getDisplayValue = () => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // Calendar calculations
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay(); // 0 = Sun, 6 = Sat
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    // Construct local YYYY-MM-DD string
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${currentYear}-${mm}-${dd}`;
    onChange(dateStr);
    setModalVisible(false);
  };

  const handleClear = () => {
    onChange('');
    setModalVisible(false);
  };

  // Generate calendar days
  const daysCount = getDaysInMonth(currentMonth, currentYear);
  const startDayIndex = getFirstDayOfMonth(currentMonth, currentYear);

  const calendarGrid = [];
  // Spacer elements for previous month overflow
  for (let i = 0; i < startDayIndex; i++) {
    calendarGrid.push(<View key={`empty-${i}`} style={styles.gridDayContainer} />);
  }
  // Days of the month
  for (let d = 1; d <= daysCount; d++) {
    // Format day to check if selected
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const dayDateStr = `${currentYear}-${mm}-${dd}`;
    const isSelected = value === dayDateStr;

    calendarGrid.push(
      <TouchableOpacity
        key={`day-${d}`}
        onPress={() => handleSelectDay(d)}
        style={[
          styles.gridDayContainer,
          isSelected ? { backgroundColor: colors.accent, borderRadius: 99 } : null
        ]}
      >
        <Text
          style={[
            styles.dayText,
            { color: isSelected ? '#FFFFFF' : colors.text }
          ]}
        >
          {d}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ marginTop: 10 }}>
      <Text className="mb-2 font-semibold" style={{ color: colors.text }}>{label}</Text>
      
      <View
        className="flex-row items-center border rounded-2xl px-4 py-3"
        style={{ backgroundColor: colors.input, borderColor: colors.border }}
      >
        <TouchableOpacity
          onPress={() => {
            // Reset modal calendar back to value (or today) when opening
            const d = value ? new Date(value) : new Date();
            const valid = Number.isNaN(d.getTime()) ? new Date() : d;
            setCurrentMonth(valid.getMonth());
            setCurrentYear(valid.getFullYear());
            setModalVisible(true);
          }}
          className="flex-1 flex-row items-center justify-between"
        >
          {value ? (
            <Text className="text-base font-medium" style={{ color: colors.text }}>
              {getDisplayValue()}
            </Text>
          ) : (
            <Text className="text-base" style={{ color: colors.mutedIcon }}>
              {placeholder}
            </Text>
          )}
          <Ionicons name="calendar-outline" size={20} color={colors.muted} />
        </TouchableOpacity>

        {value ? (
          <TouchableOpacity
            onPress={() => onChange('')}
            className="pl-3 py-1 ml-1"
          >
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            
            {/* Header: Month and Year Navigation */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={handlePrevMonth} className="p-2">
                <Ionicons name="chevron-back" size={22} color={colors.text} />
              </TouchableOpacity>
              
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {MONTH_NAMES[currentMonth]} {currentYear}
              </Text>
              
              <TouchableOpacity onPress={handleNextMonth} className="p-2">
                <Ionicons name="chevron-forward" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Weekdays row */}
            <View style={styles.weekdaysRow}>
              {WEEKDAYS.map((day) => (
                <View key={day} style={styles.gridDayContainer}>
                  <Text style={[styles.weekdayText, { color: colors.muted }]}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Grid days */}
            <View style={styles.gridContainer}>
              {calendarGrid}
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              {value ? (
                <TouchableOpacity
                  onPress={handleClear}
                  className="px-4 py-2.5 rounded-xl border mr-2"
                  style={{ borderColor: '#EF4444' }}
                >
                  <Text className="font-semibold text-red-600">Clear Date</Text>
                </TouchableOpacity>
              ) : null}
              
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="px-4 py-2.5 rounded-xl flex-1 bg-primary items-center"
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center'
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 18
  },
  gridDayContainer: {
    width: '14.28%', // 100 / 7 columns
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500'
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 10
  }
});
