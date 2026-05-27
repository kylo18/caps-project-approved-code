import { useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Easing, Pressable, Text, View, Modal, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getRoleShadow, getRoleThemeColors } from '../../../../features/core/styles/roleTheme';
import { BlurView } from 'expo-blur';

export type AdminToolAction = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  backgroundColor?: string;
  group?: 'content' | 'manage';
};

type AdminFloatingToolsProps = {
  actions: AdminToolAction[];
  bottom?: number;
  right?: number;
  visible?: boolean;
};

const ORANGE = '#FE6902';
const WHITE = '#FFFFFF';

const FLOAT_SHADOW = {
  shadowColor: ORANGE,
  shadowOpacity: 0.38,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 8,
};

const contentKeys = ['add-subject', 'add-question', 'create-quiz', 'quiz', 'assign-subject'];
const manageKeys = ['configure-subject', 'print-export', 'insights', 'reports', 'classes', 'profile'];

const getActionColors = (key: string, customColor?: string) => {
  if (key === 'create-quiz' || key === 'quiz') {
    return { solid: '#8B5CF6', tint: 'rgba(139, 92, 246, 0.08)' };
  }
  if (key === 'add-question' || key === 'print-export') {
    return { solid: '#10B981', tint: 'rgba(16, 185, 129, 0.08)' };
  }
  if (key === 'add-subject' || key === 'assign-subject' || key === 'configure-subject') {
    return { solid: '#FE6902', tint: 'rgba(254, 105, 2, 0.08)' };
  }
  if (key === 'classes') {
    return { solid: '#3B82F6', tint: 'rgba(59, 130, 246, 0.08)' };
  }
  if (customColor) {
    return { solid: customColor, tint: `${customColor}24` };
  }
  return { solid: '#6B7280', tint: 'rgba(107, 114, 128, 0.08)' };
};

const getActionLabel = (key: string, originalLabel: string) => {
  if (key === 'configure-subject') return 'Configure';
  return originalLabel;
};

const chunkArray = <T,>(array: T[], size: number): T[][] => {
  const chunked: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size));
  }
  return chunked;
};

