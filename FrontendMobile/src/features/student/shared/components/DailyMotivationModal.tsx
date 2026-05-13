import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { studentColors } from '../../ui/StudentUI';
import type { MotivationQuote } from '../services/motivationQuoteService';

interface DailyMotivationModalProps {
  visible: boolean;
  quote: MotivationQuote | null;
  onDismiss: (suppressToday: boolean) => void;
}

export default function DailyMotivationModal({ visible, quote, onDismiss }: DailyMotivationModalProps) {
  const [suppressToday, setSuppressToday] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        onPress={() => {}}
      >
        {!showSuccess ? (
          <View className="w-full max-w-[340px] rounded-2xl px-6 py-5" style={{ backgroundColor: '#ffffff' }}>
            <QuoteScreen quote={quote} suppressToday={suppressToday} setSuppressToday={setSuppressToday} onGo={handleDismiss} />
          </View>
        ) : (
          <SuccessScreen onDone={handleSuccessDismiss} />
        )}
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
  return (
    <>
      <Text className="text-center text-[15px] leading-5 mb-3 px-2" style={{ color: studentColors.text, fontFamily: 'Rubik' }} numberOfLines={4}>
        "{quote?.quote || 'Loading...'}"
      </Text>
      {quote?.author && quote.author !== 'Unknown' && (
        <Text className="text-center text-xs mb-5" style={{ color: studentColors.textSoft, fontFamily: 'Rubik', fontStyle: 'italic' }}>
          — {quote.author}
        </Text>
      )}

      <Pressable
        className="w-full items-center rounded-full py-3.5"
        style={{ backgroundColor: studentColors.orange }}
        onPress={onGo}
        activeOpacity={0.8}
      >
        <Text className="text-white font-bold text-[15px]" style={{ fontFamily: 'Rubik' }}>
          Let's Go! 🚀
        </Text>
      </Pressable>

      <Pressable className="flex-row items-center justify-center gap-2 mt-4" onPress={() => setSuppressToday(!suppressToday)} activeOpacity={0.7}>
        <View
          className="w-5 h-5 rounded items-center justify-center"
          style={{
            backgroundColor: suppressToday ? studentColors.orange : 'transparent',
            borderWidth: 1.5,
            borderColor: suppressToday ? studentColors.orange : studentColors.textSoft,
          }}
        >
          {suppressToday && <Ionicons name="checkmark" size={12} color="#fff" />}
        </View>
        <Text className="text-[13px]" style={{ color: studentColors.textSoft, fontFamily: 'Rubik' }}>
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
      <Text className="text-[38px] font-extrabold text-center mb-3" style={{ color: studentColors.orange, fontFamily: 'Rubik' }}>
        Good Luck! 🍀
      </Text>

      <Animated.Text
        className="text-[16px] font-semibold text-center px-4"
        style={{
          color: studentColors.orange,
          fontFamily: 'Rubik',
          opacity: subtitleOpacity,
          transform: [{ translateY: subtitleTranslateY }],
        }}
      >
        You've got this! Now go ace that exam!
      </Animated.Text>
    </View>
  );
}