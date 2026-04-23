import { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface SkeletonProps {
    variant?: 'text' | 'card' | 'avatar' | 'button';
    className?: string;
    style?: object;
}

export function Skeleton({ variant = 'text', className = '', style }: SkeletonProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.4,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [opacity]);

    return (
        <Animated.View
            className={className}
            style={[
                variant === 'text' ? 'h-4 w-full rounded' :
                variant === 'card' ? 'h-30 w-full rounded-2xl' :
                variant === 'avatar' ? 'h-10 w-10 rounded-full' :
                'h-9 w-20 rounded-lg',
                { backgroundColor: isDark ? '#374151' : '#E5E7EB', opacity },
                style,
            ]}
        />
    );
}

export function SkeletonCard() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <View className={`rounded-2xl p-4 mb-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                    <Skeleton variant="avatar" />
                    <Skeleton variant="button" style={{ width: 64 }} />
                </View>
                <Skeleton variant="text" style={{ width: 60, height: 14 }} />
            </View>
            <View className="mb-3">
                <Skeleton variant="text" className="mb-2" />
                <Skeleton variant="text" style={{ width: '75%' }} />
            </View>
            <View className="flex-row items-center gap-2 mb-3">
                <Skeleton variant="button" style={{ width: 64 }} />
                <Skeleton variant="button" style={{ width: 80 }} />
            </View>
            <View className="flex-row justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                <View className="flex-row items-center gap-2">
                    <Skeleton variant="avatar" style={{ height: 24, width: 24, borderRadius: 12 }} />
                    <Skeleton variant="text" style={{ width: 80, height: 12 }} />
                </View>
                <View className="flex-row items-center gap-2">
                    <Skeleton variant="button" style={{ height: 32, width: 32, borderRadius: 8 }} />
                    <Skeleton variant="button" style={{ height: 32, width: 32, borderRadius: 8 }} />
                </View>
            </View>
        </View>
    );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
    return (
        <View>
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonCard key={index} />
            ))}
        </View>
    );
}

export function SkeletonStatsGrid() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <View className="flex-row flex-wrap gap-3">
            <View className={`flex-1 min-w-36 rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <Skeleton variant="text" style={{ width: 64, marginBottom: 12 }} />
                <Skeleton variant="text" style={{ width: 80, height: 32, marginBottom: 8 }} />
                <Skeleton variant="text" style={{ width: 96 }} />
            </View>
            <View className={`flex-1 min-w-36 rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <Skeleton variant="text" style={{ width: 64, marginBottom: 12 }} />
                <Skeleton variant="text" style={{ width: 80, height: 32, marginBottom: 8 }} />
                <Skeleton variant="text" style={{ width: 96 }} />
            </View>
        </View>
    );
}

export default Skeleton;