export default function AdminFloatingTools({
  actions,
  bottom = 110,
  right = 16,
  visible = true,
}: AdminFloatingToolsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getRoleThemeColors(isDark);
  const panelShadow = getRoleShadow(isDark);
  const [open, setOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const animation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const visibleActions = useMemo(() => actions.filter(Boolean), [actions]);

  const contentActions = useMemo(() => {
    return visibleActions.filter(action =>
      contentKeys.includes(action.key) || action.group === 'content'
    );
  }, [visibleActions]);

  const manageActions = useMemo(() => {
    return visibleActions.filter(action =>
      manageKeys.includes(action.key) || action.group === 'manage' ||
      (!contentKeys.includes(action.key) && action.group !== 'content')
    );
  }, [visibleActions]);

  // Entrance and Exit animation logic
  useEffect(() => {
    if (open) {
      setModalVisible(true);
      Animated.timing(animation, {
        toValue: 1,
        duration: 220,
        usingNativeDriver: true,
      } as any).start(); // useNativeDriver: true is handled in animated timing options
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 180,
        usingNativeDriver: true,
      } as any).start(() => {
        setModalVisible(false);
      });
    }
  }, [open, animation]);

  // Idle pulse animation (gentle breathing effect when not open)
  useEffect(() => {
    if (open) {
      pulseAnim.setValue(1);
      return;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [open, pulseAnim]);

  useEffect(() => {
    if (!visible || visibleActions.length === 0) {
      setOpen(false);
    }
  }, [visible, visibleActions.length]);

  if (!visible || visibleActions.length === 0) return null;

  const handleActionPress = (action: AdminToolAction) => {
    if (action.disabled) return;
    setOpen(false);
    action.onPress();
  };

  const fabBottom = bottom + insets.bottom;

  // Bottom sheet transitions
  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const panelTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [500, 0],
  });

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const renderActionItem = (action: AdminToolAction, listLength: number) => {
    const isDisabled = !!action.disabled;
    const { solid, tint } = getActionColors(action.key, action.backgroundColor);
    const label = getActionLabel(action.key, action.label);

    return (
      <Pressable
        key={action.key}
        onPress={() => handleActionPress(action)}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={action.label}
        style={({ pressed }) => ({
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 22,
          paddingVertical: 18,
          paddingHorizontal: 6,
          backgroundColor: isDark ? colors.surfaceSoft : WHITE,
          borderWidth: 1,
          borderColor: colors.border,
          opacity: isDisabled ? 0.45 : pressed ? 0.86 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: tint,
            marginBottom: 10,
          }}
        >
          <Ionicons name={action.icon} size={28} color={solid} />
        </View>
        <Text
          style={{
            color: colors.text,
            fontSize: 14,
            fontWeight: 'bold',
            fontFamily: 'Rubik',
            textAlign: 'center',
          }}
          numberOfLines={2}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <>
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={() => setOpen(false)}
      >
        {/* Backdrop overlay */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setOpen(false)}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: backdropOpacity,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
              },
            ]}
          >
            <BlurView
              intensity={20}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </Pressable>

        {/* Sliding Bottom Sheet */}
        <View
          pointerEvents="box-none"
          style={{
            flex: 1,
            justifyContent: 'flex-end',
          }}
        >
          <Animated.View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 36,
              borderTopRightRadius: 36,
              borderWidth: 1,
              borderBottomWidth: 0,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom + 16, 24),
              transform: [{ translateY: panelTranslateY }],
              ...panelShadow,
            }}
          >
            {/* Drag Handle */}
            <View
              style={{
                width: 38,
                height: 4,
                borderRadius: 2,
                backgroundColor: isDark ? '#404040' : '#E5E7EB',
                alignSelf: 'center',
                marginTop: 10,
                marginBottom: 16,
              }}
            />

            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 24,
                paddingBottom: 20,
              }}
            >
              <View>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 22,
                    fontWeight: 'bold',
                    fontFamily: 'Rubik',
                  }}
                >
                  Quick Actions
                </Text>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 13,
                    fontWeight: '500',
                    fontFamily: 'Rubik',
                    marginTop: 2,
                  }}
                >
                  Jump to key admin tools
                </Text>
              </View>
              <Pressable
                onPress={() => setOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close actions sheet"
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: isDark ? '#2E2E2E' : '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Ionicons name="close" size={24} color={isDark ? '#D1D5DB' : '#4B5563'} />
              </Pressable>
            </View>

            {/* Grouped Actions List */}
            <ScrollView
              style={{ maxHeight: 400 }}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 10 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Content Section */}
              {contentActions.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: 'bold',
                      color: colors.muted,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      marginBottom: 12,
                      fontFamily: 'Rubik',
                    }}
                  >
                    Content
                  </Text>
                  {chunkArray(contentActions, 3).map((row, rowIndex) => (
                    <View key={`content-row-${rowIndex}`} style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                      {row.map(action => renderActionItem(action, 3))}
                      {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, dummyIndex) => (
                        <View key={`content-dummy-${dummyIndex}`} style={{ flex: 1 }} />
                      ))}
                    </View>
                  ))}
                </View>
              )}

              {/* Manage Section */}
              {manageActions.length > 0 && (
                <View style={{ marginBottom: 10 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: 'bold',
                      color: colors.muted,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      marginBottom: 12,
                      fontFamily: 'Rubik',
                    }}
                  >
                    Manage
                  </Text>
                  {chunkArray(manageActions, 2).map((row, rowIndex) => (
                    <View key={`manage-row-${rowIndex}`} style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                      {row.map(action => renderActionItem(action, 2))}
                      {row.length < 2 && Array.from({ length: 2 - row.length }).map((_, dummyIndex) => (
                        <View key={`manage-dummy-${dummyIndex}`} style={{ flex: 1 }} />
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Dismiss Hint */}
            <Text
              style={{
                textAlign: 'center',
                color: isDark ? '#6B7280' : '#9CA3AF',
                fontSize: 12,
                fontWeight: '500',
                fontFamily: 'Rubik',
                marginTop: 10,
                marginBottom: 6,
              }}
            >
              Swipe down or tap outside to dismiss
            </Text>
          </Animated.View>
        </View>
      </Modal>

      {/* Rounded Squircle Floating Action Button (FAB) */}
      <Animated.View
        style={{
          position: 'absolute',
          right,
          bottom: fabBottom,
          transform: [{ scale: pulseAnim }],
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 22,
            backgroundColor: '#FE6902',
            alignItems: 'center',
            justifyContent: 'center',
            ...FLOAT_SHADOW,
          }}
        >
          <Pressable
            onPress={() => setOpen((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={open ? 'Close quick actions' : 'Open quick actions'}
            style={({ pressed }) => ({
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FE6902',
              opacity: pressed ? 0.85 : 1,
              borderRadius: 22,
            })}
          >
            <Animated.View style={{ transform: [{ rotate: rotation }] }}>
              <Ionicons name="flash" size={32} color={WHITE} />
            </Animated.View>
          </Pressable>
        </View>
      </Animated.View>
    </>
  );
}
