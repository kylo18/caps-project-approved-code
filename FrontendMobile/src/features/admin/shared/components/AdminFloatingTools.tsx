import { useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type AdminToolAction = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  backgroundColor?: string;
};

type AdminFloatingToolsProps = {
  actions: AdminToolAction[];
  bottom?: number;
  right?: number;
  visible?: boolean;
};

const ORANGE = '#FE6902';
const ORANGE_DARK = '#E55D00';
const ORANGE_SOFT = '#FFF0E0';
const WHITE = '#FFFFFF';
const PANEL_BG = 'rgba(255,255,255,0.98)';
const PANEL_BORDER = 'rgba(254,105,2,0.18)';

const FLOAT_SHADOW = {
  shadowColor: ORANGE,
  shadowOpacity: 0.38,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 12 },
  elevation: 16,
};

const PANEL_SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.16,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 10,
};

export default function AdminFloatingTools({
  actions,
  bottom = 110,
  right = 16,
  visible = true,
}: AdminFloatingToolsProps) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const animation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const visibleActions = useMemo(() => actions.filter(Boolean), [actions]);

  // Panel open/close animation
  useEffect(() => {
    Animated.timing(animation, {
      toValue: open ? 1 : 0,
      duration: open ? 220 : 180,
      easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [animation, open]);

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
  const panelBottom = fabBottom + 96;
  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.14],
  });
  const panelOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const panelTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });
  const panelScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  return (
    <>
      {open ? (
        <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pressable
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Close admin tools"
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <Animated.View
              pointerEvents="none"
              style={{
                flex: 1,
                backgroundColor: '#111827',
                opacity: backdropOpacity,
              }}
            />
          </Pressable>
        </View>
      ) : null}

      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={{
          position: 'absolute',
          right,
          bottom: panelBottom,
          width: 300,
          opacity: panelOpacity,
          transform: [{ translateY: panelTranslateY }, { scale: panelScale }],
        }}
      >
        <View
          style={{
            borderRadius: 28,
            backgroundColor: PANEL_BG,
            borderWidth: 1,
            borderColor: PANEL_BORDER,
            paddingVertical: 10,
            paddingHorizontal: 10,
            ...PANEL_SHADOW,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 8,
              paddingBottom: 8,
              marginBottom: 4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: ORANGE_SOFT,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Ionicons name="flash-outline" size={16} color={ORANGE} />
              </View>
              <View>
                <Text
                  style={{
                    color: '#111827',
                    fontSize: 14,
                    fontWeight: '700',
                    fontFamily: 'Rubik',
                  }}
                >
                  Quick Actions
                </Text>
                <Text
                  style={{
                    color: '#6B7280',
                    fontSize: 11,
                    fontWeight: '500',
                    fontFamily: 'Rubik',
                  }}
                >
                  Jump to key admin tools
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => setOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Close admin quick actions"
              style={({ pressed }) => ({
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              })}
            >
              <Ionicons name="close" size={18} color="#6B7280" />
            </Pressable>
          </View>

          {/* 2-column grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {visibleActions.map((action) => {
              const isDisabled = !!action.disabled;
              return (
                <Pressable
                  key={action.key}
                  onPress={() => handleActionPress(action)}
                  disabled={isDisabled}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                  accessibilityHint={`Open ${action.label}`}
                  accessibilityState={{ disabled: isDisabled, expanded: open }}
                  style={({ pressed }) => ({
                    width: '48%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 18,
                    paddingVertical: 14,
                    paddingHorizontal: 6,
                    backgroundColor: '#FFFFFF',
                    opacity: isDisabled ? 0.45 : pressed ? 0.86 : 1,
                    transform: [{ scale: pressed ? 0.985 : 1 }],
                  })}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: action.backgroundColor || ORANGE,
                      marginBottom: 8,
                    }}
                  >
                    <Ionicons name={action.icon} size={20} color={WHITE} />
                  </View>
                  <Text
                    style={{
                      color: '#111827',
                      fontSize: 12,
                      fontWeight: '700',
                      fontFamily: 'Rubik',
                      textAlign: 'center',
                    }}
                    numberOfLines={1}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Animated.View>

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
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 32,
            backgroundColor: open ? ORANGE_DARK : ORANGE,
            ...FLOAT_SHADOW,
            width: 84,
            height: 96,
          }}
        >
          <Pressable
            onPress={() => setOpen((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={open ? 'Close admin tools' : 'Open admin tools'}
            accessibilityHint="Shows quick actions for the current admin screen"
            accessibilityState={{ expanded: open }}
            style={({ pressed }) => ({
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 10,
              paddingVertical: 18,
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.96 : 1 }],
              width: 84,
              height: 96,
            })}
          >
            <Text
              style={{
                color: WHITE,
                fontSize: 15,
                fontWeight: '800',
                fontFamily: 'Rubik',
                letterSpacing: 0.2,
                textAlign: 'center',
                lineHeight: 18,
              }}
            >
              {open ? 'Close\nTools' : 'Admin\nTools'}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </>
  );
}
