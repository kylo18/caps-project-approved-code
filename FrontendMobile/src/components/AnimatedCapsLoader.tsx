import { useEffect, useRef } from 'react';
import { Animated, Easing, View, Text, StyleSheet } from 'react-native';

const LETTERS = ['C', 'A', 'P', 'S'];

type AnimatedCapsLoaderProps = {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  accentColor?: string;
  subtitle?: string;
};

const sizeMap = {
  sm: { fontSize: 24, spacing: 6, subtitleSize: 10 },
  md: { fontSize: 40, spacing: 10, subtitleSize: 12 },
  lg: { fontSize: 56, spacing: 14, subtitleSize: 14 },
};

export default function AnimatedCapsLoader({
  size = 'md',
  color = '#111827',
  accentColor = '#FE6902',
  subtitle,
}: AnimatedCapsLoaderProps) {
  const dims = sizeMap[size];
  const animValues = useRef(LETTERS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = LETTERS.map((_, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 120),
          Animated.timing(animValues[index], {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.timing(animValues[index], {
            toValue: 0,
            duration: 500,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      )
    );

    const overall = Animated.loop(
      Animated.sequence([
        Animated.delay(0),
        Animated.delay(120 * (LETTERS.length - 1)),
        Animated.delay(800),
      ])
    );

    Animated.parallel([...animations, overall]).start();

    return () => {
      animations.forEach((a) => a.stop());
      overall.stop();
    };
  }, [animValues]);

  return (
    <View style={styles.container}>
      <View style={styles.lettersRow}>
        {LETTERS.map((letter, index) => {
          const isAccent = letter === 'C' || letter === 'S';
          const letterColor = isAccent ? accentColor : color;

          return (
            <Animated.Text
              key={letter}
              style={[
                { fontSize: dims.fontSize, fontWeight: '900', color: letterColor, letterSpacing: -2 },
                {
                  transform: [
                    {
                      translateY: animValues[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -14],
                      }),
                    },
                    {
                      scale: animValues[index].interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [1, 1.15, 1],
                      }),
                    },
                  ],
                  opacity: animValues[index].interpolate({
                    inputRange: [0, 0.3, 1],
                    outputRange: [0.4, 1, 0.4],
                  }),
                },
              ]}
            >
              {letter}
            </Animated.Text>
          );
        })}
      </View>
      {subtitle && (
        <Text style={[styles.subtitle, { fontSize: dims.subtitleSize, color }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  lettersRow: { flexDirection: 'row', alignItems: 'center' },
  subtitle: { marginTop: 6, fontWeight: '500', letterSpacing: 1 },
});
