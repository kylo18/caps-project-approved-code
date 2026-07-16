import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getStudentColors, getStudentShadow } from '../../ui/StudentUI';
import type { MotivationQuote } from '../../insights/services/motivationQuoteService';

interface DailyMotivationModalProps {
  visible: boolean;
  quote: MotivationQuote | null;
  onDismiss: (suppressToday: boolean) => void;
}

export default function DailyMotivationModal({ visible, quote, onDismiss }: DailyMotivationModalProps) {
  const [suppressToday, setSuppressToday] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getStudentColors(isDark);
  const shadow = getStudentShadow(isDark);

  useEffect(() => {
    if (visible) {
      setSuppressToday(false);
      setShowSuccess(false);
    }
  }, [visible]);

  const handleDismiss = () => {
    setShowSuccess(true);
  };

  const handleSuccessDismiss = () => {
    onDismiss(suppressToday);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable
        className="flex-1 justify-center items-center p-6"
        style={{ backgroundColor: colors.overlay }}
        onPress={() => {}}
      >
        <View
          className="w-full max-w-[340px] rounded-[28px] px-6 py-6 border"
          style={{ backgroundColor: colors.card, borderColor: colors.border, ...shadow }}
        >
          {!showSuccess ? (
            <QuoteScreen quote={quote} suppressToday={suppressToday} setSuppressToday={setSuppressToday} onGo={handleDismiss} />
          ) : (
            <SuccessScreen onDone={handleSuccessDismiss} />
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quote Screen — orb + motivational quote + "Let's Go!" button
// ─────────────────────────────────────────────────────────────────────────────
function QuoteScreen({ quote, suppressToday, setSuppressToday, onGo }: {
  quote: MotivationQuote | null;
  suppressToday: boolean;
  setSuppressToday: (v: boolean) => void;
  onGo: () => void;
}) {
  const { theme } = useTheme();
  const colors = getStudentColors(theme === 'dark');

  return (
    <>
      <View className="self-center w-12 h-12 rounded-full items-center justify-center mb-4" style={{ backgroundColor: `${colors.orange}18` }}>
        <Ionicons name="sparkles" size={20} color={colors.orange} />
      </View>
      <Text className="text-center text-[18px] leading-6 mb-3 px-1 font-semibold" style={{ color: colors.text, fontFamily: 'Rubik' }} numberOfLines={5}>
        "{quote?.quote || 'Loading...'}"
      </Text>
      {quote?.author && quote.author !== 'Unknown' && (
        <Text className="text-center text-xs mb-5" style={{ color: colors.textSoft, fontFamily: 'Rubik' }}>
          {quote.author}
        </Text>
      )}

      <TouchableOpacity
        className="w-full items-center justify-center rounded-2xl"
        style={{
          minHeight: 48,
          backgroundColor: colors.orange,
          borderWidth: 1,
          borderColor: colors.orange,
        }}
        onPress={onGo}
        activeOpacity={0.86}
      >
        <Text style={{ color: '#FFFFFF', fontFamily: 'Rubik', fontSize: 15, fontWeight: '700' }}>
          Start Learning
        </Text>
      </TouchableOpacity>

      <Pressable
        className="flex-row items-center justify-center gap-2 mt-4"
        onPress={() => setSuppressToday(!suppressToday)}
        style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
      >
        <View
          className="w-5 h-5 rounded items-center justify-center"
          style={{
            backgroundColor: suppressToday ? colors.orange : 'transparent',
            borderWidth: 1.5,
            borderColor: suppressToday ? colors.orange : colors.textSoft,
          }}
        >
          {suppressToday && <Ionicons name="checkmark" size={12} color="#fff" />}
        </View>
        <Text className="text-[13px]" style={{ color: colors.textSoft, fontFamily: 'Rubik' }}>
          Don't show again today
        </Text>
      </Pressable>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Success Screen — "Good Luck!" with fade-in subtitle
// ─────────────────────────────────────────────────────────────────────────────

function SuccessScreen({ onDone }: { onDone: () => void }) {
  const { theme } = useTheme();
  const colors = getStudentColors(theme === 'dark');
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    const t1 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(subtitleOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(subtitleTranslateY, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    }, 400);
    const t2 = setTimeout(() => {
      Animated.timing(subtitleOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => onDone());
    }, 400 + 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <View className="items-center justify-center" style={{ minHeight: 260, width: '100%' }}>
      <View className="w-14 h-14 rounded-full items-center justify-center mb-4" style={{ backgroundColor: `${colors.orange}18` }}>
        <Ionicons name="checkmark-circle" size={28} color={colors.orange} />
      </View>
      <Text className="text-[32px] font-extrabold text-center mb-3" style={{ color: colors.text, fontFamily: 'Rubik' }}>
        You are ready
      </Text>

      <Animated.Text
        className="text-[16px] font-semibold text-center px-4"
        style={{
          color: colors.textSoft,
          fontFamily: 'Rubik',
          opacity: subtitleOpacity,
          transform: [{ translateY: subtitleTranslateY }],
        }}
      >
        Keep the pace steady and trust your practice.
      </Animated.Text>
    </View>
  );
}
