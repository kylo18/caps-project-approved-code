import { useEffect, useRef } from 'react';
import { Animated, Easing, View, Text } from 'react-native';

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
  const masterValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(masterValue, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear, // Linear ensures the wave interpolation flows smoothly
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => animation.stop();
  }, [masterValue]);

  return (
    <View className="items-center">
      <View className="flex-row items-center">
        {LETTERS.map((letter, index) => {
          const isAccent = letter === 'C' || letter === 'S';
          const letterColor = isAccent ? accentColor : color;

          // We create a wave that spans 0.36 of the total duration for each letter
          const start = index * 0.12;
          const peak = start + 0.12;
          const end = peak + 0.12;

          // If start is 0, we must drop the leading 0 from the input array to avoid duplicate keys in the range
          const inputRange = start === 0 ? [0, peak, end, 1] : [0, start, peak, end, 1];

          return (
            <Animated.Text
              key={letter}
              style={[
                { fontSize: dims.fontSize, fontWeight: '900', color: letterColor, letterSpacing: -2 },
                {
                  transform: [
                    {
                      translateY: masterValue.interpolate({
                        inputRange,
                        outputRange: start === 0 ? [0, -12, 0, 0] : [0, 0, -12, 0, 0],
                      }),
                    },
                    {
                      scale: masterValue.interpolate({
                        inputRange,
                        outputRange: start === 0 ? [1, 1.15, 1, 1] : [1, 1, 1.15, 1, 1],
                      }),
                    },
                  ],
                  opacity: masterValue.interpolate({
                    inputRange,
                    outputRange: start === 0 ? [0.4, 1, 0.4, 0.4] : [0.4, 0.4, 1, 0.4, 0.4],
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
        <Text className="mt-1.5 font-medium tracking-widest" style={{ fontSize: dims.subtitleSize, color }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}